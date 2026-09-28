import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

interface FaqItem {
  question: string;
  answer: string;
  answerHtml?: string;
  open: boolean;
  adminOnly?: boolean;
  usagerOnly?: boolean;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {

  constructor(public auth: AuthService) {}

  isOpen = false;

  items: FaqItem[] = [

    /* ── 5 questions ADMIN / TDM ── */
    {
      question: 'Comment traiter une nouvelle demande soumise par un bibliothécaire ?',
      answerHtml: `Rendez-vous dans <strong>Registres → Demandes par forms</strong> pour voir les soumissions. Cliquez sur une ligne pour ouvrir la demande, puis lancez sa décision — vous arrivez sur la page de <strong>décision ACQ</strong>.
        <br><br>Deux champs distincts permettent de suivre la demande :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li><strong>Statut de la demande</strong> — En attente, En traitement, Complétée, Demande annulée, Budget atteint ou En cours</li>
          <li><strong>Suivi de la demande</strong> (obligatoire) — précise concrètement où ça en est : commande créée, ressource activée, envoi en bibliothèque, etc.</li>
        </ul>
        Ajoutez une note dans <strong>Acquisitions : Note / Commentaire</strong> au besoin, puis enregistrez.`,
      answer: '', open: false, adminOnly: true
    },
    {
      question: 'Comment utiliser l\'import en lot ?',
      answerHtml: `Accédez à <strong>Import</strong> dans le menu, puis :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li>Sélectionnez le <strong>type de formulaire</strong> correspondant aux données à importer</li>
          <li>Téléchargez le <strong>fichier modèle Excel</strong> — il indique les colonnes requises/optionnelles avec des exemples</li>
          <li>Remplissez le fichier en respectant le format des colonnes obligatoires</li>
          <li>Déposez-le dans la zone d'import</li>
        </ul>
        L'application valide chaque ligne et affiche un <strong>rapport détaillé</strong> : nombre d'insertions réussies et erreurs, avec leur numéro de ligne. L'historique de vos imports reste consultable dans <strong>Registres → Liste des imports</strong>.`,
      answer: '', open: false, adminOnly: true
    },
    {
      question: 'Comment filtrer et retrouver efficacement une demande ?',
      answerHtml: `La page <strong>Rechercher</strong> propose plusieurs filtres combinables : type de formulaire, bibliothèque, priorité, fonds, <strong>Statut ACQ</strong> et <strong>Suivi ACQ</strong>. La recherche texte couvre le titre, l'ISBN, l'éditeur et le demandeur — tapez par exemple <strong>#12</strong> pour retrouver directement l'item numéro 12.
        <br><br>Vous pouvez enregistrer vos combinaisons de filtres dans <strong>Favoris</strong> pour les réappliquer en un clic. Le bouton à droite affiche le nombre de filtres actifs et permet de tout réinitialiser d'un coup. Vos filtres restent en mémoire même si vous ouvrez une fiche puis revenez à la liste.`,
      answer: '', open: false, adminOnly: true
    },
    {
      question: 'Comment fonctionne l\'envoi d\'un courriel après une décision ACQ ?',
      answerHtml: `Rien n'est envoyé automatiquement. Une fois le <strong>Statut</strong> et le <strong>Suivi</strong> de la demande à jour, deux boutons sont proposés :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li><strong>Enregistrer</strong> — sauvegarde seulement, aucun courriel</li>
          <li><strong>Enregistrer et envoyer courriel</strong> — sauvegarde et vous laisse choisir qui prévenir (le demandeur, ou la personne à aviser pour la réservation/l'activation, selon ce qui a été rempli dans le formulaire)</li>
        </ul>
        Le courriel reprend le <strong>suivi de la demande</strong> et votre note — il n'y a pas de notion d'« approuvé »/« refusé ». Le personnel TDM peut consulter cette page mais ne peut pas envoyer ce courriel ; seuls les champs de catalogage lui restent modifiables.`,
      answer: '', open: false, adminOnly: true
    },
    {
      question: 'Comment lire le tableau de bord des acquisitions ?',
      answerHtml: `Le tableau de bord affiche :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li><strong>4 compteurs cliquables</strong> : total des demandes, en attente, traitées et urgentes — chacun ouvre la liste filtrée correspondante</li>
          <li><strong>Catalogue des types</strong> : un accès rapide pour créer une nouvelle demande de chaque type</li>
          <li><strong>Répartitions</strong> par type de formulaire, par bibliothèque et par statut/suivi ACQ — cliquables elles aussi</li>
          <li><strong>Top 5 des demandeurs</strong> les plus actifs</li>
        </ul>
        Le personnel TDM voit une version différente, centrée sur son propre suivi (<strong>Mon activité</strong>).`,
      answer: '', open: false, adminOnly: true
    },

    /* ── 5 questions USAGER (bibliothécaires) ── */
    {
      question: 'Quels sont les 6 types de formulaire et lesquels utiliser ?',
      answerHtml: `Le portail propose 6 types de demandes :
        <ul style="margin:.5rem 0 .3rem 1.1rem;padding:0;line-height:1.9">
          <li><strong>Nouvel achat unique</strong> — l'acquisition ponctuelle d'un document, imprimé ou électronique</li>
          <li><strong>Nouvel abonnement</strong> — une ressource périodique ou une base de données</li>
          <li><strong>Modification et CCOL</strong> — une correction de notice dans le catalogue collectif</li>
          <li><strong>PEB numérique</strong> — un prêt entre bibliothèques via la plateforme Tipasa</li>
          <li><strong>Accessibilité</strong> — une ressource en format accessible</li>
          <li><strong>Suggestion d'achat</strong> — une suggestion transmise par un usager via un bibliothécaire</li>
        </ul>
        En cas de doute sur le bon type, indiquez votre question dans le champ <strong>Bibliothèque : Note / Commentaire / Question</strong> et l'équipe des Acquisitions vous orientera.`,
      answer: '', open: false, usagerOnly: true
    },
    {
      question: 'Que se passe-t-il après l\'envoi d\'un formulaire, et comment suivre ma demande ?',
      answerHtml: `Votre demande est enregistrée et visible dans <strong>Mes demandes</strong> avec le badge <strong>Non envoyé aux ACQ</strong> tant qu'elle n'a pas été transmise. Sélectionnez le statut <strong>Soumettre aux ACQ</strong> pour l'envoyer à l'équipe : le badge passe alors à <strong>ACQ en attente</strong>.
        <br><br>Une fois traitée, il devient <strong>ACQ traité</strong>, et la carte affiche directement le <strong>Statut</strong> et le <strong>Suivi</strong> de la demande laissés par l'équipe des Acquisitions.`,
      answer: '', open: false, usagerOnly: true
    },
    {
      question: 'Comment filtrer, exporter ou consulter toutes les demandes ?',
      answerHtml: `Dans <strong>Mes demandes</strong>, plusieurs filtres sont disponibles : recherche par titre, type de formulaire, bibliothèque, statut et plage de dates. Un compteur affiche le nombre de résultats, et <strong>Réinitialiser</strong> efface tous les filtres d'un coup.
        <br><br>Vous pouvez aussi cocher <strong>Toutes les demandes</strong> pour une vue d'ensemble en lecture seule (transparence entre bibliothèques), ou <strong>Exporter</strong> votre liste filtrée en Excel.`,
      answer: '', open: false, usagerOnly: true
    },
    {
      question: 'Comment remplir les champs prix, devise et fonds budgétaire ?',
      answerHtml: `Le formulaire comporte trois champs liés au prix :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li><strong>Devise originale</strong> — une liste déroulante ; choisissez <strong>Autre</strong> si la devise recherchée n'y figure pas</li>
          <li><strong>Prix en devise originale</strong> — le prix tel qu'affiché sur la source</li>
          <li><strong>Prix en CAD</strong> — calculé automatiquement dès que la devise choisie peut être convertie</li>
        </ul>
        Le <strong>Fonds budgétaire</strong> fonctionne de la même façon : une liste avec recherche, et une option <strong>Autre</strong> si le bon fonds n'y figure pas.
        <br><br>Si l'achat doit être réparti entre plusieurs fonds, utilisez le bouton <strong>+</strong> à côté du champ : chaque ligne ajoutée a sa propre devise, son prix et son pourcentage, avec un total affiché pour vérifier que ça atteint bien 100 %.`,
      answer: '', open: false, usagerOnly: true
    },
    {
      question: 'Comment joindre un fichier à ma demande ?',
      answerHtml: `Dans la section <strong>Pièces jointes</strong> du formulaire, vous pouvez joindre jusqu'à <strong>3 fichiers</strong> (10 Mo chacun) : PDF, Word, Excel, courriel (.msg/.eml) ou image (.jpg/.png).
        <br><br>Elles restent consultables et téléchargeables depuis <strong>Mes demandes</strong> une fois la demande enregistrée.`,
      answer: '', open: false, usagerOnly: true
    },
  ];

  /** TDM ne soumet jamais de demande comme un usager (formulaires, prix/devise, Mes
   *  demandes) — mais consulte la liste des items et la page de décision ACQ (en lecture
   *  seule pour la plupart des champs). Le contenu Admin lui est donc plus utile que le
   *  contenu Usager. */
  get visibleItems(): FaqItem[] {
    if (this.auth.isAdmin || this.auth.isTdm) {
      return this.items.filter(item => !item.usagerOnly);
    }
    return this.items.filter(item => !item.adminOnly);
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
