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
  submitted       = false;
  success         = false;
  error           = false;
  isLoading       = false;
  showReserveCours = false;
  showElectronique = false;

  // Listes de référence
  bibliotheques: string[] = [
    'Aménagement', 'Campus Laval', 'Direction générale', 'Droit',
    'Du Parc', 'Hubert-Reeves', 'Kinésiologie', 'L.S.H.',
    'Livres rares', 'Mathématiques-Informatique', 'Médecine vétérinaire',
    'Musique', "Marguerite-d'Youville", 'Prêt entre bibliothèques',
    'Santé', 'Service du catalogage', 'TGD'
  ];

  categoriesDocument: string[] = [
    'Monographie', 'Périodique', 'Base de données',
    'Archives de périodiques', 'Archives de monographies'
  ];

  devises: { label: string; code: string }[] = [
    { label: 'CAD — Dollar Canadien', code: 'CAD' },
    { label: 'USD — Dollar US',       code: 'USD' },
    { label: 'EUR — Euro',            code: 'EUR' },
    { label: 'GBP — Livre Sterling',  code: 'GBP' }
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
    // Pré-remplissage depuis sessionStorage (même logique que suggestion-public)
    const nom      = `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';
    const statut   = sessionStorage.getItem('groupeAdmin')  ?? '';

    this.form = this.fb.group({

      /* ── Identification ── */
      nom:                         [nom,      Validators.required],
      statut:                      [statut],
      courriel:                    [courriel, [Validators.required, Validators.email]],
      bibliotheque:                ['',       Validators.required],
      priorite_demande:            ['Régulier', Validators.required],

      /* ── Informations bibliographiques ── */
      titre_document:              ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre:                  ['', Validators.maxLength(500)],
      editeur:                     ['', [Validators.required, Validators.maxLength(300)]],
      isbn_issn:                   ['', [Validators.required, this.isbnValidator]],
      date_publication:            ['', Validators.required],
      source_information:          ['', [Validators.required, Validators.pattern('https?://.+')]],
      categorie_document:          ['', Validators.required],

      /* ── Format ── */
      format_support:              ['Imprimé/support physique', Validators.required],
      format_pret_numerique:       ['Ne s\'applique pas'],
      nombre_utilisateurs:         ['Accès illimité'],
      lien_plateforme:             [''],

      /* ── Finances ── */
      prix_cad:                    [null, [Validators.required, Validators.min(0.01)]],
      devise_originale:            ['', Validators.required],
      prix_devise_originale:       [null, [Validators.required, Validators.min(0.01)]],
      fonds_budgetaire:            ['', [Validators.required, Validators.pattern('^[A-Z]{2}-[0-9]{3}$')]],

      /* ── Réserve de cours ── */
      mettreReserve:               [false],
      reserve_cours_sigle:         [{ value: '', disabled: true }],
      reserve_cours_session:       [{ value: '', disabled: true }],
      reserve_cours_enseignant:    [{ value: '', disabled: true }],

      /* ── Notes ── */
      note_commentaire:            ['', Validators.maxLength(1000)],
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

    // Format électronique — afficher/masquer les champs spécifiques
    this.form.get('format_support')!.valueChanges.subscribe(val => {
      this.showElectronique = val === 'Électronique';
      const lien = this.form.get('lien_plateforme')!;
      if (this.showElectronique) {
        lien.setValidators([Validators.required, Validators.pattern('https?://.+')]);
      } else {
        lien.clearValidators();
      }
      lien.updateValueAndValidity();
    });

    // Conversion automatique du prix en CAD
    this.form.get('prix_devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());
    this.form.get('devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());
  }

  // Validateur ISBN / ISSN
  private isbnValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const clean = value.replace(/[\s-]/g, '');
    const isbn  = /^(97[89])?\d{9}[\dX]$/i;
    const issn  = /^\d{4}-\d{3}[\dX]$/i;
    return isbn.test(clean) || issn.test(value) ? null : { invalidIsbn: true };
  }

  private convertirPrix(): void {
    const prix   = this.form.get('prix_devise_originale')?.value;
    const devise = this.form.get('devise_originale')?.value;
    if (!prix || !devise) return;
    const taux: { [k: string]: number } = { USD: 1.368, EUR: 1.48, GBP: 1.73 };
    const prixCAD = devise === 'CAD' ? prix : prix * (taux[devise] || 1);
    this.form.get('prix_cad')?.setValue(parseFloat(prixCAD.toFixed(2)), { emitEvent: false });
  }

  get f() { return this.form.controls; }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched || this.submitted);
  }

  onReset(): void {
    this.submitted       = false;
    this.success         = false;
    this.error           = false;
    this.showReserveCours = false;
    this.showElectronique = false;
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

    // ✅ Capturer les données pour afficher dans l'écran de confirmation
    this.derniereTitre = v.titre_document;
    this.derniereBibliotheque = v.bibliotheque;
    this.dernierPrixCAD = v.prix_cad;

    // Structure identique à ce qu'attend le webhook n8n "nouvelle-demande-achat"
    const payload = {
      baseData: {
        formulaire_type:              'Nouvel achat unique',
        demandeur:                    v.nom,
        personne_a_aviser_activation: v.courriel,
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
        lien_plateforme:              v.lien_plateforme,
        prix_cad:                     v.prix_cad,
        devise_originale:             v.devise_originale,
        prix_devise_originale:        v.prix_devise_originale,
        fonds_budgetaire:             v.fonds_budgetaire,
        note_commentaire:             v.note_commentaire,
        statut_bibliotheque:          'Saisie en cours en bibliothèque',
        statut_acq:                   'En attente',
      },
      specificData: {
        type_monographie:         null,
        format_electronique:      v.showElectronique ? v.format_pret_numerique : null,
        reserve_cours:            v.mettreReserve,
        reserve_cours_sigle:      v.mettreReserve ? v.reserve_cours_sigle    : null,
        reserve_cours_session:    v.mettreReserve ? v.reserve_cours_session   : null,
        reserve_cours_enseignant: v.mettreReserve ? v.reserve_cours_enseignant : null,
      },
      formulaire_type: 'Nouvel achat unique',

      // Champs de surface pour le courriel admin n8n
      usager_nom:      v.nom,
      usager_courriel: v.courriel,
      usager_statut:   v.statut,
      type_formulaire: 'Nouvel achat unique',
    };

    this.reponsesService.envoyerNouvelAchat(payload).subscribe({
      next: () => {
        this.success   = true;
        this.isLoading = false;
        // ✅ NE PAS réinitialiser immédiatement, garder les données pour l'écran de confirmation
      },
      error: () => {
        this.error     = true;
        this.isLoading = false;
      }
    });
  }
}