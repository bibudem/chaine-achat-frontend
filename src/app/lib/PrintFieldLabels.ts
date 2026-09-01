// PrintFieldLabels.ts
//
// Étiquettes (français fixe, indépendant de la langue active) pour l'impression d'une
// demande — partagées entre StatutDecisionComponent (bordereau de décision) et
// ItemDetailComponent (fiche imprimée), pour que les deux impressions listent les mêmes
// champs avec les mêmes libellés et ne divergent pas au fil des ajouts de champs.
//
// N'inclut PAS les champs ACQ/TDM édités en direct dans un formulaire (suivi_acq, statut_acq,
// note_acq, creation_notice_dtdm, catalogue, note_dtdm, bordereau_imprime) : chaque composant
// les ajoute lui-même en rangées explicites, sourcées soit du formulaire live (statut-decision,
// pour refléter une saisie non encore enregistrée) soit directement de l'item (item-detail,
// lecture seule) — les inclure ici les ferait apparaître deux fois.
export const PRINT_FIELD_LABELS: Record<string, string> = {
  titre_document: 'Titre', sous_titre: 'Sous-titre', demandeur: 'Demandeur',
  bibliotheque: 'Bibliothèque', categorie_document: 'Catégorie', format_support: 'Type de traitement',
  priorite_demande: 'Priorité',
  auteur: 'Auteur(rice)', usager_statut: 'Statut usager', usager_faculte: 'Faculté / Département',
  usager_courriel: 'Courriel usager', date_requise_cours: 'Requis pour cours',
  editeur: 'Éditeur', isbn_issn: 'ISBN / ISSN', date_publication: 'Date de publication',
  fonds_budgetaire: 'Fonds budgétaire', fonds_sn_projet: 'Fonds SN — No projet',
  periode_couverte: 'Période couverte', source_information: "Source d'information",
  prix_cad: 'Prix (CAD)', devise_originale: 'Devise originale', prix_devise_originale: 'Prix (devise orig.)',
  localisation_emplacement: 'Localisation', nombre_titres_inclus: 'Titres inclus',
  nombre_utilisateurs: 'Nb utilisateurs', format_pret_numerique: 'Format prêt numérique',
  lien_plateforme: 'Lien plateforme', personne_a_aviser_nom: 'Personne à aviser',
  personne_a_aviser_courriel: 'Courriel (à aviser)', usager_aviser_reservation: 'Aviser — Réservation',
  usager_aviser_activation: 'Aviser — Activation',
  quantite: 'Quantité', projets_speciaux: 'Projet spécial', type_monographie: 'Type monographie',
  reserve_cours_sigle: 'Sigle du cours', reserve_cours_session: 'Session', reserve_cours_enseignant: 'Enseignant',
  precision_demande: 'Précision de la demande', numero_oclc: 'Numéro OCLC',
  date_debut_abonnement: 'Date début abonnement',
  gobi_vu_format_numerique: 'Vu sur GOBI numérique', gobi_version_moins_365_usd: 'Version < 365 USD',
  reference_tipasa: 'Référence Tipasa',
  reference_usager: 'Référence usager', besoin_specifique_format: 'Besoin spécifique (format)',
  permalien_sofia: 'Permalien SOFIA', exemplaire_detenu: 'Exemplaire détenu',
  fournisseur_contacte_sans_succes: 'Fournisseur contacté',
  verification_caeb: 'Vérification CAEB', verification_sqla: 'Vérification SQLA', verification_emma: 'Vérification EMMA',
  note_commentaire: 'Note / Commentaire', note_usager: 'Note usager',
  projet_special: 'Projet spécial', id_ressource: 'ID ressource', format_electronique: 'Format électronique',
  acq_responsable_courriel: 'Responsable ACQ (courriel)',
  acq_numerisation_recommandee: 'Numérisation recommandée (ACQ)', acq_date_demande_editeur: 'Date demande éditeur (ACQ)',
  acq_date_livraison_estimee: 'Date livraison estimée (ACQ)',
  bibliothecaire_disciplinaire: 'Bibliothécaire disciplinaire',
  aviser_reservation: 'Aviser à la réservation', aviser_reception: 'Aviser à la réception',
  usager_nom: "Nom de l'usager", acq_raison_annulation: "Raison d'annulation (ACQ)", acq_isbn: 'ISBN (ACQ)',
  techdoc_suggestion_transmise: 'Suggestion transmise (TechDoc)',
};

export const PRINT_FIELD_ORDER = Object.keys(PRINT_FIELD_LABELS);
