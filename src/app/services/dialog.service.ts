import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface DialogConfig {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export interface DialogResult {
  id: number;
  confirmed: boolean;
}

/**
 * File d'attente : une seule boîte de dialogue visible à la fois. Sans ça, un showError()/
 * showSuccess() déclenché pendant qu'un confirm() est encore en attente de réponse
 * remplaçait silencieusement son contenu (même état global, un seul "config") — l'utilisateur
 * répondait alors au mauvais message, et comme confirm() résolvait sur n'importe quel
 * emitResult() (pas seulement le sien), cliquer "OK" sur le message affiché pouvait valider
 * une confirmation d'une tout autre action (ex. une suppression) sans que l'utilisateur l'ait
 * vue. Chaque appel a maintenant un id ; confirm() n'écoute que le résultat de SON id, et les
 * demandes suivantes attendent en file plutôt que d'écraser la boîte affichée.
 */
@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogSubject = new Subject<DialogConfig>();
  private resultSubject = new Subject<DialogResult>();

  private queue: DialogConfig[] = [];
  private activeId: number | null = null;
  private nextId = 1;

  dialog$ = this.dialogSubject.asObservable();
  result$ = this.resultSubject.asObservable();

  private enqueue(cfg: Omit<DialogConfig, 'id'>): number {
    const id = this.nextId++;
    this.queue.push({ ...cfg, id });
    if (this.activeId == null) this.processNext();
    return id;
  }

  private processNext(): void {
    const next = this.queue[0];
    if (!next) { this.activeId = null; return; }
    this.activeId = next.id;
    this.dialogSubject.next(next);
  }

  showSuccess(message: string, title: string = 'Succès'): void {
    this.enqueue({ title, message, type: 'success', confirmText: 'OK' });
  }

  showError(message: string, title: string = 'Erreur'): void {
    this.enqueue({ title, message, type: 'error', confirmText: 'OK' });
  }

  showWarning(message: string, title: string = 'Attention'): void {
    this.enqueue({ title, message, type: 'warning', confirmText: 'OK' });
  }

  showInfo(message: string, title: string = 'Information'): void {
    this.enqueue({ title, message, type: 'info', confirmText: 'OK' });
  }

  confirm(message: string, title: string = 'Confirmation'): Promise<boolean> {
    const id = this.enqueue({
      title,
      message,
      type: 'confirm',
      confirmText: 'Confirmer',
      cancelText: 'Annuler'
    });

    return new Promise((resolve) => {
      const subscription = this.result$.subscribe((result) => {
        if (result.id !== id) return; // réponse pour une autre boîte de dialogue en file
        resolve(result.confirmed);
        subscription.unsubscribe();
      });
    });
  }

  /** Appelé par DialogComponent au clic sur le bouton principal/annuler de la boîte affichée. */
  emitResult(confirmed: boolean): void {
    if (this.activeId == null) return;
    const id = this.activeId;
    this.queue = this.queue.filter(d => d.id !== id);
    this.resultSubject.next({ id, confirmed });
    this.processNext();
  }
}
