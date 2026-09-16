// ConversionDevise.ts
//
// Conversion automatique du prix en devise originale vers le CAD — logique partagée par les
// 5 formulaires usager (Nouvel achat unique, Nouvel abonnement, Modification et CCOL, Requête
// ACQ Accessibilité, PEB Tipasa numérique) et le formulaire admin (item-formulaire), qui la
// dupliquaient chacun identiquement avant ce partage. Taux fournis par
// ConfigService.getTauxRates() (CAD = 1, USD/EUR/GBP/CHF/AUD/JPY/NZD = tbl_app_config,
// "Autre" absent = pas de taux, saisie manuelle).

import { TauxRates } from '../services/config.service';

/** Vrai si la devise a un taux connu (donc convertible automatiquement) — "Autre" ou une
 *  devise dont le taux n'a jamais été renseigné par un administrateur retournent faux. */
export function estDeviseConvertible(devise: string | null | undefined, tauxRates: TauxRates): boolean {
  return !!devise && tauxRates[devise] != null;
}

/** Calcule le prix en CAD à partir du prix en devise originale, ou null si la devise n'a pas
 *  de taux connu (l'appelant doit alors laisser le champ prix_cad éditable manuellement). */
export function convertirPrixCad(
  prixDeviseOriginale: number | null | undefined,
  devise: string | null | undefined,
  tauxRates: TauxRates
): number | null {
  if (prixDeviseOriginale == null || prixDeviseOriginale === '' as any) return null;
  if (!estDeviseConvertible(devise, tauxRates)) return null;
  const taux = tauxRates[devise as string];
  return devise === 'CAD' ? prixDeviseOriginale : parseFloat((prixDeviseOriginale * taux).toFixed(2));
}
