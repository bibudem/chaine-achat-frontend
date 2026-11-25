import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/** Ligne du journal des courriels (tbl_courriels). */
export interface Courriel {
  courriel_id:        number;
  type_envoi:         string;
  item_id:            number | null;
  reponse_id:         number | null;
  titre_document?:    string | null;
  destinataire:       string | null;
  role_destinataire:  string | null;
  contenu:            { suivi_acq?: string | null; note_acq?: string | null } | null;
  declenche_par:      string | null;
  declenche_par_nom:  string | null;
  /** transmis = remis à n8n, sans retour ; envoye / echec = statut renvoyé par n8n. */
  statut:             'transmis' | 'envoye' | 'echec';
  erreur:             string | null;
  date_creation:      string;
  date_maj:           string | null;
}

/** Libellés des types d'envoi (type_envoi = clé envoyée par le backend). */
export const TYPES_COURRIEL: { valeur: string; libelle: string }[] = [
  { valeur: 'statut-decision',        libelle: 'Suivi de la demande (décision ACQ)' },
  { valeur: 'demande-soumise-acq',    libelle: 'Demande soumise aux ACQ' },
  { valeur: 'nouvel-achat',           libelle: 'Nouvelle demande — Nouvel achat unique' },
  { valeur: 'nouvel-abonnement',      libelle: 'Nouvelle demande — Nouvel abonnement' },
  { valeur: 'modification-ccol',      libelle: 'Nouvelle demande — Modification et CCOL' },
  { valeur: 'peb-tipasa',             libelle: 'Nouvelle demande — PEB numérique' },
  { valeur: 'requete-acq',            libelle: 'Nouvelle demande — Accessibilité' },
  { valeur: 'suggestion',             libelle: "Nouvelle demande — Suggestion d'achat" },
  { valeur: 'suggestion-publique',    libelle: 'Suggestion publique reçue' },
  { valeur: 'suggestion-soumise-acq', libelle: 'Suggestion triée soumise aux ACQ' },
  { valeur: 'notice-tdm',             libelle: 'Création de notice requise (TDM)' },
  { valeur: 'tdm-complete',           libelle: 'Catalogage TDM complété' },
];

export function libelleTypeCourriel(type: string): string {
  return TYPES_COURRIEL.find(t => t.valeur === type)?.libelle ?? type;
}

export const STATUTS_COURRIEL: Record<Courriel['statut'], { libelle: string; icone: string }> = {
  transmis: { libelle: 'Transmis à n8n', icone: 'bi-hourglass-split' },
  envoye:   { libelle: 'Envoyé',         icone: 'bi-check-circle-fill' },
  echec:    { libelle: 'Échec',          icone: 'bi-x-circle-fill' },
};

@Injectable({ providedIn: 'root' })
export class CourrielsService {
  private readonly url = `${environment.apiUrl}/courriels`;

  constructor(private http: HttpClient) {}

  lister(f: { q?: string; type?: string; statut?: string; du?: string; au?: string; limit?: number; offset?: number } = {})
    : Observable<{ success: boolean; data: Courriel[]; total: number }> {
    let p = new HttpParams();
    Object.entries(f).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v)); });
    return this.http.get<{ success: boolean; data: Courriel[]; total: number }>(this.url, { params: p });
  }

  parItem(itemId: number): Observable<{ success: boolean; data: Courriel[] }> {
    return this.http.get<{ success: boolean; data: Courriel[] }>(`${this.url}/item/${itemId}`);
  }
}
