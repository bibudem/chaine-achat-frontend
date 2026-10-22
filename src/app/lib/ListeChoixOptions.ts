// liste-choix-options.ts

// Libellés d'affichage courts pour le type de formulaire — la valeur stockée en BD
// (formulaire_type, utilisée pour toutes les comparaisons/filtres) ne change pas, seul ce
// qui est montré à l'écran est raccourci, pour rester cohérent avec les titres de
// UsagerHomeComponent.formulaires (accueil usager).
export const FORMULAIRE_TYPE_LABELS: Record<string, string> = {
  'PEB Tipasa numérique':      'PEB numérique',
  'Requête ACQ Accessibilité': 'Accessibilité',
};

// Statut de la demande côté bibliothèque (menu « Statut de la demande » des formulaires).
// `valeur` = texte stocké en BD et comparé tel quel par le backend (ex. 'Saisie en cours -
// En attente') : ne pas le modifier. `libelle` = affichage, séparateur uniformisé en
// demi-cadratin (« – »).
export const STATUTS_BIBLIOTHEQUE_VALEURS: readonly string[] = [
  'Saisie en cours - En attente',
  'Saisie en cours – À valider ou compléter',
  'Saisie en cours – Annuler',
  'Saisie en cours - Publication à paraître',
  'À autoriser en bibliothèque',
  'Soumettre aux ACQ',
];

export const STATUTS_BIBLIOTHEQUE: readonly { valeur: string; libelle: string }[] =
  STATUTS_BIBLIOTHEQUE_VALEURS.map(valeur => ({ valeur, libelle: valeur.replace(/ - /g, ' – ') }));

// Statut par défaut d'une suggestion envoyée par la communauté UdeM (/suggestion-public) —
// même valeur imposée par le backend (ReponsesController.createSuggestionPublique). Propre à
// la suggestion d'achat : proposé seulement dans le formulaire de suggestion (complétion par
// l'équipe TechDoc) et dans la fiche d'item admin, pas dans les 5 autres formulaires.
export const STATUT_SUGGESTION_RECUE = 'Suggestion d’achat reçue';

export const STATUTS_BIBLIOTHEQUE_SUGGESTION: readonly { valeur: string; libelle: string }[] = [
  { valeur: STATUT_SUGGESTION_RECUE, libelle: STATUT_SUGGESTION_RECUE },
  ...STATUTS_BIBLIOTHEQUE,
];

export function formulaireTypeLabel(value: string | undefined | null): string {
  if (!value) return '';
  return FORMULAIRE_TYPE_LABELS[value] || value;
}

// Icônes (Bootstrap Icons, sans le préfixe "bi ") par type de formulaire — mêmes icônes que
// UsagerHomeComponent.formulaires (accueil usager), source de vérité. Uniformise l'icône de
// chaque type sur toutes les interfaces admin (avant : 3 mappages divergents).
export const FORMULAIRE_TYPE_ICONS: Record<string, string> = {
  'Nouvel achat unique':        'bi-cart-plus',
  'Nouvel abonnement':          'bi-newspaper',
  'Modification et CCOL':       'bi-pencil-square',
  'PEB Tipasa numérique':       'bi-share',
  'Requête ACQ Accessibilité':  'bi-universal-access',
  "Suggestion d'achat - Usager": 'bi-lightbulb',
};

export function formulaireTypeIcon(value: string | undefined | null): string {
  if (!value) return 'bi-lightbulb';
  return FORMULAIRE_TYPE_ICONS[value] || 'bi-lightbulb';
}

export class ListeChoixOptions {

  // Options pour la devise originale — toutes les devises disponibles dans WMS (voir
  // "Uniformisation champ Informations financières"), plus Autre (saisie libre du nom).
  devisesOptions: { label: string; code: string }[] = [
    { label: 'CAD — Dollar canadien',       code: 'CAD' },
    { label: 'USD — Dollar américain',      code: 'USD' },
    { label: 'EUR — Euro',                  code: 'EUR' },
    { label: 'GBP — Livre sterling',        code: 'GBP' },
    { label: 'CHF — Franc suisse',          code: 'CHF' },
    { label: 'AUD — Dollar australien',     code: 'AUD' },
    { label: 'JPY — Yen japonais',          code: 'JPY' },
    { label: 'NZD — Dollar néo-zélandais',  code: 'NZD' },
    { label: 'Autre',                       code: 'Autre' }
  ];

  // Options pour le statut (bibliothèque) — fiche d'item admin, tous types confondus : inclut
  // le statut des suggestions publiques pour qu'un item qui le porte s'affiche correctement.
  statusOptions = [STATUT_SUGGESTION_RECUE, ...STATUTS_BIBLIOTHEQUE_VALEURS];


  // Options pour la priorité
  prioriteOptions = [
    { value: 'Urgent', label: 'Urgent' },
    { value: 'Prioritaire', label: 'Prioritaire' },
    { value: 'Régulier', label: 'Régulier' }
  ];

  // Options pour les projets spéciaux
  projetsSpeciauxOptions = [
    'Premiers peuples',
    'Collection bien-être',
    'Mini-école de santé',
    'Soutien à l\'Ukraine',
    'Transition vers le numérique',
    'Ne s\'applique pas'
  ];

  // Options pour la précision de demande
  precisionDemandeOptions = [
    'Achat de complément de collection (CCOL) pour abonnement (courant ou ancien)',
    'Achat de numéro de périodique hors abonnement',
    'Achat d\'archives de périodiques (web)',
    'Achat en vue d\'un NABO',
    'Annulation d\'abonnement',
    'Cesse de paraître',
    'Changement de support',
    'Changement de titre',
    'Création de notice pour abonnement courant',
    'Modification du nombre d\'utilisateurs',
  ];

  // Options pour la catégorie de document
  categorieDocumentOptions = [
    'Monographie',
    'Périodique',
    'Base de données',
    'Archives de périodiques',
    'Archives de monographies'
  ];

  // Sous-types pour le groupe Monographie
  readonly sousTypesMonographie: string[] = [
    'Livre',
    'Enregistrement sonore',
    'Film',
    'Matériel didactique',
    'Partition de musique',
    'Zine',
    'Carte et données géospatiales',
    'Autres (microfilm, etc.)',
    'Ne s\'applique pas'
  ];

  // Options pour la catégorie d'usager
  usagerCategorieOptions = [
    'Étudiant-e 3e cycle',
    'Professeur-e',
    'Chargé-e de cours',
    'Professeur-e retraité'
  ];

  // Options pour le statut DIRCOL ACQ
  dircolAcqStatutOptions = [
    'En attente',
    'En traitement',
    'Complétée',
    'Demande Annulée',
    'Budget atteint',
    'En cours'
  ];

  // Options pour le suivi DIRCOL ACQ
  dircolAcqSuiviOptions = [
    'En attente de traitement',
    'Commande créée',
    'Abonnement modifié / annulé',
    'Ressource électronique activée',
    'Demande annulée (non traitée)',
    'Demande reportée (budget atteint)',
    'Envoi en bibliothèque sans catalogage',
    'MONOS : saisie en cours',
  ];

  // Options pour le statut accessibilité
  accessibiliteStatutOptions = [
    'Saisie en cours à Accessibilité',
    'Soumis aux ACQ : Formulaire complété et prêt à être transmis aux Acquisitions.'
  ];

  // Options pour la notice DTDM
  noticeDTDMOptions = [
    'Non',
    'Oui'
  ];

  // Options pour le type de formulaire (value = valeur DB, label = affichage UI)
  formulaireTypeOptions = [
    { value: 'Nouvel achat unique',         label: 'Nouvel achat unique' },
    { value: 'Modification et CCOL',        label: 'Modification et CCOL' },
    { value: 'Nouvel abonnement',           label: 'Nouvel abonnement' },
    { value: 'PEB Tipasa numérique',        label: FORMULAIRE_TYPE_LABELS['PEB Tipasa numérique'] },
    { value: "Suggestion d'achat - Usager", label: "Suggestion d'achat - Usager" },
    { value: 'Requête ACQ Accessibilité',   label: FORMULAIRE_TYPE_LABELS['Requête ACQ Accessibilité'] },
  ];

  listProgramme = [
    { id: 1, name: "EBA - Achat sectoriel (Add On)" },
    { id: 2, name: "BCI" },
    { id: 3, name: "EBA" },
    { id: 4, name: "Donnée non disponible" }
  ];

  listBibliotheques = [
    { id: 1, name: "Aménagement" },
    { id: 2, name: "BLSH" },
    { id: 3, name: "BSLH" },
    { id: 4, name: "Kinésiologie" },
    { id: 5, name: "Médecine vétérinaire" },
    { id: 6, name: "Santé" },
    { id: 7, name: "Sciences" },
    { id: 7, name: "Non applicable" }
  ];

  listSecteurs = [
    { id: 1, name: "LSH" },
    { id: 2, name: "Sciences & Santé" },
    { id: 3, name: "TGDAMLD" },
    { id: 4, name: "Donnée non disponible" }
  ];


  listeAcces = [
    {id: 1, name: 'Oui'},
    {id: 2, name: 'Non'},
    {id: 3, name: 'Hybride'},
  ];

  essentiel = [
    {id: 1, name: 'Oui'},
    {id: 2, name: 'Non'}
  ];

  listeFonds = [
    {id: 1, name: 'MO 002'},
    {id: 2, name: 'MO 012'},
    {id: 3, name: 'MO 030'},
    {id: 4, name: 'MO 032'},
    {id: 5, name: 'MO 051'},
    {id: 6, name: 'MO 071'},
    {id: 7, name: 'MO 032'},
    {id: 8, name: 'MO 033'},
    {id: 9, name: 'MO 035'},
    {id: 10, name: 'Non disponible'}
  ];

  listeLangue = [
    {id: 1, name: 'Français'},
    {id: 2, name: 'Anglais'},
    {id: 3, name: 'Espagnol'},
    {id: 4, name: 'Autres'}
  ];

  listeNbrUsager = [
    {id: 1, name: '1'},
    {id: 2, name: '2'},
    {id: 3, name: '3'},
    {id: 4, name: '4'},
    {id: 5, name: '5'},
    {id: 6, name: 'illimités'}
  ];

  listFormat = [
    { id: 1, name: "Électronique" },
    { id: 2, name: "Papier" },
    { id: 3, name: "Élect. + Papier" }
  ];
}