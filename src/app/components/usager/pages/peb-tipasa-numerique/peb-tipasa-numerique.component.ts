import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReponsesService } from '../../../../services/reponses.service';

@Component({
  selector: 'app-peb-tipasa-numerique',
  templateUrl: './peb-tipasa-numerique.component.html',
  styleUrls: ['./peb-tipasa-numerique.component.css']
})
export class PebTipasaNumeriqueComponent implements OnInit {
  form!: FormGroup;
  submitted        = false;
  success          = false;
  error            = false;
  isLoading        = false;
  showElectronique = true;
  showImprime      = false;

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

  priorites: string[] = ['Régulier', 'Prioritaire', 'Urgent'];

  devises: string[] = ['CAD', 'USD', 'EUR', 'GBP', 'CHF'];

  gobiBooleans: string[] = ['Oui', 'Non'];

  derniereTitre        = '';
  derniereBibliotheque = '';

  constructor(
    private fb: FormBuilder,
    private reponsesService: ReponsesService
  ) {}

  ngOnInit(): void {
    const nom      = `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';
    const statut   = sessionStorage.getItem('groupeAdmin')   ?? '';

    this.form = this.fb.group({

      /* ── Identification ── */
      nom:              [nom,          Validators.required],
      statut:           [statut],
      courriel:         [courriel,     [Validators.required, Validators.email]],
      bibliotheque:     ['',           Validators.required],
      fonds_budgetaire: ['',           [Validators.required, Validators.maxLength(200), Validators.pattern('^[A-Za-z]{2,4}-\\d{2,}$')]],
      priorite_demande: ['Régulier',   Validators.required],

      /* ── Document ── */
      titre_document:     ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre:         ['', Validators.maxLength(500)],
      editeur:            ['', Validators.maxLength(300)],
      isbn_issn:          ['', [Validators.required, this.isbnValidator]],
      date_publication:   [''],
      categorie_document: ['', Validators.required],

      /* ── Disponibilité numérique (spécifique PEB Tipasa) ── */
      gobi_vu_format_numerique: ['', Validators.required],
      reference_tipasa:         [''],

      /* ── Format et support ── */
      format_support:            ['Électronique', Validators.required],
      creation_notice_dtdm:      [false],
      localisation_emplacement:  [''],
      nombre_titres_inclus:      [null, Validators.min(1)],
      personne_a_aviser_courriel: [{ value: '', disabled: false }, Validators.email],

      /* ── Finances ── */
      devise_originale:      ['',   Validators.required],
      prix_devise_originale: [null, [Validators.required, Validators.min(0.01)]],
      prix_cad:              [null, [Validators.required, Validators.min(0.01)]],

      /* ── Source et notes ── */
      source_information: ['', [Validators.required, Validators.pattern('https?://.+')]],
      note_commentaire:   ['', Validators.maxLength(1000)],
    });

    this.form.get('format_support')!.valueChanges.subscribe(val => {
      this.showElectronique = val === 'Électronique' || val === 'Imprimé et électronique';
      this.showImprime      = val === 'Imprimé/support physique' || val === 'Imprimé et électronique';
      this.form.get('creation_notice_dtdm')!.setValue(val !== 'Électronique', { emitEvent: false });
    });

    this.form.get('prix_devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());
    this.form.get('devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());
  }

  private convertirPrix(): void {
    const prix   = this.form.get('prix_devise_originale')?.value;
    const devise = this.form.get('devise_originale')?.value;
    if (!prix || !devise) return;
    const taux: { [k: string]: number } = { USD: 1.368, EUR: 1.48, GBP: 1.73, CHF: 1.52 };
    const prixCAD = devise === 'CAD' ? prix : prix * (taux[devise] || 1);
    this.form.get('prix_cad')?.setValue(parseFloat(prixCAD.toFixed(2)), { emitEvent: false });
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
    this.form.reset({
      priorite_demande:     'Régulier',
      format_support:       'Électronique',
      creation_notice_dtdm: false,
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isLoading = true;
    const v = this.form.getRawValue();

    this.derniereTitre        = v.titre_document;
    this.derniereBibliotheque = v.bibliotheque;

    const payload = {
      baseData: {
        formulaire_type:            'PEB Tipasa numérique',
        demandeur:                  v.nom,
        bibliotheque:               v.bibliotheque,
        fonds_budgetaire:           v.fonds_budgetaire,
        priorite_demande:           v.priorite_demande,
        titre_document:             v.titre_document,
        sous_titre:                 v.sous_titre,
        editeur:                    v.editeur,
        isbn_issn:                  v.isbn_issn,
        date_publication:           v.date_publication,
        categorie_document:         v.categorie_document,
        format_support:             v.format_support,
        localisation_emplacement:   this.showImprime     ? v.localisation_emplacement   : null,
        creation_notice_dtdm:       v.creation_notice_dtdm,
        nombre_titres_inclus:       this.showElectronique ? v.nombre_titres_inclus       : null,
        personne_a_aviser_courriel: this.showElectronique ? v.personne_a_aviser_courriel : null,
        prix_cad:                   v.prix_cad,
        devise_originale:           v.devise_originale,
        prix_devise_originale:      v.prix_devise_originale,
        source_information:         v.source_information,
        note_commentaire:           v.note_commentaire,
        statut_bibliotheque:        'Saisie en cours - En attente',
        statut_acq:                 'En attente',
      },
      specificData: {
        reference_tipasa:           v.reference_tipasa,
        gobi_vu_format_numerique:   v.gobi_vu_format_numerique,
        gobi_version_moins_365_usd: "Ne s'applique pas",
        acq_responsable_courriel:   null,
      },
    };

    this.reponsesService.envoyerPebTipasa(payload).subscribe({
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
