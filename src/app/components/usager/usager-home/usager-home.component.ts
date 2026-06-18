import { Component } from '@angular/core';

export interface FormulaireCard {
  titre:       string;
  description: string;
  icon:        string;
  route:       string;
  accentColor: string;
  bgColor:     string;
  textColor:   string;
}

@Component({
  selector:    'app-usager-home',
  templateUrl: './usager-home.component.html',
  styleUrls:   ['./usager-home.component.css']
})
export class UsagerHomeComponent {

  get prenomAdmin(): string { return sessionStorage.getItem('prenomAdmin') ?? ''; }
  get nomAdmin():    string { return sessionStorage.getItem('nomAdmin')    ?? ''; }
  get initiales():   string {
    const p = this.prenomAdmin.charAt(0);
    const n = this.nomAdmin.charAt(0);
    return (p + n).toUpperCase() || '?';
  }

  readonly formulaires: FormulaireCard[] = [
    {
      titre:       "Suggestion d'achat",
      description: "Proposez l'ajout d'un document à nos collections. Votre suggestion sera étudiée par un bibliothécaire disciplinaire.",
      icon:        'bi-lightbulb',
      route:       '/usager/suggestion-public',
      accentColor: '#C8872A',
      bgColor:     '#FDF3E3',
      textColor:   '#7B4A15',
    },
    {
      titre:       'Nouvel achat unique',
      description: "Soumettez une demande d'acquisition d'un document imprimé ou électronique pour les collections des bibliothèques.",
      icon:        'bi-cart-plus',
      route:       '/usager/nouvel-achat',
      accentColor: '#2A9086',
      bgColor:     '#D9F0EE',
      textColor:   '#1B5E6E',
    },
    {
      titre:       'Modification et CCOL',
      description: "Demandez la modification d'une notice existante ou l'ajout d'un exemplaire au catalogue collectif (CCOL).",
      icon:        'bi-pencil-square',
      route:       '/usager/modification-ccol',
      accentColor: '#3730A3',
      bgColor:     '#EDE9FE',
      textColor:   '#312E81',
    },
    {
      titre:       'Nouvel abonnement',
      description: "Soumettez une demande de souscription à une ressource périodique ou sérielle imprimée ou électronique.",
      icon:        'bi-newspaper',
      route:       '/usager/nouvel-abonnement',
      accentColor: '#16A34A',
      bgColor:     '#DCFCE7',
      textColor:   '#14532D',
    },
    {
      titre:       'PEB Tipasa numérique',
      description: "Demandez l'achat d'un livre numérique en remplacement d'un prêt entre bibliothèques via la plateforme Tipasa.",
      icon:        'bi-share',
      route:       '/usager/peb-tipasa-numerique',
      accentColor: '#0369A1',
      bgColor:     '#E0F2FE',
      textColor:   '#0C4A6E',
    },
    {
      titre:       'Requête ACQ Accessibilité',
      description: "Adressez une requête spécifique directement au service des acquisitions pour un besoin en accessibilité.",
      icon:        'bi-universal-access',
      route:       '/usager/requete-accessibilite',
      accentColor: '#37424D',
      bgColor:     '#F4F5F7',
      textColor:   '#2D3748',
    },
  ];
}
