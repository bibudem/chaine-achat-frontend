import { NgModule } from '@angular/core';
import {CanActivate, RouterModule, Routes} from '@angular/router';
import { AccueilComponent } from './components/accueil/accueil.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AuthGuard } from "./services/auth-guard.service";
import {NotUserComponent} from "./components/not-user/not-user.component";
import {AdminGuard} from "./services/admin-guard.service";
import {NotAutoriseComponent} from "./components/not-autorise/not-autorise.component";
import {ListeProcessusComponent} from "./components/processus/liste-processus/liste-processus.component";
import {ListeProcessusDelailsComponent} from "./components/processus/liste-processus-details/liste-processus-details.component";
import {RapportsComponent} from "./components/rapports/rapports.component";
import { ItemsListComponent } from './components/items-list/items-list.component';
import { ItemFormulaireComponent } from './components/item-formulaire/item-formulaire.component';

const routes: Routes = [
  { path: '', component: AccueilComponent, canActivate: [AuthGuard] },
  { path: 'accueil', component: AccueilComponent, canActivate: [AuthGuard] },
  { path: 'items', component: ItemsListComponent, canActivate: [AuthGuard] },
  { path: 'items/nouveau', component: ItemFormulaireComponent },
  { path: 'items/:id', component: ItemFormulaireComponent },
  { path: 'processus', component: ListeProcessusComponent, canActivate: [AuthGuard,AdminGuard] },
  { path: 'processus/add', component: ListeProcessusComponent, canActivate: [AuthGuard,AdminGuard] },
  { path: 'rapport', component: RapportsComponent },
  { path: 'page-not-found', component: PageNotFoundComponent  },
  { path: 'not-user', component: NotUserComponent },
  { path: 'not-acces', component: NotAutoriseComponent, canActivate: [AuthGuard] },
  { path: '**', component: PageNotFoundComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
