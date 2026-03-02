import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface LstFournisseur {
  id_fournisseur?: number;
  titre:           string;
  format_offert?:  string | null;
  affichage_prix?: string | null;
  type_document?:  string | null;
  description?:    string | null;
  modifie_par?:    string | null;
  datea?:          string | null;  
  datem?:          string | null;   
  actif?:          boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class LstFournisseursService {
  private url = `${environment.apiUrl}/lst-fournisseurs`;
  

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<LstFournisseur[]>> {
    console.log(`${environment.apiUrl}/lst-fournisseurs/all`);
    return this.http.get<ApiResponse<LstFournisseur[]>>(`${this.url}/all`);
  }

  getById(id: number): Observable<ApiResponse<LstFournisseur>> {
    return this.http.get<ApiResponse<LstFournisseur>>(`${this.url}/${id}`);
  }

  create(f: LstFournisseur): Observable<ApiResponse<{ id_fournisseur: number }>> {
    return this.http.post<ApiResponse<{ id_fournisseur: number }>>(this.url, f);
  }

  update(id: number, f: LstFournisseur): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.url}/${id}`, f);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`);
  }
}