import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ReponsesService } from '../services/reponses.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentDate   = new Date();
  isProduction  = environment.production;
  currentLang: string = localStorage.getItem('lang') ?? 'fr';

  pendingCount    = 0;
  pendingReponses: { id: number; type_formulaire: string; usager_nom: string; dateA: string }[] = [];
  notifOpen       = false;
  formsOpen       = false;
  userOpen        = false;

  private pollInterval: any;
  private refreshSub?: Subscription;

  get nomAdmin():    string { return sessionStorage.getItem('nomAdmin')    ?? ''; }
  get prenomAdmin(): string { return sessionStorage.getItem('prenomAdmin') ?? ''; }
  get groupeAdmin(): string { return sessionStorage.getItem('groupeAdmin') ?? ''; }

  constructor(
    public  authService: AuthService,
    private translate:   TranslateService,
    public  router:      Router,
    private reponsesService: ReponsesService
  ) {}

  ngOnInit(): void {
    this.translate.setDefaultLang('fr');
    this.translate.use(this.currentLang);
    if (this.authService.isAdmin) {
      this.chargerPending();
      this.pollInterval = setInterval(() => this.chargerPending(), 60_000);
      this.refreshSub = this.reponsesService.pendingRefresh$.subscribe(
        () => this.chargerPending()
      );
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
    this.refreshSub?.unsubscribe();
  }

  private chargerPending(): void {
    this.reponsesService.getPending(5).subscribe({
      next: (r) => {
        this.pendingCount    = r.count;
        this.pendingReponses = r.reponses;
      }
    });
  }

  toggleNotif(event: Event): void {
    event.stopPropagation();
    this.notifOpen = !this.notifOpen;
    this.formsOpen = false;
    this.userOpen  = false;
  }

  toggleForms(event: Event): void {
    event.stopPropagation();
    this.formsOpen = !this.formsOpen;
    this.notifOpen = false;
    this.userOpen  = false;
  }

  ouvrirFormulaire(chemin: string): void {
    window.open(chemin, '_blank', 'noopener,noreferrer');
    this.formsOpen = false;
  }

  toggleUser(event: Event): void {
    event.stopPropagation();
    this.userOpen  = !this.userOpen;
    this.notifOpen = false;
    this.formsOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.notifOpen = false;
    this.formsOpen = false;
    this.userOpen  = false;
  }

  voirTout(): void {
    this.notifOpen = false;
    this.router.navigate(['/reponses']);
  }

  ouvrirReponse(id: number): void {
    this.notifOpen = false;
    this.router.navigate(['/reponses'], { queryParams: { highlight: id } });
  }

  typeClass(type: string): string {
    const map: Record<string, string> = {
      'Nouvel achat unique':        'notif-type--achat',
      'Modification et CCOL':       'notif-type--ccol',
      'Nouvel abonnement':          'notif-type--abo',
      'PEB Tipasa numérique':       'notif-type--peb',
      'Requête ACQ Accessibilité':  'notif-type--acq',
    };
    return map[type] ?? 'notif-type--suggest';
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      'Nouvel achat unique':        'bi-cart-plus',
      'Modification et CCOL':       'bi-pencil-square',
      'Nouvel abonnement':          'bi-calendar-check',
      'PEB Tipasa numérique':       'bi-share',
      'Requête ACQ Accessibilité':  'bi-universal-access',
    };
    return map[type] ?? 'bi-lightbulb';
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  logout(): void {
    this.authService.logout();
  }

  switchLanguage(language: string): void {
    this.currentLang = language;
    this.translate.use(language);
    localStorage.setItem('lang', language);
  }
}

