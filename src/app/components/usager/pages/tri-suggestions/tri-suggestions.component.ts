import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { ReponsesService, SuggestionTri, TriDecision } from '../../../../services/reponses.service';
import { estAcqEnAttenteDefaut } from '../../../../lib/DemandeStatut';

type StatutFiltre = '' | 'a_trier' | 'a_completer' | 'soumise' | 'refuse';

/** État de la décision en cours de saisie pour une suggestion « À trier » dépliée. */
interface DecisionSaisie {
  choix:       TriDecision | null;
  commentaire: string;
  envoiEnCours: boolean;
  erreur:      string;
}

/**
 * Tri des suggestions publiques (formulaire /suggestion-public, communauté UdeM) par
 * l'équipe TechDoc — route /usager/tri, voir TriGuard.
 *
 * Liste unique couvrant tout le cycle de vie d'une suggestion publique (voir ReponsesModel.
 * findTri pour l'ordre de priorité exact : à trier, puis acceptées à compléter, puis
 * soumises aux ACQ, puis refusées). Décider une suggestion « à trier » se fait en dépliant
 * sa ligne : Oui → la demande s'ouvre dans le formulaire de suggestion interne
 * (/usager/suggestion-bib?id=&tri=1), à compléter puis à soumettre aux ACQ quand l'équipe le
 * décide. Non → commentaire obligatoire. Dans les deux cas le demandeur reçoit un courriel
 * avec le commentaire (backend → n8n /tri-decision).
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

  /** Ligne « à trier » actuellement dépliée pour saisie de la décision (une à la fois). */
  expandedId: number | null = null;
  decisions: Record<number, DecisionSaisie> = {};

  constructor(
    private reponsesService: ReponsesService,
    private router: Router,
    private translate: TranslateService
  ) {}

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
          this.decisions[s.id] = { choix: null, commentaire: '', envoiEnCours: false, erreur: '' };
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

  /** Déplie/replie la saisie de décision d'une suggestion « à trier ». */
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
    this.reponsesService.deciderTri(s.id, d.choix, commentaire || null).subscribe({
      next: () => {
        if (d.choix === 'accepte') {
          // La suggestion acceptée se complète dans le formulaire interne, au rythme de
          // l'équipe — elle reste un brouillon tant qu'elle n'est pas « Soumettre aux ACQ ».
          this.router.navigate(['/usager/suggestion-bib'], { queryParams: { id: s.id, tri: 1 } });
          return;
        }
        this.expandedId = null;
        this.successMessage = this.t('succes-refus', { titre: this.titre(s) });
        this.charger();
      },
      error: (err: HttpErrorResponse) => {
        d.envoiEnCours = false;
        if (err.status === 409) {
          // Un autre membre de l'équipe l'a traitée entre-temps : on rafraîchit la file.
          this.errorMessage = err.error?.error ?? this.t('erreur-deja-traitee');
          this.charger();
          return;
        }
        d.erreur = err.error?.error ?? this.t('erreur-enregistrement');
      }
    });
  }

  completer(s: SuggestionTri): void {
    this.router.navigate(['/usager/suggestion-bib'], { queryParams: { id: s.id, tri: 1 } });
  }

  titre(s: SuggestionTri): string {
    return s.reponses?.['titre_document'] || this.t('sans-titre');
  }

  /** Date de tri si déjà décidée, sinon date de réception de la suggestion. */
  dateAffichee(s: SuggestionTri): string {
    return s.tri_date || s.dateA;
  }

  /** Une suggestion acceptée reste à compléter tant qu'elle n'est pas soumise aux ACQ. */
  estACompleter(s: SuggestionTri): boolean {
    return s.tri_statut === 'accepte' && s.statut_bibliotheque !== 'Soumettre aux ACQ';
  }

  /** Progression d'une suggestion acceptée — même catégorisation que « Mes demandes » : tant que
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

  /** Statut affiché pour n'importe quelle ligne de la liste unique (toutes catégories). */
  statutInfo(s: SuggestionTri): { libelle: string; classe: string } {
    if (s.tri_statut === 'a_trier') return { libelle: this.t('badge-a-trier'), classe: 'ts-badge--a-trier' };
    if (s.tri_statut === 'refuse')  return { libelle: this.t('badge-refusee'), classe: 'ts-badge--refuse' };
    return this.etatAcq(s);
  }
}
