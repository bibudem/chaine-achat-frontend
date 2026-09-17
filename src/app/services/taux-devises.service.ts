import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Une période (ligne du tableau) avec les taux de toutes les devises regroupés dans `taux`. */
export interface TauxPeriode {
  id:            number;
  periode:       string;
  date_debut:    string;
  taux:          Record<string, number>;
  note:          string | null;
  date_creation: string;
  cree_par:      string | null;
  date_modif:    string | null;
  modifie_par:   string | null;
}

interface ApiResponse<T> {
  success:   boolean;
  message?:  string;
  error?:    string;
  data:      T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class TauxDevisesService {
  private readonly baseUrl = `${environment.apiUrl}/taux-devises`;
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  private get identiteAdmin(): string {
    const nom      = sessionStorage.getItem('nomAdmin')      ?? '';
    const prenom    = sessionStorage.getItem('prenomAdmin')  ?? '';
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';
    return `${prenom} ${nom} (${courriel})`.trim();
  }

  /** Toutes les périodes (lignes du tableau), de la plus récente à la plus ancienne. */
  getAll(): Observable<ApiResponse<TauxPeriode[]>> {
    return this.http.get<ApiResponse<TauxPeriode[]>>(this.baseUrl);
  }

  /** Période réellement en vigueur aujourd'hui (ignore une période planifiée pour une date
   *  future) — utilisé pour le taux affiché en en-tête de l'accueil et pour la conversion
   *  automatique en CAD des formulaires (voir ConfigService.getTauxRates()). */
  getActuelle(): Observable<ApiResponse<TauxPeriode | null>> {
    return this.http.get<ApiResponse<TauxPeriode | null>>(`${this.baseUrl}/actuelle`);
  }

  /** Nouvelle période (ligne) — taux initialement vide, à compléter ensuite devise par devise. */
  creerPeriode(periode: string, date_debut?: string | null, note?: string | null): Observable<ApiResponse<TauxPeriode>> {
    return this.http.post<ApiResponse<TauxPeriode>>(
      this.baseUrl,
      { periode, date_debut: date_debut ?? null, note: note ?? null, taux: {}, cree_par: this.identiteAdmin },
      { headers: this.headers }
    );
  }

  /** Modifie le libellé/la date/la note d'une période, sans toucher aux taux. */
  modifierPeriode(id: number, changes: { periode?: string; date_debut?: string; note?: string }): Observable<ApiResponse<TauxPeriode>> {
    return this.http.put<ApiResponse<TauxPeriode>>(
      `${this.baseUrl}/${id}`,
      { ...changes, modifie_par: this.identiteAdmin },
      { headers: this.headers }
    );
  }

  /** Ajoute ou modifie le taux d'une devise au sein d'une période, sans affecter les autres devises. */
  upsertTauxDevise(id: number, devise: string, taux: number): Observable<ApiResponse<TauxPeriode>> {
    return this.http.put<ApiResponse<TauxPeriode>>(
      `${this.baseUrl}/${id}/devises/${devise}`,
      { taux, modifie_par: this.identiteAdmin },
      { headers: this.headers }
    );
  }

  /** Retire une devise d'une période (la ligne reste, les autres devises ne sont pas affectées). */
  supprimerTauxDevise(id: number, devise: string): Observable<ApiResponse<TauxPeriode>> {
    return this.http.request<ApiResponse<TauxPeriode>>('delete', `${this.baseUrl}/${id}/devises/${devise}`, {
      headers: this.headers,
      body: { modifie_par: this.identiteAdmin }
    });
  }

  /** Supprime la période (ligne) entière. */
  supprimerPeriode(id: number): Observable<ApiResponse<TauxPeriode>> {
    return this.http.delete<ApiResponse<TauxPeriode>>(`${this.baseUrl}/${id}`);
  }
}
