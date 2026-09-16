import { Component, OnInit } from '@angular/core';
import { TauxDevisesService, TauxPeriode } from '../../../services/taux-devises.service';
import { DialogService } from '../../../services/dialog.service';
import { ListeChoixOptions } from '../../../lib/ListeChoixOptions';

@Component({
  selector:    'app-taux-devises',
  templateUrl: './taux-devises.component.html',
  styleUrls:   ['./taux-devises.component.css']
})
export class TauxDevisesComponent implements OnInit {

  /** Devises suivies (colonnes du tableau) — toutes sauf CAD (implicite = 1, jamais converti)
   *  et Autre (saisie libre, aucun taux applicable). */
  readonly devises: string[] = new ListeChoixOptions().devisesOptions
    .map(d => d.code)
    .filter(c => c !== 'CAD' && c !== 'Autre');

  periodes: TauxPeriode[] = [];

  loading      = true;
  errorMessage = '';

  /** Cellule de taux actuellement en édition (une devise, dans une période donnée). */
  editingCell: { periodeId: number; devise: string } | null = null;
  editValue = '';
  isSavingCell = false;

  /** Métadonnées de période (libellé / date / note) actuellement en édition. */
  editingMetaId: number | null = null;
  editMeta = { periode: '', date_debut: '', note: '' };
  isSavingMeta = false;

  /** Formulaire d'ajout d'une nouvelle période. */
  showAddPeriode = false;
  newPeriode = { periode: '', date_debut: '', note: '' };
  isSavingPeriode = false;

  constructor(
    private tauxDevisesService: TauxDevisesService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading      = true;
    this.errorMessage = '';
    this.tauxDevisesService.getAll().subscribe({
      next: (res) => {
        this.periodes = res.data || [];
        this.loading  = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des taux';
        this.loading       = false;
      }
    });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     TAUX PAR DEVISE (cellules du tableau)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  tauxDe(periode: TauxPeriode, devise: string): number | null {
    const v = periode.taux?.[devise];
    return typeof v === 'number' ? v : null;
  }

  isEditingCell(periode: TauxPeriode, devise: string): boolean {
    return this.editingCell?.periodeId === periode.id && this.editingCell?.devise === devise;
  }

  startEditCell(periode: TauxPeriode, devise: string): void {
    this.editingCell = { periodeId: periode.id, devise };
    const v = this.tauxDe(periode, devise);
    this.editValue = v != null ? String(v).replace('.', ',') : '';
  }

  cancelEditCell(): void {
    this.editingCell = null;
    this.editValue   = '';
  }

  saveEditCell(): void {
    if (!this.editingCell) return;
    const { periodeId, devise } = this.editingCell;
    const tauxNum = parseFloat((this.editValue || '').replace(',', '.'));

    if (!Number.isFinite(tauxNum) || tauxNum <= 0) {
      this.dialog.showError('Veuillez indiquer un taux valide (> 0).');
      return;
    }

    this.isSavingCell = true;
    this.tauxDevisesService.upsertTauxDevise(periodeId, devise, tauxNum).subscribe({
      next: (res) => {
        this.applyUpdatedPeriode(res.data);
        this.isSavingCell = false;
        this.editingCell  = null;
      },
      error: () => {
        this.isSavingCell = false;
        this.dialog.showError('Erreur lors de l\'enregistrement du taux.');
      }
    });
  }

  async removeTauxDevise(periode: TauxPeriode, devise: string): Promise<void> {
    const confirmed = await this.dialog.confirm(
      `Retirer le taux ${devise} de la période « ${periode.periode} » ?`,
      'Confirmer la suppression'
    );
    if (!confirmed) return;

    this.tauxDevisesService.supprimerTauxDevise(periode.id, devise).subscribe({
      next: (res) => this.applyUpdatedPeriode(res.data),
      error: () => this.dialog.showError('Erreur lors de la suppression du taux.')
    });
  }

  private applyUpdatedPeriode(updated: TauxPeriode): void {
    this.periodes = this.periodes.map(p => p.id === updated.id ? updated : p);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     MÉTADONNÉES DE PÉRIODE (libellé / date / note)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  startEditMeta(periode: TauxPeriode): void {
    this.editingMetaId = periode.id;
    this.editMeta = {
      periode:    periode.periode,
      date_debut: (periode.date_debut || '').slice(0, 10),
      note:       periode.note || ''
    };
  }

  cancelEditMeta(): void {
    this.editingMetaId = null;
  }

  saveEditMeta(): void {
    if (this.editingMetaId == null) return;
    if (!this.editMeta.periode.trim()) {
      this.dialog.showError('Le libellé de la période est obligatoire.');
      return;
    }

    this.isSavingMeta = true;
    this.tauxDevisesService.modifierPeriode(this.editingMetaId, {
      periode:    this.editMeta.periode.trim(),
      date_debut: this.editMeta.date_debut || undefined,
      note:       this.editMeta.note || undefined
    }).subscribe({
      next: (res) => {
        this.applyUpdatedPeriode(res.data);
        this.isSavingMeta   = false;
        this.editingMetaId  = null;
      },
      error: () => {
        this.isSavingMeta = false;
        this.dialog.showError('Erreur lors de la mise à jour de la période.');
      }
    });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     PÉRIODES (lignes)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  openAddPeriode(): void {
    this.newPeriode = { periode: '', date_debut: new Date().toISOString().slice(0, 10), note: '' };
    this.showAddPeriode = true;
  }

  cancelAddPeriode(): void {
    this.showAddPeriode = false;
  }

  submitNewPeriode(): void {
    if (!this.newPeriode.periode.trim()) {
      this.dialog.showError('Veuillez indiquer un libellé pour la période (ex. « 2026-2027 »).');
      return;
    }

    this.isSavingPeriode = true;
    this.tauxDevisesService.creerPeriode(
      this.newPeriode.periode.trim(),
      this.newPeriode.date_debut || null,
      this.newPeriode.note || null
    ).subscribe({
      next: (res) => {
        this.periodes = [res.data, ...this.periodes];
        this.isSavingPeriode = false;
        this.showAddPeriode  = false;
        this.dialog.showSuccess(`Période « ${res.data.periode} » créée — ajoutez maintenant les taux de chaque devise.`);
      },
      error: () => {
        this.isSavingPeriode = false;
        this.dialog.showError('Erreur lors de la création de la période.');
      }
    });
  }

  async deletePeriode(periode: TauxPeriode): Promise<void> {
    const confirmed = await this.dialog.confirm(
      `Supprimer définitivement la période « ${periode.periode} » et tous les taux qu'elle contient ? Cette action est irréversible.`,
      'Confirmer la suppression'
    );
    if (!confirmed) return;

    this.tauxDevisesService.supprimerPeriode(periode.id).subscribe({
      next: () => {
        this.periodes = this.periodes.filter(p => p.id !== periode.id);
        this.dialog.showSuccess('Période supprimée.');
      },
      error: () => this.dialog.showError('Erreur lors de la suppression de la période.')
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
