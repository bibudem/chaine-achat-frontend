// PrintBordereau.ts
//
// Mécanisme d'impression partagé par TOUS les points d'impression de l'application
// (StatutDecisionComponent, ItemDetailComponent, UsagerProfilComponent) : même ouverture de
// fenêtre, même gabarit HTML/CSS, même déclenchement — pour que les impressions restent
// visuellement cohérentes et que ce mécanisme ne soit implémenté qu'à un seul endroit.
//
// Fenêtre ouverte de façon SYNCHRONE dans le geste de clic (sinon bloquée par le navigateur),
// placeholder affiché immédiatement, puis contenu final réécrit une fois prêt et impression
// déclenchée via onload avec un filet de sécurité (setTimeout).
import { PRINT_FIELD_LABELS, PRINT_FIELD_ORDER } from './PrintFieldLabels';

export interface RangeeImpression {
  label: string;
  value: string;
}

/** Échappe le HTML — à usage interne, mais exportée pour les appelants qui composent leur
 *  propre en-tête/pied avec des valeurs dynamiques (ex. courriel usager). */
export function echapperHtml(v: string): string {
  const div = document.createElement('div');
  div.textContent = v;
  return div.innerHTML;
}

/** Ouvre la fenêtre d'impression — à appeler en tout premier, dans le geste de clic. */
export function ouvrirFenetreImpression(): Window | null {
  const fenetre = window.open('', '_blank', 'width=800,height=900');
  if (!fenetre) return null;
  fenetre.document.write(
    '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Préparation…</title></head>' +
    '<body style="font-family:\'Segoe UI\',Arial,sans-serif;padding:2.5rem;color:#64748b">Préparation du document à imprimer…</body></html>'
  );
  fenetre.document.close();
  return fenetre;
}

export interface DocumentImpression {
  /** Titre de l'onglet et du <h1>. */
  titre: string;
  /** Ligne sous le titre (ex. "Titre : xxx · Soumise le xxx"). */
  sousTitre: string;
  /** Ligne en gras, en haut à droite (ex. nom du demandeur ou de la personne connectée). */
  enteteDroiteNom: string;
  /** Ligne sous enteteDroiteNom (ex. "Demandeur · courriel", ou une date d'impression). */
  enteteDroiteDetail: string;
  /** Texte du pied de page (peut contenir des <br>). */
  pied: string;
  /** Lignes du tableau — déjà entièrement composées et dans l'ordre voulu. */
  rangees: RangeeImpression[];
}

/**
 * Construit et écrit un document imprimable générique dans `fenetre`, puis déclenche
 * l'impression. Bas niveau : n'importe quel écran peut l'utiliser en composant lui-même son
 * `DocumentImpression` (voir `ecrireImpressionBordereau` ci-dessous pour l'usage le plus
 * courant : imprimer un `Item`).
 */
export function ecrireDocumentImpression(fenetre: Window, doc: DocumentImpression): void {
  const esc = echapperHtml;

  const rangeesHtml = doc.rangees
    .map(r => `<tr><th>${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`)
    .join('');

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>${esc(doc.titre)}</title>
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
      <strong>${esc(doc.enteteDroiteNom)}</strong>
      ${esc(doc.enteteDroiteDetail)}
    </div>
  </div>

  <h1>${esc(doc.titre)}</h1>
  <p class="sub">${esc(doc.sousTitre)}</p>
  <table>${rangeesHtml}</table>

  <p class="footer">${doc.pied}</p>

</body></html>`;

  // Navigue vers une URL blob (au lieu de réécrire le document via document.write, qui
  // laisse la fenêtre sur "about:blank") afin que l'en-tête/pied de page d'impression du
  // navigateur n'affiche pas "about:blank" comme URL de la page.
  const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  fenetre.location.href = blobUrl;
  fenetre.focus();

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

/**
 * Construit et écrit le bordereau imprimable d'un `Item` (StatutDecisionComponent,
 * ItemDetailComponent) — étiquettes de champs communes, voir PrintFieldLabels.ts.
 * @param item item source — utilisé pour l'en-tête, le titre et les champs génériques.
 * @param rangeesSupplementaires rangées à afficher en premier (ex. champs ACQ/TDM édités en
 *   direct par un formulaire), avant les champs génériques listés dans PRINT_FIELD_ORDER.
 * @param identifiant item_id ou reponse_id affiché dans le titre.
 */
export function ecrireImpressionBordereau(
  fenetre: Window,
  item: any,
  rangeesSupplementaires: RangeeImpression[],
  identifiant: number | null
): void {
  const i = item as any;

  const rangees: RangeeImpression[] = [
    { label: 'Statut de la demande', value: i.statut_bibliotheque || "En cours d'évaluation" },
    ...rangeesSupplementaires,
    ...PRINT_FIELD_ORDER
      .filter(k => i[k] !== null && i[k] !== undefined && i[k] !== '' && i[k] !== false)
      .map(k => ({
        label: PRINT_FIELD_LABELS[k],
        value: typeof i[k] === 'boolean' ? 'Oui' : String(i[k]),
      })),
  ];

  const dateImpression = new Date().toLocaleString('fr-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
  const dateSoumission = i.date_creation
    ? new Date(i.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const titre = `${i.formulaire_type || 'Demande'}${identifiant ? ' — #' + identifiant : ''}`;

  ecrireDocumentImpression(fenetre, {
    titre,
    sousTitre: `Titre : ${i.titre_document || '—'} · Soumise le ${dateSoumission}`,
    // En haut du bordereau, on identifie la personne qui a complété la demande
    // (le demandeur) — pas la personne qui imprime le document.
    enteteDroiteNom: i.demandeur || 'Demandeur inconnu',
    enteteDroiteDetail: `Demandeur${i.usager_courriel ? ' · ' + i.usager_courriel : ''}`,
    pied: `Imprimé le ${dateImpression}<br>Ce document est une impression informative — les données à jour se trouvent dans le portail des acquisitions.`,
    rangees,
  });
}
