import { Injectable } from "@angular/core";

import { Observable, of, throwError } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ErrorHandlerService {
  /**
   * Avec une valeur de repli (`result`), l'erreur est journalisée et remplacée par cette valeur
   * (ex. liste vide). Sans valeur de repli, l'erreur est relancée pour que le `error:` du
   * composant s'exécute : avant, elle devenait `undefined` dans `next` (spinner bloqué,
   * « Item supprimé avec succès » affiché après un échec, aucun message à l'enregistrement).
   */
  handleError<T>(operation = "operation", result?: T) {
    return (error: any): Observable<T> => {
      console.log(`${operation} failed: ${error.message}`);
      return result !== undefined ? of(result as T) : throwError(() => error);
    };
  }
}
