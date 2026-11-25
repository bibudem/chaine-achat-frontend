import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

/** Espace de gestion hors Processus/Import et Registres (ex. Configuration) : Admin,
 *  SuperAdmin et TDM (voir AuthService.isGestion). */
@Injectable({ providedIn: 'root' })
export class GestionGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const role = sessionStorage.getItem('role');
    if (role === 'Admin' || role === 'SuperAdmin' || role === 'TDM') return true;
    this.router.navigate(['/not-acces']);
    return false;
  }
}
