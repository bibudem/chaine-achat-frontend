import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Item, ItemFormulaireService, ApiResponse } from '../../services/items-formulaire.service';
import { ListeChoixOptions } from '../../lib/ListeChoixOptions';
import { DialogService } from '../../services/dialog.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-item-formulaire',
  templateUrl: './item-formulaire.component.html',
  styleUrls: ['./item-formulaire.component.css']
})
export class ItemFormulaireComponent implements OnInit {
  itemForm: FormGroup;
  itemId: number | null = null;
  isEditMode = false;
  loading = false;
  submitting = false;
  activeTab = 'base';

  options = new ListeChoixOptions();
  selectedFormulaireType: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemFormulaireService,
    private dialogService: DialogService,
    private location: Location
  ) {
    this.itemForm = this.createForm();
  }

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.itemId;

    if (this.isEditMode) {
      this.loadItem();
      this.itemForm.get('formulaire_type')?.disable();
    }

    this.itemForm.get('formulaire_type')?.valueChanges.subscribe(value => {
      this.onFormulaireTypeChange(value);
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      // Informations de base
      formulaire_type: [null, Validators.required],
      date_creation: [''],
      priorite_demande: ['Régulier'],
      projet_special: ['Ne s\'applique pas'],
      
      // Informations du document
      titre_document: ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre: ['', Validators.maxLength(500)],
      isbn_issn: ['', Validators.maxLength(50)],
      editeur: ['', Validators.maxLength(300)],
      date_publication: ['', Validators.maxLength(50)],
      
      // Catalogage
      creation_notice_dtdm: [false],
      note_dtdm: [''],
      
      // Catégorisation
      categorie_document: [''],
      format_support: [''],
      
      // Informations financières
      fonds_budgetaire: ['', [Validators.required, Validators.maxLength(200)]],
      fonds_sn_projet: ['', Validators.maxLength(100)],
      
      // Bibliothèque
      bibliotheque: [''],
      localisation_emplacement: ['', Validators.maxLength(200)],
      
      // Personnes concernées
      demandeur: ['', [Validators.required, Validators.maxLength(200)]],
      personne_a_aviser_activation: ['', Validators.maxLength(200)],
      
      // Source d'information
      source_information: ['', Validators.maxLength(500)],
      
      // Notes et commentaires
      note_commentaire: [''],
      
      // Identifiants
      id_ressource: ['', Validators.maxLength(100)],
      catalogue: ['', Validators.maxLength(200)],
      
      // Statuts
      statut_bibliotheque: ['En attente en bibliothèque'],
      statut_acq: [''],
      
      // Métadonnées (lecture seule)
      date_modification: [{ value: '', disabled: true }],
      utilisateur_modification: [{ value: '', disabled: true }],

      // ===== CHAMPS SPÉCIFIQUES PAR TYPE =====
      
      // Modification CCOL
      precision_demande: [''],
      numero_oclc: [''],
      collection: [''],
      catalogage: [''],
      
      // Nouvel Abonnement
      date_debut_abonnement: [''],
      type_monographie: [''],
      
      // Nouvel Achat Unique
      projets_speciaux: [''],
      format_electronique: [''],
      reserve_cours: [false],
      reserve_cours_sigle: [''],
      reserve_cours_session: [''],
      reserve_cours_enseignant: [''],
      bordereau_imprime: [''],
      categorie_depense: [''],
      note_catalogueur_droit: [''],
      
      // PEB Tipasa Numérique
      type_demande_peb: [''],
      reference_tipasa: [''],
      urgence: [false],
      
      // Requête ACQ
      type_requete: [''],
      description_requete: [''],
      action_demandee: [''],
      
      // Springer
      quantite: [null],
      
      // Suggestion d'Achat
      justification: [''],
      public_cible: [''],
      recommandation: [false]
    });
  }

  onFormulaireTypeChange(type: string): void {
    this.selectedFormulaireType = type;

    // Réinitialiser tous les champs spécifiques
    this.resetSpecificFields();

    // Ajouter les validators selon le type de formulaire
    switch(type) {
      case 'Modification CCOL':
        this.itemForm.get('precision_demande')?.setValidators([Validators.required]);
        break;

      case 'Nouvel abonnement':
        this.itemForm.get('date_debut_abonnement')?.setValidators([Validators.required]);
        break;

      case 'Nouvel achat unique':
        this.itemForm.get('type_monographie')?.setValidators([Validators.required]);
        break;

      case 'Springer':
        this.itemForm.get('quantite')?.setValidators([Validators.required, Validators.min(1)]);
        break;

      case 'PEB Tipasa numérique':
        this.itemForm.get('type_demande_peb')?.setValidators([Validators.required]);
        break;

      case 'Requête ACQ':
        this.itemForm.get('type_requete')?.setValidators([Validators.required]);
        break;

      case 'Suggestion d\'achat':
        this.itemForm.get('justification')?.setValidators([Validators.required]);
        break;

      default:
        break;
    }

    const specificFieldsToUpdate = [
      'precision_demande', 'date_debut_abonnement', 'type_monographie',
      'quantite', 'type_demande_peb', 'type_requete', 'justification'
    ];

    specificFieldsToUpdate.forEach(field => {
      const control = this.itemForm.get(field);
      if (control) control.updateValueAndValidity({ emitEvent: false });
    });
  }

  resetSpecificFields(): void {
    const specificFields = [
      'precision_demande', 'numero_oclc', 'collection', 'catalogage',
      'date_debut_abonnement', 'type_monographie', 'projets_speciaux',
      'format_electronique', 'reserve_cours', 'reserve_cours_sigle',
      'reserve_cours_session', 'reserve_cours_enseignant', 'bordereau_imprime',
      'categorie_depense', 'note_catalogueur_droit', 'type_demande_peb',
      'reference_tipasa', 'urgence', 'type_requete', 'description_requete',
      'action_demandee', 'quantite', 'justification', 'public_cible', 'recommandation'
    ];
    
    specificFields.forEach(field => {
      const control = this.itemForm.get(field);
      if (control) {
        control.clearValidators();
        control.reset(null, { emitEvent: false });
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  isModificationCCOL(): boolean {
    return this.selectedFormulaireType === 'Modification CCOL';
  }

  isNouvelAbonnement(): boolean {
    return this.selectedFormulaireType === 'Nouvel abonnement';
  }

  isNouvelAchatUnique(): boolean {
    return this.selectedFormulaireType === 'Nouvel achat unique';
  }

  isPEBTipasaNumerique(): boolean {
    return this.selectedFormulaireType === 'PEB Tipasa numérique';
  }

  isRequeteACQ(): boolean {
    return this.selectedFormulaireType === 'Requête ACQ';
  }

  isSpringer(): boolean {
    return this.selectedFormulaireType === 'Springer';
  }

  isSuggestionAchat(): boolean {
    return this.selectedFormulaireType === 'Suggestion d\'achat';
  }

  loadItem(): void {
    if (!this.itemId) return;

    this.loading = true;
    this.itemService.consulter(this.itemId).subscribe({
      next: (response: ApiResponse<Item>) => {
        if (response.success && response.data) {
          this.selectedFormulaireType = response.data.formulaire_type || null;
          this.itemForm.patchValue(response.data, { emitEvent: false });
          this.itemForm.get('formulaire_type')?.disable({ emitEvent: false });
        } else {
          this.dialogService.showError(response.error || 'Impossible de charger l\'item');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.dialogService.showError('Erreur lors du chargement de l\'item');
        this.loading = false;
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.itemForm.invalid) {
      this.markFormGroupTouched();
      this.dialogService.showWarning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.submitting = true;
    const formData = this.itemForm.getRawValue();

    const baseData = this.extractBaseData(formData);
    const specificData = this.extractSpecificData(formData);

    const itemData = {
      ...baseData,
      specificData: specificData,
      formulaire_type: formData.formulaire_type || this.selectedFormulaireType
    };

    if (this.isEditMode && this.itemId) {
      const updateData = { ...itemData, item_id: this.itemId };
      this.itemService.update(updateData).subscribe({
        next: (response: ApiResponse<Item>) => {
          this.submitting = false;
          if (response.success) {
            this.dialogService.showSuccess('Item modifié avec succès!');
            setTimeout(() => this.router.navigate(['/items']), 1500);
          } else {
            this.dialogService.showError(response.error || response.message || 'Erreur inconnue');
          }
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.submitting = false;
          const errorMsg = error.error?.error || error.error?.message || error.message || 'Erreur inconnue';
          this.dialogService.showError('Erreur lors de la modification: ' + errorMsg);
        }
      });
    } else {
      this.itemService.post(itemData).subscribe({
        next: (response: ApiResponse<Item>) => {
          this.submitting = false;
          if (response.success) {
            this.dialogService.showSuccess('Item créé avec succès!');
            setTimeout(() => this.router.navigate(['/items']), 1500);
          } else {
            this.dialogService.showError(response.error || response.message || 'Erreur inconnue');
          }
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.submitting = false;
          const errorMsg = error.error?.error || error.error?.message || error.message || 'Erreur inconnue';
          this.dialogService.showError('Erreur lors de la création: ' + errorMsg);
        }
      });
    }
  }

  private extractBaseData(formData: any): any {
    return {
      formulaire_type: formData.formulaire_type,
      date_creation: formData.date_creation,
      priorite_demande: formData.priorite_demande,
      titre_document: formData.titre_document,
      sous_titre: formData.sous_titre,
      isbn_issn: formData.isbn_issn,
      editeur: formData.editeur,
      date_publication: formData.date_publication,
      creation_notice_dtdm: formData.creation_notice_dtdm,
      note_dtdm: formData.note_dtdm,
      categorie_document: formData.categorie_document,
      format_support: formData.format_support,
      fonds_budgetaire: formData.fonds_budgetaire,
      fonds_sn_projet: formData.fonds_sn_projet,
      bibliotheque: formData.bibliotheque,
      localisation_emplacement: formData.localisation_emplacement,
      demandeur: formData.demandeur,
      personne_a_aviser_activation: formData.personne_a_aviser_activation,
      projet_special: formData.projet_special,
      statut_bibliotheque: formData.statut_bibliotheque,
      statut_acq: formData.statut_acq,
      source_information: formData.source_information,
      note_commentaire: formData.note_commentaire,
      id_ressource: formData.id_ressource,
      catalogue: formData.catalogue
    };
  }

  private extractSpecificData(formData: any): any {
    const type = this.selectedFormulaireType;
    
    switch(type) {
      case 'Modification CCOL':
        return {
          precision_demande: formData.precision_demande,
          numero_oclc: formData.numero_oclc,
          date_debut_abonnement: formData.date_debut_abonnement,
          collection: formData.collection,
          catalogage: formData.catalogage
        };
        
      case 'Nouvel abonnement':
        return {
          date_debut_abonnement: formData.date_debut_abonnement,
          type_monographie: formData.type_monographie,
          collection: formData.collection,
          catalogage: formData.catalogage
        };
        
      case 'Nouvel achat unique':
        return {
          priorite_demande: formData.priorite_demande,
          projets_speciaux: formData.projets_speciaux,
          type_monographie: formData.type_monographie,
          format_electronique: formData.format_electronique,
          reserve_cours: formData.reserve_cours,
          reserve_cours_sigle: formData.reserve_cours_sigle,
          reserve_cours_session: formData.reserve_cours_session,
          reserve_cours_enseignant: formData.reserve_cours_enseignant,
          bordereau_imprime: formData.bordereau_imprime,
          categorie_depense: formData.categorie_depense,
          note_catalogueur_droit: formData.note_catalogueur_droit
        };
        
      case 'PEB Tipasa numérique':
        return {
          type_demande_peb: formData.type_demande_peb,
          reference_tipasa: formData.reference_tipasa,
          urgence: formData.urgence
        };
        
      case 'Requête ACQ':
        return {
          type_requete: formData.type_requete,
          description_requete: formData.description_requete,
          action_demandee: formData.action_demandee
        };
        
      case 'Springer':
        return {
          quantite: formData.quantite
        };
        
      case 'Suggestion d\'achat':
        return {
          justification: formData.justification,
          public_cible: formData.public_cible,
          recommandation: formData.recommandation
        };
        
      default:
        return {};
    }
  }

  async onCancel(): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      'Voulez-vous vraiment annuler ? Les modifications non sauvegardées seront perdues.',
      'Confirmer l\'annulation'
    );
    
    if (confirmed) {
      this.router.navigate(['/items']);
    }
  }

  onReturn(): void {
    this.location.back();
 }

  private markFormGroupTouched(): void {
    Object.keys(this.itemForm.controls).forEach(key => {
      const control = this.itemForm.get(key);
      control?.markAsTouched();
    });
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.itemForm.get(controlName);
    return control ? control.hasError(errorType) && (control.touched || control.dirty) : false;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}