import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReponsesService } from '../../../services/reponses.service';

/**
 * Formulaire public de suggestion d'achat — autonome, sans en-tête ni pied de page de
 * l'application, sans authentification pour l'instant, destiné à être intégré via <iframe>
 * sur un site public externe. Route : /suggestion-public (racine, pas sous /usager — voir
 * app-routing.module.ts), sans AuthGuard.
 *
 * Cloné de usager/pages/suggestion-public/suggestion-public.component.ts, avec les
 * adaptations nécessaires à l'absence de session, et les champs alignés sur le formulaire de
 * référence externe (fourni par l'usagère) :
 *  - Nom/courriel du demandeur : champs éditables (au lieu de pré-remplis/désactivés depuis
 *    sessionStorage, qui n'existe pas hors session authentifiée).
 *  - Pas de mode édition (paramètre ?id=) : usage public à sens unique, il n'y a pas de
 *    « mes demandes » accessible sans compte pour revenir modifier un envoi.
 *  - Section « Bibliothèque » (statut de la demande, note interne, pièces déjà envoyées)
 *    retirée : ce sont des contrôles internes au personnel, pas destinés au grand public.
 *    La demande est toujours soumise avec statut_bibliotheque = « Saisie en cours - En
 *    attente » (file d'attente interne, pour révision avant envoi formel aux ACQ).
 *  - Une seule identité (le formulaire de référence n'a pas de distinction demandeur/usager) :
 *    plus de champ « Nom de l'usager » séparé, usager_nom = nom à l'envoi.
 *  - Priorité, bibliothèque cible et bibliothécaire disciplinaire : retirés du formulaire
 *    public (absents du formulaire de référence) — assignés par les ACQ à la révision
 *    interne plutôt que choisis par le grand public.
 *  - « Aviser à la réception » retiré (le formulaire de référence n'a qu'une seule question
 *    de réservation, « Réserver le document à son arrivée »).
 *  - Pièce jointe retirée : absente du formulaire de référence, pas de champ correspondant
 *    ici.
 *  - Écran de confirmation affiché sur place plutôt qu'une redirection vers /usager/profil,
 *    qui n'a pas de sens hors session/iframe.
 *
 * TODO auth : quand une authentification sera ajoutée à ce formulaire public, réévaluer si
 * nom/courriel doivent redevenir pré-remplis/verrouillés depuis l'identité authentifiée.
 */
@Component({
  selector: 'app-suggestion-embed',
  templateUrl: './suggestion-embed.component.html',
  styleUrls: ['./suggestion-embed.component.css']
})
export class SuggestionEmbedComponent implements OnInit {
  form!: FormGroup;
  submitted      = false;
  success        = false;
  error          = false;
  isLoading      = false;
  showSigleCours = false;

  typesDocument: string[] = ['Livre', 'Périodique', 'Document audiovisuel', 'Base de données', 'Autre'];

  constructor(
    private fb: FormBuilder,
    private reponsesService: ReponsesService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nom:                          ['', Validators.required],
      courriel:                     ['', [Validators.required, Validators.email]],
      statut:                       ['', Validators.required],
      usager_faculte:               ['', Validators.required],
      type_document:                ['', Validators.required],
      titre_document:               ['', Validators.required],
      auteur:                       ['', Validators.required],
      editeur:                      [''],
      edition:                      [''],
      date_publication:             [''],
      source_information:           ['', Validators.pattern('https?://.+')],
      isbn_issn:                    ['', this.isbnValidator],
      note_usager:                  [''],
      aviser_reservation:           [false],
      date_requise_cours:           [''],
      reserve_cours:                [false],
      reserve_cours_sigle:          [{ value: '', disabled: true }],
      reserve_cours_session:        [{ value: '', disabled: true }],
      reserve_cours_enseignant:     [{ value: '', disabled: true }],
    }, { validators: this.anneeOuSourceValidator });

    this.form.get('reserve_cours')!.valueChanges.subscribe(val => {
      this.showSigleCours = val;
      const toggle = (ctrl: string) => val
        ? this.form.get(ctrl)!.enable()
        : this.form.get(ctrl)!.disable();
      toggle('reserve_cours_sigle');
      toggle('reserve_cours_session');
      toggle('reserve_cours_enseignant');
    });
  }

  // Le formulaire de référence n'a qu'un seul champ « Année de publication ou source Internet
  // (URL) » obligatoire. On garde nos deux champs distincts (date structurée + URL — le
  // premier alimente une colonne de type date en base, on évite d'y écrire du texte libre),
  // mais on exige qu'au moins l'un des deux soit rempli, pour préserver la même contrainte.
  private anneeOuSourceValidator(group: AbstractControl): ValidationErrors | null {
    const date   = group.get('date_publication')?.value;
    const source = group.get('source_information')?.value;
    return date || source ? null : { anneeOuSourceRequis: true };
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

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isLoading = true;
    const v = this.form.getRawValue();

    // Édition : pas de colonne dédiée en base pour ce champ public — on l'ajoute au début des
    // notes plutôt que de l'abandonner silencieusement.
    const noteAvecEdition = v.edition
      ? `Édition : ${v.edition}${v.note_usager ? '\n\n' + v.note_usager : ''}`
      : v.note_usager;

    const reponses = {
      demandeur:                    v.nom,
      // Le formulaire de référence ne distingue pas demandeur/usager : une seule identité.
      usager_nom:                   v.nom,
      usager_statut:                v.statut,
      usager_faculte:               v.usager_faculte,
      usager_courriel:              v.courriel,
      // Priorité, bibliothèque cible et bibliothécaire disciplinaire : non demandés au grand
      // public dans le formulaire de référence — assignés par les ACQ à la révision interne.
      priorite_demande:             'Régulier',
      bibliotheque:                 null,
      bibliothecaire_disciplinaire: null,
      categorie_document:           v.type_document,
      titre_document:               v.titre_document,
      auteur:                       v.auteur,
      editeur:                      v.editeur,
      date_publication:             v.date_publication,
      source_information:           v.source_information,
      isbn_issn:                    v.isbn_issn,
      format_support:               null,
      note_usager:                  noteAvecEdition,
      aviser_reservation:           v.aviser_reservation,
      // Pas de champ « Aviser à la réception » distinct dans le formulaire de référence.
      aviser_reception:             false,
      date_requise_cours:           v.date_requise_cours || null,
      reserve_cours:                v.reserve_cours,
      reserve_cours_sigle:          v.reserve_cours ? v.reserve_cours_sigle      : null,
      reserve_cours_session:        v.reserve_cours ? v.reserve_cours_session    : null,
      reserve_cours_enseignant:     v.reserve_cours ? v.reserve_cours_enseignant : null,
      bordereau_imprime:            'Non',
      acq_responsable_courriel:     null,
      techdoc_suggestion_transmise: false,
      acq_raison_annulation:        null,
      acq_isbn:                     null,
      // Pas de contrôle de statut exposé publiquement — la demande attend une révision
      // interne avant d'être formellement soumise aux ACQ (voir commentaire d'en-tête).
      statut_bibliotheque:          'Saisie en cours - En attente',
      bibliotheque_note_interne:    null,
    };

    this.reponsesService
      .envoyerSuggestionPublique({ nom: v.nom, courriel: v.courriel, statut: v.statut }, reponses)
      .subscribe({
        next: () => { this.isLoading = false; this.success = true; },
        error: () => { this.isLoading = false; this.error = true; }
      });
  }
}
