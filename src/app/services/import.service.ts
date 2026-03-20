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
  | 'Modification CCOL'
  | 'PEB Tipasa numérique'
  | 'Requête ACQ'
  | 'Springer'
  | "Suggestion d'achat";

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
    type:        'Nouvel achat unique',
    label:       'Nouvel achat unique',
    icon:        'bi bi-cart-plus',
    description: "Acquisition ponctuelle d'un document.",
    columns: [
      { name: 'Titre',               required: true,  example: "Introduction à l'informatique" },
      { name: 'Demandeur',           required: true,  example: 'Marie Tremblay' },
      { name: 'Bibliothèque',        required: true,  example: 'Bibliothèque des sciences' },
      { name: 'Priorité',            required: false, example: 'Régulier' },
      { name: 'ISBN / ISSN',         required: false, example: '978-2-07-036024-5' },
      { name: 'Éditeur',             required: false, example: 'Gallimard' },
      { name: 'Fonds budgétaire',    required: false, example: 'SCI-2024' },
      { name: 'Type monographie',    required: false, example: 'Monographie' },
      { name: 'Format électronique', required: false, example: 'PDF' },
      { name: 'Réserve de cours',    required: false, example: 'Oui' },
      { name: 'Sigle cours',         required: false, example: 'INFO-4200' },
      { name: 'Catégorie dépense',   required: false, example: 'Monographies' },
    ]
  },
  {
    type:        'Nouvel abonnement',
    label:       'Nouvel abonnement',
    icon:        'bi bi-newspaper',
    description: 'Souscription à une ressource périodique.',
    columns: [
      { name: 'Titre',                 required: true,  example: 'Nature' },
      { name: 'Demandeur',             required: true,  example: 'Jean Dupont' },
      { name: 'Bibliothèque',          required: true,  example: 'Sciences' },
      { name: 'Date début abonnement', required: true,  example: '2025-01-01' },
      { name: 'Priorité',              required: false, example: 'Prioritaire' },
      { name: 'Fonds budgétaire',      required: false, example: 'PER-2024' },
      { name: 'Collection',            required: false, example: 'Springer Nature' },
      { name: 'Catalogage',            required: false, example: 'Oui' },
    ]
  },
  {
    type:        'Modification CCOL',
    label:       'Modification CCOL',
    icon:        'bi bi-pencil-square',
    description: 'Modifications de notices dans le catalogue collectif.',
    columns: [
      { name: 'Titre',             required: true,  example: 'Les misérables' },
      { name: 'Demandeur',         required: true,  example: 'Paul Martin' },
      { name: 'Bibliothèque',      required: true,  example: 'Centrale' },
      { name: 'Précision demande', required: true,  example: 'Correction champ 245' },
      { name: 'Numéro OCLC',       required: false, example: '12345678' },
      { name: 'Collection',        required: false, example: 'Romans classiques' },
      { name: 'Catalogage',        required: false, example: 'Non' },
    ]
  },
  {
    type:        'PEB Tipasa numérique',
    label:       'PEB Tipasa numérique',
    icon:        'bi bi-link-45deg',
    description: 'Prêt entre bibliothèques via Tipasa.',
    columns: [
      { name: 'Titre',            required: true,  example: 'Article sur les réseaux' },
      { name: 'Demandeur',        required: true,  example: 'Sophie Côté' },
      { name: 'Bibliothèque',     required: true,  example: 'Droit' },
      { name: 'Type demande PEB', required: false, example: 'Prêt' },
      { name: 'Référence Tipasa', required: false, example: 'TIP-2024-001' },
      { name: 'Urgence',          required: false, example: 'Non' },
    ]
  },
  {
    type:        'Requête ACQ',
    label:       'Requête ACQ',
    icon:        'bi bi-question-circle',
    description: 'Questions adressées au service des acquisitions.',
    columns: [
      { name: 'Titre',               required: true,  example: 'Disponibilité titre X' },
      { name: 'Demandeur',           required: true,  example: 'Luc Bernard' },
      { name: 'Bibliothèque',        required: true,  example: 'Médecine' },
      { name: 'Type requête',        required: false, example: 'Information' },
      { name: 'Description requête', required: false, example: 'Vérifier si...' },
      { name: 'Action demandée',     required: false, example: 'Commander' },
    ]
  },
  {
    type:        'Springer',
    label:       'Springer',
    icon:        'bi bi-journal-bookmark',
    description: 'Commandes de livres et paquets Springer.',
    columns: [
      { name: 'Titre',        required: true,  example: 'Springer Handbook of Robotics' },
      { name: 'Demandeur',    required: true,  example: 'Anna Schmidt' },
      { name: 'Bibliothèque', required: true,  example: 'Sciences appliquées' },
      { name: 'Quantité',     required: true,  example: '1' },
      { name: 'ISBN / ISSN',  required: false, example: '978-3-030-00000-0' },
      { name: 'Priorité',     required: false, example: 'Régulier' },
    ]
  },
  {
    type:        "Suggestion d'achat",
    label:       "Suggestion d'achat",
    icon:        'bi bi-lightbulb',
    description: "Suggestions d'acquisition par les usagers.",
    columns: [
      { name: 'Titre',          required: true,  example: 'Machine Learning Pro' },
      { name: 'Demandeur',      required: true,  example: 'Prof. Lavoie' },
      { name: 'Bibliothèque',   required: true,  example: 'Informatique' },
      { name: 'Justification',  required: false, example: 'Utilisé en cours INFO-4200' },
      { name: 'Public cible',   required: false, example: 'Étudiants 2e cycle' },
      { name: 'Recommandation', required: false, example: 'Oui' },
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