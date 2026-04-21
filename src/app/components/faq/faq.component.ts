import { Component } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
  answerHtml?: string;
  open: boolean;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {

  isOpen = false;

  items: FaqItem[] = [
    {
      question: 'Comment créer une nouvelle demande d\'achat ?',
      answer: 'Cliquez sur « Nouveau » dans le menu latéral ou depuis la liste des items. Remplissez le formulaire et soumettez-le. La demande apparaîtra dans la liste avec le statut « En attente ».',
      open: false
    },
    {
      question: 'Comment filtrer et trier la liste des items ?',
      answer: 'Utilisez les champs de recherche en haut de chaque colonne pour filtrer. Cliquez sur l\'en-tête d\'une colonne pour trier.',
      open: false
    },
    {
      question: 'Comment importer des données en masse ?',
      answer: 'Accédez à la section « Import » dans le menu. Téléversez un fichier Excel (.xlsx) en respectant le gabarit fourni. Les erreurs de validation sont signalées ligne par ligne avant la confirmation.',
      open: false
    },
    {
      question: 'Comment consulter les rapports ?',
      answer: 'La section « Rapports » permet d\'exporter les données filtrées en PDF ou Excel. Sélectionnez la période et les critères souhaités avant de générer le rapport.',
      open: false
    },
    {
    question: 'À quoi sert la section « Réponses enregistrées » et comment l\'utiliser ?',
    answerHtml: `<strong>Registres → Réponses enregistrées</strong> (accès administrateur) centralise toutes les soumissions de formulaires reçues par la bibliothèque. Vous pouvez :
      <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
        <li>Filtrer par <strong>type de formulaire</strong> : Suggestion d'achat ou Nouvel achat unique</li>
        <li>Filtrer par <strong>statut d'approbation</strong> : En attente, Approuvé ou Refusé</li>
        <li>Trier par ID, demandeur, date ou statut en cliquant sur les en-têtes de colonnes</li>
        <li>Consulter le détail complet d'une réponse (informations du demandeur, commentaires admin, données JSON)</li>
        <li>Télécharger les données d'une réponse au format JSON</li>
      </ul>`,
    answer: '',
    open: false
  },
    {
      question: 'Quels sont les 7 types de formulaire et comment les reconnaître ?',
      answerHtml: `Chaque type de formulaire est identifié par une <strong>couleur distinctive</strong> dans la liste des demandes et le tableau de bord :
        <ul style="margin:.5rem 0 .3rem 1.1rem;padding:0;line-height:1.9">
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#3730A3;margin-right:6px;vertical-align:middle"></span><strong style="color:#3730A3">Indigo</strong> — Modification CCOL</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#6D28D9;margin-right:6px;vertical-align:middle"></span><strong style="color:#6D28D9">Violet</strong> — Nouvel abonnement</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#1B5E6E;margin-right:6px;vertical-align:middle"></span><strong style="color:#1B5E6E">Teal</strong> — Nouvel achat unique</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#0369A1;margin-right:6px;vertical-align:middle"></span><strong style="color:#0369A1">Cyan</strong> — PEB Tipasa numérique</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#37424D;margin-right:6px;vertical-align:middle"></span><strong style="color:#37424D">Gris foncé</strong> — Requête ACQ</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#9A3412;margin-right:6px;vertical-align:middle"></span><strong style="color:#9A3412">Terracotta</strong> — Springer</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#C8872A;margin-right:6px;vertical-align:middle"></span><strong style="color:#C8872A">Ambre</strong> — Suggestion d'achat</li>
        </ul>
        Ces couleurs sont cohérentes dans le tableau de bord (icônes et barres de répartition), la liste des demandes (badges) et les filtres.`,
      answer: '',
      open: false
    },
    {
      question: 'Qui contacter en cas de problème technique ?',
      answer: 'Communiquez avec l\'équipe de support de la bibliothèque à l\'adresse courriel indiquée dans le pied de page, ou ouvrez un ticket via le système de gestion des incidents de l\'UdeM.',
      open: false
    },
  ];

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
