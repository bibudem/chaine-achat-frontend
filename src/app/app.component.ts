import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'projet-monographies';
  isUsagerRoute = false;

  constructor(
    private translate: TranslateService,
    public authService: AuthService,
    private router: Router
  ) {
    translate.setDefaultLang('fr');

    // Initialisation immédiate avant le premier rendu
    this.isUsagerRoute = window.location.pathname.startsWith('/usager');
    if (!this.isUsagerRoute){
      document.documentElement.classList.remove('usager-route');
    }
  
  }

  ngOnInit() {
    this.router.events.pipe(
      // NavigationStart au lieu de NavigationEnd pour réagir avant le rendu
      filter(event => event instanceof NavigationStart)
    ).subscribe((event: any) => {
      this.isUsagerRoute = event.url.startsWith('/usager');
    });
  }

  switchLanguage(language: string) {
    this.translate.use(language);
  }

  async logout() {
    await this.authService.logout();
  }
}