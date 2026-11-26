/**
 * Demandes non soumises aux ACQ complétées en collaboration : tout le personnel peut ouvrir
 * et modifier la demande d'un collègue (sauf suggestion d'achat), depuis « Toutes les
 * demandes » de l'espace Dépôt. La demande reste celle de son auteur (Mes demandes, accusé
 * de réception), seule la dernière modification est attribuée à la personne connectée.
 */

/** Auteur d'une demande ouverte par quelqu'un d'autre. */
export interface AuteurDemande {
  nom:      string;
  courriel: string;
}

/** Formulaire réservé à son auteur (pas de modification par un collègue). */
export const TYPE_SUGGESTION_ACHAT = "Suggestion d'achat - Usager";

/** Auteur de la demande chargée s'il diffère de la personne connectée, sinon null. */
export function auteurSiAutre(row: { usager_nom?: string | null; usager_courriel?: string | null }): AuteurDemande | null {
  const courriel = (row?.usager_courriel || '').trim();
  const moi      = (sessionStorage.getItem('courrielAdmin') || '').trim();
  if (!courriel || courriel.toLowerCase() === moi.toLowerCase()) return null;
  return { nom: row.usager_nom || courriel, courriel };
}

/** Message précis renvoyé par le serveur (droits, modification simultanée), sinon ''. */
export function messageServeur(err: any): string {
  const msg = err?.error?.error;
  return (err?.status === 403 || err?.status === 409) && typeof msg === 'string' ? msg : '';
}
