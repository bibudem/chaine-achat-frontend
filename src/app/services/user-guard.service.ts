// src/app/services/user-guard.service.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UserGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const role = sessionStorage.getItem('role');
    if (role === 'Usager' || role === 'Admin') {
      return true;
    }
    this.router.navigate(['/not-acces']);
    return false;
  }
}