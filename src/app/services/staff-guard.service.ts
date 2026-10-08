import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable()
export class StaffGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const role = sessionStorage.getItem('role');
    if (role === 'Admin' || role === 'SuperAdmin' || role === 'TDM' || role === 'Employe' || role === 'TechDoc') { return true; }
    // Communauté UdeM (rôle Usager) → formulaire public seulement.
    this.router.navigate([role === 'Usager' ? '/suggestion-public' : '/usager']);
    return false;
  }
}
