import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent implements OnInit {
  userName  = '';
  initiales = '';
  userOpen  = false;

  currentLang: string = localStorage.getItem('lang') ?? 'fr';

  constructor(
    public  authService: AuthService,
    private translate:   TranslateService,
    private router:      Router
  ) {}

  ngOnInit(): void {
    const prenom = sessionStorage.getItem('prenomAdmin') ?? '';
    const nom    = sessionStorage.getItem('nomAdmin')    ?? '';
    this.userName  = `${prenom} ${nom}`.trim();
    this.initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    this.translate.use(this.currentLang);
  }

  toggleUser(event: Event): void {
    event.stopPropagation();
    this.userOpen = !this.userOpen;
  }

  @HostListener('document:click')
  onDocumentClick(): void { this.userOpen = false; }

  mesDemandes(): void {
    this.userOpen = false;
    this.router.navigate(['/usager/profil']);
  }

  switchLanguage(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}