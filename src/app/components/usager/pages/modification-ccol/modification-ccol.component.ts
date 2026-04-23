import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReponsesService } from '../../../../services/reponses.service';

@Component({
  selector: 'app-modification-ccol',
  templateUrl: './modification-ccol.component.html',
  styleUrls: ['./modification-ccol.component.css']
})
export class ModificationCcolComponent implements OnInit {
  form!: FormGroup;
  submitted        = false;
  success          = false;
  error            = false;
  isLoading        = false;
  showElectronique = false;
  showImprime      = true;

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

  precisionsDemande: string[] = [
    'Achat de complément de collection (CCOL) pour abonnement (courant ou ancien)',
    'Achat de numéro de périodique hors abonnement',
    "Achat d'archives de périodiques (web)",
    "Achat en vue d'un NABO",
    "Annulation d'abonnement",
    'Cesse de paraître',
    "Changement de support — vers l'électronique",
    'Changement de titre',
    'Création de notice pour abonnement courant',
    "Modification du nombre d'utilisateurs",
    'Complément de collection'
  ];

  projetsSpeciaux: string[] = [
    'Premiers peuples', 'Collection bien-être', 'Mini-école de santé',
    "Soutien à l'Ukraine", 'Transition vers le numérique', "Ne s'applique pas"
  ];

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
      nom:                          [nom,      Validators.required],
      statut:                       [statut],
      courriel:                     [courriel, [Validators.required, Validators.email]],
      bibliotheque:                 ['',       Validators.required],
      fonds_budgetaire:             ['',       [Validators.required, Validators.maxLength(200), Validators.pattern('^[A-Za-z]{2,4}-\\d{2,}$')]],

      /* ── Document / Abonnement ── */
      titre_document:               ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre:                   ['', Validators.maxLength(500)],
      editeur:                      ['', Validators.maxLength(300)],
      isbn_issn:                    ['', [Validators.required, this.isbnValidator]],
      id_ressource:                 ['', Validators.maxLength(100)],
      date_publication:             [''],
      categorie_document:           ['', Validators.required],

      /* ── Précision de la demande (spécifique CCOL) ── */
      precision_demande:            ['', Validators.required],
      numero_oclc:                  [''],
      date_debut_abonnement:        [''],
      collection:                   [''],
      periode_couverte:             [''],
      catalogage:                   [''],

      /* ── Format et support ── */
      format_support:               ['Imprimé/support physique', Validators.required],
      localisation_emplacement:     [''],
      creation_notice_dtdm:         [true],
      lien_plateforme:              [''],
      nombre_utilisateurs:          ['Accès illimité'],
      nombre_titres_inclus:         [null, Validators.min(1)],
      personne_a_aviser_activation: [{ value: '', disabled: true }, Validators.email],

      /* ── Informations complémentaires ── */
      projet_special:               [''],
      fonds_sn_projet:              ['', Validators.maxLength(50)],
      source_information:           ['', [Validators.required, Validators.pattern('https?://.+')]],

      /* ── Notes ── */
      note_commentaire:             ['', Validators.maxLength(1000)],
    });

    // Format — champs conditionnels + création notice
    this.form.get('format_support')!.valueChanges.subscribe(val => {
      this.showElectronique = val === 'Électronique' || val === 'Imprimé et électronique';
      this.showImprime      = val === 'Imprimé/support physique' || val === 'Imprimé et électronique';

      const lien     = this.form.get('lien_plateforme')!;
      const personne = this.form.get('personne_a_aviser_activation')!;

      // Création de notice TDM : OUI par défaut sauf si format pur Électronique
      this.form.get('creation_notice_dtdm')!.setValue(val !== 'Électronique', { emitEvent: false });

      if (this.showElectronique) {
        lien.setValidators([Validators.required, Validators.pattern('https?://.+')]);
        personne.enable();
      } else {
        lien.clearValidators();
        personne.disable();
      }
      lien.updateValueAndValidity();
      personne.updateValueAndValidity();
    });
  }

  // Validateur ISBN / ISSN — tirets refusés (auto-supprimés à la saisie)
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
      format_support:       'Imprimé/support physique',
      nombre_utilisateurs:  'Accès illimité',
      creation_notice_dtdm: true,
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
        formulaire_type:              'Modification et CCOL',
        demandeur:                    v.nom,
        personne_a_aviser_activation: this.showElectronique ? v.personne_a_aviser_activation : null,
        bibliotheque:                 v.bibliotheque,
        fonds_budgetaire:             v.fonds_budgetaire,
        titre_document:               v.titre_document,
        sous_titre:                   v.sous_titre,
        editeur:                      v.editeur,
        isbn_issn:                    v.isbn_issn,
        id_ressource:                 v.id_ressource,
        date_publication:             v.date_publication,
        categorie_document:           v.categorie_document,
        format_support:               v.format_support,
        localisation_emplacement:     this.showImprime ? v.localisation_emplacement : null,
        creation_notice_dtdm:         v.creation_notice_dtdm,
        lien_plateforme:              this.showElectronique ? v.lien_plateforme : null,
        nombre_utilisateurs:          this.showElectronique ? v.nombre_utilisateurs : null,
        nombre_titres_inclus:         this.showElectronique ? v.nombre_titres_inclus : null,
        projet_special:               v.projet_special,
        fonds_sn_projet:              v.fonds_sn_projet,
        source_information:           v.source_information,
        note_commentaire:             v.note_commentaire,
        statut_bibliotheque:          'Saisie en cours - En attente',
        statut_acq:                   'En attente',
      },
      specificData: {
        precision_demande:     v.precision_demande,
        numero_oclc:           v.numero_oclc,
        date_debut_abonnement: v.date_debut_abonnement,
        collection:            v.collection,
        periode_couverte:      v.periode_couverte,
        catalogage:            v.catalogage,
      },
    };

    this.reponsesService.envoyerModificationCcol(payload).subscribe({
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
