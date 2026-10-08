import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Tri des suggestions publiques (/usager/tri) : équipe TechDoc, plus Admin/SuperAdmin —
 *  voir AuthService.canTrier. */
@Injectable({ providedIn: 'root' })
export class TriGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.canTrier) return true;
    this.router.navigate(['/usager']);
    return false;
  }
}
