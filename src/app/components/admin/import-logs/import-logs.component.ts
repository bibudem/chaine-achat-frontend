import { Component, OnInit } from '@angular/core';
import { ImportLogsService, ImportLog } from '../../../services/import-logs.service';

const FORM_TYPES = [
  'Nouvel achat unique',
  'Nouvel abonnement',
  'Modification et CCOL',
  'PEB Tipasa numérique',
  'Requête ACQ Accessibilité',
  "Suggestion d'achat - Usager",
];

@Component({
  selector:    'app-import-logs',
  templateUrl: './import-logs.component.html',
  styleUrls:   ['./import-logs.component.css']
})
export class ImportLogsComponent implements OnInit {

  logs:        ImportLog[] = [];
  total        = 0;
  page         = 1;
  readonly limit = 20;

  loading      = false;
  errorMessage = '';

  filterType        = '';
  filterStatut      = '';
  filterUtilisateur = '';
  filterDateDebut   = '';
  filterDateFin     = '';

  selectedLog: ImportLog | null = null;
  loadingDetail = false;

  readonly formTypes  = FORM_TYPES;
  readonly statuts    = ['succès', 'partiel', 'échec'];

  constructor(private importLogsService: ImportLogsService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading      = true;
    this.errorMessage = '';

    this.importLogsService.getAll({
      page:        this.page,
      limit:       this.limit,
      type:        this.filterType        || undefined,
      statut:      this.filterStatut      || undefined,
      utilisateur: this.filterUtilisateur || undefined,
      dateDebut:   this.filterDateDebut   || undefined,
      dateFin:     this.filterDateFin     || undefined,
    }).subscribe({
      next: (res) => {
        this.logs    = res.logs;
        this.total   = res.total;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.loading      = false;
      }
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  resetFilters(): void {
    this.filterType        = '';
    this.filterStatut      = '';
    this.filterUtilisateur = '';
    this.filterDateDebut   = '';
    this.filterDateFin     = '';
    this.page              = 1;
    this.load();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) { return; }
    this.page = p;
    this.load();
  }

  openDetail(log: ImportLog): void {
    if (!log.details_erreurs) {
      this.loadingDetail = true;
      this.importLogsService.getById(log.log_id).subscribe({
        next: (res) => {
          this.selectedLog   = res.data;
          this.loadingDetail = false;
        },
        error: () => { this.loadingDetail = false; }
      });
    } else {
      this.selectedLog = log;
    }
  }

  closeDetail(): void { this.selectedLog = null; }

  get totalPages(): number { return Math.ceil(this.total / this.limit) || 1; }

  get pages(): number[] {
    const total = this.totalPages;
    const cur   = this.page;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) {
      range.push(i);
    }
    return range;
  }

  statutClass(statut: string): string {
    if (statut === 'succès')  return 'badge-statut badge-statut--succes';
    if (statut === 'partiel') return 'badge-statut badge-statut--partiel';
    return 'badge-statut badge-statut--echec';
  }

  statutIcon(statut: string): string {
    if (statut === 'succès')  return 'bi-check-circle-fill';
    if (statut === 'partiel') return 'bi-exclamation-triangle-fill';
    return 'bi-x-circle-fill';
  }

  typeColor(type: string): string {
    const t = (type ?? '').toLowerCase();
    if (t.includes('suggestion'))  return '#C8872A';
    if (t.includes('ccol'))        return '#3730A3';
    if (t.includes('abonnement'))  return '#16A34A';
    if (t.includes('peb'))         return '#0369A1';
    if (t.includes('acq'))         return '#B91C1C';
    if (t.includes('achat'))       return '#1B5E6E';
    return '#0057AC';
  }

  tauxSucces(log: ImportLog): number {
    if (!log.nb_total) { return 0; }
    return Math.round((log.nb_inseres / log.nb_total) * 100);
  }

  formatDate(d: string): string {
    if (!d) { return '—'; }
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
