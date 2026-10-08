import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { ReponsesService } from '../../../services/reponses.service';
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
  formsOpen = false;
  /** Suggestions publiques en attente de tri (pastille du bouton « Tri ») — équipe TechDoc. */
  aTrier    = 0;

  currentLang: string = localStorage.getItem('lang') ?? 'fr';
  currentYear: number = new Date().getFullYear();

  constructor(
    public  authService: AuthService,
    private translate:   TranslateService,
    private router:      Router,
    private reponsesService: ReponsesService
  ) {}

  ngOnInit(): void {
    const prenom = sessionStorage.getItem('prenomAdmin') ?? '';
    const nom    = sessionStorage.getItem('nomAdmin')    ?? '';
    this.userName  = `${prenom} ${nom}`.trim();
    this.initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    this.translate.use(this.currentLang);

    if (this.authService.canTrier) {
      this.rafraichirATrier();
      // Rafraîchie à chaque navigation : le compteur baisse dès qu'une suggestion est triée.
      this.router.events.pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => this.rafraichirATrier());
    }
  }

  private rafraichirATrier(): void {
    this.reponsesService.compterATrier().subscribe({
      next: n => this.aTrier = n,
      error: () => {}   // non bloquant : la pastille reste simplement à sa dernière valeur
    });
  }

  triSuggestions(): void {
    this.userOpen = false;
    this.router.navigate(['/usager/tri']);
  }

  toggleUser(event: Event): void {
    event.stopPropagation();
    this.userOpen  = !this.userOpen;
    this.formsOpen = false;
  }

  toggleForms(event: Event): void {
    event.stopPropagation();
    this.formsOpen = !this.formsOpen;
    this.userOpen  = false;
  }

  /** Navigation directe (pas de nouvel onglet) — on est déjà dans l'espace usager, pas de
   *  travail en cours à préserver dans un autre onglet contrairement au header admin. */
  ouvrirFormulaire(chemin: string): void {
    this.formsOpen = false;
    this.router.navigate([chemin]);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.userOpen  = false;
    this.formsOpen = false;
  }

  mesDemandes(): void {
    this.userOpen = false;
    this.router.navigate(['/usager/profil']);
  }

  nouvelleDemande(): void {
    this.userOpen = false;
    this.router.navigate(['/usager']);
  }

  /** Admin/TDM/Employé/TechDoc — accès à l'interface de gestion (en lecture seule pour
   *  Employé/TechDoc, voir canEdit/EditGuard) — voir header.component.ts,
   *  accederEspaceUsager : simple navigation, la session reste la même. */
  retourGestion(): void {
    this.userOpen = false;
    this.router.navigate(['/accueil']);
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