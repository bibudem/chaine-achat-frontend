import { Component, OnInit } from '@angular/core';
import { Courriel, CourrielsService, STATUTS_COURRIEL, TYPES_COURRIEL, libelleTypeCourriel } from '../../../services/courriels.service';

/** Registres → Courriels envoyés (Admin, SuperAdmin) : journal de tous les courriels envoyés
 *  par l'application via n8n, avec leur statut d'envoi. */
@Component({
  selector: 'app-courriels',
  templateUrl: './courriels.component.html',
  // Mise en page commune avec le registre des imports.
  styleUrls: ['../import-logs/import-logs.component.css', './courriels.component.css']
})
export class CourrielsComponent implements OnInit {
  readonly types   = TYPES_COURRIEL;
  readonly statuts = STATUTS_COURRIEL;
  readonly libelleType = libelleTypeCourriel;

  courriels: Courriel[] = [];
  total   = 0;
  loading = false;
  errorMessage = '';

  recherche = '';
  filtreType   = '';
  filtreStatut = '';
  du = '';
  au = '';

  page  = 1;
  readonly limit = 25;

  /** Ligne dont le détail (contenu, erreur) est ouvert. */
  ouvert: number | null = null;

  constructor(private service: CourrielsService) {}

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.loading = true;
    this.errorMessage = '';
    this.service.lister({
      q: this.recherche.trim(), type: this.filtreType, statut: this.filtreStatut,
      du: this.du, au: this.au, limit: this.limit, offset: (this.page - 1) * this.limit,
    }).subscribe({
      next: res => {
        this.courriels = res.data || [];
        this.total     = res.total || 0;
        this.loading   = false;
        // Page devenue vide (moins de résultats qu'avant) : retour à la dernière page.
        if (!this.courriels.length && this.page > this.totalPages) this.allerPage(this.totalPages);
      },
      error: () => {
        this.courriels = []; this.total = 0; this.loading = false;
        this.errorMessage = 'Impossible de charger le journal des courriels.';
      }
    });
  }

  /** Recherche appliquée (Entrée puis sortie du champ ne rechargent qu'une fois). */
  private rechercheAppliquee = '';

  appliquer(): void {
    this.rechercheAppliquee = this.recherche.trim();
    this.page = 1;
    this.charger();
  }

  appliquerRecherche(): void {
    if (this.recherche.trim() !== this.rechercheAppliquee) this.appliquer();
  }

  get filtresActifs(): boolean {
    return !!(this.recherche || this.filtreType || this.filtreStatut || this.du || this.au);
  }

  reinitialiser(): void {
    this.recherche = ''; this.filtreType = ''; this.filtreStatut = ''; this.du = ''; this.au = '';
    this.appliquer();
  }

  basculer(c: Courriel): void {
    this.ouvert = this.ouvert === c.courriel_id ? null : c.courriel_id;
  }

  aDetail(c: Courriel): boolean {
    return !!(c.erreur || c.contenu?.suivi_acq || c.contenu?.note_acq);
  }

  get totalPages(): number { return Math.ceil(this.total / this.limit) || 1; }

  /** Pages affichées : la première, la dernière et deux de chaque côté de la page courante ;
   *  null = « … » entre deux plages. */
  get pages(): (number | null)[] {
    const n = this.totalPages;
    const garder = new Set([1, n]);
    for (let i = this.page - 2; i <= this.page + 2; i++) if (i >= 1 && i <= n) garder.add(i);
    const triees = [...garder].sort((a, b) => a - b);
    const r: (number | null)[] = [];
    triees.forEach((p, i) => {
      if (i > 0 && p - triees[i - 1] > 1) r.push(null);
      r.push(p);
    });
    return r;
  }

  /** « 26–50 sur 130 » */
  get plage(): string {
    if (!this.total) return '';
    const debut = (this.page - 1) * this.limit + 1;
    return `${debut}–${Math.min(this.page * this.limit, this.total)} sur ${this.total}`;
  }

  /** Destinataires multiples (« a@x, b@y ») affichés un par un, sans couper la colonne. */
  adresses(c: Courriel): string[] {
    return (c.destinataire || '').split(/\s*[,;]\s*/).filter(Boolean);
  }

  allerPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.charger();
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-CA', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
