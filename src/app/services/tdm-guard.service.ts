import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** File TDM dans le portail usager (/usager/tdm) : TDM, plus Admin/SuperAdmin pour la
 *  supervision — mêmes rôles qu'AuthService.canAccessDecision (/statut-decision). */
@Injectable({ providedIn: 'root' })
export class TdmGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.canAccessDecision) return true;
    this.router.navigate(['/usager']);
    return false;
  }
}
