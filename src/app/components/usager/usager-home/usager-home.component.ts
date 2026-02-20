import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usager-home',
  templateUrl: './usager-home.component.html',
  styleUrls: ['./usager-home.component.css']
})
export class UsagerHomeComponent {
  constructor(private router: Router) {}
}