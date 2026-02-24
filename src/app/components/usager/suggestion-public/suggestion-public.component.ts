import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReponsesService } from '../../../services/reponses.service';

@Component({
  selector: 'app-suggestion-public',
  templateUrl: './suggestion-public.component.html',
  styleUrls: ['./suggestion-public.component.css']
})
export class SuggestionPublicComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  success = false;
  error = false;
  isLoading = false;
  showSigleCours = false;

  constructor(private fb: FormBuilder, private reponsesService: ReponsesService) {}

  ngOnInit(): void {
    const nom      = `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
    const statut   = sessionStorage.getItem('groupeAdmin') ?? '';
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';

    this.form = this.fb.group({
      nom:                [nom],
      statut:             [statut],
      faculteDepartement: [''],
      courriel:           [courriel, Validators.email],
      copieCourriel:      [true],
      typeDocument:       ['', Validators.required],
      titre:              ['', Validators.required],
      auteur:             ['', Validators.required],
      annee:              [''],
      isbnIssn:           [''],
      edition:            [''],
      notes:              [''],
      reserver:           ['non'],
      dateRequis:         [''],
      mettreReserve:      [false],
      sigleCours:         [{ value: '', disabled: true }],
    });

    this.form.get('mettreReserve')!.valueChanges.subscribe(val => {
      this.showSigleCours = val;
      val ? this.form.get('sigleCours')!.enable()
          : this.form.get('sigleCours')!.disable();
    });
  }

  get f() { return this.form.controls; }

  onReset() {
    this.submitted = false;
    this.success   = false;
    this.error     = false;
    this.form.reset({
      copieCourriel: true,
      reserver:      'non',
      mettreReserve: false,
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isLoading = true;

    // Construire le payload manuellement pour contrôler les champs
    const formVal = this.form.getRawValue();
    const reponses = {
      typeDocument:       formVal.typeDocument,
      titre:              formVal.titre,
      auteur:             formVal.auteur,
      annee:              formVal.annee,
      isbnIssn:           formVal.isbnIssn,
      edition:            formVal.edition,
      notes:              formVal.notes,
      reserver:           formVal.reserver,
      faculteDepartement: formVal.faculteDepartement,
      copieCourriel:      formVal.copieCourriel,
      dateRequis:         formVal.dateRequis,
      mettreReserve:      formVal.mettreReserve,
      sigleCours:         formVal.sigleCours,
    };

    this.reponsesService.envoyerSuggestion(reponses).subscribe({
      next: () => {
        this.success   = true;
        this.isLoading = false;
        this.onReset();
      },
      error: () => {
        this.error     = true;
        this.isLoading = false;
      }
    });
  }
}