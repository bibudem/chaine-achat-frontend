import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';
import {
  ImportService,
  ImportResult,
  FormTypeInfo,
  ColumnInfo,
  FORM_TYPES
} from '../../../services/import.service';

type Step = 'select' | 'notice' | 'upload' | 'preview' | 'result';

@Component({
  selector:    'app-import',
  templateUrl: './import.component.html',
  styleUrls:   ['./import.component.css']
})
export class ImportComponent implements OnDestroy {

  /* ─── État ─── */
  step:         Step             = 'select';
  selectedType: FormTypeInfo   | null = null;
  selectedFile: File           | null = null;
  isLoading     = false;
  isParsing     = false;
  hasError      = false;
  errorMessage  = '';
  result:       ImportResult   | null = null;
  dragOver      = false;

  /* ─── Prévisualisation ─── */
  previewHeaders: string[]     = [];
  previewRows:    any[][]      = [];
  previewTotal    = 0;

  /* ─── Données ─── */
  readonly formTypes: FormTypeInfo[] = FORM_TYPES;

  /* ─── Subscriptions ─── */
  private subs = new Subscription();

  constructor(
    private importService: ImportService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     NAVIGATION ENTRE ÉTAPES
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  selectType(info: FormTypeInfo): void {
    this.selectedType   = info;
    this.selectedFile   = null;
    this.result         = null;
    this.hasError       = false;
    this.previewHeaders = [];
    this.previewRows    = [];
    this.step           = 'notice';
  }

  goToUpload(): void { this.step = 'upload'; }

  backToSelect(): void {
    this.step         = 'select';
    this.selectedType = null;
    this.selectedFile = null;
  }

  backToNotice(): void {
    this.step         = 'notice';
    this.selectedFile = null;
    this.previewHeaders = [];
    this.previewRows    = [];
  }

  backToUpload(): void {
    this.step = 'upload';
    this.previewHeaders = [];
    this.previewRows    = [];
  }

  reset(): void {
    this.step           = 'select';
    this.selectedType   = null;
    this.selectedFile   = null;
    this.result         = null;
    this.hasError       = false;
    this.errorMessage   = '';
    this.previewHeaders = [];
    this.previewRows    = [];
  }

  getTypeColor(type: string): string {
    const t = (type ?? '').toLowerCase();
    if (t.includes('suggestion'))  return '#C8872A';
    if (t.includes('ccol'))        return '#3730A3';
    if (t.includes('abonnement'))  return '#6D28D9';
    if (t.includes('springer'))    return '#9A3412';
    if (t.includes('peb'))         return '#0369A1';
    if (t.includes('acq'))         return '#B91C1C';
    if (t.includes('achat'))       return '#1B5E6E';
    return '#0057AC';
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     GESTION DU FICHIER
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) { this.setFile(input.files[0]); }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) { this.setFile(file); }
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.dragOver = true; }
  onDragLeave(): void { this.dragOver = false; }
  removeFile(): void {
    this.selectedFile   = null;
    this.previewHeaders = [];
    this.previewRows    = [];
  }

  private setFile(file: File): void {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      this.hasError     = true;
      this.errorMessage = this.translate.instant('import.erreur.format');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.hasError     = true;
      this.errorMessage = this.translate.instant('import.erreur.taille');
      return;
    }
    this.hasError     = false;
    this.errorMessage = '';

    // Déclencher l'animation immédiatement dès la sélection du fichier
    this.isParsing    = true;
    this.selectedFile = file;

    // Simuler une lecture légère (vérification que le fichier est lisible)
    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => { this.isParsing = false; }, 800);
    };
    reader.onerror = () => {
      this.hasError     = true;
      this.errorMessage = this.translate.instant('import.erreur.lecture');
      this.isParsing    = false;
    };
    reader.readAsArrayBuffer(file.slice(0, 4096)); // lire seulement les 4 premiers Ko
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     PRÉVISUALISATION — parse côté client
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  previewFile(): void {
    if (!this.selectedFile) { return; }

    this.isParsing = true;   // relancer l'animation pendant la lecture complète
    this.hasError  = false;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data     = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw:    false
        });

        if (rows.length < 2) {
          this.hasError     = true;
          this.errorMessage = this.translate.instant('import.erreur.vide');
          setTimeout(() => { this.isParsing = false; }, 400);
          return;
        }

        // Détecter la vraie ligne d'en-têtes parmi les 5 premières lignes :
        // on cherche celle qui contient le plus de valeurs correspondant
        // aux noms de colonnes connus (obligatoires + facultatives)
        const knownCols = (this.selectedType?.columns ?? []).map(c => c.name);
        let headerRowIndex = 0;
        let bestScore = -1;

        for (let i = 0; i < Math.min(rows.length, 6); i++) {
          const cells = rows[i].map((c: any) => String(c ?? '').trim());
          // Score = nombre de cellules qui correspondent à un nom de colonne connu
          const score = cells.filter((c: string) => knownCols.includes(c)).length;
          // Fallback : ligne avec le plus de cellules non vides si aucune correspondance
          const nonEmpty = cells.filter((c: string) => c !== '' && c !== 'null').length;
          if (score > bestScore || (bestScore === 0 && nonEmpty > bestScore)) {
            bestScore = score > 0 ? score : nonEmpty;
            if (score > 0) headerRowIndex = i;
          }
        }

        this.previewHeaders = rows[headerRowIndex].map((h: any) => String(h));
        this.previewRows    = rows.slice(headerRowIndex + 1).filter(
          (r: any[]) => r.some((c: any) => c !== '' && c !== null)
        );
        this.previewTotal   = this.previewRows.length;

        // Vérifier colonnes obligatoires
        const required = this.selectedType?.columns
          .filter(c => c.required)
          .map(c => c.name) ?? [];
        const missing = required.filter(col => !this.previewHeaders.includes(col));

        if (missing.length > 0) {
          this.hasError     = true;
          this.errorMessage = `${this.translate.instant('import.erreur.col-manquantes')} ${missing.join(', ')}`;
          setTimeout(() => { this.isParsing = false; }, 400);
          return;
        }

        // Délai minimum 600ms pour que l'animation soit visible
        setTimeout(() => {
          this.isParsing = false;
          this.step      = 'preview';
        }, 600);

      } catch (err: any) {
        this.hasError     = true;
        this.errorMessage = this.translate.instant('import.erreur.lecture');
        this.isParsing    = false;
      }
    };

    reader.readAsArrayBuffer(this.selectedFile);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     IMPORT — envoi au backend
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  submitImport(): void {
    if (!this.selectedType || !this.selectedFile) { return; }

    this.isLoading = true;
    this.hasError  = false;

    const sub = this.importService
      .importFile(this.selectedType.type, this.selectedFile)
      .subscribe({
        next: (res: ImportResult) => {
          this.result    = res;
          this.step      = 'result';
          this.isLoading = false;
        },
        error: (err: any) => {
          this.result = {
            success:  false,
            message:  err.error?.error || err.error?.message || "Erreur lors de l'import",
            inserted: 0,
            total:    0,
            errors:   []
          };
          this.step      = 'result';
          this.isLoading = false;
        }
      });

    this.subs.add(sub);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     TÉLÉCHARGEMENT MODÈLE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  downloadTemplate(): void {
    if (!this.selectedType) { return; }
    this.importService.downloadTemplate(this.selectedType.type);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     GETTERS TEMPLATE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  get requiredColumns(): ColumnInfo[] {
    return this.selectedType?.columns.filter((c: ColumnInfo) => c.required) ?? [];
  }

  get optionalColumns(): ColumnInfo[] {
    return this.selectedType?.columns.filter((c: ColumnInfo) => !c.required) ?? [];
  }

  get fileSizeLabel(): string {
    if (!this.selectedFile) { return ''; }
    const kb = this.selectedFile.size / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} Ko` : `${(kb / 1024).toFixed(2)} Mo`;
  }

  get successRate(): number {
    if (!this.result?.total) { return 0; }
    return Math.round((this.result.inserted / this.result.total) * 100);
  }

  get stepIndex(): number {
    const steps: Step[] = ['select', 'notice', 'upload', 'preview', 'result'];
    return steps.indexOf(this.step) + 1;
  }

  /* Colonne obligatoire ? (pour surligner dans le tableau) */
  isRequiredCol(header: string): boolean {
    return this.selectedType?.columns.some(c => c.required && c.name === header) ?? false;
  }

  /* Cellule vide dans colonne obligatoire ? */
  isMissingRequired(header: string, value: any): boolean {
    return this.isRequiredCol(header) && (value === '' || value === null || value === undefined);
  }

  /* Ligne contient au moins une cellule obligatoire vide ? */
  hasRowError(row: any[]): boolean {
    return this.previewHeaders.some((h: string, j: number) =>
      this.isMissingRequired(h, row[j])
    );
  }

  /* Nb de lignes avec erreur (cellule obligatoire vide) */
  get rowsWithErrors(): number {
    return this.previewRows.filter(row =>
      this.previewHeaders.some((h, i) => this.isMissingRequired(h, row[i]))
    ).length;
  }
}