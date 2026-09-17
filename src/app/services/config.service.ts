import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TauxDevisesService } from './taux-devises.service';

export interface AppConfig {
  acq_maj_date:        string;
  acq_repartition_url: string;
  [key: string]: string | undefined;
}

/** Taux de change vers CAD par code devise (ex. { CAD: 1, USD: 1.368, EUR: 1.48 }). Une
 *  devise absente de la table (ex. "Autre") n'a pas de conversion automatique. */
export type TauxRates = Record<string, number>;

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

  constructor(
    private http: HttpClient,
    private tauxDevisesService: TauxDevisesService
  ) {}

  getConfig(): Observable<ApiResponse<AppConfig>> {
    return this.http.get<ApiResponse<AppConfig>>(this.baseUrl);
  }

  /** Taux de change vers CAD pour toutes les devises gérées — voir "Conversion automatique en
   *  CAD" dans les formulaires usager/admin. Source : la période réellement EN VIGUEUR
   *  aujourd'hui dans tbl_taux_devises_historique (ignore une période planifiée pour une date
   *  future — voir Configuration > Taux de change, admin). CAD = 1 toujours ; "Autre"
   *  n'apparaît jamais (pas de taux, saisie manuelle du prix CAD). */
  getTauxRates(): Observable<TauxRates> {
    const DEFAUT: TauxRates = { CAD: 1, USD: 1.368 };
    return this.tauxDevisesService.getActuelle().pipe(
      map(res => {
        const actuelle = res.data;
        if (!res.success || !actuelle) return DEFAUT;
        const rates: TauxRates = { CAD: 1 };
        Object.keys(actuelle.taux || {}).forEach(code => {
          const v = Number(actuelle.taux[code]);
          if (Number.isFinite(v)) rates[code] = v;
        });
        if (rates['USD'] == null) rates['USD'] = DEFAUT['USD'];
        return rates;
      }),
      catchError(() => of(DEFAUT))
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
