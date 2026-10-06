import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

/** Protège les routes réservées au SuperAdmin (ex. /configuration/utilisateurs) — à la
 *  différence d'AdminGuard, l'Admin n'y a pas accès : seul le SuperAdmin peut créer des
 *  profils utilisateurs. */
@Injectable()
export class SuperAdminGuard implements CanActivate {

  constructor(private router: Router) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return this.checkSuperAdmin();
  }

  checkSuperAdmin(): boolean {
    if (sessionStorage.getItem('role') == 'SuperAdmin') { return true; }

    this.router.navigate(['/login'], { queryParams: { acces: 'refuse' } });
    return false;
  }
}
