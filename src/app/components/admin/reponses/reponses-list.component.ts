import { Component, OnInit } from '@angular/core';
import { ReponsesService, Reponse, PaginatedResponse } from '../../../services/reponses.service';
import { PageEvent } from '@angular/material/paginator';

export type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-reponses-list',
  templateUrl: './reponses-list.component.html',
  styleUrls: ['./reponses-list.component.css']
})
export class ReponsesListComponent implements OnInit {

  reponses: Reponse[] = [];
  filteredReponses: Reponse[] = [];
  loading = false;
  errorMessage: string | null = null;
  decisionMessage: { type: string; texte: string } | null = null;

  expandedId: number | null = null;
  expandedReponse: Reponse | null = null;
  jsonFormatted = '';
  activeTab: 'formatted' | 'json' = 'formatted';
  copyFeedback: string | null = null;

  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  pageSizeOptions = [10, 20, 50, 100];

  selectedType = '';
  searchText = '';

  sortColumn = '';
  sortDirection: SortDirection = '';

  formTypes = [
    { value: '',                              label: 'Tous les types' },
    { value: "Suggestion d'achat - Usager",   label: "Suggestion d'achat — Usager" },
    { value: 'Nouvel achat unique',            label: 'Nouvel achat unique' },
    { value: 'Nouvel abonnement',              label: 'Nouvel abonnement' },
    { value: 'Requête ACQ Accessibilité',      label: 'Requête ACQ Accessibilité' },
    { value: 'Modification et CCOL',           label: 'Modification et CCOL' },
    { value: 'PEB Tipasa numérique',           label: 'PEB Tipasa numérique' },
  ];

  private readonly fieldLabels: Record<string, string> = {
    titre_document:           'Titre du document',
    sous_titre:               'Sous-titre',
    editeur:                  'Éditeur',
    isbn_issn:                'ISBN / ISSN',
    date_publication:         'Date de publication',
    categorie_document:       'Catégorie',
    format_support:           'Format / Support',
    fonds_budgetaire:         'Fonds budgétaire',
    fonds_sn_projet:          'Fonds SN — No projet',
    bibliotheque:             'Bibliothèque',
    demandeur:                'Demandeur',
    source_information:       "Source d'information",
    prix_cad:                 'Prix total (CAD)',
    devise_originale:         'Devise originale',
    prix_devise_originale:    'Prix devise originale',
    periode_couverte:         'Période couverte',
    nombre_titres_inclus:     'Nb titres inclus',
    nombre_utilisateurs:      "Nb d'utilisateurs",
    lien_plateforme:          'Lien plateforme',
    format_pret_numerique:    'Format PrêtNumérique',
    localisation_emplacement: 'Localisation / Emplacement',
    creation_notice_dtdm:     'Création notice TDM',
    statut_bibliotheque:      'Statut bibliothèque',
    statut_acq:               'Statut ACQ',
    suivi_acq:                'Suivi ACQ',
    note_commentaire:         'Note bibliothèque',
    note_dtdm:                'Note TDM',
    note_acq:                 'Note ACQ',
    bibliotheque_note_interne:'Note interne bibliothèque',
    catalogue:                'Catalogue',
    priorite_demande:         'Priorité',
    auteur:                   'Auteur(rice)',
    usager_statut:            "Statut de l'usager",
    usager_faculte:           'Faculté / Département',
    usager_courriel:          'Courriel usager',
    usager_nom:               'Nom usager',
    bibliothecaire_disciplinaire: 'Bibliothécaire disciplinaire',
    aviser_reservation:       'Aviser — Réservation',
    aviser_reception:         'Aviser — Réception',
    date_requise_cours:       'Requis pour cours',
    reserve_cours:            'Réserve de cours',
    reserve_cours_sigle:      'Sigle du cours',
    reserve_cours_session:    'Session',
    reserve_cours_enseignant: 'Enseignant(e)',
    quantite:                 'Quantité',
    bordereau_imprime:        'Bordereau imprimé',
    projets_speciaux:         'Projet spécial',
    gobi_vu_format_numerique: 'Vu sur GOBI / Leslibraires.ca',
    gobi_version_moins_365_usd: 'GOBI version < 365 USD',
    reference_tipasa:         'Référence Tipasa',
    precision_demande:        'Précision de la demande',
    date_debut_abonnement:    "Date début d'abonnement",
    type_monographie:         'Type de monographie',
    besoin_specifique_format: 'Besoin spécifique (format)',
    acq_responsable_courriel: 'ACQ — Responsable (courriel)',
    acq_numerisation_recommandee: 'Numérisation recommandée',
    acq_date_demande_editeur: "Date demande à l'éditeur",
    acq_date_livraison_estimee: 'Date livraison estimée',
    note_usager:              "Notes de l'usager",
    acq_raison_annulation:    "Raison d'annulation",
    acq_isbn:                 'ISBN (suggestion)',
    techdoc_suggestion_transmise: 'Transmise à TECHDOC',
    reference_usager:         'Référence usager',
    permalien_sofia:          'Permalien SOFIA',
    fournisseur_contacte_sans_succes: 'Fournisseur contacté sans succès',
    exemplaire_detenu:        'Exemplaire détenu',
    verification_caeb:        'Vérification CAEB',
    verification_sqla:        'Vérification SQLA',
    verification_emma:        'Vérification EMMA',
    id_ressource:             'ID de ressource',
    personne_a_aviser_nom:    'Personne à aviser — Nom',
    personne_a_aviser_courriel: 'Personne à aviser — Courriel',
    numero_oclc:              'Numéro OCLC',
    usager_aviser_reservation:'Usager à aviser — Réservation',
    usager_aviser_activation: "Usager à aviser — Activation",
  };

  constructor(
    private reponsesService: ReponsesService
  ) {}

  ngOnInit(): void {
    this.loadReponses();
  }

  loadReponses(): void {
    this.loading = true;
    this.errorMessage = null;

    this.reponsesService.getAll(
      this.selectedType || undefined,
      undefined,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response: PaginatedResponse) => {
        this.reponses = response.data;
        this.totalItems = response.total;
        this.applyClientFiltering();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des réponses';
        this.loading = false;
      }
    });
  }

  applyClientFiltering(): void {
    this.filteredReponses = this.reponses.filter(r => {
      if (this.searchText) {
        const s = this.searchText.toLowerCase();
        if (!r.usager_nom?.toLowerCase().includes(s) &&
            !r.usager_courriel?.toLowerCase().includes(s)) {
          return false;
        }
      }
      return true;
    });
    this.applySorting();
  }

  onSearchChange(): void {
    this.applyClientFiltering();
  }

  applySorting(): void {
    if (!this.sortColumn || !this.sortDirection) return;
    this.filteredReponses.sort((a, b) => {
      const va = (a as any)[this.sortColumn];
      const vb = (b as any)[this.sortColumn];
      let cmp = 0;
      if (typeof va === 'string' && typeof vb === 'string') {
        cmp = va.localeCompare(vb);
      } else if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb));
      }
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });
  }

  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc'
                         : this.sortDirection === 'desc' ? '' : 'asc';
      if (!this.sortDirection) this.sortColumn = '';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadReponses();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadReponses();
  }

  resetFilters(): void {
    this.selectedType = '';
    this.searchText = '';
    this.sortColumn = '';
    this.sortDirection = '';
    this.currentPage = 1;
    this.expandedId = null;
    this.expandedReponse = null;
    this.loadReponses();
  }

  toggleDetails(reponse: Reponse): void {
    if (this.expandedId === reponse.id) {
      this.expandedId = null;
      this.expandedReponse = null;
    } else {
      this.expandedId = reponse.id;
      this.expandedReponse = reponse;
      this.jsonFormatted = JSON.stringify(reponse.reponses, null, 2);
      this.activeTab = 'formatted';
      this.copyFeedback = null;
    }
  }

  // ── Formatage dates ───────────────────────────────────────────────
  formatDate(dateString: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-CA');
  }

  formatDateTime(dateString: string | null): string {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-CA') + ' ' +
           d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Icône de tri ──────────────────────────────────────────────────
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'arrow-down-up';
    return this.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  // ── Données du formulaire ─────────────────────────────────────────
  getSections(reponses: any): { label: string; fields: { key: string; value: any }[] }[] {
    if (!reponses || typeof reponses !== 'object') return [];
    const sections: { label: string; fields: { key: string; value: any }[] }[] = [];
    const topLevelSections = ['baseData', 'specificData'];

    if (reponses.baseData && typeof reponses.baseData === 'object') {
      const fields = Object.entries(reponses.baseData)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => ({ key: k, value: v }));
      if (fields.length) sections.push({ label: 'Données de base', fields });
    }

    if (reponses.specificData && typeof reponses.specificData === 'object') {
      const fields = Object.entries(reponses.specificData)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => ({ key: k, value: v }));
      if (fields.length) sections.push({ label: 'Données spécifiques', fields });
    }

    const otherFields = Object.entries(reponses)
      .filter(([k, v]) => !topLevelSections.includes(k) && v !== null && v !== undefined && v !== '')
      .map(([k, v]) => ({ key: k, value: v }));
    if (otherFields.length) sections.push({ label: 'Données du formulaire', fields: otherFields });

    return sections;
  }

  humanizeKey(key: string): string {
    return this.fieldLabels[key] ||
           key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object') return JSON.stringify(value, null, 2);
      return value.join(', ');
    }
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  // ── Presse-papiers / téléchargement ──────────────────────────────
  copyToClipboard(): void {
    if (!this.expandedReponse) return;
    navigator.clipboard.writeText(JSON.stringify(this.expandedReponse.reponses, null, 2)).then(() => {
      this.copyFeedback = 'Copié !';
      setTimeout(() => { this.copyFeedback = null; }, 2000);
    });
  }

  downloadJson(): void {
    if (!this.expandedReponse) return;
    const blob = new Blob([JSON.stringify(this.expandedReponse.reponses, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reponse_${this.expandedReponse.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
