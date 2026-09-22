import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, delay, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface MeResponse {
  success: boolean;
  data: {
    sub: string;
    email: string;
    nom: string;
    prenom: string;
    groupe: string;
    role: UserRole;
  };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export type UserRole = 'Admin' | 'TDM' | 'Usager';

export interface SimulatedProfile {
  role:     UserRole;
  nom:      string;
  prenom:   string;
  courriel: string;
  groupe:   string;
  /** Affiché sur la carte de sélection */
  label:    string;
  /** Sous-titre optionnel entre le label et la description (ex. nom complet d'un acronyme). */
  subtitle?: string;
  description: string;
  icon:     string;
}

/**
 * Profils de simulation pour l'installation locale (dev uniquement — voir isProduction
 * dans login.component.ts). En production, la connexion passe par Azure AD (loginWithAzure).
 */
export const SIMULATED_PROFILES: SimulatedProfile[] = [
  {
    role:        'Admin',
    nom:         'Admin',
    prenom:      'Système',
    courriel:    'admin@bib.umontreal.ca',
    groupe:      'Gestionnaire',
    label:       'Services des acquisitions',
    description: 'Tableau de bord, rapports, recherche et gestion des demandes',
    icon:        'bi-shield-lock-fill',
  },
  {
    role:        'TDM',
    nom:         'TDM',
    prenom:      'Agent',
    courriel:    'tdm@bib.umontreal.ca',
    groupe:      'TDM',
    label:       'TDM',
    subtitle:    'Traitement documentaire et métadonnées',
    description: 'Tableau de bord, catalogage et note TDM (Suivi ACQ), rapports et recherche',
    icon:        'bi-journal-bookmark-fill',
  },
  {
    role:        'Usager',
    nom:         'Bibliothèques',
    prenom:      'Test',
    courriel:    'usager@umontreal.ca',
    groupe:      'Usager',
    label:       'Bibliothèques',
    subtitle:    'Bibliothèques et Communauté UdeM',
    description: 'Formulaires de demande, suivi de mes demandes et consultation de toutes les demandes',
    icon:        'bi-person-fill',
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SERVICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
@Injectable()
export class AuthService {

  isLoggedIn: boolean =
    sessionStorage.getItem('role') !== null &&
    sessionStorage.getItem('role') !== '';

  redirectUrl: string = '/accueil';

  private readonly apiUrl = environment.apiUrl;

  constructor(
    @Inject(DOCUMENT) readonly document: Document,
    private http: HttpClient
  ) {}

  /* ── Accesseurs de rôle ──────────────────────── */

  get role(): UserRole | null {
    return sessionStorage.getItem('role') as UserRole | null;
  }

  get token(): string | null    { return sessionStorage.getItem('jwt'); }

  get isAdmin(): boolean        { return this.role === 'Admin'; }
  get isTdm(): boolean          { return this.role === 'TDM'; }
  get isUsager(): boolean       { return this.role === 'Usager'; }

  /** Seul l'Administrateur peut créer / modifier / supprimer des items. */
  get canEdit(): boolean        { return this.isAdmin; }

  /** Accès à la page de décision ACQ/TDM (/statut-decision) : l'Administrateur (décision
   *  ACQ complète) et le TDM (catalogage/note TDM — champs ACQ affichés en lecture seule). */
  get canAccessDecision(): boolean { return this.isAdmin || this.isTdm; }

  /* ── Connexion simulée (dev uniquement) ──────────
     En production, voir loginWithAzure() + completeAzureLogin().
  ─────────────────────────────────────────────────── */
  simulateLogin(profile: SimulatedProfile): void {
    sessionStorage.setItem('nomAdmin',      profile.nom);
    sessionStorage.setItem('prenomAdmin',   profile.prenom);
    sessionStorage.setItem('courrielAdmin', profile.courriel);
    sessionStorage.setItem('groupeAdmin',   profile.groupe);
    sessionStorage.setItem('role',          profile.role);
    this.isLoggedIn = true;
  }

  /**
   * Conservé pour la compatibilité avec AuthGuard (login auto si déjà en session).
   * En production ce sera remplacé par la validation du token Azure AD.
   */
  async login(): Promise<Observable<boolean>> {
    return of(this.isLoggedIn).pipe(
      delay(50),
      tap(val => { this.isLoggedIn = val; })
    );
  }

  /* ── Connexion réelle Azure AD (production) ──────
     Redirige vers le backend qui gère le flux OAuth2 avec Azure AD.
  ─────────────────────────────────────────────────── */
  loginWithAzure(): void {
    window.location.href = `${this.apiUrl}/auth/login`;
  }

  /**
   * Appelée par AuthCallbackComponent après la redirection Azure AD (?token=...).
   * Valide le token auprès du backend (/auth/me) et peuple la session, comme simulateLogin().
   */
  completeAzureLogin(token: string): Observable<boolean> {
    sessionStorage.setItem('jwt', token);
    return this.http.get<MeResponse>(`${this.apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(res => {
        if (!res?.success) throw new Error('Échec de récupération du profil');
        const { nom, prenom, email, groupe, role } = res.data;
        sessionStorage.setItem('nomAdmin',      nom);
        sessionStorage.setItem('prenomAdmin',   prenom);
        sessionStorage.setItem('courrielAdmin', email);
        sessionStorage.setItem('groupeAdmin',   groupe);
        sessionStorage.setItem('role',          role);
        this.isLoggedIn = true;
        return true;
      }),
      catchError(() => {
        sessionStorage.clear();
        this.isLoggedIn = false;
        return of(false);
      })
    );
  }

  /* ── Déconnexion ─────────────────────────────── */
  async logout(): Promise<void> {
    const wasAzureSession = !!this.token;
    this.isLoggedIn = false;
    sessionStorage.clear();
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
    if (environment.production && wasAzureSession) {
      window.location.href = `${this.apiUrl}/auth/logout`;
    } else {
      window.location.href = '/login';
    }
  }
}
