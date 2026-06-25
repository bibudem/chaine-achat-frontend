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

    /* ── 5 questions ADMIN ── */
    {
      question: 'Comment traiter une demande soumise par un bibliothécaire ?',
      answerHtml: `Accédez à <strong>Registres → Réponses enregistrées</strong>. Filtrez par type de formulaire ou par statut <strong>En attente</strong> pour voir les nouvelles demandes. Cliquez sur une ligne pour consulter l'ensemble des informations fournies par le bibliothécaire.
        <br><br>Utilisez ensuite le <strong>formulaire de décision ACQ</strong> pour :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li>Choisir <strong>Approuver</strong> ou <strong>Refuser</strong></li>
          <li>Remplir le champ <strong>Commentaire ACQ</strong> (visible par le demandeur)</li>
          <li>Soumettre — la notification est envoyée automatiquement au bibliothécaire</li>
        </ul>`,
      answer: '', open: false, adminOnly: true
    },
    {
      question: 'Comment utiliser l\'import en lot ?',
      answerHtml: `Accédez à <strong>Import</strong> dans le menu administrateur, puis :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li>Sélectionnez le <strong>type de formulaire</strong> correspondant aux données à importer</li>
          <li>Téléchargez le <strong>fichier modèle Excel</strong> — il contient les noms des colonnes, les indicateurs REQUIS/Optionnel et des exemples de valeurs</li>
          <li>Remplissez le fichier en respectant le format des colonnes obligatoires</li>
          <li>Déposez-le dans la zone d'import</li>
        </ul>
        L'application valide chaque ligne et affiche un <strong>rapport détaillé</strong> indiquant le nombre d'insertions réussies et les erreurs avec leur numéro de ligne.`,
      answer: '', open: false, adminOnly: true
    },
    {
      question: 'Comment filtrer et retrouver efficacement une demande ?',
      answerHtml: `La liste des items dispose de <strong>filtres combinables</strong> : type de formulaire, statut (En attente / Approuvé / Refusé), bibliothèque, et une recherche textuelle sur le titre ou le demandeur. Cliquez sur l'en-tête d'une colonne pour trier.
        <br><br>Les filtres actifs et la page courante sont <strong>mémorisés automatiquement</strong> : si vous ouvrez une fiche puis revenez à la liste, vos filtres sont restaurés. Pour repartir de zéro, utilisez le bouton <strong>Réinitialiser les filtres</strong>.`,
      answer: '', open: false, adminOnly: true
    },
    {
      question: 'Comment fonctionne la notification envoyée après une décision ACQ ?',
      answerHtml: `Dès qu'une décision est soumise (approuvé ou refusé), un <strong>courriel automatique</strong> est envoyé au bibliothécaire demandeur. Il contient :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li>La <strong>décision</strong> (Approuvé / Refusé)</li>
          <li>Le <strong>commentaire ACQ</strong> saisi lors du traitement</li>
          <li>Les informations principales de la demande (titre, type de formulaire)</li>
        </ul>
        La demande est simultanément mise à jour dans la liste des items avec son nouveau statut.`,
      answer: '', open: false, adminOnly: true
    },
    {
      question: 'Comment lire le tableau de bord des acquisitions ?',
      answerHtml: `Le tableau de bord affiche une <strong>vue synthétique</strong> de l'activité en cours :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li><strong>Compteurs par statut</strong> : nombre de demandes En attente, Approuvées et Refusées</li>
          <li><strong>Répartition par type de formulaire</strong> : barres colorées proportionnelles au volume de chaque type</li>
          <li><strong>Activité récente</strong> : dernières demandes soumises ou traitées</li>
        </ul>
        Cliquez sur un compteur ou un type pour accéder directement à la liste filtrée correspondante.`,
      answer: '', open: false, adminOnly: true
    },

    /* ── 5 questions USAGER ── */
    {
      question: 'Quels sont les 6 types de formulaire et lesquels utiliser ?',
      answerHtml: `L'application propose 6 types de demandes, chacun identifié par une <strong>couleur distinctive</strong> :
        <ul style="margin:.5rem 0 .3rem 1.1rem;padding:0;line-height:1.9">
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#1B5E6E;margin-right:6px;vertical-align:middle"></span><strong style="color:#1B5E6E">Teal</strong> — <strong>Nouvel achat unique</strong> : acquisition ponctuelle d'un document (imprimé ou électronique)</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#16A34A;margin-right:6px;vertical-align:middle"></span><strong style="color:#16A34A">Vert</strong> — <strong>Nouvel abonnement</strong> : souscription à une ressource périodique ou une base de données</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#3730A3;margin-right:6px;vertical-align:middle"></span><strong style="color:#3730A3">Indigo</strong> — <strong>Modification et CCOL</strong> : correction de notice dans le catalogue collectif</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#0369A1;margin-right:6px;vertical-align:middle"></span><strong style="color:#0369A1">Cyan</strong> — <strong>PEB Tipasa numérique</strong> : prêt entre bibliothèques via la plateforme Tipasa</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#37424D;margin-right:6px;vertical-align:middle"></span><strong style="color:#37424D">Gris foncé</strong> — <strong>Requête ACQ Accessibilité</strong> : ressources en format accessible (service accessibilité)</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#C8872A;margin-right:6px;vertical-align:middle"></span><strong style="color:#C8872A">Ambre</strong> — <strong>Suggestion d'achat – Usager</strong> : suggestions soumises par les usagers via un bibliothécaire</li>
        </ul>
        Si vous hésitez, consignez votre question dans le champ <strong>Bibliothèque : Note, commentaire ou question</strong> et l'équipe des Acquisitions vous guidera.`,
      answer: '', open: false, usagerOnly: true
    },
    {
      question: 'Que se passe-t-il après l\'envoi d\'un formulaire ?',
      answerHtml: `Votre demande est enregistrée et visible dans <strong>Mes demandes</strong>. Si vous avez sélectionné le statut <strong>Soumettre aux ACQ</strong>, un courriel est automatiquement transmis à l'équipe des Acquisitions et votre demande affiche le badge <strong>En attente ACQ</strong>.
        <br><br>Une fois traitée par l'équipe ACQ, le badge passe à <strong>ACQ traité</strong>. Ouvrez le détail de votre demande pour consulter le suivi et les notes laissées par l'équipe ACQ.`,
      answer: '', open: false, usagerOnly: true
    },
    {
      question: 'Comment suivre l\'état de ma demande ?',
      answerHtml: `Accédez à <strong>Mes demandes</strong> depuis le menu. Chaque demande affiche un badge indiquant son état :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li><strong>Non envoyé aux ACQ</strong> — la demande n'a pas encore été transmise à l'équipe des Acquisitions</li>
          <li><strong>En attente ACQ</strong> — transmise, en cours d'examen par l'équipe ACQ</li>
          <li><strong>ACQ traité</strong> — traitée ; le bloc <strong>ACQ</strong> sur la carte affiche le suivi et le statut de la demande</li>
        </ul>
        Si l'équipe ACQ a laissé une note ou un commentaire, il apparaît directement sur la carte.`,
      answer: '', open: false, usagerOnly: true
    },
    {
      question: 'Comment remplir les champs prix et devise ?',
      answerHtml: `Le formulaire comporte trois champs liés au prix :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li><strong>Prix CAD</strong> — le prix converti en dollars canadiens</li>
          <li><strong>Devise originale</strong> — la devise de la source (ex. USD, EUR, CAD)</li>
          <li><strong>Prix en devise originale</strong> — le prix tel qu'affiché sur la source</li>
        </ul>
        Si la devise est <strong>CAD</strong>, le prix CAD se remplit automatiquement avec la même valeur. En cas d'incertitude sur le prix ou la conversion, laissez une note dans le champ <strong>Bibliothèque : Note, commentaire ou question</strong>.`,
      answer: '', open: false, usagerOnly: true
    },
    {
      question: 'Comment filtrer et retrouver ma demande dans la liste ?',
      answerHtml: `Dans <strong>Mes demandes</strong>, trois filtres sont disponibles :
        <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
          <li><strong>Recherche par titre</strong> — saisissez un mot du titre du document</li>
          <li><strong>Type de formulaire</strong> — sélectionnez parmi les 6 types disponibles</li>
          <li><strong>Plage de dates</strong> — pour retrouver des demandes soumises sur une période précise</li>
        </ul>
        Le compteur à droite des filtres indique le nombre de demandes correspondantes. Pour tout effacer, cliquez sur <strong>Réinitialiser</strong>.`,
      answer: '', open: false, usagerOnly: true
    },
  ];

  get visibleItems(): FaqItem[] {
    if (this.auth.isAdmin) {
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
