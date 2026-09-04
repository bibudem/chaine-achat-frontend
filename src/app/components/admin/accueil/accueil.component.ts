import { Component, OnInit, OnDestroy } from '@angular/core';
import { HomeService, DashboardStats, GraphData, Period, ApiResponse, AllHomeData } from '../../../services/home.service';
import { ConfigService } from '../../../services/config.service';
import { DialogService } from '../../../services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { formulaireTypeLabel, formulaireTypeIcon } from '../../../lib/ListeChoixOptions';
import { ReponsesService } from '../../../services/reponses.service';
import { ItemFormulaireService } from '../../../services/items-formulaire.service';
import { ACQ_STATUT_DEFAUT, ACQ_SUIVI_DEFAUT } from '../../../lib/DemandeStatut';
import { anneesDisponibles } from '../../../lib/AnneesDisponibles';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css']
})


export class AccueilComponent implements OnInit, OnDestroy {

  /** Libellé court d'affichage pour un type de formulaire (légende, badges…). */
  readonly formulaireTypeLabel = formulaireTypeLabel;

  /* ─── Données ─── */
  dashboardStats: DashboardStats = this.defaultStats();
  graphData: GraphData | null = null;

  /* ─── États UI ─── */
  isLoadingDashboard = true;
  isLoadingGraphs    = true;
  hasError           = false;
  errorMessage       = '';

  /** « Total des demandes en attente » — même compteur que la cloche de notifications
   *  (reponsesService.getPendingBib), pas dashboardStats.totals.en_attente (qui est un
   *  compte différent : statut_acq = 'En attente' sur la période sélectionnée seulement). */
  totalEnAttente: number | null = null;
  isLoadingEnAttente = true;

  /** « Total demandes » — total RÉEL d'items dans le système, pas totals.total_items (qui
   *  est scopé à la période sélectionnée — voir models/home.js, CTE `filtered`). Chargé via
   *  la même liste que la page /items (limit=1, on ne veut que le count). */
  totalItemsSysteme: number | null = null;
  isLoadingTotalItems = true;

  /* ─── Panneau aide ─── */
  showHelpPanel = false;

  /* ─── Config ressources ACQ ─── */
  acqConfig = {
    majDate:        '2 septembre 2025',
    repartitionUrl: '',
    tauxRate:       '1,368',
    tauxPeriode:    '2025–2026'
  };
  editConfig  = { ...this.acqConfig };
  editingCard: 'repartition' | 'taux' | null = null;
  isSavingConfig = false;

  /* ─── Subscriptions ─── */
  private subs = new Subscription();

  /* ─── Année sélectionnée ─── (filtre les panels d'activité — répartition par type, top
     demandeurs, par bibliothèque ; "all" = toutes années confondues. N'affecte pas les 4
     cartes du haut ni Par statut/suivi ACQ, toujours à jour — voir models/home.js).
     Défaut = année en cours plutôt que "all" : avec beaucoup de données, "all" force ces
     panels à scanner tout l'historique à chaque chargement du tableau de bord au lieu de
     l'année courante seule (index range scan sur date_creation). */
  readonly availableYears: number[] = anneesDisponibles();

  private _selectedPeriod: Period = String(this.availableYears[0] ?? 'all');

  get selectedPeriod(): Period { return this._selectedPeriod; }

  set selectedPeriod(value: Period) {
    if (value !== this._selectedPeriod) {
      this._selectedPeriod = value;
      this.loadAllData();
    }
  }

  /* ─── Utilitaires template ─── */
  readonly Math = Math;

  /* ─── Catalogue types (toutes périodes) ───
     Mêmes 2 groupes et le même regroupement que UsagerHomeComponent (accueil usager),
     pour que le catalogue admin corresponde à ce que l'usager voit. */
  readonly GROUPE_COLLECTIONS = 'Développement des collections';
  readonly GROUPE_USAGERS     = 'Acquisitions pour les usagers';

  readonly allTypes: string[] = [
    'Nouvel achat unique', 'Nouvel abonnement', 'Modification et CCOL',
    'Requête ACQ Accessibilité', "Suggestion d'achat - Usager", 'PEB Tipasa numérique'
  ];

  private readonly typeGroupeMap: Record<string, string> = {
    'Nouvel achat unique':         this.GROUPE_COLLECTIONS,
    'Nouvel abonnement':           this.GROUPE_COLLECTIONS,
    'Modification et CCOL':        this.GROUPE_COLLECTIONS,
    'Requête ACQ Accessibilité':   this.GROUPE_USAGERS,
    "Suggestion d'achat - Usager": this.GROUPE_USAGERS,
    'PEB Tipasa numérique':        this.GROUPE_USAGERS,
  };

  get typeGroupes(): { label: string; types: string[] }[] {
    return [
      { label: this.GROUPE_COLLECTIONS, types: this.allTypes.filter(t => this.typeGroupeMap[t] === this.GROUPE_COLLECTIONS) },
      { label: this.GROUPE_USAGERS,     types: this.allTypes.filter(t => this.typeGroupeMap[t] === this.GROUPE_USAGERS) },
    ];
  }

  typeAllTimeCounts: Record<string, number> = {};
  isLoadingTypeCounts = true;

  readonly typeDescriptions: Record<string, string> = {
    'Nouvel achat unique':   'Acquisition d\'un document imprimé ou électronique',
    'Nouvel abonnement':     'Abonnement à un périodique ou une ressource continue',
    'Modification et CCOL':  'Modification d\'une notice dans le catalogue collectif',
    'PEB Tipasa numérique':  'Prêt entre bibliothèques via la plateforme Tipasa',
    'Requête ACQ Accessibilité': 'Demande adressée directement aux acquisitions',
"Suggestion d'achat - Usager": 'Suggestion soumise par un usager de la bibliothèque',
  };

  readonly chartColors = {
    primary:   '#00407F',
    secondary: '#0057AC',
    success:   '#52B782',
    warning:   '#B72600',
    light:     '#CCE2F3',
    dark:      '#0B113A',
    gray:      '#607386'
  };

  constructor(
    private homeService: HomeService,
    private configService: ConfigService,
    private dialog: DialogService,
    private translate: TranslateService,
    private router: Router,
    public authService: AuthService,
    private reponsesService: ReponsesService,
    private itemService: ItemFormulaireService
  ) {}

  ngOnInit(): void {
    this.loadAcqConfig();
    this.loadAllData();
    this.loadTypeCounts();
    this.loadTotalEnAttente();
    this.loadTotalItemsSysteme();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     CHARGEMENT DES DONNÉES
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  loadAllData(): void {
    this.subs.unsubscribe();
    this.subs = new Subscription();

    this.isLoadingDashboard = true;
    this.isLoadingGraphs    = true;
    this.hasError           = false;

    const sub = this.homeService.getAllHomeData(this._selectedPeriod).subscribe({
      next: (res: ApiResponse<AllHomeData>) => {
        // ── LOG DIAGNOSTIC ─────────────────────────────────────────────
        console.group('/home/all — réponse complète');
        console.log('res.success   :', res?.success);
        console.log('res.data      :', res?.data);
        console.log('dashboard     :', res?.data?.dashboard);
        console.log('dashboard.success:', res?.data?.dashboard?.success);
        console.log('dashboard.data   :', res?.data?.dashboard?.data);
        console.log('graph         :', res?.data?.graph);
        console.groupEnd();

        // ── Dashboard ──────────────────────────────────────────────────
        const dashboard = res?.data?.dashboard;

        if (!dashboard) {
          this.hasError     = true;
          this.errorMessage = 'Réponse dashboard absente — vérifiez le backend /home/all';
          this.isLoadingDashboard = false;
          this.isLoadingGraphs    = false;
          return;
        }

        // Le backend peut retourner success:false avec un message d'erreur
        if (!dashboard.success) {
          this.hasError     = true;
          this.errorMessage = dashboard.message || dashboard.error || 'Erreur backend dashboard';
          this.isLoadingDashboard = false;
          this.isLoadingGraphs    = false;
          return;
        }

        if (dashboard.data) {
          this.dashboardStats = dashboard.data;
          console.log('dashboardStats:', this.dashboardStats);
        }

        // ── Graph ──────────────────────────────────────────────────────
        const graph = res?.data?.graph;
        if (graph?.success && graph.data) {
          this.graphData = graph.data;
        }

        this.isLoadingDashboard = false;
        this.isLoadingGraphs    = false;
      },
      error: (err) => {
        console.error('❌ Erreur HTTP /home/all:', err);
        this.handleError(err.message || 'Erreur de connexion au serveur');
      }
    });

    this.subs.add(sub);
  }

  refreshData(): void {
    window.location.reload();
  }

  /** Le profil TDM consulte le tableau de bord en lecture seule : les liens de navigation
   *  vers la liste des items (catalogue, légende, « Voir tout ») sont désactivés. */
  navigateTo(path: string): void {
    if (this.authService.isTdm) return;
    this.router.navigate([path], { queryParams: { annee: this.anneeQueryParam } });
  }

  /** « Répartition par type » (byType) reflète l'année sélectionnée sur le tableau de
   *  bord — les liens vers la liste des items doivent porter le même filtre, sinon le
   *  nombre affiché ici ne correspond plus à ce qu'on voit en arrivant sur /items. */
  navigateToType(formulaire_type: string): void {
    if (this.authService.isTdm) return;
    this.router.navigate(['/items'], { queryParams: { formulaire_type, annee: this.anneeQueryParam } });
  }

  /** Carte « Demandes urgentes » → liste des items, priorité Urgent ET encore en attente ACQ
   *  (mêmes valeurs par défaut que « Demandes en attente » — voir total_urgentes_attente dans
   *  models/home.js). Pas d'année transmise : toujours toutes années, comme la carte. */
  navigateToUrgentesEnAttente(): void {
    if (this.authService.isTdm) return;
    this.router.navigate(['/items'], {
      queryParams: { priorite_demande: 'Urgent', statut_acq: ACQ_STATUT_DEFAUT, suivi_acq: ACQ_SUIVI_DEFAUT }
    });
  }

  /** « Top 5 demandeurs » (activité, suit l'année sélectionnée comme Répartition par type) →
   *  liste des items, avec le nom du demandeur dans la recherche libre (même champ que
   *  demandeur/titre/isbn/éditeur/id sur /items). */
  navigateToDemandeur(demandeur: string): void {
    if (this.authService.isTdm) return;
    this.router.navigate(['/items'], { queryParams: { search: demandeur, annee: this.anneeQueryParam } });
  }

  /** Catalogue « Types de formulaire » → formulaire de création, type pré-sélectionné (voir
   *  item-formulaire.component.ts, query param ?type=...). Contrairement à navigateToType
   *  (liste filtrée, lecture seule), ceci crée un item — réservé à canEdit. */
  navigateToNouveau(formulaire_type: string): void {
    if (!this.authService.canEdit) return;
    this.router.navigate(['/items/nouveau'], { queryParams: { type: formulaire_type } });
  }

  /** undefined (pas de query param) quand "Toutes années" est sélectionné. */
  private get anneeQueryParam(): string | undefined {
    return this.selectedPeriod !== 'all' ? this.selectedPeriod : undefined;
  }

  /** « Par bibliothèque » (libraryStats) reflète aussi l'année sélectionnée — même raison
   *  que navigateToType. */
  navigateToBibliotheque(bibliotheque: string): void {
    if (this.authService.isTdm) return;
    this.router.navigate(['/items'], { queryParams: { bibliotheque, annee: this.anneeQueryParam } });
  }

  /** Carte « Demandes en attente » → liste des items, avec les filtres Statut ACQ/Suivi ACQ
   *  réellement sélectionnés dans la barre (pas un drapeau caché) — mêmes valeurs par défaut
   *  que la cloche de notifications (voir loadTotalEnAttente). */
  navigateToEnAttente(): void {
    if (this.authService.isTdm) return;
    this.router.navigate(['/items'], {
      queryParams: { statut_acq: ACQ_STATUT_DEFAUT, suivi_acq: ACQ_SUIVI_DEFAUT }
    });
  }

  private loadTotalEnAttente(): void {
    this.isLoadingEnAttente = true;
    const sub = this.reponsesService.getPendingBib(1).subscribe({
      next:  res => { this.totalEnAttente = res.count; this.isLoadingEnAttente = false; },
      error: ()  => { this.totalEnAttente = null;       this.isLoadingEnAttente = false; }
    });
    this.subs.add(sub);
  }

  /** Carte « Total demandes » → liste des items, sans filtre. */
  navigateToItemsListe(): void {
    if (this.authService.isTdm) return;
    this.router.navigate(['/items']);
  }

  private loadTotalItemsSysteme(): void {
    this.isLoadingTotalItems = true;
    const sub = this.itemService.getAll({ limit: 1 }).subscribe({
      next:  res => { this.totalItemsSysteme = res.total ?? 0; this.isLoadingTotalItems = false; },
      error: ()  => { this.totalItemsSysteme = null;           this.isLoadingTotalItems = false; }
    });
    this.subs.add(sub);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     GETTERS SÉCURISÉS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  get totals()        { return this.dashboardStats.totals; }
  get byType()        { return this.dashboardStats.byType        ?? []; }
  get byPriority()    { return this.dashboardStats.byPriority    ?? []; }
  get topDemandeurs() { return this.dashboardStats.topDemandeurs ?? []; }
  get byStatutAcq()   { return this.dashboardStats.byStatutAcq   ?? []; }
  get bySuiviAcq()    { return this.dashboardStats.bySuiviAcq    ?? []; }
  get byMonth()       { return this.dashboardStats.byMonth       ?? []; }
  get libraryStats()  { return this.graphData?.libraryStats      ?? []; }

  /** Panel « Par statut/suivi ACQ » : bascule entre les deux répartitions (même donut). */
  acqBreakdownField: 'statut' | 'suivi' = 'statut';

  setAcqBreakdownField(field: 'statut' | 'suivi'): void {
    this.acqBreakdownField = field;
  }

  get acqBreakdownItems(): { label: string; count: number }[] {
    return this.acqBreakdownField === 'statut'
      ? this.byStatutAcq.map(s => ({ label: s.statut, count: s.count }))
      : this.bySuiviAcq.map(s => ({ label: s.suivi, count: s.count }));
  }

  /**
   * Retourne le count du top demandeur (pour l'axe des barres)
   * Sécurisé : retourne 1 si le tableau est vide pour éviter division par 0
   */
  get maxTopDemandeurCount(): number {
    return this.topDemandeurs.length > 0 ? this.topDemandeurs[0].count : 1;
  }

  get completionRate(): number {
    return this.calculatePercentage(this.totals.termines, this.totals.total_items);
  }

  get pendingRate(): number {
    return this.calculatePercentage(this.totals.en_attente, this.totals.total_items);
  }

  /* Dérivés de byPriority — badge secondaire de la carte "Demandes urgentes" (toutes
     priorités confondues, contrairement à totals.total_urgentes_attente ci-dessus). */
  get prioritaireCount(): number {
    return this.byPriority.find(p =>
      p.priorite?.toLowerCase().includes('prioritaire')
    )?.count ?? 0;
  }

  get periodLabel(): string {
    return this._selectedPeriod === 'all' ? 'Toutes années' : this._selectedPeriod;
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     HELPERS D'AFFICHAGE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  formatNumber(num: number): string {
    return num != null ? num.toLocaleString('fr-CA') : '0';
  }

  calculatePercentage(part: number, total: number): number {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }

  getBibColor(index: number): string {
    // #FFCA40 (doré/orangé) juste après #F04E24 (rouge-orangé) se confondait avec lui dans
    // les légendes à plusieurs catégories — remplacé par un jaune plus doux et net. Assez
    // saturé pour rester lisible utilisé comme couleur de texte (voir .bib-total).
    const colors = ['#0b113a', '#00407F', '#2380D1', '#246405', '#52B782', '#F04E24', '#EAB308'];
    return colors[index % colors.length];
  }

  getTypeColorIndex(type: string): number {
    const idx = this.allTypes.indexOf(type);
    return idx >= 0 ? idx : 0;
  }

  getTypeIcon(type: string): string {
    return 'bi ' + formulaireTypeIcon(type);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     PRIVÉ
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     CONFIG RESSOURCES ACQ
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  private loadTypeCounts(): void {
    this.isLoadingTypeCounts = true;
    this.homeService.getTypeCounts().subscribe({
      next: (res) => {
        this.typeAllTimeCounts = {};
        if (res?.success && Array.isArray(res.data)) {
          res.data.forEach(row => {
            this.typeAllTimeCounts[row.formulaire_type] = row.count;
          });
        }
        this.isLoadingTypeCounts = false;
      },
      error: () => { this.isLoadingTypeCounts = false; }
    });
  }

  private loadAcqConfig(): void {
    this.configService.getConfig().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data;
          this.acqConfig.majDate        = d['acq_maj_date']        || this.acqConfig.majDate;
          this.acqConfig.repartitionUrl = d['acq_repartition_url'] || this.acqConfig.repartitionUrl;
          this.acqConfig.tauxRate       = d['acq_taux_usd']        || this.acqConfig.tauxRate;
          this.acqConfig.tauxPeriode    = d['acq_taux_periode']    || this.acqConfig.tauxPeriode;
        }
        this.editConfig = { ...this.acqConfig };
      },
      error: () => {
        this.editConfig = { ...this.acqConfig };
      }
    });
  }

  openRepartition(event: MouseEvent): void {
    event.stopPropagation();
    if (this.acqConfig.repartitionUrl) {
      window.open(this.acqConfig.repartitionUrl, '_blank');
    }
  }

  startEdit(card: 'repartition' | 'taux'): void {
    this.editConfig  = { ...this.acqConfig };
    this.editingCard = card;
  }

  async saveConfig(): Promise<void> {
    const confirmed = await this.dialog.confirm(
      'Voulez-vous vraiment appliquer ces modifications ?',
      'Confirmer le changement'
    );
    if (!confirmed) return;

    const updates =
      this.editingCard === 'repartition'
        ? [
            { cle: 'acq_maj_date',        valeur: this.editConfig.majDate },
            { cle: 'acq_repartition_url', valeur: this.editConfig.repartitionUrl }
          ]
        : [
            { cle: 'acq_taux_usd',     valeur: this.editConfig.tauxRate },
            { cle: 'acq_taux_periode', valeur: this.editConfig.tauxPeriode }
          ];

    this.isSavingConfig = true;

    forkJoin(updates.map(u => this.configService.updateConfig(u.cle, u.valeur))).subscribe({
      next: () => {
        this.acqConfig      = { ...this.editConfig };
        this.editingCard    = null;
        this.isSavingConfig = false;
        this.dialog.showSuccess('Configuration mise à jour avec succès.');
      },
      error: () => {
        this.isSavingConfig = false;
        this.dialog.showError('Erreur lors de la mise à jour — veuillez réessayer.');
      }
    });
  }

  cancelEdit(): void {
    this.editingCard = null;
  }

  private handleError(message: string): void {
    this.hasError           = true;
    this.errorMessage       = message;
    this.isLoadingDashboard = false;
    this.isLoadingGraphs    = false;
    this.dashboardStats     = this.defaultStats();
  }

  private defaultStats(): DashboardStats {
    return {
      totals: {
        total_items:            0,
        unique_demandeurs:      0,
        items_last_7_days:      0,
        total_traitees:         0,
        total_urgentes_attente: 0,
        en_traitement:          0,
        termines:               0,
        en_attente:             0
      },
      byType:        [],
      byMonth:       [],
      byPriority:    [],
      byStatutAcq:   [],
      bySuiviAcq:    [],
      topDemandeurs: []
    };
  }

  generateAcqDonutGradient(): string {
    return this.buildDonutGradient(this.acqBreakdownItems, (item, index) => this.getBibColor(index));
  }

  private buildDonutGradient(items: { count: number }[], colorOf: (item: any, index: number) => string): string {
    if (!items?.length) return '#e7ebee';
    const total = items.reduce((sum, p) => sum + (p.count || 0), 0);
    if (!total) return '#e7ebee';

    let cumulative = 0;
    const segments = items.map((p, index) => {
      const percentage = (p.count || 0) / total * 100;
      const start = cumulative;
      cumulative += percentage;
      const end = index === items.length - 1 ? 100 : cumulative;
      return `${colorOf(p, index)} ${start}% ${end}%`;
    });

    return `conic-gradient(${segments.join(',')})`;
  }
}