// src/app/services/user-guard.service.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UserGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const role = sessionStorage.getItem('role');
    if (role === 'Employe' || role === 'TechDoc' || role === 'Admin' || role === 'SuperAdmin' || role === 'TDM') {
      return true;
    }
    // La communauté UdeM n'a accès qu'au formulaire public de suggestion d'achat.
    if (role === 'Usager') {
      this.router.navigate(['/suggestion-public']);
      return false;
    }
    this.router.navigate(['/not-acces']);
    return false;
  }
}