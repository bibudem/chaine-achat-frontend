import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

    this.authService.completeAzureLogin(token).subscribe(success => {
      if (!success) {
        this.erreur = true;
        setTimeout(() => this.router.navigate(['/login'], { queryParams: { error: 'auth_failed' } }), 1500);
        return;
      }
      const dest = this.authService.role === 'Usager' ? '/usager' : this.authService.redirectUrl;
      this.authService.redirectUrl = '/accueil';
      this.router.navigateByUrl(dest);
    });
  }
}
