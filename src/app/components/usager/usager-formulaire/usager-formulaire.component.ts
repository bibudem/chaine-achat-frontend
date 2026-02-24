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
    this.reponsesService.envoyerDemande(this.form.value).subscribe({
      next: () => {
        this.success   = true;
        this.isLoading = false;
      },
      error: () => {
        this.error     = true;
        this.isLoading = false;
      }
    });
  }
}