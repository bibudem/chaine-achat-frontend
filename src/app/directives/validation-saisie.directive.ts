import { Directive, HostListener, OnDestroy, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

/** Délai sans frappe avant d'afficher une erreur de format. */
export const DELAI_VALIDATION_MS = 900;

/**
 * Validation pendant la saisie, appliquée à tous les champs texte des formulaires réactifs.
 *
 * Les formulaires affichent une erreur quand le champ est « touché » (quitté) ou à l'envoi.
 * Cette directive marque aussi le champ comme touché après une courte pause de frappe si la
 * valeur saisie n'est pas valide : le rouge et le message apparaissent sans attendre la sortie
 * du champ, mais pas pendant qu'on tape. Un champ vide n'est jamais signalé ici (« obligatoire »
 * s'affiche à la sortie du champ ou à l'envoi). Une fois l'erreur affichée, elle disparaît dès
 * que la valeur devient valide.
 */
@Directive({
  selector: 'input[formControlName]:not([type=checkbox]):not([type=radio]):not([type=file]), textarea[formControlName]'
})
export class ValidationSaisieDirective implements OnDestroy {

  private minuterie?: ReturnType<typeof setTimeout>;

  constructor(@Self() private ngControl: NgControl) {}

  @HostListener('input')
  onInput(): void {
    clearTimeout(this.minuterie);
    const ctrl = this.ngControl.control;
    if (!ctrl || ctrl.touched) return;
    this.minuterie = setTimeout(() => {
      const v = ctrl.value;
      const rempli = v !== null && v !== undefined && String(v).trim() !== '';
      if (rempli && ctrl.invalid) ctrl.markAsTouched();
    }, DELAI_VALIDATION_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.minuterie);
  }
}
