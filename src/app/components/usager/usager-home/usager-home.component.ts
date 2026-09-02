import { Component, OnInit } from '@angular/core';
import { ReponsesService, DemandeUsager } from '../../../services/reponses.service';
import { demandeBadgeStatut } from '../../../lib/DemandeStatut';

export interface FormulaireCard {
  titre:       string;
  description: string;
  icon:        string;
  route:       string;
  accentColor: string;
  bgColor:     string;
  textColor:   string;
  groupe:      string;
}

@Component({
  selector:    'app-usager-home',
  templateUrl: './usager-home.component.html',
  styleUrls:   ['./usager-home.component.css']
})
export class UsagerHomeComponent implements OnInit {

  demandes: DemandeUsager[] = [];
  totalDemandes: number | null = null;
  loadingDemandes = true;

  // Total du système (toutes les demandes, tous usagers confondus — lecture seule, voir
  // ToutesLesDemandesComponent) : simple compteur, un seul appel léger (limit: 1).
  totalSysteme: number | null = null;

  constructor(private reponsesService: ReponsesService) {}

  get prenomAdmin(): string { return sessionStorage.getItem('prenomAdmin') ?? ''; }
  get nomAdmin():    string { return sessionStorage.getItem('nomAdmin')    ?? ''; }
  get initiales():   string {
    const p = this.prenomAdmin.charAt(0);
    const n = this.nomAdmin.charAt(0);
    return (p + n).toUpperCase() || '?';
  }

  ngOnInit(): void {
    const email = sessionStorage.getItem('courrielAdmin') ?? '';
    if (!email) { this.loadingDemandes = false; return; }

    this.reponsesService.getByEmail(email).subscribe({
      next: res => {
        this.demandes      = res.data ?? [];
        this.totalDemandes = this.demandes.length;
        this.loadingDemandes = false;
      },
      error: () => { this.demandes = []; this.totalDemandes = null; this.loadingDemandes = false; }
    });

    this.reponsesService.getAllPublic({ limit: 1, offset: 0 }).subscribe({
      next:  res => { this.totalSysteme = res.total; },
      error: ()  => { this.totalSysteme = null; }
    });
  }

  // ── Tableau de bord : répartition des demandes par statut (même catégorisation que les
  //    badges de "Mes demandes" — voir lib/DemandeStatut.ts) ──
  get nbNonEnvoyees(): number { return this.demandes.filter(d => demandeBadgeStatut(d) === 'attente').length; }
  get nbEnAttenteAcq(): number { return this.demandes.filter(d => demandeBadgeStatut(d) === 'soumise').length; }
  get nbTraitees(): number     { return this.demandes.filter(d => demandeBadgeStatut(d) === 'traitee').length; }

  readonly GROUPE_COLLECTIONS = 'Développement des collections';
  readonly GROUPE_USAGERS     = 'Acquisitions pour les usagers';

  readonly formulaires: FormulaireCard[] = [
    /* ── Développement des collections ── */
    {
      titre:       'Nouvel achat unique',
      description: "Demander l'achat de documents (sans frais annuels récurrents).",
      icon:        'bi-cart-plus',
      route:       '/usager/nouvel-achat',
      accentColor: '#2A9086',
      bgColor:     '#D9F0EE',
      textColor:   '#1B5E6E',
      groupe:      this.GROUPE_COLLECTIONS,
    },
    {
      titre:       'Nouvel abonnement',
      description: 'Demander un nouvel abonnement (frais annuels récurrents).',
      icon:        'bi-newspaper',
      route:       '/usager/nouvel-abonnement',
      accentColor: '#16A34A',
      bgColor:     '#DCFCE7',
      textColor:   '#14532D',
      groupe:      this.GROUPE_COLLECTIONS,
    },
    {
      titre:       'Modification et CCOL',
      description: "Demander une modification à un abonnement actif ou l'achat d'un complément de collection (CCOL).",
      icon:        'bi-pencil-square',
      route:       '/usager/modification-ccol',
      accentColor: '#3730A3',
      bgColor:     '#EDE9FE',
      textColor:   '#312E81',
      groupe:      this.GROUPE_COLLECTIONS,
    },

    /* ── Acquisitions pour les usagers ── */
    {
      titre:       'Accessibilité',
      description: 'Demander un document pour une personne en situation de handicap. Exclusif au Service Accessibilité.',
      icon:        'bi-universal-access',
      route:       '/usager/requete-accessibilite',
      accentColor: '#37424D',
      bgColor:     '#F4F5F7',
      textColor:   '#2D3748',
      groupe:      this.GROUPE_USAGERS,
    },
    {
      titre:       "Suggestion d'achat - Usager",
      description: "Demander l'achat de documents ayant fait l'objet d'une suggestion d'achat sur le site des bibliothèques. Exclusif à l'équipe Suggestions d'achat.",
      icon:        'bi-lightbulb',
      route:       '/usager/suggestion-public',
      accentColor: '#C8872A',
      bgColor:     '#FDF3E3',
      textColor:   '#7B4A15',
      groupe:      this.GROUPE_USAGERS,
    },
    {
      titre:       'PEB numérique',
      description: "Demander l'achat de documents découlant de demandes de prêt entre bibliothèques. Exclusif à l'équipe du PEB.",
      icon:        'bi-share',
      route:       '/usager/peb-tipasa-numerique',
      accentColor: '#0369A1',
      bgColor:     '#E0F2FE',
      textColor:   '#0C4A6E',
      groupe:      this.GROUPE_USAGERS,
    },
  ];

  get formulaireGroupes(): { label: string; items: FormulaireCard[] }[] {
    return [
      { label: this.GROUPE_COLLECTIONS, items: this.formulaires.filter(f => f.groupe === this.GROUPE_COLLECTIONS) },
      { label: this.GROUPE_USAGERS,     items: this.formulaires.filter(f => f.groupe === this.GROUPE_USAGERS) },
    ];
  }
}
