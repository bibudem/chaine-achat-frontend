import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AppConfig {
  acq_maj_date:        string;
  acq_repartition_url: string;
  acq_taux_usd:        string;
  acq_taux_periode:    string;
  [key: string]: string;
}

interface ApiResponse<T> {
  success:   boolean;
  message:   string;
  data:      T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly baseUrl = `${environment.apiUrl}/config`;
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  getConfig(): Observable<ApiResponse<AppConfig>> {
    return this.http.get<ApiResponse<AppConfig>>(this.baseUrl);
  }

  getTauxUsd(): Observable<number> {
    return this.getConfig().pipe(
      map(res => {
        if (res.success && res.data?.acq_taux_usd) {
          const t = parseFloat(res.data.acq_taux_usd.replace(',', '.'));
          return isNaN(t) ? 1.368 : t;
        }
        return 1.368;
      }),
      catchError(() => of(1.368))
    );
  }

  updateConfig(cle: string, valeur: string): Observable<ApiResponse<any>> {
    const nom    = sessionStorage.getItem('nomAdmin')    ?? '';
    const prenom = sessionStorage.getItem('prenomAdmin') ?? '';
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';
    const modifie_par = `${prenom} ${nom} (${courriel})`.trim();

    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/${cle}`,
      { valeur, modifie_par },
      { headers: this.headers }
    );
  }
}
