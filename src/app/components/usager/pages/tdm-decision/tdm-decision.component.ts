import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ItemFormulaireService, Item } from '../../../../services/items-formulaire.service';
import { formulaireTypeLabel } from '../../../../lib/ListeChoixOptions';

/**
 * Traitement d'un item TDM (/usager/tdm/:id) — mêmes 3 champs que l'onglet « TDM – Choix de
 * notice » de /statut-decision (admin), mais dans une vue dédiée, au même gabarit visuel que
 * « Tri des suggestions » (TechDoc) : pas d'onglet ACQ (lecture seule, hors-sujet ici), pas
 * d'en-tête bordereau/imprimer — juste le détail de l'item et ce qui est éditable.
 *
 * Sauvegarde via ItemFormulaireService.update() avec seulement ces 3 champs : le backend
 * (controllers/items.js putItems) ne met à jour QUE les colonnes présentes dans le payload
 * (cleanEmptyFields + UPDATE dynamique), donc rien d'autre sur l'item n'est touché.
 */
@Component({
  selector:    'app-tdm-decision',
  templateUrl: './tdm-decision.component.html',
  styleUrls:   ['./tdm-decision.component.css']
})
export class TdmDecisionComponent implements OnInit {
  readonly formulaireTypeLabel = formulaireTypeLabel;

  itemId: number | null = null;
  item: Item | null = null;
  loading = false;
  submitting = false;
  errorMessage   = '';
  successMessage = '';

  note_dtdm = '';
  note_interne_dtdm = '';
  catalogue = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemFormulaireService,
    private translate: TranslateService,
  ) {}

  private t(key: string, params?: object): string {
    return this.translate.instant(`tdm-decision-page.${key}`, params);
  }

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    this.charger();
  }

  charger(): void {
    if (!this.itemId) { this.errorMessage = this.t('erreur-item-introuvable'); return; }
    this.loading = true;
    this.errorMessage = '';
    this.itemService.getById(this.itemId).subscribe({
      next: res => {
        this.item = res.data ?? null;
        this.note_dtdm          = this.item?.note_dtdm          || '';
        this.note_interne_dtdm  = this.item?.note_interne_dtdm  || '';
        this.catalogue          = this.item?.catalogue          || '';
        this.loading = false;
      },
      error: () => { this.errorMessage = this.t('erreur-chargement'); this.loading = false; }
    });
  }

  titre(): string {
    return this.item?.titre_document || this.t('sans-titre');
  }

  /** Couleur du badge de type de formulaire — même mapping que partout ailleurs dans l'app
   *  (reponses-list.component.ts, items-list.component.ts, item-detail.component.ts). */
  getTypeBadgeClass(type: string | undefined): string {
    const t = (type ?? '').toLowerCase();
    if (t.includes('suggestion'))  return 'badge-type--suggest';
    if (t.includes('ccol'))        return 'badge-type--ccol';
    if (t.includes('abonnement'))  return 'badge-type--abo';
    if (t.includes('peb'))         return 'badge-type--peb';
    if (t.includes('acq'))         return 'badge-type--acq';
    if (t.includes('achat'))       return 'badge-type--achat';
    return 'badge-type--autre';
  }

  enregistrer(): void {
    if (!this.item || !this.itemId) return;
    this.submitting = true;
    this.errorMessage   = '';
    this.successMessage = '';
    this.itemService.update({
      item_id:           this.itemId,
      formulaire_type:   this.item.formulaire_type,
      note_dtdm:         this.note_dtdm,
      note_interne_dtdm: this.note_interne_dtdm,
      catalogue:         this.catalogue,
    }).subscribe({
      next: res => {
        this.submitting = false;
        if (res.success === false) {
          this.errorMessage = res.message || this.t('erreur-enregistrement');
          return;
        }
        this.successMessage = this.t('succes-enregistrement');
        setTimeout(() => this.router.navigate(['/usager/tdm']), 1200);
      },
      error: () => {
        this.submitting = false;
        this.errorMessage = this.t('erreur-enregistrement');
      }
    });
  }
}
