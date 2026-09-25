import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { ReponsesService } from '../../../../services/reponses.service';
import { ConfigService, TauxRates } from '../../../../services/config.service';
import { ListeChoixOptions } from '../../../../lib/ListeChoixOptions';
import { convertirPrixCad, estDeviseConvertible } from '../../../../lib/ConversionDevise';

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
  editId:  number | null = null;
  /** Taux de change vers CAD par devise — voir ConfigService.getTauxRates(). */
  tauxRates: TauxRates = { CAD: 1, USD: 1.368 };

  bibliotheques: string[] = [
    'Aménagement', 'Campus Laval', 'Direction générale', 'Droit',
    'Du Parc', 'Hubert-Reeves', 'Kinésiologie', 'L.S.H.',
    'Livres rares', 'Mathématiques-Informatique', 'Médecine vétérinaire',
    'Musique', "Marguerite-d'Youville", 'Prêt entre bibliothèques',
    'Santé', 'Service Accessibilité', 'Service du catalogage', 'TGD', 'TEST-DRIN'
  ];

  /** Liste volontairement restreinte pour ce formulaire (voir spec Accessibilité) — pas de
   *  Zine/Autres/Ne s'applique pas, et ajoute CD-Rom/DVD-Rom, absent de la liste générale
   *  (options.sousTypesMonographie). */
  typesMonographie: string[] = [
    'Livre', 'CD-Rom/DVD-Rom', 'Enregistrement sonore', 'Film',
    'Matériel didactique', 'Partition de musique', 'Carte et données géospatiales'
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

  devises = new ListeChoixOptions().devisesOptions;

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
      error: (err) => { console.error('[RequeteAccessibilite] uploaderPiecesJointes:', err); onDone(true); }
    });
  }

  constructor(
    private fb: FormBuilder,
    private reponsesService: ReponsesService,
    private route: ActivatedRoute,
    private router: Router,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    const nom      = `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';
    const statut   = sessionStorage.getItem('groupeAdmin')   ?? '';

    this.form = this.fb.group({
      nom:              [{ value: nom, disabled: true },      Validators.required],
      statut:           [statut],
      courriel:         [{ value: courriel, disabled: true }, [Validators.required, Validators.email]],
      bibliotheque:     ['Service Accessibilité', Validators.required],
      fonds_budgetaire: ['MO-097',      [Validators.required, Validators.maxLength(200), Validators.pattern('^[A-Za-z]{2,4}-\\d{2,}$')]],
      priorite_demande: ['Urgent',     Validators.required],
      titre_document:     ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre:         ['', Validators.maxLength(500)],
      editeur:            ['', Validators.maxLength(300)],
      isbn_issn:          ['', [Validators.required, this.isbnValidator]],
      date_publication:   [''],
      type_monographie:   [''],
      reference_usager:                 [''],
      besoin_specifique_format:         ['', Validators.required],
      permalien_sofia:                  ['', Validators.pattern('https?://.+')],
      fournisseur_contacte_sans_succes: [''],
      exemplaire_detenu:                [''],
      exemplaire_electronique_detenu:   [''],
      verification_caeb:                [''],
      verification_sqla:                [''],
      verification_emma:                [''],
      // format_support n'est plus saisi directement (voir "besoin spécifique/format" qui le
      // pilote) — conservé en champ caché, dérivé automatiquement, pour ne pas casser les
      // rapports/filtres existants qui lisent tbl_items.format_support.
      format_support:             ['Électronique'],
      nombre_utilisateurs:        ['Accès illimité'],
      format_pret_numerique:      ["Ne s'applique pas"],
      personne_a_aviser_courriel: [{ value: '', disabled: true }, Validators.email],
      devise_originale:      ['',   Validators.required],
      devise_autre_precision: [''],
      prix_devise_originale: [null, [Validators.required, Validators.min(0.01)]],
      prix_cad:              [null, [Validators.required, Validators.min(0.01)]],
      source_information: ['', Validators.pattern('https?://.+')],
      note_commentaire:   ['', Validators.maxLength(1000)],
      statut_bibliotheque: ['Saisie en cours - En attente'],
      bibliotheque_note_interne:    ['', Validators.maxLength(1000)],
    });

    this.form.get('besoin_specifique_format')!.valueChanges.subscribe(val => this.updateBesoinSpecifiqueDerive(val));
    this.updateBesoinSpecifiqueDerive(this.form.get('besoin_specifique_format')!.value);

    this.form.get('prix_devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());
    this.form.get('devise_originale')!.valueChanges.subscribe(() => {
      this.form.get('prix_cad')?.setValue(null, { emitEvent: false });
      this.updateDeviseAutreValidator();
      this.convertirPrix();
    });
    this.configService.getTauxRates().subscribe(rates => {
      this.tauxRates = rates;
      this.convertirPrix();
    });
    this.updateDeviseAutreValidator();

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
        const deviseConnue = this.devises.some(d => d.code === bd.devise_originale);
        this.form.patchValue({
          bibliotheque:                     bd.bibliotheque,
          fonds_budgetaire:                 bd.fonds_budgetaire,
          priorite_demande:                 bd.priorite_demande,
          titre_document:                   bd.titre_document,
          sous_titre:                       bd.sous_titre,
          editeur:                          bd.editeur,
          isbn_issn:                        bd.isbn_issn,
          date_publication:                 bd.date_publication,
          type_monographie:                 sd.type_monographie,
          nombre_utilisateurs:              bd.nombre_utilisateurs,
          reference_usager:                 sd.reference_usager,
          besoin_specifique_format:         sd.besoin_specifique_format,
          permalien_sofia:                  sd.permalien_sofia,
          fournisseur_contacte_sans_succes: sd.fournisseur_contacte_sans_succes,
          exemplaire_detenu:                sd.exemplaire_detenu,
          exemplaire_electronique_detenu:   sd.exemplaire_electronique_detenu,
          verification_caeb:                sd.verification_caeb,
          verification_sqla:                sd.verification_sqla,
          verification_emma:                sd.verification_emma,
          format_pret_numerique:            bd.format_pret_numerique,
          personne_a_aviser_courriel:       bd.personne_a_aviser_courriel,
          devise_originale:                 deviseConnue || !bd.devise_originale ? bd.devise_originale : 'Autre',
          devise_autre_precision:           deviseConnue || !bd.devise_originale ? '' : bd.devise_originale,
          prix_devise_originale:            bd.prix_devise_originale,
          prix_cad:                         bd.prix_cad,
          source_information:               bd.source_information,
          note_commentaire:                 bd.note_commentaire,
          statut_bibliotheque:              bd.statut_bibliotheque,
          bibliotheque_note_interne:                 bd.bibliotheque_note_interne,
        });
        this.updateBesoinSpecifiqueDerive(this.form.get('besoin_specifique_format')!.value);
      }
    });
  }

  private convertirPrix(): void {
    const prix   = this.form.get('prix_devise_originale')?.value;
    const devise = this.form.get('devise_originale')?.value;
    const result = convertirPrixCad(prix, devise, this.tauxRates);
    if (result != null) this.form.get('prix_cad')?.setValue(result, { emitEvent: false });
  }

  get deviseConvertible(): boolean {
    return estDeviseConvertible(this.form.get('devise_originale')?.value, this.tauxRates);
  }

  private updateDeviseAutreValidator(): void {
    const ctrl = this.form.get('devise_autre_precision');
    if (!ctrl) return;
    if (this.form.get('devise_originale')?.value === 'Autre') {
      ctrl.setValidators([Validators.required, Validators.maxLength(100)]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  private deviseAEnvoyer(v: any): string {
    return v.devise_originale === 'Autre' ? (v.devise_autre_precision || 'Autre') : v.devise_originale;
  }

  private isbnValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    if (/-/.test(value)) return { invalidIsbn: true };
    const v      = value.replace(/\s/g, '');
    const isbn10 = /^\d{9}[\dX]$/i;
    const isbn13 = /^97[89]\d{10}$/;
    return isbn10.test(v) || isbn13.test(v) ? null : { invalidIsbn: true };
  }

  /** Dérive l'état (achat / électronique / institutionnel) à partir du champ
   *  "besoin spécifique / format", qui remplace l'ancien toggle Format et support et
   *  pilote maintenant toutes les sections conditionnelles du formulaire. */
  private updateBesoinSpecifiqueDerive(val: string | null): void {
    const estImprime      = !!val && val.startsWith('Imprimé');
    const estElectronique = !!val && val.startsWith('Électronique');
    const estAchat         = !!val && val !== this.besoinsFormat[0];

    this.showElectronique = estElectronique;
    this.showImprime      = estImprime;

    this.form.get('format_support')!.setValue(
      estImprime ? 'Imprimé/support physique' : 'Électronique',
      { emitEvent: false }
    );

    const aviser = this.form.get('personne_a_aviser_courriel')!;
    estElectronique ? aviser.enable() : aviser.disable();
    aviser.updateValueAndValidity({ emitEvent: false });

    const devise   = this.form.get('devise_originale')!;
    const prixOrig = this.form.get('prix_devise_originale')!;
    const prixCad  = this.form.get('prix_cad')!;
    if (estAchat) {
      devise.setValidators([Validators.required]);
      prixOrig.setValidators([Validators.required, Validators.min(0.01)]);
      prixCad.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      devise.clearValidators();
      prixOrig.clearValidators();
      prixCad.clearValidators();
    }
    devise.updateValueAndValidity({ emitEvent: false });
    prixOrig.updateValueAndValidity({ emitEvent: false });
    prixCad.updateValueAndValidity({ emitEvent: false });
    this.updateDeviseAutreValidator();
  }

  /** Achat requis (prix/devise) : toute option sauf « écrire à l'éditeur pour version
   *  numérique gratuite », qui est la seule option sans coût. */
  get estAchat(): boolean {
    const val = this.form?.get('besoin_specifique_format')?.value;
    return !!val && val !== this.besoinsFormat[0];
  }

  /** Licence institutionnelle électronique : pilote nombre d'utilisateurs et
   *  format PrêtNumérique. */
  get estElectroniqueInstitutionnel(): boolean {
    const val = this.form?.get('besoin_specifique_format')?.value;
    return val === this.besoinsFormat[1] || val === this.besoinsFormat[2];
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
      // form.reset() efface aussi les champs désactivés (nom/courriel) s'ils ne sont pas
      // explicitement fournis ici — on les réinjecte depuis l'authentification.
      nom:                    `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim(),
      courriel:               sessionStorage.getItem('courrielAdmin') ?? '',
      bibliotheque:           'Service Accessibilité',
      fonds_budgetaire:       'MO-097',
      priorite_demande:      'Urgent',
      format_support:        'Électronique',
      nombre_utilisateurs:   'Accès illimité',
      format_pret_numerique: "Ne s'applique pas",
      statut_bibliotheque:   'Saisie en cours - En attente',
    });
    this.updateBesoinSpecifiqueDerive(null);
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
        nombre_utilisateurs:        this.estElectroniqueInstitutionnel ? v.nombre_utilisateurs : null,
        format_support:             v.format_support,
        format_pret_numerique:      this.estElectroniqueInstitutionnel ? v.format_pret_numerique : null,
        prix_cad:                   this.estAchat ? v.prix_cad : null,
        devise_originale:           this.estAchat ? this.deviseAEnvoyer(v) : null,
        prix_devise_originale:      this.estAchat ? v.prix_devise_originale : null,
        source_information:         v.source_information,
        note_commentaire:           v.note_commentaire,
        statut_bibliotheque:        v.statut_bibliotheque,
        bibliotheque_note_interne:           v.bibliotheque_note_interne,
        statut_acq:                 'En attente',
        send_notification:          v.statut_bibliotheque === 'Soumettre aux ACQ',
      },
      specificData: {
        reference_usager:                 v.reference_usager,
        besoin_specifique_format:         v.besoin_specifique_format,
        permalien_sofia:                  v.permalien_sofia,
        fournisseur_contacte_sans_succes: v.fournisseur_contacte_sans_succes,
        exemplaire_detenu:                v.exemplaire_detenu,
        exemplaire_electronique_detenu:   v.exemplaire_electronique_detenu,
        verification_caeb:                v.verification_caeb,
        verification_sqla:                v.verification_sqla,
        verification_emma:                v.verification_emma,
        acq_numerisation_recommandee:     null,
        acq_date_demande_editeur:         null,
        acq_date_livraison_estimee:       null,
        acq_responsable_courriel:         null,
        type_monographie:                 v.type_monographie,
      },
    };

    const obs = this.editId
      ? this.reponsesService.updateReponse(this.editId, payload)
      : this.reponsesService.envoyerRequeteAccessibilite(payload);

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
        nombre_utilisateurs:        this.estElectroniqueInstitutionnel ? v.nombre_utilisateurs : null,
        format_support:             v.format_support,
        format_pret_numerique:      this.estElectroniqueInstitutionnel ? v.format_pret_numerique : null,
        prix_cad:                   this.estAchat ? v.prix_cad : null,
        devise_originale:           this.estAchat ? this.deviseAEnvoyer(v) : null,
        prix_devise_originale:      this.estAchat ? v.prix_devise_originale : null,
        source_information:         v.source_information,
        note_commentaire:           v.note_commentaire,
        statut_bibliotheque:        v.statut_bibliotheque || 'Saisie en cours - En attente',
        bibliotheque_note_interne:           v.bibliotheque_note_interne,
        statut_acq:                 'En attente',
        send_notification:          v.statut_bibliotheque === 'Soumettre aux ACQ',
      },
      specificData: {
        reference_usager:                 v.reference_usager,
        besoin_specifique_format:         v.besoin_specifique_format,
        permalien_sofia:                  v.permalien_sofia,
        fournisseur_contacte_sans_succes: v.fournisseur_contacte_sans_succes,
        exemplaire_detenu:                v.exemplaire_detenu,
        exemplaire_electronique_detenu:   v.exemplaire_electronique_detenu,
        verification_caeb:                v.verification_caeb,
        verification_sqla:                v.verification_sqla,
        verification_emma:                v.verification_emma,
        acq_numerisation_recommandee:     null,
        acq_date_demande_editeur:         null,
        acq_date_livraison_estimee:       null,
        acq_responsable_courriel:         null,
        type_monographie:                 v.type_monographie,
      },
    };
    const obs = this.editId
      ? this.reponsesService.updateReponse(this.editId, payload)
      : this.reponsesService.envoyerRequeteAccessibilite(payload);
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
