import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Item, ItemFormulaireService } from '../../../services/items-formulaire.service';
import { ListeChoixOptions } from '../../../lib/ListeChoixOptions';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'app-items-list',
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.css']
})
export class ItemsListComponent implements OnInit {
  items: Item[] = [];
  filteredItems: Item[] = [];
  pagedItems: Item[] = [];
  loading = false;
  searchTerm = '';
  selectedBibliotheque = '';
  selectedStatut = '';
  selectedFormulaireType = '';

  // Pagination
  currentPage  = 1;
  itemsPerPage = 25;

  // ✅ Tri
  sortColumn: string = 'date_creation';
  sortDirection: 'asc' | 'desc' = 'desc';

  statutBadgeMap: Record<string, string> = {
    'En attente': 'bg-info',
    'Complété': 'bg-success',
    'Demande annulée': 'bg-danger',
    'Budget atteint': 'bg-warning',
    'En attente de traitement': 'bg-secondary',
    'En cours': 'bg-primary'
  };

  decisionMessage: { type: 'success' | 'danger' | 'warning'; texte: string } | null = null;
  options = new ListeChoixOptions();

  constructor(
    private itemService: ItemFormulaireService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.lireDecisionParams();

    this.itemService.getAll().subscribe({
      next: (data: unknown) => {
        const normalized = this.normalizeItems(data);
        this.items = normalized;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement items', err);
        this.items = [];
        this.filteredItems = [];
        this.pagedItems = [];
        this.loading = false;
      }
    });
  }

  private lireDecisionParams(): void {
    const decision = this.route.snapshot.queryParamMap.get('decision');
    const ref      = this.route.snapshot.queryParamMap.get('ref');

    if (decision === 'approuve') {
      this.decisionMessage = { type: 'success', texte: `✅ La demande #${ref} a été approuvée et ajoutée à la liste des items.` };
    } else if (decision === 'refuse') {
      this.decisionMessage = { type: 'danger', texte: `❌ La demande #${ref} a été refusée. L'usager a été notifié par courriel.` };
    } else if (decision === 'erreur') {
      this.decisionMessage = { type: 'warning', texte: `⚠️ Une erreur s'est produite lors du traitement de la demande #${ref}.` };
    }
  }

  private normalizeItems(data: any): Item[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.data)) return data.data;
      const values = Object.values(data);
      return values.filter(
        (val: any) => val && typeof val === 'object' && (val.titre_document || val.item_id)
      ) as Item[];
    }
    return [];
  }

  // ✅ Clic sur un en-tête de colonne
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn    = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // ✅ Icône selon l'état du tri
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'bi-arrow-down-up opacity-50';
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  // ✅ Logique de tri
  private sortItems(items: Item[]): Item[] {
    return [...items].sort((a: any, b: any) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];

      // Nulls toujours en dernier
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      // Date
      if (this.sortColumn === 'date_creation') {
        const diff = new Date(valA).getTime() - new Date(valB).getTime();
        return this.sortDirection === 'asc' ? diff : -diff;
      }

      // Numérique
      if (this.sortColumn === 'item_id') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      // Texte (tri FR avec accents)
      const cmp = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase(), 'fr');
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });
  }

  applyFilters(): void {
    let result = this.items.filter(item => {
      const matchesSearch = this.searchTerm
        ? (item.titre_document?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
           item.isbn_issn?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
           item.demandeur?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
           item.editeur?.toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;

      const matchesBib = this.selectedBibliotheque
        ? item.bibliotheque === this.selectedBibliotheque : true;

      const matchesStatut = this.selectedStatut
        ? (item.statut_bibliotheque === this.selectedStatut || item.statut_acq === this.selectedStatut)
        : true;

      const matchesFormulaireType = this.selectedFormulaireType
        ? item.formulaire_type === this.selectedFormulaireType : true;

      return matchesSearch && matchesBib && matchesStatut && matchesFormulaireType;
    });

    this.filteredItems = this.sortItems(result);
    this.currentPage   = 1;
    this.updatePagedItems();
  }

  updatePagedItems(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.pagedItems = this.filteredItems.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getLastItemIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredItems.length);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedItems();
  }

  onSearch(): void             { this.applyFilters(); }
  onBibliothequeChange(): void { this.applyFilters(); }
  onStatusChange(): void       { this.applyFilters(); }

  resetFilters(): void {
    this.searchTerm             = '';
    this.selectedBibliotheque   = '';
    this.selectedStatut         = '';
    this.selectedFormulaireType = '';
    this.sortColumn             = 'date_creation';
    this.sortDirection          = 'desc';
    this.applyFilters();
  }

  async deleteItem(id?: number): Promise<void> {
    if (!id) return;
    const confirmed = await this.dialogService.confirm('Êtes-vous sûr de vouloir supprimer cet item ?', 'Confirmer');
    if (!confirmed) return;

    this.itemService.delete(id).subscribe({
      next: () => {
        this.items = this.items.filter(item => item.item_id !== id);
        this.applyFilters();
        this.dialogService.showInfo('Item supprimé avec succès');
      },
      error: err => {
        console.error('Erreur lors de la suppression :', err);
        this.dialogService.showError('Erreur lors de la suppression de l\'item');
      }
    });
  }

  viewItem(id?: number): void {
    if (!id) return;
    this.router.navigate(['/items', id]);
  }

  trackByItemId(index: number, item: Item): number {
    return item.item_id || index;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Non spécifié';
    try {
      return new Date(dateString).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateString; }
  }

  getStatusBadgeClass(status?: string): string {
    if (!status) return 'badge bg-light text-dark';
    if (status.includes('Saisie en cours')) return 'badge bg-warning';
    if (status.includes('En attente'))      return 'badge bg-info';
    if (status.includes('Soumis aux ACQ') || status.includes('Complété')) return 'badge bg-success';
    if (status.includes('Demande annulée')) return 'badge bg-danger';
    if (status.includes('Budget atteint'))  return 'badge bg-secondary';
    return 'badge bg-light text-dark';
  }

  getStatusText(status?: string): string {
    if (!status) return 'Non spécifié';
    if (status.includes('Saisie en cours')) return 'Saisie en cours';
    if (status.includes('En attente'))      return 'En attente';
    if (status.includes('Soumis aux ACQ'))  return 'Soumis ACQ';
    if (status.includes('Complété'))        return 'Complété';
    if (status.includes('Demande annulée')) return 'Annulé';
    if (status.includes('Budget atteint'))  return 'Budget atteint';
    return status;
  }

  getDocumentCategory(category?: string): string {
    if (!category) return '';
    const abbreviations: { [key: string]: string } = {
      'Monographie': 'MONO', 'Périodique': 'PERIO',
      'Base de données': 'BD', 'Archives de périodiques': 'ARCH_PER',
      'Archives de monographies': 'ARCH_MONO'
    };
    return abbreviations[category] || category.substring(0, 4).toUpperCase();
  }

  getFormatSupport(format?: string): string {
    if (!format) return '';
    return format === 'Imprimé/support physique' ? 'Imprimé'
         : format === 'Électronique' ? 'Électronique' : format;
  }

  getStatutsUniques(): string[] {
    return [...new Set(
      this.filteredItems.map(item => item.statut_bibliotheque)
        .filter((s): s is string => Boolean(s))
    )];
  }
}