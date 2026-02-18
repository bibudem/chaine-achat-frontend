import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import { Injectable } from "@angular/core";

import { Observable } from "rxjs";
import { catchError, tap } from "rxjs/operators";

import { ErrorHandlerService } from "./error-handler.service";
import { Processus } from "../models/Processus";

@Injectable({
  providedIn: "root",
})
export class ProcessusService {
  [x: string]: any;
  private url = "/processus";

  httpOptions: { headers: HttpHeaders } = {
    headers: new HttpHeaders({ "Content-Type": "application/json" }),
  };

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private http: HttpClient
  ) {}


  delete(id: number): Observable<any> {
    const url = this.url+'/delete/'+`${id}`;

    return this.http
      .delete<Processus>(url, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("delete")));
  }

  deleteDetails(id: number): Observable<any> {
    const url = this.url+'/details/delete/'+`${id}`;

    return this.http
      .delete<Processus>(url, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("delete")));
  }
  //chercher toute la liste des plateformes
  fetchAll(): Observable<Processus[]> {
    return this.http
      .get<Processus[]>(this.url+'/all', { responseType: "json" })
      .pipe(
        tap((_) => console.log("liste processus")),
        catchError(
          this.errorHandlerService.handleError<Processus[]>("fetchAll", [])
        )
      );
  }
  //chercher les details du processus
  fetchAllDetails(id:string): Observable<any[]> {
    return this.http
      .get<any[]>(this.url+'/liste-details/'+id, { responseType: "json" })
      .pipe(
        tap((_) => console.log("liste processus")),
        catchError(
          this.errorHandlerService.handleError<any[]>("fetchAllDetails", [])
        )
      );
  }

  /******************Section mise a jour des monographies*******************/
  updateLotMonographies(values: any): Observable<any[]> {
    const url = this.url+'/lot-monographies';
    console.log(values);
    console.log(url);
    return this.http
      .put<any>(url, values, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("update monographies")));
  }

  /******************Section mise a jour des monographies*******************/
  updateLotFilms(values: any): Observable<any[]> {
    const url = this.url+`/lot-films`;
    //console.log(values)
    return this.http
      .put<any>(url, values, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("update films")));
  }
  /******************Section mise a jour des prets*******************/
  updateLotPrets(values: any): Observable<any[]> {
    const url = this.url+`/lot-prets`;
    //console.log(values)
    return this.http
      .put<any>(url, values, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("update prets")));
  }

  /******************Ajouter un processus*******************/
  addProcessus(processus: any): Observable<any[]>{
    const url = this.url+`/add`;
    //console.log(processus);
    return this.http
      .put<any>(url, processus, this.httpOptions)
      .pipe(catchError(this.errorHandlerService.handleError<any>("add processus")));
  }


}
