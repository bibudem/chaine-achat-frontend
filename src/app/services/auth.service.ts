import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, of } from 'rxjs';
import { tap, delay } from 'rxjs/operators';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export type UserRole = 'Admin' | 'Bibliothécaire' | 'Usager';

export interface SimulatedProfile {
  role:     UserRole;
  nom:      string;
  prenom:   string;
  courriel: string;
  groupe:   string;
  /** Affiché sur la carte de sélection */
  label:    string;
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
    label:       'Administrateur',
    description: 'Accès complet — création, modification et suppression',
    icon:        'bi-shield-lock-fill',
  },
  {
    role:        'Bibliothécaire',
    nom:         'ACQ',
    prenom:      'Lecteur',
    courriel:    'bib@bib.umontreal.ca',
    groupe:      'Lecteur ACQ',
    label:       'Lecteur ACQ',
    description: 'Consultation uniquement — lecture sans modification',
    icon:        'bi-book-half',
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
  get isBibliothécaire(): boolean { return this.role === 'Bibliothécaire'; }
  get isUsager(): boolean       { return this.role === 'Usager'; }

  /** Seul l'Administrateur peut créer / modifier / supprimer des items. */
  get canEdit(): boolean        { return this.isAdmin; }

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
