import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReponsesService } from '../../../../services/reponses.service';

@Component({
  selector:    'app-nouvel-abonnement',
  templateUrl: './nouvel-abonnement.component.html',
  styleUrls:   ['./nouvel-abonnement.component.css']
})
export class NouvelAbonnementComponent implements OnInit {
  form!: FormGroup;
  submitted              = false;
  success                = false;
  error                  = false;
  isLoading              = false;
  showElectronique       = false;
  showImprime            = true;
  showMixte              = false;
  showMonographie        = false;

  bibliotheques: string[] = [
    'Aménagement', 'Campus Laval', 'Direction générale', 'Droit',
    'Du Parc', 'Hubert-Reeves', 'Kinésiologie', 'L.S.H.',
    'Livres rares', 'Mathématiques-Informatique', 'Médecine vétérinaire',
    'Musique', "Marguerite-d'Youville", 'Prêt entre bibliothèques',
    'Santé', 'Service Accessibilité', 'Service du catalogage', 'TGD', 'TEST-DRIN'
  ];

  categoriesDocument: string[] = [
    'Monographie', 'Périodique', 'Base de données',
    'Archives de périodiques', 'Archives de monographies'
  ];

  typesMonographie: string[] = [
    'Livre', 'Enregistrement sonore', 'Film', 'Matériel didactique',
    'Partition de musique', 'Zine', 'Carte et données géospatiales',
    'Autres (microfilm, etc.)', "Ne s'applique pas", 'Série'
  ];

  priorites: string[] = ['Régulier', 'Prioritaire', 'Urgent'];
  devises: { label: string; code: string }[] = [
    { label: 'CAD — Dollar Canadien', code: 'CAD' },
    { label: 'USD — Dollar US',       code: 'USD' },
    { label: 'EUR — Euro',            code: 'EUR' },
    { label: 'GBP — Livre Sterling',  code: 'GBP' },
    { label: 'CHF — Franc Suisse',    code: 'CHF' },
    { label: 'Autre',                 code: 'Autre' }
  ];

  derniereTitre        = '';
  derniereBibliotheque = '';
  dernierPrixCAD: number | null = null;

  constructor(
    private fb: FormBuilder,
    private reponsesService: ReponsesService
  ) {}

  ngOnInit(): void {
    const nom      = `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';
    const statut   = sessionStorage.getItem('groupeAdmin')  ?? '';

    this.form = this.fb.group({

      /* ── Identification ── */
      nom:              [nom,      Validators.required],
      statut:           [statut],
      courriel:         [courriel, [Validators.required, Validators.email]],
      bibliotheque:     ['',       Validators.required],
      priorite_demande: ['Régulier', Validators.required],

      /* ── Informations bibliographiques ── */
      titre_document:   ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre:       ['',  Validators.maxLength(500)],
      editeur:          ['', [Validators.required, Validators.maxLength(300)]],
      isbn_issn:        ['', [Validators.required, this.isbnValidator]],
      categorie_document: ['', Validators.required],
      type_monographie: [{ value: '', disabled: true }],

      /* ── Abonnement (spécifiques) ── */
      date_debut_abonnement:    ['', Validators.required],
      periode_couverte:         [''],
      usager_aviser_reservation:[{ value: '', disabled: true }, Validators.email],

      /* ── Format et support ── */
      format_support:       ['Électronique', Validators.required],
      nombre_titres_inclus: [null, Validators.min(1)],
      nombre_utilisateurs:  ['Accès illimité'],
      lien_plateforme:      ['', [Validators.required, Validators.pattern('https?://.+')]],
      personne_a_aviser_courriel: [{ value: '', disabled: false }, Validators.email],

      /* ── Finances ── */
      prix_cad:             [null, [Validators.required, Validators.min(0.01)]],
      devise_originale:     ['',   Validators.required],
      prix_devise_originale:[null, [Validators.required, Validators.min(0.01)]],
      fonds_budgetaire:     ['',   [Validators.required, Validators.maxLength(200),
                                    Validators.pattern('^[A-Za-z]{2,4}-\\d{2,}$')]],

      /* ── Source et notes ── */
      source_information:   ['', [Validators.required, Validators.pattern('https?://.+')]],
      note_commentaire:     ['',  Validators.maxLength(1000)],
    });

    // Catégorie → activer type_monographie si Monographie
    this.form.get('categorie_document')!.valueChanges.subscribe(val => {
      this.showMonographie = val === 'Monographie';
      const ctrl = this.form.get('type_monographie')!;
      this.showMonographie ? ctrl.enable() : ctrl.disable();
    });

    // Format — champs conditionnels
    this.form.get('format_support')!.valueChanges.subscribe(val => {
      this.showElectronique = val === 'Électronique' || val === 'Imprimé et électronique';
      this.showImprime      = val === 'Imprimé/support physique' || val === 'Imprimé et électronique';
      this.showMixte        = val === 'Imprimé et électronique';

      const lien      = this.form.get('lien_plateforme')!;
      const personne  = this.form.get('personne_a_aviser_courriel')!;
      const aviserRes = this.form.get('usager_aviser_reservation')!;

      if (this.showElectronique) {
        lien.setValidators([Validators.required, Validators.pattern('https?://.+')]);
        personne.enable();
        aviserRes.disable();
        aviserRes.setValue('', { emitEvent: false });
      } else {
        lien.clearValidators();
        personne.disable();
        personne.setValue('', { emitEvent: false });
        aviserRes.enable();
      }
      lien.updateValueAndValidity();
      personne.updateValueAndValidity();
      aviserRes.updateValueAndValidity();
    });

    // Conversion automatique du prix en CAD
    this.form.get('prix_devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());
    this.form.get('devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());

    // Initialiser l'état pour le format par défaut (Électronique)
    this.showElectronique = true;
    this.showImprime      = false;
  }

  private isbnValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    if (/-/.test(value)) return { invalidIsbn: true };
    const v      = value.replace(/\s/g, '');
    const isbn10 = /^\d{9}[\dX]$/i;
    const isbn13 = /^97[89]\d{10}$/;
    const issn   = /^\d{7}[\dX]$/i;
    return isbn10.test(v) || isbn13.test(v) || issn.test(v) ? null : { invalidIsbn: true };
  }

  stripDashes(event: Event): void {
    const input    = event.target as HTMLInputElement;
    const stripped = input.value.replace(/-/g, '');
    if (stripped !== input.value) {
      this.form.get('isbn_issn')?.setValue(stripped, { emitEvent: true });
    }
  }

  private convertirPrix(): void {
    const prix   = this.form.get('prix_devise_originale')?.value;
    const devise = this.form.get('devise_originale')?.value;
    if (!prix || !devise) return;
    const taux: { [k: string]: number } = { USD: 1.368, EUR: 1.48, GBP: 1.73, CHF: 1.52 };
    const prixCAD = devise === 'CAD' ? prix : prix * (taux[devise] || 1);
    this.form.get('prix_cad')?.setValue(parseFloat(prixCAD.toFixed(2)), { emitEvent: false });
  }

  get f() { return this.form.controls; }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched || this.submitted);
  }

  onReset(): void {
    this.submitted        = false;
    this.success          = false;
    this.error            = false;
    this.showElectronique = true;
    this.showImprime      = false;
    this.showMixte        = false;
    this.showMonographie  = false;
    this.form.reset({
      priorite_demande:    'Régulier',
      format_support:      'Électronique',
      nombre_utilisateurs: 'Accès illimité',
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isLoading = true;
    const v = this.form.getRawValue();

    this.derniereTitre        = v.titre_document;
    this.derniereBibliotheque = v.bibliotheque;
    this.dernierPrixCAD       = v.prix_cad;

    const payload = {
      baseData: {
        formulaire_type:            'Nouvel abonnement',
        demandeur:                  v.nom,
        bibliotheque:               v.bibliotheque,
        priorite_demande:           v.priorite_demande,
        titre_document:             v.titre_document,
        sous_titre:                 v.sous_titre,
        editeur:                    v.editeur,
        isbn_issn:                  v.isbn_issn,
        categorie_document:         v.categorie_document,
        format_support:             v.format_support,
        nombre_titres_inclus:       (this.showElectronique || this.showMixte) ? v.nombre_titres_inclus : null,
        nombre_utilisateurs:        this.showElectronique ? v.nombre_utilisateurs : null,
        lien_plateforme:            this.showElectronique ? v.lien_plateforme : null,
        personne_a_aviser_courriel: this.showElectronique ? v.personne_a_aviser_courriel : null,
        prix_cad:                   v.prix_cad,
        devise_originale:           v.devise_originale,
        prix_devise_originale:      v.prix_devise_originale,
        fonds_budgetaire:           v.fonds_budgetaire,
        source_information:         v.source_information,
        note_commentaire:           v.note_commentaire,
        statut_bibliotheque:        'Saisie en cours en bibliothèque',
        statut_acq:                 'En attente',
      },
      specificData: {
        date_debut_abonnement:    v.date_debut_abonnement,
        type_monographie:         this.showMonographie ? v.type_monographie : null,
        usager_aviser_reservation:this.showImprime ? v.usager_aviser_reservation : null,
      },
    };

    this.reponsesService.envoyerNouvelAbonnement(payload).subscribe({
      next: () => {
        this.success   = true;
        this.isLoading = false;
      },
      error: () => {
        this.error     = true;
        this.isLoading = false;
      }
    });
  }
}
