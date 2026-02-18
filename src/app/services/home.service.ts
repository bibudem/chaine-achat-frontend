import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, forkJoin } from "rxjs";
import { catchError, tap, map } from "rxjs/operators";
import { ErrorHandlerService } from "./error-handler.service";

export interface DashboardStats {
  totals: {
    total_items: number;
    unique_demandeurs: number;
    items_last_7_days: number;
    en_traitement: number;
    termines: number;
    en_attente: number;
  };
  byType: Array<{
    formulaire_type: string;
    count: number;
    percentage: number;
  }>;
  byMonth: Array<{
    month: string;
    count: number;
  }>;
  byPriority: Array<{
    priorite: string;
    count: number;
    order_priority: number;
  }>;
  topDemandeurs: Array<{
    demandeur: string;
    count: number;
    rank: number;
  }>;
}

export interface GraphData {
  dailyStats: Array<{
    date: string;
    count: number;
    completed: number;
    achats_uniques: number;
    abonnements: number;
  }>;
  libraryStats: Array<{
    bibliotheque: string;
    total: number;
    percentage: number;
  }>;
  statusEvolution: Array<{
    date: string;
    statut_bibliotheque: string;
    count: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  timestamp: string;
}

@Injectable({
  providedIn: "root",
})
export class HomeService {
  private url = "http://localhost:3000/home";

  httpOptions: { headers: HttpHeaders } = {
    headers: new HttpHeaders({ 
      "Content-Type": "application/json",
    }),
  };

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private http: HttpClient
  ) {}

  // Récupérer les statistiques du tableau de bord
  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    console.log('📊 Récupération des statistiques dashboard');
    
    return this.http
      .get<ApiResponse<DashboardStats>>(`${this.url}/count`, this.httpOptions)
      .pipe(
        tap((response) => {
          if (response?.success) {
            console.log('✅ Statistiques dashboard reçues', response.data.totals);
          }
        }),
        catchError(
          this.errorHandlerService.handleError<ApiResponse<DashboardStats>>("getDashboardStats")
        )
      );
  }

  // Récupérer les données graphiques
  getGraphData(): Observable<ApiResponse<GraphData>> {
    console.log('📈 Récupération des données graphiques');
    
    return this.http
      .get<ApiResponse<GraphData>>(`${this.url}/graphique`, this.httpOptions)
      .pipe(
        tap((response) => {
          if (response?.success) {
            console.log('✅ Données graphiques reçues');
          }
        }),
        catchError(
          this.errorHandlerService.handleError<ApiResponse<GraphData>>("getGraphData")
        )
      );
  }

  // Récupérer toutes les données en une seule fois
  getAllHomeData(): Observable<{
    dashboard: ApiResponse<DashboardStats>;
    graph: ApiResponse<GraphData>;
  }> {
    console.log('🔄 Récupération de toutes les données home');
    
    return forkJoin({
      dashboard: this.getDashboardStats(),
      graph: this.getGraphData()
    }).pipe(
      tap((data) => {
        console.log('✅ Toutes les données home récupérées');
      }),
      catchError(
        this.errorHandlerService.handleError<any>("getAllHomeData")
      )
    );
  }

  // Méthode utilitaire pour les observables
  toPromise<T>(observable: Observable<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      observable.subscribe({
        next: (value) => resolve(value),
        error: (err) => reject(err)
      });
    });
  }
}