import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, SimulatedProfile, SIMULATED_PROFILES } from '../../services/auth.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  profiles = SIMULATED_PROFILES;

  constructor(public authService: AuthService, private router: Router) {}

  select(profile: SimulatedProfile): void {
    this.authService.simulateLogin(profile);
    const saved = this.authService.redirectUrl;
    this.authService.redirectUrl = '/accueil';
    const dest = profile.role === 'Usager'
      ? '/usager'
      : (saved && saved !== '/accueil' ? saved : '/accueil');
    this.router.navigateByUrl(dest);
  }
}
