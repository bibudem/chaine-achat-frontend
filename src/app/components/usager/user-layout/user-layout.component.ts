// src/app/components/user-layout/user-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent implements OnInit {
  userName: string = '';

  constructor(
    public authService: AuthService,
    private translate: TranslateService
  ) {}

  currentLang: string = localStorage.getItem('lang') ?? 'fr';

  ngOnInit(): void {
    const prenom = sessionStorage.getItem('prenomAdmin') ?? '';
    const nom = sessionStorage.getItem('nomAdmin') ?? '';
    this.userName = `${prenom} ${nom}`.trim();
    this.translate.use(this.currentLang);
  }

  switchLanguage(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  async logout() {
    await this.authService.logout();
  }
}