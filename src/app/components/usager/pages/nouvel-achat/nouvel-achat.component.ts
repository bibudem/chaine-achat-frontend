import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
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
  showAviserReservation = true;
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

  statusOptions: string[] = [
    'Saisie en cours - En attente',
    'Saisie en cours – À valider ou compléter',
    'Saisie en cours – Annuler',
    'Saisie en cours - Publication à paraître',
    'À autoriser en bibliothèque',
    'Soumettre aux ACQ',
  ];

  derniereTitre: string = '';
  derniereBibliotheque: string = '';
  dernierPrixCAD: number | null = null;

  constructor(
    private fb: FormBuilder,
    private reponsesService: ReponsesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const nom      = `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';
    const statut   = sessionStorage.getItem('groupeAdmin')  ?? '';

    this.form = this.fb.group({
      nom:                         [nom,       Validators.required],
      statut:                      [statut],
      courriel:                    [courriel,  [Validators.required, Validators.email]],
      bibliotheque:                ['',        Validators.required],
      priorite_demande:            ['Régulier', Validators.required],
      titre_document:              ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre:                  ['', Validators.maxLength(500)],
      editeur:                     ['', [Validators.required, Validators.maxLength(300)]],
      isbn_issn:                   ['', [Validators.required, this.isbnValidator]],
      date_publication:            ['', Validators.required],
      source_information:          ['', [Validators.required, Validators.pattern('https?://.+')]],
      categorie_document:          ['', Validators.required],
      type_monographie:            [{ value: '', disabled: true }],
      format_support:              ['Imprimé/support physique', Validators.required],
      format_pret_numerique:       ["Ne s'applique pas"],
      nombre_utilisateurs:         ['Accès illimité'],
      lien_plateforme:             [''],
      aviser_reservation:          ['', Validators.email],
      aviser_activation:           [{ value: '', disabled: true }, Validators.email],
      prix_cad:                    [null, [Validators.required, Validators.min(0.01)]],
      devise_originale:            ['',   Validators.required],
      prix_devise_originale:       [null, [Validators.required, Validators.min(0.01)]],
      fonds_budgetaire:            ['',   [Validators.required, Validators.maxLength(200), Validators.pattern('^[A-Za-z]{2,4}-\\d{2,}$')]],
      quantite:                    [1, [Validators.required, Validators.min(1)]],
      mettreReserve:               [false],
      reserve_cours_sigle:         [{ value: '', disabled: true }],
      reserve_cours_session:       [{ value: '', disabled: true }],
      reserve_cours_enseignant:    [{ value: '', disabled: true }],
      note_commentaire:            ['', Validators.maxLength(1000)],
      statut_bibliotheque:         ['Saisie en cours - En attente'],
      bibliotheque_note_interne:            ['', Validators.maxLength(1000)],
    });

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
        if (bd.format_support)     this.form.get('format_support')!.setValue(bd.format_support);
        if (bd.categorie_document) this.form.get('categorie_document')!.setValue(bd.categorie_document);
        if (sd.reserve_cours)      this.form.get('mettreReserve')!.setValue(sd.reserve_cours);
        this.form.patchValue({
          nom:                    bd.demandeur,
          bibliotheque:           bd.bibliotheque,
          priorite_demande:       bd.priorite_demande,
          titre_document:         bd.titre_document,
          sous_titre:             bd.sous_titre,
          editeur:                bd.editeur,
          isbn_issn:              bd.isbn_issn,
          date_publication:       bd.date_publication,
          source_information:     bd.source_information,
          format_pret_numerique:  bd.format_pret_numerique,
          nombre_utilisateurs:    bd.nombre_utilisateurs,
          lien_plateforme:        bd.lien_plateforme,
          aviser_reservation:     sd.usager_aviser_reservation,
          aviser_activation:      sd.usager_aviser_activation,
          prix_cad:               bd.prix_cad,
          devise_originale:       bd.devise_originale,
          prix_devise_originale:  bd.prix_devise_originale,
          fonds_budgetaire:       bd.fonds_budgetaire,
          quantite:               sd.quantite,
          type_monographie:       sd.type_monographie,
          reserve_cours_sigle:    sd.reserve_cours_sigle,
          reserve_cours_session:  sd.reserve_cours_session,
          reserve_cours_enseignant: sd.reserve_cours_enseignant,
          note_commentaire:       bd.note_commentaire,
          statut_bibliotheque:    bd.statut_bibliotheque,
          bibliotheque_note_interne:       bd.bibliotheque_note_interne,
        });
      }
    });
  }

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
      quantite:              1,
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
    this.dernierPrixCAD       = v.prix_cad;

    const payload = {
      baseData: {
        formulaire_type:       'Nouvel achat unique',
        demandeur:             v.nom,
        bibliotheque:          v.bibliotheque,
        priorite_demande:      v.priorite_demande,
        titre_document:        v.titre_document,
        sous_titre:            v.sous_titre,
        editeur:               v.editeur,
        isbn_issn:             v.isbn_issn,
        date_publication:      v.date_publication,
        source_information:    v.source_information,
        categorie_document:    v.categorie_document,
        format_support:        v.format_support,
        format_pret_numerique: v.format_pret_numerique,
        nombre_utilisateurs:   this.showElectronique ? v.nombre_utilisateurs : null,
        lien_plateforme:       this.showElectronique ? v.lien_plateforme : null,
        prix_cad:              v.prix_cad,
        devise_originale:      v.devise_originale,
        prix_devise_originale: v.prix_devise_originale,
        fonds_budgetaire:      v.fonds_budgetaire,
        note_commentaire:      v.note_commentaire,
        statut_bibliotheque:   v.statut_bibliotheque,
        bibliotheque_note_interne:      v.bibliotheque_note_interne,
        statut_acq:            'En attente',
      },
      specificData: {
        type_monographie:          this.showMonographie ? v.type_monographie : null,
        format_electronique:       this.showElectronique ? v.format_pret_numerique : null,
        quantite:                  v.quantite,
        usager_aviser_reservation: this.showAviserReservation ? v.aviser_reservation : null,
        usager_aviser_activation:  this.showElectronique ? v.aviser_activation : null,
        reserve_cours:             v.mettreReserve,
        reserve_cours_sigle:       v.mettreReserve ? v.reserve_cours_sigle     : null,
        reserve_cours_session:     v.mettreReserve ? v.reserve_cours_session    : null,
        reserve_cours_enseignant:  v.mettreReserve ? v.reserve_cours_enseignant : null,
      },
    };

    const obs = this.editId
      ? this.reponsesService.updateReponse(this.editId, payload)
      : this.reponsesService.envoyerNouvelAchat(payload);

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
        formulaire_type:       'Nouvel achat unique',
        demandeur:             v.nom,
        bibliotheque:          v.bibliotheque,
        priorite_demande:      v.priorite_demande,
        titre_document:        v.titre_document,
        sous_titre:            v.sous_titre,
        editeur:               v.editeur,
        isbn_issn:             v.isbn_issn,
        date_publication:      v.date_publication,
        source_information:    v.source_information,
        categorie_document:    v.categorie_document,
        format_support:        v.format_support,
        format_pret_numerique: v.format_pret_numerique,
        nombre_utilisateurs:   this.showElectronique ? v.nombre_utilisateurs : null,
        lien_plateforme:       this.showElectronique ? v.lien_plateforme : null,
        prix_cad:              v.prix_cad,
        devise_originale:      v.devise_originale,
        prix_devise_originale: v.prix_devise_originale,
        fonds_budgetaire:      v.fonds_budgetaire,
        note_commentaire:      v.note_commentaire,
        statut_bibliotheque:   v.statut_bibliotheque || 'Saisie en cours - En attente',
        bibliotheque_note_interne:      v.bibliotheque_note_interne,
        statut_acq:            'En attente',
      },
      specificData: {
        type_monographie:          this.showMonographie ? v.type_monographie : null,
        format_electronique:       this.showElectronique ? v.format_pret_numerique : null,
        quantite:                  v.quantite,
        usager_aviser_reservation: this.showAviserReservation ? v.aviser_reservation : null,
        usager_aviser_activation:  this.showElectronique ? v.aviser_activation : null,
        reserve_cours:             v.mettreReserve,
        reserve_cours_sigle:       v.mettreReserve ? v.reserve_cours_sigle     : null,
        reserve_cours_session:     v.mettreReserve ? v.reserve_cours_session    : null,
        reserve_cours_enseignant:  v.mettreReserve ? v.reserve_cours_enseignant : null,
      },
    };
    const obs = this.editId
      ? this.reponsesService.updateReponse(this.editId, payload)
      : this.reponsesService.envoyerNouvelAchat(payload);
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
