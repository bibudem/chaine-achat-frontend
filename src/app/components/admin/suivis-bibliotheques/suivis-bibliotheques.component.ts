import { Component, HostListener, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RapportsService, SuiviVue, ItemSuivi } from '../../../services/rapports.service';
import { BibliothequesService } from '../../../services/bibliotheques.service';
import { ListeChoixOptions, formulaireTypeLabel } from '../../../lib/ListeChoixOptions';

/** Champ servant à regrouper les lignes (en-têtes repliables, comme les vues Mentor). */
type Regroupement = 'bibliotheque' | 'statut_acq' | 'statut_bibliotheque' | 'formulaire_type' | 'fonds_budgetaire';

/** Colonne du tableau : son libellé est la clé i18n « suivis.colonnes.<champ> ». */
type Colonne = keyof ItemSuivi;

interface Groupe {
  cle: string;
  libelle: string;
  lignes: ItemSuivi[];
  somme: number;
  /** 2e niveau (ex. Bibliothèque → Fonds budgétaire à imputer, comme Mentor). */
  sousGroupes: Groupe[];
}

/** Sélection mémorisée par navigateur : un chef de bibliothèque retrouve ses bibliothèques. */
const CLE_STOCKAGE_SELECTION = 'suivis-bibliotheques.selection';

/** Colonnes affichées (et exportées) pour chaque vue. */
const COLONNES: Record<SuiviVue, Colonne[]> = {
  montants: ['item_id', 'formulaire_type', 'prix_cad', 'precision_demande', 'titre_document', 'isbn_issn',
             'periode_couverte', 'bibliotheque', 'priorite_demande', 'fonds_budgetaire'],
  statuts:  ['item_id', 'formulaire_type', 'titre_document', 'priorite_demande', 'bibliotheque',
             'statut_bibliotheque', 'statut_acq', 'suivi_acq', 'note_acq', 'date_creation', 'cree_par', 'demandeur'],
};

/** Colonnes à texte long : elles se partagent la largeur restante et passent à la ligne. */
const COLONNES_LARGES: Colonne[] = ['titre_document', 'suivi_acq', 'note_acq'];

/** Regroupements par défaut de chaque vue (mêmes que les vues Mentor). */
const REGROUPEMENTS_DEFAUT: Record<SuiviVue, { regroupement: Regroupement; sousRegroupement: Regroupement | '' }> = {
  montants: { regroupement: 'bibliotheque', sousRegroupement: 'fonds_budgetaire' },
  statuts:  { regroupement: 'statut_acq',   sousRegroupement: '' },
};

/**
 * Suivis des bibliothèques — remplace les vues Mentor des chefs de bibliothèque et des
 * bibliothécaires disciplinaires, pour une ou plusieurs bibliothèques à la fois :
 *  - « Montants en attente de saisie » : demandes soumises aux ACQ pas encore traitées
 *    (Mentor « ACQ - Montant des demandes d'achat ») ;
 *  - « Suivi par statut » : toutes les demandes, regroupées par statut ACQ
 *    (Mentor « BIB - L.S.H. - suivis »).
 * Textes : section « suivis » de assets/i18n (page, vues, aide, filtres, regroupements,
 * actions, resultats, colonnes, export).
 */
@Component({
  selector: 'app-suivis-bibliotheques',
  templateUrl: './suivis-bibliotheques.component.html',
  styleUrls: ['./suivis-bibliotheques.component.css']
})
export class SuivisBibliothequesComponent implements OnInit {

  // ── Vue et regroupement ─────────────────────────────────
  vue: SuiviVue = 'montants';
  regroupement: Regroupement = REGROUPEMENTS_DEFAUT.montants.regroupement;
  /** '' = pas de 2e niveau. */
  sousRegroupement: Regroupement | '' = REGROUPEMENTS_DEFAUT.montants.sousRegroupement;
  readonly regroupements: Regroupement[] = ['bibliotheque', 'fonds_budgetaire', 'statut_acq', 'statut_bibliotheque', 'formulaire_type'];
  readonly colonnesLarges = COLONNES_LARGES;

  // ── Filtres ─────────────────────────────────────────────
  bibliotheques: string[] = [];
  /** Vide = toutes les bibliothèques. '' = demandes sans bibliothèque. */
  selection: string[] = [];
  menuBibOuvert = false;
  recherche = '';
  filtreType = '';
  filtrePriorite = '';
  filtreDateDebut = '';
  filtreDateFin = '';
  readonly typesFormulaire = new ListeChoixOptions().formulaireTypeOptions;
  readonly priorites = new ListeChoixOptions().prioriteOptions;

  // ── Données ─────────────────────────────────────────────
  lignes: ItemSuivi[] = [];
  /** Lignes après filtres (avant regroupement) : base du nombre et de la somme totale. */
  filtrees: ItemSuivi[] = [];
  groupes: Groupe[] = [];
  ouverts = new Set<string>();
  isLoading = false;
  erreur = false;

  constructor(
    private rapportsService: RapportsService,
    private bibliothequesService: BibliothequesService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    try { this.selection = JSON.parse(localStorage.getItem(CLE_STOCKAGE_SELECTION) || '[]'); } catch { this.selection = []; }
    this.bibliothequesService.getAll().subscribe({
      next: res => this.bibliotheques = (res?.data ?? []).map(b => b.nom).sort((a, b) => a.localeCompare(b, 'fr')),
      error: () => this.bibliotheques = [],
    });
    this.charger();
  }

  @HostListener('document:click')
  fermerMenus(): void { this.menuBibOuvert = false; }

  // ── Affichage ───────────────────────────────────────────
  get colonnesVue(): Colonne[] { return COLONNES[this.vue]; }
  get total(): number { return this.filtrees.length; }
  get somme(): number { return this.filtrees.reduce((s, l) => s + (Number(l.prix_cad) || 0), 0); }

  get libelleSelection(): string {
    if (!this.selection.length) return this.translate.instant('suivis.filtres.toutes-bibliotheques');
    if (this.selection.length === 1) return this.selection[0] || this.translate.instant('suivis.filtres.sans-bibliotheque');
    return this.translate.instant('suivis.filtres.n-bibliotheques', { n: this.selection.length });
  }

  libelleColonne(champ: Colonne): string { return 'suivis.colonnes.' + champ; }
  libelleRegroupement(champ: Regroupement | ''): string { return 'suivis.regroupements.' + champ; }

  formatValeur(champ: Colonne, l: ItemSuivi): string {
    const v = l[champ];
    if (v === null || v === undefined || v === '') return '';
    if (champ === 'prix_cad') return this.formatMontant(Number(v));
    if (champ === 'date_creation') return new Date(String(v)).toLocaleDateString('fr-CA');
    if (champ === 'formulaire_type') return formulaireTypeLabel(String(v));
    return String(v);
  }

  formatMontant(n: number): string {
    return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
  }

  // ── Actions ─────────────────────────────────────────────
  changerVue(vue: SuiviVue): void {
    if (this.vue === vue) return;
    this.vue = vue;
    ({ regroupement: this.regroupement, sousRegroupement: this.sousRegroupement } = REGROUPEMENTS_DEFAUT[vue]);
    this.charger();
  }

  basculerBibliotheque(nom: string, coche: boolean): void {
    this.selection = coche ? [...this.selection, nom] : this.selection.filter(b => b !== nom);
    this.selectionModifiee();
  }

  toutesBibliotheques(): void {
    this.selection = [];
    this.selectionModifiee();
  }

  reinitialiser(): void {
    this.recherche = this.filtreType = this.filtrePriorite = this.filtreDateDebut = this.filtreDateFin = '';
    if (this.selection.length) { this.toutesBibliotheques(); } else { this.regrouper(); }
  }

  basculerGroupe(cle: string): void {
    this.ouverts.has(cle) ? this.ouverts.delete(cle) : this.ouverts.add(cle);
  }

  toutOuvrir(ouvrir: boolean): void {
    this.ouverts = new Set(ouvrir ? this.groupes.flatMap(g => [g.cle, ...g.sousGroupes.map(sg => sg.cle)]) : []);
  }

  exporter(): void {
    const cols = this.colonnesVue;
    const entetes = cols.map(c => this.translate.instant(this.libelleColonne(c)));
    const lignes = this.filtrees.map(l =>
      Object.fromEntries(cols.map((c, i) => [entetes[i], c === 'prix_cad' ? (Number(l.prix_cad) || null) : this.formatValeur(c, l)])));
    const feuille = this.translate.instant(this.vue === 'montants' ? 'suivis.export.feuille-montants' : 'suivis.export.feuille-statuts');
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(lignes, { header: entetes });
      ws['!cols'] = entetes.map(e => ({ wch: Math.max(14, e.length + 2) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, feuille);
      XLSX.writeFile(wb, `suivis_${this.vue}_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }

  // ── Chargement, filtres et regroupement ─────────────────
  private selectionModifiee(): void {
    try { localStorage.setItem(CLE_STOCKAGE_SELECTION, JSON.stringify(this.selection)); } catch { /* stockage indisponible */ }
    this.charger();
  }

  charger(): void {
    this.isLoading = true;
    this.erreur = false;
    this.rapportsService.getSuivisBibliotheques(this.vue, this.selection).subscribe({
      next: res => {
        this.lignes = res?.data ?? [];
        this.erreur = !res?.success;
        this.isLoading = false;
        this.regrouper();
      },
      error: () => { this.lignes = []; this.erreur = true; this.isLoading = false; this.regrouper(); },
    });
  }

  regrouper(): void {
    const terme = this.recherche.trim().toLowerCase();
    const jour = (d: string | null) => (d ?? '').slice(0, 10);
    const filtrees = this.filtrees = this.lignes.filter(l =>
      (!terme || [l.item_id, l.titre_document, l.isbn_issn, l.demandeur, l.cree_par, l.fonds_budgetaire, l.precision_demande]
                   .some(v => v != null && String(v).toLowerCase().includes(terme)))
      && (!this.filtreType || l.formulaire_type === this.filtreType)
      && (!this.filtrePriorite || l.priorite_demande === this.filtrePriorite)
      && (!this.filtreDateDebut || jour(l.date_creation) >= this.filtreDateDebut)
      && (!this.filtreDateFin || jour(l.date_creation) <= this.filtreDateFin));

    this.groupes = this.grouper(filtrees, this.regroupement, '');
    if (this.sousRegroupement && this.sousRegroupement !== this.regroupement) {
      for (const g of this.groupes) g.sousGroupes = this.grouper(g.lignes, this.sousRegroupement, g.cle + '');
    }
  }

  /** prefixe : rend la clé d'un sous-groupe unique (ouverture/fermeture indépendante). */
  private grouper(lignes: ItemSuivi[], champ: Regroupement, prefixe: string): Groupe[] {
    const parCle = new Map<string, Groupe>();
    const ajouter = (libelle: string, l: ItemSuivi) => {
      let g = parCle.get(libelle);
      if (!g) { g = { cle: prefixe + libelle, libelle, lignes: [], somme: 0, sousGroupes: [] }; parCle.set(libelle, g); }
      g.lignes.push(l);
      g.somme += Number(l.prix_cad) || 0;
    };
    for (const l of lignes) {
      // Fonds partagés : la demande apparaît sous chacun de ses fonds avec la part de ce fonds
      // (ex. 30 % sous MO-097, 70 % sous MO-035) — la somme par fonds n'est pas gonflée.
      if (champ === 'fonds_budgetaire' && (l.fonds_parts?.length ?? 0) > 1) {
        for (const p of l.fonds_parts!) ajouter(p.fonds ?? '', { ...l, prix_cad: p.prix_cad, fonds_parts: null });
        continue;
      }
      const brut = (l[champ] as string | null) ?? '';
      ajouter(champ === 'formulaire_type' ? formulaireTypeLabel(brut) : brut, l);
    }
    // Groupes nommés par ordre alphabétique, le groupe vide (non renseigné) en dernier.
    return [...parCle.values()].sort((a, b) =>
      !a.libelle ? 1 : !b.libelle ? -1 : a.libelle.localeCompare(b.libelle, 'fr'));
  }
}
