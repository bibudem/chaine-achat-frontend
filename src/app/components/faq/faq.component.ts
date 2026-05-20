import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

interface FaqItem {
  question: string;
  answer: string;
  answerHtml?: string;
  open: boolean;
  adminOnly?: boolean;
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
    {
      question: 'Comment traiter une demande soumise par un bibliothécaire ?',
      answer: 'Accédez à Registres → Réponses enregistrées pour consulter les demandes reçues. Sélectionnez une demande pour en voir le détail, puis utilisez le formulaire de décision ACQ pour approuver ou refuser la demande en laissant un commentaire à l\'intention du demandeur.',
      open: false,
      adminOnly: true
    },
    {
      question: 'Comment filtrer et trier la liste des items ?',
      answer: 'Utilisez les champs de recherche en haut de chaque colonne pour filtrer. Cliquez sur l\'en-tête d\'une colonne pour trier.',
      open: false
    },
    {
      question: 'Comment ajouter un commentaire lors du traitement d\'une demande ?',
      answer: 'Dans le formulaire de décision ACQ, le champ Commentaire ACQ permet de laisser une note à l\'intention du bibliothécaire demandeur. Ce commentaire est enregistré avec la décision et visible dans le détail de la réponse.',
      open: false,
      adminOnly: true
    },
    {
      question: 'Que se passe-t-il après l\'envoi d\'une décision ACQ ?',
      answer: 'Une notification est automatiquement envoyée au bibliothécaire demandeur pour l\'informer de la décision (approuvé ou refusé) et du commentaire associé. La demande est ensuite mise à jour dans la liste avec son nouveau statut.',
      open: false
    },
    {
    adminOnly: true,
    question: 'À quoi sert la section « Réponses enregistrées » et comment l\'utiliser ?',
    answerHtml: `<strong>Registres → Réponses enregistrées</strong> (accès administrateur) centralise toutes les soumissions reçues par la bibliothèque. Vous pouvez :
      <ul style="margin:.4rem 0 .2rem 1.1rem;padding:0">
        <li>Filtrer par <strong>type de formulaire</strong> parmi les 6 types disponibles</li>
        <li>Filtrer par <strong>statut d'approbation</strong> : En attente, Approuvé ou Refusé</li>
        <li>Trier par ID, demandeur, date ou statut en cliquant sur les en-têtes de colonnes</li>
        <li>Consulter le détail complet d'une réponse (informations du demandeur, commentaires admin, données JSON)</li>
        <li>Télécharger les données d'une réponse au format JSON</li>
      </ul>`,
    answer: '',
    open: false
  },
    {
      question: 'Quels sont les 6 types de formulaire et comment les reconnaître ?',
      answerHtml: `Chaque type de formulaire est identifié par une <strong>couleur distinctive</strong> dans la liste des demandes et le tableau de bord :
        <ul style="margin:.5rem 0 .3rem 1.1rem;padding:0;line-height:1.9">
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#3730A3;margin-right:6px;vertical-align:middle"></span><strong style="color:#3730A3">Indigo</strong> — Modification et CCOL</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#6D28D9;margin-right:6px;vertical-align:middle"></span><strong style="color:#6D28D9">Violet</strong> — Nouvel abonnement</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#1B5E6E;margin-right:6px;vertical-align:middle"></span><strong style="color:#1B5E6E">Teal</strong> — Nouvel achat unique</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#0369A1;margin-right:6px;vertical-align:middle"></span><strong style="color:#0369A1">Cyan</strong> — PEB Tipasa numérique</li>
          <li><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#37424D;margin-right:6px;vertical-align:middle"></span><strong style="color:#37424D">Gris foncé</strong> — Requête ACQ Accessibilité</li>
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

  get visibleItems(): FaqItem[] {
    return this.items.filter(item => !item.adminOnly || this.auth.isAdmin);
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
