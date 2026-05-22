import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface ImportLog {
  log_id:          number;
  date_import:     string;
  formulaire_type: string;
  fichier_nom:     string;
  nb_total:        number;
  nb_inseres:      number;
  nb_erreurs:      number;
  details_erreurs: Array<{ ligne: number; erreur: string }> | null;
  utilisateur:     string;
  statut:          'succès' | 'partiel' | 'échec';
}

export interface ImportLogsResponse {
  success: boolean;
  logs:    ImportLog[];
  total:   number;
  page:    number;
  limit:   number;
}

export interface ImportLogDetailResponse {
  success: boolean;
  data:    ImportLog;
}

@Injectable({ providedIn: 'root' })
export class ImportLogsService {

  private readonly baseUrl = `${environment.apiUrl}/import-logs`;

  constructor(private http: HttpClient) {}

  getAll(params: { page?: number; limit?: number; type?: string; statut?: string } = {}): Observable<ImportLogsResponse> {
    const query: any = {};
    if (params.page)   { query['page']   = params.page; }
    if (params.limit)  { query['limit']  = params.limit; }
    if (params.type)   { query['type']   = params.type; }
    if (params.statut) { query['statut'] = params.statut; }

    return this.http
      .get<ImportLogsResponse>(this.baseUrl, { params: query })
      .pipe(catchError(() => { throw new Error('Impossible de charger les logs d\'import'); }));
  }

  getById(id: number): Observable<ImportLogDetailResponse> {
    return this.http
      .get<ImportLogDetailResponse>(`${this.baseUrl}/${id}`)
      .pipe(catchError(() => { throw new Error('Log introuvable'); }));
  }
}
