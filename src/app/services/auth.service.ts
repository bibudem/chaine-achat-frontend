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
/** 'Employe' = ancien rôle 'Usager' (personnel des bibliothèques, membre du groupe Azure AD
 *  bib-usagers), renommé pour laisser 'Usager' au nouveau rôle, plus restreint (toute
 *  personne avec un compte UdeM — accès à ses seules demandes). Valeur sans accent (comme
 *  les autres rôles) ; "Employé" n'apparaît qu'à l'affichage, voir roleLabel(). */
export type UserRole = 'SuperAdmin' | 'Admin' | 'TDM' | 'Employe' | 'Usager';

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
    role:        'SuperAdmin',
    nom:         'Système',
    prenom:      'Super',
    courriel:    'superadmin@bib.umontreal.ca',
    groupe:      'Gestionnaire',
    label:       'Super administrateur',
    subtitle:    'Gestion des comptes et des accès',
    description: 'Tout ce que voit le Services des acquisitions, plus la création des profils utilisateurs',
    icon:        'bi-shield-fill-check',
  },
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
    role:        'Employe',
    nom:         'Bibliothèques',
    prenom:      'Test',
    courriel:    'employe@umontreal.ca',
    groupe:      'Employé',
    label:       'Bibliothèques',
    subtitle:    'Personnel des bibliothèques (bib-usagers)',
    description: 'Formulaires de demande, suivi de mes demandes et consultation de toutes les demandes',
    icon:        'bi-person-fill',
  },
  {
    role:        'Usager',
    nom:         'UdeM',
    prenom:      'Test',
    courriel:    'usager@umontreal.ca',
    groupe:      'Usager',
    label:       'Communauté UdeM',
    subtitle:    'Toute personne avec un compte UdeM',
    description: 'Formulaires de demande et suivi de mes demandes seulement',
    icon:        'bi-person',
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

  /** Le SuperAdmin est un niveau supérieur à l'Admin : il hérite de tous ses accès (tableau
   *  de bord, configuration, édition des items…), voir isSuperAdmin ci-dessous pour son
   *  privilège exclusif (créer des profils utilisateurs). */
  get isAdmin(): boolean        { return this.role === 'Admin' || this.role === 'SuperAdmin'; }
  get isSuperAdmin(): boolean   { return this.role === 'SuperAdmin'; }
  get isTdm(): boolean          { return this.role === 'TDM'; }
  /** Personnel des bibliothèques (ex-rôle 'Usager', renommé) — accès complet au portail
   *  usager, y compris la consultation de toutes les demandes. */
  get isEmploye(): boolean      { return this.role === 'Employe'; }
  /** Toute personne avec un compte UdeM, sans être membre du personnel — accès au portail
   *  usager restreint à ses propres demandes (voir isUsagerSpace pour les deux combinés). */
  get isUsager(): boolean       { return this.role === 'Usager'; }
  /** Les deux rôles du portail usager — pour les droits communs (navigation, "Mes
   *  demandes"...) ; utiliser isEmploye seul pour ce qui est réservé au personnel. */
  get isUsagerSpace(): boolean  { return this.isUsager || this.isEmploye; }

  /** Seul l'Administrateur (et le SuperAdmin) peut créer / modifier / supprimer des items. */
  get canEdit(): boolean        { return this.isAdmin; }

  /** Accès à la page de décision ACQ/TDM (/statut-decision) : l'Administrateur (décision
   *  ACQ complète) et le TDM (catalogage/note TDM — champs ACQ affichés en lecture seule). */
  get canAccessDecision(): boolean { return this.isAdmin || this.isTdm; }

  /* ── Connexion simulée (dev uniquement) ──────────
     Passe par le vrai backend (/auth/dev-login, actif seulement hors production —
     voir routes/auth.js) pour obtenir un vrai JWT, comme le ferait Azure AD. Sans ça,
     sessionStorage serait peuplé côté client sans aucun token à envoyer à l'API,
     et tout appel protégé par requireAuth échouerait (401).
  ─────────────────────────────────────────────────── */
  loginWithDevProfile(role: UserRole): void {
    const cle: Record<UserRole, string> = {
      SuperAdmin: 'superadmin', Admin: 'admin', TDM: 'acq', Employe: 'employe', Usager: 'usager'
    };
    window.location.href = `${this.apiUrl}/auth/dev-login?role=${cle[role]}`;
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
   * Valide le token auprès du backend (/auth/me) et peuple la session.
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

  /* ── Déconnexion (application seulement — ne ferme pas la session Microsoft) ── */
  async logout(sessionExpired = false): Promise<void> {
    this.isLoggedIn = false;
    sessionStorage.clear();
    this.clearCookies();
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
    window.location.href = sessionExpired ? '/login?error=session_expired' : '/login';
  }

  /** Supprime tous les cookies du domaine de l'application (nettoyage à la déconnexion). */
  private clearCookies(): void {
    this.document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (!name) return;
      this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    });
  }
}
