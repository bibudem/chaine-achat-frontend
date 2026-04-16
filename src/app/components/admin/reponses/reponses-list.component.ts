import { Component, OnInit } from '@angular/core';
import { ReponsesService, Reponse, PaginatedResponse } from '../../../services/reponses.service';
import { DialogService } from '../../../services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { PageEvent } from '@angular/material/paginator';

export type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-reponses-list',
  templateUrl: './reponses-list.component.html',
  styleUrls: ['./reponses-list.component.css']
})
export class ReponsesListComponent implements OnInit {

  // ── Données et état ────────────────────────────────────────
  reponses: Reponse[] = [];
  filteredReponses: Reponse[] = [];
  loading = false;
  errorMessage: string | null = null;
  decisionMessage: { type: string; texte: string } | null = null;

  // ── Détails affichés ───────────────────────────────────────
  expandedId: number | null = null;
  expandedReponse: Reponse | null = null;
  jsonFormatted: string = '';
  activeTab: 'formatted' | 'json' = 'formatted';
  copyFeedback: string | null = null;

  // ── Pagination ─────────────────────────────────────────────
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  pageSizeOptions = [10, 20, 50, 100];

  // ── Filtres ────────────────────────────────────────────────
  selectedType = '';
  selectedStatut = '';

  // ── Filtres par colonne ────────────────────────────────────
  columnFilters = {
    usager_nom: '',
    usager_courriel: '',
    type_formulaire: ''
  };

  // ── Tri ─────────────────────────────────────────────────────
  sortColumn: keyof Reponse | '' = '';
  sortDirection: SortDirection = '';

  formTypes = [
    { value: '', label: 'Tous les types' },
    { value: "Suggestion d'achat", label: "Suggestion d'achat" },
    { value: 'Nouvel achat unique', label: 'Nouvel achat unique' }
  ];

  statuts = [
    { value: '', label: 'Tous les statuts' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'approuve', label: 'Approuvé' },
    { value: 'refuse', label: 'Refusé' }
  ];

  // ── Colonnes du tableau ────────────────────────────────────
  displayedColumns: string[] = [
    'id',
    'type_formulaire',
    'usager_nom',
    'usager_courriel',
    'dateA',
    'statut_approbation',
    'actions'
  ];

  constructor(
    private reponsesService: ReponsesService,
    private dialogService: DialogService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadReponses();
  }

  /**
   * Charge les réponses depuis le service
   */
  loadReponses(): void {
    this.loading = true;
    this.errorMessage = null;

    this.reponsesService.getAll(
      this.selectedType || undefined,
      this.selectedStatut || undefined,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response: PaginatedResponse) => {
        this.reponses = response.data;
        this.totalItems = response.total;
        this.applyClientFiltering();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement reponses:', error);
        this.errorMessage = 'Erreur lors du chargement des réponses';
        this.loading = false;
      }
    });
  }

  /**
   * Applique les filtres côté client (par colonne)
   */
  applyClientFiltering(): void {
    this.filteredReponses = this.reponses.filter(r => {
      // Filtrer par nom
      if (this.columnFilters.usager_nom &&
          !r.usager_nom.toLowerCase().includes(this.columnFilters.usager_nom.toLowerCase())) {
        return false;
      }
      // Filtrer par email
      if (this.columnFilters.usager_courriel &&
          !r.usager_courriel.toLowerCase().includes(this.columnFilters.usager_courriel.toLowerCase())) {
        return false;
      }
      // Filtrer par type
      if (this.columnFilters.type_formulaire &&
          !r.type_formulaire.toLowerCase().includes(this.columnFilters.type_formulaire.toLowerCase())) {
        return false;
      }
      return true;
    });

    // Appliquer le tri
    this.applySorting();
  }

  /**
   * Applique le tri aux données filtrées
   */
  applySorting(): void {
    if (!this.sortColumn || !this.sortDirection) {
      return;
    }

    this.filteredReponses.sort((a, b) => {
      const valueA = a[this.sortColumn as keyof Reponse];
      const valueB = b[this.sortColumn as keyof Reponse];

      let comparison = 0;
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else if (typeof valueA === 'number' && typeof valueB === 'number') {
        comparison = valueA - valueB;
      } else {
        comparison = String(valueA).localeCompare(String(valueB));
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Change le tri d'une colonne
   */
  toggleSort(column: keyof Reponse): void {
    if (this.sortColumn === column) {
      // Basculer la direction
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = '';
        this.sortColumn = '';
      }
    } else {
      // Nouvelle colonne
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  /**
   * Gère le changement de page
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadReponses();
  }

  /**
   * Applique les filtres serveur et recharge
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadReponses();
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.selectedType = '';
    this.selectedStatut = '';
    this.columnFilters = {
      usager_nom: '',
      usager_courriel: '',
      type_formulaire: ''
    };
    this.sortColumn = '';
    this.sortDirection = '';
    this.currentPage = 1;
    this.expandedId = null;
    this.expandedReponse = null;
    this.loadReponses();
  }

  /**
   * Affiche/masque les détails d'une réponse
   */
  toggleDetails(reponse: Reponse): void {
    if (this.expandedId === reponse.id) {
      // Fermer
      this.expandedId = null;
      this.expandedReponse = null;
    } else {
      // Ouvrir
      this.expandedId = reponse.id;
      this.expandedReponse = reponse;
      this.jsonFormatted = JSON.stringify(reponse.reponses, null, 2);
      this.activeTab = 'formatted';
      this.copyFeedback = null;
    }
  }

  /**
   * Formate la date
   */
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  /**
   * Retourne la classe Bootstrap pour le statut
   */
  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'approuve':
        return 'badge-success';
      case 'refuse':
        return 'badge-danger';
      case 'en_attente':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Retourne l'icône de tri pour une colonne
   */
  getSortIcon(column: keyof Reponse): string {
    if (this.sortColumn !== column) return 'arrow-down-up';
    return this.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  /**
   * Copie le JSON dans le presse-papiers
   */
  copyToClipboard(): void {
    if (this.expandedReponse) {
      const textToCopy = JSON.stringify(this.expandedReponse.reponses, null, 2);
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.copyFeedback = 'Copié !';
        setTimeout(() => {
          this.copyFeedback = null;
        }, 2000);
      });
    }
  }

  /**
   * Télécharge le JSON
   */
  downloadJson(): void {
    if (this.expandedReponse) {
      const dataStr = JSON.stringify(this.expandedReponse.reponses, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reponse_${this.expandedReponse.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Vérifie si une valeur est un objet
   */
  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }

  /**
   * Applatit les objets imbriqués pour les afficher comme des champs distincts
   */
  flattenObject(obj: any, prefix = ''): { key: string; value: any }[] {
    const result: { key: string; value: any }[] = [];
    
    if (!obj || typeof obj !== 'object') {
      return result;
    }

    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (value === null || value === undefined) {
        result.push({ key: fullKey, value: '-' });
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        // Si c'est un tableau d'objets, afficher en JSON
        result.push({ key: fullKey, value: value });
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Si c'est un objet imbriqué, l'aplatir récursivement
        result.push(...this.flattenObject(value, fullKey));
      } else {
        result.push({ key: fullKey, value: value });
      }
    });

    return result;
  }

  /**
   * Affiche la valeur de manière lisible
   */
  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (Array.isArray(value)) {
      // Si c'est un tableau d'objets, afficher en JSON
      if (value.length > 0 && typeof value[0] === 'object') {
        return JSON.stringify(value, null, 2);
      }
      return value.join(', ');
    }
    if (typeof value === 'object') {
      // Si c'est un objet, l'afficher en JSON formaté
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  /**
   * Retourne les données formatées
   */
  getFormattedData(): any {
    return this.expandedReponse?.reponses || {};
  }
}
