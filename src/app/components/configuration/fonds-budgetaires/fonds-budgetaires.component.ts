import { Component, OnInit } from '@angular/core';
import { FondsBudgetairesService, FondBudgetaire } from '../../../services/fonds-budgetaires.service';
import { DialogService } from '../../../services/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector:    'app-fonds-budgetaires',
  templateUrl: './fonds-budgetaires.component.html',
  styleUrls:   ['./fonds-budgetaires.component.css']
})
export class FondsBudgetairesComponent implements OnInit {

  fonds: FondBudgetaire[] = [];

  loading      = true;
  errorMessage = '';

  /** Filtre live du tableau (même besoin que la liste déroulante : liste longue). */
  recherche = '';

  /** Pagination client (la liste complète est déjà chargée en mémoire — pas d'appel réseau
   *  par page). */
  currentPage  = 1;
  itemsPerPage = 25;

  /** Modale d'ajout/modification — editingId null = création, sinon id du fonds modifié. */
  showModal  = false;
  editingId: number | null = null;
  formCode   = '';
  isSaving   = false;

  constructor(
    private fondsService: FondsBudgetairesService,
    private dialog: DialogService,
    private translate: TranslateService
  ) {}

  private t(key: string, params?: object): string {
    return this.translate.instant(`fonds-budgetaires-page.${key}`, params);
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading      = true;
    this.errorMessage = '';
    this.fondsService.getAll().subscribe({
      next: (res) => {
        this.fonds   = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || this.t('erreur-chargement');
        this.loading       = false;
      }
    });
  }

  get fondsFiltres(): FondBudgetaire[] {
    const q = this.recherche.trim().toLowerCase();
    if (!q) return this.fonds;
    return this.fonds.filter(f => f.code.toLowerCase().includes(q));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.fondsFiltres.length / this.itemsPerPage));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get fondsPagines(): FondBudgetaire[] {
    const debut = (this.currentPage - 1) * this.itemsPerPage;
    return this.fondsFiltres.slice(debut, debut + this.itemsPerPage);
  }

  getLastItemIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.fondsFiltres.length);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  /** Recherche modifiée : on revient toujours à la première page, sinon le tableau peut
   *  s'afficher vide si la page courante n'existe plus dans les résultats filtrés. */
  onRechercheChange(): void {
    this.currentPage = 1;
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     MODALE : AJOUT / MODIFICATION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  openAdd(): void {
    this.editingId = null;
    this.formCode  = '';
    this.showModal = true;
  }

  openEdit(f: FondBudgetaire): void {
    this.editingId = f.fond_id;
    this.formCode  = f.code;
    this.showModal = true;
  }

  cancelModal(): void {
    this.showModal = false;
  }

  submitModal(): void {
    const code = this.formCode.trim().toUpperCase();
    if (!code) {
      this.dialog.showError(this.t('erreur-code-manquant'));
      return;
    }
    if (!/^[A-Za-z]{2,4}-\d{2,}$/.test(code)) {
      this.dialog.showError(this.t('erreur-code-format'));
      return;
    }

    this.isSaving = true;

    const requete = this.editingId
      ? this.fondsService.modifier(this.editingId, code)
      : this.fondsService.creer(code);

    requete.subscribe({
      next: (res) => {
        if (this.editingId) {
          this.fonds = this.fonds.map(f => f.fond_id === res.data.fond_id ? res.data : f);
        } else {
          this.fonds = [...this.fonds, res.data].sort((a, b) => a.code.localeCompare(b.code));
        }

        this.isSaving  = false;
        this.showModal = false;
        this.dialog.showSuccess(
          this.editingId ? this.t('succes-modifie') : this.t('succes-cree', { code })
        );
      },
      error: (err) => {
        this.isSaving = false;
        this.dialog.showError(err.error?.error || this.t('erreur-enregistrement'));
      }
    });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SUPPRESSION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  async supprimer(f: FondBudgetaire): Promise<void> {
    const confirmed = await this.dialog.confirm(
      this.t('confirmer-suppression-message', { code: f.code }),
      this.t('confirmer-suppression-titre')
    );
    if (!confirmed) return;

    this.fondsService.supprimer(f.fond_id).subscribe({
      next: () => {
        this.fonds = this.fonds.filter(x => x.fond_id !== f.fond_id);
        // Dernière ligne de la dernière page supprimée : revenir à la page précédente
        // plutôt que d'afficher une page vide.
        if (this.currentPage > 1 && this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
        }
        this.dialog.showSuccess(this.t('succes-supprime'));
      },
      error: () => this.dialog.showError(this.t('erreur-suppression'))
    });
  }
}
