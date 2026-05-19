import {Component, Inject, OnInit} from '@angular/core';
import {AuthService} from "../services/auth.service";
import {TranslateService} from "@ngx-translate/core";
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  currentDate = new Date();
  isProduction = environment.production;
  currentLang: string = localStorage.getItem('lang') ?? 'fr';

  get nomAdmin():    string { return sessionStorage.getItem('nomAdmin')    ?? ''; }
  get prenomAdmin(): string { return sessionStorage.getItem('prenomAdmin') ?? ''; }
  get groupeAdmin(): string { return sessionStorage.getItem('groupeAdmin') ?? ''; }

  constructor(public authService: AuthService,
              private translate: TranslateService,
              public router: Router) { }

  ngOnInit(){
    this.translate.setDefaultLang('fr');
    this.translate.use(this.currentLang);
  }

  logout() {
    this.authService.logout();
  }

  switchLanguage(language: string) {
    this.currentLang = language;
    this.translate.use(language);
    localStorage.setItem('lang', language);
  }
}

