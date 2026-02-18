import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, firstValueFrom } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ErrorHandlerService } from './error-handler.service';
import { environment } from 'src/environments/environment';

// ==================== INTERFACES ====================

export interface ItemDetaille {
  item_id?: number;
  id?: number;
  formulaire_type?: string;
  demandeur?: string;
  bibliotheque?: string;
  date_creation?: string;
  date_modification?: string;
  statut_bibliotheque?: string;
  statut_acq?: string;
  priorite?: string;
  titre?: string;
  titre_document?: string;
  sous_titre?: string;
  editeur?: string;
  isbn_issn?: string;
  identifiant?: string;
  montant?: number;
  notes?: string;
}

// Wrapper API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  timestamp?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    pages?: number;
  };
}

// Filtres côté Angular
export interface FiltresRapport {
  dateDebut?: string;
  dateFin?: string;
  formulaireType?: string;
  bibliotheque?: string;
  priorite?: string;
  demandeur?: string;
  statutBibliotheque?: string;
  statutAcq?: string;
  limit?: number;
  offset?: number;
}

// Types de rapport
export type RapportTypeId =
  | 'detaille'
  | 'par-type'
  | 'par-bibliotheque'
  | 'par-demandeur'
  | 'mensuel'
  | 'par-statut';

@Injectable({ providedIn: 'root' })
export class RapportsService {
  private readonly baseUrl =
    (environment as any)?.apiUrl?.replace(/\/$/, '') || 'http://localhost:3000';
  private readonly url = `${this.baseUrl}/rapports`;
  private readonly httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private http: HttpClient
  ) {}

  // ----------- Méthodes API -----------

  getRapportDetaille(filtres?: FiltresRapport): Observable<ApiResponse<ItemDetaille[]>> {
    const params = this.buildHttpParams(filtres);
    console.log('📡 Appel API:', `${this.url}/detaille`);
    console.log('📋 Paramètres:', params.toString());
    
    return this.http.get<any>(`${this.url}/detaille`, { ...this.httpOptions, params }).pipe(
      map(raw => this.normalizeDetailResponse(raw)),
      tap(resp => {
        if (resp.success) {
          console.log('✅ Données reçues:', resp.data?.length || 0, 'items');
          if (resp.pagination) {
            console.log('📊 Pagination:', resp.pagination);
          }
        } else {
          console.error('Échec de la requête');
        }
      }),
      catchError(err => {
        console.error('Erreur HTTP:', err);
        return this.errorHandlerService.handleError<ApiResponse<ItemDetaille[]>>('getRapportDetaille')(err);
      })
    );
  }

  getStatistiquesGenerales(filtres?: FiltresRapport): Observable<ApiResponse<any>> {
    const params = this.buildHttpParams(filtres);
    return this.http.get<any>(`${this.url}/statistiques`, { ...this.httpOptions, params }).pipe(
      map(raw => this.normalizeResponse(raw)),
      catchError(this.errorHandlerService.handleError<ApiResponse<any>>('getStatistiquesGenerales'))
    );
  }


  // Méthode façade unique
  getRapport(type: RapportTypeId, filtres: FiltresRapport, filtresMatSelect: Record<string, any[]> = {}): Observable<ApiResponse<any[]>> {
    const request$ = type === 'detaille' ? this.getRapportDetaille(filtres) : of({ success: true, data: [] } as ApiResponse<any>);
    return request$.pipe(
      map(resp => {
        let rows = Array.isArray(resp.data) ? resp.data : [];
        // filtrage multi-select côté client
        Object.entries(filtresMatSelect).forEach(([key, values]) => {
          if (values?.length > 0) {
            rows = rows.filter(row => values.includes(row[key] ?? row[this.mapKeyToRowKey(key)]));
          }
        });
        return { ...resp, data: rows };
      }),
      catchError(this.errorHandlerService.handleError<ApiResponse<any[]>>('getRapport'))
    );
  }

  // ----------- Helpers -----------

  private normalizeDetailResponse(raw: any): ApiResponse<ItemDetaille[]> {
    console.log('Réponse brute du backend:', raw);
    
    // Cas 1: Backend renvoie { success: true, data: [...], pagination: {...} }
    if (raw?.success && Array.isArray(raw.data)) {
      console.log('Format avec success et data:', raw.data.length, 'éléments');
      return {
        success: true,
        data: raw.data,
        pagination: raw.pagination,
        timestamp: raw.timestamp || new Date().toISOString()
      };
    }

    // Cas 2: Backend renvoie directement un tableau
    if (Array.isArray(raw)) {
      console.log('Format tableau direct:', raw.length, 'éléments');
      return {
        success: true,
        data: raw,
        timestamp: new Date().toISOString()
      };
    }

    // Cas 3: Backend renvoie { data: [...], total, limit, offset } (sans success)
    if (raw && Array.isArray(raw.data) && typeof raw.total === 'number') {
      console.log('Format avec data et total:', raw.data.length, 'éléments');
      return {
        success: true,
        data: raw.data,
        pagination: {
          total: raw.total,
          limit: raw.limit || 100,
          offset: raw.offset || 0,
          pages: raw.limit ? Math.ceil(raw.total / raw.limit) : 1
        },
        timestamp: new Date().toISOString()
      };
    }

    // Cas fallback : rien de valide reçu
    console.warn('Réponse API inattendue :', raw);
    return {
      success: false,
      data: [],
      timestamp: new Date().toISOString()
    };
  }

  private normalizeResponse<T>(raw: any): ApiResponse<T> {
    // Si c'est déjà un wrapper
    if (raw && typeof raw === 'object' && 'success' in raw && 'data' in raw) {
      return raw as ApiResponse<T>;
    }

    // Sinon, on wrappe
    return {
      success: true,
      data: raw as T,
      timestamp: new Date().toISOString()
    };
  }

  private buildHttpParams(filtres?: FiltresRapport): HttpParams {
    let params = new HttpParams();
    if (!filtres) return params;
    
    Object.entries(filtres).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    
    return params;
  }

  private mapKeyToRowKey(key: string): string {
    const mapping: Record<string, string> = {
      formulaireType: 'formulaire_type',
      statutBibliotheque: 'statut_bibliotheque',
      statutAcq: 'statut_acq'
    };
    return mapping[key] || key;
  }

  toPromise<T>(observable: Observable<T>): Promise<T> {
    return firstValueFrom(observable);
  }

  formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getCurrentMonthDates(): { dateDebut: string; dateFin: string } {
    const now = new Date();
    return {
      dateDebut: this.formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1)),
      dateFin: this.formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    };
  }

  getCurrentYearDates(): { dateDebut: string; dateFin: string } {
    const now = new Date();
    return {
      dateDebut: this.formatDateISO(new Date(now.getFullYear(), 0, 1)),
      dateFin: this.formatDateISO(new Date(now.getFullYear(), 11, 31))
    };
  }
}