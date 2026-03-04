import { Component, OnInit } from '@angular/core';
import { LstFournisseursService, LstFournisseur, ApiResponse } from '../../services/lst-fournisseurs.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-lst-fournisseurs',
  templateUrl: './lst-fournisseurs.component.html',
  styleUrls: ['./lst-fournisseurs.component.css']
})
export class LstFournisseursComponent implements OnInit {

  // ── Données ──────────────────────────────────────────────
  fournisseurs: LstFournisseur[]         = [];
  filteredFournisseurs: LstFournisseur[] = [];

  // ── États ────────────────────────────────────────────────
  loading    = false;
  submitting = false;
  showForm   = false;
  isEditMode = false;
  currentId: number | null = null;

  // ── Message de décision ───────────────────────────────────
  decisionMessage: { type: string; texte: string } | null = null;

  // ── Formulaire ───────────────────────────────────────────
  titre           = '';
  format_offert   = '';
  affichage_prix  = '';
  type_document: string[] = [];
  description     = '';
  modifie_par     = '';

  // ── Filtres ──────────────────────────────────────────────
  selectedFormatOffert  = '';
  selectedTypeDocument  = '';
  searchTitre           = '';

  // ── Pagination ───────────────────────────────────────────
  currentPage  = 1;
  itemsPerPage = 50;

  // ── Options ──────────────────────────────────────────────
  formatsDisponibles    = ['Imprimé', 'Électronique', 'Imprimé et électronique'];
  affichagesDisponibles = ['Sur le site web', 'Sur OASIS', 'Pas disponible'];
  typesDisponibles      = [
    'Livre', 'Film', 'Partition', 'Enregistrement sonore',
    'Matériel didactique', 'Objets', 'Base de données', 'Autres'
  ];

  constructor(
    private svc: LstFournisseursService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  // ── Chargement ───────────────────────────────────────────
  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (response: ApiResponse<LstFournisseur[]>) => {
        if (response.success) {
          this.fournisseurs = response.data;
          this.applyFilters();
        } else {
          this.showDecisionMessage('danger', response.error || 'Impossible de charger les fournisseurs');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement fournisseurs:', error);
        this.showDecisionMessage('danger', 'Erreur lors du chargement des fournisseurs');
        this.loading = false;
      }
    });
  }

  // ── Filtres ──────────────────────────────────────────────
  applyFilters(): void {
    let result = [...this.fournisseurs];

    if (this.selectedFormatOffert) {
      result = result.filter(f => f.format_offert === this.selectedFormatOffert);
    }

    if (this.selectedTypeDocument) {
      result = result.filter(f =>
        (f.type_document || '').split(';#').includes(this.selectedTypeDocument)
      );
    }

    if (this.searchTitre.trim()) {
    const search = this.searchTitre.toLowerCase().trim();
    result = result.filter(f =>
      (f.titre || '').toLowerCase().includes(search)
    );
  }

    this.filteredFournisseurs = result;
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.selectedFormatOffert = '';
    this.selectedTypeDocument = '';
    this.searchTitre = '';
    this.applyFilters();
  }

  // ── Pagination ───────────────────────────────────────────
  get pagedFournisseurs(): LstFournisseur[] {
    const debut = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredFournisseurs.slice(debut, debut + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredFournisseurs.length / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getLastItemIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredFournisseurs.length);
  }

  trackByFournisseurId(index: number, item: LstFournisseur): number {
    return item.id_fournisseur ?? 0;
  }

  // ── Formulaire ───────────────────────────────────────────
  ouvrirFormulaire(): void {
    this.resetForm();
    this.isEditMode = false;
    this.showForm   = true;
  }

  apliquerModifier(id: number): void {
    this.loading = true;
    this.svc.getById(id).subscribe({
      next: (response: ApiResponse<LstFournisseur>) => {
        if (response.success && response.data) {
          const f             = response.data;
          this.currentId      = f.id_fournisseur ?? null;
          this.titre          = f.titre;
          this.format_offert  = f.format_offert  || '';
          this.affichage_prix = f.affichage_prix || '';
          this.type_document  = f.type_document
            ? f.type_document.split(';#').filter(Boolean)
            : [];
          this.description    = f.description  || '';
          this.modifie_par    = f.modifie_par  || '';
          this.isEditMode     = true;
          this.showForm       = true;
        } else {
          this.showDecisionMessage('danger', response.error || 'Impossible de charger le fournisseur');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement fournisseur:', error);
        this.showDecisionMessage('danger', 'Erreur lors du chargement du fournisseur');
        this.loading = false;
      }
    });
  }

  async annulerFormulaire(): Promise<void> {
    if (this.titre || this.format_offert || this.type_document.length) {
      const confirmed = await this.dialogService.confirm(
        'Voulez-vous vraiment annuler ? Les modifications non sauvegardées seront perdues.',
        'Confirmer l\'annulation'
      );
      if (!confirmed) return;
    }
    this.resetForm();
    this.showForm = false;
  }

  resetForm(): void {
    this.currentId      = null;
    this.titre          = '';
    this.format_offert  = '';
    this.affichage_prix = '';
    this.type_document  = [];
    this.description    = '';
    this.modifie_par    = '';
    this.isEditMode     = false;
  }

  isFormValid(): boolean {
    return this.titre.trim().length > 0;
  }

  // ── Soumission ───────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (!this.isFormValid()) {
      this.dialogService.showWarning('Le titre est obligatoire');
      return;
    }

    this.submitting = true;

    const payload: LstFournisseur = {
      titre:          this.titre.trim(),
      format_offert:  this.format_offert  || null,
      affichage_prix: this.affichage_prix || null,
      type_document:  this.type_document.length ? this.type_document.join(';#') : null,
      description:    this.description    || null,
      modifie_par:    this.modifie_par    || null
    };

    if (this.isEditMode && this.currentId) {
      this.svc.update(this.currentId, payload).subscribe({
        next: (response: ApiResponse<null>) => {
          this.submitting = false;
          if (response.success) {
            this.showForm = false;
            this.resetForm();
            this.showDecisionMessage('success', 'Fournisseur modifié avec succès!');
            this.load();
          } else {
            this.dialogService.showError(response.error || 'Erreur lors de la modification');
          }
        },
        error: (error) => {
          this.submitting = false;
          this.dialogService.showError('Erreur: ' + (error.message || 'Erreur inconnue'));
        }
      });
    } else {
      this.svc.create(payload).subscribe({
        next: (response: ApiResponse<{ id_fournisseur: number }>) => {
          this.submitting = false;
          if (response.success) {
            this.showForm = false;
            this.resetForm();
            this.showDecisionMessage('success', 'Fournisseur créé avec succès!');
            this.load();
          } else {
            this.dialogService.showError(response.error || 'Erreur lors de la création');
          }
        },
        error: (error) => {
          this.submitting = false;
          this.dialogService.showError('Erreur: ' + (error.message || 'Erreur inconnue'));
        }
      });
    }
  }

  // ── Suppression ──────────────────────────────────────────
  async deleteFournisseur(id: number, titre: string): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      `Voulez-vous vraiment supprimer le fournisseur "${titre}" ? Cette action est irréversible.`,
      'Confirmer la suppression'
    );
    if (!confirmed) return;

    this.svc.delete(id).subscribe({
      next: (response: ApiResponse<null>) => {
        if (response.success) {
          this.showDecisionMessage('warning', `Fournisseur "${titre}" supprimé avec succès.`);
          this.load();
        } else {
          this.showDecisionMessage('danger', response.error || 'Erreur lors de la suppression');
        }
      },
      error: (error) => {
        this.showDecisionMessage('danger', 'Erreur: ' + (error.message || 'Erreur inconnue'));
      }
    });
  }

  // ── Utilitaires ──────────────────────────────────────────
toggleTypeDocument(type: string): void {
  const idx = this.type_document.indexOf(type);
  idx === -1 ? this.type_document.push(type) : this.type_document.splice(idx, 1);
}

  isTypeSelected(type: string): boolean {
    return this.type_document.includes(type);
  }

  getTypeBadges(typeDocument: string | null | undefined): string[] {
    if (!typeDocument) return [];
    return typeDocument.split(';#').filter(Boolean);
  }


  // Affiche datem si non null, sinon datea
  getDateAffichage(f: LstFournisseur): string {
    const date = f.datem || f.datea;
    if (!date) return '—';
    return new Date(date).toLocaleString('fr-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  showDecisionMessage(type: string, texte: string): void {
    this.decisionMessage = { type, texte };
    setTimeout(() => this.decisionMessage = null, 4000);
  }
  dropdowns: { [key: string]: boolean } = {};

toggleDropdown(key: string): void {
  Object.keys(this.dropdowns).forEach(k => {
    if (k !== key) this.dropdowns[k] = false;
  });

  this.dropdowns[key] = !this.dropdowns[key];
}

closeAllDropdowns(): void {
  Object.keys(this.dropdowns).forEach(k => this.dropdowns[k] = false);
}
}