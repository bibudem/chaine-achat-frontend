import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, SimulatedProfile, SIMULATED_PROFILES } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  profiles = SIMULATED_PROFILES;
  isProduction = environment.production;
  accessDenied = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.accessDenied = this.route.snapshot.queryParamMap.get('acces') === 'refuse';
  }

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
