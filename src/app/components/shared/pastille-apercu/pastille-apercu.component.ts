import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

/**
 * Pastille affichée dans l'en-tête pendant un aperçu « Voir comme » (Admin / SuperAdmin) :
 * rappelle le rôle simulé (droits réels dans l'infobulle) et permet d'en sortir d'un clic.
 * Présente dans les deux en-têtes (espace de gestion et portail usager), toujours visibles.
 */
@Component({
  selector: 'app-pastille-apercu',
  templateUrl: './pastille-apercu.component.html',
  styleUrls: ['./pastille-apercu.component.css']
})
export class PastilleApercuComponent {
  constructor(public authService: AuthService) {}

  /** Clé de traduction du rôle simulé (ex. apercu.role-techdoc). */
  get cleRole(): string {
    return AuthService.ROLES_APERCU.find(r => r.role === this.authService.role)?.cle ?? '';
  }
}
