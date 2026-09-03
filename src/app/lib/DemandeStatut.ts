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
  statut_acq?: string | null;
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

// Valeurs pré-remplies par défaut sur le formulaire de décision ACQ (statut-decision) quand
// une demande vient d'être soumise et n'a encore reçu aucune vraie mise à jour — voir
// statut-decision.component.ts. Si la décision est enregistrée sans y toucher, la demande
// porte ces libellés en base sans que l'ACQ ait réellement statué dessus : elle ressort
// « traitee » selon demandeBadgeStatut ci-dessus (suivi_acq non vide) alors qu'il n'y a rien
// eu de réel — d'où ce cas particulier, affiché distinctement (en orange) sur les cartes.
export const ACQ_SUIVI_DEFAUT  = 'En attente de traitement';
export const ACQ_STATUT_DEFAUT = 'En attente';

/** Vrai si la demande est soumise aux ACQ mais que suivi_acq/statut_acq sont encore sur les
 *  valeurs par défaut du formulaire de décision — l'ACQ n'a pas réellement statué dessus. */
export function estAcqEnAttenteDefaut(d: DemandeStatutSource): boolean {
  return d.statut_bibliotheque === 'Soumettre aux ACQ'
      && d.suivi_acq === ACQ_SUIVI_DEFAUT
      && (d.statut_acq ?? '') === ACQ_STATUT_DEFAUT;
}
