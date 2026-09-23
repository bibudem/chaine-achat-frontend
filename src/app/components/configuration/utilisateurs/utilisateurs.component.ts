import { Component, OnInit } from '@angular/core';
import { UtilisateursService, Utilisateur } from '../../../services/utilisateurs.service';
import { UserRole } from '../../../services/auth.service';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector:    'app-utilisateurs',
  templateUrl: './utilisateurs.component.html',
  styleUrls:   ['./utilisateurs.component.css']
})
export class UtilisateursComponent implements OnInit {

  readonly roles: UserRole[] = ['Admin', 'TDM', 'Usager'];

  utilisateurs: Utilisateur[] = [];

  loading      = true;
  errorMessage = '';

  /** Modale d'ajout/modification — editingId null = création, sinon id de l'usager modifié. */
  showModal   = false;
  editingId: number | null = null;
  formUtilisateur = { email: '', nom: '', prenom: '', role: 'Usager' as UserRole };
  isSaving = false;

  constructor(
    private utilisateursService: UtilisateursService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading      = true;
    this.errorMessage = '';
    this.utilisateursService.getAll().subscribe({
      next: (res) => {
        this.utilisateurs = res.data || [];
        this.loading       = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des usagers';
        this.loading       = false;
      }
    });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     MODALE : AJOUT / MODIFICATION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  openAddUtilisateur(): void {
    this.editingId = null;
    this.formUtilisateur = { email: '', nom: '', prenom: '', role: 'Usager' };
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
      this.dialog.showError('Veuillez indiquer un courriel.');
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
        this.utilisateurs.sort((a, b) => this.nomAffiche(a).localeCompare(this.nomAffiche(b)));

        this.isSaving  = false;
        this.showModal = false;
        this.dialog.showSuccess(
          this.editingId
            ? 'Usager mis à jour.'
            : `${email} pourra se connecter avec le rôle ${role} dès sa première authentification UdeM.`
        );
      },
      error: (err) => {
        this.isSaving = false;
        this.dialog.showError(err.error?.error || 'Erreur lors de l\'enregistrement.');
      }
    });
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SUPPRESSION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  async supprimer(utilisateur: Utilisateur): Promise<void> {
    const confirmed = await this.dialog.confirm(
      `Retirer l'accès de ${this.nomAffiche(utilisateur)} (${utilisateur.email}) ? Cette personne devra être ré-ajoutée pour se reconnecter.`,
      'Confirmer la suppression'
    );
    if (!confirmed) return;

    this.utilisateursService.supprimer(utilisateur.utilisateur_id).subscribe({
      next: () => {
        this.utilisateurs = this.utilisateurs.filter(u => u.utilisateur_id !== utilisateur.utilisateur_id);
        this.dialog.showSuccess('Accès retiré.');
      },
      error: () => this.dialog.showError('Erreur lors de la suppression.')
    });
  }

  nomAffiche(u: Utilisateur): string {
    const complet = `${u.prenom || ''} ${u.nom || ''}`.trim();
    return complet || u.email;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
