import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './services/auth.service';
import { IdleTimeoutService } from './services/idle-timeout.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'projet-monographies';
  isUsagerRoute = false;
  isLoginRoute = false;
  /** Formulaire public embarqué en <iframe> — même shell « nu » que /usager, sans le
   *  widget FAQ (n'a pas sa place flottant par-dessus une page d'un site externe). */
  isEmbedRoute = false;

  constructor(
    private translate: TranslateService,
    public authService: AuthService,
    private idleTimeout: IdleTimeoutService,
    private router: Router
  ) {
    translate.setDefaultLang('fr');
    const savedLang = localStorage.getItem('lang') ?? 'fr';
    translate.use(savedLang);

    // Initialisation immédiate avant le premier rendu
    this.updateRouteFlags(window.location.pathname);
  }

  ngOnInit() {
    this.idleTimeout.start();

    this.router.events.pipe(
      // NavigationStart au lieu de NavigationEnd pour réagir avant le rendu
      filter(event => event instanceof NavigationStart)
    ).subscribe((event: any) => {
      this.updateRouteFlags(event.url);
    });
  }

  /** Doit s'exécuter à chaque navigation (pas seulement au premier chargement) — sinon la
   *  classe `usager-route` (qui cache app-header/app-menu, voir css_udem.css) reste figée sur
   *  celle du tout premier chargement : un F5 la recalcule, une navigation SPA non. */
  private updateRouteFlags(url: string): void {
    this.isEmbedRoute  = url.startsWith('/suggestion-public');
    this.isUsagerRoute = url.startsWith('/usager') || url.startsWith('/login') || this.isEmbedRoute;
    this.isLoginRoute  = url.startsWith('/login');
    document.documentElement.classList.toggle('usager-route', this.isUsagerRoute);
  }

  switchLanguage(language: string) {
    this.translate.use(language);
  }

  closeSidebar(): void {
    const sidebar = document.querySelector('.sidebar-offcanvas');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar?.classList.contains('active')) {
      sidebar.classList.remove('active');
      overlay?.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    }
  }

  async logout() {
    await this.authService.logout();
  }
}