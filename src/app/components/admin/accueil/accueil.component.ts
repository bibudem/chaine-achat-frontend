import { Component, OnInit, OnDestroy } from '@angular/core';
import { HomeService, DashboardStats, GraphData, Period, ApiResponse, AllHomeData } from '../../../services/home.service';
import { ConfigService } from '../../../services/config.service';
import { DialogService } from '../../../services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css']
})


export class AccueilComponent implements OnInit, OnDestroy {

  /* ─── Données ─── */
  dashboardStats: DashboardStats = this.defaultStats();
  graphData: GraphData | null = null;

  /* ─── États UI ─── */
  isLoadingDashboard = true;
  isLoadingGraphs    = true;
  hasError           = false;
  errorMessage       = '';

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

  /* ─── Période sélectionnée ─── */
  private _selectedPeriod: Period = '7days';

  get selectedPeriod(): Period { return this._selectedPeriod; }

  set selectedPeriod(value: Period) {
    if (value !== this._selectedPeriod) {
      this._selectedPeriod = value;
      this.loadAllData();
    }
  }

  

  /* ─── Utilitaires template ─── */
  readonly Math = Math;

  /* ─── Catalogue types (toutes périodes) ─── */
  readonly allTypes: string[] = [
    'Modification CCOL', 'Nouvel abonnement', 'Nouvel achat unique',
    'PEB Tipasa numérique', 'Requête ACQ', 'Springer', "Suggestion d'achat"
  ];
  typeAllTimeCounts: Record<string, number> = {};
  isLoadingTypeCounts = true;

  readonly typeDescriptions: Record<string, string> = {
    'Nouvel achat unique':   'Acquisition d\'un document imprimé ou électronique',
    'Nouvel abonnement':     'Abonnement à un périodique ou une ressource continue',
    'Modification CCOL':     'Modification d\'une notice dans le catalogue collectif',
    'PEB Tipasa numérique':  'Prêt entre bibliothèques via la plateforme Tipasa',
    'Requête ACQ':           'Demande adressée directement aux acquisitions',
    'Springer':              'Commande dans le cadre du programme Springer',
    "Suggestion d'achat":    'Suggestion soumise par un usager de la bibliothèque',
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAcqConfig();
    this.loadAllData();
    this.loadTypeCounts();
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

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  navigateToType(formulaire_type: string): void {
    this.router.navigate(['/items'], { queryParams: { formulaire_type } });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     GETTERS SÉCURISÉS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  get totals()        { return this.dashboardStats.totals; }
  get byType()        { return this.dashboardStats.byType        ?? []; }
  get byPriority()    { return this.dashboardStats.byPriority    ?? []; }
  get topDemandeurs() { return this.dashboardStats.topDemandeurs ?? []; }
  get byMonth()       { return this.dashboardStats.byMonth       ?? []; }
  get libraryStats()  { return this.graphData?.libraryStats       ?? []; }

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

  get periodLabel(): string {
    switch (this._selectedPeriod) {
      case '30days': return '30 derniers jours';
      case '90days': return '90 derniers jours';
      default:       return '7 derniers jours';
    }
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

  getPriorityColor(priority: string): string {
    if (!priority) return '#607386';
    const p = priority.toLowerCase().trim();
    switch (p) {
      case 'urgent':         return '#F04E24';
      case 'prioritaire':    return '#52B782';
      case 'régulier':
      case 'regulier':       return '#2178C4';
      case 'non spécifiée':
      case 'non specifiee':
      case 'non spécifié':
      case 'non specifie':   return '#FFE8AC';
      default:               return '#7A8DA0';
    }
  }

  getBibColor(index: number): string {
    const colors = ['#0b113a', '#00407F', '#2380D1', '#246405', '#52B782', '#F04E24', '#FFCA40'];
    return colors[index % colors.length];
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'Nouvel achat unique':  return 'bi bi-basket3';
      case 'Nouvel abonnement':    return 'bi bi-newspaper';
      case 'Modification CCOL':    return 'bi bi-pencil-square';
      case 'PEB Tipasa numérique': return 'bi bi-link-45deg';
      case 'Requête ACQ':          return 'bi bi-question-circle';
      case 'Springer':             return 'bi bi-journal-bookmark';
      case "Suggestion d'achat":   return 'bi bi-lightbulb';
      default:                     return 'bi bi-file-earmark-text';
    }
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
        total_items:       0,
        unique_demandeurs: 0,
        items_last_7_days: 0,
        en_traitement:     0,
        termines:          0,
        en_attente:        0
      },
      byType:        [],
      byMonth:       [],
      byPriority:    [],
      topDemandeurs: []
    };
  }

  generateDonutGradient(): string {
    if (!this.byPriority?.length) return '#e7ebee';
    const total = this.byPriority.reduce((sum, p) => sum + (p.count || 0), 0);
    if (!total) return '#e7ebee';

    let cumulative = 0;
    const segments = this.byPriority.map((p, index) => {
      const percentage = (p.count || 0) / total * 100;
      const start = cumulative;
      cumulative += percentage;
      const end = index === this.byPriority.length - 1 ? 100 : cumulative;
      return `${this.getPriorityColor(p.priorite)} ${start}% ${end}%`;
    });

    return `conic-gradient(${segments.join(',')})`;
  }
}