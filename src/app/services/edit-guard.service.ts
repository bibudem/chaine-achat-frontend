import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

/** Création / modification des items : Admin, SuperAdmin et TDM (voir AuthService.canEdit). */
@Injectable()
export class EditGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const role = sessionStorage.getItem('role');
    if (role === 'Admin' || role === 'SuperAdmin' || role === 'TDM') return true;
    this.router.navigate(['/not-acces']);
    return false;
  }
}
