import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
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
  }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
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