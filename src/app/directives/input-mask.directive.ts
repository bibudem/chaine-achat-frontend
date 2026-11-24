import { Directive, ElementRef, HostListener, OnDestroy, Renderer2, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { nettoyerIdentifiant } from '../lib/IdentifiantDocument';

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
 * Masque isbn_issn (« ISBN / ISSN / Autre identifiant ») : retire les tirets seulement si la
 * valeur commence par 9 (ISBN) ; sinon saisie libre (ISSN, autre identifiant, N/A) — même
 * règle que les formulaires usager, voir lib/IdentifiantDocument.ts.
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
    const cleaned = nettoyerIdentifiant(ctrl.value);
    this.wasStripped = ctrl.value !== cleaned;
    if (this.wasStripped) {
      ctrl.setValue(cleaned, { emitEvent: false });
    }
  }
}

/**
 * Courte ligne grise affichée sous un champ quand un masque a corrigé la saisie ; retirée à
 * la sortie du champ.
 */
class AideMasque {
  private el: HTMLElement | null = null;

  constructor(private hote: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  afficher(texte: string): void {
    if (!this.el) {
      this.el = this.renderer.createElement('small');
      this.renderer.addClass(this.el, 'aide-masque');
      this.renderer.setAttribute(this.el, 'aria-live', 'polite');
      const parent = this.renderer.parentNode(this.hote.nativeElement);
      this.renderer.insertBefore(parent, this.el, this.renderer.nextSibling(this.hote.nativeElement));
    }
    this.renderer.setProperty(this.el, 'textContent', texte);
  }

  masquer(): void {
    if (!this.el) return;
    this.renderer.removeChild(this.renderer.parentNode(this.el), this.el);
    this.el = null;
  }
}

/**
 * Masque courriel : convertit en minuscules et supprime les espaces à la saisie.
 */
@Directive({ selector: '[appEmailMask]' })
export class EmailMaskDirective implements OnDestroy {

  private aide: AideMasque;

  constructor(
    @Self() private ngControl: NgControl,
    hote: ElementRef<HTMLElement>,
    renderer: Renderer2,
    private translate: TranslateService
  ) {
    this.aide = new AideMasque(hote, renderer);
  }

  @HostListener('input')
  onInput(): void {
    const ctrl = this.ngControl.control;
    if (!ctrl) return;
    const cleaned = (ctrl.value ?? '').toLowerCase().replace(/\s/g, '');
    if (ctrl.value !== cleaned) {
      ctrl.setValue(cleaned, { emitEvent: false });
      this.aide.afficher(this.translate.instant('masques.courriel'));
    }
  }

  @HostListener('blur')
  onBlur(): void { this.aide.masquer(); }

  ngOnDestroy(): void { this.aide.masquer(); }
}
