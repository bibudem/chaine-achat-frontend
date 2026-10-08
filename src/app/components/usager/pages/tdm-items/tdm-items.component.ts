import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ItemFormulaireService, Item } from '../../../../services/items-formulaire.service';
import { ACQ_STATUT_DEFAUT, ACQ_SUIVI_DEFAUT } from '../../../../lib/DemandeStatut';
import { formulaireTypeLabel } from '../../../../lib/ListeChoixOptions';

type StatutFiltre = '' | 'attente' | 'urgentes';

/**
 * File TDM (/usager/tdm) : items routés vers le TDM (tbl_items.creation_notice_dtdm = true),
 * à traiter directement depuis le portail usager — même esprit que « Tri des suggestions »
 * pour l'équipe TechDoc (tri-suggestions.component.ts), mais le traitement lui-même reste la
 * page existante /statut-decision (catalogage/note TDM, champs ACQ en lecture seule — voir
 * DecisionGuard), à laquelle chaque ligne renvoie.
 */
@Component({
  selector:    'app-tdm-items',
  templateUrl: './tdm-items.component.html',
  styleUrls:   ['./tdm-items.component.css']
})
export class TdmItemsComponent implements OnInit {
  readonly LIMITE = 20;
  readonly formulaireTypeLabel = formulaireTypeLabel;

  items: Item[] = [];
  total   = 0;
  offset  = 0;
  loading = false;
  errorMessage = '';

  recherche    = '';
  statutFiltre: StatutFiltre = '';

  constructor(
    private itemService: ItemFormulaireService,
    private route: ActivatedRoute,
    private translate: TranslateService,
  ) {}

  private t(key: string, params?: object): string {
    return this.translate.instant(`tdm-items-page.${key}`, params);
  }

  ngOnInit(): void {
    // Pré-filtre depuis le combo « Total à trier » du portail usager (même convention de
    // queryParams que la navigation équivalente vers /items côté admin — voir
    // accueil.component.ts, navigateToEnAttente/navigateToUrgentesEnAttente).
    const params = this.route.snapshot.queryParamMap;
    if (params.get('priorite_demande') === 'Urgent') {
      this.statutFiltre = 'urgentes';
    } else if (params.get('statut_acq') || params.get('suivi_acq')) {
      this.statutFiltre = 'attente';
    }
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.errorMessage = '';
    this.itemService.getAll({
      creation_notice_dtdm: true,
      search: this.recherche.trim() || undefined,
      priorite_demande: this.statutFiltre === 'urgentes' ? 'Urgent' : undefined,
      statut_acq: this.statutFiltre ? ACQ_STATUT_DEFAUT : undefined,
      suivi_acq:  this.statutFiltre ? ACQ_SUIVI_DEFAUT  : undefined,
      limit:  this.LIMITE,
      offset: this.offset,
    }).subscribe({
      next: res => {
        this.items = res.data ?? [];
        this.total = res.total ?? this.items.length;
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

  pageSuivante(): void   { this.offset += this.LIMITE; this.charger(); }
  pagePrecedente(): void { this.offset = Math.max(0, this.offset - this.LIMITE); this.charger(); }
  get finPage(): number  { return Math.min(this.offset + this.LIMITE, this.total); }

  /** Ni l'ACQ ni le TDM n'ont encore réellement statué — voir estAcqEnAttenteDefaut
   *  (lib/DemandeStatut.ts) pour la même règle appliquée ailleurs dans l'app. */
  enAttente(item: Item): boolean {
    return (!item.statut_acq || item.statut_acq === ACQ_STATUT_DEFAUT)
        && (!item.suivi_acq  || item.suivi_acq  === ACQ_SUIVI_DEFAUT);
  }

  titre(item: Item): string {
    return item.titre_document || this.t('sans-titre');
  }

  statutLabel(item: Item): string {
    return this.enAttente(item) ? this.t('badge-attente') : (item.suivi_acq || item.statut_acq || this.t('badge-traitee'));
  }
}
