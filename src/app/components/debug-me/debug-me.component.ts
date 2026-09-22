import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * TEMPORAIRE — debug, à retirer : affiche le contenu brut de /auth/me
 * (claims Azure AD) une fois connecté dans l'app. Voir routes/auth.js (backend).
 */
@Component({
  selector: 'debug-me',
  template: `<pre style="padding:2rem;white-space:pre-wrap;word-break:break-word;">{{ data | json }}</pre>`
})
export class DebugMeComponent implements OnInit {
  data: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get(`${environment.apiUrl}/auth/me`).subscribe({
      next: res => this.data = res,
      error: err => this.data = { error: err.message }
    });
  }
}
