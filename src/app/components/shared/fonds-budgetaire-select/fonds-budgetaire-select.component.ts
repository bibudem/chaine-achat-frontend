import { Component, ElementRef, forwardRef, HostListener, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FondsBudgetairesService } from '../../../services/fonds-budgetaires.service';

/**
 * Liste déroulante « Fonds budgétaire » avec recherche + option « Autre » (champ de
 * précision en texte libre) — voir Configuration > Fonds budgétaires pour la liste gérée.
 *
 * ControlValueAccessor : se branche exactement comme un <input>/<select> classique via
 * formControlName="fonds_budgetaire" — la valeur qu'il pousse au FormControl reste une
 * simple chaîne (le code choisi, ou le texte tapé en mode Autre), donc les validateurs déjà
 * en place dans chaque formulaire (required, pattern 2-4 lettres + tiret + chiffres, etc.)
 * s'appliquent sans aucun changement.
 */
@Component({
  selector: 'app-fonds-budgetaire-select',
  templateUrl: './fonds-budgetaire-select.component.html',
  styleUrls: ['./fonds-budgetaire-select.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FondsBudgetaireSelectComponent),
    multi: true
  }]
})
export class FondsBudgetaireSelectComponent implements ControlValueAccessor, OnInit {
  @Input() invalid = false;

  codes: string[] = [];
  ouvert = false;
  recherche = '';
  valeur: string | null = null;
  modeAutre = false;
  autreTexte = '';
  disabled = false;

  private codesCharges = false;
  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private fondsService: FondsBudgetairesService,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.fondsService.getAll().subscribe({
      next: (res) => {
        this.codes = (res.data || []).map(f => f.code);
        this.codesCharges = true;
        this.actualiserModeAutre();
      },
      // Liste indisponible (réseau, etc.) : on laisse quand même l'usager saisir en mode
      // Autre plutôt que de bloquer le formulaire.
      error: () => { this.codesCharges = true; this.actualiserModeAutre(); }
    });
  }

  get resultatsFiltres(): string[] {
    const q = this.recherche.trim().toLowerCase();
    if (!q) return this.codes;
    return this.codes.filter(c => c.toLowerCase().includes(q));
  }

  writeValue(v: string | null): void {
    this.valeur = v || null;
    this.actualiserModeAutre();
  }

  registerOnChange(fn: (v: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  /** Tant que la liste n'est pas chargée, on ne bascule pas en mode Autre pour éviter un
   *  flash (la valeur chargée en édition apparaîtrait en Autre le temps de l'appel réseau). */
  private actualiserModeAutre(): void {
    if (!this.codesCharges) return;
    this.modeAutre = !!this.valeur && !this.codes.includes(this.valeur);
    this.autreTexte = this.modeAutre ? (this.valeur || '') : '';
  }

  toggleOuvert(): void {
    if (this.disabled) return;
    this.ouvert = !this.ouvert;
    if (this.ouvert) this.recherche = '';
  }

  choisir(code: string): void {
    this.valeur   = code;
    this.modeAutre = false;
    this.ouvert    = false;
    this.onChange(code);
    this.onTouched();
  }

  choisirAutre(): void {
    this.modeAutre  = true;
    this.ouvert     = false;
    this.autreTexte = '';
    this.valeur     = null;
    this.onChange(null);
  }

  onAutreInput(val: string): void {
    const formate    = this.formaterAutre(val);
    this.autreTexte = formate;
    this.valeur     = formate || null;
    this.onChange(this.valeur);
  }

  /** Même règle que l'ancienne directive appFondsBudgetaireMask (auto-majuscules + tiret
   *  auto-inséré) — appliquée ici directement plutôt que via la directive, pour éviter un
   *  décalage entre le ngModel interne (mode Autre) et la valeur propagée au FormControl
   *  hôte via onChange (la directive corrige avec emitEvent:false, ce qui ne redéclenche
   *  pas ngModelChange et laisserait onChange un cran en retard). */
  private formaterAutre(val: string): string {
    const brut = (val || '').toUpperCase().replace(/-/g, '');
    let prefixe = '';
    let i = 0;
    while (i < brut.length && prefixe.length < 2 && /[A-Z]/.test(brut[i])) {
      prefixe += brut[i++];
    }
    let suffixe = '';
    while (i < brut.length && suffixe.length < 3) {
      if (/\d/.test(brut[i])) suffixe += brut[i];
      i++;
    }
    if (prefixe.length === 2 && (val.includes('-') || suffixe.length > 0)) {
      return `${prefixe}-${suffixe}`;
    }
    return prefixe;
  }

  onAutreBlur(): void {
    this.onTouched();
  }

  revenirListe(): void {
    this.modeAutre  = false;
    this.valeur     = null;
    this.autreTexte = '';
    this.onChange(null);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (this.ouvert && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.ouvert = false;
      this.onTouched();
    }
  }
}
