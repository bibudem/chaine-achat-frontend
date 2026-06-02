import { Component, OnInit } from '@angular/core';
import { ReponsesService, DemandeUsager } from '../../../services/reponses.service';

@Component({
  selector:    'app-usager-profil',
  templateUrl: './usager-profil.component.html',
  styleUrls:   ['./usager-profil.component.css']
})
export class UsagerProfilComponent implements OnInit {

  demandes: DemandeUsager[] = [];
  loading              = false;
  errorMessage         = '';
  confirmingDeleteId: number | null = null;
  deleting             = false;
  deleteError          = false;

  get prenom():   string { return sessionStorage.getItem('prenomAdmin')   ?? ''; }
  get nom():      string { return sessionStorage.getItem('nomAdmin')       ?? ''; }
  get email():    string { return sessionStorage.getItem('courrielAdmin')  ?? ''; }
  get initiales(): string {
    return `${this.prenom.charAt(0)}${this.nom.charAt(0)}`.toUpperCase();
  }

  constructor(private reponsesService: ReponsesService) {}

  ngOnInit(): void {
    if (!this.email) { this.errorMessage = 'Session introuvable.'; return; }
    this.loading = true;
    this.reponsesService.getByEmail(this.email).subscribe({
      next: (res) => { this.demandes = res.data; this.loading = false; },
      error: ()   => { this.errorMessage = 'Impossible de charger vos demandes.'; this.loading = false; }
    });
  }

  statutKey(d: DemandeUsager): string {
    if (d.statut_approbation === 'refuse') return 'refuse';
    if (d.statut_bibliotheque)              return 'traitee';
    if (d.statut_approbation === 'approuve') return 'cours';
    return 'attente';
  }

  statutLabel(d: DemandeUsager): string {
    const k = this.statutKey(d);
    if (k === 'refuse')  return 'Refusée';
    if (k === 'traitee') return 'Traitée';
    if (k === 'cours')   return 'En cours';
    return 'En attente';
  }

  countByStatut(key: string): number {
    return this.demandes.filter(d => this.statutKey(d) === key).length;
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      'Nouvel achat unique':        'bi-cart-plus',
      'Modification et CCOL':       'bi-pencil-square',
      'Nouvel abonnement':          'bi-newspaper',
      'PEB Tipasa numérique':       'bi-share',
      'Requête ACQ Accessibilité':  'bi-universal-access',
    };
    return map[type] ?? 'bi-lightbulb';
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  peutSupprimer(d: DemandeUsager): boolean {
    return this.statutKey(d) === 'attente';
  }

  supprimerDemande(id: number): void {
    this.deleting = true;
    this.deleteError = false;
    this.reponsesService.supprimer(id).subscribe({
      next: () => {
        this.demandes = this.demandes.filter(d => d.id !== id);
        this.confirmingDeleteId = null;
        this.deleting = false;
      },
      error: () => {
        this.deleting = false;
        this.deleteError = true;
      }
    });
  }
}
