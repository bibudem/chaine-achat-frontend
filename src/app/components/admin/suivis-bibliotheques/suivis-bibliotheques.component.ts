import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { RapportsService, SuiviVue, ItemSuivi } from '../../../services/rapports.service';
import { BibliothequesService } from '../../../services/bibliotheques.service';
import { ListeChoixOptions, formulaireTypeLabel } from '../../../lib/ListeChoixOptions';

/** Regroupement des lignes (en-têtes repliables, comme les vues Mentor). */
type Regroupement = 'bibliotheque' | 'statut_acq' | 'statut_bibliotheque' | 'formulaire_type' | 'fonds_budgetaire';

interface Groupe {
  cle: string;
  libelle: string;
  lignes: ItemSuivi[];
  somme: number;
  /** 2e niveau (ex. Bibliothèque → Fonds budgétaire à imputer, comme Mentor). */
  sousGroupes: Groupe[];
}

interface Colonne { champ: keyof ItemSuivi; cle: string; }

/** Sélection mémorisée par navigateur : un chef de bibliothèque retrouve ses bibliothèques. */
const CLE_SELECTION = 'suivis-bibliotheques.selection';

/**
 * Suivis des bibliothèques — remplace les vues Mentor des chefs de bibliothèque et des
 * bibliothécaires disciplinaires, pour une ou plusieurs bibliothèques à la fois :
 *  - « Montants en attente » : demandes soumises aux ACQ pas encore traitées, montants en
 *    attente d'être saisis dans WMS (Mentor « ACQ - Montant des demandes d'achat ») ;
 *  - « Suivi par statut » : toutes les demandes, regroupées par statut ACQ (Mentor
 *    « BIB - L.S.H. - suivis »).
 */
@Component({
  selector: 'app-suivis-bibliotheques',
  templateUrl: './suivis-bibliotheques.component.html',
  styleUrls: ['./suivis-bibliotheques.component.css']
})
export class SuivisBibliothequesComponent implements OnInit {

  vue: SuiviVue = 'montants';
  regroupement: Regroupement = 'bibliotheque';
  /** '' = pas de 2e niveau. */
  sousRegroupement: Regroupement | '' = 'fonds_budgetaire';
  readonly regroupements: Regroupement[] = ['bibliotheque', 'fonds_budgetaire', 'statut_acq', 'statut_bibliotheque', 'formulaire_type'];

  bibliotheques: string[] = [];
  /** Vide = toutes les bibliothèques. '' = demandes sans bibliothèque. */
  selection: string[] = [];
  menuBibOuvert = false;

  // Filtres — même barre et même ordre que « Mes demandes » : recherche, bibliothèques, type,
  // priorité, dates de création.
  recherche = '';
  filtreType = '';
  filtrePriorite = '';
  filtreDateDebut = '';
  filtreDateFin = '';
  readonly typesFormulaire = new ListeChoixOptions().formulaireTypeOptions;
  readonly priorites = new ListeChoixOptions().prioriteOptions;

  lignes: ItemSuivi[] = [];
  /** Lignes après filtres (avant regroupement) : base du nombre et de la somme totale. */
  filtrees: ItemSuivi[] = [];
  groupes: Groupe[] = [];
  ouverts = new Set<string>();
  isLoading = false;
  erreur = false;

  readonly colonnes: Record<SuiviVue, Colonne[]> = {
    montants: [
      { champ: 'item_id',          cle: 'suivis.col-id' },
      { champ: 'formulaire_type',  cle: 'suivis.col-type' },
      { champ: 'prix_cad',         cle: 'suivis.col-prix-cad' },
      { champ: 'precision_demande', cle: 'suivis.col-precision' },
      { champ: 'titre_document',   cle: 'suivis.col-titre' },
      { champ: 'isbn_issn',        cle: 'suivis.col-isbn' },
      { champ: 'periode_couverte', cle: 'suivis.col-periode' },
      { champ: 'bibliotheque',     cle: 'suivis.col-bibliotheque' },
      { champ: 'priorite_demande', cle: 'suivis.col-priorite' },
      { champ: 'fonds_budgetaire', cle: 'suivis.col-fonds' },
    ],
    statuts: [
      { champ: 'item_id',             cle: 'suivis.col-id' },
      { champ: 'formulaire_type',     cle: 'suivis.col-type' },
      { champ: 'titre_document',      cle: 'suivis.col-titre' },
      { champ: 'priorite_demande',    cle: 'suivis.col-priorite' },
      { champ: 'bibliotheque',        cle: 'suivis.col-bibliotheque' },
      { champ: 'statut_bibliotheque', cle: 'suivis.col-statut-bib' },
      { champ: 'statut_acq',          cle: 'suivis.col-statut-acq' },
      { champ: 'suivi_acq',           cle: 'suivis.col-suivi-acq' },
      { champ: 'note_acq',            cle: 'suivis.col-note-acq' },
      { champ: 'date_creation',       cle: 'suivis.col-cree' },
      { champ: 'cree_par',            cle: 'suivis.col-cree-par' },
      { champ: 'demandeur',           cle: 'suivis.col-demandeur' },
    ],
  };

  constructor(
    private rapportsService: RapportsService,
    private bibliothequesService: BibliothequesService,
    private translate: TranslateService,
    private router: Router,
  ) {}

  /** Ouverte depuis le portail usager (/usager/suivis-bibliotheques) : fil d'Ariane comme les
   *  autres pages du portail ; dans l'Espace gestion, le menu latéral suffit. */
  get estPortail(): boolean { return this.router.url.startsWith('/usager'); }

  ngOnInit(): void {
    try { this.selection = JSON.parse(localStorage.getItem(CLE_SELECTION) || '[]'); } catch { this.selection = []; }
    this.bibliothequesService.getAll().subscribe({
      next: res => this.bibliotheques = (res?.data ?? []).map(b => b.nom).sort((a, b) => a.localeCompare(b, 'fr')),
      error: () => this.bibliotheques = [],
    });
    this.charger();
  }

  @HostListener('document:click')
  fermerMenus(): void { this.menuBibOuvert = false; }

  get colonnesVue(): Colonne[] { return this.colonnes[this.vue]; }

  get total(): number { return this.filtrees.length; }
  get somme(): number { return this.filtrees.reduce((s, l) => s + (Number(l.prix_cad) || 0), 0); }

  get filtresActifs(): boolean {
    return !!(this.recherche || this.selection.length || this.filtreType || this.filtrePriorite
              || this.filtreDateDebut || this.filtreDateFin);
  }

  reinitialiser(): void {
    this.recherche = this.filtreType = this.filtrePriorite = this.filtreDateDebut = this.filtreDateFin = '';
    if (this.selection.length) { this.toutesBibliotheques(); } else { this.regrouper(); }
  }

  get libelleSelection(): string {
    if (!this.selection.length) return this.translate.instant('suivis.toutes-bibliotheques');
    if (this.selection.length === 1) return this.selection[0] || this.translate.instant('suivis.sans-bibliotheque');
    return this.translate.instant('suivis.n-bibliotheques', { n: this.selection.length });
  }

  changerVue(vue: SuiviVue): void {
    if (this.vue === vue) return;
    this.vue = vue;
    // Mêmes regroupements par défaut que les vues Mentor.
    this.regroupement = vue === 'montants' ? 'bibliotheque' : 'statut_acq';
    this.sousRegroupement = vue === 'montants' ? 'fonds_budgetaire' : '';
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

  private selectionModifiee(): void {
    try { localStorage.setItem(CLE_SELECTION, JSON.stringify(this.selection)); } catch { /* stockage indisponible */ }
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
      for (const g of this.groupes) g.sousGroupes = this.grouper(g.lignes, this.sousRegroupement, g.cle + '');
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
        for (const p of l.fonds_parts!) ajouter(p.fonds ?? '', { ...l, fonds_budgetaire: l.fonds_budgetaire, prix_cad: p.prix_cad, fonds_parts: null });
        continue;
      }
      const brut = (l[champ] as string | null) ?? '';
      ajouter(champ === 'formulaire_type' ? formulaireTypeLabel(brut) : brut, l);
    }
    // Groupes nommés par ordre alphabétique, le groupe vide (non renseigné) en dernier.
    return [...parCle.values()].sort((a, b) =>
      !a.libelle ? 1 : !b.libelle ? -1 : a.libelle.localeCompare(b.libelle, 'fr'));
  }

  basculerGroupe(cle: string): void {
    this.ouverts.has(cle) ? this.ouverts.delete(cle) : this.ouverts.add(cle);
  }

  toutOuvrir(ouvrir: boolean): void {
    this.ouverts = new Set(ouvrir ? this.groupes.flatMap(g => [g.cle, ...g.sousGroupes.map(sg => sg.cle)]) : []);
  }

  formatValeur(champ: keyof ItemSuivi, l: ItemSuivi): string {
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

  exporter(): void {
    const cols = this.colonnesVue;
    const entetes = cols.map(c => this.translate.instant(c.cle));
    const lignes = this.filtrees.map(l =>
      Object.fromEntries(cols.map((c, i) => [entetes[i], c.champ === 'prix_cad' ? (Number(l.prix_cad) || null) : this.formatValeur(c.champ, l)])));
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(lignes, { header: entetes });
      ws['!cols'] = entetes.map(e => ({ wch: Math.max(14, e.length + 2) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, this.vue === 'montants' ? 'Montants en attente' : 'Suivi par statut');
      XLSX.writeFile(wb, `suivis_${this.vue}_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }
}
