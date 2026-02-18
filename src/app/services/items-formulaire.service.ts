import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { ErrorHandlerService } from "./error-handler.service";

// Interface correspondant à votre table tbl_items
export interface Item {
  // Identifiant principal
  item_id?: number;
  formulaire_type?: string;
  
  // Champs communs à tous les formulaires
  date_creation?: string;
  priorite_demande?: string;
  titre_document: string;
  sous_titre?: string;
  isbn_issn?: string;
  editeur?: string;
  date_publication?: string;
  
  // Informations catalogage
  creation_notice_dtdm?: boolean;
  note_dtdm?: string;
  
  // Catégorie document
  categorie_document?: string;
  
  // Format/Support
  format_support?: string;
  
  // Informations financières communes
  fonds_budgetaire?: string;
  fonds_sn_projet?: string;
  
  // Bibliothèque
  bibliotheque?: string;
  localisation_emplacement?: string;
  
  // Personnes concernées
  demandeur: string;
  personne_a_aviser_activation?: string;
  
  // Projets spéciaux
  projet_special?: string;
  
  // Statuts
  statut_bibliotheque?: string;
  statut_acq?: string;
  
  // Informations additionnelles communes
  source_information?: string;
  note_commentaire?: string;
  id_ressource?: string;
  catalogue?: string;
  
  // Métadonnées
  date_modification?: string;
  utilisateur_modification?: string;

  // Champs spécifiques (peuvent être présents selon le type)
  // Modification CCOL
  precision_demande?: string;
  numero_oclc?: string;
  collection?: string;
  catalogage?: string;
  
  // Nouvel Abonnement
  date_debut_abonnement?: string;
  type_monographie?: string;
  
  // Nouvel Achat Unique
  projets_speciaux?: string;
  format_electronique?: string;
  reserve_cours?: boolean;
  reserve_cours_sigle?: string;
  reserve_cours_session?: string;
  reserve_cours_enseignant?: string;
  bordereau_imprime?: string;
  categorie_depense?: string;
  note_catalogueur_droit?: string;
  
  // PEB Tipasa Numérique
  type_demande_peb?: string;
  reference_tipasa?: string;
  urgence?: boolean;
  
  // Requête ACQ
  type_requete?: string;
  description_requete?: string;
  action_demandee?: string;
  
  // Springer
  quantite?: number;
  
  // Suggestion d'Achat
  justification?: string;
  public_cible?: string;
  recommandation?: boolean;
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
  private url = "http://localhost:3000/items";

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

  // CREATE - Ajouter un nouvel item
  create(item: any): Observable<ApiResponse<Item>> {
    return this.http
      .post<ApiResponse<Item>>(`${this.url}/add`, item, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item>>("create")));
  }

  // Alias pour create (post)
  post(item: any): Observable<ApiResponse<Item>> {
    console.log('Données envoyées à l\'API:', item);
    return this.create(item);
  }

  // READ ALL - Récupérer tous les items
  getAll(limit: number = 50, offset: number = 0): Observable<ApiResponse<Item[]>> {
    return this.http
      .get<ApiResponse<Item[]>>(`${this.url}/all?limit=${limit}&offset=${offset}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item[]>>("getAll")));
  }

  // READ ONE - Récupérer un item par ID avec ses données spécifiques
  getById(id: number): Observable<ApiResponse<Item>> {
    return this.http
      .get<ApiResponse<Item>>(`${this.url}/fiche/${id}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item>>("getById")));
  }

  // Alias pour getById
  consulter(id: number): Observable<ApiResponse<Item>> {
    return this.getById(id);
  }

  // UPDATE - Mettre à jour un item avec ses données spécifiques
  update(item: any): Observable<ApiResponse<Item>> {
    if (!item.item_id) {
      return throwError(() => new Error("ID de l'item manquant pour la mise à jour"));
    }

    return this.http
      .put<ApiResponse<Item>>(`${this.url}/save/${item.item_id}`, item, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item>>("update")));
  }

  // DELETE - Supprimer un item (cascade sur tables spécifiques)
  delete(id: number): Observable<ApiResponse<Item>> {
    return this.http
      .delete<ApiResponse<Item>>(`${this.url}/delete/${id}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item>>("delete")));
  }

  // ==================== FILTERING & SEARCH ====================

  // SEARCH - Rechercher des items
  search(term: string): Observable<ApiResponse<Item[]>> {
    return this.http
      .get<ApiResponse<Item[]>>(`${this.url}/search?q=${encodeURIComponent(term)}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item[]>>("search")));
  }

  // FILTER BY TYPE - Filtrer par type de formulaire
  getByType(type: string): Observable<ApiResponse<Item[]>> {
    return this.http
      .get<ApiResponse<Item[]>>(`${this.url}/type/${encodeURIComponent(type)}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item[]>>("getByType")));
  }

  // FILTER BY STATUS - Filtrer par statut
  getByStatus(status: string): Observable<ApiResponse<Item[]>> {
    return this.http
      .get<ApiResponse<Item[]>>(`${this.url}/status/${encodeURIComponent(status)}`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item[]>>("getByStatus")));
  }

  // ==================== STATISTICS ====================

  // GET STATISTICS - Obtenir les statistiques
  getStatistics(): Observable<ApiResponse<any>> {
    return this.http
      .get<ApiResponse<any>>(`${this.url}/statistics`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<any>>("getStatistics")));
  }

  // ==================== BATCH OPERATIONS ====================

  // CREATE BATCH - Créer plusieurs items à la fois
  createBatch(items: any[]): Observable<ApiResponse<Item[]>> {
    return this.http
      .post<ApiResponse<Item[]>>(`${this.url}/batch`, items, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<ApiResponse<Item[]>>("createBatch")));
  }

  // ==================== TEST ROUTE ====================

  // Tester la connexion à l'API
  testConnection(): Observable<any> {
    return this.http
      .get<any>(`${this.url}/test`, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("testConnection")));
  }

  // ==================== UTILITY METHODS ====================

  // Validation des données avant soumission
  validateItem(item: Item): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation des champs obligatoires
    if (!item.titre_document || item.titre_document.trim() === '') {
      errors.push('Le titre du document est obligatoire');
    }

    if (!item.demandeur || item.demandeur.trim() === '') {
      errors.push('Le demandeur est obligatoire');
    }

    if (!item.fonds_budgetaire || item.fonds_budgetaire.trim() === '') {
      errors.push('Le fonds budgétaire est obligatoire');
    }

    // Validation des longueurs maximales
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

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Formater les données pour l'API
  formatForApi(item: Item): Item {
    console.log(item);
    return {
      ...item,
      // Assurer que les booléens sont convertis correctement
      creation_notice_dtdm: item.creation_notice_dtdm || false,
      // Nettoyer les chaînes vides
      titre_document: item.titre_document?.trim() || '',
      demandeur: item.demandeur?.trim() || '',
      fonds_budgetaire: item.fonds_budgetaire?.trim() || '',
      // Ajouter la date de modification si c'est une mise à jour
      ...(item.item_id && { date_modification: new Date().toISOString() })
    };
  }
}