import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
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
  editId: number | null = null;

  derniereTitre    = '';
  derniereCourriel = '';

  fichiersJoints: File[] = [];
  onFichiersJointsChange(fichiers: File[]): void {
    this.fichiersJoints = fichiers;
  }

  /** Envoie les pièces jointes accumulées vers la réponse une fois son id connu.
   *  `onDone` est appelé une fois l'envoi terminé (succès ou échec) — la navigation
   *  attend ce résultat pour pouvoir avertir l'usager en cas d'échec, plutôt que de
   *  naviguer immédiatement vers une page où l'erreur ne serait plus jamais visible. */
  private uploaderPiecesJointes(reponseId: number, onDone: (echec: boolean) => void): void {
    if (!this.fichiersJoints.length) { onDone(false); return; }
    this.reponsesService.uploaderPiecesJointes(reponseId, this.fichiersJoints).subscribe({
      next: () => onDone(false),
      error: (err) => { console.error('[SuggestionPublic] uploaderPiecesJointes:', err); onDone(true); }
    });
  }

  bibliotheques: string[] = [
    'Aménagement', 'Campus Laval', 'Droit', 'Du Parc',
    'Hubert-Reeves', 'Kinésiologie', 'L.S.H.', 'Livres rares',
    'Mathématiques-Informatique', 'Médecine vétérinaire', 'Musique',
    "Marguerite-d'Youville", 'Santé', 'Service Accessibilité', 'TGD',
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

  constructor(
    private fb: FormBuilder,
    private reponsesService: ReponsesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const nom      = `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
    const statut   = sessionStorage.getItem('groupeAdmin')   ?? '';
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';

    this.form = this.fb.group({
      nom:                          [{ value: nom, disabled: true },      Validators.required],
      courriel:                     [{ value: courriel, disabled: true }, [Validators.required, Validators.email]],
      copieCourriel:                [true],
      priorite_demande:             ['Urgent', Validators.required],
      usager_nom:                   ['',       Validators.required],
      statut:                       [statut,   Validators.required],
      usager_faculte:               ['',       Validators.required],
      bibliotheque:                 ['',       Validators.required],
      bibliothecaire_disciplinaire: ['',        [Validators.required, Validators.email]],
      titre_document:               ['', Validators.required],
      auteur:                       ['', Validators.required],
      editeur:                      [''],
      date_publication:             [''],
      source_information:           ['', Validators.pattern('https?://.+')],
      isbn_issn:                    ['', [Validators.required, this.isbnValidator]],
      note_usager:                  [''],
      aviser_reservation:           [false],
      aviser_reception:             [false],
      date_requise_cours:           [''],
      reserve_cours:                [false],
      reserve_cours_sigle:          [{ value: '', disabled: true }],
      reserve_cours_session:        [{ value: '', disabled: true }],
      reserve_cours_enseignant:     [{ value: '', disabled: true }],
      statut_bibliotheque:          ['Saisie en cours - En attente'],
      bibliotheque_note_interne:             ['', Validators.maxLength(1000)],
    });

    this.form.get('reserve_cours')!.valueChanges.subscribe(val => {
      this.showSigleCours = val;
      const toggle = (ctrl: string) => val
        ? this.form.get(ctrl)!.enable()
        : this.form.get(ctrl)!.disable();
      toggle('reserve_cours_sigle');
      toggle('reserve_cours_session');
      toggle('reserve_cours_enseignant');
    });

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
        const d = row.reponses ?? {};
        if (d.reserve_cours) this.form.get('reserve_cours')!.setValue(d.reserve_cours);
        this.form.patchValue({
          usager_nom:                   d.usager_nom,
          statut:                       d.usager_statut,
          usager_faculte:               d.usager_faculte,
          bibliotheque:                 d.bibliotheque,
          priorite_demande:             d.priorite_demande,
          bibliothecaire_disciplinaire: d.bibliothecaire_disciplinaire,
          titre_document:               d.titre_document,
          auteur:                       d.auteur,
          editeur:                      d.editeur,
          date_publication:             d.date_publication,
          source_information:           d.source_information,
          isbn_issn:                    d.isbn_issn,
          note_usager:                  d.note_usager,
          aviser_reservation:           d.aviser_reservation,
          aviser_reception:             d.aviser_reception,
          date_requise_cours:           d.date_requise_cours,
          reserve_cours_sigle:          d.reserve_cours_sigle,
          reserve_cours_session:        d.reserve_cours_session,
          reserve_cours_enseignant:     d.reserve_cours_enseignant,
          statut_bibliotheque:          d.statut_bibliotheque,
          bibliotheque_note_interne:             d.bibliotheque_note_interne,
        });
      }
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

  onReset(): void {
    this.submitted      = false;
    this.success        = false;
    this.error          = false;
    this.showSigleCours = false;
    this.form.reset({
      // form.reset() efface aussi les champs désactivés (nom/courriel) s'ils ne sont pas
      // explicitement fournis ici — on les réinjecte depuis l'authentification.
      nom:                  `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim(),
      courriel:             sessionStorage.getItem('courrielAdmin') ?? '',
      priorite_demande:    'Urgent',
      copieCourriel:       true,
      aviser_reservation:  false,
      aviser_reception:    false,
      reserve_cours:       false,
      statut_bibliotheque: 'Saisie en cours - En attente',
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isLoading = true;
    const v = this.form.getRawValue();

    this.derniereTitre    = v.titre_document;
    this.derniereCourriel = v.courriel;

    const payload = {
      demandeur:                    v.nom,
      usager_nom:                   v.usager_nom,
      usager_statut:                v.statut,
      usager_faculte:               v.usager_faculte,
      usager_courriel:              v.courriel,
      priorite_demande:             v.priorite_demande,
      bibliotheque:                 v.bibliotheque,
      bibliothecaire_disciplinaire: v.bibliothecaire_disciplinaire,
      // Type de document et Format/Support : retirés du formulaire usager — champs
      // complétés par les ACQ (section « ACQ : Suivi de la demande »).
      categorie_document:           null,
      titre_document:               v.titre_document,
      auteur:                       v.auteur,
      editeur:                      v.editeur,
      date_publication:             v.date_publication,
      source_information:           v.source_information,
      isbn_issn:                    v.isbn_issn,
      format_support:               null,
      note_usager:                  v.note_usager,
      aviser_reservation:           v.aviser_reservation,
      aviser_reception:             v.aviser_reception,
      date_requise_cours:           v.date_requise_cours || null,
      reserve_cours:                v.reserve_cours,
      reserve_cours_sigle:          v.reserve_cours ? v.reserve_cours_sigle    : null,
      reserve_cours_session:        v.reserve_cours ? v.reserve_cours_session  : null,
      reserve_cours_enseignant:     v.reserve_cours ? v.reserve_cours_enseignant : null,
      bordereau_imprime:            'Non',
      acq_responsable_courriel:     null,
      techdoc_suggestion_transmise: false,
      acq_raison_annulation:        null,
      acq_isbn:                     null,
      statut_bibliotheque:          v.statut_bibliotheque,
      bibliotheque_note_interne:             v.bibliotheque_note_interne,
    };

    const obs = this.editId
      ? this.reponsesService.updateReponse(this.editId, payload)
      : this.reponsesService.envoyerSuggestion(payload);

    obs.subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const reponseId = this.editId ?? res?.id;
        if (reponseId) {
          this.uploaderPiecesJointes(reponseId, (echec) => this.naviguerApresSoumission(echec));
        } else {
          this.naviguerApresSoumission(false);
        }
      },
      error: () => { this.isLoading = false; this.error = true; }
    });
  }

  private naviguerApresSoumission(echecPieceJointe: boolean): void {
    const message = echecPieceJointe
      ? "Votre demande a été soumise avec succès, mais l'envoi de la pièce jointe a échoué. Vous pouvez réessayer en modifiant votre demande."
      : 'Votre demande a été soumise avec succès.';
    this.router.navigate(['/usager/profil'], { state: { message } });
  }

  onSave(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    this.isLoading = true;
    const v = this.form.getRawValue();
    const payload = {
      demandeur:                    v.nom,
      usager_nom:                   v.usager_nom,
      usager_statut:                v.statut,
      usager_faculte:               v.usager_faculte,
      usager_courriel:              v.courriel,
      priorite_demande:             v.priorite_demande,
      bibliotheque:                 v.bibliotheque,
      bibliothecaire_disciplinaire: v.bibliothecaire_disciplinaire,
      // Type de document et Format/Support : retirés du formulaire usager — champs
      // complétés par les ACQ (section « ACQ : Suivi de la demande »).
      categorie_document:           null,
      titre_document:               v.titre_document,
      auteur:                       v.auteur,
      editeur:                      v.editeur,
      date_publication:             v.date_publication,
      source_information:           v.source_information,
      isbn_issn:                    v.isbn_issn,
      format_support:               null,
      note_usager:                  v.note_usager,
      aviser_reservation:           v.aviser_reservation,
      aviser_reception:             v.aviser_reception,
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
      statut_bibliotheque:          v.statut_bibliotheque || 'Saisie en cours - En attente',
      bibliotheque_note_interne:             v.bibliotheque_note_interne,
    };
    const obs = this.editId
      ? this.reponsesService.updateReponse(this.editId, payload)
      : this.reponsesService.envoyerSuggestion(payload);
    obs.subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (!this.editId && res?.id) this.editId = res.id;
        if (this.editId) {
          this.uploaderPiecesJointes(this.editId, (echec) => this.naviguerApresEnregistrement(echec));
        } else {
          this.naviguerApresEnregistrement(false);
        }
      },
      error: () => { this.isLoading = false; this.error = true; }
    });
  }

  private naviguerApresEnregistrement(echecPieceJointe: boolean): void {
    const message = echecPieceJointe
      ? "Vos informations ont été enregistrées, mais l'envoi de la pièce jointe a échoué. Vous pouvez réessayer en modifiant votre demande."
      : 'Vos informations ont été enregistrées.';
    this.router.navigate(['/usager/profil'], { state: { message } });
  }
}
