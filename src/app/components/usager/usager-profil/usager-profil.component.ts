import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ReponsesService, DemandeUsager, DemandePublique } from '../../../services/reponses.service';
import { formulaireTypeIcon } from '../../../lib/ListeChoixOptions';
import { demandeBadgeStatut, estAcqEnAttenteDefaut } from '../../../lib/DemandeStatut';
import { ouvrirFenetreImpression, ecrireDocumentImpression, RangeeImpression } from '../../../lib/PrintBordereau';

@Component({
  selector:    'app-usager-profil',
  templateUrl: './usager-profil.component.html',
  styleUrls:   ['./usager-profil.component.css']
})
export class UsagerProfilComponent implements OnInit {

  demandes: DemandeUsager[] = [];
  loading              = false;
  errorMessage         = '';
  successMessage       = '';
  confirmingDeleteId: number | null = null;
  deleting             = false;
  deleteError          = false;

  expandedId: number | null = null;
  loadingDetails = false;
  expandedData: { label: string; value: string }[] = [];

  private readonly FIELD_LABELS: Record<string, string> = {
    // usager_nom ≠ demandeur pour Suggestion d'achat : demandeur est la personne qui a
    // soumis le formulaire (TechDoc), usager_nom la personne concernée par la suggestion.
    usager_nom: "Nom de l'usager", demandeur: 'Nom',
    usager_statut: 'Statut', statut: 'Statut',
    usager_faculte: 'Faculté / Département',
    usager_courriel: 'Courriel', courriel: 'Courriel',
    bibliotheque: 'Bibliothèque',
    fonds_budgetaire: 'Fonds budgétaire',
    priorite_demande: 'Priorité',
    bibliothecaire_disciplinaire: 'Bibliothécaire disciplinaire',
    categorie_document: 'Catégorie de document',
    titre_document: 'Titre',
    sous_titre: 'Sous-titre',
    auteur: 'Auteur(s)',
    editeur: 'Éditeur',
    date_publication: 'Date de publication',
    isbn_issn: 'ISBN / ISSN',
    format_support: 'Format / Support',
    source_information: 'Source (URL)',
    prix_devise_originale: 'Prix (devise originale)',
    devise_originale: 'Devise',
    prix_cad: 'Prix (CAD)',
    gobi_vu_format_numerique: 'GOBI vu format numérique',
    reference_tipasa: 'Référence Tipasa',
    besoin_specifique_format: 'Besoin spécifique format',
    permalien_sofia: 'Permalien Sofia',
    fournisseur_contacte_sans_succes: 'Fournisseur contacté sans succès',
    exemplaire_detenu: 'Exemplaire détenu',
    verification_caeb: 'Vérification CAEB',
    verification_sqla: 'Vérification SQLA',
    verification_emma: 'Vérification EMMA',
    format_pret_numerique: 'Format prêt numérique',
    fonds_sn_projet: 'Fonds S/N projet',
    localisation_emplacement: 'Localisation / Emplacement',
    nombre_titres_inclus: 'Nombre de titres inclus',
    personne_a_aviser_courriel: 'Personne à aviser (courriel)',
    creation_notice_dtdm: 'Création notice DTDM',
    reserve_cours: 'Réserve de cours',
    reserve_cours_sigle: 'Sigle du cours',
    reserve_cours_session: 'Session',
    reserve_cours_enseignant: 'Enseignant(e)',
    date_requise_cours: 'Date requise (cours)',
    aviser_reservation: 'Aviser à la réservation',
    aviser_reception: 'Aviser à la réception',
    note_usager: 'Note usager',
    note_commentaire: 'Note / Commentaire',
    note_acq: 'Note de la bibliothèque',
    statut_bibliotheque: 'Statut de la demande',
    bibliotheque_note_interne: 'Note interne bibliothèque',
  };

  private readonly FIELD_ORDER = [
    'usager_nom', 'demandeur', 'usager_statut', 'statut', 'usager_faculte', 'usager_courriel', 'courriel',
    'bibliotheque', 'fonds_budgetaire', 'priorite_demande', 'bibliothecaire_disciplinaire',
    'categorie_document', 'titre_document', 'sous_titre', 'auteur', 'editeur',
    'date_publication', 'isbn_issn', 'format_support', 'source_information',
    'prix_devise_originale', 'devise_originale', 'prix_cad',
    'gobi_vu_format_numerique', 'reference_tipasa',
    'besoin_specifique_format', 'permalien_sofia', 'fournisseur_contacte_sans_succes',
    'exemplaire_detenu', 'verification_caeb', 'verification_sqla', 'verification_emma',
    'format_pret_numerique', 'fonds_sn_projet',
    'localisation_emplacement', 'nombre_titres_inclus', 'personne_a_aviser_courriel',
    'creation_notice_dtdm',
    'reserve_cours', 'reserve_cours_sigle', 'reserve_cours_session', 'reserve_cours_enseignant',
    'date_requise_cours', 'aviser_reservation', 'aviser_reception',
    'note_usager', 'note_commentaire', 'note_acq',
    'statut_bibliotheque', 'bibliotheque_note_interne',
  ];

  filtreRecherche    = '';
  filtreType         = '';
  filtreBibliotheque = '';
  filtreStatut       = '';
  filtreDateDebut    = '';
  filtreDateFin      = '';

  // Décoché : affiche TOUTES les demandes du système (lecture seule, transparence — voir
  // ReponsesModel.findAllPublic) au lieu de seulement celles de l'usager connecté. Même
  // barre de filtres, même pagination — seules la source des données et les actions
  // disponibles par ligne changent, pour une expérience cohérente.
  mesDemandesSeulement = true;
  demandesPubliques: DemandePublique[] = [];
  totalPublic     = 0;
  loadingPublic   = false;

  currentPage          = 1;
  readonly itemsPerPage = 10;

  private rechercheSubject = new Subject<string>();

  get prenom():   string { return sessionStorage.getItem('prenomAdmin')   ?? ''; }
  get nom():      string { return sessionStorage.getItem('nomAdmin')       ?? ''; }
  get email():    string { return sessionStorage.getItem('courrielAdmin')  ?? ''; }
  get initiales(): string {
    return `${this.prenom.charAt(0)}${this.nom.charAt(0)}`.toUpperCase();
  }

  get typesDisponibles(): string[] {
    return [...new Set(this.demandes.map(d => d.type_formulaire))].sort();
  }

  get bibliothequesDisponibles(): string[] {
    return [...new Set(this.demandes.map(d => d.bibliotheque).filter((b): b is string => !!b))].sort();
  }

  get demandesFiltrees(): DemandeUsager[] {
    return this.demandes.filter(d => {
      const rechercheOk    = !this.filtreRecherche ||
        (d.titre_document ?? '').toLowerCase().includes(this.filtreRecherche.toLowerCase());
      const typeOk         = !this.filtreType         || d.type_formulaire === this.filtreType;
      const bibliothequeOk = !this.filtreBibliotheque || d.bibliotheque === this.filtreBibliotheque;
      const statutOk       = !this.filtreStatut       || demandeBadgeStatut(d) === this.filtreStatut;
      const dateDebutOk    = !this.filtreDateDebut    || (d.dateA ?? '') >= this.filtreDateDebut;
      const dateFinOk      = !this.filtreDateFin      || (d.dateA ?? '').substring(0, 10) <= this.filtreDateFin;
      return rechercheOk && typeOk && bibliothequeOk && statutOk && dateDebutOk && dateFinOk;
    });
  }

  get totalPages(): number {
    return this.mesDemandesSeulement
      ? Math.ceil(this.demandesFiltrees.length / this.itemsPerPage)
      : Math.ceil(this.totalPublic / this.itemsPerPage);
  }

  get demandesPage(): DemandeUsager[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.demandesFiltrees.slice(start, start + this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    if (!this.mesDemandesSeulement) this.chargerPublique();
  }

  constructor(private reponsesService: ReponsesService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const state = history.state;
    if (state?.message) {
      this.successMessage = state.message;
      setTimeout(() => { this.successMessage = ''; }, 4000);
    }
    if (!this.email) { this.errorMessage = 'Session introuvable.'; return; }
    this.loading = true;
    this.reponsesService.getByEmail(this.email).subscribe({
      next: (res) => { this.demandes = res.data; this.loading = false; },
      error: ()   => { this.errorMessage = 'Impossible de charger vos demandes.'; this.loading = false; }
    });

    this.rechercheSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      if (!this.mesDemandesSeulement) this.chargerPublique();
    });

    // Arrivée depuis une carte du tableau de bord d'accueil : ?toutes=1 décoche la case
    // d'entrée (toutes les demandes du système), ?statut=attente|soumise|traitee présélectionne
    // le filtre de statut correspondant — dans l'un ou l'autre mode.
    const statutParam = this.route.snapshot.queryParamMap.get('statut');
    if (statutParam === 'attente' || statutParam === 'soumise' || statutParam === 'traitee') {
      this.filtreStatut = statutParam;
    }
    if (this.route.snapshot.queryParamMap.get('toutes') === '1') {
      this.mesDemandesSeulement = false;
      this.chargerPublique();
    }
  }

  // ── Bascule « Mes demandes » / « Toutes les demandes » ──────────────
  onToggleMesDemandes(): void {
    this.currentPage = 1;
    this.errorMessage = '';
    if (!this.mesDemandesSeulement) this.chargerPublique();
  }

  chargerPublique(): void {
    this.loadingPublic = true;
    this.errorMessage = '';
    const offset = (this.currentPage - 1) * this.itemsPerPage;
    this.reponsesService.getAllPublic({
      limit: this.itemsPerPage, offset,
      search:           this.filtreRecherche    || undefined,
      type_formulaire:  this.filtreType         || undefined,
      bibliotheque:     this.filtreBibliotheque || undefined,
      statut:           (this.filtreStatut || undefined) as 'attente' | 'soumise' | 'traitee' | undefined,
      dateDebut:        this.filtreDateDebut    || undefined,
      dateFin:          this.filtreDateFin      || undefined,
    }).subscribe({
      next: (res) => { this.demandesPubliques = res.data; this.totalPublic = res.total; this.loadingPublic = false; },
      error: ()   => { this.errorMessage = 'Impossible de charger les demandes.'; this.loadingPublic = false; }
    });
  }

  // Champs texte/dates/selects : réinitialise la page et, en mode « toutes », recharge
  // depuis le serveur — en mode « mes demandes », le filtrage est déjà réactif (getter).
  onSearchChange(): void {
    this.rechercheSubject.next(this.filtreRecherche);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    if (!this.mesDemandesSeulement) this.chargerPublique();
  }

  resetFilters(): void {
    this.filtreRecherche    = '';
    this.filtreType         = '';
    this.filtreBibliotheque = '';
    this.filtreStatut       = '';
    this.filtreDateDebut    = '';
    this.filtreDateFin      = '';
    this.onFilterChange();
  }

  statutKeyPublique(d: DemandePublique): string {
    return demandeBadgeStatut(d);
  }

  statutLabelPublique(d: DemandePublique): string {
    if (estAcqEnAttenteDefaut(d) || this.statutKeyPublique(d) === 'soumise') return 'ACQ en attente';
    const labels: Record<string, string> = {
      traitee: 'ACQ traité', attente: 'Non envoyé aux ACQ',
    };
    return labels[this.statutKeyPublique(d)];
  }

  /** Classe du badge top de carte (liste « Toutes les demandes ») — un seul badge « ACQ en
   *  attente » tant que les ACQ n'ont pas réellement statué : ni suivi_acq renseigné du
   *  tout (« soumise »), ni encore sur les valeurs par défaut du formulaire de décision
   *  (voir estAcqEnAttenteDefaut) ne comptent comme traité. */
  badgeClassPublique(d: DemandePublique): string {
    const key = this.statutKeyPublique(d);
    if (key === 'soumise' || estAcqEnAttenteDefaut(d)) return 'up-badge--acqAttente';
    return 'up-badge--' + key;
  }

  statutKey(d: DemandeUsager): string {
    if (d.statut_approbation === 'refuse') return 'refuse';
    if (d.suivi_acq) return 'traitee';
    if (d.statut_bibliotheque === 'Soumettre aux ACQ') return 'soumise';
    if (d.statut_approbation === 'approuve') return 'cours';
    return 'attente';
  }

  /** Classe + libellé du badge top de carte (liste « Mes demandes ») — un seul badge « ACQ en
   *  attente » tant que les ACQ n'ont pas réellement statué : ni suivi_acq vide, ni encore
   *  sur les valeurs par défaut du formulaire de décision (estAcqEnAttenteDefaut) ne comptent
   *  comme traité. */
  badgeClass(d: DemandeUsager): string {
    if (d.statut_bibliotheque !== 'Soumettre aux ACQ') return 'up-badge--attente';
    if (!d.suivi_acq || estAcqEnAttenteDefaut(d)) return 'up-badge--acqAttente';
    return 'up-badge--traitee';
  }

  badgeLabel(d: DemandeUsager): string {
    if (d.statut_bibliotheque !== 'Soumettre aux ACQ') return 'Non envoyé aux ACQ';
    if (!d.suivi_acq || estAcqEnAttenteDefaut(d)) return 'ACQ en attente';
    return 'ACQ traité';
  }

  routeFormulaire(d: DemandeUsager): string {
    const map: Record<string, string> = {
      'Nouvel achat unique':          'nouvel-achat',
      'Modification et CCOL':         'modification-ccol',
      'Nouvel abonnement':            'nouvel-abonnement',
      'PEB Tipasa numérique':         'peb-tipasa-numerique',
      'Requête ACQ Accessibilité':    'requete-accessibilite',
      "Suggestion d'achat - Usager": 'suggestion-bib',
    };
    return '/usager/' + (map[d.type_formulaire] ?? 'demande');
  }

  typeIcon(type: string): string {
    return formulaireTypeIcon(type);
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  peutSupprimer(d: DemandeUsager): boolean {
    if (d.statut_approbation === 'refuse') return false;
    return d.statut_bibliotheque !== 'Soumettre aux ACQ';
  }

  toggleDetails(d: DemandeUsager): void {
    if (this.expandedId === d.id) {
      this.expandedId = null;
      this.expandedData = [];
      return;
    }
    this.expandedId = d.id;
    this.expandedData = [];
    this.loadingDetails = true;
    this.reponsesService.getReponseById(d.id).subscribe({
      next: (row) => {
        const raw = row.reponses ?? {};
        const flat: Record<string, any> = raw.baseData
          ? { ...raw.baseData, ...(raw.specificData ?? {}) }
          : { ...raw };
        this.expandedData = this.FIELD_ORDER
          .filter(k => this.FIELD_LABELS[k] && flat[k] !== null && flat[k] !== undefined && flat[k] !== '' && flat[k] !== false)
          .map(k => ({
            label: this.FIELD_LABELS[k],
            value: typeof flat[k] === 'boolean' ? 'Oui' : String(flat[k]),
          }));
        this.loadingDetails = false;
      },
      error: () => { this.loadingDetails = false; }
    });
  }

  imprimerDemande(d: DemandeUsager): void {
    // La fenêtre doit s'ouvrir de façon SYNCHRONE dans le geste de clic, sinon
    // les navigateurs (Safari en particulier) la bloquent silencieusement si elle
    // n'ouvre qu'après le retour d'un appel réseau asynchrone.
    const fenetre = ouvrirFenetreImpression();
    if (!fenetre) {
      this.errorMessage = "Impossible d'ouvrir la fenêtre d'impression : vérifiez que les fenêtres popup sont autorisées pour ce site.";
      return;
    }

    // Réutilise les détails déjà chargés si la carte est actuellement dépliée pour
    // cette demande, sinon on les récupère avant d'imprimer.
    if (this.expandedId === d.id && this.expandedData.length) {
      this.ecrireImpression(fenetre, d, this.expandedData);
      return;
    }
    this.reponsesService.getReponseById(d.id).subscribe({
      next: (row) => {
        const raw = row.reponses ?? {};
        const flat: Record<string, any> = raw.baseData
          ? { ...raw.baseData, ...(raw.specificData ?? {}) }
          : { ...raw };
        const data = this.FIELD_ORDER
          .filter(k => this.FIELD_LABELS[k] && flat[k] !== null && flat[k] !== undefined && flat[k] !== '' && flat[k] !== false)
          .map(k => ({
            label: this.FIELD_LABELS[k],
            value: typeof flat[k] === 'boolean' ? 'Oui' : String(flat[k]),
          }));
        this.ecrireImpression(fenetre, d, data);
      },
      error: () => this.ecrireImpression(fenetre, d, [])
    });
  }

  exportingExcel = false;

  exporterExcel(): void {
    // Réservé au mode « Mes demandes » — l'export « Toutes les demandes » récupérerait le
    // détail complet de demandes qui ne sont pas les siennes (voir getReponseById), ce que
    // l'endpoint public évite volontairement.
    if (!this.mesDemandesSeulement || !this.demandesFiltrees.length || this.exportingExcel) return;
    const liste = this.demandesFiltrees;
    this.exportingExcel = true;

    // Un item peut avoir des dizaines de champs propres à son type (auteur, ISBN, notes
    // d'accessibilité, réserve de cours, etc.) qui ne sont pas dans la liste sommaire déjà
    // en mémoire — on va donc chercher le détail complet de chaque demande, comme le fait
    // déjà toggleDetails()/imprimerDemande() pour une seule demande à la fois.
    forkJoin(
      liste.map(d => this.reponsesService.getReponseById(d.id).pipe(
        catchError(() => of(null))
      ))
    ).subscribe(reponses => {
      const details = reponses.map(row => {
        const raw = row?.reponses ?? {};
        return raw.baseData ? { ...raw.baseData, ...(raw.specificData ?? {}) } : { ...raw };
      });
      const exportData = liste.map((d, i) => this.construireLigneExport(d, details[i]));
      this.exportingExcel = false;

      import('xlsx').then(XLSX => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        ws['!cols'] = Object.keys(exportData[0]).map(k => ({ wch: Math.max(15, k.length + 2) }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Mes demandes');
        XLSX.writeFile(wb, `mes_demandes_${new Date().toISOString().split('T')[0]}.xlsx`);
      }).catch(() => this.exporterCSV(exportData));
    });
  }

  /** Champs de type date parmi FIELD_ORDER — formatés en AAAA-MM-JJ à l'export, comme les
   *  autres colonnes de date (voir formatDateExport). */
  private readonly DATE_FIELDS = new Set(['date_publication', 'date_requise_cours']);

  /** Formate une date en AAAA-MM-JJ pour l'export Excel/CSV (indépendant de formatDate(),
   *  utilisé lui pour l'affichage à l'écran en français). Lit directement les 10 premiers
   *  caractères d'une chaîne ISO plutôt que de repasser par un objet Date, pour éviter tout
   *  décalage d'un jour causé par le fuseau horaire local. */
  private formatDateExport(d: string | null | undefined): string {
    if (!d) return '';
    const iso = /^(\d{4}-\d{2}-\d{2})/.exec(d);
    if (iso) return iso[1];
    const date = new Date(d);
    return isNaN(date.getTime()) ? '' : date.toISOString().substring(0, 10);
  }

  /** Construit une ligne d'export avec TOUJOURS les mêmes colonnes, dans le même ordre,
   *  peu importe le type de demande — les champs qui ne s'appliquent pas à un type donné
   *  restent simplement vides, ce qui garantit un fichier Excel à colonnes stables. */
  private construireLigneExport(d: DemandeUsager, flat: Record<string, any>): Record<string, string> {
    const row: Record<string, string> = {
      'Type':                 d.type_formulaire,
      'Statut de la demande': d.statut_bibliotheque || "En cours d'évaluation",
      'Date de soumission':   this.formatDateExport(d.dateA),
    };
    // Toutes les colonnes détaillées de l'item, initialisées vides pour garder un ordre fixe.
    this.FIELD_ORDER.forEach(k => {
      const label = this.FIELD_LABELS[k];
      if (label && !(label in row)) row[label] = '';
    });
    row['Suivi ACQ']          = d.suivi_acq || '';
    row['Statut ACQ']         = d.statut_acq || '';
    // Cellule vide (plutôt que le "—" affiché à l'écran) tant qu'aucune décision ACQ n'a
    // été prise pour cette demande — un tiret dans un fichier Excel ressemble à une donnée.
    row['Date de traitement'] = this.formatDateExport(d.date_traitement);

    // Remplit avec les valeurs réelles du détail de l'item.
    this.FIELD_ORDER.forEach(k => {
      const label = this.FIELD_LABELS[k];
      const val = flat?.[k];
      if (!label || val === null || val === undefined || val === '' || val === false) return;
      row[label] = typeof val === 'boolean' ? 'Oui'
        : this.DATE_FIELDS.has(k) ? this.formatDateExport(String(val))
        : String(val);
    });
    return row;
  }

  private exporterCSV(exportData: Record<string, string>[]): void {
    if (!exportData.length) return;
    const headers = Object.keys(exportData[0]);
    const rows = exportData.map(row =>
      headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob(['﻿' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `mes_demandes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private ecrireImpression(fenetre: Window, d: DemandeUsager, data: RangeeImpression[]): void {
    const rangees: RangeeImpression[] = [
      { label: 'Statut de la demande', value: d.statut_bibliotheque || "En cours d'évaluation" },
      ...(d.suivi_acq  ? [{ label: 'ACQ — Suivi de la demande',  value: d.suivi_acq  }] : []),
      ...(d.statut_acq ? [{ label: 'ACQ — Statut de la demande', value: d.statut_acq }] : []),
      ...data,
    ];

    const nomConnecte      = `${this.prenom} ${this.nom}`.trim() || 'Utilisateur inconnu';
    const dateImpression   = new Date().toLocaleString('fr-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    const rappelTraitement = d.date_traitement
      ? ` · Traitée le ${this.formatDate(d.date_traitement)}`
      : '';

    ecrireDocumentImpression(fenetre, {
      titre: `${d.type_formulaire} — Demande #${d.id}`,
      sousTitre: `Titre : ${d.titre_document || '—'} · Soumise le ${this.formatDate(d.dateA)}`,
      enteteDroiteNom: nomConnecte,
      enteteDroiteDetail: `Imprimé le ${dateImpression}`,
      pied: `Demande soumise le ${this.formatDate(d.dateA)}${rappelTraitement}<br>Ce document est une impression informative — les données à jour se trouvent dans le portail des acquisitions.`,
      rangees,
    });
  }

  supprimerDemande(id: number): void {
    this.deleting = true;
    this.deleteError = false;
    this.reponsesService.supprimer(id).subscribe({
      next: () => {
        this.demandes = this.demandes.filter(d => d.id !== id);
        this.confirmingDeleteId = null;
        this.deleting = false;
      },
      error: () => {
        this.deleting = false;
        this.deleteError = true;
      }
    });
  }
}
