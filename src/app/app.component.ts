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
    const savedLang = localStorage.getItem('lang') ?? 'fr';
    translate.use(savedLang);

    // Initialisation immédiate avant le premier rendu
    const path = window.location.pathname;
    this.isUsagerRoute = path.startsWith('/usager') || path.startsWith('/login');
    if (!this.isUsagerRoute){
      document.documentElement.classList.remove('usager-route');
    }
  
  }

  ngOnInit() {
    this.router.events.pipe(
      // NavigationStart au lieu de NavigationEnd pour réagir avant le rendu
      filter(event => event instanceof NavigationStart)
    ).subscribe((event: any) => {
      this.isUsagerRoute = event.url.startsWith('/usager') || event.url.startsWith('/login');
    });
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