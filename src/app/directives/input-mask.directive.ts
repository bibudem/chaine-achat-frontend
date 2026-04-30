import { Directive, HostListener, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Masque fonds_budgetaire : format AA-### (ex: PE-001, MO-260, SN-080)
 * - Auto-majuscules
 * - Tiret inséré automatiquement après les 2 premières lettres
 * - Préfixe : lettres uniquement (max 2) ; suffixe : chiffres uniquement (max 3)
 */
@Directive({ selector: '[appFondsBudgetaireMask]' })
export class FondsBudgetaireMaskDirective {

  constructor(@Self() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Retire les tirets, met en majuscules
    const raw = input.value.toUpperCase().replace(/-/g, '');

    // Collect max 2 lettres pour le préfixe
    let prefix = '';
    let i = 0;
    while (i < raw.length && prefix.length < 2 && /[A-Z]/.test(raw[i])) {
      prefix += raw[i++];
    }

    // Collect max 3 chiffres pour le suffixe (ignore les autres chars)
    let suffix = '';
    while (i < raw.length && suffix.length < 3) {
      if (/\d/.test(raw[i])) suffix += raw[i];
      i++;
    }

    // Reconstruit la valeur formatée
    let formatted: string;
    if (prefix.length === 2 && (input.value.includes('-') || suffix.length > 0)) {
      formatted = `${prefix}-${suffix}`;
    } else {
      formatted = prefix;
    }

    if (this.ngControl.control?.value !== formatted) {
      this.ngControl.control?.setValue(formatted, { emitEvent: false });
      input.value = formatted;
      input.setSelectionRange(formatted.length, formatted.length);
    }
  }
}

/**
 * Masque isbn_issn : chiffres uniquement (0-9), tout autre caractère est supprimé à la saisie.
 * Expose `wasStripped` via exportAs="appIsbnMask" pour afficher un message dans le template.
 */
@Directive({ selector: '[appIsbnMask]', exportAs: 'appIsbnMask' })
export class IsbnMaskDirective {

  wasStripped = false;

  constructor(@Self() private ngControl: NgControl) {}

  @HostListener('input')
  onInput(): void {
    const ctrl = this.ngControl.control;
    if (!ctrl) return;
    const cleaned = (ctrl.value ?? '').replace(/\D/g, '');
    this.wasStripped = ctrl.value !== cleaned;
    if (this.wasStripped) {
      ctrl.setValue(cleaned, { emitEvent: false });
    }
  }
}

/**
 * Masque courriel : convertit en minuscules et supprime les espaces à la saisie.
 */
@Directive({ selector: '[appEmailMask]' })
export class EmailMaskDirective {

  constructor(@Self() private ngControl: NgControl) {}

  @HostListener('input')
  onInput(): void {
    const ctrl = this.ngControl.control;
    if (!ctrl) return;
    const cleaned = (ctrl.value ?? '').toLowerCase().replace(/\s/g, '');
    if (ctrl.value !== cleaned) {
      ctrl.setValue(cleaned, { emitEvent: false });
    }
  }
}
