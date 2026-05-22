import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable()
export class StaffGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const role = sessionStorage.getItem('role');
    if (role === 'Admin' || role === 'Bibliothécaire') { return true; }
    this.router.navigate(['/usager']);
    return false;
  }
}
