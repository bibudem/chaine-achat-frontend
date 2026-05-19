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
  message: string = 'Vous êtes déconnecté.';
  flagChoix:string= 'flag-icon-fr';

  currentDate = new Date();
  isProduction = environment.production;

  get nomAdmin():    string { return sessionStorage.getItem('nomAdmin')    ?? ''; }
  get prenomAdmin(): string { return sessionStorage.getItem('prenomAdmin') ?? ''; }
  get groupeAdmin(): string { return sessionStorage.getItem('groupeAdmin') ?? ''; }

  constructor(public authService: AuthService,
              private translate: TranslateService,
              public router: Router) { }

  ngOnInit(){
    this.translate.setDefaultLang('fr');
  }
  // Informe l'utilisateur sur son authentfication.
  setMessage() {
    this.message = this.authService.isLoggedIn ?
      'Vous êtes connecté.' : 'Identifiant ou mot de passe incorrect.';
  }
  // Déconnecte l'utilisateur
  logout() {
    this.authService.logout();
  }

  //fonction pour changer la langue
  switchLanguage(language: string) {
    this.translate.use(language);
    this.flagChoix= 'flag-icon-'+language;
    switch (language) {
      case'fr':
        this.flagChoix= 'flag-icon-'+language;
        break;
      case'en':
        this.flagChoix= 'flag-icon-us';
        break;
      default:this.flagChoix= 'flag-icon-fr';
        break;
    }
  }
}

