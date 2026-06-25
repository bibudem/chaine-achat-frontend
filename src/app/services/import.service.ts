import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import * as XLSX from 'xlsx';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export type FormType =
  | 'Nouvel achat unique'
  | 'Nouvel abonnement'
  | 'Modification et CCOL'
  | 'PEB Tipasa numérique'
  | 'Requête ACQ Accessibilité'
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
      { name: 'prix_cad',                  required: true,  example: '49.95' },
      { name: 'devise_originale',          required: true,  example: 'CAD' },
      { name: 'prix_devise_originale',     required: true,  example: '49.95' },
      { name: 'source_information',        required: true,  example: 'https://www.example.com/livre' },
      { name: 'quantite',                  required: true,  example: '1' },
      { name: 'priorite_demande',          required: false, example: 'Régulier' },
      { name: 'sous_titre',                required: false, example: 'Une introduction pratique' },
      { name: 'date_publication',          required: true,  example: '2024' },
      { name: 'type_monographie',          required: false, example: 'Livre' },
      { name: 'format_electronique',       required: false, example: 'PDF' },
      { name: 'nombre_utilisateurs',       required: false, example: 'Accès illimité' },
      { name: 'lien_plateforme',           required: false, example: 'https://...' },
      { name: 'reserve_cours',             required: false, example: 'Oui' },
      { name: 'reserve_cours_sigle',       required: false, example: 'INFO-4200' },
      { name: 'reserve_cours_session',     required: false, example: 'Automne 2024' },
      { name: 'reserve_cours_enseignant',  required: false, example: 'Prof. Dupont' },
      { name: 'note_commentaire',          required: false, example: 'À commander rapidement' },
      { name: 'statut_acq',               required: false, example: 'Commandé' },
      { name: 'suivi_acq',                required: false, example: 'En attente fournisseur' },
      { name: 'note_acq',                 required: false, example: 'Vérifier CRKN' },
      { name: 'bibliotheque_note_interne',required: false, example: 'Note interne bibliothèque' },
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
      { name: 'isbn_issn',                 required: true,  example: '00280836' },
      { name: 'editeur',                   required: true,  example: 'Springer Nature' },
      { name: 'categorie_document',        required: true,  example: 'Périodique' },
      { name: 'format_support',            required: true,  example: 'Électronique' },
      { name: 'fonds_budgetaire',          required: true,  example: 'PE-001' },
      { name: 'prix_cad',                  required: true,  example: '1200.00' },
      { name: 'devise_originale',          required: true,  example: 'USD' },
      { name: 'prix_devise_originale',     required: true,  example: '900.00' },
      { name: 'source_information',        required: true,  example: 'https://www.example.com' },
      { name: 'date_debut_abonnement',     required: true,  example: '2025-01-01' },
      { name: 'sous_titre',                required: false, example: 'International Journal of Science' },
      { name: 'nombre_titres_inclus',      required: false, example: '50' },
      { name: 'nombre_utilisateurs',       required: false, example: 'Accès illimité' },
      { name: 'lien_plateforme',           required: false, example: 'https://...' },
      { name: 'periode_couverte',          required: false, example: '2025' },
      { name: 'type_monographie',          required: false, example: 'Livre' },
      { name: 'usager_aviser_reservation', required: false, example: 'prenom.nom@umontreal.ca' },
      { name: 'note_commentaire',          required: false, example: 'Renouvellement annuel' },
      { name: 'statut_acq',               required: false, example: 'Renouvelé' },
      { name: 'suivi_acq',                required: false, example: 'Négociation CRKN en cours' },
      { name: 'note_acq',                 required: false, example: 'Tarif consortial' },
      { name: 'bibliotheque_note_interne',required: false, example: 'Note interne bibliothèque' },
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
      { name: 'precision_demande',         required: true,  example: 'Correction champ 245' },
      { name: 'categorie_document',        required: true,  example: 'Périodique' },
      { name: 'format_support',            required: true,  example: 'Électronique' },
      { name: 'fonds_budgetaire',          required: true,  example: 'PE-001' },
      { name: 'prix_cad',                  required: true,  example: '49.95' },
      { name: 'devise_originale',          required: true,  example: 'CAD' },
      { name: 'prix_devise_originale',     required: true,  example: '49.95' },
      { name: 'source_information',        required: true,  example: 'https://www.example.com' },
      { name: 'sous_titre',                required: false, example: 'Tome 2' },
      { name: 'date_publication',          required: false, example: '2024' },
      { name: 'numero_oclc',               required: false, example: '12345678' },
      { name: 'date_debut_abonnement',     required: false, example: '2025-01-01' },
      { name: 'nombre_utilisateurs',       required: false, example: 'Accès illimité' },
      { name: 'lien_plateforme',           required: false, example: 'https://...' },
      { name: 'usager_aviser_activation',  required: false, example: 'prenom.nom@umontreal.ca' },
      { name: 'note_commentaire',          required: false, example: 'Mise à jour champ 245' },
      { name: 'statut_acq',               required: false, example: 'Traité' },
      { name: 'suivi_acq',                required: false, example: 'Envoyé au catalogage' },
      { name: 'note_acq',                 required: false, example: '' },
      { name: 'bibliotheque_note_interne',required: false, example: 'Note interne bibliothèque' },
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
      { name: 'categorie_document',          required: true,  example: 'Monographie' },
      { name: 'format_support',              required: true,  example: 'Électronique' },
      { name: 'fonds_budgetaire',            required: true,  example: 'PE-001' },
      { name: 'prix_cad',                    required: true,  example: '49.95' },
      { name: 'devise_originale',            required: true,  example: 'CAD' },
      { name: 'prix_devise_originale',       required: true,  example: '49.95' },
      { name: 'source_information',          required: true,  example: 'https://www.example.com' },
      { name: 'gobi_vu_format_numerique',    required: true,  example: 'Oui' },
      { name: 'priorite_demande',            required: false, example: 'Régulier' },
      { name: 'sous_titre',                  required: false, example: 'Une introduction pratique' },
      { name: 'date_publication',            required: false, example: '2024' },
      { name: 'reference_tipasa',            required: false, example: 'TIP-2024-001' },
      { name: 'gobi_version_moins_365_usd',  required: false, example: "Ne s'applique pas" },
      { name: 'acq_responsable_courriel',    required: false, example: 'prenom.nom@umontreal.ca' },
      { name: 'note_commentaire',            required: false, example: 'Délai urgent' },
      { name: 'statut_acq',                 required: false, example: 'En cours' },
      { name: 'suivi_acq',                  required: false, example: 'GOBI consulté' },
      { name: 'note_acq',                   required: false, example: '' },
      { name: 'bibliotheque_note_interne',  required: false, example: 'Note interne bibliothèque' },
    ]
  },
  {
    // tbl_items + tbl_requete_acq
    type:        'Requête ACQ Accessibilité',
    label:       'Requête ACQ Accessibilité',
    icon:        'bi bi-universal-access',
    description: "Demandes d'acquisition et de modification pour les ressources accessibles.",
    columns: [
      // ── Champs communs ──
      { name: 'titre_document',               required: true,  example: 'Introduction aux mathématiques' },
      { name: 'demandeur',                    required: true,  example: 'Marie Tremblay' },
      { name: 'bibliotheque',                 required: true,  example: 'Service Accessibilité' },
      { name: 'isbn_issn',                    required: true,  example: '9782070360024' },
      { name: 'editeur',                      required: true,  example: 'PUF' },
      { name: 'categorie_document',           required: true,  example: 'Monographie' },
      { name: 'format_support',               required: true,  example: 'Imprimé/support physique' },
      { name: 'fonds_budgetaire',             required: true,  example: 'SA-001' },
      { name: 'prix_cad',                     required: true,  example: '49.95' },
      { name: 'devise_originale',             required: true,  example: 'CAD' },
      { name: 'prix_devise_originale',        required: true,  example: '49.95' },
      { name: 'source_information',           required: true,  example: 'https://...' },
      { name: 'sous_titre',                   required: false, example: 'Vol. 2' },
      { name: 'date_publication',             required: false, example: '2023' },
      { name: 'priorite_demande',             required: false, example: 'Urgent' },
      { name: 'note_commentaire',             required: false, example: 'Délai urgent' },
      // ── Champs spécifiques ──
      { name: 'reference_usager',                  required: false, example: 'ACC-2025-001' },
      { name: 'besoin_specifique_format',           required: false, example: 'Électronique : acheter licence institutionnelle standard' },
      { name: 'type_monographie',                  required: false, example: 'Livre' },
      { name: 'fournisseur_contacte_sans_succes',  required: false, example: "Ne s'applique pas" },
      { name: 'exemplaire_detenu',                 required: false, example: 'Imprimé' },
      { name: 'verification_caeb',                 required: false, example: "Ne s'applique pas" },
      { name: 'verification_sqla',                 required: false, example: 'NON' },
      { name: 'verification_emma',                 required: false, example: 'NON' },
      { name: 'permalien_sofia',                   required: false, example: 'https://...' },
      { name: 'acq_numerisation_recommandee',      required: false, example: 'NON' },
      { name: 'acq_date_demande_editeur',          required: false, example: '2025-01-15' },
      { name: 'acq_date_livraison_estimee',        required: false, example: '2025-03-01' },
      { name: 'acq_responsable_courriel',          required: false, example: 'prenom.nom@umontreal.ca' },
      { name: 'statut_acq',                        required: false, example: 'Traité' },
      { name: 'suivi_acq',                         required: false, example: 'Commande éditeur' },
      { name: 'note_acq',                          required: false, example: 'Format accessible fourni' },
      { name: 'bibliotheque_note_interne',         required: false, example: 'Note interne bibliothèque' },
    ]
  },
  {
    // tbl_items + tbl_suggestion_achat
    type:        "Suggestion d'achat - Usager",
    label:       "Suggestion d'achat - Usager",
    icon:        'bi bi-lightbulb',
    description: "Suggestions d'acquisition par les usagers.",
    columns: [
      // ── Champs communs ──
      { name: 'titre_document',               required: true,  example: 'Machine Learning Pro' },
      { name: 'demandeur',                    required: true,  example: 'Prof. Lavoie' },
      { name: 'bibliotheque',                 required: true,  example: 'Informatique' },
      { name: 'isbn_issn',                    required: true,  example: '9782070360024' },
      { name: 'editeur',                      required: true,  example: 'O\'Reilly' },
      { name: 'categorie_document',           required: true,  example: 'Monographie' },
      { name: 'format_support',               required: true,  example: 'Imprimé/support physique' },
      { name: 'fonds_budgetaire',             required: true,  example: 'SC-001' },
      { name: 'prix_cad',                     required: true,  example: '79.95' },
      { name: 'devise_originale',             required: true,  example: 'CAD' },
      { name: 'prix_devise_originale',        required: true,  example: '79.95' },
      { name: 'source_information',           required: true,  example: 'https://...' },
      { name: 'sous_titre',                   required: false, example: 'Une approche pratique' },
      { name: 'date_publication',             required: false, example: '2024' },
      { name: 'priorite_demande',             required: false, example: 'Régulier' },
      { name: 'note_commentaire',             required: false, example: 'Besoin pour le cours' },
      // ── Champs spécifiques ──
      { name: 'auteur',                       required: true,  example: 'Jean Dupont' },
      { name: 'usager_statut',                required: true,  example: 'Étudiant 2e cycle' },
      { name: 'usager_faculte',               required: true,  example: 'Faculté des sciences' },
      { name: 'usager_courriel',              required: true,  example: 'prenom.nom@umontreal.ca' },
      { name: 'bibliothecaire_disciplinaire', required: true,  example: 'biblio@umontreal.ca' },
      { name: 'usager_nom',                   required: false, example: 'Marie Tremblay' },
      { name: 'acq_isbn',                     required: false, example: '9782070360024' },
      { name: 'date_requise_cours',           required: false, example: '2025-09-01' },
      { name: 'reserve_cours',                required: false, example: 'Oui' },
      { name: 'reserve_cours_sigle',          required: false, example: 'INFO-4200' },
      { name: 'bordereau_imprime',            required: false, example: 'Non' },
      { name: 'aviser_reservation',           required: false, example: 'Oui' },
      { name: 'aviser_reception',             required: false, example: 'Oui' },
      { name: 'note_usager',                  required: false, example: 'Besoin urgent pour le cours' },
      { name: 'techdoc_suggestion_transmise', required: false, example: 'Oui' },
      { name: 'acq_responsable_courriel',     required: false, example: 'prenom.nom@umontreal.ca' },
      { name: 'acq_raison_annulation',        required: false, example: 'Déjà en collection' },
      { name: 'statut_acq',                   required: false, example: 'Approuvé' },
      { name: 'suivi_acq',                    required: false, example: 'Commandé chez fournisseur' },
      { name: 'note_acq',                     required: false, example: 'Vérifier disponibilité' },
      { name: 'bibliotheque_note_interne',    required: false, example: 'Note interne bibliothèque' },
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
    const prenom = sessionStorage.getItem('prenomAdmin') ?? '';
    const nom    = sessionStorage.getItem('nomAdmin')    ?? '';
    fd.append('utilisateur', `${prenom} ${nom}`.trim() || 'Inconnu');
    return this.http.post<ImportResult>(
      `${this.baseUrl}/${encodeURIComponent(type)}`,
      fd
    );
  }

  downloadTemplate(type: FormType): void {
    const info = FORM_TYPES.find(f => f.type === type);
    if (!info) return;

    const filename = `modele_import_${type.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    const headers  = info.columns.map(c => c.name);
    const required = info.columns.map(c => c.required ? 'REQUIS' : 'Optionnel');
    const examples = info.columns.map(c => c.example);

    const ws = XLSX.utils.aoa_to_sheet([headers, required, examples]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import');
    XLSX.writeFile(wb, filename);
  }
}