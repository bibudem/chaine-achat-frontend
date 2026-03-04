import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ErrorHandlerService } from './error-handler.service';
import { environment } from 'src/environments/environment';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export type Period = '7days' | '30days' | '90days';

export interface DashboardStats {
  totals: {
    total_items:       number;
    unique_demandeurs: number;
    items_last_7_days: number;
    en_traitement:     number;
    termines:          number;
    en_attente:        number;
  };
  byType: Array<{
    formulaire_type: string;
    count:           number;
    percentage:      number;
  }>;
  byMonth: Array<{
    month: string;
    count: number;
  }>;
  byPriority: Array<{
    priorite:       string;
    count:          number;
    order_priority: number;
  }>;
  topDemandeurs: Array<{
    demandeur: string;
    count:     number;
    rank:      number;
  }>;
  period?:     string;
  periodDays?: number;
}

export interface GraphData {
  dailyStats: Array<{
    date:           string;
    count:          number;
    completed:      number;
    achats_uniques: number;
    abonnements:    number;
  }>;
  libraryStats: Array<{
    bibliotheque: string;
    total:        number;
    percentage:   number;
  }>;
  statusEvolution: Array<{
    date:                string;
    statut_bibliotheque: string;
    count:               number;
  }>;
}

export interface ApiResponse<T> {
  success:   boolean;
  message?:  string;
  data:      T;
  error?:    string;
  timestamp: string;
}

export interface AllHomeData {
  dashboard: ApiResponse<DashboardStats>;
  graph:     ApiResponse<GraphData>;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SERVICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
@Injectable({ providedIn: 'root' })
export class HomeService {

  private readonly baseUrl = `${environment.apiUrl}/home`;

  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /* ─────────────────────────────────────────────
     Construit les HttpParams avec la période
  ───────────────────────────────────────────── */
  private params(period: Period): { headers: HttpHeaders; params: HttpParams } {
    return {
      headers: this.headers,
      params: new HttpParams().set('period', period)
    };
  }

  /* ─────────────────────────────────────────────
     GET /home/all?period=...
     Appel principal — dashboard + graphiques
  ───────────────────────────────────────────── */
  getAllHomeData(period: Period = '7days'): Observable<ApiResponse<AllHomeData>> {
    return this.http
      .get<ApiResponse<AllHomeData>>(`${this.baseUrl}/all`, this.params(period))
      .pipe(
        tap(res => {
          if (res?.success) console.log(`✅ Données home reçues [${period}]`);
        }),
        catchError(
          this.errorHandler.handleError<ApiResponse<AllHomeData>>('getAllHomeData')
        )
      );
  }

  /* ─────────────────────────────────────────────
     GET /home/dashboard?period=...
  ───────────────────────────────────────────── */
  getDashboardStats(period: Period = '7days'): Observable<ApiResponse<DashboardStats>> {
    return this.http
      .get<ApiResponse<DashboardStats>>(`${this.baseUrl}/dashboard`, this.params(period))
      .pipe(
        tap(res => {
          if (res?.success) console.log(`✅ Stats dashboard [${period}]`, res.data.totals);
        }),
        catchError(
          this.errorHandler.handleError<ApiResponse<DashboardStats>>('getDashboardStats')
        )
      );
  }

  /* ─────────────────────────────────────────────
     GET /home/graph?period=...
  ───────────────────────────────────────────── */
  getGraphData(period: Period = '7days'): Observable<ApiResponse<GraphData>> {
    return this.http
      .get<ApiResponse<GraphData>>(`${this.baseUrl}/graph`, this.params(period))
      .pipe(
        tap(res => {
          if (res?.success) console.log(`✅ Données graphiques [${period}]`);
        }),
        catchError(
          this.errorHandler.handleError<ApiResponse<GraphData>>('getGraphData')
        )
      );
  }
}