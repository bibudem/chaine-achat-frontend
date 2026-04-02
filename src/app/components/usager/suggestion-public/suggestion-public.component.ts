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
  submitted    = false;
  success      = false;
  error        = false;
  isLoading    = false;
  showSigleCours = false;

  constructor(
    private fb: FormBuilder,
    private reponsesService: ReponsesService
  ) {}

  ngOnInit(): void {
    const nom      = `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim();
    const statut   = sessionStorage.getItem('groupeAdmin') ?? '';
    const courriel = sessionStorage.getItem('courrielAdmin') ?? '';

    this.form = this.fb.group({

      /* ── Identification ── */
      nom:                [nom,      Validators.required],
      statut:             [statut,   Validators.required],
      faculteDepartement: ['',       Validators.required],
      courriel:           [courriel, [Validators.required, Validators.email]],
      copieCourriel:      [true],

      // Champs ajoutés (présents dans SharePoint)
      bibliotheque:       ['', Validators.required],
      bibliothecaire:     ['', Validators.email],          // optionnel mais validé si renseigné

      /* ── Description ── */
      titre:              ['', Validators.required],
      auteur:             ['', Validators.required],
      editeur:            [''],                             // NOUVEAU — Éditeur du document
      annee:              [''],                             // Date de publication
      urlSource:          ['', Validators.pattern('https?://.+')], // NOUVEAU — URL séparée
      isbnIssn:           [''],
      formatSupport:      [''],                             // NOUVEAU — Imprimé / Électronique
      notes:              [''],
      reserver:           ['non'],

      /* ── Section enseignant ── */
      dateRequis:         [''],
      mettreReserve:      [false],
      sigleCours:         [{ value: '', disabled: true }],
    });

    // Active/désactive le sigle de cours selon la checkbox
    this.form.get('mettreReserve')!.valueChanges.subscribe(val => {
      this.showSigleCours = val;
      val
        ? this.form.get('sigleCours')!.enable()
        : this.form.get('sigleCours')!.disable();
    });
  }

  get f() { return this.form.controls; }

  onReset(): void {
    this.submitted = false;
    this.success   = false;
    this.error     = false;
    this.form.reset({
      copieCourriel: true,
      reserver:      'non',
      mettreReserve: false,
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isLoading = true;

    const v = this.form.getRawValue();

    const payload = {
      /* Identification */
      nom:                v.nom,
      statut:             v.statut,
      faculteDepartement: v.faculteDepartement,
      courriel:           v.courriel,
      copieCourriel:      v.copieCourriel,
      bibliotheque:       v.bibliotheque,
      bibliothecaire:     v.bibliothecaire,

      /* Description */
      titre:              v.titre,
      auteur:             v.auteur,
      editeur:            v.editeur,
      annee:              v.annee,
      urlSource:          v.urlSource,
      isbnIssn:           v.isbnIssn,
      formatSupport:      v.formatSupport,
      notes:              v.notes,
      reserver:           v.reserver,

      /* Enseignant */
      dateRequis:         v.dateRequis,
      mettreReserve:      v.mettreReserve,
      sigleCours:         v.sigleCours,
    };

    this.reponsesService.envoyerSuggestion(payload).subscribe({
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