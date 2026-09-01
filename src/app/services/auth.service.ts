import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, of } from 'rxjs';
import { tap, delay } from 'rxjs/operators';

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
 * Profils de simulation pour l'installation locale.
 * Supprimés (ou ignorés) lorsque l'authentification Azure AD sera activée.
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
    nom:         'Communauté UdeM',
    prenom:      'Test',
    courriel:    'usager@umontreal.ca',
    groupe:      'Usager',
    label:       'Communauté UdeM',
    description: 'Accès aux formulaires de demande uniquement',
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

  constructor(@Inject(DOCUMENT) readonly document: Document) {}

  /* ── Accesseurs de rôle ──────────────────────── */

  get role(): UserRole | null {
    return sessionStorage.getItem('role') as UserRole | null;
  }

  get isAdmin(): boolean        { return this.role === 'Admin'; }
  get isTdm(): boolean          { return this.role === 'TDM'; }
  get isUsager(): boolean       { return this.role === 'Usager'; }

  /** Seul l'Administrateur peut créer / modifier / supprimer des items. */
  get canEdit(): boolean        { return this.isAdmin; }

  /** Accès à la page de décision ACQ/TDM (/statut-decision) : l'Administrateur (décision
   *  ACQ complète) et le TDM (catalogage/note TDM — champs ACQ affichés en lecture seule). */
  get canAccessDecision(): boolean { return this.isAdmin || this.isTdm; }

  /* ── Connexion simulée (installation locale) ─────
     Remplacer par le flux Azure AD OAuth2 en production :
     window.location.href = '/api/auth/azure';
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

  /* ── Déconnexion ─────────────────────────────── */
  async logout(): Promise<void> {
    this.isLoggedIn = false;
    sessionStorage.clear();
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
    // En production : window.location.href = '/api/logout';
    window.location.href = '/login';
  }
}
