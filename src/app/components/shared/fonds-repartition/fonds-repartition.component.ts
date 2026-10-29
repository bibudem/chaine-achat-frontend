import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ConfigService, TauxRates } from '../../../services/config.service';
import { ListeChoixOptions } from '../../../lib/ListeChoixOptions';
import { convertirPrixCad, estDeviseConvertible } from '../../../lib/ConversionDevise';

/**
 * Répartition d'une demande entre plusieurs fonds budgétaires (fonds partagés) —
 * Nouvel achat unique, Nouvel abonnement, Modification et CCOL uniquement.
 * Chaque ligne est indépendante (sa propre devise/prix/prix CAD/fonds/pourcentage) ;
 * le montant total payé = la somme des prix CAD de toutes les lignes. Dès qu'il y a
 * plusieurs fonds, le pourcentage de chaque ligne est saisi à la main, en nombre entier
 * (ex. 30 / 70) : la dernière ligne (ou l'avant-dernière) prend le complément à 100 (voir
 * onPourcentageSaisi) ; le total ne peut pas dépasser 100 % (validateur totalMax100).
 * Avec une seule ligne (cas normal), le composant s'insère dans la même rangée
 * Bootstrap que le reste d'"Informations financières" (voir :host display:contents
 * dans le CSS) ; dès qu'un 2e fonds est ajouté, chaque ligne devient une rangée
 * complète (Devise/Prix/Prix CAD/Fonds budgétaire/Pourcentage).
 */
@Component({
  selector: 'app-fonds-repartition',
  templateUrl: './fonds-repartition.component.html',
  styleUrls: ['./fonds-repartition.component.css']
})
export class FondsRepartitionComponent implements OnInit {
  @Input() fondsArray!: FormArray;
  @Input() submitted = false;
  /** Quand false (brouillon), aucune ligne de répartition n'est obligatoire — voir
   *  la validation conditionnelle selon Statut de la demande dans le formulaire parent.
   *  Les formulaires parents réappliquent eux-mêmes `appliquerValidation()` après tout
   *  reconstruction du FormArray (chargement d'une demande, réinitialisation) : cet
   *  @Input ne sert qu'à la ligne ajoutée localement par `ajouter()`. */
  @Input() exigeTousLesChamps = true;

  devises = new ListeChoixOptions().devisesOptions;
  tauxRates: TauxRates = { CAD: 1, USD: 1.368 };

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    // Le parent vide/remplit toujours ce même FormArray (chargement, réinitialisation) :
    // le validateur ajouté ici reste en place.
    if (!this.fondsArray.hasValidator(FondsRepartitionComponent.totalMax100)) {
      this.fondsArray.addValidators(FondsRepartitionComponent.totalMax100);
      this.fondsArray.updateValueAndValidity();
    }
    this.configService.getTauxRates().subscribe(rates => {
      this.tauxRates = rates;
      this.lignes.forEach(l => this.convertirPrix(l));
    });
  }

  /** Somme d'un champ numérique sur toutes les lignes, arrondie au centième. */
  private static somme(lignes: AbstractControl[], champ: string): number {
    const total = lignes.reduce((s, l) => s + (Number(l.get(champ)?.value) || 0), 0);
    return Math.round(total * 100) / 100;
  }

  /** Total des pourcentages > 100 % (avec 2 fonds ou plus) : erreur bloquante. */
  static totalMax100(control: AbstractControl): ValidationErrors | null {
    const lignes = (control as FormArray).controls;
    return lignes.length > 1 && FondsRepartitionComponent.somme(lignes, 'pourcentage') > 100
      ? { totalPourcentageDepasse: true } : null;
  }

  private appliquerValidationLigne(ligne: FormGroup): void {
    FondsRepartitionComponent.appliquerValidation(ligne, this.exigeTousLesChamps);
  }

  /** Source unique de la logique de validation conditionnelle d'une ligne — appelée par
   *  l'instance (ajout d'une ligne) et directement par les formulaires parents après
   *  toute reconstruction du FormArray (chargement d'une demande, réinitialisation),
   *  puisque ces reconstructions ne passent pas par cette instance de composant. */
  static appliquerValidation(ligne: FormGroup, exige: boolean): void {
    const champs: { nom: string; validators: any[] }[] = [
      { nom: 'devise_originale',      validators: [] },
      { nom: 'prix_devise_originale', validators: [Validators.min(0.01)] },
      { nom: 'prix_cad',              validators: [Validators.min(0.01)] },
      { nom: 'fonds_budgetaire',      validators: [Validators.maxLength(200), Validators.pattern('^[A-Za-z]{2,4}-\\d{2,}$')] },
      { nom: 'pourcentage',           validators: FondsRepartitionComponent.validateursPourcentage },
    ];
    champs.forEach(({ nom, validators }) => {
      const ctrl = ligne.get(nom);
      if (!ctrl) return;
      ctrl.setValidators(exige ? [Validators.required, ...validators] : validators);
      ctrl.updateValueAndValidity({ emitEvent: false });
    });
    const autre = ligne.get('devise_autre_precision');
    if (autre) {
      if (ligne.get('devise_originale')?.value === 'Autre') {
        autre.setValidators(exige ? [Validators.required, Validators.maxLength(100)] : [Validators.maxLength(100)]);
      } else {
        autre.clearValidators();
      }
      autre.updateValueAndValidity({ emitEvent: false });
    }
  }

  get lignes(): FormGroup[] {
    return this.fondsArray.controls as FormGroup[];
  }

  /** La répartition n'est affichée/active qu'à partir de 2 fonds — avec une seule ligne,
   *  le pourcentage (toujours 100) n'apporte rien à l'usager. */
  get partage(): boolean {
    return this.lignes.length > 1;
  }

  get sommePourcentage(): number {
    return FondsRepartitionComponent.somme(this.lignes, 'pourcentage');
  }

  get sommeIncorrecte(): boolean {
    return this.partage && this.sommePourcentage !== 100;
  }

  /** Total > 100 % : même règle que le validateur bloquant (totalMax100). */
  get sommeDepasse(): boolean {
    return this.fondsArray.hasError('totalPourcentageDepasse');
  }

  /** Pourcentage : nombre entier de 1 à 100. */
  static readonly validateursPourcentage = [Validators.min(1), Validators.max(100), Validators.pattern(/^\d+$/)];

  /** Saisie d'un pourcentage : une ligne « tampon » prend le complément pour que le total
   *  fasse 100 — la dernière ligne, ou l'avant-dernière si c'est la dernière qu'on saisit
   *  (2 fonds : 30 → 70 ; 3 fonds : 86 / 14 puis 1 sur la 3e → 86 / 13 / 1). Si les autres
   *  lignes dépassent déjà 100, le tampon tombe à 0 et le total reste bloqué (totalMax100). */
  onPourcentageSaisi(index: number): void {
    if (!this.partage) return;
    const valeur = this.lignes[index].get('pourcentage')?.value;
    if (valeur === null || valeur === '' || isNaN(Number(valeur))) return;
    const derniere = this.lignes.length - 1;
    const tampon   = index === derniere ? derniere - 1 : derniere;
    const autres   = this.lignes.reduce((s, l, i) =>
      i === tampon ? s : s + (Math.round(Number(l.get('pourcentage')?.value)) || 0), 0);
    this.lignes[tampon].get('pourcentage')?.setValue(Math.min(100, Math.max(0, 100 - autres)));
  }

  /** Montant total réellement payé — toujours la somme des prix CAD de chaque ligne
   *  (vaut simplement le prix de l'unique ligne quand il n'y a pas de partage). */
  get sommePrixCad(): number {
    return FondsRepartitionComponent.somme(this.lignes, 'prix_cad');
  }

  deviseConvertible(ligne: FormGroup): boolean {
    return estDeviseConvertible(ligne.get('devise_originale')?.value, this.tauxRates);
  }

  private convertirPrix(ligne: FormGroup): void {
    const prix   = ligne.get('prix_devise_originale')?.value;
    const devise = ligne.get('devise_originale')?.value;
    const result = convertirPrixCad(prix, devise, this.tauxRates);
    if (result != null) ligne.get('prix_cad')?.setValue(result, { emitEvent: false });
  }

  onDeviseChange(ligne: FormGroup): void {
    ligne.get('prix_cad')?.setValue(null, { emitEvent: false });
    this.appliquerValidationLigne(ligne);
    this.convertirPrix(ligne);
  }

  onPrixChange(ligne: FormGroup): void {
    this.convertirPrix(ligne);
  }

  ajouter(): void {
    const ligne = FondsRepartitionComponent.creerLigne({ pourcentage: null });
    this.fondsArray.push(ligne);
    this.appliquerValidationLigne(ligne);
  }

  retirer(i: number): void {
    if (this.fondsArray.length <= 1) return;
    this.fondsArray.removeAt(i);
    // Retour à un seul fonds : la répartition n'a plus lieu d'être, 100 % implicite.
    if (this.fondsArray.length === 1) {
      this.fondsArray.at(0).get('pourcentage')?.setValue(100);
    }
  }

  isInvalid(ligne: FormGroup, champ: string): boolean {
    const c = ligne.get(champ);
    return !!c && c.invalid && (c.dirty || c.touched || this.submitted);
  }

  static creerLigne(data: {
    devise_originale?: string;
    devise_autre_precision?: string;
    prix_devise_originale?: number | null;
    prix_cad?: number | null;
    fonds_budgetaire?: string;
    pourcentage?: number | null;
  } = {}): FormGroup {
    const devise = data.devise_originale ?? '';
    return new FormGroup({
      devise_originale:       new FormControl(devise, Validators.required),
      devise_autre_precision: new FormControl(
        data.devise_autre_precision ?? '',
        devise === 'Autre' ? [Validators.required, Validators.maxLength(100)] : []
      ),
      prix_devise_originale:  new FormControl(data.prix_devise_originale ?? null, [Validators.required, Validators.min(0.01)]),
      prix_cad:               new FormControl(data.prix_cad ?? null, [Validators.required, Validators.min(0.01)]),
      fonds_budgetaire:       new FormControl(data.fonds_budgetaire ?? '', [
        Validators.required, Validators.maxLength(200), Validators.pattern('^[A-Za-z]{2,4}-\\d{2,}$')
      ]),
      pourcentage: new FormControl(data.pourcentage === undefined ? 100 : data.pourcentage, [
        Validators.required, ...FondsRepartitionComponent.validateursPourcentage
      ]),
    });
  }
}
