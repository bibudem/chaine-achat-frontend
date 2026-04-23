import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Item, ItemFormulaireService, ApiResponse } from '../../../services/items-formulaire.service';
import { ListeChoixOptions } from '../../../lib/ListeChoixOptions';
import { DialogService } from '../../../services/dialog.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-item-formulaire',
  templateUrl: './item-formulaire.component.html',
  styleUrls: ['./item-formulaire.component.css']
})
export class ItemFormulaireComponent implements OnInit, OnDestroy {
  itemForm: FormGroup;
  itemId: number | null = null;
  isEditMode = false;
  loading = false;
  submitting = false;
  activeTab = 'base';

  options = new ListeChoixOptions();
  selectedFormulaireType: string | null = null;
  fournisseursOptions: string[] = [];
  fournisseurSearch = '';
  fournisseursFiltered: string[] = [];
  selectedFournisseurs: string[] = [];

  dropdowns: Record<string, boolean> = {};
  private clickOutsideListener!: () => void;

  readonly OUI_NON_NA: string[] = ['OUI', 'NON', "Ne s'applique pas"];
  readonly besoinsFormat: string[] = [
    "Électronique : écrire à l'éditeur pour version numérique gratuite",
    'Électronique : acheter licence institutionnelle standard + version numérique gratuite',
    'Électronique : acheter licence institutionnelle standard',
    'Imprimé/support physique : acheter exemplaires + version numérique gratuite',
    "Imprimé/support physique : acheter exemplaire sans version numérique"
  ];
  precisionsDemande: string[] = [
    'Achat de complément de collection (CCOL) pour abonnement (courant ou ancien)',
    'Achat de numéro de périodique hors abonnement',
    "Achat d'archives de périodiques (web)",
    "Achat en vue d'un NABO",
    "Annulation d'abonnement",
    'Cesse de paraître',
    "Changement de support — vers l'électronique",
    'Changement de titre',
    'Création de notice pour abonnement courant',
    "Modification du nombre d'utilisateurs",
    'Complément de collection'
  ];

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

    this.loadFournisseurs();

    this.clickOutsideListener = () => this.closeAllDropdowns();
    document.addEventListener('click', this.clickOutsideListener);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.clickOutsideListener);
  }

  loadFournisseurs(): void {
    this.itemService.getFournisseurs().subscribe({
      next: (response: any) => {
        const raw = response?.data ?? response;
        const arr = Array.isArray(raw) ? raw : [];

        this.fournisseursOptions = arr
          .map((f: any) => f?.titre ?? f)
          .filter((titre: any) => typeof titre === 'string' && titre.trim().length > 0)
          .sort((a: string, b: string) => a.localeCompare(b, 'fr'));

        this.fournisseursFiltered = [...this.fournisseursOptions];
      },
      error: (error) => console.error('❌ Erreur chargement fournisseurs:', error)
    });
  }

  filterFournisseurs(search: string): void {
    const term = search.toLowerCase().trim();
    this.fournisseursFiltered = term
      ? this.fournisseursOptions.filter(f => f.toLowerCase().includes(term))
      : [...this.fournisseursOptions];
  }

  isFournisseurSelected(value: string): boolean {
    return this.selectedFournisseurs.includes(value);
  }

  toggleFournisseur(value: string): void {
    if (this.isFournisseurSelected(value)) {
      this.selectedFournisseurs = this.selectedFournisseurs.filter(f => f !== value);
    } else {
      this.selectedFournisseurs = [...this.selectedFournisseurs, value];
    }
    this.itemForm.get('fournisseur')?.setValue(
      this.selectedFournisseurs.join(', ')
    );
  }

  toggleDropdown(id: string): void {
    const current = this.dropdowns[id];
    this.closeAllDropdowns();
    this.dropdowns[id] = !current;
  }

  closeAllDropdowns(): void {
    Object.keys(this.dropdowns).forEach(k => this.dropdowns[k] = false);
  }

  createForm(): FormGroup {
    return this.fb.group({
      formulaire_type: [null, Validators.required],
      date_creation: [''],
      priorite_demande: ['Régulier'],
      projet_special: ['Ne s\'applique pas'],
      titre_document: ['', [Validators.required, Validators.maxLength(500)]],
      sous_titre: ['', Validators.maxLength(500)],
      isbn_issn: ['', Validators.maxLength(50)],
      editeur: ['', Validators.maxLength(300)],
      date_publication: ['', Validators.maxLength(50)],
      creation_notice_dtdm: [false],
      note_dtdm: [''],
      prix_cad: [null],
      devise_originale: [''],
      prix_devise_originale: [null],
      periode_couverte: [''],
      nombre_titres_inclus: [null],
      nombre_utilisateurs: [''],
      lien_plateforme: [''],
      format_pret_numerique: [''],
      categorie_document: [''],
      format_support: [''],
      fonds_budgetaire: ['', [Validators.required, Validators.maxLength(200)]],
      fonds_sn_projet: ['', Validators.maxLength(50)],
      bibliotheque: [''],
      localisation_emplacement: ['', Validators.maxLength(200)],
      demandeur: ['', [Validators.required, Validators.maxLength(200)]],
      personne_a_aviser_activation: ['', Validators.maxLength(200)],
      source_information: ['', Validators.maxLength(500)],
      note_commentaire: [''],
      id_ressource: ['', Validators.maxLength(100)],
      catalogue: ['', Validators.maxLength(200)],
      statut_bibliotheque: ['En attente en bibliothèque'],
      statut_acq: [''],
      fournisseur: ['', Validators.maxLength(255)],
      date_modification: [{ value: '', disabled: true }],
      utilisateur_modification: [{ value: '', disabled: true }],
      precision_demande: [''],
      numero_oclc: [''],
      collection: [''],
      catalogage: [''],
      date_debut_abonnement: [''],
      type_monographie: [''],
      projets_speciaux: [''],
      format_electronique: [''],
      reserve_cours: [false],
      reserve_cours_sigle: [''],
      reserve_cours_session: [''],
      reserve_cours_enseignant: [''],
      bordereau_imprime: [''],
      categorie_depense: [''],
      note_catalogueur_droit: [''],
      type_demande_peb: [''],
      reference_tipasa: [''],
      urgence: [false],
      type_requete: [''],
      description_requete: [''],
      action_demandee: [''],
      // Requête Accessibilité — champs spécifiques
      reference_usager:               [''],
      besoin_specifique_format:       [''],
      permalien_sofia:                [''],
      fournisseur_contacte_sans_succes: [''],
      exemplaire_papier_detenu:       [''],
      exemplaire_electronique_detenu: [''],
      verification_caeb:              [''],
      verification_sqla:              [''],
      verification_emma:              [''],
      acq_numerisation_recommandee:   [''],
      acq_date_demande_editeur:       [''],
      acq_date_livraison_estimee:     [''],
      // Suggestion d'achat — champs existants
      justification: [''],
      public_cible: [''],
      recommandation: [false],
      // Suggestion d'achat — nouveaux champs
      usager_statut: ['', Validators.maxLength(100)],
      usager_faculte: ['', Validators.maxLength(255)],
      usager_courriel: ['', [Validators.maxLength(255), Validators.email]],
      bibliothecaire_disciplinaire: ['', Validators.maxLength(255)],
      aviser_reservation: ['', Validators.maxLength(500)],
      aviser_reception: [true],
      date_requise_cours: ['']
    });
  }

  onFormulaireTypeChange(type: string): void {
    this.selectedFormulaireType = type;
    this.resetSpecificFields();

    switch(type) {
      case 'Modification et CCOL':
        this.itemForm.get('precision_demande')?.setValidators([Validators.required]);
        break;
      case 'Nouvel abonnement':
        this.itemForm.get('date_debut_abonnement')?.setValidators([Validators.required]);
        break;
      case 'Nouvel achat unique':
        this.itemForm.get('type_monographie')?.setValidators([Validators.required]);
        break;
      case 'Springer':
        break;
      case 'PEB Tipasa numérique':
        this.itemForm.get('type_demande_peb')?.setValidators([Validators.required]);
        break;
      case 'Requête Accessibilité':
        this.itemForm.get('type_requete')?.setValidators([Validators.required]);
        break;
      case 'Suggestion d\'achat':
        this.itemForm.get('usager_statut')?.setValidators([Validators.required]);
        this.itemForm.get('usager_faculte')?.setValidators([Validators.required]);
        this.itemForm.get('usager_courriel')?.setValidators([Validators.required, Validators.email]);
        this.itemForm.get('bibliothecaire_disciplinaire')?.setValidators([Validators.required, Validators.email]);
        break;
      default:
        break;
    }

    const specificFieldsToUpdate = [
      'precision_demande', 'date_debut_abonnement', 'type_monographie',
      'type_demande_peb', 'type_requete',
      'usager_statut', 'usager_faculte', 'usager_courriel', 'bibliothecaire_disciplinaire'
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
      'action_demandee', 'justification', 'public_cible', 'recommandation',
      // Requête Accessibilité
      'reference_usager', 'besoin_specifique_format', 'permalien_sofia',
      'fournisseur_contacte_sans_succes', 'exemplaire_papier_detenu',
      'exemplaire_electronique_detenu', 'verification_caeb', 'verification_sqla',
      'verification_emma', 'acq_numerisation_recommandee', 'acq_date_demande_editeur',
      'acq_date_livraison_estimee',
      // Suggestion d'achat
      'usager_statut', 'usager_faculte', 'usager_courriel',
      'bibliothecaire_disciplinaire', 'aviser_reservation', 'aviser_reception',
      'date_requise_cours'
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

  isModificationCCOL(): boolean { return this.selectedFormulaireType === 'Modification et CCOL'; }
  isNouvelAbonnement(): boolean { return this.selectedFormulaireType === 'Nouvel abonnement'; }
  isNouvelAchatUnique(): boolean { return this.selectedFormulaireType === 'Nouvel achat unique'; }
  isPEBTipasaNumerique(): boolean { return this.selectedFormulaireType === 'PEB Tipasa numérique'; }
  isRequeteAccessibilite(): boolean { return this.selectedFormulaireType === 'Requête Accessibilité'; }
  isSpringer(): boolean { return this.selectedFormulaireType === 'Springer'; }
  isSuggestionAchat(): boolean { return this.selectedFormulaireType === 'Suggestion d\'achat'; }

  loadItem(): void {
    if (!this.itemId) return;

    this.loading = true;
    this.itemService.consulter(this.itemId).subscribe({
      next: (response: ApiResponse<Item>) => {
        if (response.success && response.data) {
          this.selectedFormulaireType = response.data.formulaire_type || null;
          this.itemForm.patchValue(response.data, { emitEvent: false });
          this.itemForm.get('formulaire_type')?.disable({ emitEvent: false });

          const fournisseurVal = response.data.fournisseur;
          if (fournisseurVal) {
            this.selectedFournisseurs = fournisseurVal
              .split(', ')
              .filter((f: string) => f.trim().length > 0);
          }
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
      catalogue: formData.catalogue,
      prix_cad: formData.prix_cad,
      devise_originale: formData.devise_originale,
      prix_devise_originale: formData.prix_devise_originale,
      periode_couverte: formData.periode_couverte,
      nombre_titres_inclus: formData.nombre_titres_inclus,
      nombre_utilisateurs: formData.nombre_utilisateurs,
      lien_plateforme: formData.lien_plateforme,
      format_pret_numerique: formData.format_pret_numerique,
      fournisseur: formData.fournisseur,
    };
  }

  private extractSpecificData(formData: any): any {
    const type = this.selectedFormulaireType;

    switch(type) {
      case 'Modification et CCOL':
        return {
          precision_demande:      formData.precision_demande,
          numero_oclc:            formData.numero_oclc,
          date_debut_abonnement:  formData.date_debut_abonnement,
          collection:             formData.collection,
          catalogage:             formData.catalogage
        };
      case 'Nouvel abonnement':
        return {
          date_debut_abonnement:  formData.date_debut_abonnement,
          type_monographie:       formData.type_monographie,
          collection:             formData.collection,
          catalogage:             formData.catalogage
        };
      case 'Nouvel achat unique':
        return {
          projets_speciaux:           formData.projets_speciaux,
          type_monographie:           formData.type_monographie,
          format_electronique:        formData.format_electronique,
          reserve_cours:              formData.reserve_cours,
          reserve_cours_sigle:        formData.reserve_cours_sigle,
          reserve_cours_session:      formData.reserve_cours_session,
          reserve_cours_enseignant:   formData.reserve_cours_enseignant,
          bordereau_imprime:          formData.bordereau_imprime,
          categorie_depense:          formData.categorie_depense,
          note_catalogueur_droit:     formData.note_catalogueur_droit
        };
      case 'PEB Tipasa numérique':
        return {
          type_demande_peb:   formData.type_demande_peb,
          reference_tipasa:   formData.reference_tipasa,
          urgence:            formData.urgence
        };
      case 'Requête Accessibilité':
        return {
          type_requete:                     formData.type_requete,
          reference_usager:                 formData.reference_usager,
          description_requete:              formData.description_requete,
          action_demandee:                  formData.action_demandee,
          besoin_specifique_format:         formData.besoin_specifique_format,
          permalien_sofia:                  formData.permalien_sofia,
          fournisseur_contacte_sans_succes: formData.fournisseur_contacte_sans_succes,
          exemplaire_papier_detenu:         formData.exemplaire_papier_detenu,
          exemplaire_electronique_detenu:   formData.exemplaire_electronique_detenu,
          verification_caeb:                formData.verification_caeb,
          verification_sqla:                formData.verification_sqla,
          verification_emma:                formData.verification_emma,
          acq_numerisation_recommandee:     formData.acq_numerisation_recommandee,
          acq_date_demande_editeur:         formData.acq_date_demande_editeur,
          acq_date_livraison_estimee:       formData.acq_date_livraison_estimee,
        };
      case 'Springer':
        return {};
 
      case "Suggestion d'achat":
        return {
          usager_statut:                formData.usager_statut,
          usager_faculte:               formData.usager_faculte,
          usager_courriel:              formData.usager_courriel,
          bibliothecaire_disciplinaire: formData.bibliothecaire_disciplinaire,
          aviser_reservation:           formData.aviser_reservation,
          aviser_reception:             formData.aviser_reception,
          date_requise_cours:           formData.date_requise_cours || null
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
      this.itemForm.get(key)?.markAsTouched();
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