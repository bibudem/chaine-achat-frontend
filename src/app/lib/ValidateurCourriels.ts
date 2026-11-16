import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Même expression que Validators.email d'Angular. */
const COURRIEL_REGEX =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Découpe une saisie « a@x.ca; b@y.ca » en adresses (vides ignorées). */
export function separerCourriels(valeur: string | null | undefined): string[] {
  return (valeur ?? '').split(';').map(c => c.trim()).filter(c => c.length > 0);
}

/** Validateur : une ou plusieurs adresses courriel séparées par « ; ». Vide = valide
 *  (combiner avec Validators.required si le champ est obligatoire). */
export function courrielsMultiples(control: AbstractControl): ValidationErrors | null {
  const adresses = separerCourriels(control.value);
  return adresses.every(c => COURRIEL_REGEX.test(c)) ? null : { email: true };
}

/** Liste pour l'envoi (n8n / SMTP) : adresses séparées par des virgules. */
export function courrielsPourEnvoi(valeur: string | null | undefined): string {
  return separerCourriels(valeur).join(', ');
}
