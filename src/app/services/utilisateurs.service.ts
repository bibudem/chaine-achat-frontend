import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserRole } from './auth.service';

export interface Utilisateur {
  utilisateur_id:          number;
  email:                   string;
  nom:                     string | null;
  prenom:                  string | null;
  role:                    UserRole;
  date_creation:           string;
  date_derniere_connexion: string;
}

interface ApiResponse<T> {
  success:   boolean;
  message?:  string;
  error?:    string;
  data:      T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class UtilisateursService {
  private readonly baseUrl = `${environment.apiUrl}/utilisateurs`;
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Utilisateur[]>> {
    return this.http.get<ApiResponse<Utilisateur[]>>(this.baseUrl);
  }

  /** Pré-provisionne un usager (rôle assigné dès sa première connexion Azure AD). */
  creer(email: string, role: UserRole, nom?: string, prenom?: string): Observable<ApiResponse<Utilisateur>> {
    return this.http.post<ApiResponse<Utilisateur>>(
      this.baseUrl,
      { email, role, nom: nom ?? null, prenom: prenom ?? null },
      { headers: this.headers }
    );
  }

  /** Mise à jour partielle — seuls les champs fournis sont modifiés. */
  modifier(id: number, changes: { email?: string; nom?: string; prenom?: string; role?: UserRole }): Observable<ApiResponse<Utilisateur>> {
    return this.http.put<ApiResponse<Utilisateur>>(
      `${this.baseUrl}/${id}`,
      changes,
      { headers: this.headers }
    );
  }

  supprimer(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
