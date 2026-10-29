import { Component } from '@angular/core';
import { AuthService, UserRole } from '../../services/auth.service';

interface FaqItem {
  question: string;
  answer: string;
  answerHtml?: string;
  open: boolean;
  /** Profils qui voient la question. */
  roles: UserRole[];
}

/* Groupes de profils — le SuperAdmin hérite de tout ce que voit l'Admin. */
const ADMINS: UserRole[]        = ['Admin', 'SuperAdmin'];
/** Personnes qui remplissent les 6 formulaires et suivent « Mes demandes ». */
const DEMANDEURS: UserRole[]    = ['Employe', 'TechDoc'];

const UL = 'style="margin:.4rem 0 .2rem 1.1rem;padding:0"';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {

  constructor(public auth: AuthService) {}

  isOpen = false;

  items: FaqItem[] = [

    /* ━━ ADMIN / SUPERADMIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    {
      question: 'Comment traiter une nouvelle demande soumise par une bibliothèque ?',
      answerHtml: `Rendez-vous dans <strong>Registres → Demandes par forms</strong> pour voir les soumissions. Cliquez sur une ligne pour ouvrir la demande, puis lancez sa décision : vous arrivez sur la page de <strong>décision ACQ</strong>.
        <br><br>Deux champs distincts permettent de suivre la demande :
        <ul ${UL}>
          <li><strong>Statut de la demande</strong> : En attente, En traitement, Complétée, Demande annulée ou Budget atteint</li>
          <li><strong>Suivi de la demande</strong> (obligatoire) : précise concrètement où en est la demande (commande créée, ressource activée, envoi en bibliothèque, etc.)</li>
        </ul>
        Ajoutez une note dans <strong>Acquisitions : Note / Commentaire</strong> au besoin, puis enregistrez.`,
      answer: '', open: false, roles: ADMINS
    },
    {
      question: 'Comment fonctionne l\'envoi d\'un courriel après une décision ACQ ?',
      answerHtml: `Rien n'est envoyé automatiquement. Une fois le <strong>Statut</strong> et le <strong>Suivi</strong> de la demande à jour, deux boutons sont proposés :
        <ul ${UL}>
          <li><strong>Enregistrer</strong> : sauvegarde seulement, aucun courriel</li>
          <li><strong>Enregistrer et envoyer courriel</strong> : sauvegarde et vous laisse choisir qui prévenir (le demandeur, ou la personne à aviser pour la réservation ou l'activation, selon ce qui a été rempli dans le formulaire)</li>
        </ul>
        Le courriel reprend le <strong>suivi de la demande</strong> et votre note ; il n'y a pas de notion d'« approuvé » ou de « refusé ».`,
      answer: '', open: false, roles: ADMINS
    },
    {
      question: 'Comment transmettre une demande à l\'équipe TDM pour la création d\'une notice ?',
      answerHtml: `Sur la page de décision ACQ, activez <strong>Création de notice TDM (Acquisitions)</strong> (activé par défaut pour les formats imprimés).
        <br><br>À l'enregistrement, la demande apparaît dans la file <strong>Mes items à traiter</strong> de l'équipe TDM, et la boîte commune TDM reçoit un courriel. Ce courriel n'est envoyé qu'une fois, au moment où la demande passe à cet état.`,
      answer: '', open: false, roles: ADMINS
    },
    {
      question: 'Comment filtrer et retrouver efficacement une demande ?',
      answerHtml: `La page <strong>Rechercher</strong> propose plusieurs filtres combinables : type de formulaire, bibliothèque, priorité, fonds, <strong>Statut ACQ</strong> et <strong>Suivi ACQ</strong>. La recherche texte couvre le titre, l'ISBN, l'éditeur et le demandeur ; tapez par exemple <strong>#12</strong> pour retrouver directement l'item numéro 12.
        <br><br>Vous pouvez enregistrer vos combinaisons de filtres dans <strong>Favoris</strong> pour les réappliquer en un clic. Le bouton à droite affiche le nombre de filtres actifs et permet de tout réinitialiser d'un coup. Vos filtres restent en mémoire même si vous ouvrez une fiche puis revenez à la liste.`,
      answer: '', open: false, roles: ADMINS
    },
    {
      question: 'Comment utiliser l\'import en lot ?',
      answerHtml: `Accédez à <strong>Import</strong> dans le menu, puis :
        <ul ${UL}>
          <li>Sélectionnez le <strong>type de formulaire</strong> correspondant aux données à importer</li>
          <li>Téléchargez le <strong>fichier modèle Excel</strong> : il indique les colonnes requises et optionnelles, avec des exemples</li>
          <li>Remplissez le fichier en respectant le format des colonnes obligatoires</li>
          <li>Déposez-le dans la zone d'import</li>
        </ul>
        L'application valide chaque ligne et affiche un <strong>rapport détaillé</strong> : nombre d'insertions réussies et erreurs, avec leur numéro de ligne. L'historique des imports reste consultable dans <strong>Registres → Liste des imports</strong>.`,
      answer: '', open: false, roles: ADMINS
    },
    {
      question: 'Comment lire le tableau de bord des acquisitions ?',
      answerHtml: `Le tableau de bord affiche :
        <ul ${UL}>
          <li><strong>4 compteurs cliquables</strong> : total des demandes, en attente, traitées et urgentes ; chacun ouvre la liste filtrée correspondante</li>
          <li><strong>Catalogue des types</strong> : un accès rapide pour créer une nouvelle demande de chaque type</li>
          <li><strong>Répartitions</strong> par type de formulaire, par bibliothèque et par statut/suivi ACQ, cliquables elles aussi</li>
          <li><strong>Top 5 des demandeurs</strong> les plus actifs</li>
        </ul>`,
      answer: '', open: false, roles: ADMINS
    },
    {
      question: 'Où gérer les fonds budgétaires, les bibliothèques et les taux de change ?',
      answerHtml: `Dans le menu <strong>Configuration</strong> :
        <ul ${UL}>
          <li><strong>Fonds budgétaires</strong> et <strong>Bibliothèques</strong> : les listes proposées dans les formulaires</li>
          <li><strong>Taux de change</strong> : les taux de conversion en CAD, par période. Ils servent au calcul automatique du <strong>Prix en CAD</strong> dans les formulaires.</li>
        </ul>`,
      answer: '', open: false, roles: ADMINS
    },
    {
      question: 'Puis-je superviser le tri des suggestions publiques ?',
      answerHtml: `Oui. La page <strong>Tri des suggestions</strong> du portail (<a href="/usager/tri">/usager/tri</a>) vous est accessible, comme à l'équipe TechDoc. Vous y voyez les suggestions de la communauté UdeM en attente de tri ainsi que l'historique des décisions, et pouvez trier vous-même une suggestion au besoin.
        <br><br>Une suggestion n'apparaît dans vos demandes qu'une fois acceptée par TechDoc, complétée puis <strong>soumise aux ACQ</strong>.`,
      answer: '', open: false, roles: ADMINS
    },

    /* ━━ SUPERADMIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    {
      question: 'Comment donner un accès ou changer le rôle d\'une personne ?',
      answerHtml: `Dans <strong>Configuration → Utilisateurs</strong>, cliquez sur <strong>Nouvel usager</strong>, saisissez son <strong>courriel UdeM</strong> et choisissez son rôle :
        <ul ${UL}>
          <li><strong>Employé</strong> : personnel des bibliothèques (formulaires, Mes demandes)</li>
          <li><strong>TechDoc</strong> : tri des suggestions publiques, en plus des formulaires</li>
          <li><strong>TDM</strong> : création de notices pour les items qui lui sont transmis</li>
          <li><strong>Admin</strong> : Service des acquisitions (traitement, import, configuration)</li>
          <li><strong>SuperAdmin</strong> : Admin, plus la gestion des utilisateurs</li>
        </ul>
        Le rôle s'applique dès la prochaine connexion. Une personne absente de la liste reçoit un rôle par défaut à sa première connexion (Employé si elle fait partie du personnel des bibliothèques, Usager sinon). <strong>Retirer l'accès</strong> supprime la personne de la liste.`,
      answer: '', open: false, roles: ['SuperAdmin']
    },

    /* ━━ TDM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    {
      question: 'Comment une demande arrive-t-elle dans ma file TDM ?',
      answerHtml: `Lorsque le Service des acquisitions traite une demande et active <strong>Création de notice TDM</strong>, elle est transmise à l'équipe TDM :
        <ul ${UL}>
          <li>elle apparaît dans <strong>Mes items à traiter</strong>, accessible depuis l'accueil du portail</li>
          <li>la boîte commune TDM reçoit un courriel avec le lien vers la demande</li>
        </ul>
        Le compteur <strong>Total à trier — équipe TDM</strong> de l'accueil indique le nombre d'items en attente.`,
      answer: '', open: false, roles: ['TDM']
    },
    {
      question: 'Comment retrouver les items à traiter en priorité ?',
      answerHtml: `Dans <strong>Mes items à traiter</strong>, la recherche couvre le titre, l'ISBN et le demandeur. Le filtre de statut propose :
        <ul ${UL}>
          <li><strong>En attente de traitement</strong></li>
          <li><strong>Urgentes, en attente</strong> : les demandes à priorité urgente</li>
          <li><strong>Tous mes items</strong> : y compris ceux déjà traités</li>
        </ul>
        Chaque ligne affiche la bibliothèque, la priorité, le statut et la date de réception.`,
      answer: '', open: false, roles: ['TDM']
    },
    {
      question: 'Comment traiter un item (choix de notice) ?',
      answerHtml: `Cliquez sur <strong>Traiter</strong> à côté de l'item. La fiche présente les informations de la demande (éditeur, ISBN, format, note de la bibliothèque…) en lecture seule, puis l'onglet <strong>TDM – Choix de notice</strong>, le seul modifiable :
        <ul ${UL}>
          <li><strong>TDM : OCN</strong></li>
          <li><strong>TDM : Note interne</strong></li>
          <li><strong>Suivi Catalogage</strong> : choisissez <strong>Complété</strong> une fois le travail terminé</li>
        </ul>
        Cliquez sur <strong>Enregistrer</strong>.`,
      answer: '', open: false, roles: ['TDM']
    },
    {
      question: 'Puis-je modifier le statut ACQ ou prévenir le demandeur ?',
      answerHtml: `Non. Les champs du Service des acquisitions (statut, suivi, note ACQ) sont affichés en lecture seule, et l'envoi du courriel au demandeur reste réservé aux ACQ.
        <br><br>Pour signaler un problème sur une demande (informations manquantes, document introuvable…), utilisez <strong>TDM : Note interne</strong> ou communiquez directement avec le Service des acquisitions.`,
      answer: '', open: false, roles: ['TDM']
    },

    /* ━━ TECHDOC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    {
      question: 'Comment trier une suggestion de la communauté UdeM ?',
      answerHtml: `Depuis l'accueil, ouvrez <strong>Tri des suggestions</strong>. Les suggestions marquées <strong>À trier</strong> attendent une décision ; cliquez sur <strong>Décider</strong> pour voir tous les champs soumis, puis répondez à <strong>Accepter cette suggestion ?</strong> :
        <ul ${UL}>
          <li><strong>Oui</strong> : le commentaire au demandeur est facultatif</li>
          <li><strong>Non</strong> : un commentaire est <strong>obligatoire</strong> ; il explique la raison du refus au demandeur</li>
        </ul>
        Dans les deux cas, le demandeur reçoit un courriel avec la décision et votre commentaire. Une décision ne peut être prise qu'une fois : si une collègue ou un collègue a déjà trié la suggestion, un message vous l'indique.`,
      answer: '', open: false, roles: ['TechDoc']
    },
    {
      question: 'Que se passe-t-il après avoir accepté une suggestion ?',
      answerHtml: `<strong>Accepter et compléter</strong> ouvre la suggestion dans le formulaire de <strong>suggestion d'achat</strong>, déjà rempli avec les informations du demandeur. Complétez les champs manquants (fonds, prix, format…), puis choisissez <strong>Soumettre aux ACQ</strong>.
        <br><br>Tant qu'elle n'est pas soumise, la suggestion reste marquée <strong>À compléter</strong> dans la file de tri : le bouton <strong>Compléter</strong> permet d'y revenir. Une fois soumise, le Service des acquisitions reçoit un courriel et la traite comme les autres demandes.`,
      answer: '', open: false, roles: ['TechDoc']
    },
    {
      question: 'Comment suivre les suggestions déjà triées ?',
      answerHtml: `La file de tri conserve l'historique de toute l'équipe : date du tri, document, décision, commentaire et personne qui a trié. Le filtre de statut permet par exemple de n'afficher que les suggestions <strong>Soumises aux ACQ</strong>.
        <br><br>En cliquant sur <strong>Détails</strong>, vous voyez aussi le <strong>Statut</strong> et le <strong>Suivi</strong> laissés par les ACQ une fois la demande traitée.`,
      answer: '', open: false, roles: ['TechDoc']
    },
    {
      question: 'Comment suis-je avisé·e d\'une nouvelle suggestion ?',
      answerHtml: `Chaque nouvelle suggestion envoyée par la communauté UdeM déclenche un courriel à l'équipe TechDoc, avec le lien vers la file de tri. Le compteur <strong>Tri des suggestions</strong> de l'accueil indique aussi le nombre de suggestions en attente.
        <br><br>Les suggestions publiques ne sont pas visibles par les ACQ avant d'avoir été acceptées et soumises par votre équipe.`,
      answer: '', open: false, roles: ['TechDoc']
    },

    /* ━━ DEMANDEURS (Employé, TechDoc) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    {
      question: 'Quels sont les 6 types de formulaire et lesquels utiliser ?',
      answerHtml: `Le portail propose 6 types de demandes :
        <ul style="margin:.5rem 0 .3rem 1.1rem;padding:0;line-height:1.9">
          <li><strong>Nouvel achat unique</strong> : l'acquisition ponctuelle d'un document, imprimé ou électronique</li>
          <li><strong>Nouvel abonnement</strong> : une ressource périodique ou une base de données</li>
          <li><strong>Modification et CCOL</strong> : une correction de notice dans le catalogue collectif</li>
          <li><strong>PEB numérique</strong> : un prêt entre bibliothèques via la plateforme Tipasa</li>
          <li><strong>Accessibilité</strong> : une ressource en format accessible</li>
          <li><strong>Suggestion d'achat</strong> : une suggestion transmise par un usager</li>
        </ul>
        En cas de doute sur le bon type, indiquez votre question dans le champ <strong>Bibliothèque : Note / Commentaire / Question</strong> et l'équipe des Acquisitions vous orientera.`,
      answer: '', open: false, roles: DEMANDEURS
    },
    {
      question: 'Que se passe-t-il après l\'envoi d\'un formulaire, et comment suivre ma demande ?',
      answerHtml: `Votre demande est enregistrée et visible dans <strong>Mes demandes</strong> avec le badge <strong>Non envoyé aux ACQ</strong> tant qu'elle n'a pas été transmise. Choisissez le statut <strong>Soumettre aux ACQ</strong> pour l'envoyer à l'équipe : le badge passe alors à <strong>ACQ en attente</strong>, et vous recevez un accusé de réception par courriel.
        <br><br>Une fois traitée, le badge devient <strong>ACQ traité</strong> et la carte affiche le <strong>Statut</strong> et le <strong>Suivi</strong> laissés par l'équipe des Acquisitions, qui peut aussi vous écrire pour vous informer de la suite.`,
      answer: '', open: false, roles: DEMANDEURS
    },
    {
      question: 'Comment filtrer ou exporter mes demandes ?',
      answerHtml: `Dans <strong>Mes demandes</strong>, plusieurs filtres sont disponibles : recherche par titre, type de formulaire, bibliothèque, statut et plage de dates. Un compteur affiche le nombre de résultats, et <strong>Réinitialiser</strong> efface tous les filtres d'un coup.
        <br><br><strong>Exporter</strong> télécharge la liste filtrée en Excel, avec tous les détails de chaque demande.`,
      answer: '', open: false, roles: DEMANDEURS
    },
    {
      question: 'Comment remplir les champs prix, devise et fonds budgétaire ?',
      answerHtml: `Le formulaire comporte trois champs liés au prix :
        <ul ${UL}>
          <li><strong>Devise originale</strong> : une liste déroulante ; choisissez <strong>Autre</strong> si la devise recherchée n'y figure pas</li>
          <li><strong>Prix en devise originale</strong> : le prix tel qu'affiché sur la source</li>
          <li><strong>Prix en CAD</strong> : calculé automatiquement dès que la devise choisie peut être convertie</li>
        </ul>
        Le <strong>Fonds budgétaire</strong> fonctionne de la même façon : une liste avec recherche, et une option <strong>Autre</strong> si le bon fonds n'y figure pas.
        <br><br>Si l'achat doit être réparti entre plusieurs fonds, utilisez le bouton <strong>+</strong> à côté du champ : chaque ligne ajoutée a sa propre devise, son prix et son pourcentage, avec un total affiché pour vérifier que la répartition atteint bien 100 %.`,
      answer: '', open: false, roles: DEMANDEURS
    },
    {
      question: 'Où consulter les taux de change utilisés pour la conversion ?',
      answerHtml: `Sur l'accueil du portail, l'encadré <strong>Taux sécurisé USD</strong>, en haut à droite, affiche le taux du dollar américain pour la période en vigueur (lecture seule). Cliquez dessus pour voir le détail de toutes les devises.
        <br><br>Ce sont ces taux qui servent au calcul automatique du <strong>Prix en CAD</strong> dans les formulaires.`,
      answer: '', open: false, roles: DEMANDEURS
    },
    {
      question: 'Comment joindre un fichier à ma demande ?',
      answerHtml: `Dans la section <strong>Pièces jointes</strong> du formulaire, vous pouvez joindre jusqu'à <strong>3 fichiers</strong> (10 Mo chacun) : PDF, Word, Excel, courriel (.msg/.eml) ou image (.jpg/.png).
        <br><br>Elles restent consultables et téléchargeables depuis <strong>Mes demandes</strong> une fois la demande enregistrée.`,
      answer: '', open: false, roles: DEMANDEURS
    },
  ];

  /** Questions propres au profil connecté. Le rôle Usager (communauté UdeM) n'a accès qu'au
   *  formulaire public intégré (/suggestion-public), où la FAQ n'est pas affichée. */
  get visibleItems(): FaqItem[] {
    const role = this.auth.role;
    return role ? this.items.filter(item => item.roles.includes(role)) : [];
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.items.forEach(i => i.open = false);
    }
  }

  toggleItem(item: FaqItem): void {
    const wasOpen = item.open;
    this.items.forEach(i => i.open = false);
    item.open = !wasOpen;
  }

  close(): void {
    this.isOpen = false;
    this.items.forEach(i => i.open = false);
  }
}
