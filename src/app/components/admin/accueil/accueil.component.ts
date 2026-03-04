import { Component, OnInit, OnDestroy } from '@angular/core';
import { HomeService, DashboardStats, GraphData, Period } from '../../../services/home.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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

  /* ─── Subscriptions ─── */
  private subs = new Subscription();

  /* ─── Période sélectionnée ─── */
  private _selectedPeriod: Period = '7days';

  get selectedPeriod(): Period { return this._selectedPeriod; }

  set selectedPeriod(value: Period) {
    if (value !== this._selectedPeriod) {
      this._selectedPeriod = value;
      this.loadAllData();   // ← recharge automatiquement au changement
    }
  }

  /* ─── Utilitaires template ─── */
  readonly Math = Math;

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
    private translate: TranslateService,
    private router: Router
  ) {}

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     CYCLE DE VIE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     CHARGEMENT DES DONNÉES
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  loadAllData(): void {
    // Annule toute requête en cours
    this.subs.unsubscribe();
    this.subs = new Subscription();

    this.isLoadingDashboard = true;
    this.isLoadingGraphs    = true;
    this.hasError           = false;

    const sub = this.homeService.getAllHomeData(this._selectedPeriod).subscribe({
      next: (res) => {
        const { dashboard, graph } = res?.data ?? {};

        if (dashboard?.success && dashboard.data) {
          this.dashboardStats = dashboard.data;
        } else {
          this.handleError('Données dashboard invalides');
        }

        if (graph?.success && graph.data) {
          this.graphData = graph.data;
        }
      },
      error: (err) => {
        console.error('❌ Erreur chargement dashboard:', err);
        this.handleError(err.message || 'Erreur de connexion au serveur');
      },
      complete: () => {
        this.isLoadingDashboard = false;
        this.isLoadingGraphs    = false;
      }
    });

    this.subs.add(sub);
  }

  /* Bouton rafraîchir manuel */
  refreshData(): void {
    window.location.reload();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     NAVIGATION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     GETTERS SÉCURISÉS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  get totals()        { return this.dashboardStats.totals; }
  get byType()        { return this.dashboardStats.byType        ?? []; }
  get byPriority()    { return this.dashboardStats.byPriority    ?? []; }
  get topDemandeurs() { return this.dashboardStats.topDemandeurs ?? []; }
  get byMonth()       { return this.dashboardStats.byMonth       ?? []; }

  get completionRate(): number {
    return this.calculatePercentage(this.totals.termines, this.totals.total_items);
  }

  get pendingRate(): number {
    return this.calculatePercentage(this.totals.en_attente, this.totals.total_items);
  }

  /* Label lisible de la période active */
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

      case 'urgent':
        return '#F04E24';   // rouge
      
      case 'prioritaire':
      case 'Prioritaire':
        return '#52B782';

      case 'régulier':
      case 'regulier':
        return '#2178C4';   // bleu foncé

      case 'non spécifiée':
      case 'non specifiee':
      case 'non spécifié':
      case 'non specifie':
        return '#FFE8AC';   // jaune

      default:
        return '#7A8DA0';   // gris fallback
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'Nouvel achat unique':  return 'bi bi-cart';
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

    if (!this.byPriority?.length) {
      return '#e7ebee';
    }

    const total = this.byPriority
      .reduce((sum, p) => sum + (p.count || 0), 0);

    if (!total) return '#e7ebee';

    let cumulative = 0;

    const segments = this.byPriority.map((p, index) => {

      const value = p.count || 0;
      const percentage = (value / total) * 100;

      const start = cumulative;
      cumulative += percentage;

      // Dernier segment force 100% pour éviter trou blanc
      const end = index === this.byPriority.length - 1
        ? 100
        : cumulative;

      return `${this.getPriorityColor(p.priorite)} ${start}% ${end}%`;
    });

    return `conic-gradient(${segments.join(',')})`;
  }
}