import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SuggestionPayload {
  type_formulaire: "Suggestion d'achat - Usager";
  usager_nom:      string;
  usager_courriel: string;
  usager_statut:   string;
  reponses:        Record<string, any>;
}

export interface NouvelAchatPayload {
  type_formulaire: 'Nouvel achat unique';
  usager_nom:      string;
  usager_courriel: string;
  usager_statut:   string;
  reponses: {
    baseData:     Record<string, any>;
    specificData: Record<string, any>;
  };
}

export interface Reponse {
  id: number;
  type_formulaire: string;
  usager_nom: string;
  usager_courriel: string;
  usager_statut: string;
  reponses: any;
  dateA: string;
  statut_approbation: string;
  courriel_admin: string | null;
  date_traitement: string | null;
  commentaire_admin: string | null;
}

export interface PaginatedResponse {
  data: Reponse[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ReponsesService {

  private readonly baseUrl = `${environment.apiUrl}/reponses`;

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) {}

  // ──────────────────────────────────────────────────────────
  // SUGGESTION D'ACHAT
  // Composant : suggestion-public.component.ts
  // Route     : POST /reponses/suggestion
  // Décision  : GET  /reponses/suggestion_usagers
  // ──────────────────────────────────────────────────────────
  envoyerSuggestion(reponses: Record<string, any>): Observable<any> {
    const body: SuggestionPayload = {
      type_formulaire: "Suggestion d'achat - Usager",
      usager_nom:      this.getNomSession(),
      usager_courriel: sessionStorage.getItem('courrielAdmin') ?? '',
      usager_statut:   sessionStorage.getItem('groupeAdmin')   ?? '',
      reponses
    };
    return this.http
      .post(`${this.baseUrl}/suggestion`, body, this.httpOptions)
      .pipe(catchError(this.handleError('envoyerSuggestion')));
  }

  // ──────────────────────────────────────────────────────────
  // NOUVEL ACHAT UNIQUE
  // Composant : nouvel-achat.component.ts
  // Route     : POST /reponses/nouvel-achat
  // Décision  : GET  /reponses/decision-achat
  // ──────────────────────────────────────────────────────────
  envoyerNouvelAchat(payload: {
    baseData:     Record<string, any>;
    specificData: Record<string, any>;
  }): Observable<any> {
    const body: NouvelAchatPayload = {
      type_formulaire: 'Nouvel achat unique',
      usager_nom:      this.getNomSession(),
      usager_courriel: sessionStorage.getItem('courrielAdmin') ?? '',
      usager_statut:   sessionStorage.getItem('groupeAdmin')   ?? '',
      reponses: {
        baseData:     payload.baseData,
        specificData: payload.specificData
      }
    };
    return this.http
      .post(`${this.baseUrl}/nouvel-achat`, body, this.httpOptions)
      .pipe(catchError(this.handleError('envoyerNouvelAchat')));
  }

  // ──────────────────────────────────────────────────────────
  // REQUÊTE ACCESSIBILITÉ
  // Composant : requete-accessibilite.component.ts
  // Route     : POST /reponses/requete-accessibilite
  // ──────────────────────────────────────────────────────────
  envoyerRequeteAccessibilite(payload: {
    baseData:     Record<string, any>;
    specificData: Record<string, any>;
  }): Observable<any> {
    const body = {
      type_formulaire: 'Requête ACQ Accessibilité',
      usager_nom:      this.getNomSession(),
      usager_courriel: sessionStorage.getItem('courrielAdmin') ?? '',
      usager_statut:   sessionStorage.getItem('groupeAdmin')   ?? '',
      reponses: {
        baseData:     payload.baseData,
        specificData: payload.specificData
      }
    };
    return this.http
      .post(`${this.baseUrl}/requete-accessibilite`, body, this.httpOptions)
      .pipe(catchError(this.handleError('envoyerRequeteAccessibilite')));
  }

  // ──────────────────────────────────────────────────────────
  // MODIFICATION ET CCOL
  // Composant : modification-ccol.component.ts
  // Route     : POST /reponses/modification-ccol
  // ──────────────────────────────────────────────────────────
  envoyerModificationCcol(payload: {
    baseData:     Record<string, any>;
    specificData: Record<string, any>;
  }): Observable<any> {
    const body = {
      type_formulaire: 'Modification et CCOL',
      usager_nom:      this.getNomSession(),
      usager_courriel: sessionStorage.getItem('courrielAdmin') ?? '',
      usager_statut:   sessionStorage.getItem('groupeAdmin')   ?? '',
      reponses: {
        baseData:     payload.baseData,
        specificData: payload.specificData
      }
    };
    return this.http
      .post(`${this.baseUrl}/modification-ccol`, body, this.httpOptions)
      .pipe(catchError(this.handleError('envoyerModificationCcol')));
  }

  // ──────────────────────────────────────────────────────────
  // SPRINGER
  // Composant : springer.component.ts
  // Route     : POST /reponses/springer
  // ──────────────────────────────────────────────────────────
  envoyerSpringer(payload: {
    baseData:     Record<string, any>;
    specificData: Record<string, any>;
  }): Observable<any> {
    const body = {
      type_formulaire: 'Springer',
      usager_nom:      this.getNomSession(),
      usager_courriel: sessionStorage.getItem('courrielAdmin') ?? '',
      usager_statut:   sessionStorage.getItem('groupeAdmin')   ?? '',
      reponses: {
        baseData:     payload.baseData,
        specificData: payload.specificData
      }
    };
    return this.http
      .post(`${this.baseUrl}/springer`, body, this.httpOptions)
      .pipe(catchError(this.handleError('envoyerSpringer')));
  }

  // ──────────────────────────────────────────────────────────
  // LECTURE (commun)
  // ──────────────────────────────────────────────────────────
  lister(type?: string, page = 1, limit = 20): Observable<any> {
    const params: any = { page, limit };
    if (type) params['type'] = type;
    return this.http
      .get(this.baseUrl, { params })
      .pipe(catchError(this.handleError('lister')));
  }

  /**
   * Récupère toutes les réponses avec pagination et filtres
   */
  getAll(
    type?: string,
    statut?: string,
    page: number = 1,
    limit: number = 20
  ): Observable<PaginatedResponse> {
    const params: any = { page, limit };
    if (type) params['type'] = type;
    if (statut) params['statut'] = statut;
    return this.http
      .get<PaginatedResponse>(this.baseUrl, { params })
      .pipe(catchError(this.handleError('getAll')));
  }

  getById(id: number): Observable<Reponse> {
    return this.http
      .get<Reponse>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError('getById')));
  }

  // ──────────────────────────────────────────────────────────
  // PRIVÉS
  // ──────────────────────────────────────────────────────────
  private getNomSession(): string {
    return `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
  }

  private handleError(operation = 'operation') {
    return (error: any): Observable<never> => {
      console.error(`[ReponsesService] ${operation}:`, error);
      return throwError(() => error);
    };
  }
}