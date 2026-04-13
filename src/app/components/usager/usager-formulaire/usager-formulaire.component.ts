import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReponsesService } from '../../../services/reponses.service';

@Component({
  selector: 'app-usager-formulaire',
  templateUrl: './usager-formulaire.component.html',
})
export class UsagerFormulaireComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  success   = false;
  error     = false;
  isLoading = false;
  
  // Variables pour afficher dans l'écran de confirmation
  derniereTitre = '';
  derniereDescription = '';
  derniereQuantite = 0;

  constructor(private fb: FormBuilder, private reponsesService: ReponsesService) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      titre:       ['', Validators.required],
      description: ['', Validators.required],
      quantite:    [1, [Validators.required, Validators.min(1)]],
    });
  }

  get f() { return this.form.controls; }

  nouvelleDemandeD(): void {
    this.success   = false;
    this.error     = false;
    this.submitted = false;
    this.initForm();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isLoading = true;
    
    // ✅ Capturer les données pour afficher dans l'écran de confirmation
    this.derniereTitre = this.form.value.titre;
    this.derniereDescription = this.form.value.description;
    this.derniereQuantite = this.form.value.quantite;

    // Structure correcte : baseData + specificData
    const payload = {
      baseData: {
        titre_document: this.form.value.titre,
        note_commentaire: this.form.value.description
      },
      specificData: {
        nombre_utilisateurs: this.form.value.quantite
      },
      formulaire_type: 'Nouvel achat unique'
    };

    this.reponsesService.envoyerNouvelAchat(payload).subscribe({
      next: () => {
        this.success   = true;
        this.isLoading = false;
        // ✅ NE PAS réinitialiser immédiatement, garder les données pour l'écran de confirmation
      },
      error: () => {
        this.error     = true;
        this.isLoading = false;
      }
    });
  }
}