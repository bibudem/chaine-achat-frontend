// DemandeDetailFields.ts
//
// Détail générique d'une demande (toutes rangées label/valeur confondues) — source unique
// utilisée par le détail dépliable de "Mes demandes" (usager-profil), son impression/export,
// et le détail dépliable de "Tri des suggestions publiques" (tri-suggestions), pour que ces
// vues restent visuellement et fonctionnellement cohérentes : un même champ porte toujours le
// même libellé, au même endroit dans l'ordre, peu importe la page qui l'affiche.

export const FIELD_LABELS: Record<string, string> = {
  // usager_nom ≠ demandeur pour Suggestion d'achat : demandeur est la personne qui a
  // soumis le formulaire (TechDoc), usager_nom la personne concernée par la suggestion.
  usager_nom: "Nom de l'usager", demandeur: 'Nom',
  usager_statut: 'Statut', statut: 'Statut',
  usager_faculte: 'Faculté / Département',
  usager_courriel: 'Courriel', courriel: 'Courriel',
  bibliotheque: 'Bibliothèque',
  fonds_budgetaire: 'Fonds budgétaire',
  priorite_demande: 'Priorité',
  bibliothecaire_disciplinaire: 'Bibliothécaire disciplinaire',
  categorie_document: 'Catégorie de document',
  titre_document: 'Titre',
  sous_titre: 'Sous-titre',
  auteur: 'Auteur(s)',
  editeur: 'Éditeur',
  date_publication: 'Date de publication',
  isbn_issn: 'ISBN / ISSN',
  format_support: 'Format / Support',
  source_information: 'Source (URL)',
  prix_devise_originale: 'Prix (devise originale)',
  devise_originale: 'Devise',
  prix_cad: 'Prix (CAD)',
  gobi_vu_format_numerique: 'GOBI vu format numérique',
  reference_tipasa: 'Référence Tipasa',
  besoin_specifique_format: 'Besoin spécifique format',
  permalien_sofia: 'Permalien Sofia',
  fournisseur_contacte_sans_succes: 'Fournisseur contacté sans succès',
  exemplaire_detenu: 'Exemplaire papier détenu',
  exemplaire_electronique_detenu: 'Exemplaire électronique détenu',
  verification_caeb: 'Vérification CAEB',
  verification_sqla: 'Vérification SQLA',
  verification_emma: 'Vérification EMMA',
  format_pret_numerique: 'Format prêt numérique',
  fonds_sn_projet: 'Fonds S/N projet',
  localisation_emplacement: 'Localisation / Emplacement',
  nombre_titres_inclus: 'Nombre de titres inclus',
  personne_a_aviser_courriel: 'Personne à aviser (courriel)',
  creation_notice_dtdm: 'Création notice DTDM',
  reserve_cours: 'Réserve de cours',
  reserve_cours_sigle: 'Sigle du cours',
  reserve_cours_session: 'Session',
  reserve_cours_enseignant: 'Enseignant(e)',
  date_requise_cours: 'Date requise (cours)',
  aviser_reservation: 'Aviser à la réservation',
  aviser_reception: 'Aviser à la réception',
  note_usager: 'Note usager',
  note_commentaire: 'Note / Commentaire',
  note_acq: 'Note de la bibliothèque',
  statut_bibliotheque: 'Statut de la demande',
  bibliotheque_note_interne: 'Note interne bibliothèque',
};

export const FIELD_ORDER = [
  'usager_nom', 'demandeur', 'usager_statut', 'statut', 'usager_faculte', 'usager_courriel', 'courriel',
  'bibliotheque', 'fonds_budgetaire', 'priorite_demande', 'bibliothecaire_disciplinaire',
  'categorie_document', 'titre_document', 'sous_titre', 'auteur', 'editeur',
  'date_publication', 'isbn_issn', 'format_support', 'source_information',
  'prix_devise_originale', 'devise_originale', 'prix_cad',
  'gobi_vu_format_numerique', 'reference_tipasa',
  'besoin_specifique_format', 'permalien_sofia', 'fournisseur_contacte_sans_succes',
  'exemplaire_detenu', 'exemplaire_electronique_detenu', 'verification_caeb', 'verification_sqla', 'verification_emma',
  'format_pret_numerique', 'fonds_sn_projet',
  'localisation_emplacement', 'nombre_titres_inclus', 'personne_a_aviser_courriel',
  'creation_notice_dtdm',
  'reserve_cours', 'reserve_cours_sigle', 'reserve_cours_session', 'reserve_cours_enseignant',
  'date_requise_cours', 'aviser_reservation', 'aviser_reception',
  'note_usager', 'note_commentaire', 'note_acq',
  'statut_bibliotheque', 'bibliotheque_note_interne',
];

/** Champs remplacés par une rangée par fonds quand la demande est partagée entre plusieurs
 *  fonds budgétaires (voir fonds_repartition) — chacun avec sa propre devise/prix, au lieu
 *  de n'afficher que les valeurs du 1er fonds (celles stockées telles quelles dans ces
 *  champs, pour compatibilité avec les rapports/exports existants). */
export const CHAMPS_FONDS_PARTAGES = new Set([
  'fonds_budgetaire', 'devise_originale', 'prix_devise_originale', 'prix_cad',
]);

/** Construit les rangées label/valeur d'une demande à partir de sa réponse (baseData +
 *  specificData aplatis) — utilisé par le détail dépliable et l'impression, pour que les
 *  deux affichent exactement les mêmes informations. Si la demande est un partage de fonds
 *  (fonds_repartition ≥ 2 lignes), une rangée par fonds (devise/prix/pourcentage propres)
 *  remplace les 4 champs singuliers habituels (qui ne portent que les valeurs du 1er fonds). */
export function construireLignesDetail(flat: Record<string, any>): { label: string; value: string }[] {
  const repartition = Array.isArray(flat.fonds_repartition) ? flat.fonds_repartition : [];
  const partage = repartition.length > 1;

  const rangees: { label: string; value: string }[] = [];
  FIELD_ORDER.forEach(k => {
    if (partage && CHAMPS_FONDS_PARTAGES.has(k)) {
      if (k === 'prix_devise_originale') {
        repartition.forEach((l: any, i: number) => {
          const prix = l.prix_devise_originale != null ? Number(l.prix_devise_originale).toFixed(2) : '—';
          const cad  = l.prix_cad != null ? Number(l.prix_cad).toFixed(2) : '—';
          rangees.push({
            label: `Fonds budgétaire ${i + 1}`,
            value: `${l.fonds_budgetaire} — ${l.pourcentage} % — ${prix} ${l.devise_originale} → ${cad} $ CAD`,
          });
        });
      }
      return;
    }
    if (!FIELD_LABELS[k] || flat[k] === null || flat[k] === undefined || flat[k] === '' || flat[k] === false) return;
    rangees.push({
      label: FIELD_LABELS[k],
      value: typeof flat[k] === 'boolean' ? 'Oui' : String(flat[k]),
    });
  });
  return rangees;
}
