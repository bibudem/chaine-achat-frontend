// DemandeStatut.ts
//
// Catégorisation partagée d'une demande usager selon sa progression — même logique que le
// badge affiché sur chaque carte dans "Mes demandes" (usager-profil), réutilisée telle
// quelle par le tableau de bord de la page d'accueil usager (usager-home) pour éviter de
// dupliquer la règle à deux endroits.
export type DemandeBadgeStatut = 'traitee' | 'soumise' | 'attente';

/** Sous-ensemble minimal requis pour catégoriser une demande — DemandeUsager et
 *  DemandePublique (reponses.service.ts) satisfont tous deux cette forme. */
export interface DemandeStatutSource {
  statut_bibliotheque: string | null;
  suivi_acq: string | null;
}

/**
 * - 'traitee' : soumise aux ACQ et déjà traitée (suivi_acq renseigné).
 * - 'soumise' : soumise aux ACQ, en attente de leur décision.
 * - 'attente' : encore en traitement côté bibliothèque, pas encore envoyée aux ACQ.
 */
export function demandeBadgeStatut(d: DemandeStatutSource): DemandeBadgeStatut {
  if (d.statut_bibliotheque !== 'Soumettre aux ACQ') return 'attente';
  return d.suivi_acq ? 'traitee' : 'soumise';
}
