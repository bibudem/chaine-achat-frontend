import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReponsePayload {
  type_formulaire: 'demande' | "Suggestion d\'achat";
  usager_nom:      string;
  usager_courriel: string;
  usager_statut:   string;
  reponses:        Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class ReponsesService {
  private readonly url = `${environment.apiUrl}/reponses`;

  constructor(private http: HttpClient) {}

  private buildPayload(type: 'demande' | "Suggestion d\'achat", reponses: Record<string, any>): ReponsePayload {
    return {
      type_formulaire: type,
      usager_nom:      `${sessionStorage.getItem('prenomAdmin') ?? ''} ${sessionStorage.getItem('nomAdmin') ?? ''}`.trim(),
      usager_courriel: sessionStorage.getItem('courrielAdmin') ?? '',
      usager_statut:   sessionStorage.getItem('groupeAdmin') ?? '',
      reponses
    };
  }

  envoyerDemande(reponses: Record<string, any>): Observable<any> {
    return this.http.post(this.url, this.buildPayload('demande', reponses));
  }

  envoyerSuggestion(reponses: Record<string, any>): Observable<any> {
    return this.http.post(this.url, this.buildPayload("Suggestion d\'achat", reponses));
  }

  lister(type?: string, page = 1, limit = 20): Observable<any> {
    const params: any = { page, limit };
    if (type) params['type'] = type;
    return this.http.get(this.url, { params });
  }
}