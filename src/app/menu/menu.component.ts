import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router, NavigationEnd } from '@angular/router';
import { MethodesGlobal } from '../lib/MethodesGlobal';
import { filter } from 'rxjs/operators';

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

  /** "Outils" actif sur /lst-fournisseurs et sous-routes */
  isOutilsRoute  = false;

  constructor(
    private translate: TranslateService,
    private router:    Router
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

  private updateActiveRoutes(url: string): void {
    // Rechercher : commence par /items mais PAS /items/nouveau
    this.isSearchRoute  = url.startsWith('/items') && url !== '/items/nouveau';

    // Ajouter : uniquement /items/nouveau
    this.isAddItemRoute = url === '/items/nouveau';

    // Outils : /lst-fournisseurs, /reponses et sous-routes
    this.isOutilsRoute  = url.startsWith('/lst-fournisseurs') || url.startsWith('/reponses');
  }
}