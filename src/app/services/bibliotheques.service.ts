import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Bibliotheque {
  bib_id:        number;
  nom:           string;
  date_creation: string;
}

interface ApiResponse<T> {
  success:   boolean;
  message?:  string;
  error?:    string;
  data:      T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class BibliothequesService {
  private readonly baseUrl = `${environment.apiUrl}/bibliotheques`;
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Bibliotheque[]>> {
    return this.http.get<ApiResponse<Bibliotheque[]>>(this.baseUrl);
  }

  creer(nom: string): Observable<ApiResponse<Bibliotheque>> {
    return this.http.post<ApiResponse<Bibliotheque>>(this.baseUrl, { nom }, { headers: this.headers });
  }

  modifier(id: number, nom: string): Observable<ApiResponse<Bibliotheque>> {
    return this.http.put<ApiResponse<Bibliotheque>>(`${this.baseUrl}/${id}`, { nom }, { headers: this.headers });
  }

  supprimer(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
