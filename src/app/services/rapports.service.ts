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

/** Vues de la page Suivis des bibliothèques (voir models/rapports.js suivisBibliotheques). */
export type SuiviVue = 'montants' | 'statuts';

export interface ItemSuivi {
  item_id: number;
  formulaire_type: string | null;
  date_creation: string | null;
  priorite_demande: string | null;
  titre_document: string | null;
  isbn_issn: string | null;
  periode_couverte: string | null;
  bibliotheque: string | null;
  demandeur: string | null;
  prix_cad: number | string | null;
  statut_bibliotheque: string | null;
  statut_acq: string | null;
  suivi_acq: string | null;
  note_acq: string | null;
  fonds_budgetaire: string | null;
  precision_demande: string | null;
  cree_par: string | null;
  /** Fonds partagés seulement : part de chaque fonds (ventilation des sommes par fonds). */
  fonds_parts: { fonds: string; prix_cad: number | string | null }[] | null;
}

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

export interface FiltresRapport {
  dateDebut?: string;
  dateFin?: string;
  formulaire_type?: string;
  bibliotheque?: string;
  priorite?: string;
  demandeur?: string;
  fonds?: string;
  statutBibliotheque?: string;
  statutAcq?: string;
  limit?: number;
  offset?: number;
}

export type RapportTypeId =
  | 'detaille'

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

  // ─── Endpoints API ───────────────────────────────────────

  /** bibliotheques vide = toutes ; '' = demandes sans bibliothèque. Séparateur « | » : un nom
   *  de bibliothèque peut contenir une virgule. */
  getSuivisBibliotheques(vue: SuiviVue, bibliotheques: string[]): Observable<ApiResponse<ItemSuivi[]>> {
    let params = new HttpParams().set('vue', vue);
    if (bibliotheques.length) params = params.set('bibliotheques', bibliotheques.join('|'));
    return this.http.get<ApiResponse<ItemSuivi[]>>(`${this.url}/suivis-bibliotheques`, { ...this.httpOptions, params });
  }

  getRapportDetaille(filtres?: FiltresRapport): Observable<ApiResponse<ItemDetaille[]>> {
    const params = this.buildHttpParams(filtres);
    return this.http.get<any>(`${this.url}/detaille`, { ...this.httpOptions, params }).pipe(
      map(raw => this.normalizeDetailResponse(raw)),
      catchError(err => {
        console.error('Erreur HTTP détaillé:', err);
        return this.errorHandlerService.handleError<ApiResponse<ItemDetaille[]>>('getRapportDetaille')(err);
      })
    );
  }

  getRapportParType(filtres?: FiltresRapport): Observable<ApiResponse<any[]>> {
    const params = this.buildHttpParams(filtres);
    return this.http.get<any>(`${this.url}/par-type`, { ...this.httpOptions, params }).pipe(
      map(raw => this.normalizeResponse<any[]>(raw)),
      catchError(this.errorHandlerService.handleError<ApiResponse<any[]>>('getRapportParType'))
    );
  }

  getRapportParBibliotheque(filtres?: FiltresRapport): Observable<ApiResponse<any[]>> {
    const params = this.buildHttpParams(filtres);
    return this.http.get<any>(`${this.url}/par-bibliotheque`, { ...this.httpOptions, params }).pipe(
      map(raw => this.normalizeResponse<any[]>(raw)),
      catchError(this.errorHandlerService.handleError<ApiResponse<any[]>>('getRapportParBibliotheque'))
    );
  }

  getRapportParDemandeur(filtres?: FiltresRapport): Observable<ApiResponse<any[]>> {
    const params = this.buildHttpParams(filtres);
    return this.http.get<any>(`${this.url}/par-demandeur`, { ...this.httpOptions, params }).pipe(
      map(raw => this.normalizeResponse<any[]>(raw)),
      catchError(this.errorHandlerService.handleError<ApiResponse<any[]>>('getRapportParDemandeur'))
    );
  }

  getRapportMensuel(filtres?: FiltresRapport): Observable<ApiResponse<any[]>> {
    const params = this.buildHttpParams(filtres);
    return this.http.get<any>(`${this.url}/mensuel`, { ...this.httpOptions, params }).pipe(
      map(raw => this.normalizeResponse<any[]>(raw)),
      catchError(this.errorHandlerService.handleError<ApiResponse<any[]>>('getRapportMensuel'))
    );
  }

  getRapportParStatut(filtres?: FiltresRapport): Observable<ApiResponse<any[]>> {
    const params = this.buildHttpParams(filtres);
    return this.http.get<any>(`${this.url}/par-statut`, { ...this.httpOptions, params }).pipe(
      map(raw => this.normalizeResponse<any[]>(raw)),
      catchError(this.errorHandlerService.handleError<ApiResponse<any[]>>('getRapportParStatut'))
    );
  }

  getStatistiquesGenerales(filtres?: FiltresRapport): Observable<ApiResponse<any>> {
    const params = this.buildHttpParams(filtres);
    return this.http.get<any>(`${this.url}/statistiques`, { ...this.httpOptions, params }).pipe(
      map(raw => this.normalizeResponse(raw)),
      catchError(this.errorHandlerService.handleError<ApiResponse<any>>('getStatistiquesGenerales'))
    );
  }

  // ─── Helpers ─────────────────────────────────────────────

  private normalizeDetailResponse(raw: any): ApiResponse<ItemDetaille[]> {
    if (raw?.success && Array.isArray(raw.data)) {
      return { success: true, data: raw.data, pagination: raw.pagination, timestamp: raw.timestamp || new Date().toISOString() };
    }
    if (Array.isArray(raw)) {
      return { success: true, data: raw, timestamp: new Date().toISOString() };
    }
    if (raw && Array.isArray(raw.data) && typeof raw.total === 'number') {
      return {
        success: true,
        data: raw.data,
        pagination: { total: raw.total, limit: raw.limit || 100, offset: raw.offset || 0 },
        timestamp: new Date().toISOString()
      };
    }
    console.warn('Réponse API inattendue:', raw);
    return { success: false, data: [], timestamp: new Date().toISOString() };
  }

  private normalizeResponse<T>(raw: any): ApiResponse<T> {
    if (raw && typeof raw === 'object' && 'success' in raw && 'data' in raw) {
      return raw as ApiResponse<T>;
    }
    return { success: true, data: raw as T, timestamp: new Date().toISOString() };
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