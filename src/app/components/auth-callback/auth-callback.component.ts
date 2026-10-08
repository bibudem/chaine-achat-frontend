import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, AUTH_POPUP_MESSAGE } from '../../services/auth.service';

/**
 * Reçoit la redirection du backend après le flux Azure AD (?token=...),
 * valide le token via AuthService.completeAzureLogin() puis entre dans l'app.
 */
@Component({
  selector: 'auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.css']
})
export class AuthCallbackComponent implements OnInit {
  erreur = false;
  /** Popup de connexion dont la fermeture automatique a échoué. */
  popupTerminee = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigate(['/login'], { queryParams: { error: 'auth_failed' } });
      return;
    }

    // Connexion ouverte en popup par le formulaire public embarqué (AuthService.loginWithPopup) :
    // on renvoie le token à l'iframe, qui fait elle-même la validation (/auth/me), puis on ferme.
    if (this.route.snapshot.queryParamMap.get('popup') === '1') {
      this.renvoyerTokenAuFormulaire(token);
      return;
    }

    this.authService.completeAzureLogin(token).subscribe(success => {
      if (!success) {
        this.erreur = true;
        setTimeout(() => this.router.navigate(['/login'], { queryParams: { error: 'auth_failed' } }), 1500);
        return;
      }
      // La communauté UdeM (Usager) n'a accès qu'au formulaire public. L'équipe TechDoc, le
      // personnel des bibliothèques (Employé) et le TDM travaillent d'abord dans le portail de
      // dépôt des demandes (/usager — « Mon activité » + file TDM pour ce dernier) — ils
      // gardent un accès à l'interface admin via le lien "Espace gestion" du menu, mais n'y
      // atterrissent pas par défaut, contrairement à Admin.
      const dest = this.authService.isUsager  ? '/suggestion-public'
                 : (this.authService.isTechDoc || this.authService.isEmploye || this.authService.isTdm)
                   && this.authService.redirectUrl === '/accueil' ? '/usager'
                 : this.authService.redirectUrl;
      this.authService.redirectUrl = '/accueil';
      this.router.navigateByUrl(dest);
    });
  }

  private renvoyerTokenAuFormulaire(token: string): void {
    const message = { type: AUTH_POPUP_MESSAGE, token };
    // window.opener peut avoir été coupé en route (politique COOP) — BroadcastChannel prend
    // alors le relais (même origine, voir AuthService.loginWithPopup).
    window.opener?.postMessage(message, window.location.origin);
    if (typeof BroadcastChannel !== 'undefined') {
      const canal = new BroadcastChannel(AUTH_POPUP_MESSAGE);
      canal.postMessage(message);
      canal.close();
    }
    window.close();
    // Encore ouverte si le navigateur a refusé la fermeture par script.
    setTimeout(() => this.popupTerminee = true, 500);
  }
}
