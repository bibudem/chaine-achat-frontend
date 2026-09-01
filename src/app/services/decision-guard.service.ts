import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

/**
 * Accès à la page de décision ACQ/TDM (/statut-decision) : l'Administrateur (décision ACQ
 * complète) et le TDM (catalogage/note TDM, champs ACQ en lecture seule — voir
 * StatutDecisionComponent). Distinct d'AdminGuard, qui reste réservé aux écrans Admin
 * uniquement (import, import-logs, réponses).
 */
@Injectable({ providedIn: 'root' })
export class DecisionGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const role = sessionStorage.getItem('role');
    if (role === 'Admin' || role === 'TDM') { return true; }

    this.router.navigate(['/login'], { queryParams: { acces: 'refuse' } });
    return false;
  }
}
