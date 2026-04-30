// liste-choix-options.ts
export class ListeChoixOptions {

  // Options pour le statut (bibliothèque)
statusOptions = [
  'Saisie en cours - En attente',
  'Saisie en cours – À valider ou compléter',
  'Saisie en cours – Annuler',
  'Saisie en cours - Publication à paraître',
  'À autoriser en bibliothèque',
  'Soumettre aux ACQ'
];


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

  // Options pour les bibliothèques
  bibliothequeOptions = [
    'Aménagement',
    'Campus Laval',
    'Direction générale',
    'Droit',
    'Du Parc',
    'Hubert-Reeves',
    'Kinésiologie',
    'L.S.H.',
    'Livres rares',
    'Mathématiques-Informatique',
    'Médecine vétérinaire',
    'Musique',
    'Marguerite-d\'Youville',
    'Prêt entre bibliothèques',
    'Santé',
    'Service du catalogage',
    'Service Accessibilité',
    'TGD',
  ];

  // Options pour la précision de demande
  precisionDemandeOptions = [
    'Achat de complément de collection (CCOL) pour abonnement (courant ou ancien)',
    'Achat de numéro de périodique hors abonnement',
    'Achat d\'archives de périodiques (web)',
    'Achat en vue d\'un NABO',
    'Annulation d\'abonnement',
    'Cesse de paraître',
    'Changement de support vers l\'électronique',
    'Changement de titre',
    'Création de notice pour abonnement courant',
    'Modification du nombre d\'utilisateurs',
    'Complément de collection'
  ];

  // Options pour la catégorie de document
  categorieDocumentOptions = [
    'Monographie',
    'Périodique',
    'Base de données',
    'Archives de périodiques',
    'Archives de monographies'
  ];

  // Options pour le type de monographie
  typeMonographieOptions = [
    'Livre',
    'CD-Rom/DVD-Rom',
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
    { value: 'Springer',                    label: 'Springer' },
    { value: 'PEB Tipasa numérique',        label: 'PEB Tipasa numérique' },
    { value: "Suggestion d'achat - Usager", label: "Suggestion d'achat - Usager" },
    { value: 'Requête ACQ Accessibilité',   label: 'Requête Accessibilité' },
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