import { Component, OnInit } from '@angular/core';
import { ReponsesService, DemandeUsager } from '../../../services/reponses.service';

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
    'note_usager', 'note_commentaire',
    'statut_bibliotheque', 'bibliotheque_note_interne',
  ];

  filtreRecherche  = '';
  filtreType       = '';
  filtreDateDebut  = '';
  filtreDateFin    = '';

  currentPage          = 1;
  readonly itemsPerPage = 6;

  get prenom():   string { return sessionStorage.getItem('prenomAdmin')   ?? ''; }
  get nom():      string { return sessionStorage.getItem('nomAdmin')       ?? ''; }
  get email():    string { return sessionStorage.getItem('courrielAdmin')  ?? ''; }
  get initiales(): string {
    return `${this.prenom.charAt(0)}${this.nom.charAt(0)}`.toUpperCase();
  }

  get typesDisponibles(): string[] {
    return [...new Set(this.demandes.map(d => d.type_formulaire))].sort();
  }

  get demandesFiltrees(): DemandeUsager[] {
    return this.demandes.filter(d => {
      const rechercheOk = !this.filtreRecherche ||
        (d.titre_document ?? '').toLowerCase().includes(this.filtreRecherche.toLowerCase());
      const typeOk      = !this.filtreType      || d.type_formulaire === this.filtreType;
      const dateDebutOk = !this.filtreDateDebut || (d.dateA ?? '') >= this.filtreDateDebut;
      const dateFinOk   = !this.filtreDateFin   || (d.dateA ?? '').substring(0, 10) <= this.filtreDateFin;
      return rechercheOk && typeOk && dateDebutOk && dateFinOk;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.demandesFiltrees.length / this.itemsPerPage);
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
  }

  constructor(private reponsesService: ReponsesService) {}

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
  }

  statutKey(d: DemandeUsager): string {
    if (d.statut_approbation === 'refuse') return 'refuse';
    if (d.suivi_acq) return 'traitee';
    if (d.statut_bibliotheque === 'Soumettre aux ACQ') return 'soumise';
    if (d.statut_approbation === 'approuve') return 'cours';
    return 'attente';
  }

  routeFormulaire(d: DemandeUsager): string {
    const map: Record<string, string> = {
      'Nouvel achat unique':          'nouvel-achat',
      'Modification et CCOL':         'modification-ccol',
      'Nouvel abonnement':            'nouvel-abonnement',
      'PEB Tipasa numérique':         'peb-tipasa-numerique',
      'Requête ACQ Accessibilité':    'requete-accessibilite',
      "Suggestion d'achat - Usager": 'suggestion-public',
    };
    return '/usager/' + (map[d.type_formulaire] ?? 'demande');
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      'Nouvel achat unique':        'bi-cart-plus',
      'Modification et CCOL':       'bi-pencil-square',
      'Nouvel abonnement':          'bi-newspaper',
      'PEB Tipasa numérique':       'bi-share',
      'Requête ACQ Accessibilité':  'bi-universal-access',
    };
    return map[type] ?? 'bi-lightbulb';
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
    const fenetre = window.open('', '_blank', 'width=800,height=900');
    if (!fenetre) {
      this.errorMessage = "Impossible d'ouvrir la fenêtre d'impression : vérifiez que les fenêtres popup sont autorisées pour ce site.";
      return;
    }
    fenetre.document.write(
      '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Préparation…</title></head>' +
      '<body style="font-family:\'Segoe UI\',Arial,sans-serif;padding:2.5rem;color:#64748b">Préparation du document à imprimer…</body></html>'
    );
    fenetre.document.close();

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

  private ecrireImpression(fenetre: Window, d: DemandeUsager, data: { label: string; value: string }[]): void {
    const esc = (v: string) => {
      const div = document.createElement('div');
      div.textContent = v;
      return div.innerHTML;
    };

    const rangees = [
      { label: 'Statut de la demande', value: d.statut_bibliotheque || "En cours d'évaluation" },
      ...(d.suivi_acq  ? [{ label: 'ACQ — Suivi de la demande',  value: d.suivi_acq  }] : []),
      ...(d.statut_acq ? [{ label: 'ACQ — Statut de la demande', value: d.statut_acq }] : []),
      ...data,
    ].map(r => `<tr><th>${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join('');

    const nomConnecte     = `${this.prenom} ${this.nom}`.trim() || 'Utilisateur inconnu';
    const dateImpression  = new Date().toLocaleString('fr-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    const rappelTraitement = d.date_traitement
      ? ` · Traitée le ${this.formatDate(d.date_traitement)}`
      : '';

    const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Demande #${d.id} — ${esc(d.type_formulaire)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 2rem 2.5rem 2.5rem; }
  .doc-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 2px solid #0B113A; padding-bottom: .6rem; margin-bottom: 1.4rem;
  }
  .doc-header__brand { font-size: .85rem; font-weight: 700; color: #0B113A; }
  .doc-header__brand small { display: block; font-weight: 400; color: #64748b; font-size: .72rem; margin-top: .1rem; }
  .doc-header__user { font-size: .8rem; color: #334155; text-align: right; }
  .doc-header__user strong { display: block; color: #0B113A; font-size: .85rem; }
  h1   { font-size: 1.15rem; margin: 0 0 .2rem; color: #0B113A; }
  .sub { color: #64748b; font-size: .85rem; margin: 0 0 1.5rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: .5rem .6rem; border-bottom: 1px solid #e2e8f0; font-size: .85rem; vertical-align: top; }
  th   { width: 40%; color: #475569; font-weight: 600; background: #f8fafc; }
  .footer {
    margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;
    font-size: .72rem; color: #94a3b8; line-height: 1.6;
  }
  @media print { body { padding: 1.2rem; } }
</style></head>
<body>

  <div class="doc-header">
    <div class="doc-header__brand">
      Portail acquisitions
      <small>Bibliothèques UdeM</small>
    </div>
    <div class="doc-header__user">
      <strong>${esc(nomConnecte)}</strong>
      Imprimé le ${dateImpression}
    </div>
  </div>

  <h1>${esc(d.type_formulaire)} — Demande #${d.id}</h1>
  <p class="sub">Titre : ${esc(d.titre_document || '—')} &nbsp;·&nbsp; Soumise le ${this.formatDate(d.dateA)}</p>
  <table>${rangees}</table>

  <p class="footer">
    Demande soumise le ${this.formatDate(d.dateA)}${rappelTraitement}<br>
    Ce document est une impression informative — les données à jour se trouvent dans le portail des acquisitions.
  </p>

</body></html>`;

    // Navigue vers une URL blob (au lieu de réécrire le document via document.write, qui
    // laisse la fenêtre sur "about:blank") afin que l'en-tête/pied de page d'impression du
    // navigateur n'affiche pas "about:blank" comme URL de la page.
    const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    fenetre.location.href = blobUrl;
    fenetre.focus();

    // Déclenche l'impression une fois le document chargé, avec un filet de sécurité
    // au cas où l'événement onload ne se déclenche pas de façon fiable après la navigation.
    let imprime = false;
    const declencherImpression = () => {
      if (imprime) return;
      imprime = true;
      fenetre.print();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    };
    fenetre.onload = declencherImpression;
    setTimeout(declencherImpression, 500);
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
