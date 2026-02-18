import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import { Injectable } from "@angular/core";

import { Observable } from "rxjs";
import { catchError, tap } from "rxjs/operators";

import { ErrorHandlerService } from "./error-handler.service";

@Injectable({
  providedIn: "root",
})
export class OutilsService {
  [x: string]: any;
  private url = "/api/";

  httpOptions: { headers: HttpHeaders } = {
    headers: new HttpHeaders({ "Content-Type": "application/json" }),
  };

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private http: HttpClient
  ) {}


/******************Section pour la gestion des fonds*******************/

  postFond(fond: any): Observable<any> {
    const url = this.url+`outils/add-fond`;
  //console.log(fond)
    return this.http
      .post<Partial<any>>(url, fond, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("post")));
  }

  updateFond(fond: any): Observable<any> {
    const url = this.url+`outils/save-fond`;
    //console.log(fond)
    return this.http
      .put<any>(url, fond, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("update")));
  }

  deleteFond(id: number): Observable<any> {
    const url = this.url+`outils/delete-fond/${id}`;
    return this.http
      .delete<any>(url, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("delete")));
  }
  //chercher toute la liste des archives
  allFonds(): Observable<any[]> {
    const url = this.url+`outils/all-fonds`;
    //console.log(url)
    return this.http
      .get<any[]>(url, { responseType: "json" })
      .pipe(
        tap((_) => console.log("liste fonds")),
        catchError(
          this.errorHandlerService.handleError<any[]>("all fonds", [])
        )
      );
  }
  //consulter les données d'une archive
  consulterFond(id: number): Observable<any> {
    const url = this.url+`outils/fiche-fond/${id}`;
    return this.http
      .get<any>(url, { responseType: "json" })
      .pipe(catchError(this.errorHandlerService.handleError<any>("consulter fond")));
  }
  /******************Section pour la gestion des fournisseurs*******************/

  postFournisseur(fond: any): Observable<any> {
    const url = this.url+`outils/add-fournisseur`;
    //console.log(fond)
    return this.http
      .post<Partial<any>>(url, fond, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("post")));
  }

  updateFournisseur(fond: any): Observable<any> {
    const url = this.url+`outils/save-fournisseur`;
    //console.log(fond)
    return this.http
      .put<any>(url, fond, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("update")));
  }

  deleteFournisseur(id: number): Observable<any> {
    const url = this.url+`outils/delete-fournisseur/${id}`;
    return this.http
      .delete<any>(url, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("delete")));
  }
  //chercher toute la liste des archives
  allFournisseurs(): Observable<any[]> {
    const url = this.url+`outils/all-fournisseurs`;
    //console.log(url)
    return this.http
      .get<any[]>(url, { responseType: "json" })
      .pipe(
        tap((_) => console.log("liste fonds")),
        catchError(
          this.errorHandlerService.handleError<any[]>("all fonds", [])
        )
      );
  }
  //consulter les données d'une archive
  consulterFournisseur(id: number): Observable<any> {
    const url = this.url+`outils/fiche-fournisseur/${id}`;
    return this.http
      .get<any>(url, { responseType: "json" })
      .pipe(catchError(this.errorHandlerService.handleError<any>("consulter fond")));
  }
}
