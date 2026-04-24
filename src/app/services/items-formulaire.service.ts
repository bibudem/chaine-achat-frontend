import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { environment } from 'src/environments/environment';

import { ErrorHandlerService } from "./error-handler.service";

export interface Item {
  item_id?: number;
  formulaire_type?: string;
  date_creation?: string;
  priorite_demande?: string;
  titre_document: string;
  sous_titre?: string;
  isbn_issn?: string;
  editeur?: string;
  date_publication?: string;
  creation_notice_dtdm?: boolean;
  note_dtdm?: string;
  categorie_document?: string;
  format_support?: string;
  fournisseur?: string;
  fonds_budgetaire?: string;
  fonds_sn_projet?: string;
  bibliotheque?: string;
  localisation_emplacement?: string;
  demandeur: string;
  personne_a_aviser_activation?: string;
  projet_special?: string;
  statut_bibliotheque?: string;
  statut_acq?: string;
  source_information?: string;
  note_commentaire?: string;
  id_ressource?: string;
  catalogue?: string;
  date_modification?: string;
  utilisateur_modification?: string;

  // Champs tbl_items — ressource électronique
  prix_cad?: number;
  // FIX: devise_originale est VARCHAR(10) en DB → stocker le code court (CAD, USD, EUR, GBP)
  devise_originale?: string;
  prix_devise_originale?: number;
  periode_couverte?: string;
  nombre_titres_inclus?: number;
  nombre_utilisateurs?: string;
  lien_plateforme?: string;
  format_pret_numerique?: string;

  // tbl_modification_ccol
  precision_demande?: string;
  numero_oclc?: string;
  
  // tbl_nouvel_abonnement
  date_debut_abonnement?: string;
  type_monographie?: string;
  
  // tbl_nouvel_achat_unique
  projets_speciaux?: string;
  format_electronique?: string;
  reserve_cours?: boolean;
  reserve_cours_sigle?: string;
  reserve_cours_session?: string;
  reserve_cours_enseignant?: string;
  bordereau_imprime?: string;
  
  // tbl_peb_tipasa_numerique
  type_demande_peb?: string;
  reference_tipasa?: string;
  urgence?: boolean;
  
  // tbl_requete_acq (Requête Accessibilité)
  type_requete?: string;
  reference_usager?: string;
  description_requete?: string;
  action_demandee?: string;
  besoin_specifique_format?: string;
  permalien_sofia?: string;
  fournisseur_contacte_sans_succes?: string;
  exemplaire_detenu?: string;
  verification_caeb?: string;
  verification_sqla?: string;
  verification_emma?: string;
  acq_numerisation_recommandee?: string;
  acq_date_demande_editeur?: string;
  acq_date_livraison_estimee?: string;

  // tbl_nouvel_achat_unique
  quantite?: number;

  // tbl_suggestion_achat
  auteur?: string;
  usager_statut?: string;
  usager_faculte?: string;
  usager_courriel?: string;
  bibliothecaire_disciplinaire?: string;
  aviser_reservation?: boolean;
  aviser_reception?: boolean;
  date_requise_cours?: string;

  // Champs usager à aviser (Nouvel achat unique, Nouvel abonnement)
  usager_aviser_reservation?: string;
  usager_aviser_activation?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    offset: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    next: number | null;
    previous: number | null;
  };
}

@Injectable({
  providedIn: "root",
})
export class ItemFormulaireService {
  private url = `${environment.apiUrl}/items`;

  httpOptions: { headers: HttpHeaders } = {
    headers: new HttpHeaders({ 
      "Content-Type": "application/json",
    }),
  };

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private http: HttpClient
  ) {}

  // ==================== CRUD OPERATIONS ====================

  create(item: any): Observable<ApiResponse<Item>> {
    // FIX: formatForApi() appliqué avant l'envoi pour garantir les types DB
    const formattedItem = this.formatForApi(item);
    return this.http
      .post<ApiResponse<Item>>(`${this.url}/add`, formattedItem, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item>>("create")));
  }

  post(item: any): Observable<ApiResponse<Item>> {
    console.log('Données envoyées à l\'API:', item);
    return this.create(item);
  }

  getAll(opts: {
    limit?: number;
    offset?: number;
    search?: string;
    bibliotheque?: string;
    statut?: string;
    formulaire_type?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {}): Observable<ApiResponse<Item[]>> {
    let p = new HttpParams()
      .set('limit',  String(opts.limit  ?? 50))
      .set('offset', String(opts.offset ?? 0));

    if (opts.search)          p = p.set('search',          opts.search);
    if (opts.bibliotheque)    p = p.set('bibliotheque',    opts.bibliotheque);
    if (opts.statut)          p = p.set('statut',          opts.statut);
    if (opts.formulaire_type) p = p.set('formulaire_type', opts.formulaire_type);
    if (opts.sort)            p = p.set('sort',            opts.sort);
    if (opts.order)           p = p.set('order',           opts.order);

    return this.http
      .get<ApiResponse<Item[]>>(`${this.url}/all`, { headers: this.httpOptions.headers, params: p })
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item[]>>("getAll")));
  }

  getById(id: number): Observable<ApiResponse<Item>> {
    return this.http
      .get<ApiResponse<Item>>(`${this.url}/fiche/${id}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item>>("getById")));
  }

  consulter(id: number): Observable<ApiResponse<Item>> {
    return this.getById(id);
  }

  update(item: any): Observable<ApiResponse<Item>> {
    if (!item.item_id) {
      return throwError(() => new Error("ID de l'item manquant pour la mise à jour"));
    }

    const formattedItem = this.formatForApi(item);
    console.log('Données de mise à jour envoyées:', formattedItem);
    
    return this.http
      .put<ApiResponse<Item>>(`${this.url}/save/${item.item_id}`, formattedItem, this.httpOptions)
      .pipe(
        map(response => {
          console.log('Réponse de mise à jour:', response);
          return response;
        }),
        catchError(this.errorHandlerService.handleError<ApiResponse<Item>>("update"))
      );
  }

  delete(id: number): Observable<ApiResponse<Item>> {
    return this.http
      .delete<ApiResponse<Item>>(`${this.url}/delete/${id}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item>>("delete")));
  }

  // ==================== FILTERING & SEARCH ====================

  search(term: string): Observable<ApiResponse<Item[]>> {
    return this.http
      .get<ApiResponse<Item[]>>(`${this.url}/search?q=${encodeURIComponent(term)}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item[]>>("search")));
  }

  getByType(type: string): Observable<ApiResponse<Item[]>> {
    return this.http
      .get<ApiResponse<Item[]>>(`${this.url}/type/${encodeURIComponent(type)}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item[]>>("getByType")));
  }

  getByStatus(status: string): Observable<ApiResponse<Item[]>> {
    return this.http
      .get<ApiResponse<Item[]>>(`${this.url}/status/${encodeURIComponent(status)}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item[]>>("getByStatus")));
  }

  // ==================== STATISTICS ====================

  getStatistics(): Observable<ApiResponse<any>> {
    return this.http
      .get<ApiResponse<any>>(`${this.url}/statistics`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<any>>("getStatistics")));
  }

  // ==================== BATCH OPERATIONS ====================

  createBatch(items: any[]): Observable<ApiResponse<Item[]>> {
    return this.http
      .post<ApiResponse<Item[]>>(`${this.url}/batch`, items, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item[]>>("createBatch")));
  }

  getFournisseurs(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.url}/fournisseurs`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<any[]>>("getFournisseurs")));
  }

  // ==================== TEST ROUTE ====================

  testConnection(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/test`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("testConnection")));
  }

  // ==================== UTILITY METHODS ====================

  validateItem(item: Item): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!item.titre_document || item.titre_document.trim() === '') {
      errors.push('Le titre du document est obligatoire');
    }
    if (!item.demandeur || item.demandeur.trim() === '') {
      errors.push('Le demandeur est obligatoire');
    }
    if (!item.fonds_budgetaire || item.fonds_budgetaire.trim() === '') {
      errors.push('Le fonds budgétaire est obligatoire');
    }
    if (item.titre_document && item.titre_document.length > 500) {
      errors.push('Le titre du document ne peut pas dépasser 500 caractères');
    }
    if (item.sous_titre && item.sous_titre.length > 500) {
      errors.push('Le sous-titre ne peut pas dépasser 500 caractères');
    }
    if (item.isbn_issn && item.isbn_issn.length > 50) {
      errors.push('L\'ISBN/ISSN ne peut pas dépasser 50 caractères');
    }
    if (item.editeur && item.editeur.length > 300) {
      errors.push('L\'éditeur ne peut pas dépasser 300 caractères');
    }
    if (item.demandeur && item.demandeur.length > 200) {
      errors.push('Le demandeur ne peut pas dépasser 200 caractères');
    }
    if (item.fonds_budgetaire && item.fonds_budgetaire.length > 200) {
      errors.push('Le fonds budgétaire ne peut pas dépasser 200 caractères');
    }
    // FIX: validation de la longueur de devise_originale (VARCHAR(10) en DB)
    if (item.devise_originale && item.devise_originale.length > 10) {
      errors.push('Le code de devise ne peut pas dépasser 10 caractères (ex: CAD, USD, EUR, GBP)');
    }

    return { valid: errors.length === 0, errors };
  }

  formatForApi(item: any): any {
    const formattedItem = { ...item };
    
    // FIX: tous les booléens explicitement castés
    if (formattedItem.creation_notice_dtdm !== undefined) {
      formattedItem.creation_notice_dtdm = Boolean(formattedItem.creation_notice_dtdm);
    }
    if (formattedItem.aviser_reception !== undefined) {
      formattedItem.aviser_reception = Boolean(formattedItem.aviser_reception);
    }
    // FIX: reserve_cours doit être un booléen pour tbl_nouvel_achat_unique (boolean en DB)
    if (formattedItem.reserve_cours !== undefined) {
      formattedItem.reserve_cours = Boolean(formattedItem.reserve_cours);
    }
    if (formattedItem.urgence !== undefined) {
      formattedItem.urgence = Boolean(formattedItem.urgence);
    }
    if (formattedItem.recommandation !== undefined) {
      formattedItem.recommandation = Boolean(formattedItem.recommandation);
    }

    // Vider les chaînes vides → null
    Object.keys(formattedItem).forEach(key => {
      if (formattedItem[key] === '') {
        formattedItem[key] = null;
      }
    });
    
    // Trim des champs texte critiques
    formattedItem.titre_document    = formattedItem.titre_document?.trim()    || null;
    formattedItem.demandeur         = formattedItem.demandeur?.trim()         || null;
    formattedItem.fonds_budgetaire  = formattedItem.fonds_budgetaire?.trim()  || null;

    // FIX: si devise_originale est un libellé long (ancienne valeur), extraire le code
    // Permet la rétrocompatibilité si des données anciennes sont rechargées
    if (formattedItem.devise_originale && formattedItem.devise_originale.length > 10) {
      const deviseCodes: { [key: string]: string } = {
        'CAD - Dollar Canadien': 'CAD',
        'USD - Dollar US':       'USD',
        'EUR - Euro':            'EUR',
        'GBP - Livre Sterling':  'GBP',
      };
      formattedItem.devise_originale = deviseCodes[formattedItem.devise_originale] 
        || formattedItem.devise_originale.substring(0, 3);
    }
    
    return formattedItem;
  }

  checkExisting(id: number): Observable<boolean> {
    return this.getById(id).pipe(
      map(response => response.success && !!response.data),
      catchError(() => [false])
    );
  }
}