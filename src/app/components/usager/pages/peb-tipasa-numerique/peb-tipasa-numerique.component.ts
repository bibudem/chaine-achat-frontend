import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { ReponsesService } from '../../../../services/reponses.service';
import { ConfigService } from '../../../../services/config.service';

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
  editId:  number | null = null;
  tauxUsd = 1.368;

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

  statusOptions: string[] = [
    'Saisie en cours - En attente',
    'Saisie en cours – À valider ou compléter',
    'Saisie en cours – Annuler',
    'Saisie en cours - Publication à paraître',
    'À autoriser en bibliothèque',
    'Soumettre aux ACQ',
  ];

  derniereTitre        = '';
  derniereBibliotheque = '';

  constructor(
    private fb: FormBuilder,
    private reponsesService: ReponsesService,
    private route: ActivatedRoute,
    private router: Router,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    const nom      = `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';
    const statut   = sessionStorage.getItem('groupeAdmin')   ?? '';

    this.form = this.fb.group({
      nom:              [nom,          Validators.required],
      statut:           [statut],
      courriel:         [courriel,     [Validators.required, Validators.email]],
      bibliotheque:     ['',           Validators.required],
      fonds_budgetaire: ['',           [Validators.required, Validators.maxLength(200), Validators.pattern('^[A-Za-z]{2,4}-\\d{2,}$')]],
      priorite_demande: ['Régulier',   Validators.required],
      titre_document:     ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre:         ['', Validators.maxLength(500)],
      editeur:            ['', Validators.maxLength(300)],
      isbn_issn:          ['', [Validators.required, this.isbnValidator]],
      date_publication:   [''],
      categorie_document: ['', Validators.required],
      gobi_vu_format_numerique: ['', Validators.required],
      reference_tipasa:         [''],
      format_support:            ['Électronique', Validators.required],
      creation_notice_dtdm:      [false],
      localisation_emplacement:  [''],
      nombre_titres_inclus:      [null, Validators.min(1)],
      personne_a_aviser_courriel: [{ value: '', disabled: false }, Validators.email],
      devise_originale:      ['',   Validators.required],
      prix_devise_originale: [null, [Validators.required, Validators.min(0.01)]],
      prix_cad:              [null, [Validators.required, Validators.min(0.01)]],
      source_information: ['', [Validators.required, Validators.pattern('https?://.+')]],
      note_commentaire:   ['', Validators.maxLength(1000)],
      statut_bibliotheque: ['Saisie en cours - En attente'],
      bibliotheque_note_interne:    ['', Validators.maxLength(1000)],
    });

    this.form.get('format_support')!.valueChanges.subscribe(val => {
      this.showElectronique = val === 'Électronique' || val === 'Imprimé et électronique';
      this.showImprime      = val === 'Imprimé/support physique' || val === 'Imprimé et électronique';
      this.form.get('creation_notice_dtdm')!.setValue(val !== 'Électronique', { emitEvent: false });
    });

    this.form.get('prix_devise_originale')!.valueChanges.subscribe(() => {
      if (this.form.get('devise_originale')?.value === 'USD') { this.convertirPrix(); }
    });
    this.form.get('devise_originale')!.valueChanges.subscribe(() => {
      this.form.get('prix_cad')?.setValue(null, { emitEvent: false });
      if (this.form.get('devise_originale')?.value === 'USD') { this.convertirPrix(); }
    });
    this.configService.getTauxUsd().subscribe(t => { this.tauxUsd = t; });

    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['id']) {
        this.editId = +params['id'];
        this.loadDemande(this.editId);
      }
    });
  }

  private loadDemande(id: number): void {
    this.reponsesService.getReponseById(id).subscribe({
      next: (row) => {
        const bd = row.reponses?.baseData ?? {};
        const sd = row.reponses?.specificData ?? {};
        if (bd.format_support) this.form.get('format_support')!.setValue(bd.format_support);
        this.form.patchValue({
          nom:                        bd.demandeur,
          bibliotheque:               bd.bibliotheque,
          fonds_budgetaire:           bd.fonds_budgetaire,
          priorite_demande:           bd.priorite_demande,
          titre_document:             bd.titre_document,
          sous_titre:                 bd.sous_titre,
          editeur:                    bd.editeur,
          isbn_issn:                  bd.isbn_issn,
          date_publication:           bd.date_publication,
          categorie_document:         bd.categorie_document,
          gobi_vu_format_numerique:   sd.gobi_vu_format_numerique,
          reference_tipasa:           sd.reference_tipasa,
          creation_notice_dtdm:       bd.creation_notice_dtdm,
          localisation_emplacement:   bd.localisation_emplacement,
          nombre_titres_inclus:       bd.nombre_titres_inclus,
          personne_a_aviser_courriel: bd.personne_a_aviser_courriel,
          devise_originale:           bd.devise_originale,
          prix_devise_originale:      bd.prix_devise_originale,
          prix_cad:                   bd.prix_cad,
          source_information:         bd.source_information,
          note_commentaire:           bd.note_commentaire,
          statut_bibliotheque:        bd.statut_bibliotheque,
          bibliotheque_note_interne:           bd.bibliotheque_note_interne,
        });
      }
    });
  }

  private convertirPrix(): void {
    const prix = this.form.get('prix_devise_originale')?.value;
    if (!prix) return;
    this.form.get('prix_cad')?.setValue(parseFloat((prix * this.tauxUsd).toFixed(2)), { emitEvent: false });
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
      statut_bibliotheque:  'Saisie en cours - En attente',
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
        statut_bibliotheque:        v.statut_bibliotheque,
        bibliotheque_note_interne:           v.bibliotheque_note_interne,
        statut_acq:                 'En attente',
      },
      specificData: {
        reference_tipasa:           v.reference_tipasa,
        gobi_vu_format_numerique:   v.gobi_vu_format_numerique,
        gobi_version_moins_365_usd: "Ne s'applique pas",
        acq_responsable_courriel:   null,
      },
    };

    const obs = this.editId
      ? this.reponsesService.updateReponse(this.editId, payload)
      : this.reponsesService.envoyerPebTipasa(payload);

    obs.subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/usager/profil'], { state: { message: 'Votre demande a été soumise avec succès.' } });
      },
      error: () => { this.isLoading = false; this.error = true; }
    });
  }

  onSave(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    this.isLoading = true;
    const v = this.form.getRawValue();
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
        statut_bibliotheque:        v.statut_bibliotheque || 'Saisie en cours - En attente',
        bibliotheque_note_interne:           v.bibliotheque_note_interne,
        statut_acq:                 'En attente',
      },
      specificData: {
        reference_tipasa:           v.reference_tipasa,
        gobi_vu_format_numerique:   v.gobi_vu_format_numerique,
        gobi_version_moins_365_usd: "Ne s'applique pas",
        acq_responsable_courriel:   null,
      },
    };
    const obs = this.editId
      ? this.reponsesService.updateReponse(this.editId, payload)
      : this.reponsesService.envoyerPebTipasa(payload);
    obs.subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (!this.editId && res?.id) this.editId = res.id;
        this.router.navigate(['/usager/profil'], { state: { message: 'Vos informations ont été enregistrées.' } });
      },
      error: () => { this.isLoading = false; this.error = true; }
    });
  }
}
