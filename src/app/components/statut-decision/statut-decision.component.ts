import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ListeChoixOptions } from '../../lib/ListeChoixOptions';
import { Item, ItemFormulaireService } from '../../services/items-formulaire.service';
import { ReponsesService } from '../../services/reponses.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-statut-decision',
  templateUrl: './statut-decision.component.html',
  styleUrls: ['./statut-decision.component.css']
})
export class StatutDecisionComponent implements OnInit, OnDestroy {
  private routeSub?: Subscription;
  form: FormGroup;
  reponseId: number | null = null;
  itemId: number | null = null;
  item: Item | null = null;
  loadingItem = false;
  submitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  emailSent = false;
  options = new ListeChoixOptions();
  itemExisteDansItems = false;

  // Étiquettes (français fixe, indépendant de la langue active) pour le bordereau imprimé —
  // même principe que UsagerProfilComponent.FIELD_LABELS côté usager.
  private readonly PRINT_FIELD_LABELS: Record<string, string> = {
    titre_document: 'Titre', sous_titre: 'Sous-titre', demandeur: 'Demandeur',
    bibliotheque: 'Bibliothèque', categorie_document: 'Catégorie', format_support: 'Type de traitement',
    priorite_demande: 'Priorité',
    auteur: 'Auteur(rice)', usager_statut: 'Statut usager', usager_faculte: 'Faculté / Département',
    usager_courriel: 'Courriel usager', date_requise_cours: 'Requis pour cours',
    editeur: 'Éditeur', isbn_issn: 'ISBN / ISSN', date_publication: 'Date de publication',
    fonds_budgetaire: 'Fonds budgétaire', fonds_sn_projet: 'Fonds SN — No projet',
    periode_couverte: 'Période couverte', source_information: "Source d'information",
    prix_cad: 'Prix (CAD)', devise_originale: 'Devise originale', prix_devise_originale: 'Prix (devise orig.)',
    localisation_emplacement: 'Localisation', nombre_titres_inclus: 'Titres inclus',
    nombre_utilisateurs: 'Nb utilisateurs', format_pret_numerique: 'Format prêt numérique',
    lien_plateforme: 'Lien plateforme', personne_a_aviser_nom: 'Personne à aviser',
    personne_a_aviser_courriel: 'Courriel (à aviser)', usager_aviser_reservation: 'Aviser — Réservation',
    usager_aviser_activation: 'Aviser — Activation',
    quantite: 'Quantité', projets_speciaux: 'Projet spécial', type_monographie: 'Type monographie',
    reserve_cours_sigle: 'Sigle du cours', reserve_cours_session: 'Session', reserve_cours_enseignant: 'Enseignant',
    precision_demande: 'Précision de la demande', numero_oclc: 'Numéro OCLC',
    date_debut_abonnement: 'Date début abonnement',
    gobi_vu_format_numerique: 'Vu sur GOBI numérique', gobi_version_moins_365_usd: 'Version < 365 USD',
    reference_tipasa: 'Référence Tipasa',
    reference_usager: 'Référence usager', besoin_specifique_format: 'Besoin spécifique (format)',
    permalien_sofia: 'Permalien SOFIA', exemplaire_detenu: 'Exemplaire détenu',
    fournisseur_contacte_sans_succes: 'Fournisseur contacté',
    verification_caeb: 'Vérification CAEB', verification_sqla: 'Vérification SQLA', verification_emma: 'Vérification EMMA',
    note_commentaire: 'Note / Commentaire', note_usager: 'Note usager',
  };

  private readonly PRINT_FIELD_ORDER = Object.keys(this.PRINT_FIELD_LABELS);

  notifTargets: Array<{
    key: string;
    label: string;
    icon: string;
    email: string;
    description: string;
    selected: boolean;
  }> = [];

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private http: HttpClient,
    private itemService: ItemFormulaireService,
    private reponsesService: ReponsesService
  ) {
    this.form = this.fb.group({
      suivi_acq:            ['', Validators.required],
      statut_acq:           [''],
      note_acq:             [''],
      creation_notice_dtdm: [null],
      // Suggestion d'achat uniquement : le formulaire usager ne collecte plus ces deux champs
      // (retirés — « à compléter par les ACQ »), ils sont donc saisis ici.
      categorie_document:   [''],
      format_support:       [''],
      // TDM : Suivi de la demande — même formulaire que la décision ACQ, pas d'étape séparée.
      note_dtdm:            [''],
      catalogue:            ['', Validators.maxLength(200)],
    });
  }

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      const reponseIdParam = Number(params.get('reponse_id')) || null; // formulaire usager
      const legacyIdParam  = Number(params.get('id'))         || null; // compat ancien lien
      const itemIdParam    = Number(params.get('item_id'))    || null; // import / reponse-created

      this.reponseId           = null;
      this.itemId              = null;
      this.item                = null;
      this.errorMessage        = null;
      this.successMessage      = null;
      this.itemExisteDansItems = false;
      this.form.reset({
        suivi_acq: '', statut_acq: '', note_acq: '', creation_notice_dtdm: null,
        categorie_document: '', format_support: '', note_dtdm: '', catalogue: '',
      });

      if (!reponseIdParam && !legacyIdParam && !itemIdParam) {
        this.errorMessage = 'Paramètre manquant : reponse_id, id ou item_id';
        return;
      }

      this.loadingItem = true;

      if (itemIdParam) {
        // Import ou réponse déjà convertie : item dans tbl_items
        this.itemId              = itemIdParam;
        this.itemExisteDansItems = true;
        this.chargerItemDirectement(itemIdParam);

      } else if (reponseIdParam) {
        // Formulaire usager : créer l'item dans tbl_items puis charger
        this.reponseId = reponseIdParam;
        this.reponsesService.creerItem(reponseIdParam).subscribe({
          next: ({ item_id }) => {
            this.itemId              = item_id;
            this.itemExisteDansItems = true;
            this.chargerItemDirectement(item_id);
          },
          error: () => {
            this.loadingItem  = false;
            this.errorMessage = "Impossible de créer l'item depuis la réponse.";
          }
        });

      } else {
        // Compat : ancien paramètre ?id=X
        this.reponseId = legacyIdParam;
        this.reponsesService.getById(legacyIdParam!).subscribe({
          next: (reponse) => {
            if (reponse?.item_id_cree) {
              this.itemId = reponse.item_id_cree;
              this.itemService.getById(this.itemId!).subscribe({
                next: (resp) => {
                  this.loadingItem = false;
                  if (resp?.success && resp?.data) {
                    this.itemExisteDansItems = true;
                    this.item = resp.data;
                    this.patchFormFromItem(resp.data);
                  } else {
                    this.mapReponseToItem(reponse);
                  }
                },
                error: () => { this.loadingItem = false; this.mapReponseToItem(reponse); }
              });
            } else {
              this.loadingItem = false;
              this.mapReponseToItem(reponse);
            }
          },
          error: () => {
            this.loadingItem  = false;
            this.errorMessage = 'Impossible de charger la réponse.';
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private chargerItemDirectement(id: number): void {
    this.itemService.getById(id).subscribe({
      next: (resp) => {
        this.loadingItem = false;
        if (resp?.success && resp?.data) {
          this.item = resp.data;
          this.patchFormFromItem(resp.data);
        } else {
          this.errorMessage = 'Item introuvable.';
        }
      },
      error: () => {
        this.loadingItem = false;
        this.errorMessage = 'Impossible de charger l\'item.';
      }
    });
  }

  private patchFormFromItem(data: any): void {
    const acq = this.applyAcqDefaults(
      data.statut_bibliotheque, data.suivi_acq, data.statut_acq,
      data.creation_notice_dtdm, data.format_support
    );
    this.form.patchValue({
      suivi_acq:            acq.suivi_acq,
      statut_acq:           acq.statut_acq,
      note_acq:             data.note_acq || '',
      creation_notice_dtdm: acq.creation_notice_dtdm,
      categorie_document:   data.categorie_document || '',
      format_support:       data.format_support || '',
      note_dtdm:            data.note_dtdm || '',
      catalogue:            data.catalogue || '',
    }, { emitEvent: false });
    this.buildNotifTargets();
  }

  // Une demande soumise (ou déjà matérialisée) avec statut_bibliotheque = "Soumettre aux ACQ"
  // doit afficher ses deux champs de décision ACQ pré-remplis à leur valeur "en attente"
  // respective, s'ils ne sont pas déjà renseignés (mêmes valeurs que ItemFormulaireComponent
  // et creerItemDepuisReponse côté backend).
  // creation_notice_dtdm suit la même logique de pré-remplissage : Oui si le format n'est pas
  // Électronique (Imprimé/support physique ou Imprimé et électronique), vide si Électronique —
  // sans jamais écraser une valeur déjà renseignée (par l'usager ou une décision précédente).
  private applyAcqDefaults(
    statutBibliotheque: string | undefined,
    suiviActuel: string | undefined,
    statutActuel: string | undefined,
    creationNoticeActuelle: boolean | null | undefined,
    formatSupport: string | undefined
  ): { suivi_acq: string; statut_acq: string; creation_notice_dtdm: boolean | null } {
    const soumiseAuxAcq = statutBibliotheque === 'Soumettre aux ACQ';
    return {
      suivi_acq:  suiviActuel  || (soumiseAuxAcq ? 'En attente de traitement' : ''), // dircolAcqSuiviOptions
      statut_acq: statutActuel || (soumiseAuxAcq ? 'En attente'                : ''), // dircolAcqStatutOptions
      // formatSupport peut être encore vide pour une Suggestion d'achat (champ désormais
      // saisi par les ACQ, pas par l'usager) — dans ce cas on ne présume pas "Oui".
      creation_notice_dtdm: creationNoticeActuelle != null
        ? creationNoticeActuelle
        : (soumiseAuxAcq && formatSupport ? (formatSupport === 'Électronique' ? null : true) : null),
    };
  }

  private mapReponseToItem(r: any): void {
    // La colonne tbl_reponses.reponses peut arriver en string (TEXT) ou en objet (JSONB)
    const parsed = typeof r.reponses === 'string'
      ? (() => { try { return JSON.parse(r.reponses); } catch { return {}; } })()
      : (r.reponses || {});
    const bd   = parsed?.baseData    || {};
    const sd   = parsed?.specificData || {};
    const flat = (parsed && !parsed.baseData) ? parsed : {};
    const f = (b: any, s: any) => b || flat[s] || sd[s];
    const statutBibliotheque = bd.statut_bibliotheque || flat.statut_bibliotheque || sd.statut_bibliotheque;
    this.item = {
      formulaire_type:                r.type_formulaire,
      statut_bibliotheque:            statutBibliotheque,
      date_creation:                  r.dateA,
      demandeur:                      r.usager_nom,
      usager_courriel:                r.usager_courriel,
      usager_statut:                  r.usager_statut,
      titre_document:                 bd.titre_document    || flat.titre_document    || sd.titre_document || '—',
      sous_titre:                     f(bd.sous_titre,      'sous_titre'),
      editeur:                        f(bd.editeur,         'editeur'),
      isbn_issn:                      f(bd.isbn_issn,       'isbn_issn'),
      date_publication:               f(bd.date_publication,'date_publication'),
      format_support:                 f(bd.format_support,  'format_support'),
      categorie_document:             f(bd.categorie_document,'categorie_document'),
      bibliotheque:                   f(bd.bibliotheque,    'bibliotheque'),
      creation_notice_dtdm:           bd.creation_notice_dtdm ?? flat.creation_notice_dtdm ?? sd.creation_notice_dtdm,
      note_dtdm:                      f(bd.note_dtdm,       'note_dtdm'),
      catalogue:                      f(bd.catalogue,       'catalogue'),
      fonds_budgetaire:               f(bd.fonds_budgetaire,'fonds_budgetaire'),
      fonds_sn_projet:                f(bd.fonds_sn_projet, 'fonds_sn_projet'),
      periode_couverte:               f(bd.periode_couverte,'periode_couverte'),
      source_information:             f(bd.source_information,'source_information'),
      prix_cad:                       f(bd.prix_cad,        'prix_cad'),
      devise_originale:               f(bd.devise_originale,'devise_originale'),
      prix_devise_originale:          f(bd.prix_devise_originale,'prix_devise_originale'),
      priorite_demande:               f(bd.priorite_demande,'priorite_demande'),
      localisation_emplacement:       f(bd.localisation_emplacement,'localisation_emplacement'),
      nombre_titres_inclus:           f(bd.nombre_titres_inclus,'nombre_titres_inclus'),
      nombre_utilisateurs:            f(bd.nombre_utilisateurs,'nombre_utilisateurs'),
      format_pret_numerique:          f(bd.format_pret_numerique,'format_pret_numerique'),
      lien_plateforme:                f(bd.lien_plateforme, 'lien_plateforme'),
      personne_a_aviser_nom:          f(bd.personne_a_aviser_nom,'personne_a_aviser_nom'),
      personne_a_aviser_courriel:     f(bd.personne_a_aviser_courriel,'personne_a_aviser_courriel'),
      usager_aviser_reservation:      bd.usager_aviser_reservation || flat.usager_aviser_reservation || sd.usager_aviser_reservation,
      usager_aviser_activation:       bd.usager_aviser_activation  || flat.usager_aviser_activation  || sd.usager_aviser_activation,
      note_commentaire:               f(bd.note_commentaire,'note_commentaire'),
      auteur:                         flat.auteur           || bd.auteur,
      usager_faculte:                 flat.usager_faculte   || sd.usager_faculte,
      bibliothecaire_disciplinaire:   flat.bibliothecaire_disciplinaire || sd.bibliothecaire_disciplinaire,
      date_requise_cours:             flat.date_requise_cours || sd.date_requise_cours,
      note_usager:                    flat.note_usager       || sd.note_usager,
      aviser_reservation:             flat.aviser_reservation ?? sd.aviser_reservation,
      aviser_reception:               flat.aviser_reception   ?? sd.aviser_reception,
      acq_isbn:                       flat.acq_isbn           || sd.acq_isbn,
      quantite:                       sd.quantite,
      projets_speciaux:               sd.projets_speciaux,
      type_monographie:               sd.type_monographie    || bd.type_monographie,
      reserve_cours:                  sd.reserve_cours,
      reserve_cours_sigle:            sd.reserve_cours_sigle,
      reserve_cours_session:          sd.reserve_cours_session,
      reserve_cours_enseignant:       sd.reserve_cours_enseignant,
      precision_demande:              sd.precision_demande,
      numero_oclc:                    sd.numero_oclc,
      date_debut_abonnement:          sd.date_debut_abonnement,
      gobi_vu_format_numerique:       sd.gobi_vu_format_numerique,
      gobi_version_moins_365_usd:     sd.gobi_version_moins_365_usd,
      reference_tipasa:               sd.reference_tipasa,
      reference_usager:               sd.reference_usager,
      besoin_specifique_format:       sd.besoin_specifique_format,
      permalien_sofia:                sd.permalien_sofia,
      exemplaire_detenu:              sd.exemplaire_detenu,
      fournisseur_contacte_sans_succes: sd.fournisseur_contacte_sans_succes,
      verification_caeb:              sd.verification_caeb,
      verification_sqla:              sd.verification_sqla,
      verification_emma:              sd.verification_emma,
    } as Item;
    const acq = this.applyAcqDefaults(
      statutBibliotheque, undefined, undefined,
      this.item.creation_notice_dtdm, this.item.format_support
    );
    this.form.patchValue({
      suivi_acq:            acq.suivi_acq,
      statut_acq:           acq.statut_acq,
      creation_notice_dtdm: acq.creation_notice_dtdm,
      categorie_document:   this.item.categorie_document || '',
      format_support:       this.item.format_support || '',
      note_dtdm:            this.item.note_dtdm || '',
      catalogue:            this.item.catalogue || '',
    }, { emitEvent: false });
    this.buildNotifTargets();
  }

  private buildItemPayload(suivi_acq: string, note_acq: string | null): Record<string, any> {
    const i = this.item as any;

    // Colonnes de tbl_items uniquement (baseData commun à tous les formulaires)
    const baseKeys = [
      'formulaire_type', 'titre_document', 'sous_titre', 'demandeur',
      'editeur', 'isbn_issn', 'date_publication', 'categorie_document',
      'format_support', 'priorite_demande', 'bibliotheque',
      'localisation_emplacement', 'creation_notice_dtdm', 'catalogue', 'note_dtdm',
      'fonds_budgetaire', 'fonds_sn_projet', 'periode_couverte',
      'source_information', 'prix_cad', 'devise_originale', 'prix_devise_originale',
      'nombre_titres_inclus', 'nombre_utilisateurs', 'lien_plateforme',
      'format_pret_numerique', 'personne_a_aviser_nom', 'personne_a_aviser_courriel',
      'note_commentaire'
    ];

    const payload: Record<string, any> = { suivi_acq, note_acq };
    baseKeys.forEach(k => { if (i[k] != null) { payload[k] = i[k]; } });

    // specificData → routé par le backend vers la bonne sous-table
    const specificData = this.buildSpecificData();
    if (specificData) { payload['specificData'] = specificData; }

    return payload;
  }

  private buildSpecificData(): Record<string, any> | null {
    const i = this.item as any;
    let keys: string[] = [];

    if (this.isNouvelAchat) {
      keys = [
        'quantite', 'projets_speciaux', 'type_monographie', 'format_electronique',
        'reserve_cours', 'reserve_cours_sigle', 'reserve_cours_session', 'reserve_cours_enseignant',
        'usager_aviser_reservation', 'usager_aviser_activation'
      ];
    } else if (this.isModificationCcol) {
      keys = ['precision_demande', 'numero_oclc', 'date_debut_abonnement', 'usager_aviser_activation'];
    } else if (this.isNouvelAbonnement) {
      keys = ['date_debut_abonnement', 'type_monographie', 'usager_aviser_reservation'];
    } else if (this.isPebTipasa) {
      keys = ['gobi_vu_format_numerique', 'gobi_version_moins_365_usd', 'reference_tipasa'];
    } else if (this.isAccessibilite) {
      keys = [
        'reference_usager', 'besoin_specifique_format', 'permalien_sofia', 'type_monographie',
        'exemplaire_detenu', 'fournisseur_contacte_sans_succes',
        'verification_caeb', 'verification_sqla', 'verification_emma'
      ];
    } else if (this.isSuggestion) {
      keys = [
        'auteur', 'usager_statut', 'usager_faculte', 'usager_courriel',
        'date_requise_cours', 'note_usager', 'bibliothecaire_disciplinaire',
        'aviser_reservation', 'aviser_reception', 'acq_isbn'
      ];
    }

    if (!keys.length) { return null; }
    const sd: Record<string, any> = {};
    keys.forEach(k => { if (i[k] != null) { sd[k] = i[k]; } });
    return Object.keys(sd).length ? sd : null;
  }

  get formulaireType(): string { return this.item?.formulaire_type || ''; }
  get isNouvelAchat()      { return this.formulaireType === 'Nouvel achat unique'; }
  get isModificationCcol() { return this.formulaireType === 'Modification et CCOL'; }
  get isNouvelAbonnement() { return this.formulaireType === 'Nouvel abonnement'; }
  get isPebTipasa()        { return this.formulaireType === 'PEB Tipasa numérique'; }
  get isAccessibilite()    { return this.formulaireType === 'Requête ACQ Accessibilité'; }
  get isSuggestion()       { return this.formulaireType.includes('Suggestion'); }

  get typeHeaderColor(): string {
    const colors: Record<string, string> = {
      'Nouvel achat unique':        '#1565c0',
      'Modification et CCOL':       '#6a1b9a',
      'Nouvel abonnement':          '#14532D',
      'PEB Tipasa numérique':       '#e65100',
      'Requête ACQ Accessibilité':  '#b71c1c',
    };
    return colors[this.formulaireType] || '#37474f';
  }

  activeInfoTab: 'base' | 'details' = 'base';
  showDetailModal = false;

  get hasSpecificTab(): boolean {
    return this.isNouvelAchat || this.isModificationCcol ||
           this.isNouvelAbonnement || this.isPebTipasa ||
           this.isAccessibilite || this.isSuggestion;
  }

  get typeIcon(): string {
    const icons: Record<string, string> = {
      'Nouvel achat unique':        'bi-cart-plus',
      'Modification et CCOL':       'bi-pencil-square',
      'Nouvel abonnement':          'bi-calendar-check',
      'PEB Tipasa numérique':       'bi-share',
      'Requête ACQ Accessibilité':  'bi-universal-access',
    };
    return icons[this.formulaireType] || 'bi-lightbulb';
  }

  submitForm(sendEmail = false): void {
    if (!this.form.valid || (!this.reponseId && !this.itemId)) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Veuillez remplir tous les champs requis.';
      return;
    }

    this.submitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const suivi_acq  = this.form.get('suivi_acq')?.value;
    const statut_acq = this.form.get('statut_acq')?.value || null;
    const note_acq   = this.form.get('note_acq')?.value   || null;
    const creation_notice_dtdm = this.form.get('creation_notice_dtdm')?.value ?? null;
    const categorie_document = this.form.get('categorie_document')?.value || null;
    const format_support     = this.form.get('format_support')?.value     || null;
    const note_dtdm  = this.form.get('note_dtdm')?.value   || null;
    const catalogue  = this.form.get('catalogue')?.value   || null;

    const specificData = this.buildSpecificData();

    const request$ = this.itemExisteDansItems
      ? this.http.put<{ success: boolean; message?: string }>(
          `${environment.apiUrl}/items/save/${this.itemId}`,
          { item_id: this.itemId, suivi_acq, statut_acq, note_acq, creation_notice_dtdm, categorie_document, format_support, note_dtdm, catalogue, ...(specificData ? { specificData } : {}) },
          this.httpOptions
        )
      : this.http.post<{ success: boolean; message?: string }>(
          `${environment.apiUrl}/items/add`,
          { ...this.buildItemPayload(suivi_acq, note_acq), creation_notice_dtdm, categorie_document, format_support, note_dtdm, catalogue, statut_acq, reponse_id: this.reponseId },
          this.httpOptions
        );

    request$.subscribe({
      next: (response) => {
        this.submitting = false;
        if (response.success) {
          this.successMessage = 'Décision enregistrée avec succès !';
          if (sendEmail && this.hasNotifEmail) {
            this.notifyN8nDecision(suivi_acq, note_acq);
            this.emailSent = true;
          }
          // Synchroniser tbl_reponses pour que les notifications header disparaissent
          if (this.reponseId) {
            this.reponsesService.updateReponseStatut(this.reponseId, { suivi_acq, statut_acq })
              .subscribe({ error: err => console.warn('[statut-decision] sync reponse statut:', err) });
          }
          this.reponsesService.triggerPendingRefresh();
          setTimeout(() => this.router.navigate(['/items']), 2000);
        } else {
          this.errorMessage = response.message || "Erreur lors de l'enregistrement.";
        }
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.status === 0
          ? 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.'
          : `Erreur ${err.status} : ${err.error?.message || err.message}`;
      }
    });
  }

  buildNotifTargets(): void {
    this.notifTargets = [];
    if (!this.item) return;

    const hasReservation = (this.isNouvelAchat || this.isNouvelAbonnement)
                           && !!this.item.usager_aviser_reservation;

    // Priorité : Aviser réservation si disponible, sinon courriel demandeur
    if (hasReservation) {
      this.notifTargets.push({
        key: 'reservation', label: 'Aviser — Réservation', icon: 'bi-bookmark-fill',
        email: this.item.usager_aviser_reservation!,
        description: 'Notifier lors de la mise en réservation',
        selected: true
      });
    } else if (this.item.usager_courriel) {
      this.notifTargets.push({
        key: 'usager', label: 'Demandeur', icon: 'bi-person-fill',
        email: this.item.usager_courriel,
        description: 'Informer le demandeur du statut de sa demande',
        selected: true
      });
    }

    // Aviser activation — si le champ est renseigné (Nouvel achat + Modification CCOL + Accessibilité)
    if ((this.isNouvelAchat || this.isModificationCcol || this.isAccessibilite)
        && this.item.usager_aviser_activation) {
      this.notifTargets.push({
        key: 'activation', label: 'Aviser — Activation', icon: 'bi-lightning-fill',
        email: this.item.usager_aviser_activation,
        description: 'Notifier lors de l\'activation de la ressource',
        selected: true
      });
    }

    // Personne à aviser — si le champ courriel est renseigné
    if (this.item.personne_a_aviser_courriel) {
      this.notifTargets.push({
        key: 'personne', label: 'Personne à aviser', icon: 'bi-person-badge-fill',
        email: this.item.personne_a_aviser_courriel,
        description: 'Responsable à notifier lors de l\'activation',
        selected: true
      });
    }
  }

  get hasNotifEmail(): boolean {
    return this.notifTargets.some(t => t.selected);
  }

  private notifyN8nDecision(suivi_acq: string, note_acq: string | null): void {
    const selected = this.notifTargets.filter(t => t.selected);
    selected.forEach(target => {
      const payload = {
        reponse_id:          this.reponseId,
        suivi_acq,
        note_acq,
        usager_courriel:     target.email,
        usager_nom:          this.item?.demandeur,
        titre_document:      this.item?.titre_document,
        type_formulaire:     this.item?.formulaire_type,
        notif_role:          target.label
      };
      this.http
        .post(`${environment.n8nWebhookUrl}/statut-decision`, payload, this.httpOptions)
        .subscribe({ error: err => console.warn(`[n8n/statut-decision/${target.key}]`, err) });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // IMPRESSION DU BORDEREAU — même mécanisme que UsagerProfilComponent.imprimerDemande :
  // fenêtre ouverte de façon SYNCHRONE dans le geste de clic (sinon bloquée par le
  // navigateur), placeholder affiché immédiatement, puis contenu final réécrit une fois
  // prêt et impression déclenchée via onload avec un filet de sécurité (setTimeout).
  // ═══════════════════════════════════════════════════════════
  imprimerBordereau(): void {
    if (!this.item) return;

    const fenetre = window.open('', '_blank', 'width=800,height=900');
    if (!fenetre) {
      this.errorMessage = "Impossible d'ouvrir la fenêtre d'impression : vérifiez que les fenêtres popup sont autorisées pour ce site.";
      return;
    }
    fenetre.document.write(
      '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Préparation…</title></head>' +
      '<body style="font-family:\'Segoe UI\',Arial,sans-serif;padding:2.5rem;color:#64748b">Préparation du document à imprimer…</body></html>'
    );
    fenetre.document.close();

    // Les données de l'item sont déjà en mémoire (this.item) — pas d'appel réseau requis.
    this.ecrireImpressionBordereau(fenetre);
  }

  private ecrireImpressionBordereau(fenetre: Window): void {
    const esc = (v: string) => {
      const div = document.createElement('div');
      div.textContent = v;
      return div.innerHTML;
    };

    const i = this.item as any;
    const suiviForm          = this.form.get('suivi_acq')?.value;
    const statutForm         = this.form.get('statut_acq')?.value;
    const creationNoticeForm = this.form.get('creation_notice_dtdm')?.value;
    const catalogueForm      = this.form.get('catalogue')?.value;
    const noteDtdmForm       = this.form.get('note_dtdm')?.value;
    const identifiant = this.itemId ?? this.reponseId;

    const rangees = [
      { label: 'Statut de la demande', value: i.statut_bibliotheque || "En cours d'évaluation" },
      ...(suiviForm  ? [{ label: 'ACQ — Suivi de la demande',  value: suiviForm  }] : []),
      ...(statutForm ? [{ label: 'ACQ — Statut de la demande', value: statutForm }] : []),
      ...(creationNoticeForm != null
        ? [{ label: 'ACQ — Création de notice TDM', value: creationNoticeForm ? 'Oui' : 'Non' }]
        : []),
      ...(catalogueForm ? [{ label: 'TDM — Catalogage', value: catalogueForm }] : []),
      ...(noteDtdmForm  ? [{ label: 'TDM — Note / OCN', value: noteDtdmForm }] : []),
      ...this.PRINT_FIELD_ORDER
        .filter(k => i[k] !== null && i[k] !== undefined && i[k] !== '' && i[k] !== false)
        .map(k => ({
          label: this.PRINT_FIELD_LABELS[k],
          value: typeof i[k] === 'boolean' ? 'Oui' : String(i[k]),
        })),
    ].map(r => `<tr><th>${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join('');

    // En haut du bordereau, on identifie la personne qui a complété la demande
    // (le demandeur) — pas la personne qui imprime le document.
    const nomDemandeur = i.demandeur || 'Demandeur inconnu';
    const dateImpression = new Date().toLocaleString('fr-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    const dateSoumission = i.date_creation
      ? new Date(i.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>${esc(i.formulaire_type || 'Demande')}${identifiant ? ' — #' + identifiant : ''}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 2rem 2.5rem 2.5rem; }
  .doc-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 2px solid #0B113A; padding-bottom: .6rem; margin-bottom: 1.4rem;
  }
  .doc-header__brand { font-size: .85rem; font-weight: 700; color: #0B113A; }
  .doc-header__brand small { display: block; font-weight: 400; color: #64748b; font-size: .72rem; margin-top: .1rem; }
  .doc-header__user { font-size: .8rem; color: #334155; text-align: right; }
  .doc-header__user strong { display: block; color: #0B113A; font-size: .85rem; }
  h1   { font-size: 1.15rem; margin: 0 0 .2rem; color: #0B113A; }
  .sub { color: #64748b; font-size: .85rem; margin: 0 0 1.5rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: .5rem .6rem; border-bottom: 1px solid #e2e8f0; font-size: .85rem; vertical-align: top; }
  th   { width: 40%; color: #475569; font-weight: 600; background: #f8fafc; }
  .footer {
    margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;
    font-size: .72rem; color: #94a3b8; line-height: 1.6;
  }
  @media print { body { padding: 1.2rem; } }
</style></head>
<body>

  <div class="doc-header">
    <div class="doc-header__brand">
      Portail acquisitions
      <small>Bibliothèques UdeM</small>
    </div>
    <div class="doc-header__user">
      <strong>${esc(nomDemandeur)}</strong>
      Demandeur${i.usager_courriel ? ' · ' + esc(i.usager_courriel) : ''}
    </div>
  </div>

  <h1>${esc(i.formulaire_type || 'Demande')}${identifiant ? ' — #' + identifiant : ''}</h1>
  <p class="sub">Titre : ${esc(i.titre_document || '—')} &nbsp;·&nbsp; Soumise le ${dateSoumission}</p>
  <table>${rangees}</table>

  <p class="footer">
    Imprimé le ${dateImpression}<br>
    Ce document est une impression informative — les données à jour se trouvent dans le portail des acquisitions.
  </p>

</body></html>`;

    // Navigue vers une URL blob (au lieu de réécrire le document via document.write, qui
    // laisse la fenêtre sur "about:blank") afin que l'en-tête/pied de page d'impression du
    // navigateur n'affiche pas "about:blank" comme URL de la page.
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    fenetre.location.href = blobUrl;
    fenetre.focus();

    let imprime = false;
    const declencherImpression = () => {
      if (imprime) return;
      imprime = true;
      fenetre.print();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    };
    fenetre.onload = declencherImpression;
    setTimeout(declencherImpression, 500);
  }
}
