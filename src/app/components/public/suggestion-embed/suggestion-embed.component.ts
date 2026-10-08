import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ReponsesService } from '../../../services/reponses.service';
import { AuthService } from '../../../services/auth.service';

/**
 * Formulaire public de suggestion d'achat — autonome, sans en-tête ni pied de page de
 * l'application, destiné à être intégré via <iframe> sur le site des Bibliothèques. Route :
 * /suggestion-public (racine, pas sous /usager — voir app-routing.module.ts). Seule page
 * accessible à la communauté UdeM (rôle Usager).
 *
 * Connexion UdeM obligatoire, mais pas d'AuthGuard : sa redirection vers /login ne marcherait
 * pas dans l'iframe (Microsoft refuse de s'y afficher). Le composant affiche un écran de
 * connexion qui ouvre Azure AD dans une popup (AuthService.loginWithPopup).
 *
 * La suggestion envoyée entre dans la file de tri de l'équipe TechDoc (/usager/tri) — pas
 * directement aux ACQ. Le demandeur est avisé par courriel de la décision de l'équipe.
 *
 * Cloné de usager/pages/suggestion-public/suggestion-public.component.ts, avec les champs
 * alignés sur le formulaire de référence externe (fourni par l'usagère) :
 *  - Nom/courriel du demandeur : pré-remplis et verrouillés depuis la session ; le backend
 *    les reprend de toute façon du JWT (POST /reponses/suggestion-publique).
 *  - Pas de mode édition (paramètre ?id=) : usage public à sens unique, la communauté UdeM
 *    n'a pas accès à « Mes demandes » pour revenir modifier un envoi.
 *  - Section « Bibliothèque » (statut de la demande, note interne, pièces déjà envoyées)
 *    retirée : ce sont des contrôles internes au personnel, pas destinés au grand public.
 *    La demande est toujours soumise avec statut_bibliotheque = « Saisie en cours - En
 *    attente » (file d'attente interne, pour révision avant envoi formel aux ACQ).
 *  - Une seule identité (le formulaire de référence n'a pas de distinction demandeur/usager) :
 *    plus de champ « Nom de l'usager » séparé, usager_nom = nom à l'envoi.
 *  - Priorité, bibliothèque cible et bibliothécaire disciplinaire : retirés du formulaire
 *    public (absents du formulaire de référence) — assignés par les ACQ à la révision
 *    interne plutôt que choisis par le grand public.
 *  - « Aviser à la réception » : pas de question distincte posée ici (le formulaire de
 *    référence n'a qu'une seule question de réservation, « Réserver le document à son
 *    arrivée »), mais toujours envoyé à `true` — la politique est que l'usager et le/la
 *    bibliothécaire disciplinaire sont systématiquement avisés à la réception.
 *  - Pièce jointe retirée : absente du formulaire de référence, pas de champ correspondant
 *    ici.
 *  - Écran de confirmation affiché sur place plutôt qu'une redirection vers /usager/profil,
 *    inaccessible à la communauté UdeM.
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

  /** Session UdeM active dans cet iframe. */
  connecte          = false;
  connexionEnCours  = false;
  popupBloquee      = false;
  readonly urlPleinePage = '/suggestion-public';

  typesDocument: string[] = ['Livre', 'Périodique', 'Document audiovisuel', 'Base de données', 'Autre'];

  constructor(
    private fb: FormBuilder,
    private reponsesService: ReponsesService,
    public  authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.connecte = this.authService.isLoggedIn;
    this.form = this.fb.group({
      nom:                          [{ value: '', disabled: true }],
      courriel:                     [{ value: '', disabled: true }],
      statut:                       ['', Validators.required],
      usager_faculte:               ['', Validators.required],
      type_document:                ['', Validators.required],
      titre_document:               ['', Validators.required],
      sous_titre:                   [''],
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

    this.remplirIdentite();
  }

  private remplirIdentite(): void {
    this.form.patchValue({
      nom:      `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim(),
      courriel: sessionStorage.getItem('courrielAdmin') ?? '',
    });
  }

  async seConnecter(): Promise<void> {
    this.popupBloquee = false;
    this.connexionEnCours = true;
    const ok = await this.authService.loginWithPopup();
    this.connexionEnCours = false;
    if (!ok) {
      // Popup bloquée par le navigateur (ou échec de validation du token).
      this.popupBloquee = true;
      return;
    }
    this.connecte = true;
    this.remplirIdentite();
  }

  seDeconnecter(): void {
    this.authService.logout();
  }

  nouvelleSuggestion(): void {
    this.success = false;
    this.submitted = false;
    this.form.reset({ aviser_reservation: false, reserve_cours: false });
    this.remplirIdentite();
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
      sous_titre:                   v.sous_titre,
      auteur:                       v.auteur,
      editeur:                      v.editeur,
      date_publication:             v.date_publication,
      source_information:           v.source_information,
      isbn_issn:                    v.isbn_issn,
      format_support:               null,
      note_usager:                  noteAvecEdition,
      aviser_reservation:           v.aviser_reservation,
      // Pas de champ « Aviser à la réception » distinct dans le formulaire de référence —
      // mais la politique est désormais que l'usager et le/la bibliothécaire disciplinaire
      // sont TOUJOURS avisés à la réception (voir suggestion-public.component.ts, même
      // changement), donc true même si la question n'est pas posée ici.
      aviser_reception:             true,
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
      .envoyerSuggestionPublique(v.statut, reponses)
      .subscribe({
        next: () => { this.isLoading = false; this.success = true; },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          // Session expirée : on redemande la connexion, la saisie reste dans le formulaire.
          if (err.status === 401) { this.connecte = false; return; }
          this.error = true;
        }
      });
  }
}
