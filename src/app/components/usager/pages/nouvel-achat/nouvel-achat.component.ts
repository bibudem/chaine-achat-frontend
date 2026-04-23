import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReponsesService } from '../../../../services/reponses.service';

@Component({
  selector: 'app-nouvel-achat',
  templateUrl: './nouvel-achat.component.html',
  styleUrls: ['./nouvel-achat.component.css']
})
export class NouvelAchatComponent implements OnInit {
  form!: FormGroup;
  submitted             = false;
  success               = false;
  error                 = false;
  isLoading             = false;
  showReserveCours      = false;
  showElectronique      = false;
  showMonographie       = false;
  showAviserReservation = true; // format par défaut = Imprimé

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
    'Autres (microfilm, etc.)', "Ne s'applique pas"
  ];

  devises: { label: string; code: string }[] = [
    { label: 'CAD — Dollar Canadien', code: 'CAD' },
    { label: 'USD — Dollar US',       code: 'USD' },
    { label: 'EUR — Euro',            code: 'EUR' },
    { label: 'GBP — Livre Sterling',  code: 'GBP' },
    { label: 'CHF — Franc Suisse',    code: 'CHF' },
    { label: 'Autre',                 code: 'Autre' }
  ];

  priorites: string[] = ['Régulier', 'Prioritaire', 'Urgent'];

  derniereTitre: string = '';
  derniereBibliotheque: string = '';
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
      nom:                         [nom,       Validators.required],
      statut:                      [statut],
      courriel:                    [courriel,  [Validators.required, Validators.email]],
      bibliotheque:                ['',        Validators.required],
      priorite_demande:            ['Régulier', Validators.required],

      /* ── Informations bibliographiques ── */
      titre_document:              ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre:                  ['', Validators.maxLength(500)],
      editeur:                     ['', [Validators.required, Validators.maxLength(300)]],
      isbn_issn:                   ['', [Validators.required, this.isbnValidator]],
      date_publication:            ['', Validators.required],
      source_information:          ['', [Validators.required, Validators.pattern('https?://.+')]],
      categorie_document:          ['', Validators.required],
      type_monographie:            [{ value: '', disabled: true }],

      /* ── Format ── */
      format_support:              ['Imprimé/support physique', Validators.required],
      format_pret_numerique:       ["Ne s'applique pas"],
      nombre_utilisateurs:         ['Accès illimité'],
      lien_plateforme:             [''],
      aviser_reservation:          ['', Validators.email],
      aviser_activation:           [{ value: '', disabled: true }, Validators.email],

      /* ── Finances ── */
      prix_cad:                    [null, [Validators.required, Validators.min(0.01)]],
      devise_originale:            ['',   Validators.required],
      prix_devise_originale:       [null, [Validators.required, Validators.min(0.01)]],
      fonds_budgetaire:            ['',   [Validators.required, Validators.maxLength(200), Validators.pattern('^[A-Za-z]{2,4}-\\d{2,}$')]],

      /* ── Réserve de cours ── */
      mettreReserve:               [false],
      reserve_cours_sigle:         [{ value: '', disabled: true }],
      reserve_cours_session:       [{ value: '', disabled: true }],
      reserve_cours_enseignant:    [{ value: '', disabled: true }],

      /* ── Notes ── */
      note_commentaire:            ['', Validators.maxLength(1000)],
    });

    // Catégorie → activer type_monographie uniquement pour Monographie
    this.form.get('categorie_document')!.valueChanges.subscribe(val => {
      this.showMonographie = val === 'Monographie';
      const typeMonographie = this.form.get('type_monographie')!;
      if (this.showMonographie) {
        typeMonographie.enable();
      } else {
        typeMonographie.disable();
        typeMonographie.clearValidators();
        typeMonographie.updateValueAndValidity();
      }
    });

    // Réserve de cours — activer/désactiver les sous-champs
    this.form.get('mettreReserve')!.valueChanges.subscribe(val => {
      this.showReserveCours = val;
      const sigle      = this.form.get('reserve_cours_sigle')!;
      const session    = this.form.get('reserve_cours_session')!;
      const enseignant = this.form.get('reserve_cours_enseignant')!;
      if (val) {
        sigle.enable();      sigle.setValidators([Validators.required, Validators.pattern('^[A-Z]{3,4}[0-9]{4}$')]);
        session.enable();    session.setValidators([Validators.required]);
        enseignant.enable(); enseignant.setValidators([Validators.required]);
      } else {
        sigle.disable();      sigle.clearValidators();
        session.disable();    session.clearValidators();
        enseignant.disable(); enseignant.clearValidators();
      }
      sigle.updateValueAndValidity();
      session.updateValueAndValidity();
      enseignant.updateValueAndValidity();
    });

    // Format — champs conditionnels + champs aviseur
    this.form.get('format_support')!.valueChanges.subscribe(val => {
      this.showElectronique      = val === 'Électronique';
      this.showAviserReservation = val === 'Imprimé/support physique';

      const lien      = this.form.get('lien_plateforme')!;
      const aviserRes = this.form.get('aviser_reservation')!;
      const aviserAct = this.form.get('aviser_activation')!;

      if (this.showElectronique) {
        lien.setValidators([Validators.required, Validators.pattern('https?://.+')]);
        aviserAct.enable();
        aviserRes.disable();
      } else {
        lien.clearValidators();
        aviserAct.disable();
        aviserRes.enable();
      }
      lien.updateValueAndValidity();
      aviserRes.updateValueAndValidity();
      aviserAct.updateValueAndValidity();
    });

    // Conversion automatique du prix en CAD
    this.form.get('prix_devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());
    this.form.get('devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());
  }

  // Validateur ISBN / ISSN — tirets refusés (auto-supprimés à la saisie)
  private isbnValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    if (/-/.test(value)) return { invalidIsbn: true };
    const v     = value.replace(/\s/g, '');
    const isbn10 = /^\d{9}[\dX]$/i;
    const isbn13 = /^97[89]\d{10}$/;
    const issn   = /^\d{7}[\dX]$/i;
    return isbn10.test(v) || isbn13.test(v) || issn.test(v) ? null : { invalidIsbn: true };
  }

  // Suppression automatique des tirets dans isbn_issn à la saisie
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
    this.submitted             = false;
    this.success               = false;
    this.error                 = false;
    this.showReserveCours      = false;
    this.showElectronique      = false;
    this.showMonographie       = false;
    this.showAviserReservation = true;
    this.form.reset({
      priorite_demande:      'Régulier',
      format_support:        'Imprimé/support physique',
      format_pret_numerique: "Ne s'applique pas",
      nombre_utilisateurs:   'Accès illimité',
      mettreReserve:         false,
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
        formulaire_type:              'Nouvel achat unique',
        demandeur:                    v.nom,
        bibliotheque:                 v.bibliotheque,
        priorite_demande:             v.priorite_demande,
        titre_document:               v.titre_document,
        sous_titre:                   v.sous_titre,
        editeur:                      v.editeur,
        isbn_issn:                    v.isbn_issn,
        date_publication:             v.date_publication,
        source_information:           v.source_information,
        categorie_document:           v.categorie_document,
        format_support:               v.format_support,
        format_pret_numerique:        v.format_pret_numerique,
        nombre_utilisateurs:          v.nombre_utilisateurs,
        lien_plateforme:              this.showElectronique ? v.lien_plateforme : null,
        personne_a_aviser_activation: this.showElectronique ? v.aviser_activation : null,
        prix_cad:                     v.prix_cad,
        devise_originale:             v.devise_originale,
        prix_devise_originale:        v.prix_devise_originale,
        fonds_budgetaire:             v.fonds_budgetaire,
        note_commentaire:             v.note_commentaire,
        statut_bibliotheque:          'Saisie en cours en bibliothèque',
        statut_acq:                   'En attente',
      },
      specificData: {
        type_monographie:         this.showMonographie ? v.type_monographie : null,
        format_electronique:      this.showElectronique ? v.format_pret_numerique : null,
        aviser_reservation:       this.showAviserReservation ? v.aviser_reservation : null,
        aviser_activation:        this.showElectronique ? v.aviser_activation : null,
        reserve_cours:            v.mettreReserve,
        reserve_cours_sigle:      v.mettreReserve ? v.reserve_cours_sigle     : null,
        reserve_cours_session:    v.mettreReserve ? v.reserve_cours_session    : null,
        reserve_cours_enseignant: v.mettreReserve ? v.reserve_cours_enseignant : null,
      },
    };

    this.reponsesService.envoyerNouvelAchat(payload).subscribe({
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
