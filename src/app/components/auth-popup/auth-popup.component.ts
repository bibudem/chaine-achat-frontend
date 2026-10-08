import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Point d'entrée de la fenêtre de connexion ouverte par le formulaire public embarqué en
 * <iframe> (AuthService.loginWithPopup) : Microsoft refuse de s'afficher dans un iframe.
 * En production, enchaîne directement sur Azure AD ; en local, sur la page de sélection
 * des profils simulés. Dans les deux cas avec le marqueur popup, pour qu'AuthCallbackComponent
 * renvoie le token au formulaire puis ferme la fenêtre, au lieu d'ouvrir l'application ici.
 */
@Component({
  selector: 'app-auth-popup',
  template: `
    <div class="auth-callback">
      <div class="spinner-border" role="status"></div>
      <p>{{ 'login-page.connexion-en-cours' | translate }}</p>
    </div>`,
  styleUrls: ['../auth-callback/auth-callback.component.css']
})
export class AuthPopupComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (environment.production) {
      this.authService.loginWithAzure(true);
    } else {
      this.router.navigate(['/login'], { queryParams: { popup: 1 } });
    }
  }
}
