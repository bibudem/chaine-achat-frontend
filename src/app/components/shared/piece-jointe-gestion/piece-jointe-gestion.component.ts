import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ReponsesService } from '../../../services/reponses.service';

interface PieceJointe {
  piece_id: number;
  reponse_id: number | null;
  item_id: number | null;
  nom_fichier: string;
  type_mime: string;
  taille_octets: number;
  date_ajout: string;
}

/**
 * Consultation/gestion des pièces jointes — côté ADMINISTRATEUR.
 * Se branche sur une réponse ou un item déjà existant : liste, téléchargement,
 * ajout et suppression immédiats.
 *
 * Fournir soit [reponseId] (demande usager pas encore convertie en item),
 * soit [itemId] (fiche item déjà créée — avec ou sans réponse d'origine).
 *
 * Cas particulier — création d'un item de zéro (aucun [reponseId]/[itemId] au départ) :
 * les fichiers choisis sont gardés en mémoire (« en attente d'enregistrement ») et
 * envoyés automatiquement dès que le parent fournit un [itemId] (après la création),
 * détecté via ngOnChanges — le parent doit donc affecter this.itemId dans le callback
 * de succès de la création, avant toute navigation.
 */
@Component({
  selector: 'app-piece-jointe-gestion',
  templateUrl: './piece-jointe-gestion.component.html',
  styleUrls: ['./piece-jointe-gestion.component.css']
})
export class PieceJointeGestionComponent implements OnInit, OnChanges {
  @Input() reponseId: number | null = null;
  @Input() itemId:    number | null = null;
  @Input() readonlyMode = false; // masque l'ajout/la suppression (consultation seule)

  readonly extensionsAcceptees = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.msg', '.eml'];
  readonly tailleMaxOctets     = 10 * 1024 * 1024; // 10 Mo
  readonly nombreMaxFichiers   = 3;

  pieces: PieceJointe[] = [];
  /** Fichiers choisis avant qu'un id n'existe — envoyés dès qu'un itemId/reponseId arrive. */
  fichiersEnAttente: File[] = [];

  chargement = false;
  envoiEnCours = false;
  erreur: string | null = null;

  constructor(private reponsesService: ReponsesService) {}

  ngOnInit(): void {
    this.charger();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const nouvelId = this.aUnId(changes['itemId']) || this.aUnId(changes['reponseId']);
    if (changes['reponseId'] || changes['itemId']) {
      this.charger();
    }
    if (nouvelId && this.fichiersEnAttente.length) {
      this.envoyer(this.fichiersEnAttente);
      this.fichiersEnAttente = [];
    }
  }

  /** Vrai si ce changement fait passer l'input de "sans id" à "avec id". */
  private aUnId(change: SimpleChanges[string] | undefined): boolean {
    return !!change && !change.previousValue && !!change.currentValue;
  }

  private charger(): void {
    if (!this.reponseId && !this.itemId) { this.pieces = []; return; }
    this.chargement = true;
    const obs = this.itemId
      ? this.reponsesService.getPiecesJointesParItem(this.itemId)
      : this.reponsesService.getPiecesJointes(this.reponseId!);
    obs.subscribe({
      next: (res) => { this.pieces = res?.data ?? []; this.chargement = false; },
      error: (err) => {
        console.error('[PieceJointeGestion] charger:', err);
        this.chargement = false;
      }
    });
  }

  onFichiersSelectionnes(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichiers = Array.from(input.files ?? []);
    input.value = ''; // permet de re-sélectionner le même fichier

    this.erreur = null;
    if (!fichiers.length) return;

    const total = this.pieces.length + this.fichiersEnAttente.length;
    const valides: File[] = [];
    for (const fichier of fichiers) {
      if (total + valides.length >= this.nombreMaxFichiers) {
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
      valides.push(fichier);
    }
    if (!valides.length) return;

    if (!this.reponseId && !this.itemId) {
      // Pas encore d'id (item en cours de création) : on garde les fichiers en mémoire,
      // ils seront envoyés automatiquement une fois l'item enregistré (voir ngOnChanges).
      this.fichiersEnAttente.push(...valides);
      return;
    }

    this.envoyer(valides);
  }

  private envoyer(fichiers: File[]): void {
    this.envoiEnCours = true;
    const obs = this.itemId
      ? this.reponsesService.uploaderPiecesJointesItem(this.itemId, fichiers)
      : this.reponsesService.uploaderPiecesJointes(this.reponseId!, fichiers);
    obs.subscribe({
      next: () => { this.envoiEnCours = false; this.charger(); },
      error: (err) => {
        console.error('[PieceJointeGestion] upload:', err);
        this.envoiEnCours = false;
        this.erreur = "Erreur lors de l'envoi de la pièce jointe.";
      }
    });
  }

  retirerEnAttente(index: number): void {
    this.fichiersEnAttente.splice(index, 1);
  }

  supprimer(piece: PieceJointe): void {
    if (!confirm(`Supprimer « ${piece.nom_fichier} » ?`)) return;
    this.reponsesService.supprimerPieceJointe(piece.piece_id).subscribe({
      next: () => { this.pieces = this.pieces.filter(p => p.piece_id !== piece.piece_id); },
      error: (err) => console.error('[PieceJointeGestion] supprimer:', err)
    });
  }

  telechargerUrl(pieceId: number): string {
    return this.reponsesService.telechargerPieceJointeUrl(pieceId);
  }

  formatTaille(octets: number): string {
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
    return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
  }
}
