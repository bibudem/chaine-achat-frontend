import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReponsesService } from '../../../../services/reponses.service';

@Component({
  selector: 'app-suggestion-public',
  templateUrl: './suggestion-public.component.html',
  styleUrls: ['./suggestion-public.component.css']
})
export class SuggestionPublicComponent implements OnInit {
  form!: FormGroup;
  submitted        = false;
  success          = false;
  error            = false;
  isLoading        = false;
  showSigleCours   = false;
  showElectronique = false;

  derniereTitre    = '';
  derniereCourriel = '';
  dernierNom       = '';

  bibliotheques: string[] = [
    'Aménagement', 'Campus Laval', 'Droit', 'Du Parc',
    'Hubert-Reeves', 'Kinésiologie', 'L.S.H.', 'Livres rares',
    'Mathématiques-Informatique', 'Médecine vétérinaire', 'Musique',
    "Marguerite-d'Youville", 'Santé', 'Service Accessibilité', 'TGD', 'TEST-DRIN'
  ];

  priorites: string[] = ['Régulier', 'Prioritaire', 'Urgent'];

  constructor(
    private fb: FormBuilder,
    private reponsesService: ReponsesService
  ) {}

  ngOnInit(): void {
    const nom      = `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
    const statut   = sessionStorage.getItem('groupeAdmin') ?? '';
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';

    this.form = this.fb.group({

      /* ── Identification ── */
      nom:                      [nom,      Validators.required],
      statut:                   [statut,   Validators.required],
      usager_faculte:           ['',       Validators.required],
      courriel:                 [courriel, [Validators.required, Validators.email]],
      copieCourriel:            [true],
      bibliotheque:             ['',       Validators.required],
      priorite_demande:         ['Urgent', Validators.required],
      bibliothecaire_disciplinaire: ['',   [Validators.required, Validators.email]],

      /* ── Description ── */
      categorie_document:       [''],
      titre_document:           ['',       Validators.required],
      auteur:                   ['',       Validators.required],
      editeur:                  [''],
      edition:                  [''],
      date_publication:         [''],
      source_information:       ['',       Validators.pattern('https?://.+')],
      isbn_issn:                ['',       [Validators.required, this.isbnValidator]],
      format_support:           [''],
      format_electronique:      [''],
      acces_electronique:       [''],
      note_commentaire:         [''],

      /* ── Réservation ── */
      aviser_reservation:       [false],
      aviser_reception:         [false],

      /* ── Section enseignant ── */
      date_requise_cours:       [''],
      reserve_cours:            [false],
      reserve_cours_sigle:      [{ value: '', disabled: true }],
    });

    // Réserve de cours — activer/désactiver le sigle
    this.form.get('reserve_cours')!.valueChanges.subscribe(val => {
      this.showSigleCours = val;
      val
        ? this.form.get('reserve_cours_sigle')!.enable()
        : this.form.get('reserve_cours_sigle')!.disable();
    });

    // Format électronique — afficher/masquer les champs spécifiques
    this.form.get('format_support')!.valueChanges.subscribe(val => {
      this.showElectronique = val === 'Électronique';
      const url = this.form.get('source_information')!;
      if (this.showElectronique) {
        url.setValidators([Validators.required, Validators.pattern('https?://.+')]);
      } else {
        url.clearValidators();
      }
      url.updateValueAndValidity();
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

  // Suppression automatique des tirets dans isbn_issn à la saisie
  stripDashes(event: Event): void {
    const input    = event.target as HTMLInputElement;
    const stripped = input.value.replace(/-/g, '');
    if (stripped !== input.value) {
      this.form.get('isbn_issn')?.setValue(stripped, { emitEvent: true });
    }
  }

  get f() { return this.form.controls; }

  onReset(): void {
    this.submitted       = false;
    this.success         = false;
    this.error           = false;
    this.showSigleCours  = false;
    this.showElectronique = false;
    this.form.reset({
      priorite_demande:   'Urgent',
      copieCourriel:      true,
      aviser_reservation: false,
      aviser_reception:   false,
      reserve_cours:      false,
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isLoading = true;
    const v = this.form.getRawValue();

    this.derniereTitre    = v.titre_document;
    this.derniereCourriel = v.courriel;
    this.dernierNom       = v.nom;

    const payload = {
      /* Identification */
      nom:                          v.nom,
      usager_statut:                v.statut,
      usager_faculte:               v.usager_faculte,
      usager_courriel:              v.courriel,
      priorite_demande:             v.priorite_demande,
      copieCourriel:                v.copieCourriel,
      bibliotheque:                 v.bibliotheque,
      bibliothecaire_disciplinaire: v.bibliothecaire_disciplinaire,

      /* Description */
      categorie_document:           v.categorie_document,
      titre_document:               v.titre_document,
      auteur:                       v.auteur,
      editeur:                      v.editeur,
      edition:                      v.edition,
      date_publication:             v.date_publication,
      source_information:           v.source_information,
      isbn_issn:                    v.isbn_issn,
      format_support:               v.format_support,
      format_electronique:          this.showElectronique ? v.format_electronique : null,
      acces_electronique:           this.showElectronique ? v.acces_electronique : null,
      note_commentaire:             v.note_commentaire,

      /* Réservation */
      aviser_reservation:           v.aviser_reservation,
      aviser_reception:             v.aviser_reception,

      /* Enseignant */
      date_requise_cours:           v.date_requise_cours,
      reserve_cours:                v.reserve_cours,
      reserve_cours_sigle:          v.reserve_cours ? v.reserve_cours_sigle : null,
    };

    this.reponsesService.envoyerSuggestion(payload).subscribe({
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
