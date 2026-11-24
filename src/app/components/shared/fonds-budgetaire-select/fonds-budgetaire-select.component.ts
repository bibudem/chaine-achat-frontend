import { Component, ElementRef, forwardRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FondsBudgetairesService } from '../../../services/fonds-budgetaires.service';
import { DELAI_VALIDATION_MS } from '../../../directives/validation-saisie.directive';

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
  /** Code surligné dans la liste (navigation au clavier). */
  indexSurligne = 0;
  /** Mode Autre : le masque a retiré des caractères (affiche le format attendu). */
  aideMasque = false;
  private minuterie?: ReturnType<typeof setTimeout>;

  @ViewChild('declencheur') private declencheur?: ElementRef<HTMLButtonElement>;
  @ViewChild('champRecherche') private champRecherche?: ElementRef<HTMLInputElement>;
  @ViewChild('liste') private liste?: ElementRef<HTMLUListElement>;

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
    this.ouvert ? this.fermer(false) : this.ouvrir();
  }

  /** Ouvre la liste, place le curseur dans la recherche et surligne la valeur actuelle. */
  private ouvrir(): void {
    this.ouvert = true;
    this.recherche = '';
    const i = this.valeur ? this.codes.indexOf(this.valeur) : -1;
    this.indexSurligne = i >= 0 ? i : 0;
    setTimeout(() => {
      this.champRecherche?.nativeElement.focus();
      this.defilerVersSurligne();
    });
  }

  private fermer(refocus: boolean): void {
    this.ouvert = false;
    this.onTouched();
    if (refocus) setTimeout(() => this.declencheur?.nativeElement.focus());
  }

  /** Bouton fermé : ↓, Entrée ou Espace ouvrent la liste. */
  onDeclencheurKeydown(e: KeyboardEvent): void {
    if (this.disabled || this.ouvert) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.ouvrir();
    }
  }

  /** Recherche : le premier code correspondant est surligné (le code exact s'il existe). */
  onRecherche(val: string): void {
    this.recherche = val;
    const q = (val || '').trim().toLowerCase();
    const exact = this.resultatsFiltres.findIndex(c => c.toLowerCase() === q);
    this.indexSurligne = exact >= 0 ? exact : 0;
    this.defilerVersSurligne();
  }

  onRechercheKeydown(e: KeyboardEvent): void {
    const n = this.resultatsFiltres.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (n) { this.indexSurligne = (this.indexSurligne + 1) % n; this.defilerVersSurligne(); }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (n) { this.indexSurligne = (this.indexSurligne - 1 + n) % n; this.defilerVersSurligne(); }
        break;
      case 'Enter':
        // Ne jamais soumettre le formulaire parent depuis ce champ.
        e.preventDefault();
        if (n) this.choisir(this.resultatsFiltres[Math.min(this.indexSurligne, n - 1)]);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        this.fermer(true);
        break;
      case 'Tab':
        this.ouvert = false;
        this.onTouched();
        break;
    }
  }

  private defilerVersSurligne(): void {
    setTimeout(() => {
      const el = this.liste?.nativeElement.children[this.indexSurligne] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  choisir(code: string): void {
    this.valeur   = code;
    this.modeAutre = false;
    this.onChange(code);
    // Focus rendu au bouton : Tab passe ensuite au champ suivant.
    this.fermer(true);
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
    // Caractères retirés par le masque : on explique le format attendu.
    const sansTiret = (s: string) => (s || '').toUpperCase().replace(/-/g, '');
    if (sansTiret(formate) !== sansTiret(val)) this.aideMasque = true;
    // Après une pause de frappe, le champ est marqué « touché » : une erreur de format
    // s'affiche sans attendre la sortie du champ (même règle que ValidationSaisieDirective).
    clearTimeout(this.minuterie);
    if (this.valeur) this.minuterie = setTimeout(() => this.onTouched(), DELAI_VALIDATION_MS);
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
    clearTimeout(this.minuterie);
    this.aideMasque = false;
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
