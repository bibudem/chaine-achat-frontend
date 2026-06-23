import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
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
  item_id_cree?: number | null;
  statut_approbation?: string | null;
  suivi_acq?: string | null;
  statut_acq?: string | null;
  statut_bibliotheque?: string | null;
}

export interface DemandeUsager {
  id: number;
  type_formulaire: string;
  titre_document: string | null;
  dateA: string;
  statut_approbation: string | null;
  commentaire_admin: string | null;
  date_traitement: string | null;
  usager_statut: string | null;
  isbn_issn: string | null;
  editeur: string | null;
  bibliotheque: string | null;
  prix_cad: string | null;
  devise_originale: string | null;
  statut_bibliotheque: string | null;
  suivi_acq: string | null;
  statut_acq: string | null;
  note_acq: string | null;
  note_commentaire: string | null;
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

  readonly pendingRefresh$ = new Subject<void>();

  triggerPendingRefresh(): void {
    this.pendingRefresh$.next();
  }

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
  // NOUVEL ABONNEMENT
  // Composant : nouvel-abonnement.component.ts
  // Route     : POST /reponses/nouvel-abonnement
  // ──────────────────────────────────────────────────────────
  envoyerNouvelAbonnement(payload: {
    baseData:     Record<string, any>;
    specificData: Record<string, any>;
  }): Observable<any> {
    const body = {
      type_formulaire: 'Nouvel abonnement',
      usager_nom:      this.getNomSession(),
      usager_courriel: sessionStorage.getItem('courrielAdmin') ?? '',
      usager_statut:   sessionStorage.getItem('groupeAdmin')   ?? '',
      reponses: {
        baseData:     payload.baseData,
        specificData: payload.specificData
      }
    };
    return this.http
      .post(`${this.baseUrl}/nouvel-abonnement`, body, this.httpOptions)
      .pipe(catchError(this.handleError('envoyerNouvelAbonnement')));
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
  // PEB TIPASA NUMÉRIQUE
  // Composant : peb-tipasa-numerique.component.ts
  // Route     : POST /reponses/peb-tipasa
  // ──────────────────────────────────────────────────────────
  envoyerPebTipasa(payload: {
    baseData:     Record<string, any>;
    specificData: Record<string, any>;
  }): Observable<any> {
    const body = {
      type_formulaire: 'PEB Tipasa numérique',
      usager_nom:      this.getNomSession(),
      usager_courriel: sessionStorage.getItem('courrielAdmin') ?? '',
      usager_statut:   sessionStorage.getItem('groupeAdmin')   ?? '',
      reponses: {
        baseData:     payload.baseData,
        specificData: payload.specificData
      }
    };
    return this.http
      .post(`${this.baseUrl}/peb-tipasa`, body, this.httpOptions)
      .pipe(catchError(this.handleError('envoyerPebTipasa')));
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
    limit: number = 20,
    suivi_acq?: string,
    statut_bibliotheque?: string
  ): Observable<PaginatedResponse> {
    const params: any = { page, limit };
    if (type)               params['type']               = type;
    if (statut)             params['statut']             = statut;
    if (suivi_acq)          params['suivi_acq']          = suivi_acq;
    if (statut_bibliotheque) params['statut_bibliotheque'] = statut_bibliotheque;
    return this.http
      .get<PaginatedResponse>(this.baseUrl, { params })
      .pipe(catchError(this.handleError('getAll')));
  }

  /** Réponses en attente filtrées par statut_bibliotheque (pour le header et la liste ACQ).
   *  Seules les demandes où statut_acq ET suivi_acq sont vides/null sont incluses. */
  getPendingBib(limit = 5): Observable<{
    count: number;
    reponses: (Pick<Reponse, 'id' | 'type_formulaire' | 'usager_nom' | 'dateA'> & {
      source: 'reponse' | 'import' | 'reponse-created';
      item_id: number | null;
      statut_acq?: string | null;
      suivi_acq?:  string | null;
    })[];
  }> {
    return this.http
      .get<{ count: number; reponses: any[] }>(`${this.baseUrl}/pending`, {
        params: {
          limit,
          statut_field:    'statut_bibliotheque',
          statut_value:    'Soumettre aux ACQ',
          null_statut_acq: 'true',
          null_suivi_acq:  'true',
        }
      })
      .pipe(catchError(this.handleError('getPendingBib')));
  }

  getById(id: number): Observable<Reponse> {
    return this.http
      .get<Reponse>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError('getById')));
  }

  /** Crée l'item dans tbl_items depuis la réponse (idempotent). */
  creerItem(reponseId: number): Observable<{ success: boolean; item_id: number; reponse_id: number }> {
    return this.http
      .post<{ success: boolean; item_id: number; reponse_id: number }>(
        `${this.baseUrl}/${reponseId}/creer-item`,
        {}
      )
      .pipe(catchError(this.handleError('creerItem')));
  }

  getPending(limit = 5): Observable<{
    count: number;
    reponses: (Pick<Reponse, 'id' | 'type_formulaire' | 'usager_nom' | 'dateA'> & {
      source: 'reponse' | 'import' | 'reponse-created';
      item_id: number | null;
    })[];
  }> {
    return this.http
      .get<{ count: number; reponses: any[] }>(`${this.baseUrl}/pending`, {
        params: { limit }
      })
      .pipe(catchError(this.handleError('getPending')));
  }

  getPendingAcq(limit = 5): Observable<{
    count: number;
    reponses: (Pick<Reponse, 'id' | 'type_formulaire' | 'usager_nom' | 'dateA'> & {
      source: 'reponse' | 'import' | 'reponse-created';
      item_id: number | null;
    })[];
  }> {
    return this.http
      .get<{ count: number; reponses: any[] }>(`${this.baseUrl}/pending`, {
        params: { limit, statut_field: 'suivi_acq', statut_value: 'En attente de traitement' }
      })
      .pipe(catchError(this.handleError('getPendingAcq')));
  }

  getByEmail(email: string): Observable<{ data: DemandeUsager[] }> {
    return this.http
      .get<{ data: DemandeUsager[] }>(`${this.baseUrl}/profil`, { params: { email } })
      .pipe(catchError(this.handleError('getByEmail')));
  }

  getReponseById(id: number): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError('getReponseById')));
  }

  updateReponse(id: number, reponses: any): Observable<{ success: boolean }> {
    return this.http
      .patch<{ success: boolean }>(`${this.baseUrl}/${id}`, { reponses })
      .pipe(catchError(this.handleError('updateReponse')));
  }

  /** Synchronise suivi_acq / statut_acq sur tbl_reponses après une décision ACQ. */
  updateReponseStatut(id: number, fields: { suivi_acq?: string | null; statut_acq?: string | null }): Observable<{ success: boolean }> {
    return this.http
      .patch<{ success: boolean }>(`${this.baseUrl}/${id}`, fields)
      .pipe(catchError(this.handleError('updateReponseStatut')));
  }

  supprimer(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError('supprimer')));
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