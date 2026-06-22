import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { ReponsesService } from '../../../../services/reponses.service';

@Component({
  selector: 'app-requete-accessibilite',
  templateUrl: './requete-accessibilite.component.html',
  styleUrls: ['./requete-accessibilite.component.css']
})
export class RequeteAccessibiliteComponent implements OnInit {
  form!: FormGroup;
  submitted        = false;
  success          = false;
  error            = false;
  isLoading        = false;
  showElectronique = false;
  showImprime      = true;
  editId: number | null = null;

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

  besoinsFormat: string[] = [
    "Électronique : écrire à l'éditeur pour version numérique gratuite",
    'Électronique : acheter licence institutionnelle standard + version numérique gratuite',
    'Électronique : acheter licence institutionnelle standard',
    'Imprimé/support physique : acheter exemplaires + version numérique gratuite',
    "Imprimé/support physique : acheter exemplaire sans version numérique"
  ];

  readonly OUI_NON_NA = ['OUI', 'NON', "Ne s'applique pas"];

  devises: string[] = ['CAD', 'USD', 'EUR', 'GBP', 'CHF'];

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
    private router: Router
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
      priorite_demande: ['Urgent',     Validators.required],
      titre_document:     ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre:         ['', Validators.maxLength(500)],
      editeur:            ['', Validators.maxLength(300)],
      isbn_issn:          ['', [Validators.required, this.isbnValidator]],
      date_publication:   [''],
      categorie_document: ['', Validators.required],
      reference_usager:                 [''],
      besoin_specifique_format:         [''],
      permalien_sofia:                  ['', Validators.pattern('https?://.+')],
      fournisseur_contacte_sans_succes: [''],
      exemplaire_detenu:                [''],
      verification_caeb:                [''],
      verification_sqla:                [''],
      verification_emma:                [''],
      format_support:             ['Imprimé/support physique', Validators.required],
      format_pret_numerique:      ["Ne s'applique pas"],
      personne_a_aviser_courriel: [{ value: '', disabled: true }, Validators.email],
      devise_originale:      ['',   Validators.required],
      prix_devise_originale: [null, [Validators.required, Validators.min(0.01)]],
      prix_cad:              [null, [Validators.required, Validators.min(0.01)]],
      fonds_sn_projet:    ['', Validators.maxLength(50)],
      source_information: ['', Validators.pattern('https?://.+')],
      note_commentaire:   ['', Validators.maxLength(1000)],
      statut_bibliotheque: ['Saisie en cours - En attente'],
      bibliotheque_note_interne:    ['', Validators.maxLength(1000)],
    });

    this.form.get('format_support')!.valueChanges.subscribe(val => {
      this.showElectronique = val === 'Électronique' || val === 'Imprimé et électronique';
      this.showImprime      = val === 'Imprimé/support physique' || val === 'Imprimé et électronique';
      const aviser = this.form.get('personne_a_aviser_courriel')!;
      this.showElectronique ? aviser.enable() : aviser.disable();
      aviser.updateValueAndValidity();
    });

    this.form.get('prix_devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());
    this.form.get('devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());

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
          nom:                              bd.demandeur,
          bibliotheque:                     bd.bibliotheque,
          fonds_budgetaire:                 bd.fonds_budgetaire,
          priorite_demande:                 bd.priorite_demande,
          titre_document:                   bd.titre_document,
          sous_titre:                       bd.sous_titre,
          editeur:                          bd.editeur,
          isbn_issn:                        bd.isbn_issn,
          date_publication:                 bd.date_publication,
          categorie_document:               bd.categorie_document,
          reference_usager:                 sd.reference_usager,
          besoin_specifique_format:         sd.besoin_specifique_format,
          permalien_sofia:                  sd.permalien_sofia,
          fournisseur_contacte_sans_succes: sd.fournisseur_contacte_sans_succes,
          exemplaire_detenu:                sd.exemplaire_detenu,
          verification_caeb:                sd.verification_caeb,
          verification_sqla:                sd.verification_sqla,
          verification_emma:                sd.verification_emma,
          format_pret_numerique:            bd.format_pret_numerique,
          personne_a_aviser_courriel:       bd.personne_a_aviser_courriel,
          devise_originale:                 bd.devise_originale,
          prix_devise_originale:            bd.prix_devise_originale,
          prix_cad:                         bd.prix_cad,
          fonds_sn_projet:                  bd.fonds_sn_projet,
          source_information:               bd.source_information,
          note_commentaire:                 bd.note_commentaire,
          statut_bibliotheque:              bd.statut_bibliotheque,
          bibliotheque_note_interne:                 bd.bibliotheque_note_interne,
        });
      }
    });
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
    this.showElectronique = false;
    this.showImprime      = true;
    this.form.reset({
      priorite_demande:      'Urgent',
      format_support:        'Imprimé/support physique',
      format_pret_numerique: "Ne s'applique pas",
      statut_bibliotheque:   'Saisie en cours - En attente',
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
        formulaire_type:            'Requête ACQ Accessibilité',
        demandeur:                  v.nom,
        personne_a_aviser_courriel: this.showElectronique ? v.personne_a_aviser_courriel : null,
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
        format_pret_numerique:      this.showElectronique ? v.format_pret_numerique : null,
        prix_cad:                   v.prix_cad,
        devise_originale:           v.devise_originale,
        prix_devise_originale:      v.prix_devise_originale,
        fonds_sn_projet:            v.fonds_sn_projet,
        source_information:         v.source_information,
        note_commentaire:           v.note_commentaire,
        statut_bibliotheque:        v.statut_bibliotheque,
        bibliotheque_note_interne:           v.bibliotheque_note_interne,
        statut_acq:                 'En attente',
      },
      specificData: {
        reference_usager:                 v.reference_usager,
        besoin_specifique_format:         v.besoin_specifique_format,
        permalien_sofia:                  v.permalien_sofia,
        fournisseur_contacte_sans_succes: v.fournisseur_contacte_sans_succes,
        exemplaire_detenu:                v.exemplaire_detenu,
        verification_caeb:                v.verification_caeb,
        verification_sqla:                v.verification_sqla,
        verification_emma:                v.verification_emma,
        acq_numerisation_recommandee:     null,
        acq_date_demande_editeur:         null,
        acq_date_livraison_estimee:       null,
        acq_responsable_courriel:         null,
        type_monographie:                 null,
      },
    };

    const obs = this.editId
      ? this.reponsesService.updateReponse(this.editId, payload)
      : this.reponsesService.envoyerRequeteAccessibilite(payload);

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
        formulaire_type:            'Requête ACQ Accessibilité',
        demandeur:                  v.nom,
        personne_a_aviser_courriel: this.showElectronique ? v.personne_a_aviser_courriel : null,
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
        format_pret_numerique:      this.showElectronique ? v.format_pret_numerique : null,
        prix_cad:                   v.prix_cad,
        devise_originale:           v.devise_originale,
        prix_devise_originale:      v.prix_devise_originale,
        fonds_sn_projet:            v.fonds_sn_projet,
        source_information:         v.source_information,
        note_commentaire:           v.note_commentaire,
        statut_bibliotheque:        v.statut_bibliotheque || 'Saisie en cours - En attente',
        bibliotheque_note_interne:           v.bibliotheque_note_interne,
        statut_acq:                 'En attente',
      },
      specificData: {
        reference_usager:                 v.reference_usager,
        besoin_specifique_format:         v.besoin_specifique_format,
        permalien_sofia:                  v.permalien_sofia,
        fournisseur_contacte_sans_succes: v.fournisseur_contacte_sans_succes,
        exemplaire_detenu:                v.exemplaire_detenu,
        verification_caeb:                v.verification_caeb,
        verification_sqla:                v.verification_sqla,
        verification_emma:                v.verification_emma,
        acq_numerisation_recommandee:     null,
        acq_date_demande_editeur:         null,
        acq_date_livraison_estimee:       null,
        acq_responsable_courriel:         null,
        type_monographie:                 null,
      },
    };
    const obs = this.editId
      ? this.reponsesService.updateReponse(this.editId, payload)
      : this.reponsesService.envoyerRequeteAccessibilite(payload);
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
