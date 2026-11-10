import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { ReponsesService, SuggestionTri, TriDecision } from '../../../../services/reponses.service';
import { AuthService } from '../../../../services/auth.service';
import { estAcqEnAttenteDefaut } from '../../../../lib/DemandeStatut';
import { construireLignesDetail } from '../../../../lib/DemandeDetailFields';

type StatutFiltre = '' | 'a_trier' | 'a_completer' | 'soumise' | 'refuse';
/** '' = ordre par défaut (priorité : à trier d'abord). */
type OrdreDate = '' | 'date_desc' | 'date_asc';

/** État de la décision en cours de saisie pour une suggestion « À trier » dépliée. */
interface DecisionSaisie {
  choix:       TriDecision | null;
  commentaire: string;
  envoiEnCours: boolean;
  erreur:      string;
  /** Notes internes de l'équipe TechDoc, saisies en même temps que la décision — même champ
   *  techdoc_tri_notes qu'item-formulaire, repris si la suggestion est ensuite matérialisée.
   *  (« Transmise en bibliothèque » est cochée automatiquement par le backend à la décision.) */
  techdocTriNotes: string;
}

/**
 * Tri des suggestions publiques (formulaire /suggestion-public, communauté UdeM) par
 * l'équipe TechDoc — route /usager/tri, voir TriGuard.
 *
 * Liste unique couvrant tout le cycle de vie d'une suggestion publique (voir ReponsesModel.
 * findTri pour l'ordre de priorité exact : à trier, puis acceptées à compléter, puis
 * soumises aux ACQ, puis refusées). Décider une suggestion « à trier » se fait en dépliant
 * sa ligne. La décision (Oui/Non) est un AVIS de l'équipe : la décision finale revient aux ACQ.
 * Dans les deux cas la demande s'ouvre dans le formulaire de suggestion interne
 * (/usager/suggestion-bib?id=&tri=1), à compléter puis à soumettre aux ACQ, qui voient l'avis
 * et son commentaire (obligatoire pour un refus). Aucun courriel au demandeur à cette étape.
 * « Mes demandes » (/usager/profil) : les demandes saisies par le membre lui-même.
 */
@Component({
  selector: 'app-tri-suggestions',
  templateUrl: './tri-suggestions.component.html',
  styleUrls: ['./tri-suggestions.component.css']
})
export class TriSuggestionsComponent implements OnInit {
  readonly LIMITE = 20;

  suggestions: SuggestionTri[] = [];
  total   = 0;
  aTrier  = 0;
  offset  = 0;
  loading = false;
  errorMessage   = '';
  successMessage = '';

  recherche = '';
  statutFiltre: StatutFiltre = '';
  ordreDate: OrdreDate = '';

  /** Ligne « à trier » actuellement dépliée pour saisie de la décision (une à la fois). */
  expandedId: number | null = null;
  decisions: Record<number, DecisionSaisie> = {};

  constructor(
    private reponsesService: ReponsesService,
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService
  ) {}

  /** Champs « TechDoc Tri » : équipe de tri seulement (lecture seule pour l'Admin en supervision). */
  get peutSuiviTri(): boolean { return this.authService.canSuiviTri; }

  private t(key: string, params?: object): string {
    return this.translate.instant(`tri-suggestions-page.${key}`, params);
  }

  ngOnInit(): void {
    this.successMessage = history.state?.message ?? '';
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.errorMessage = '';
    this.reponsesService.getTri({
      statut: this.statutFiltre || undefined,
      search: this.recherche.trim() || undefined,
      ordre:  this.ordreDate || undefined,
      limit:  this.LIMITE,
      offset: this.offset,
    }).subscribe({
      next: res => {
        this.suggestions = res.data;
        this.total  = res.total;
        this.aTrier = res.a_trier;
        this.expandedId = null;
        this.decisions = {};
        for (const s of res.data) {
          this.decisions[s.id] = {
            choix: null, commentaire: '', envoiEnCours: false, erreur: '',
            techdocTriNotes: s.reponses?.['techdoc_tri_notes'] ?? '',
          };
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = this.t('erreur-chargement');
        this.loading = false;
      }
    });
  }

  rechercher(): void {
    this.offset = 0;
    this.charger();
  }

  /** Clic sur l'en-tête de date : plus récentes → plus anciennes → ordre par défaut. */
  basculerOrdreDate(): void {
    this.ordreDate = this.ordreDate === '' ? 'date_desc'
                   : this.ordreDate === 'date_desc' ? 'date_asc'
                   : '';
    this.rechercher();
  }

  get ariaSortDate(): 'descending' | 'ascending' | 'none' {
    return this.ordreDate === 'date_desc' ? 'descending'
         : this.ordreDate === 'date_asc'  ? 'ascending'
         : 'none';
  }

  /** Déplie/replie le détail complet d'une ligne (toutes les données soumises, plus la
   *  décision ACQ si la suggestion a été matérialisée en item) — et, pour une suggestion
   *  « à trier », la saisie de la décision de tri. */
  toggleDecision(s: SuggestionTri): void {
    this.expandedId = this.expandedId === s.id ? null : s.id;
  }

  pageSuivante(): void   { this.offset += this.LIMITE; this.charger(); }
  pagePrecedente(): void { this.offset = Math.max(0, this.offset - this.LIMITE); this.charger(); }
  get finPage(): number  { return Math.min(this.offset + this.LIMITE, this.total); }

  confirmer(s: SuggestionTri): void {
    const d = this.decisions[s.id];
    if (!d?.choix) return;
    const commentaire = d.commentaire.trim();
    if (d.choix === 'refuse' && !commentaire) {
      d.erreur = this.t('erreur-commentaire-obligatoire');
      return;
    }

    d.envoiEnCours = true;
    d.erreur = '';
    this.reponsesService.deciderTri(
      s.id, d.choix, commentaire || null, d.techdocTriNotes.trim() || null,
    ).subscribe({
      // Acceptée ou refusée, la suggestion se complète dans le formulaire interne, au rythme de
      // l'équipe — elle reste un brouillon tant qu'elle n'est pas « Soumettre aux ACQ ».
      next: () => this.router.navigate(['/usager/suggestion-bib'], { queryParams: { id: s.id, tri: 1 } }),
      error: (err: HttpErrorResponse) => {
        d.envoiEnCours = false;
        if (err.status === 409) {
          // Un autre membre de l'équipe l'a traitée entre-temps : on rafraîchit la file, puis on
          // affiche le message (charger() efface errorMessage en commençant).
          this.charger();
          this.errorMessage = err.error?.error ?? this.t('erreur-deja-traitee');
          return;
        }
        d.erreur = err.error?.error ?? this.t('erreur-enregistrement');
      }
    });
  }

  titre(s: SuggestionTri): string {
    return s.reponses?.['titre_document'] || this.t('sans-titre');
  }

  /** Détail complet des champs soumis (toutes les données du formulaire public), même
   *  logique label/valeur que le détail dépliable de « Mes demandes » (usager-profil) — pour
   *  que les deux vues restent cohérentes. Les réponses sont déjà à plat ici (pas de
   *  baseData/specificData imbriqués, contrairement à l'item une fois matérialisé), donc
   *  aucun appel réseau n'est nécessaire. */
  detailLignes(s: SuggestionTri): { label: string; value: string }[] {
    return construireLignesDetail(s.reponses ?? {});
  }

  /** Date de tri si déjà décidée, sinon date de réception de la suggestion. */
  dateAffichee(s: SuggestionTri): string {
    return s.tri_date || s.dateA;
  }

  /** Une suggestion triée (acceptée ou refusée — le refus n'est qu'un avis) reste à compléter
   *  tant qu'elle n'est pas soumise aux ACQ. */
  estACompleter(s: SuggestionTri): boolean {
    return s.tri_statut !== 'a_trier' && s.statut_bibliotheque !== 'Soumettre aux ACQ';
  }

  /** Progression d'une suggestion triée — même catégorisation que « Mes demandes » : tant que
   *  les ACQ n'ont pas réellement statué (suivi_acq vide ou encore sur les valeurs par défaut du
   *  formulaire de décision, voir estAcqEnAttenteDefaut), le texte reste « Soumise aux ACQ », pas
   *  « Traitée » — sinon le libellé se contredit lui-même (ex. « Traitée… — En attente »). */
  private etatAcq(s: SuggestionTri): { libelle: string; classe: string } {
    if (s.statut_bibliotheque !== 'Soumettre aux ACQ') {
      return { libelle: this.t('etat-a-completer'), classe: 'ts-badge--attente' };
    }
    if (!s.suivi_acq || estAcqEnAttenteDefaut(s)) {
      return { libelle: this.t('etat-soumise'), classe: 'ts-badge--soumise' };
    }
    return { libelle: this.t('etat-traitee-suivi', { suivi: s.suivi_acq }), classe: 'ts-badge--traitee' };
  }

  /** Progression affichée pour n'importe quelle ligne de la liste unique. L'avis « Refusée »
   *  s'affiche à part (gabarit), la suggestion poursuivant le même circuit qu'une acceptée. */
  statutInfo(s: SuggestionTri): { libelle: string; classe: string } {
    if (s.tri_statut === 'a_trier') return { libelle: this.t('badge-a-trier'), classe: 'ts-badge--a-trier' };
    return this.etatAcq(s);
  }
}
