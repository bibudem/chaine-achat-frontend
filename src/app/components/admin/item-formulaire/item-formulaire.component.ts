import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Item, ItemFormulaireService, ApiResponse } from '../../../services/items-formulaire.service';
import { ListeChoixOptions } from '../../../lib/ListeChoixOptions';
import { DialogService } from '../../../services/dialog.service';
import { Location } from '@angular/common';
import { ReponsesService } from '../../../services/reponses.service';
import { ConfigService, TauxRates } from '../../../services/config.service';
import { convertirPrixCad, estDeviseConvertible } from '../../../lib/ConversionDevise';
import { FondsRepartitionComponent } from '../../shared/fonds-repartition/fonds-repartition.component';

@Component({
  selector: 'app-item-formulaire',
  templateUrl: './item-formulaire.component.html',
  styleUrls: ['./item-formulaire.component.css']
})
export class ItemFormulaireComponent implements OnInit {
  itemForm: FormGroup;
  itemId: number | null = null;
  /** id de la réponse usager d'origine en mode création (history.state.fromReponse) — permet
   *  d'afficher/gérer ses pièces jointes avant que l'item n'existe. */
  reponseIdOrigine: number | null = null;
  isEditMode = false;
  loading = false;
  submitting = false;
  submitted = false;
  activeTab = 'base';

  options = new ListeChoixOptions();
  selectedFormulaireType: string | null = null;

  /** Taux de change vers CAD par devise — voir ConfigService.getTauxRates(). */
  tauxRates: TauxRates = { CAD: 1, USD: 1.368 };
  devises = this.options.devisesOptions;

  readonly OUI_NON_NA: string[] = ['OUI', 'NON', "Ne s'applique pas"];
  /** Liste volontairement restreinte pour Requête ACQ Accessibilité (voir requete-accessibilite
   *  côté usager) — pas de Zine/Autres/Ne s'applique pas, et ajoute CD-Rom/DVD-Rom, absent de
   *  la liste générale (options.sousTypesMonographie). */
  readonly typesMonographieAccessibilite: string[] = [
    'Livre', 'CD-Rom/DVD-Rom', 'Enregistrement sonore', 'Film',
    'Matériel didactique', 'Partition de musique', 'Carte et données géospatiales'
  ];
  readonly besoinsFormat: string[] = [
    "Électronique : écrire à l'éditeur pour version numérique gratuite",
    'Électronique : acheter licence institutionnelle standard + version numérique gratuite',
    'Électronique : acheter licence institutionnelle standard',
    'Imprimé/support physique : acheter exemplaires + version numérique gratuite',
    "Imprimé/support physique : acheter exemplaire sans version numérique"
  ];
  precisionsDemande: string[] = [
    'Achat de complément de collection (CCOL) pour abonnement (courant ou ancien)',
    'Achat de numéro de périodique hors abonnement',
    "Achat d'archives de périodiques (web)",
    "Achat en vue d'un NABO",
    "Annulation d'abonnement",
    'Cesse de paraître',
    'Changement de support',
    'Changement de titre',
    'Création de notice pour abonnement courant',
    "Modification du nombre d'utilisateurs"
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private itemService:     ItemFormulaireService,
    private dialogService:   DialogService,
    private location:        Location,
    private reponsesService: ReponsesService,
    private configService:   ConfigService
  ) {
    this.itemForm = this.createForm();
  }

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.itemId;

    if (this.isEditMode) {
      this.loadItem();
      this.itemForm.get('formulaire_type')?.disable({ emitEvent: false });
    }

    this.itemForm.get('formulaire_type')?.valueChanges.subscribe(value => {
      this.onFormulaireTypeChange(value);
    });

    const statutCtrl = this.itemForm.get('statut_bibliotheque');
    if (statutCtrl) {
      this.updateSuiviAcqValidator(statutCtrl.value);
      this.updateFinanceValidators(statutCtrl.value);
      statutCtrl.valueChanges.subscribe(v => {
        this.updateSuiviAcqValidator(v);
        this.updateFinanceValidators(v);
        // Dès que la bibliothèque soumet la demande aux ACQ, on initialise les deux champs
        // ACQ (s'ils ne sont pas déjà renseignés) à leur valeur "en attente" respective,
        // pour que la demande soit visible dans Recherche/Rapport sans attendre qu'un
        // membre de l'équipe ACQ l'ouvre.
        if (v === 'Soumettre aux ACQ') {
          const statutAcqCtrl = this.itemForm.get('statut_acq');
          if (statutAcqCtrl && !statutAcqCtrl.value) {
            statutAcqCtrl.setValue('En attente'); // options.dircolAcqStatutOptions
          }
          const suiviAcqCtrl = this.itemForm.get('suivi_acq');
          if (suiviAcqCtrl && !suiviAcqCtrl.value) {
            suiviAcqCtrl.setValue('En attente de traitement'); // options.dircolAcqSuiviOptions
          }
          this.applyCreationNoticeDefault();
        }
        if (this.activeTab === 'acq-decision' && !this.showDecisionAcqTab) {
          this.setActiveTab('base');
        }
      });
    }

    // creation_notice_dtdm : même règle de valeur par défaut que statut-decision (ACQ) —
    // Oui si le format n'est pas Électronique, vide si Électronique — sans jamais écraser
    // une valeur déjà renseignée. Réévalué au changement de format au cas où celui-ci est
    // choisi après que la demande soit déjà « Soumettre aux ACQ ».
    this.itemForm.get('format_support')?.valueChanges.subscribe(() => {
      this.applyCreationNoticeDefault();
    });

    const state = history.state as any;
    if (!this.isEditMode && state?.fromReponse) {
      this.prefillFromReponse(state.fromReponse);
    }

    // Pré-sélection du type depuis le catalogue « Types de formulaire » du tableau de bord
    // admin (accueil.component.ts, navigateToNouveau) — query param ?type=..., uniquement en
    // création (en édition, formulaire_type vient de l'item chargé et le champ est verrouillé).
    if (!this.isEditMode) {
      const typeParam = this.route.snapshot.queryParamMap.get('type');
      if (typeParam && this.options.formulaireTypeOptions.some(o => o.value === typeParam)) {
        this.itemForm.patchValue({ formulaire_type: typeParam });
      }
    }

    this.itemForm.get('prix_devise_originale')!.valueChanges.subscribe(() => this.convertirPrix());
    this.itemForm.get('devise_originale')!.valueChanges.subscribe(() => {
      this.itemForm.get('prix_cad')?.setValue(null, { emitEvent: false });
      this.updateDeviseAutreValidator();
      this.convertirPrix();
    });
    this.configService.getTauxRates().subscribe(rates => {
      this.tauxRates = rates;
      this.convertirPrix();
    });
  }

  // Même règle que StatutDecisionComponent.applyAcqDefaults() : Oui si le format n'est pas
  // Électronique (Imprimé/support physique ou Imprimé et électronique), vide si Électronique —
  // sans jamais écraser une valeur déjà renseignée (décision ACQ existante ou chargée en édition).
  private applyCreationNoticeDefault(): void {
    const ctrl = this.itemForm.get('creation_notice_dtdm');
    if (!ctrl || ctrl.value != null) { return; }
    if (this.itemForm.get('statut_bibliotheque')?.value !== 'Soumettre aux ACQ') { return; }
    const format = this.itemForm.get('format_support')?.value;
    if (format && format !== 'Électronique') {
      ctrl.setValue(true, { emitEvent: false });
    }
  }

  private updateFinanceValidators(statut: string): void {
    const isSaisie = (statut ?? '').startsWith('Saisie en cours');
    // Fonds partagés (Nouvel achat unique / Nouvel abonnement / Modification et CCOL) :
    // ces 4 champs plats sont remplacés par fonds_repartition (voir app-fonds-repartition),
    // qui gère lui-même sa propre validation par ligne — on les laisse optionnels ici.
    ['prix_cad', 'devise_originale', 'prix_devise_originale', 'fonds_budgetaire'].forEach(field => {
      const ctrl = this.itemForm.get(field);
      if (!ctrl) return;
      (isSaisie || this.gereFondsPartages) ? ctrl.clearValidators() : ctrl.setValidators(Validators.required);
      ctrl.updateValueAndValidity({ emitEvent: false });
    });
    this.updateDeviseAutreValidator();
  }

  get financeFieldsRequired(): boolean {
    return !(this.itemForm.get('statut_bibliotheque')?.value ?? '').startsWith('Saisie en cours');
  }

  /** "Autre" (devise hors liste) exige la précision en texte libre, mais seulement quand le
   *  reste des champs financiers est lui-même requis (voir updateFinanceValidators) — et
   *  jamais en fonds partagés, où chaque ligne gère sa propre précision de devise. */
  private updateDeviseAutreValidator(): void {
    const ctrl = this.itemForm.get('devise_autre_precision');
    if (!ctrl) return;
    if (!this.gereFondsPartages && this.financeFieldsRequired && this.itemForm.get('devise_originale')?.value === 'Autre') {
      ctrl.setValidators([Validators.required, Validators.maxLength(100)]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  /** Fonds partagés : uniquement pour les 3 formulaires usager qui le supportent — voir
   *  sql/items_fonds.sql. Les 3 autres types (PEB Tipasa, Requête Accessibilité, Suggestion
   *  d'achat) gardent les champs plats prix_cad/devise_originale/prix_devise_originale/
   *  fonds_budgetaire tels quels. */
  get gereFondsPartages(): boolean {
    return this.isNouvelAchatUnique() || this.isNouvelAbonnement() || this.isModificationCCOL();
  }

  get fondsRepartitionArray(): FormArray {
    return this.itemForm.get('fonds_repartition') as FormArray;
  }

  /** "Autre" + précision libre → la valeur envoyée/stockée en base est directement le texte
   *  saisi (ex. "Réal brésilien"), sans colonne dédiée — voir devise_autre_precision. */
  private resoudreDeviseRepartition(l: any): string {
    return l.devise_originale === 'Autre' ? (l.devise_autre_precision || 'Autre') : l.devise_originale;
  }

  /** Répartition prête pour l'envoi : devise résolue (voir resoudreDeviseRepartition), sans
   *  le champ devise_autre_precision (usage FE uniquement, non stocké côté serveur). */
  private repartitionAEnvoyer(): any[] {
    return this.fondsRepartitionArray.getRawValue().map((l: any) => ({
      devise_originale:      this.resoudreDeviseRepartition(l),
      prix_devise_originale: l.prix_devise_originale,
      prix_cad:              l.prix_cad,
      fonds_budgetaire:      l.fonds_budgetaire,
      pourcentage:           l.pourcentage,
    }));
  }

  /** Reconstruit le FormArray fonds_repartition à partir d'un item/réponse chargé —
   *  fonds_repartition (fonds partagés, ≥ 2 lignes, chacune avec sa propre devise/prix) si
   *  présent, sinon une seule ligne à partir des champs plats habituels. */
  private chargerFondsRepartition(source: any): void {
    const arr = this.fondsRepartitionArray;
    while (arr.length) arr.removeAt(0);
    const lignesSource = Array.isArray(source?.fonds_repartition) && source.fonds_repartition.length > 1
      ? source.fonds_repartition
      : [{
          devise_originale:      source?.devise_originale,
          prix_devise_originale: source?.prix_devise_originale,
          prix_cad:              source?.prix_cad,
          fonds_budgetaire:      source?.fonds_budgetaire,
          pourcentage:           100,
        }];
    lignesSource.forEach((l: any) => {
      const deviseConnue = this.devises.some(d => d.code === l.devise_originale);
      arr.push(FondsRepartitionComponent.creerLigne({
        devise_originale:       deviseConnue || !l.devise_originale ? (l.devise_originale || '') : 'Autre',
        devise_autre_precision: deviseConnue || !l.devise_originale ? '' : l.devise_originale,
        prix_devise_originale:  l.prix_devise_originale ?? null,
        prix_cad:               l.prix_cad ?? null,
        fonds_budgetaire:       l.fonds_budgetaire || '',
        pourcentage:            l.pourcentage != null ? Number(l.pourcentage) : 100,
      }));
    });
  }

  get showDecisionAcqTab(): boolean {
    const s = this.itemForm.get('statut_bibliotheque')?.value ?? '';
    return !!s && s !== '' && s !== 'Saisie en cours - En attente';
  }

  private updateSuiviAcqValidator(statut: string): void {
    const ctrl = this.itemForm.get('suivi_acq');
    if (!ctrl) return;
    if (statut === 'Saisie en cours - En attente') {
      ctrl.clearValidators();
    } else {
      ctrl.setValidators(Validators.required);
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  get suiviAcqRequired(): boolean {
    return this.itemForm.get('statut_bibliotheque')?.value !== 'Saisie en cours - En attente';
  }

  private prefillFromReponse(reponse: any): void {
    this.reponseIdOrigine = reponse.id ?? null;
    const r = reponse.reponses || {};
    const baseData = r.baseData || {};
    const specificData = r.specificData || {};
    // Format plat (Suggestion d'achat - Usager, ancien formulaire) : les champs sont
    // directement sur r, pas sous r.baseData/r.specificData — on les inclut pour ne pas
    // perdre par ex. r.usager_nom (la personne concernée par la suggestion), distinct
    // de reponse.usager_nom (le·la TechDoc qui a soumis le formulaire, ci-dessous).
    // Même logique de branchement que creerItemDepuisReponse côté backend.
    const flat = (!r.baseData && !r.specificData) ? r : {};

    // Déclenche onFormulaireTypeChange → applique les validateurs du bon type
    this.itemForm.patchValue({ formulaire_type: reponse.type_formulaire });

    // Pré-remplit tous les champs sans déclencher un second reset
    this.itemForm.patchValue({
      demandeur: reponse.usager_nom,
      usager_nom: reponse.usager_nom,
      usager_courriel: reponse.usager_courriel,
      usager_statut: reponse.usager_statut,
      ...flat,
      ...baseData,
      ...specificData
    }, { emitEvent: false });

    if (this.gereFondsPartages) {
      this.chargerFondsRepartition({ ...flat, ...baseData });
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      formulaire_type: [null, Validators.required],
      date_creation: [''],
      priorite_demande: ['Régulier'],
      titre_document: ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre: ['', Validators.maxLength(500)],
      isbn_issn: ['', [Validators.required, Validators.maxLength(50)]],
      editeur: ['', [Validators.required, Validators.maxLength(300)]],
      date_publication: ['', Validators.maxLength(50)],
      creation_notice_dtdm: [null],
      note_dtdm: [''],
      prix_cad: [null, Validators.required],
      devise_originale: ['', Validators.required],
      devise_autre_precision: [''],
      prix_devise_originale: [null, Validators.required],
      fonds_repartition: this.fb.array([]),
      periode_couverte: [''],
      nombre_titres_inclus: [null],
      nombre_utilisateurs: [''],
      lien_plateforme: [''],
      format_pret_numerique: [''],
      categorie_document: ['', Validators.required],
      format_support: ['', Validators.required],
      fonds_budgetaire: ['', Validators.required],
      fonds_sn_projet: ['', Validators.maxLength(50)],
      bibliotheque: ['', Validators.required],
      localisation_emplacement: ['', Validators.maxLength(200)],
      demandeur: ['', [Validators.required, Validators.maxLength(200)]],
      personne_a_aviser_nom: ['', Validators.maxLength(200)],
      personne_a_aviser_courriel: ['', [Validators.maxLength(200), Validators.email]],
      source_information: ['', [Validators.required, Validators.maxLength(500)]],
      note_commentaire: [''],
      id_ressource: ['', Validators.maxLength(50)],
      catalogue: ['', Validators.maxLength(200)],
      statut_bibliotheque: ['Saisie en cours - En attente'],
      statut_acq: ['En attente'],
      suivi_acq: [''],
      note_acq: [''],
      bibliotheque_note_interne: [''],
      date_modification: [{ value: '', disabled: true }],
      utilisateur_modification: [{ value: '', disabled: true }],
      precision_demande: [''],
      numero_oclc: [''],
      date_debut_abonnement: [''],
      type_monographie: [''],
      projets_speciaux: ['Ne s\'applique pas'],
      format_electronique: [''],
      reserve_cours: [false],
      reserve_cours_sigle: [''],
      reserve_cours_session: [''],
      reserve_cours_enseignant: [''],
      bordereau_imprime: ['Non'],
      quantite: [null],
      usager_aviser_reservation:  ['', [Validators.maxLength(255), Validators.email]],
      usager_aviser_activation:   ['', [Validators.maxLength(255), Validators.email]],
      auteur: ['', Validators.maxLength(500)],
      reference_tipasa: [''],
      gobi_vu_format_numerique: [''],
      gobi_version_moins_365_usd: ["Ne s'applique pas"],
      acq_responsable_courriel: ['', [Validators.maxLength(255), Validators.email]],
      // Requête Accessibilité — champs spécifiques
      reference_usager:               [''],
      besoin_specifique_format:       [''],
      permalien_sofia:                [''],
      fournisseur_contacte_sans_succes: [''],
      exemplaire_detenu:              [''],
      exemplaire_electronique_detenu: [''],
      verification_caeb:              [''],
      verification_sqla:              [''],
      verification_emma:              [''],
      acq_numerisation_recommandee:   [''],
      acq_date_demande_editeur:       [''],
      acq_date_livraison_estimee:     [''],
      // Suggestion d'achat
      usager_statut: ['', Validators.maxLength(100)],
      usager_faculte: ['', Validators.maxLength(255)],
      usager_courriel: ['', [Validators.maxLength(255), Validators.email]],
      bibliothecaire_disciplinaire: ['', Validators.maxLength(255)],
      aviser_reservation: [false],
      aviser_reception: [true],
      date_requise_cours: [''],
      usager_nom: ['', Validators.maxLength(200)],
      note_usager: [''],
      techdoc_suggestion_transmise: [false],
      acq_raison_annulation: [''],
      acq_isbn: ['', Validators.maxLength(50)],

    });
  }

  onFormulaireTypeChange(type: string): void {
    this.selectedFormulaireType = type;
    this.resetSpecificFields();

    // categorie_document est requis par défaut (voir sa définition dans le FormGroup) sauf pour
    // Requête ACQ Accessibilité, qui n'affiche plus ce champ (remplacé par Type de monographie,
    // spécifique à ce formulaire — voir requete-accessibilite côté usager). On efface aussi sa
    // valeur en passant à ce type : sinon une valeur choisie pour un type précédent (ex.
    // "Monographie") resterait en mémoire dans le contrôle, invisible dans ce tab, mais tout
    // de même envoyée à la sauvegarde (extractBaseData l'inclut pour tous les types).
    const categorieDocCtrl = this.itemForm.get('categorie_document');
    if (type === 'Requête ACQ Accessibilité') {
      categorieDocCtrl?.setValidators([]);
      categorieDocCtrl?.setValue(null, { emitEvent: false });
    } else {
      categorieDocCtrl?.setValidators([Validators.required]);
    }

    switch(type) {
      case 'Modification et CCOL':
        this.itemForm.get('precision_demande')?.setValidators([Validators.required]);
        break;
      case 'Nouvel abonnement':
        this.itemForm.get('date_debut_abonnement')?.setValidators([Validators.required]);
        break;
      case 'Nouvel achat unique':
        this.itemForm.get('quantite')?.setValidators([Validators.required, Validators.min(1)]);
        break;
      case 'PEB Tipasa numérique':
        this.itemForm.get('gobi_vu_format_numerique')?.setValidators([Validators.required]);
        break;
      case 'Requête ACQ Accessibilité':
        this.itemForm.get('besoin_specifique_format')?.setValidators([Validators.required]);
        break;
      case "Suggestion d'achat - Usager":
        this.itemForm.get('auteur')?.setValidators([Validators.required, Validators.maxLength(500)]);
        this.itemForm.get('usager_statut')?.setValidators([Validators.required, Validators.maxLength(100)]);
        this.itemForm.get('usager_faculte')?.setValidators([Validators.required, Validators.maxLength(255)]);
        this.itemForm.get('usager_courriel')?.setValidators([Validators.required, Validators.maxLength(255), Validators.email]);
        this.itemForm.get('bibliothecaire_disciplinaire')?.setValidators([Validators.required, Validators.maxLength(255), Validators.email]);
        break;
      default:
        break;
    }

    const specificFieldsToUpdate = [
      'precision_demande', 'date_debut_abonnement', 'type_monographie',
      'gobi_vu_format_numerique', 'besoin_specifique_format', 'quantite',
      'auteur', 'usager_statut', 'usager_faculte', 'usager_courriel', 'bibliothecaire_disciplinaire',
      'categorie_document'
    ];

    specificFieldsToUpdate.forEach(field => {
      const control = this.itemForm.get(field);
      if (control) control.updateValueAndValidity({ emitEvent: false });
    });

    // Réévalue immédiatement les validateurs des champs financiers plats (au lieu d'attendre
    // un changement de statut_bibliotheque sans rapport) — nécessaire pour gereFondsPartages,
    // qui dépend du type qu'on vient de changer.
    this.updateFinanceValidators(this.itemForm.get('statut_bibliotheque')?.value);
    if (this.gereFondsPartages && this.fondsRepartitionArray.length === 0) {
      this.chargerFondsRepartition({
        devise_originale:      this.itemForm.get('devise_originale')?.value,
        prix_devise_originale: this.itemForm.get('prix_devise_originale')?.value,
        prix_cad:              this.itemForm.get('prix_cad')?.value,
        fonds_budgetaire:      this.itemForm.get('fonds_budgetaire')?.value,
      });
    }
  }

  resetSpecificFields(): void {
    // Validateurs de base à restaurer après reset (sans 'required', qui est type-spécifique)
    const baseValidators: { [key: string]: ValidatorFn[] } = {
      'acq_responsable_courriel':     [Validators.maxLength(255), Validators.email],
      'usager_aviser_reservation':    [Validators.maxLength(255), Validators.email],
      'usager_aviser_activation':     [Validators.maxLength(255), Validators.email],
      'usager_courriel':              [Validators.maxLength(255), Validators.email],
      'bibliothecaire_disciplinaire': [Validators.maxLength(255)],
      'auteur':                       [Validators.maxLength(500)],
      'acq_isbn':                     [Validators.maxLength(50)],
      'usager_nom':                   [Validators.maxLength(200)],
    };

    const specificFields = [
      'precision_demande', 'numero_oclc',
      'date_debut_abonnement', 'type_monographie', 'projets_speciaux',
      'format_electronique', 'reserve_cours', 'reserve_cours_sigle',
      'reserve_cours_session', 'reserve_cours_enseignant', 'bordereau_imprime',
      'reference_tipasa', 'gobi_version_moins_365_usd', 'acq_responsable_courriel',
      // Requête Accessibilité
      'reference_usager', 'besoin_specifique_format', 'permalien_sofia',
      'fournisseur_contacte_sans_succes', 'exemplaire_detenu', 'exemplaire_electronique_detenu',
      'verification_caeb', 'verification_sqla', 'verification_emma',
      'acq_numerisation_recommandee', 'acq_date_demande_editeur', 'acq_date_livraison_estimee',
      // Suggestion d'achat
      'usager_statut', 'usager_faculte', 'usager_courriel',
      'bibliothecaire_disciplinaire', 'aviser_reservation', 'aviser_reception',
      'date_requise_cours', 'auteur',
      'usager_nom', 'note_usager', 'techdoc_suggestion_transmise', 'acq_raison_annulation', 'acq_isbn',
      // Partagés
      'format_pret_numerique',
      // Nouvel achat unique
      'id_ressource', 'quantite', 'usager_aviser_reservation', 'usager_aviser_activation'
    ];

    specificFields.forEach(field => {
      const control = this.itemForm.get(field);
      if (control) {
        const base = baseValidators[field];
        base ? control.setValidators(base) : control.clearValidators();
        const defaultValue = field === 'projets_speciaux' ? 'Ne s\'applique pas'
                           : field === 'bordereau_imprime'  ? 'Non'
                           : null;
        control.reset(defaultValue, { emitEvent: false });
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  isModificationCCOL(): boolean { return this.selectedFormulaireType === 'Modification et CCOL'; }
  isNouvelAbonnement(): boolean { return this.selectedFormulaireType === 'Nouvel abonnement'; }
  isNouvelAchatUnique(): boolean { return this.selectedFormulaireType === 'Nouvel achat unique'; }
  isPEBTipasaNumerique(): boolean { return this.selectedFormulaireType === 'PEB Tipasa numérique'; }
  isRequeteAccessibilite(): boolean { return this.selectedFormulaireType === 'Requête ACQ Accessibilité'; }
  isSuggestionAchat(): boolean { return this.selectedFormulaireType === "Suggestion d'achat - Usager"; }

  hasSpecificFields(): boolean {
    return !!this.selectedFormulaireType;
  }

  loadItem(): void {
    if (!this.itemId) return;

    this.loading = true;
    this.itemService.consulter(this.itemId).subscribe({
      next: (response: ApiResponse<Item>) => {
        if (response.success && response.data) {
          // Normalise les noms de type hérités (formulaires usager vs admin)
          const typeAliases: Record<string, string> = {
            'Requête ACQ':           'Requête ACQ Accessibilité',
            'Requête Accessibilité': 'Requête ACQ Accessibilité',
            "Suggestion d'achat":    "Suggestion d'achat - Usager",
          };
          const rawType = response.data.formulaire_type || null;
          const normalizedType = (rawType && typeAliases[rawType]) ? typeAliases[rawType] : rawType;
          this.selectedFormulaireType = normalizedType;

          // Patch les champs de base (toujours à la racine de response.data). Rétrocompatibilité
          // devise : une valeur enregistrée qui ne correspond à aucun code connu (ancienne
          // saisie "Autre" avant l'ajout de la précision, ou texte déjà libre) est restaurée
          // comme "Autre" + la valeur d'origine dans le champ de précision.
          const deviseOriginale = (response.data as any).devise_originale;
          const deviseConnue    = this.devises.some(d => d.code === deviseOriginale);
          this.itemForm.patchValue({
            ...response.data,
            formulaire_type:        normalizedType,
            devise_originale:       deviseConnue || !deviseOriginale ? deviseOriginale : 'Autre',
            devise_autre_precision: deviseConnue || !deviseOriginale ? '' : deviseOriginale,
          }, { emitEvent: false });
          this.updateDeviseAutreValidator();

          if (this.gereFondsPartages) {
            this.chargerFondsRepartition(response.data);
          }

          // Patch les champs spécifiques si le backend les retourne dans un objet imbriqué
          const specificData = (response.data as any).specificData;
          if (specificData && typeof specificData === 'object') {
            this.itemForm.patchValue(specificData, { emitEvent: false });
          }

          // Applique les validateurs pour le type chargé sans déclencher de reset
          this.applyValidatorsForEditMode(this.selectedFormulaireType);

          this.itemForm.get('formulaire_type')?.disable({ emitEvent: false });

          // Ouvre l'onglet demandé via le paramètre ?tab= (ex : ?tab=acq-decision)
          const tabParam = this.route.snapshot.queryParamMap.get('tab');
          if (tabParam) { this.setActiveTab(tabParam); }
        } else {
          this.dialogService.showError(response.error || 'Impossible de charger l\'item');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.dialogService.showError('Erreur lors du chargement de l\'item');
        this.loading = false;
      }
    });
  }

  private applyValidatorsForEditMode(type: string | null): void {
    this.itemForm.get('categorie_document')?.setValidators(
      type === 'Requête ACQ Accessibilité' ? [] : [Validators.required]
    );
    switch (type) {
      case 'Modification et CCOL':
        this.itemForm.get('precision_demande')?.setValidators([Validators.required]);
        break;
      case 'Nouvel abonnement':
        this.itemForm.get('date_debut_abonnement')?.setValidators([Validators.required]);
        break;
      case 'Nouvel achat unique':
        this.itemForm.get('quantite')?.setValidators([Validators.required, Validators.min(1)]);
        break;
      case 'PEB Tipasa numérique':
        this.itemForm.get('gobi_vu_format_numerique')?.setValidators([Validators.required]);
        break;
      case 'Requête ACQ Accessibilité':
        this.itemForm.get('besoin_specifique_format')?.setValidators([Validators.required]);
        break;
      case "Suggestion d'achat - Usager":
        this.itemForm.get('auteur')?.setValidators([Validators.required, Validators.maxLength(500)]);
        this.itemForm.get('usager_statut')?.setValidators([Validators.required, Validators.maxLength(100)]);
        this.itemForm.get('usager_faculte')?.setValidators([Validators.required, Validators.maxLength(255)]);
        this.itemForm.get('usager_courriel')?.setValidators([Validators.required, Validators.maxLength(255), Validators.email]);
        this.itemForm.get('bibliothecaire_disciplinaire')?.setValidators([Validators.required, Validators.maxLength(255), Validators.email]);
        break;
    }
    const specificFields = [
      'precision_demande', 'date_debut_abonnement', 'type_monographie',
      'gobi_vu_format_numerique', 'besoin_specifique_format', 'quantite',
      'auteur', 'usager_statut', 'usager_faculte', 'usager_courriel', 'bibliothecaire_disciplinaire',
      'categorie_document'
    ];
    specificFields.forEach(field => {
      this.itemForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }
 
  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.itemForm.invalid) {
      this.markFormGroupTouched();
      const acqInvalidFields = ['suivi_acq'];
      const specificInvalidFields = [
        'precision_demande', 'date_debut_abonnement', 'gobi_vu_format_numerique',
        'besoin_specifique_format', 'quantite', 'auteur', 'usager_statut',
        'usager_faculte', 'usager_courriel', 'bibliothecaire_disciplinaire'
      ];
      const hasAcqError = acqInvalidFields.some(f => this.itemForm.get(f)?.invalid);
      const hasSpecificError = specificInvalidFields.some(f => this.itemForm.get(f)?.invalid);
      if (hasAcqError) {
        this.setActiveTab('acq-decision');
      } else if (hasSpecificError && this.activeTab === 'base') {
        this.setActiveTab('specifique');
      }
      this.dialogService.showWarning('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.submitting = true;
    const formData = this.itemForm.getRawValue();
    const baseData = this.extractBaseData(formData);
    const specificData = this.extractSpecificData(formData);

    const itemData = {
      ...baseData,
      specificData: specificData,
      formulaire_type: formData.formulaire_type || this.selectedFormulaireType,
      // Relie l'item à sa réponse usager d'origine (lien tbl_reponses.item_id_cree
      // + rattachement des pièces jointes déjà envoyées — voir controllers/items.js)
      ...(this.reponseIdOrigine ? { reponse_id: this.reponseIdOrigine } : {})
    };

    if (this.isEditMode && this.itemId) {
      const updateData = { ...itemData, item_id: this.itemId };
      this.itemService.update(updateData).subscribe({
        next: (response: ApiResponse<Item>) => {
          this.submitting = false;
          if (response.success) {
            this.reponsesService.triggerPendingRefresh();
            this.dialogService.showSuccess('Item modifié avec succès!');
            setTimeout(() => this.router.navigate(['/items']), 1500);
          } else {
            this.dialogService.showError(response.error || response.message || 'Erreur inconnue');
          }
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.submitting = false;
          const errorMsg = error.error?.error || error.error?.message || error.message || 'Erreur inconnue';
          this.dialogService.showError('Erreur lors de la modification: ' + errorMsg);
        }
      });
    } else {
      this.itemService.post(itemData).subscribe({
        next: (response: ApiResponse<Item>) => {
          this.submitting = false;
          if (response.success) {
            // Renseigner l'id créé déclenche l'envoi des pièces jointes choisies
            // avant l'enregistrement (voir PieceJointeGestionComponent.ngOnChanges).
            if (response.data?.item_id) this.itemId = response.data.item_id;
            this.reponsesService.triggerPendingRefresh();
            this.dialogService.showSuccess('Item créé avec succès!');
            setTimeout(() => this.router.navigate(['/items']), 1500);
          } else {
            this.dialogService.showError(response.error || response.message || 'Erreur inconnue');
          }
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.submitting = false;
          const errorMsg = error.error?.error || error.error?.message || error.message || 'Erreur inconnue';
          this.dialogService.showError('Erreur lors de la création: ' + errorMsg);
        }
      });
    }
  }

  private extractBaseData(formData: any): any {
    const repartition = this.gereFondsPartages ? this.repartitionAEnvoyer() : null;

    return {
      formulaire_type: formData.formulaire_type,
      date_creation: formData.date_creation,
      priorite_demande: formData.priorite_demande,
      titre_document: formData.titre_document,
      sous_titre: formData.sous_titre,
      isbn_issn: formData.isbn_issn,
      editeur: formData.editeur,
      date_publication: formData.date_publication,
      creation_notice_dtdm: formData.creation_notice_dtdm,
      note_dtdm: formData.note_dtdm,
      categorie_document: formData.categorie_document,
      format_support: formData.format_support,
      fonds_budgetaire: repartition ? (repartition[0]?.fonds_budgetaire || '') : formData.fonds_budgetaire,
      fonds_sn_projet: formData.fonds_sn_projet,
      bibliotheque: formData.bibliotheque,
      localisation_emplacement: formData.localisation_emplacement,
      demandeur: formData.demandeur,
      personne_a_aviser_nom: formData.personne_a_aviser_nom,
      personne_a_aviser_courriel: formData.personne_a_aviser_courriel,
      statut_bibliotheque: formData.statut_bibliotheque,
      statut_acq: formData.statut_acq,
      suivi_acq: formData.suivi_acq,
      note_acq: formData.note_acq,
      bibliotheque_note_interne: formData.bibliotheque_note_interne,
      source_information: formData.source_information,
      note_commentaire: formData.note_commentaire,
      catalogue: formData.catalogue,
      prix_cad: repartition ? repartition.reduce((s, l) => s + (Number(l.prix_cad) || 0), 0) : formData.prix_cad,
      devise_originale: repartition ? (repartition[0]?.devise_originale || '') : this.deviseAEnvoyer(formData),
      prix_devise_originale: repartition ? (repartition[0]?.prix_devise_originale ?? null) : formData.prix_devise_originale,
      periode_couverte: formData.periode_couverte,
      nombre_titres_inclus: formData.nombre_titres_inclus,
      nombre_utilisateurs: formData.nombre_utilisateurs,
      lien_plateforme: formData.lien_plateforme,
      format_pret_numerique: formData.format_pret_numerique,
      ...(repartition ? { fonds_repartition: repartition } : {}),
    };
  }

  private extractSpecificData(formData: any): any {
    const type = this.selectedFormulaireType;

    switch(type) {
      case 'Modification et CCOL':
        return {
          precision_demande:        formData.precision_demande,
          numero_oclc:              formData.numero_oclc,
          date_debut_abonnement:    formData.date_debut_abonnement,
          usager_aviser_activation: formData.usager_aviser_activation,
        };
      case 'Nouvel abonnement':
        return {
          date_debut_abonnement:      formData.date_debut_abonnement,
          type_monographie:           formData.type_monographie,
          usager_aviser_reservation:  formData.usager_aviser_reservation,
        };
      case 'Nouvel achat unique':
        return {
          id_ressource:               formData.id_ressource,
          projets_speciaux:           formData.projets_speciaux,
          type_monographie:           formData.type_monographie,
          format_electronique:        formData.format_electronique,
          reserve_cours:              formData.reserve_cours,
          reserve_cours_sigle:        formData.reserve_cours_sigle,
          reserve_cours_session:      formData.reserve_cours_session,
          reserve_cours_enseignant:   formData.reserve_cours_enseignant,
          bordereau_imprime:          formData.bordereau_imprime,
          quantite:                   formData.quantite,
          usager_aviser_reservation:  formData.usager_aviser_reservation,
          usager_aviser_activation:   formData.usager_aviser_activation
        };
      case 'PEB Tipasa numérique':
        return {
          reference_tipasa:            formData.reference_tipasa,
          gobi_vu_format_numerique:    formData.gobi_vu_format_numerique,
          gobi_version_moins_365_usd:  formData.gobi_version_moins_365_usd,
          acq_responsable_courriel:    formData.acq_responsable_courriel,
        };
      case 'Requête ACQ Accessibilité':
        return {
          reference_usager:                 formData.reference_usager,
          besoin_specifique_format:         formData.besoin_specifique_format,
          permalien_sofia:                  formData.permalien_sofia,
          fournisseur_contacte_sans_succes: formData.fournisseur_contacte_sans_succes,
          exemplaire_detenu:                formData.exemplaire_detenu,
          exemplaire_electronique_detenu:   formData.exemplaire_electronique_detenu,
          verification_caeb:                formData.verification_caeb,
          verification_sqla:                formData.verification_sqla,
          verification_emma:                formData.verification_emma,
          acq_numerisation_recommandee:     formData.acq_numerisation_recommandee,
          acq_date_demande_editeur:         formData.acq_date_demande_editeur,
          acq_date_livraison_estimee:       formData.acq_date_livraison_estimee,
          acq_responsable_courriel:         formData.acq_responsable_courriel,
          type_monographie:                 formData.type_monographie,
        };

      case "Suggestion d'achat - Usager":
        return {
          auteur:                       formData.auteur,
          usager_statut:                formData.usager_statut,
          usager_faculte:               formData.usager_faculte,
          usager_courriel:              formData.usager_courriel,
          bibliothecaire_disciplinaire: formData.bibliothecaire_disciplinaire,
          aviser_reservation:           formData.aviser_reservation,
          aviser_reception:             formData.aviser_reception,
          date_requise_cours:           formData.date_requise_cours || null,
          reserve_cours:                formData.reserve_cours,
          reserve_cours_sigle:          formData.reserve_cours_sigle,
          bordereau_imprime:            formData.bordereau_imprime,
          acq_responsable_courriel:     formData.acq_responsable_courriel,
          usager_nom:                   formData.usager_nom,
          note_usager:                  formData.note_usager,
          techdoc_suggestion_transmise: formData.techdoc_suggestion_transmise,
          acq_raison_annulation:        formData.acq_raison_annulation,
          acq_isbn:                     formData.acq_isbn,
        };
      default:
        return {};
    }
  }

  private convertirPrix(): void {
    const prix   = this.itemForm.get('prix_devise_originale')?.value;
    const devise = this.itemForm.get('devise_originale')?.value;
    const result = convertirPrixCad(prix, devise, this.tauxRates);
    if (result != null) this.itemForm.get('prix_cad')?.setValue(result, { emitEvent: false });
  }

  get deviseConvertible(): boolean {
    return estDeviseConvertible(this.itemForm.get('devise_originale')?.value, this.tauxRates);
  }

  /** "Autre" + précision libre → la valeur envoyée/stockée en base est directement le texte
   *  saisi (ex. "Réal brésilien"), sans colonne dédiée — voir devise_autre_precision. */
  private deviseAEnvoyer(v: any): string {
    return v.devise_originale === 'Autre' ? (v.devise_autre_precision || 'Autre') : v.devise_originale;
  }

  async onCancel(): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      'Voulez-vous vraiment annuler ? Les modifications non sauvegardées seront perdues.',
      'Confirmer l\'annulation'
    );
    if (confirmed) {
      this.router.navigate(['/items']);
    }
  }

  onReturn(): void {
    this.location.back();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.itemForm.controls).forEach(key => {
      const control = this.itemForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.itemForm.get(controlName);
    return control ? control.hasError(errorType) && (control.touched || control.dirty) : false;
  }

  isInvalid(controlName: string): boolean {
    const control = this.itemForm.get(controlName);
    return control ? control.invalid && (control.touched || control.dirty) : false;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}