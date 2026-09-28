import { Component, OnInit } from '@angular/core';
import { BibliothequesService, Bibliotheque } from '../../../services/bibliotheques.service';
import { DialogService } from '../../../services/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector:    'app-bibliotheques',
  templateUrl: './bibliotheques.component.html',
  styleUrls:   ['./bibliotheques.component.css']
})
export class BibliothequesComponent implements OnInit {

  bibliotheques: Bibliotheque[] = [];

  loading      = true;
  errorMessage = '';

  /** Filtre live du tableau. */
  recherche = '';

  /** Modale d'ajout/modification — editingId null = création, sinon id modifié. */
  showModal  = false;
  editingId: number | null = null;
  formNom    = '';
  isSaving   = false;

  constructor(
    private bibliothequesService: BibliothequesService,
    private dialog: DialogService,
    private translate: TranslateService
  ) {}

  private t(key: string, params?: object): string {
    return this.translate.instant(`bibliotheques-page.${key}`, params);
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading      = true;
    this.errorMessage = '';
    this.bibliothequesService.getAll().subscribe({
      next: (res) => {
        this.bibliotheques = res.data || [];
        this.loading        = false;
      },
      error: (err) => {
        this.errorMessage = err.message || this.t('erreur-chargement');
        this.loading       = false;
      }
    });
  }

  get bibliothequesFiltrees(): Bibliotheque[] {
    const q = this.recherche.trim().toLowerCase();
    if (!q) return this.bibliotheques;
    return this.bibliotheques.filter(b => b.nom.toLowerCase().includes(q));
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     MODALE : AJOUT / MODIFICATION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  openAdd(): void {
    this.editingId = null;
    this.formNom   = '';
    this.showModal = true;
  }

  openEdit(b: Bibliotheque): void {
    this.editingId = b.bib_id;
    this.formNom   = b.nom;
    this.showModal = true;
  }

  cancelModal(): void {
    this.showModal = false;
  }

  submitModal(): void {
    const nom = this.formNom.trim();
    if (!nom) {
      this.dialog.showError(this.t('erreur-nom-manquant'));
      return;
    }

    this.isSaving = true;

    const requete = this.editingId
      ? this.bibliothequesService.modifier(this.editingId, nom)
      : this.bibliothequesService.creer(nom);

    requete.subscribe({
      next: (res) => {
        if (this.editingId) {
          this.bibliotheques = this.bibliotheques.map(b => b.bib_id === res.data.bib_id ? res.data : b);
        } else {
          this.bibliotheques = [...this.bibliotheques, res.data].sort((a, b) => a.nom.localeCompare(b.nom));
        }

        this.isSaving  = false;
        this.showModal = false;
        this.dialog.showSuccess(
          this.editingId ? this.t('succes-modifie') : this.t('succes-cree', { nom })
        );
      },
      error: (err) => {
        this.isSaving = false;
        this.dialog.showError(err.error?.error || this.t('erreur-enregistrement'));
      }
    });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SUPPRESSION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  async supprimer(b: Bibliotheque): Promise<void> {
    const confirmed = await this.dialog.confirm(
      this.t('confirmer-suppression-message', { nom: b.nom }),
      this.t('confirmer-suppression-titre')
    );
    if (!confirmed) return;

    this.bibliothequesService.supprimer(b.bib_id).subscribe({
      next: () => {
        this.bibliotheques = this.bibliotheques.filter(x => x.bib_id !== b.bib_id);
        this.dialog.showSuccess(this.t('succes-supprime'));
      },
      error: () => this.dialog.showError(this.t('erreur-suppression'))
    });
  }
}
