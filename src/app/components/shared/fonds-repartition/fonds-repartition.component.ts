import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ConfigService, TauxRates } from '../../../services/config.service';
import { ListeChoixOptions } from '../../../lib/ListeChoixOptions';
import { convertirPrixCad, estDeviseConvertible } from '../../../lib/ConversionDevise';

/**
 * Répartition d'une demande entre plusieurs fonds budgétaires (fonds partagés) —
 * Nouvel achat unique, Nouvel abonnement, Modification et CCOL uniquement.
 * Chaque ligne est indépendante (sa propre devise/prix/prix CAD/fonds/pourcentage) ;
 * le montant total payé = la somme des prix CAD de toutes les lignes. Le pourcentage
 * n'est qu'une information de répartition budgétaire (non recalculée depuis les prix)
 * et son total n'affiche qu'un avertissement non bloquant s'il diffère de 100 %.
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

  devises = new ListeChoixOptions().devisesOptions;
  tauxRates: TauxRates = { CAD: 1, USD: 1.368 };

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    this.configService.getTauxRates().subscribe(rates => {
      this.tauxRates = rates;
      this.lignes.forEach(l => this.convertirPrix(l));
    });
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
    return this.lignes.reduce((somme, l) => somme + (Number(l.get('pourcentage')?.value) || 0), 0);
  }

  get sommeIncorrecte(): boolean {
    return this.partage && Math.round(this.sommePourcentage * 100) / 100 !== 100;
  }

  /** Montant total réellement payé — toujours la somme des prix CAD de chaque ligne
   *  (vaut simplement le prix de l'unique ligne quand il n'y a pas de partage). */
  get sommePrixCad(): number {
    return this.lignes.reduce((somme, l) => somme + (Number(l.get('prix_cad')?.value) || 0), 0);
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

  private updateDeviseAutreValidator(ligne: FormGroup): void {
    const ctrl = ligne.get('devise_autre_precision');
    if (!ctrl) return;
    if (ligne.get('devise_originale')?.value === 'Autre') {
      ctrl.setValidators([Validators.required, Validators.maxLength(100)]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  onDeviseChange(ligne: FormGroup): void {
    ligne.get('prix_cad')?.setValue(null, { emitEvent: false });
    this.updateDeviseAutreValidator(ligne);
    this.convertirPrix(ligne);
  }

  onPrixChange(ligne: FormGroup): void {
    this.convertirPrix(ligne);
  }

  ajouter(): void {
    if (this.lignes.length === 1) {
      this.fondsArray.at(0).get('pourcentage')?.setValue(null);
    }
    this.fondsArray.push(FondsRepartitionComponent.creerLigne({ pourcentage: null }));
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
        Validators.required, Validators.min(0.01), Validators.max(100)
      ]),
    });
  }
}
