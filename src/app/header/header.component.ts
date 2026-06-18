import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  pendingReponses: { id: number; type_formulaire: string; usager_nom: string; dateA: string; source: 'reponse' | 'import' | 'reponse-created'; item_id: number | null; notifType: 'biblio' | 'acq' }[] = [];
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
    forkJoin([
      this.reponsesService.getPending(5),
      this.reponsesService.getPendingAcq(5).pipe(
        catchError(() => of({ count: 0, reponses: [] as any[] }))
      )
    ]).subscribe({
      next: ([biblio, acq]) => {
        const seen = new Set<string>();
        const tagged = [
          ...biblio.reponses.map(r => ({ ...r, notifType: 'biblio' as const })),
          ...acq.reponses.map(r =>    ({ ...r, notifType: 'acq'   as const }))
        ];
        const unique = tagged.filter(r => {
          const key = r.item_id != null ? `item-${r.item_id}` : `rep-${r.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        this.pendingCount    = biblio.count + acq.count;
        this.pendingReponses = unique.slice(0, 5);
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

  ouvrirReponse(r: { id: number; source: 'reponse' | 'import' | 'reponse-created'; item_id: number | null; notifType: 'biblio' | 'acq' }): void {
    this.notifOpen = false;
    if (r.source === 'reponse') {
      this.router.navigate(['/statut-decision'], { queryParams: { reponse_id: r.id } });
    } else if (r.notifType === 'acq') {
      this.router.navigate(['/items', r.item_id], { queryParams: { tab: 'acq-decision' } });
    } else {
      this.router.navigate(['/items', r.item_id]);
    }
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

  toggleMinimize(): void {
    document.body.classList.toggle('sidebar-icon-only');
  }

  toggleSidebar(): void {
    const sidebar  = document.querySelector('.sidebar-offcanvas');
    const overlay  = document.getElementById('sidebarOverlay');
    if (sidebar) {
      const isOpen = sidebar.classList.toggle('active');
      overlay?.classList.toggle('active', isOpen);
      document.body.classList.toggle('sidebar-open', isOpen);
    }
  }

  mesDemandes(): void {
    this.userOpen = false;
    this.router.navigate(['/usager/profil']);
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

