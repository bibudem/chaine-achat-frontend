import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  sessionExpired = false;
  accesNonAutorise = false;

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.accessDenied = this.route.snapshot.queryParamMap.get('acces') === 'refuse';
    const err = this.route.snapshot.queryParamMap.get('error');
    this.sessionExpired = err === 'session_expired';
    this.accesNonAutorise = err === 'acces_non_autorise';
  }

  select(profile: SimulatedProfile): void {
    this.authService.loginWithDevProfile(profile.role);
  }

  loginWithAzure(): void {
    this.authService.loginWithAzure();
  }
}
