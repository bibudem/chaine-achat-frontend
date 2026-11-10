import { Component, OnInit } from '@angular/core';
import { UtilisateursService, Utilisateur } from '../../../services/utilisateurs.service';
import { UserRole } from '../../../services/auth.service';
import { DialogService } from '../../../services/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector:    'app-utilisateurs',
  templateUrl: './utilisateurs.component.html',
  styleUrls:   ['./utilisateurs.component.css']
})
export class UtilisateursComponent implements OnInit {

  // 'Usager' (communauté UdeM) est auto-provisionné au premier login Azure AD, jamais créé
  // manuellement ici — voir auth/callback.js (backend).
  readonly roles: UserRole[] = ['SuperAdmin', 'Admin', 'TDM', 'TechDocTri', 'Employe'];

  /** "Employé" ne s'affiche qu'ici — la valeur stockée/comparée reste 'Employe' (sans
   *  accent), comme les autres rôles. */
  roleLabel(role: UserRole): string {
    return role === 'Employe' ? 'Employé' : role;
  }

  utilisateurs: Utilisateur[] = [];

  loading      = true;
  errorMessage = '';

  /** Tri courant du tableau (clic sur l'en-tête Prénom/Nom/Courriel) — par défaut : ordre
   *  alphabétique du nom. */
  sortColumn: 'prenom' | 'nom' | 'email' = 'nom';
  sortDirection: 'asc' | 'desc' = 'asc';

  /** Filtres : rôle ('' = tous) et recherche libre sur le prénom, le nom ou le courriel. */
  filtreRole: UserRole | '' = '';
  recherche = '';

  /** Modale d'ajout/modification — editingId null = création, sinon id de l'usager modifié. */
  showModal   = false;
  editingId: number | null = null;
  formUtilisateur = { email: '', nom: '', prenom: '', role: 'Employe' as UserRole };
  isSaving = false;

  constructor(
    private utilisateursService: UtilisateursService,
    private dialog: DialogService,
    private translate: TranslateService
  ) {}

  private t(key: string, params?: object): string {
    return this.translate.instant(`utilisateurs-page.${key}`, params);
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading      = true;
    this.errorMessage = '';
    this.utilisateursService.getAll().subscribe({
      next: (res) => {
        this.utilisateurs = res.data || [];
        this.applySort();
        this.loading       = false;
      },
      error: (err) => {
        this.errorMessage = err.message || this.t('erreur-chargement');
        this.loading       = false;
      }
    });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FILTRES (rôle + recherche prénom/nom/courriel)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /** Liste affichée : déjà triée (applySort), puis filtrée. Recherche insensible à la casse
   *  et aux accents. */
  get utilisateursAffiches(): Utilisateur[] {
    const terme = this.normaliser(this.recherche.trim());
    return this.utilisateurs.filter(u =>
      (!this.filtreRole || u.role === this.filtreRole) &&
      (!terme || this.normaliser(`${u.prenom || ''} ${u.nom || ''} ${u.email || ''}`).includes(terme))
    );
  }

  get filtresActifs(): boolean { return !!this.filtreRole || !!this.recherche.trim(); }

  reinitialiserFiltres(): void {
    this.filtreRole = '';
    this.recherche  = '';
  }

  private normaliser(v: string): string {
    return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     TRI (clic sur l'en-tête Prénom/Nom/Courriel)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  sortBy(column: 'prenom' | 'nom' | 'email'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn    = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
  }

  /** Ordre alphabétique (français, sans tenir compte des accents ni de la casse). Une valeur
   *  manquante (ex. nom vide) passe après les autres au lieu d'arriver en tête ; à égalité,
   *  on départage par nom, prénom puis courriel. */
  private applySort(): void {
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    const col = this.sortColumn;
    const cmp = (x: string, y: string) => x.localeCompare(y, 'fr', { sensitivity: 'base' });
    this.utilisateurs = [...this.utilisateurs].sort((a, b) => {
      const va = (a[col] || '').trim(), vb = (b[col] || '').trim();
      if (!va !== !vb) return va ? -1 : 1;
      return dir * cmp(va, vb)
          || cmp(a.nom || '', b.nom || '')
          || cmp(a.prenom || '', b.prenom || '')
          || cmp(a.email || '', b.email || '');
    });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     MODALE : AJOUT / MODIFICATION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  openAddUtilisateur(): void {
    this.editingId = null;
    this.formUtilisateur = { email: '', nom: '', prenom: '', role: 'Employe' };
    this.showModal = true;
  }

  openEditUtilisateur(u: Utilisateur): void {
    this.editingId = u.utilisateur_id;
    this.formUtilisateur = { email: u.email, nom: u.nom || '', prenom: u.prenom || '', role: u.role };
    this.showModal = true;
  }

  cancelModal(): void {
    this.showModal = false;
  }

  submitModal(): void {
    const email = this.formUtilisateur.email.trim();
    if (!email) {
      this.dialog.showError(this.t('erreur-courriel-manquant'));
      return;
    }

    const nom    = this.formUtilisateur.nom.trim() || undefined;
    const prenom = this.formUtilisateur.prenom.trim() || undefined;
    const role   = this.formUtilisateur.role;

    this.isSaving = true;

    const requete = this.editingId
      ? this.utilisateursService.modifier(this.editingId, { email, nom, prenom, role })
      : this.utilisateursService.creer(email, role, nom, prenom);

    requete.subscribe({
      next: (res) => {
        if (this.editingId) {
          this.utilisateurs = this.utilisateurs.map(u => u.utilisateur_id === res.data.utilisateur_id ? res.data : u);
        } else {
          this.utilisateurs = [...this.utilisateurs, res.data];
        }
        this.applySort();

        this.isSaving  = false;
        this.showModal = false;
        this.dialog.showSuccess(
          this.editingId
            ? this.t('succes-modifie')
            : this.t('succes-cree', { email, role })
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
  async supprimer(utilisateur: Utilisateur): Promise<void> {
    const confirmed = await this.dialog.confirm(
      this.t('confirmer-suppression-message', { nom: this.nomAffiche(utilisateur), email: utilisateur.email }),
      this.t('confirmer-suppression-titre')
    );
    if (!confirmed) return;

    this.utilisateursService.supprimer(utilisateur.utilisateur_id).subscribe({
      next: () => {
        this.utilisateurs = this.utilisateurs.filter(u => u.utilisateur_id !== utilisateur.utilisateur_id);
        this.dialog.showSuccess(this.t('succes-supprime'));
      },
      error: () => this.dialog.showError(this.t('erreur-suppression'))
    });
  }

  nomAffiche(u: Utilisateur): string {
    const complet = `${u.prenom || ''} ${u.nom || ''}`.trim();
    return complet || u.email;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
