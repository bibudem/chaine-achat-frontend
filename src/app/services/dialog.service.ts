import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface DialogConfig {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export interface DialogResult {
  confirmed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogSubject = new Subject<DialogConfig>();
  private resultSubject = new Subject<DialogResult>();

  dialog$ = this.dialogSubject.asObservable();
  result$ = this.resultSubject.asObservable();

  showSuccess(message: string, title: string = 'Succès'): void {
    this.dialogSubject.next({
      title,
      message,
      type: 'success',
      confirmText: 'OK'
    });
  }

  showError(message: string, title: string = 'Erreur'): void {
    this.dialogSubject.next({
      title,
      message,
      type: 'error',
      confirmText: 'OK'
    });
  }

  showWarning(message: string, title: string = 'Attention'): void {
    this.dialogSubject.next({
      title,
      message,
      type: 'warning',
      confirmText: 'OK'
    });
  }

  showInfo(message: string, title: string = 'Information'): void {
    this.dialogSubject.next({
      title,
      message,
      type: 'info',
      confirmText: 'OK'
    });
  }

  confirm(message: string, title: string = 'Confirmation'): Promise<boolean> {
    this.dialogSubject.next({
      title,
      message,
      type: 'confirm',
      confirmText: 'Confirmer',
      cancelText: 'Annuler'
    });

    return new Promise((resolve) => {
      const subscription = this.result$.subscribe((result) => {
        resolve(result.confirmed);
        subscription.unsubscribe();
      });
    });
  }

  emitResult(confirmed: boolean): void {
    this.resultSubject.next({ confirmed });
  }
}