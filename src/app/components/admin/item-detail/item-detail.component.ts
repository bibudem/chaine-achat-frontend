import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Item, ItemFormulaireService, ApiResponse } from '../../../services/items-formulaire.service';
import { DialogService } from '../../../services/dialog.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.css']
})
export class ItemDetailComponent implements OnInit {
  item: Item | null = null;
  itemId: number | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemFormulaireService,
    private dialogService: DialogService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.itemId) this.loadItem();
  }

  loadItem(): void {
    if (!this.itemId) return;
    this.loading = true;
    this.itemService.consulter(this.itemId).subscribe({
      next: (response: ApiResponse<Item>) => {
        if (response.success && response.data) {
          this.item = response.data;
        } else {
          this.dialogService.showError(response.error || 'Impossible de charger l\'item');
        }
        this.loading = false;
      },
      error: () => {
        this.dialogService.showError('Erreur lors du chargement');
        this.loading = false;
      }
    });
  }

  async onDelete(): Promise<void> {
    if (!this.itemId) return;
    const confirmed = await this.dialogService.confirm(
      'Voulez-vous vraiment supprimer cet item ? Cette action est irréversible.',
      'Confirmer la suppression'
    );
    if (confirmed) {
      this.itemService.delete(this.itemId).subscribe({
        next: (response) => {
          if (response.success) {
            this.dialogService.showSuccess('Item supprimé avec succès');
            setTimeout(() => this.router.navigate(['/items']), 1200);
          } else {
            this.dialogService.showError(response.error || 'Erreur suppression');
          }
        },
        error: () => this.dialogService.showError('Erreur lors de la suppression')
      });
    }
  }

  onEdit(): void {
    this.router.navigate(['/items', this.itemId]);
  }

  onReturn(): void {
    this.location.back();
  }

  getStatutBadgeClass(statut: string | undefined): string {
    if (!statut) return 'badge bg-light text-dark';
    if (statut.toLowerCase().includes('soumis'))  return 'badge bg-success';
    if (statut.toLowerCase().includes('cours'))   return 'badge bg-primary';
    if (statut.toLowerCase().includes('complét')) return 'badge bg-success';
    if (statut.toLowerCase().includes('annul'))   return 'badge bg-danger';
    if (statut.toLowerCase().includes('attente')) return 'badge bg-info';
    if (statut.toLowerCase().includes('budget'))  return 'badge bg-secondary';
    return 'badge bg-light text-dark';
  }

  getPrioriteBadgeClass(priorite: string | undefined): string {
    if (!priorite) return 'badge bg-light text-dark';
    if (priorite.toLowerCase().includes('urgent'))      return 'badge bg-danger';
    if (priorite.toLowerCase().includes('prioritaire')) return 'badge bg-warning text-dark';
    return 'badge bg-light text-dark';
  }

  val(v: any): string {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
    return String(v);
  }

  isElectronique(): boolean {
    return this.item?.format_support === 'Électronique';
  }

  hasFinancialData(): boolean {
    return !!(this.item?.prix_cad || this.item?.devise_originale ||
              this.item?.nombre_titres_inclus || this.item?.periode_couverte);
  }
}