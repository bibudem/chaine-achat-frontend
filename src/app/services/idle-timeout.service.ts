import { Injectable, NgZone } from '@angular/core';
import { AuthService } from './auth.service';

const IDLE_LIMIT_MS = 60 * 60 * 1000; // 1 heure
const CHECK_INTERVAL_MS = 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

/** Déconnecte automatiquement l'usager après 1h sans activité (souris/clavier/scroll/tactile). */
@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private lastActivity = Date.now();
  private intervalId?: any;
  private started = false;

  constructor(private authService: AuthService, private ngZone: NgZone) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    this.lastActivity = Date.now();

    this.ngZone.runOutsideAngular(() => {
      ACTIVITY_EVENTS.forEach(evt =>
        document.addEventListener(evt, this.onActivity, { passive: true })
      );
      this.intervalId = setInterval(() => this.checkIdle(), CHECK_INTERVAL_MS);
    });
  }

  private onActivity = (): void => {
    this.lastActivity = Date.now();
  };

  private checkIdle(): void {
    if (!this.authService.isLoggedIn) return;
    if (Date.now() - this.lastActivity >= IDLE_LIMIT_MS) {
      this.ngZone.run(() => this.authService.logout(true));
    }
  }
}
