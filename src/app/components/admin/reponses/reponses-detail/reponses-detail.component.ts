import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Reponse } from '../../../../services/reponses.service';

@Component({
  selector: 'app-reponses-detail',
  templateUrl: './reponses-detail.component.html',
  styleUrls: ['./reponses-detail.component.css']
})
export class ReponsesDetailComponent implements OnInit {

  @Input() reponse: Reponse | null = null;

  // Formatage JSON
  jsonFormatted: string = '';
  activeTab: 'formatted' | 'json' = 'formatted';

  // État de copie
  copyFeedback: string | null = null;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    if (this.reponse) {
      this.jsonFormatted = JSON.stringify(this.reponse.reponses, null, 2);
    }
  }

  /**
   * Copie le JSON dans le presse-papiers
   */
  copyToClipboard(): void {
    if (this.reponse) {
      const textToCopy = JSON.stringify(this.reponse.reponses, null, 2);
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.copyFeedback = 'Copié !';
        setTimeout(() => {
          this.copyFeedback = null;
        }, 2000);
      });
    }
  }

  /**
   * Télécharge le JSON
   */
  downloadJson(): void {
    if (this.reponse) {
      const dataStr = JSON.stringify(this.reponse.reponses, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reponse_${this.reponse.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Formate la date
   */
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Retourne la classe pour le statut
   */
  getStatutClass(statut: string): string {
    switch (statut) {
      case 'approuve':
        return 'text-success bg-light-success';
      case 'refuse':
        return 'text-danger bg-light-danger';
      case 'en_attente':
        return 'text-warning bg-light-warning';
      default:
        return 'text-secondary bg-light';
    }
  }

  /**
   * Retourne la classe pour le type de formulaire
   */
  getTypeClass(type: string): string {
    switch (type) {
      case "Suggestion d'achat - Usager":
        return 'text-info bg-light-info';
      case 'Nouvel achat unique':
        return 'text-primary bg-light-primary';
      default:
        return 'text-secondary bg-light';
    }
  }

  /**
   * Affiche un JSON de manière lisible
   */
  getFormattedData(): any {
    return this.reponse?.reponses || {};
  }

  /**
   * Affiche la valeur de manière lisible
   */
  formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }
}
