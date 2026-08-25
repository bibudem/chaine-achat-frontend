import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Sélecteur de pièces jointes réutilisable — section "Bibliothèque" des 6 formulaires usager.
 * N'envoie rien au serveur lui-même : il valide et accumule des `File[]` en mémoire, puis
 * émet `filesChange` à chaque changement. Le composant parent est responsable de l'upload
 * (via ReponsesService.uploaderPiecesJointes) une fois que la réponse a un id (après onSubmit/onSave).
 *
 * Fichiers acceptés : PDF, Word (.doc/.docx), Excel (.xlsx/.xls), courriel (.msg/.eml) — 3 max, 10 Mo chacun.
 * Ces limites doivent rester alignées avec controllers/pieces-jointes.js (backend).
 */
@Component({
  selector: 'app-piece-jointe-uploader',
  templateUrl: './piece-jointe-uploader.component.html',
  styleUrls: ['./piece-jointe-uploader.component.css']
})
export class PieceJointeUploaderComponent {
  @Input() disabled = false;
  @Output() filesChange = new EventEmitter<File[]>();

  readonly extensionsAcceptees = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.msg', '.eml'];
  readonly tailleMaxOctets     = 10 * 1024 * 1024; // 10 Mo
  readonly nombreMaxFichiers   = 3;

  fichiers: File[] = [];
  erreur: string | null = null;

  onFichiersSelectionnes(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nouveaux = Array.from(input.files ?? []);
    input.value = ''; // permet de re-sélectionner le même fichier après un retrait

    this.erreur = null;

    for (const fichier of nouveaux) {
      if (this.fichiers.length >= this.nombreMaxFichiers) {
        this.erreur = `Maximum ${this.nombreMaxFichiers} fichiers.`;
        break;
      }
      const nomMinuscule = fichier.name.toLowerCase();
      const extension    = nomMinuscule.slice(nomMinuscule.lastIndexOf('.'));
      if (!this.extensionsAcceptees.includes(extension)) {
        this.erreur = `« ${fichier.name} » : type de fichier non accepté (PDF, Word, Excel ou courriel uniquement).`;
        continue;
      }
      if (fichier.size > this.tailleMaxOctets) {
        this.erreur = `« ${fichier.name} » dépasse la taille maximale de 10 Mo.`;
        continue;
      }
      this.fichiers.push(fichier);
    }

    this.filesChange.emit(this.fichiers);
  }

  retirer(index: number): void {
    this.fichiers.splice(index, 1);
    this.erreur = null;
    this.filesChange.emit(this.fichiers);
  }

  /** Réinitialise la sélection (ex. après un envoi réussi du formulaire). */
  reset(): void {
    this.fichiers = [];
    this.erreur = null;
  }

  formatTaille(octets: number): string {
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
    return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
  }
}
