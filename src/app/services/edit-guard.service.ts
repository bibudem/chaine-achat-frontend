import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable()
export class EditGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const role = sessionStorage.getItem('role');
    if (role === 'Admin' || role === 'SuperAdmin') return true;
    this.router.navigate(['/not-acces']);
    return false;
  }
}
