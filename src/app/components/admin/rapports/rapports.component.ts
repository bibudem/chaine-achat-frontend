import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { Router } from "@angular/router";
import { RapportsService, FiltresRapport, ApiResponse } from '../../../services/rapports.service';

interface TypeRapport {
  id: 'detaille' | 'par-type' | 'par-bibliotheque' | 'par-demandeur' | 'mensuel' | 'par-statut';
  nom: string;
  description: string;
}

@Component({
  selector: 'app-rapports',
  templateUrl: './rapports.component.html',
  styleUrls: ['./rapports.component.css']
})
export class RapportsComponent implements OnInit, AfterViewInit, OnDestroy {

  // Table
  dataSource = new MatTableDataSource<any>([]);
  isLoading = false;
  listeRapport: any[] = [];
  totalDonnees = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) matSort!: MatSort;

  // Colonnes
  champsTitre: any = {};
  champsDisponibles: string[] = [];
  colonnesSelectionnees: string[] = [];
  colonneSearch = '';

  // Type rapport
  rapportSelectionneId: TypeRapport['id'] = 'detaille';
  rapportsDisponibles: TypeRapport[] = [
    { id: 'detaille',         nom: 'Rapport détaillé',       description: 'Toutes les lignes avec tous les détails' },
    { id: 'par-type',         nom: 'Par type de formulaire', description: 'Regroupement par type de formulaire' },
    { id: 'par-bibliotheque', nom: 'Par bibliothèque',       description: 'Regroupement par bibliothèque' },
    { id: 'par-demandeur',    nom: 'Par demandeur',          description: 'Regroupement par demandeur' },
    { id: 'mensuel',          nom: 'Rapport mensuel',        description: 'Statistiques agrégées par mois' },
    { id: 'par-statut',       nom: 'Par statut',             description: 'Regroupement par statut' },
  ];

  // Pagination
  limit = 500;
  offset = 0;

  // Filtres
  filtres: FiltresRapport = { dateDebut: '', dateFin: '', demandeur: '', limit: 500, offset: 0 };
  filtresMatSelect: Record<string, any[]> = {};

  // Filtre titre (recherche texte libre)
  rechercheTitre = '';

  // Dropdown custom
  dropdowns: Record<string, boolean> = {};
  selectedMap: Record<string, string[]> = {};

  statutsBibliotheque: string[] = ['En attente en bibliothèque', 'En attente', 'En traitement', 'Terminé'];
  statutsAcq: string[]          = ['Soumis aux ACQ', 'Demande annulée'];

  // Options statiques
  typesFormulaires: string[] = [
    'Modification CCOL', 'Nouvel abonnement', 'Nouvel achat unique',
    'PEB Tipasa numérique', 'Requête ACQ', 'Springer', "Suggestion d'achat"
  ];
  priorites: string[] = ['Urgent', 'Régulier', 'Basse'];
  bibliotheques: string[] = [
    'Bibliothèque des lettres et sciences humaines', 'Bibliothèque des sciences',
    'Bibliothèque de droit', "Bibliothèque d'aménagement",
    'Bibliothèque de médecine vétérinaire', 'Bibliothèque de santé'
  ];

  // Statuts fusionnés (statut_bibliotheque + statut_acq)
  statutsFusionnes: string[] = [
    'En attente en bibliothèque', 'En attente', 'En traitement', 'Terminé',
    'Soumis aux ACQ', 'Demande annulée'
  ];

  statutFiltreActif = false;
  statutFiltreLabel = '';
  private statutFiltre: { colonne: string; valeur: string } | null = null;

  // Données brutes conservées pour re-filtrage sans rappel API
  private donneesBrutes: any[] = [];

  // Cache filtres
  private filterValuesCache: Map<string, Set<string>> = new Map();
  private lastFilterCacheUpdate: Map<string, number> = new Map();
  private clickListener!: () => void;

  constructor(
    private rapportsService: RapportsService,
    private translate: TranslateService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    const { dateDebut, dateFin } = this.rapportsService.getCurrentMonthDates();
    this.filtres.dateDebut = dateDebut;
    this.filtres.dateFin   = dateFin;
    this.initTitreChamps();
    this.colonnesSelectionnees = [
      'item_id', 'formulaire_type', 'titre_document', 'demandeur',
      'bibliotheque', 'statut_bibliotheque', 'statut_acq', 'date_creation'
    ];
    this.clickListener = () => this.closeAllDropdowns();
    document.addEventListener('click', this.clickListener);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.matSort;
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.clickListener);
  }

  // ─── Colonnes ────────────────────────────────────────────

  get champsDisponiblesFiltres(): string[] {
    if (!this.colonneSearch.trim()) return this.champsDisponibles;
    const q = this.colonneSearch.toLowerCase();
    return this.champsDisponibles.filter(c =>
      (this.champsTitre[c] || c).toLowerCase().includes(q)
    );
  }

  toggleColonne(event: any): void {
    const checked = event.target.checked;
    const value   = event.target.value;
    if (checked && !this.colonnesSelectionnees.includes(value)) {
      this.colonnesSelectionnees = [...this.colonnesSelectionnees, value];
    } else if (!checked) {
      this.colonnesSelectionnees = this.colonnesSelectionnees.filter(c => c !== value);
    }
  }

  retirerColonne(col: string): void {
    this.colonnesSelectionnees = this.colonnesSelectionnees.filter(c => c !== col);
  }

  selectAllColonnes(): void { this.colonnesSelectionnees = [...this.champsDisponibles]; }
  clearAllColonnes(): void  { this.colonnesSelectionnees = []; }

  // ─── Dropdowns custom ────────────────────────────────────

  toggleDropdown(id: string): void {
    const current = this.dropdowns[id];
    this.closeAllDropdowns();
    this.dropdowns[id] = !current;
  }

  closeAllDropdowns(): void {
    Object.keys(this.dropdowns).forEach(k => this.dropdowns[k] = false);
  }

  // Filtre multi-select (type, bibliothèque, priorité)
  onCheckChange(filterId: string, value: string, event: any): void {
    if (!this.selectedMap[filterId]) this.selectedMap[filterId] = [];
    if (event.target.checked) {
      this.selectedMap[filterId] = [...this.selectedMap[filterId], value];
    } else {
      this.selectedMap[filterId] = this.selectedMap[filterId].filter(v => v !== value);
    }
    const key = this.mapKey(filterId);
    if (this.selectedMap[filterId].length > 0) {
      this.filtresMatSelect[key] = this.selectedMap[filterId];
    } else {
      delete this.filtresMatSelect[key];
    }
    this.chargerApercu();
  }

  // Filtre statuts fusionnés — vérifie statut_bibliotheque ET statut_acq

    onStatutChange(event: any): void {
      const val: string = event.target.value;
      if (!val) {
        this.statutFiltre      = null;
        this.statutFiltreActif = false;
        this.statutFiltreLabel = '';
      } else {
        const [type, valeur] = val.split('|');
        this.statutFiltre      = {
          colonne: type === 'bib' ? 'statut_bibliotheque' : 'statut_acq',
          valeur
        };
        this.statutFiltreActif = true;
        this.statutFiltreLabel = valeur;
      }
      this.chargerApercu();
    }

    isStatutSelected(type: string, valeur: string): boolean {
      if (!this.statutFiltre) return false;
      const col = type === 'bib' ? 'statut_bibliotheque' : 'statut_acq';
      return this.statutFiltre.colonne === col && this.statutFiltre.valeur === valeur;
    }

  // ─── Init ────────────────────────────────────────────────

  private initTitreChamps(): void {
    this.translate.get('labels-rapport').subscribe(res => {
      this.champsTitre      = res;
      this.champsDisponibles = Object.keys(res);
    });
  }

  // ─── Pagination ──────────────────────────────────────────

  changerLimit(value: number): void {
    this.limit          = value;
    this.filtres.limit  = value;
    this.offset         = 0;
    this.filtres.offset = 0;
    if (this.paginator) this.paginator.pageIndex = 0;
  }

  // ─── Chargement principal (appel API) ────────────────────

  async chargerApercu(): Promise<void> {
    try {
      this.isLoading     = true;
      this.listeRapport  = [];
      this.donneesBrutes = [];

      const filtres  = this.construireFiltres();
      const response = await this.rapportsService.toPromise(
        this.rapportsService.getRapportDetaille(filtres)
      );

      if (!response?.success) return;

      const rows = Array.isArray(response.data)
        ? response.data
        : response.data ? [response.data] : [];

      this.donneesBrutes = rows;
      this.updateFilterOptions(rows);
      this.appliquerEtAfficher();

    } catch (err) {
      console.error('Erreur chargement rapport:', err);
      this.listeRapport    = [];
      this.totalDonnees    = 0;
      this.dataSource.data = [];
    } finally {
      this.isLoading = false;
    }
  }

  // ─── Filtrage + regroupement côté client ─────────────────

  appliquerEtAfficher(): void {
    let rows = [...this.donneesBrutes];

    // Filtre titre uniquement (client-side instantané — les autres filtres sont côté serveur)
    if (this.rechercheTitre.trim()) {
      const term = this.rechercheTitre.toLowerCase().trim();
      rows = rows.filter(row => {
        const titre = String(row.titre_document || row.titre || '').toLowerCase();
        return titre.includes(term);
      });
    }

    // Regroupement selon le type de rapport
    const rowsGroupes = this.grouperPourRapport(rows, this.rapportSelectionneId);

    this.listeRapport    = rowsGroupes;
    this.totalDonnees    = rowsGroupes.length;
    this.adapterColonnes(rowsGroupes);
    this.dataSource.data = rowsGroupes;

    if (this.paginator) this.paginator.pageIndex = 0;
  }

  // ─── Regroupements ───────────────────────────────────────

  private grouperPourRapport(rows: any[], type: TypeRapport['id']): any[] {
    switch (type) {
      case 'detaille':         return rows;
      case 'par-type':         return this.grouperPar(rows, 'formulaire_type');
      case 'par-bibliotheque': return this.grouperPar(rows, 'bibliotheque');
      case 'par-demandeur':    return this.grouperPar(rows, 'demandeur');
      case 'par-statut':       return this.grouperParDouble(rows, 'statut_bibliotheque', 'statut_acq');
      case 'mensuel':          return this.grouperParMois(rows);
      default:                 return rows;
    }
  }

  private grouperPar(rows: any[], champ: string): any[] {
    const map = new Map<string, any>();
    rows.forEach(row => {
      const key = row[champ] || '(vide)';
      if (!map.has(key)) {
        map.set(key, { [champ]: key, total: 0,
          bib_en_attente: 0, bib_en_traitement: 0, bib_termines: 0,
          acq_soumis: 0, acq_annulees: 0 });
      }
      const g  = map.get(key)!;
      const sb = (row.statut_bibliotheque || '').toLowerCase();
      const sa = (row.statut_acq          || '').toLowerCase();
      g.total++;
      if (sb.includes('attente'))                            g.bib_en_attente++;
      if (sb.includes('traitement'))                         g.bib_en_traitement++;
      if (sb.includes('terminé') || sb.includes('termine')) g.bib_termines++;
      if (sa.includes('soumis'))                             g.acq_soumis++;
      if (sa.includes('annul'))                              g.acq_annulees++;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  private grouperParDouble(rows: any[], champ1: string, champ2: string): any[] {
    const map = new Map<string, any>();
    rows.forEach(row => {
      const key = `${row[champ1] || '(vide)'}__${row[champ2] || '(vide)'}`;
      if (!map.has(key)) {
        map.set(key, {
          [champ1]: row[champ1] || '(vide)',
          [champ2]: row[champ2] || '(vide)',
          total: 0
        });
      }
      map.get(key)!.total++;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  private grouperParMois(rows: any[]): any[] {
    const map = new Map<string, any>();
    rows.forEach(row => {
      if (!row.date_creation) return;
      const mois = String(row.date_creation).substring(0, 7);
      if (!map.has(mois)) {
        map.set(mois, { mois, total: 0, bib_termines: 0, acq_soumis: 0, acq_annulees: 0 });
      }
      const g  = map.get(mois)!;
      const sb = (row.statut_bibliotheque || '').toLowerCase();
      const sa = (row.statut_acq          || '').toLowerCase();
      g.total++;
      if (sb.includes('terminé') || sb.includes('termine')) g.bib_termines++;
      if (sa.includes('soumis'))  g.acq_soumis++;
      if (sa.includes('annul'))   g.acq_annulees++;
    });
    return Array.from(map.values()).sort((a, b) => b.mois.localeCompare(a.mois));
  }

  // ─── Filtres ─────────────────────────────────────────────

  private construireFiltres(): FiltresRapport {
    const f: FiltresRapport = {
      dateDebut: this.filtres.dateDebut || undefined,
      dateFin:   this.filtres.dateFin   || undefined,
      demandeur: this.filtres.demandeur || undefined,
      limit:     5000,
      offset:    0
    };

    const types = this.selectedMap['formulaireType'];
    if (types?.length) f.formulaire_type = types.join(',');

    const bibs = this.selectedMap['bibliotheque'];
    if (bibs?.length) f.bibliotheque = bibs.join(',');

    const prios = this.selectedMap['priorite'];
    if (prios?.length) f.priorite = prios.join(',');

    if (this.statutFiltre) {
      if (this.statutFiltre.colonne === 'statut_bibliotheque') {
        f.statutBibliotheque = this.statutFiltre.valeur;
      } else {
        f.statutAcq = this.statutFiltre.valeur;
      }
    }

    return f;
  }

  private mapKey(key: string): string {
    const map: Record<string, string> = {
      formulaireType:      'formulaire_type',
      formulaire_type:     'formulaire_type',
      bibliotheque:        'bibliotheque',
      priorite:            'priorite_demande',
    };
    return map[key] || key;
  }

  // ─── Options dynamiques ──────────────────────────────────

  private updateFilterOptions(rows: any[]): void {
    if (!rows?.length) return;
    const merge = (existing: string[], field: string) =>
      Array.from(new Set([...existing, ...this.extractAndCacheFilterValues(rows, field)])).sort();

    this.typesFormulaires    = merge(this.typesFormulaires,    'formulaire_type');
    this.bibliotheques       = merge(this.bibliotheques,       'bibliotheque');
    this.priorites           = merge(this.priorites,           'priorite_demande');
    this.statutsBibliotheque = merge(this.statutsBibliotheque, 'statut_bibliotheque');
    this.statutsAcq          = merge(this.statutsAcq,          'statut_acq');
  }

  private extractAndCacheFilterValues(rows: any[], fieldName: string): string[] {
    const cacheKey = `cache_${fieldName}`;
    const now      = Date.now();
    if ((now - (this.lastFilterCacheUpdate.get(cacheKey) || 0)) > 5 * 60 * 1000) {
      this.filterValuesCache.delete(cacheKey);
    }
    if (this.filterValuesCache.has(cacheKey)) {
      return Array.from(this.filterValuesCache.get(cacheKey)!).sort();
    }
    const unique = new Set<string>();
    rows.forEach(row => { if (row[fieldName]) unique.add(String(row[fieldName]).trim()); });
    this.filterValuesCache.set(cacheKey, unique);
    this.lastFilterCacheUpdate.set(cacheKey, now);
    return Array.from(unique).sort();
  }

  // ─── Colonnes tableau ────────────────────────────────────

  private adapterColonnes(rows: any[]): void {
    if (!rows?.length || this.colonnesSelectionnees.length > 0) return;
    this.colonnesSelectionnees = this.getAvailableColumns(rows);
  }

  private getAvailableColumns(rows: any[]): string[] {
    const priority = ['item_id', 'formulaire_type', 'titre_document', 'demandeur',
                      'bibliotheque', 'statut_bibliotheque', 'statut_acq',
                      'priorite_demande', 'date_creation', 'date_modification'];
    const all = new Set<string>();
    rows.forEach(row => Object.keys(row).forEach(k => all.add(k)));
    return Array.from(all).sort((a, b) => {
      const ai = priority.indexOf(a), bi = priority.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  // ─── Badges ──────────────────────────────────────────────

  isStatusColumn(col: string): boolean {
    return col === 'statut_bibliotheque' || col === 'statut_acq' || col.includes('statut');
  }

  isPriorityColumn(col: string): boolean {
    return col === 'priorite' || col === 'priorite_demande';
  }

  getBadgeClass(value: string): string {
    if (!value) return 'badge bg-light text-dark';
    const v = value.toLowerCase().trim();
    if (v.includes('soumis') || v.includes('complét') || v.includes('terminé')) return 'badge bg-success';
    if (v.includes('cours')  || v.includes('traitement'))                        return 'badge bg-primary';
    if (v.includes('attente'))                                                    return 'badge bg-info';
    if (v.includes('annul')  || v.includes('rejeté') || v.includes('refusé'))   return 'badge bg-danger';
    return 'badge bg-light text-dark';
  }

  getPriorityBadgeClass(value: string): string {
    if (!value) return 'badge bg-light text-dark';
    const v = value.toLowerCase().trim();
    if (v.includes('urgent') || v.includes('haute'))                                  return 'badge bg-danger';
    if (v.includes('prioritaire') || v.includes('régulier') || v.includes('moyenne')) return 'badge bg-warning text-dark';
    return 'badge bg-light text-dark';
  }

  // ─── Format cellule ──────────────────────────────────────

  formatCell(column: string, value: any): string {
    if (value === null || value === undefined || value === '') return '-';
    if (column.includes('date')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toLocaleString('fr-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    }
    if (column.includes('montant') || column.includes('prix') || column.includes('cout')) {
      const n = Number(value);
      if (!isNaN(n)) return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n);
    }
    if (typeof value === 'number') return new Intl.NumberFormat('fr-CA').format(value);
    return String(value);
  }

  private formatCellForExport(column: string, value: any): string {
    if (value === null || value === undefined || value === '') return '';
    if (column.includes('date')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toLocaleString('fr-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    }
    if (column.includes('montant') || column.includes('prix') || column.includes('cout')) {
      const n = Number(value);
      if (!isNaN(n)) return n.toFixed(2);
    }
    return String(value);
  }

  // ─── Export ──────────────────────────────────────────────

  exporterRapport(): void {
    if (!this.listeRapport?.length) return;
    import('xlsx').then(XLSX => {
      const exportData = this.listeRapport.map(item => {
        const row: any = {};
        this.colonnesSelectionnees.forEach(col => {
          row[this.champsTitre[col] || col] = this.formatCellForExport(col, item[col]);
        });
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = this.colonnesSelectionnees.map(col => ({
        wch: Math.max(15, (this.champsTitre[col] || col).length + 2)
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
      XLSX.writeFile(wb, `rapport_${this.rapportSelectionneId}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }).catch(() => this.exporterCSV());
  }

  private exporterCSV(): void {
    const headers = this.colonnesSelectionnees.map(col => this.champsTitre[col] || col).join(',');
    const rows = this.listeRapport.map(item =>
      this.colonnesSelectionnees
        .map(col => `"${String(this.formatCellForExport(col, item[col])).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob(['\ufeff' + [headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `rapport_${this.rapportSelectionneId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  isSelected(filterKey: string, value: any): boolean {
    return this.selectedMap[filterKey]?.includes(value) ?? false;
  }

  // ─── Réinitialiser ───────────────────────────────────────

  reinitialiserFiltres(): void {
    const { dateDebut, dateFin } = this.rapportsService.getCurrentMonthDates();
    this.filtres              = { dateDebut, dateFin, demandeur: '', limit: 500, offset: 0 };
    this.filtresMatSelect     = {};
    this.selectedMap          = {};
    this.dropdowns            = {};
    this.rechercheTitre       = '';
    this.limit                = 500;
    this.offset               = 0;
    this.rapportSelectionneId = 'detaille';
    this.colonneSearch        = '';
    this.colonnesSelectionnees = [
      'item_id', 'formulaire_type', 'titre_document', 'demandeur',
      'bibliotheque', 'statut_bibliotheque', 'statut_acq', 'date_creation'
    ];
    this.filterValuesCache.clear();
    this.lastFilterCacheUpdate.clear();
    this.donneesBrutes   = [];
    this.listeRapport    = [];
    this.totalDonnees    = 0;
    this.dataSource.data = [];
    this.statutFiltre      = null;
    this.statutFiltreActif = false;
    this.statutFiltreLabel = '';
    if (this.paginator) this.paginator.pageIndex = 0;
  }
}