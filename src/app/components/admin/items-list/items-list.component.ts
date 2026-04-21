import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Item, ItemFormulaireService, ApiResponse } from '../../../services/items-formulaire.service';
import { ListeChoixOptions } from '../../../lib/ListeChoixOptions';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'app-items-list',
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.css']
})
export class ItemsListComponent implements OnInit, OnDestroy {
  pagedItems: Item[] = [];
  total     = 0;
  loading   = false;

  searchTerm           = '';
  selectedBibliotheque = '';
  selectedStatut       = '';
  selectedFormulaireType = '';

  currentPage  = 1;
  itemsPerPage = 25;
  totalPages   = 0;

  sortColumn: string = 'date_creation';
  sortDirection: 'asc' | 'desc' = 'desc';

  decisionMessage: { type: 'success' | 'danger' | 'warning'; texte: string } | null = null;
  options = new ListeChoixOptions();

  private searchSubject = new Subject<string>();
  private subs = new Subscription();

  constructor(
    private itemService: ItemFormulaireService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.lireDecisionParams();

    const typeParam = this.route.snapshot.queryParamMap.get('formulaire_type');
    if (typeParam) this.selectedFormulaireType = typeParam;

    this.subs.add(
      this.searchSubject.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => { this.currentPage = 1; this.loadItems(); })
    );
    this.loadItems();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadItems(): void {
    this.loading = true;
    const offset = (this.currentPage - 1) * this.itemsPerPage;

    this.itemService.getAll({
      limit:          this.itemsPerPage,
      offset,
      search:          this.searchTerm         || undefined,
      bibliotheque:    this.selectedBibliotheque || undefined,
      statut:          this.selectedStatut       || undefined,
      formulaire_type: this.selectedFormulaireType || undefined,
      sort:  this.sortColumn,
      order: this.sortDirection
    }).subscribe({
      next: (res: ApiResponse<Item[]>) => {
        this.pagedItems = Array.isArray(res.data) ? res.data : [];
        this.total      = res.total ?? 0;
        this.totalPages = res.pagination?.totalPages ?? Math.ceil(this.total / this.itemsPerPage);
        this.loading    = false;
      },
      error: (err) => {
        console.error('Erreur chargement items', err);
        this.pagedItems = [];
        this.total      = 0;
        this.totalPages = 0;
        this.loading    = false;
      }
    });
  }

  private lireDecisionParams(): void {
    const decision = this.route.snapshot.queryParamMap.get('decision');
    const ref      = this.route.snapshot.queryParamMap.get('ref');

    if (decision === 'approuve') {
      this.decisionMessage = { type: 'success', texte: `✅ La demande #${ref} a été approuvée et ajoutée à la liste des items.` };
    } else if (decision === 'refuse') {
      this.decisionMessage = { type: 'danger',  texte: `❌ La demande #${ref} a été refusée. L'usager a été notifié par courriel.` };
    } else if (decision === 'erreur') {
      this.decisionMessage = { type: 'warning', texte: `⚠️ Une erreur s'est produite lors du traitement de la demande #${ref}.` };
    }
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn    = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadItems();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'bi-arrow-down-up opacity-50';
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadItems();
  }

  resetFilters(): void {
    this.searchTerm             = '';
    this.selectedBibliotheque   = '';
    this.selectedStatut         = '';
    this.selectedFormulaireType = '';
    this.sortColumn             = 'date_creation';
    this.sortDirection          = 'desc';
    this.currentPage            = 1;
    this.loadItems();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getLastItemIndex(): number {
    const offset = (this.currentPage - 1) * this.itemsPerPage;
    return Math.min(offset + this.itemsPerPage, this.total);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadItems();
  }

  async deleteItem(id?: number): Promise<void> {
    if (!id) return;
    const confirmed = await this.dialogService.confirm('Êtes-vous sûr de vouloir supprimer cet item ?', 'Confirmer');
    if (!confirmed) return;

    this.itemService.delete(id).subscribe({
      next: () => {
        this.dialogService.showInfo('Item supprimé avec succès');
        if (this.pagedItems.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadItems();
      },
      error: err => {
        console.error('Erreur lors de la suppression :', err);
        this.dialogService.showError('Erreur lors de la suppression de l\'item');
      }
    });
  }

  viewItem(id?: number): void {
    if (!id) return;
    this.router.navigate(['/items/details', id]);
  }

  editItem(id?: number): void {
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
    if (status.includes('Saisie en cours'))  return 'badge bg-warning';
    if (status.includes('En attente'))       return 'badge bg-info';
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

  getTypeBadgeClass(type: string | undefined): string {
    const t = (type ?? '').toLowerCase();
    if (t.includes('suggestion'))  return 'badge-type--suggest';
    if (t.includes('ccol'))        return 'badge-type--ccol';
    if (t.includes('abonnement'))  return 'badge-type--abo';
    if (t.includes('springer'))    return 'badge-type--springer';
    if (t.includes('peb'))         return 'badge-type--peb';
    if (t.includes('acq'))         return 'badge-type--acq';
    if (t.includes('achat'))       return 'badge-type--achat';
    return 'badge-type--autre';
  }
}
