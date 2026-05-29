import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MethodesGlobal } from '../lib/MethodesGlobal';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Component({
  selector:    'app-menu',
  templateUrl: './menu.component.html',
  styleUrls:   ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  ifAdmin = false;
  methodesGlobal: MethodesGlobal = new MethodesGlobal();

  /* ── Flags pour les cas spéciaux ── */

  /** "Rechercher" actif sur /items, /items/:id, /items/details/:id — mais PAS /items/nouveau */
  isSearchRoute  = false;

  /** "Ajouter" actif uniquement sur /items/nouveau */
  isAddItemRoute = false;

  /** "Outils" actif sur /reponses */
  isOutilsRoute  = false;

  constructor(
    private router:    Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.ifAdmin = this.methodesGlobal.ifAdminFunction();

    // Calculer l'état actif au chargement initial
    this.updateActiveRoutes(this.router.url);

    // Recalculer à chaque navigation
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.updateActiveRoutes(e.urlAfterRedirects));
  }

  closeSidebar(): void {
    const sidebar  = document.querySelector('.sidebar-offcanvas');
    const overlay  = document.getElementById('sidebarOverlay');
    if (sidebar?.classList.contains('active')) {
      sidebar.classList.remove('active');
      overlay?.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    }
  }

  private updateActiveRoutes(url: string): void {
    // Rechercher : commence par /items mais PAS /items/nouveau
    this.isSearchRoute  = url.startsWith('/items') && url !== '/items/nouveau';

    // Ajouter : uniquement /items/nouveau
    this.isAddItemRoute = url === '/items/nouveau';

    // Outils : /reponses et /import-logs
    this.isOutilsRoute  = url.startsWith('/reponses') || url.startsWith('/import-logs');
  }
}