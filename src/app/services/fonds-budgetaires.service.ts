import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FondBudgetaire {
  fond_id:       number;
  code:          string;
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
export class FondsBudgetairesService {
  private readonly baseUrl = `${environment.apiUrl}/fonds-budgetaires`;
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<FondBudgetaire[]>> {
    return this.http.get<ApiResponse<FondBudgetaire[]>>(this.baseUrl);
  }

  creer(code: string): Observable<ApiResponse<FondBudgetaire>> {
    return this.http.post<ApiResponse<FondBudgetaire>>(this.baseUrl, { code }, { headers: this.headers });
  }

  modifier(id: number, code: string): Observable<ApiResponse<FondBudgetaire>> {
    return this.http.put<ApiResponse<FondBudgetaire>>(`${this.baseUrl}/${id}`, { code }, { headers: this.headers });
  }

  supprimer(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
