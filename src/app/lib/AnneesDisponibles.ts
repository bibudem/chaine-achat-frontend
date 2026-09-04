// AnneesDisponibles.ts
//
// Liste des années offertes dans les sélecteurs « année » du tableau de bord admin
// (accueil.component.ts) et de la liste des items (items-list.component.ts) — bornée à
// partir de PREMIERE_ANNEE_DONNEES (pas de données avant) jusqu'à l'année en cours.
// S'étend automatiquement chaque année (2027 ajoutera 2026 et 2027, sans revenir avant
// 2026), pas de fenêtre fixe glissante.

export const PREMIERE_ANNEE_DONNEES = 2026;

export function anneesDisponibles(): number[] {
  const current = new Date().getFullYear();
  const debut   = Math.min(PREMIERE_ANNEE_DONNEES, current);
  const years: number[] = [];
  for (let y = current; y >= debut; y--) years.push(y);
  return years;
}
