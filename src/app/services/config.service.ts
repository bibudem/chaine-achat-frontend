import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
