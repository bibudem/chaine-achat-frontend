import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export type FormType =
  | 'Nouvel achat unique'
  | 'Nouvel abonnement'
  | 'Modification et CCOL'
  | 'PEB Tipasa numérique'
  | 'Requête ACQ Accessibilité'
  | 'Springer'
  | "Suggestion d'achat - Usager";

export interface ImportResult {
  success:  boolean;
  message:  string;
  inserted: number;
  total:    number;
  errors:   Array<{ ligne: number; erreur: string }>;
}

export interface ColumnInfo {
  name:     string;
  required: boolean;
  example:  string;
}

export interface FormTypeInfo {
  type:        FormType;
  label:       string;
  icon:        string;
  description: string;
  columns:     ColumnInfo[];
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MÉTADONNÉES UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const FORM_TYPES: FormTypeInfo[] = [
  {
    // tbl_items + tbl_nouvel_achat_unique
    type:        'Nouvel achat unique',
    label:       'Nouvel achat unique',
    icon:        'bi bi-cart-plus',
    description: "Acquisition ponctuelle d'un document.",
    columns: [
      { name: 'titre_document',            required: true,  example: "Introduction à l'informatique" },
      { name: 'demandeur',                 required: true,  example: 'Marie Tremblay' },
      { name: 'bibliotheque',              required: true,  example: 'Sciences' },
      { name: 'isbn_issn',                 required: true,  example: '9782070360024' },
      { name: 'editeur',                   required: true,  example: 'Gallimard' },
      { name: 'categorie_document',        required: true,  example: 'Monographie' },
      { name: 'format_support',            required: true,  example: 'Imprimé/support physique' },
      { name: 'fonds_budgetaire',          required: true,  example: 'SC-24' },
      { name: 'source_information',        required: true,  example: 'https://www.example.com/livre' },
      { name: 'devise_originale',          required: true,  example: 'CAD' },
      { name: 'prix_devise_originale',     required: true,  example: '49.95' },
      { name: 'prix_cad',                  required: true,  example: '49.95' },
      { name: 'quantite',                  required: true,  example: '1' },
      { name: 'priorite_demande',          required: false, example: 'Régulier' },
      { name: 'sous_titre',                required: false, example: 'Une introduction pratique' },
      { name: 'date_publication',          required: false, example: '2024' },
      { name: 'type_monographie',          required: false, example: 'Livre' },
      { name: 'format_electronique',       required: false, example: 'PDF' },
      { name: 'nombre_utilisateurs',       required: false, example: 'Accès illimité' },
      { name: 'lien_plateforme',           required: false, example: 'https://...' },
      { name: 'reserve_cours',             required: false, example: 'Oui' },
      { name: 'reserve_cours_sigle',       required: false, example: 'INFO-4200' },
      { name: 'reserve_cours_session',     required: false, example: 'Automne 2024' },
      { name: 'reserve_cours_enseignant',  required: false, example: 'Prof. Dupont' },
      { name: 'note_commentaire',          required: false, example: 'À commander rapidement' },
    ]
  },
  {
    // tbl_items + tbl_nouvel_abonnement
    type:        'Nouvel abonnement',
    label:       'Nouvel abonnement',
    icon:        'bi bi-newspaper',
    description: 'Souscription à une ressource périodique.',
    columns: [
      { name: 'titre_document',           required: true,  example: 'Nature' },
      { name: 'demandeur',                required: true,  example: 'Jean Dupont' },
      { name: 'bibliotheque',             required: true,  example: 'Sciences' },
      { name: 'isbn_issn',                required: true,  example: '00280836' },
      { name: 'editeur',                  required: true,  example: 'Springer Nature' },
      { name: 'date_debut_abonnement',    required: true,  example: '2025-01-01' },
      { name: 'categorie_document',       required: true,  example: 'Périodique' },
      { name: 'format_support',           required: true,  example: 'Électronique' },
      { name: 'fonds_budgetaire',         required: true,  example: 'PE-001' },
      { name: 'source_information',       required: true,  example: 'https://www.example.com' },
      { name: 'devise_originale',         required: true,  example: 'USD' },
      { name: 'prix_devise_originale',    required: true,  example: '900.00' },
      { name: 'prix_cad',                 required: true,  example: '1200.00' },
      { name: 'sous_titre',               required: false, example: 'International Journal of Science' },
      { name: 'nombre_titres_inclus',     required: false, example: '50' },
      { name: 'nombre_utilisateurs',      required: false, example: 'Accès illimité' },
      { name: 'lien_plateforme',          required: false, example: 'https://...' },
      { name: 'periode_couverte',         required: false, example: '2025' },
      { name: 'type_monographie',         required: false, example: 'Livre' },
      { name: 'usager_aviser_reservation',required: false, example: 'prenom.nom@umontreal.ca' },
      { name: 'note_commentaire',         required: false, example: 'Renouvellement annuel' },
    ]
  },
  {
    // tbl_items + tbl_modification_ccol
    type:        'Modification et CCOL',
    label:       'Modification et CCOL',
    icon:        'bi bi-pencil-square',
    description: 'Modifications de notices dans le catalogue collectif.',
    columns: [
      { name: 'titre_document',           required: true,  example: 'Les misérables' },
      { name: 'demandeur',                required: true,  example: 'Paul Martin' },
      { name: 'bibliotheque',             required: true,  example: 'Centrale' },
      { name: 'isbn_issn',                required: true,  example: '9782070360024' },
      { name: 'editeur',                  required: true,  example: 'Gallimard' },
      { name: 'precision_demande',        required: true,  example: 'Correction champ 245' },
      { name: 'categorie_document',       required: true,  example: 'Périodique' },
      { name: 'format_support',           required: true,  example: 'Électronique' },
      { name: 'fonds_budgetaire',         required: true,  example: 'PE-001' },
      { name: 'source_information',       required: true,  example: 'https://www.example.com' },
      { name: 'devise_originale',         required: true,  example: 'CAD' },
      { name: 'prix_devise_originale',    required: true,  example: '49.95' },
      { name: 'prix_cad',                 required: true,  example: '49.95' },
      { name: 'sous_titre',               required: false, example: 'Tome 2' },
      { name: 'date_publication',         required: false, example: '2024' },
      { name: 'numero_oclc',              required: false, example: '12345678' },
      { name: 'date_debut_abonnement',    required: false, example: '2025-01-01' },
      { name: 'nombre_utilisateurs',      required: false, example: 'Accès illimité' },
      { name: 'lien_plateforme',          required: false, example: 'https://...' },
      { name: 'usager_aviser_activation', required: false, example: 'prenom.nom@umontreal.ca' },
      { name: 'note_commentaire',         required: false, example: 'Mise à jour champ 245' },
    ]
  },
  {
    // tbl_items + tbl_peb_tipasa_numerique
    type:        'PEB Tipasa numérique',
    label:       'PEB Tipasa numérique',
    icon:        'bi bi-link-45deg',
    description: 'Prêt entre bibliothèques via Tipasa.',
    columns: [
      { name: 'titre_document',              required: true,  example: 'Article sur les réseaux' },
      { name: 'demandeur',                   required: true,  example: 'Sophie Côté' },
      { name: 'bibliotheque',                required: true,  example: 'Droit' },
      { name: 'isbn_issn',                   required: true,  example: '9782070360024' },
      { name: 'editeur',                     required: true,  example: 'Springer' },
      { name: 'type_demande_peb',            required: true,  example: 'Prêt' },
      { name: 'categorie_document',          required: true,  example: 'Monographie' },
      { name: 'format_support',              required: true,  example: 'Électronique' },
      { name: 'fonds_budgetaire',            required: true,  example: 'PE-001' },
      { name: 'source_information',          required: true,  example: 'https://www.example.com' },
      { name: 'devise_originale',            required: true,  example: 'CAD' },
      { name: 'prix_devise_originale',       required: true,  example: '49.95' },
      { name: 'prix_cad',                    required: true,  example: '49.95' },
      { name: 'priorite_demande',            required: false, example: 'Régulier' },
      { name: 'sous_titre',                  required: false, example: 'Une introduction pratique' },
      { name: 'date_publication',            required: false, example: '2024' },
      { name: 'reference_tipasa',            required: false, example: 'TIP-2024-001' },
      { name: 'gobi_version_moins_365_usd',  required: false, example: "Ne s'applique pas" },
      { name: 'acq_responsable_courriel',    required: false, example: 'prenom.nom@umontreal.ca' },
      { name: 'note_commentaire',            required: false, example: 'Délai urgent' },
    ]
  },
  {
    // tbl_items + tbl_requete_acq
    type:        'Requête ACQ Accessibilité',
    label:       'Requête ACQ Accessibilité',
    icon:        'bi bi-universal-access',
    description: "Demandes d'acquisition et de modification pour les ressources accessibles.",
    columns: [
      { name: 'titre_document',                   required: true,  example: 'Introduction aux mathématiques' },
      { name: 'demandeur',                         required: true,  example: 'Marie Tremblay' },
      { name: 'bibliotheque',                      required: true,  example: 'Service Accessibilité' },
      { name: 'type_requete',                      required: true,  example: 'Information' },
      { name: 'isbn_issn',                         required: false, example: '9782070360024' },
      { name: 'priorite_demande',                  required: false, example: 'Urgent' },
      { name: 'fonds_budgetaire',                  required: false, example: 'SA-001' },
      { name: 'reference_usager',                  required: false, example: 'ACC-2025-001' },
      { name: 'description_requete',               required: false, example: 'Version EPUB requise' },
      { name: 'besoin_specifique_format',           required: false, example: 'Électronique : acheter licence institutionnelle standard' },
      { name: 'fournisseur_contacte_sans_succes',  required: false, example: 'NON' },
      { name: 'exemplaire_papier_detenu',           required: false, example: 'OUI' },
      { name: 'exemplaire_electronique_detenu',     required: false, example: 'NON' },
      { name: 'verification_caeb',                  required: false, example: "Ne s'applique pas" },
      { name: 'verification_sqla',                  required: false, example: 'NON' },
      { name: 'verification_emma',                  required: false, example: 'NON' },
      { name: 'permalien_sofia',                    required: false, example: 'https://...' },
    ]
  },
  {
    // tbl_items + tbl_springer
    type:        'Springer',
    label:       'Springer',
    icon:        'bi bi-journal-bookmark',
    description: 'Commandes de livres et paquets Springer.',
    columns: [
      { name: 'titre_document',        required: true,  example: 'Springer Handbook of Robotics' },
      { name: 'demandeur',             required: true,  example: 'Anna Schmidt' },
      { name: 'bibliotheque',          required: true,  example: 'Sciences appliquées' },
      { name: 'isbn_issn',             required: false, example: '978-3-030-00000-0' },
      { name: 'priorite_demande',      required: false, example: 'Régulier' },
      { name: 'fournisseur',           required: false, example: 'Springer' },
      { name: 'prix_cad',              required: false, example: '199.00' },
      { name: 'devise_originale',      required: false, example: 'EUR' },
      { name: 'prix_devise_originale', required: false, example: '149.00' },
      { name: 'nombre_titres_inclus',  required: false, example: '10' },
      { name: 'lien_plateforme',       required: false, example: 'https://link.springer.com/...' },
    ]
  },
  {
    // tbl_items + tbl_suggestion_achat
    type:        "Suggestion d'achat - Usager",
    label:       "Suggestion d'achat - Usager",
    icon:        'bi bi-lightbulb',
    description: "Suggestions d'acquisition par les usagers.",
    columns: [
      { name: 'titre_document',  required: true,  example: 'Machine Learning Pro' },
      { name: 'demandeur',       required: true,  example: 'Prof. Lavoie' },
      { name: 'bibliotheque',    required: true,  example: 'Informatique' },
      { name: 'justification',   required: false, example: 'Utilisé en cours INFO-4200' },
      { name: 'public_cible',    required: false, example: 'Étudiants 2e cycle' },
      { name: 'recommandation',  required: false, example: 'Oui' },
      { name: 'fournisseur',     required: false, example: 'Amazon' },
      { name: 'prix_cad',        required: false, example: '79.95' },
    ]
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SERVICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
@Injectable({ providedIn: 'root' })
export class ImportService {

  private readonly baseUrl = `${environment.apiUrl}/import`;

  constructor(private http: HttpClient) {}

  importFile(type: FormType, file: File): Observable<ImportResult> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ImportResult>(
      `${this.baseUrl}/${encodeURIComponent(type)}`,
      fd
    );
  }

  downloadTemplate(type: FormType): void {
    window.open(
      `${this.baseUrl}/template/${encodeURIComponent(type)}`,
      '_blank'
    );
  }
}