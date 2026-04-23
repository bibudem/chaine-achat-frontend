import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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

  typesRequete: string[] = ['Information', 'Modification', 'Annulation', 'Autre'];

  projetsSpeciaux: string[] = [
    'Premiers peuples', 'Collection bien-être', 'Mini-école de santé',
    "Soutien à l'Ukraine", 'Transition vers le numérique', "Ne s'applique pas"
  ];

  besoinsFormat: string[] = [
    "Électronique : écrire à l'éditeur pour version numérique gratuite",
    'Électronique : acheter licence institutionnelle standard + version numérique gratuite',
    'Électronique : acheter licence institutionnelle standard',
    'Imprimé/support physique : acheter exemplaires + version numérique gratuite',
    "Imprimé/support physique : acheter exemplaire sans version numérique"
  ];

  readonly OUI_NON_NA = ['OUI', 'NON', "Ne s'applique pas"];

  derniereTitre        = '';
  derniereBibliotheque = '';

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
      nom:                          [nom,       Validators.required],
      statut:                       [statut],
      courriel:                     [courriel,  [Validators.required, Validators.email]],
      bibliotheque:                 ['',        Validators.required],
      fonds_budgetaire:             ['',        [Validators.required, Validators.maxLength(200), Validators.pattern('^[A-Za-z]{2,4}-\\d{2,}$')]],
      priorite_demande:             ['Urgent',  Validators.required],

      /* ── Document ── */
      titre_document:               ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre:                   ['', Validators.maxLength(500)],
      editeur:                      ['', Validators.maxLength(300)],
      isbn_issn:                    ['', [Validators.required, this.isbnValidator]],
      id_ressource:                 ['', Validators.maxLength(100)],
      date_publication:             [''],
      categorie_document:           ['', Validators.required],

      /* ── Requête Accessibilité (spécifique) ── */
      type_requete:                   ['', Validators.required],
      reference_usager:               [''],
      description_requete:            [''],
      action_demandee:                [''],
      besoin_specifique_format:       [''],
      permalien_sofia:                ['', Validators.pattern('https?://.+')],

      /* ── Format et support ── */
      format_support:                 ['Imprimé/support physique', Validators.required],
      format_pret_numerique:          ["Ne s'applique pas"],
      personne_a_aviser_activation:   [{ value: '', disabled: true }, Validators.email],

      /* ── Vérifications Accessibilité ── */
      fournisseur_contacte_sans_succes: [''],
      exemplaire_papier_detenu:         [''],
      exemplaire_electronique_detenu:   [''],
      verification_caeb:                [''],
      verification_sqla:                [''],
      verification_emma:                [''],

      /* ── Acquisitions ── */
      acq_numerisation_recommandee:  [''],
      acq_date_demande_editeur:      [''],
      acq_date_livraison_estimee:    [''],

      /* ── Informations complémentaires ── */
      projet_special:               [''],
      fonds_sn_projet:              ['', Validators.maxLength(50)],
      source_information:           ['', Validators.pattern('https?://.+')],
      note_commentaire:             ['', Validators.maxLength(1000)],
    });

    // Format — champs conditionnels
    this.form.get('format_support')!.valueChanges.subscribe(val => {
      this.showElectronique = val === 'Électronique' || val === 'Imprimé et électronique';
      const personne = this.form.get('personne_a_aviser_activation')!;
      this.showElectronique ? personne.enable() : personne.disable();
      personne.updateValueAndValidity();
    });
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
    this.form.reset({
      priorite_demande:      'Urgent',
      format_support:        'Imprimé/support physique',
      format_pret_numerique: "Ne s'applique pas",
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
        formulaire_type:              'Requête Accessibilité',
        demandeur:                    v.nom,
        personne_a_aviser_activation: this.showElectronique ? v.personne_a_aviser_activation : null,
        bibliotheque:                 v.bibliotheque,
        fonds_budgetaire:             v.fonds_budgetaire,
        priorite_demande:             v.priorite_demande,
        titre_document:               v.titre_document,
        sous_titre:                   v.sous_titre,
        editeur:                      v.editeur,
        isbn_issn:                    v.isbn_issn,
        id_ressource:                 v.id_ressource,
        date_publication:             v.date_publication,
        categorie_document:           v.categorie_document,
        format_support:               v.format_support,
        format_pret_numerique:        this.showElectronique ? v.format_pret_numerique : null,
        projet_special:               v.projet_special,
        fonds_sn_projet:              v.fonds_sn_projet,
        source_information:           v.source_information,
        note_commentaire:             v.note_commentaire,
        statut_bibliotheque:          'Saisie en cours - En attente',
        statut_acq:                   'En attente',
      },
      specificData: {
        type_requete:                     v.type_requete,
        reference_usager:                 v.reference_usager,
        description_requete:              v.description_requete,
        action_demandee:                  v.action_demandee,
        besoin_specifique_format:         v.besoin_specifique_format,
        permalien_sofia:                  v.permalien_sofia,
        fournisseur_contacte_sans_succes: v.fournisseur_contacte_sans_succes,
        exemplaire_papier_detenu:         v.exemplaire_papier_detenu,
        exemplaire_electronique_detenu:   v.exemplaire_electronique_detenu,
        verification_caeb:                v.verification_caeb,
        verification_sqla:                v.verification_sqla,
        verification_emma:                v.verification_emma,
        acq_numerisation_recommandee:     v.acq_numerisation_recommandee,
        acq_date_demande_editeur:         v.acq_date_demande_editeur,
        acq_date_livraison_estimee:       v.acq_date_livraison_estimee,
      },
    };

    this.reponsesService.envoyerRequeteAccessibilite(payload).subscribe({
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
