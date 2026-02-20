// src/app/components/user-layout/user-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent implements OnInit {
  userName: string = '';

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    const prenom = sessionStorage.getItem('prenomAdmin') ?? '';
    const nom = sessionStorage.getItem('nomAdmin') ?? '';
    this.userName = `${prenom} ${nom}`.trim();
  }

  async logout() {
    await this.authService.logout();
  }
}