import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { Router } from "@angular/router";
import { RapportsService, FiltresRapport, ApiResponse } from '../../services/rapports.service';

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
export class RapportsComponent implements OnInit, AfterViewInit {

  // Table data
  dataSource = new MatTableDataSource<any>([]);
  isLoading = false;
  listeRapport: any[] = [];
  totalDonnees = 0;

  // ViewChild references
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) matSort!: MatSort;

  // Column configuration
  champsTitre: any = {};
  champsDisponibles: string[] = [];
  colonnesSelectionnees: string[] = [];

  // Report type
  rapportSelectionneId: TypeRapport['id'] = 'detaille';
  rapportsDisponibles: TypeRapport[] = [];

  // Pagination
  limit = 50;
  offset = 0;

  // Filters
  filtres: FiltresRapport = {
    dateDebut: '',
    dateFin: '',
    demandeur: '',
    limit: 50,
    offset: 0
  };

  filtresMatSelect: Record<string, any[]> = {};

  // Bootstrap multi-select values
  selectedFormTypes: string[] = [];
  selectedBibliotheques: string[] = [];
  selectedStatutsBib: string[] = [];
  selectedStatutsAcq: string[] = [];
  selectedPriorites: string[] = [];

  // Filter options - STATIC DATA (ne pas écraser avec les données du serveur)
  // Ces listes sont utilisées en cache pour les sélecteurs multi-select
  typesFormulaires: string[] = [
    'Modification CCOL',
    'Nouvel abonnement',
    'Nouvel achat unique',
    'PEB Tipasa numérique',
    'Requête ACQ',
    'Springer',
    "Suggestion d'achat"
  ];

  statutsBibliotheque: string[] = [
    'En attente en bibliothèque',
    'En attente',
    'En traitement',
    'Terminé'
  ];

  statutsAcq: string[] = [
    'Soumis aux ACQ',
    'Demande annulée'
  ];

  priorites: string[] = [
    'Urgent',
    'Régulier',
    'Basse'
  ];

  bibliotheques: string[] = [
    'Bibliothèque des lettres et sciences humaines',
    'Bibliothèque des sciences',
    'Bibliothèque de droit',
    "Bibliothèque d'aménagement",
    'Bibliothèque de médecine vétérinaire',
    'Bibliothèque de santé'
  ];

  // Cache pour les valeurs uniques des filtres extraites des données
  private filterValuesCache: Map<string, Set<string>> = new Map();
  private lastFilterCacheUpdate: Map<string, number> = new Map();

  constructor(
    private rapportsService: RapportsService,
    private translate: TranslateService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    // Initialize date range to current month
    const { dateDebut, dateFin } = this.rapportsService.getCurrentMonthDates();
    this.filtres.dateDebut = dateDebut;
    this.filtres.dateFin = dateFin;

    // Initialize field titles and available fields
    this.initTitreChamps();

    // Initialize available report types
    this.initRapportsDisponibles();

    // Set default selected columns
    this.colonnesSelectionnees = [
      'item_id',
      'formulaire_type',
      'demandeur',
      'bibliotheque',
      'statut_bibliotheque',
      'date_creation'
    ];
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.matSort;
  }

  /**
   * Initialize field titles from translation service
   */
  private initTitreChamps(): void {
    this.translate.get('labels-rapport').subscribe(res => {
      this.champsTitre = res;
      this.champsDisponibles = Object.keys(res);
    });
  }

  /**
   * Initialize available report types
   */
  private initRapportsDisponibles(): void {
    this.rapportsDisponibles = [
      {
        id: 'detaille',
        nom: 'Rapport détaillé',
        description: 'Rapport complet avec tous les détails'
      },
      {
        id: 'par-type',
        nom: 'Par type de formulaire',
        description: 'Regroupement par type de formulaire'
      },
      {
        id: 'par-bibliotheque',
        nom: 'Par bibliothèque',
        description: 'Regroupement par bibliothèque'
      },
      {
        id: 'par-demandeur',
        nom: 'Par demandeur',
        description: 'Regroupement par demandeur'
      },
      {
        id: 'mensuel',
        nom: 'Rapport mensuel',
        description: 'Statistiques mensuelles agrégées'
      },
      {
        id: 'par-statut',
        nom: 'Par statut',
        description: 'Regroupement par statut'
      }
    ];
  }

  /**
   * Change the number of results per page
   */
  changerLimit(value: number): void {
    this.limit = value;
    this.filtres.limit = value;
    this.offset = 0;
    this.filtres.offset = 0;
    
    // Update paginator if available
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
  }

  /**
   * Compter les options sélectionnées dans un select
   */
  getSelectedCount(selectId: string): number {
    const selectElement = document.getElementById(selectId) as HTMLSelectElement;
    if (!selectElement) return 0;
    return Array.from(selectElement.selectedOptions).length;
  }

  /**
   * Handle Bootstrap multi-select changes
   */
  onMultiSelectChange(filterId: string, event: any): void {
    const selectElement = event.target as HTMLSelectElement;
    
    // Récupérer les valeurs des options sélectionnées directement
    const selectedValues: string[] = [];
    console.log('🔍 Récupération des options...');
    console.log('   Total options:', selectElement.options.length);
    
    Array.from(selectElement.options).forEach((option: any, idx: number) => {
      console.log(`   Option ${idx}: value="${option.value}", text="${option.text}", selected=${option.selected}`);
      if (option.selected) {
        // Utiliser le text content pour obtenir la vraie valeur
        const value = option.text.trim();
        console.log(`      ✅ Sélectionnée: "${value}"`);
        selectedValues.push(value);
      }
    });
    
    // Normaliser la clé en snake_case pour la cohérence
    const normalizedKey = this.mapKey(filterId);
    
    // DEBUG: Afficher exactement ce qui est sélectionné
    console.log('🔵 Filtre changé:', filterId, '→', normalizedKey);
    console.log('   Valeurs brutes sélectionnées:', selectedValues);
    console.log('   Types des valeurs:', selectedValues.map(v => typeof v + ': "' + v + '"'));
    
    if (selectedValues.length > 0) {
      this.filtresMatSelect[normalizedKey] = selectedValues;
    } else {
      delete this.filtresMatSelect[normalizedKey];
    }
    
    console.log('✅ Filtres actifs:', this.filtresMatSelect);
    
    // Recharger le rapport avec les nouveaux filtres
    this.chargerApercu();
  }

  /**
   * Extraire et cacher les valeurs uniques pour un champ donné
   * Utile pour dynamiquement construire les options de filtres
   */
  private extractAndCacheFilterValues(rows: any[], fieldName: string): string[] {
    if (!rows || rows.length === 0) {
      return [];
    }

    const cacheKey = `cache_${fieldName}`;
    const now = Date.now();
    const cacheAge = now - (this.lastFilterCacheUpdate.get(cacheKey) || 0);

    // Invalider le cache après 5 minutes
    if (cacheAge > 5 * 60 * 1000) {
      this.filterValuesCache.delete(cacheKey);
      this.lastFilterCacheUpdate.delete(cacheKey);
    }

    // Retourner depuis le cache si disponible
    if (this.filterValuesCache.has(cacheKey)) {
      const cachedValues = this.filterValuesCache.get(cacheKey);
      return cachedValues ? Array.from(cachedValues).sort() : [];
    }

    // Extraire et mettre en cache les valeurs uniques
    const uniqueValues = new Set<string>();
    rows.forEach(row => {
      const value = row[fieldName];
      if (value && value !== '') {
        uniqueValues.add(String(value).trim());
      }
    });

    // Sauvegarder en cache
    this.filterValuesCache.set(cacheKey, uniqueValues);
    this.lastFilterCacheUpdate.set(cacheKey, now);

    return Array.from(uniqueValues).sort();
  }

  /**
   * Obtenir les valeurs mises en cache pour un champ donné
   */
  getCachedFilterValues(fieldName: string): string[] {
    const cacheKey = `cache_${fieldName}`;
    const cachedValues = this.filterValuesCache.get(cacheKey);
    return cachedValues ? Array.from(cachedValues).sort() : [];
  }

  /**
   * Mettre à jour les options de filtres multi-select basées sur les données actuelles
   */
  private updateFilterOptions(rows: any[]): void {
    if (!rows || rows.length === 0) return;

    // Extraire les valeurs uniques et les mettre en cache
    const typesFormulaireExtraits = this.extractAndCacheFilterValues(rows, 'formulaire_type');
    const bibliothequesExtraites = this.extractAndCacheFilterValues(rows, 'bibliotheque');
    const statutsBibExtraits = this.extractAndCacheFilterValues(rows, 'statut_bibliotheque');
    const statutsAcqExtraits = this.extractAndCacheFilterValues(rows, 'statut_acq');
    const prioritesExtraites = this.extractAndCacheFilterValues(rows, 'priorite');

    // Fusionner avec les listes statiques si besoin (garde les valeurs statiques + dynamiques)
    if (typesFormulaireExtraits.length > 0) {
      this.typesFormulaires = Array.from(new Set([...this.typesFormulaires, ...typesFormulaireExtraits])).sort();
    }

    if (bibliothequesExtraites.length > 0) {
      this.bibliotheques = Array.from(new Set([...this.bibliotheques, ...bibliothequesExtraites])).sort();
    }

    if (statutsBibExtraits.length > 0) {
      this.statutsBibliotheque = Array.from(new Set([...this.statutsBibliotheque, ...statutsBibExtraits])).sort();
    }

    if (statutsAcqExtraits.length > 0) {
      this.statutsAcq = Array.from(new Set([...this.statutsAcq, ...statutsAcqExtraits])).sort();
    }

    if (prioritesExtraites.length > 0) {
      this.priorites = Array.from(new Set([...this.priorites, ...prioritesExtraites])).sort();
    }

    console.log('🔄 Options de filtres mises à jour');
    console.log('  Types formulaire:', this.typesFormulaires.length);
    console.log('  Bibliothèques:', this.bibliotheques.length);
    console.log('  Statuts bibliothèque:', this.statutsBibliotheque.length);
    console.log('  Statuts ACQ:', this.statutsAcq.length);
    console.log('  Priorités:', this.priorites.length);
  }

  /**
   * Obtenir le nombre total de valeurs mises en cache pour un filtre
   */
  getFilterValueCount(fieldName: string): number {
    const cacheKey = `cache_${fieldName}`;
    const cachedValues = this.filterValuesCache.get(cacheKey);
    return cachedValues ? cachedValues.size : 0;
  }

  /**
   * Toggle column visibility
   */
  toggleColonne(event: any): void {
    const checked = event.target.checked;
    const value = event.target.value;

    if (checked && !this.colonnesSelectionnees.includes(value)) {
      this.colonnesSelectionnees.push(value);
    } else if (!checked) {
      this.colonnesSelectionnees = this.colonnesSelectionnees.filter(col => col !== value);
    }
  }

  /**
   * Load report preview with current filters
   */
  async chargerApercu(): Promise<void> {
    try {
      this.isLoading = true;
      this.listeRapport = [];

      // Build filters object
      const filtres = this.construireFiltres();
      
      console.log('📍 Début chargerApercu() avec filtres:', filtres);
      
      // Fetch report data
      const response = await this.fetchRapportResponse(this.rapportSelectionneId, filtres);

      if (!response?.success) {
        console.warn('Rapport non chargé avec succès');
        return;
      }

      // Normalize response to array
      const rows = Array.isArray(response.data)
        ? response.data
        : response.data ? [response.data] : [];

      console.log('📦 Données brutes reçues:', rows.length, 'lignes');
      if (rows.length > 0) {
        console.log('   Clés disponibles dans première ligne:', Object.keys(rows[0]));
        console.log('   Premier élément:', rows[0]);
      }

      // Mettre à jour les options de filtres basées sur les données
      this.updateFilterOptions(rows);

      // Apply filters
      const rowsFiltres = this.appliquerFiltresMatSelect(rows);

      // Update component state
      this.listeRapport = rowsFiltres;
      this.totalDonnees = rowsFiltres.length;

      // Adapt columns if needed
      this.adapterColonnes(rowsFiltres);

      // Update table data source
      this.dataSource.data = rowsFiltres;
      console.log('📊 Données du tableau (final):', this.dataSource.data.length, 'lignes');

    } catch (err) {
      console.error("Erreur lors du chargement du rapport:", err);
      this.listeRapport = [];
      this.totalDonnees = 0;
      this.dataSource.data = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Build filters object for API call
   */
  private construireFiltres(): FiltresRapport {
    return {
      dateDebut: this.filtres.dateDebut || undefined,
      dateFin: this.filtres.dateFin || undefined,
      demandeur: this.filtres.demandeur || undefined,
      limit: this.limit,
      offset: this.offset
    };
  }

  /**
   * Apply Material Select filters to rows - OPTIMIZED
   * Gère à la fois les textes et les numéros
   */
  private appliquerFiltresMatSelect(rows: any[]): any[] {
    console.log('🟢 DÉBUT FILTRAGE - Lignes:', rows.length, 'Filtres:', this.filtresMatSelect);
    
    let result = [...rows];

    // Si aucun filtre, retourner directement
    if (Object.keys(this.filtresMatSelect).length === 0) {
      console.log('✅ FIN FILTRAGE (pas de filtres) - Lignes:', result.length);
      return result;
    }

    // Appliquer chaque filtre de manière optimisée
    Object.entries(this.filtresMatSelect).forEach(([key, values]: [string, any]) => {
      if (!values || !values.length) return;

      console.log(`🔍 Filtre "${key}":`, values);
      console.log(`   Nombre de valeurs:`, values.length);
      console.log(`   Valeurs à chercher: [${values.map((v: any) => `"${String(v).toLowerCase().trim()}"`).join(', ')}]`);
      
      // Créer un Set de valeurs normalisées (texte)
      const valuesSetText = new Set<string>(values.map((v: any) => {
        const normalized = String(v).toLowerCase().trim();
        return normalized;
      }));
      
      result = result.filter((row, rowIndex) => {
        const val = row[key];
        
        if (val === null || val === undefined || val === '') {
          console.log(`    ⚠️  Row ${rowIndex}: Valeur manquante pour clé "${key}"`);
          return false;
        }
        
        // Normaliser la valeur des données (texte)
        const normalizedVal = String(val).toLowerCase().trim();
        
        // Comparer directement
        const matches = valuesSetText.has(normalizedVal);
        
        if (matches) {
          console.log(`    ✅ Row ${rowIndex}: colonne "${key}" = "${normalizedVal}" ✓`);
        } else {
          console.log(`    ❌ Row ${rowIndex}: colonne "${key}" = "${normalizedVal}" (attendu: [${Array.from(valuesSetText).join(', ')}])`);
        }
        
        return matches;
      });
      
      console.log(`   📊 Après filtre "${key}": ${result.length} lignes restantes`);
    });

    console.log('✅ FIN FILTRAGE - Lignes:', result.length);
    return result;
  }

  /**
   * Map camelCase keys to snake_case for API compatibility
   */
  private mapKey(key: string): string {
    const map: Record<string, string> = {
      formulaireType: 'formulaire_type',
      formulaire_type: 'formulaire_type',
      statutBibliotheque: 'statut_bibliotheque',
      statut_bibliotheque: 'statut_bibliotheque',
      statutAcq: 'statut_acq',
      statut_acq: 'statut_acq',
      dateCreation: 'date_creation',
      date_creation: 'date_creation',
      dateFin: 'date_fin',
      date_fin: 'date_fin',
      bibliotheque: 'bibliotheque',
      priorite: 'priorite',
      demandeur: 'demandeur'
    };
    return map[key] || key;
  }

  /**
   * Adapt columns based on data structure
   */
  private adapterColonnes(rows: any[]): void {
    if (!rows || rows.length === 0) return;

    // Only auto-adapt if no columns are currently selected
    // This prevents overwriting user's column selection
    if (this.colonnesSelectionnees.length === 0) {
      this.colonnesSelectionnees = this.getAvailableColumns(rows);
    }
  }

  /**
   * Get all available columns from data
   */
  private getAvailableColumns(rows: any[]): string[] {
    if (!rows || rows.length === 0) return [];

    const allColumns = new Set<string>();
    
    // Parcourir toutes les lignes pour récupérer toutes les clés
    rows.forEach(row => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach(key => allColumns.add(key));
      }
    });

    // Trier les colonnes avec les colonnes importantes en premier
    const priorityColumns = [
      'id',
      'item_id',
      'formulaire_type',
      'titre_document',
      'demandeur',
      'bibliotheque',
      'statut_bibliotheque',
      'statut_acq',
      'priorite',
      'date_creation',
      'date_modification'
    ];

    const sorted = Array.from(allColumns).sort((a, b) => {
      const aIndex = priorityColumns.indexOf(a);
      const bIndex = priorityColumns.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    return sorted;
  }

  /**
   * Fetch report data based on type
   */
  private async fetchRapportResponse(
    type: TypeRapport['id'],
    filtres: FiltresRapport
  ): Promise<ApiResponse<any>> {

    switch (type) {
      case 'detaille':
        return await this.rapportsService.toPromise(
          this.rapportsService.getRapportDetaille(filtres)
        );

      case 'par-type':
        // TODO: Implement getRapportParType
        return { success: true, data: [], timestamp: new Date().toISOString() };

      case 'par-bibliotheque':
        // TODO: Implement getRapportParBibliotheque
        return { success: true, data: [], timestamp: new Date().toISOString() };

      case 'par-demandeur':
        // TODO: Implement getRapportParDemandeur
        return { success: true, data: [], timestamp: new Date().toISOString() };

      case 'mensuel':
        // TODO: Implement getRapportMensuel
        return { success: true, data: [], timestamp: new Date().toISOString() };

      case 'par-statut':
        // TODO: Implement getRapportParStatut
        return { success: true, data: [], timestamp: new Date().toISOString() };

      default:
        return { success: true, data: [], timestamp: new Date().toISOString() };
    }
  }

  /**
   * Check if column is a status column
   */
  isStatusColumn(col: string): boolean {
    return col === 'statut_bibliotheque' || col === 'statut_acq' || col.includes('statut');
  }

  /**
   * Check if column is a priority column
   */
  isPriorityColumn(col: string): boolean {
    return col === 'priorite';
  }

  /**
   * Get badge CSS class based on status value
   */
  getBadgeClass(value: string): string {
    if (!value) return 'badge badge-secondary';

    const normalizedValue = value.toLowerCase().trim();
    
    const statusClasses: Record<string, string> = {
      'en cours': 'badge badge-warning',
      'en attente': 'badge badge-info',
      'en attente en bibliothèque': 'badge badge-info',
      'en traitement': 'badge badge-warning',
      'complété': 'badge badge-success',
      'terminé': 'badge badge-success',
      'approuvé': 'badge badge-success',
      'rejeté': 'badge badge-danger',
      'annulé': 'badge badge-danger',
      'refusé': 'badge badge-danger',
      'demande annulée': 'badge badge-danger',
      'nouveau': 'badge badge-primary',
      'soumis aux acq': 'badge badge-primary',
      'en révision': 'badge badge-warning'
    };

    return statusClasses[normalizedValue] || 'badge badge-secondary';
  }

  /**
   * Get badge CSS class based on priority value
   */
  getPriorityBadgeClass(value: string): string {
    if (!value) return 'badge badge-secondary';

    const normalizedValue = value.toLowerCase().trim();
    
    const priorityClasses: Record<string, string> = {
      'urgent': 'badge badge-danger',
      'haute': 'badge badge-danger',
      'élevée': 'badge badge-danger',
      'high': 'badge badge-danger',
      'régulier': 'badge badge-warning',
      'moyenne': 'badge badge-warning',
      'medium': 'badge badge-warning',
      'basse': 'badge badge-info',
      'faible': 'badge badge-info',
      'low': 'badge badge-info'
    };

    return priorityClasses[normalizedValue] || 'badge badge-secondary';
  }

  /**
   * Format cell value based on column type
   */
  formatCell(column: string, value: any): string {
    // Handle null/undefined values
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    // Format dates
    if (column.includes('date')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('fr-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }

    // Format currency amounts
    if (column.includes('montant') || column.includes('prix') || column.includes('cout')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return new Intl.NumberFormat('fr-CA', {
          style: 'currency',
          currency: 'CAD'
        }).format(num);
      }
    }

    // Format percentages
    if (column.includes('pourcentage') || column.includes('taux')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return new Intl.NumberFormat('fr-CA', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 2
        }).format(num / 100);
      }
    }

    // Format numbers
    if (typeof value === 'number') {
      return new Intl.NumberFormat('fr-CA').format(value);
    }

    // Return string value
    return String(value);
  }

  /**
   * Export report to Excel
   */
  exporterRapport(): void {
    if (!this.listeRapport || this.listeRapport.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    try {
      // Dynamically import xlsx library
      import('xlsx').then(XLSX => {
        // Prepare data for export
        const exportData = this.listeRapport.map(item => {
          const row: any = {};
          this.colonnesSelectionnees.forEach(col => {
            row[this.champsTitre[col] || col] = this.formatCellForExport(col, item[col]);
          });
          return row;
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        const colWidths = this.colonnesSelectionnees.map(col => ({
          wch: Math.max(15, (this.champsTitre[col] || col).length + 2)
        }));
        ws['!cols'] = colWidths;

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rapport');

        // Generate filename with timestamp
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `rapport_${this.rapportSelectionneId}_${dateStr}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
        
        console.log('Export Excel réussi:', filename);
      }).catch(err => {
        console.error('Erreur lors du chargement de la bibliothèque XLSX:', err);
        // Fallback: Use basic CSV export
        this.exporterCSV();
      });
    } catch (err) {
      console.error('Erreur lors de l\'export Excel:', err);
      // Fallback: Use basic CSV export
      this.exporterCSV();
    }
  }

  /**
   * Format cell value for Excel export (without HTML tags)
   */
  private formatCellForExport(column: string, value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Format dates
    if (column.includes('date')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('fr-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }

    // Format currency amounts (return number for Excel)
    if (column.includes('montant') || column.includes('prix') || column.includes('cout')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return num.toFixed(2);
      }
    }

    return String(value);
  }

  /**
   * Fallback CSV export if XLSX is not available
   */
  private exporterCSV(): void {
    try {
      // Prepare CSV content
      const headers = this.colonnesSelectionnees.map(col => 
        this.champsTitre[col] || col
      ).join(',');

      const rows = this.listeRapport.map(item => 
        this.colonnesSelectionnees.map(col => {
          const value = this.formatCellForExport(col, item[col]);
          // Escape commas and quotes for CSV
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      );

      const csvContent = [headers, ...rows].join('\n');

      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `rapport_${this.rapportSelectionneId}_${dateStr}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Export CSV réussi:', filename);
    } catch (err) {
      console.error('Erreur lors de l\'export CSV:', err);
    }
  }

  /**
   * Reset all filters to default values
   */
  reinitialiserFiltres(): void {
    const { dateDebut, dateFin } = this.rapportsService.getCurrentMonthDates();
    this.filtres = {
      dateDebut,
      dateFin,
      demandeur: '',
      limit: 50,
      offset: 0
    };
    this.filtresMatSelect = {};
    this.limit = 50;
    this.offset = 0;
    this.rapportSelectionneId = 'detaille';
    
    // Reset Bootstrap multi-select values
    this.selectedFormTypes = [];
    this.selectedBibliotheques = [];
    this.selectedStatutsBib = [];
    this.selectedStatutsAcq = [];
    this.selectedPriorites = [];
    
    // Vider le cache des filtres
    this.filterValuesCache.clear();
    this.lastFilterCacheUpdate.clear();
    
    // Reset table data
    this.listeRapport = [];
    this.totalDonnees = 0;
    this.dataSource.data = [];
    
    // Reset paginator if exists
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
  }
}