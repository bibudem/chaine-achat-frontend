// IdentifiantDocument.ts
//
// Champ isbn_issn — « ISBN / ISSN / Autre identifiant » : accepte un ISBN, un ISSN, un autre
// identifiant ou « N/A ». Masque commun aux 6 formulaires (dépôt bibliothèque et fiche ACQ) :
// les tirets sont retirés seulement quand la valeur commence par 9 (ISBN, ex. 978-2-07-…) ;
// sinon la saisie est libre (ex. ISSN 0028-0836, autre identifiant, N/A).

/** Longueur maximale du champ (même limite que la fiche item admin). */
export const IDENTIFIANT_MAX = 50;

/** Retire les tirets si la valeur commence par 9 ; sinon la renvoie telle quelle. */
export function nettoyerIdentifiant(valeur: string | null | undefined): string {
  const v = valeur ?? '';
  return /^\s*9/.test(v) ? v.replace(/-/g, '') : v;
}
