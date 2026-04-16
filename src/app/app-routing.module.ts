import { NgModule } from '@angular/core';
import {CanActivate, RouterModule, Routes} from '@angular/router';
import { AccueilComponent } from './components/admin/accueil/accueil.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AuthGuard } from "./services/auth-guard.service";
import {NotUserComponent} from "./components/not-user/not-user.component";
import {AdminGuard} from "./services/admin-guard.service";
import {NotAutoriseComponent} from "./components/not-autorise/not-autorise.component";
import {ListeProcessusComponent} from "./components/admin/processus/liste-processus/liste-processus.component";
import {ItemDetailComponent} from "./components/admin/item-detail/item-detail.component";
import {RapportsComponent} from "./components/admin/rapports/rapports.component";
import { ItemsListComponent } from './components/admin/items-list/items-list.component';
import { ItemFormulaireComponent } from './components/admin/item-formulaire/item-formulaire.component';
import { UserLayoutComponent } from './components/usager/user-layout/user-layout.component';
import { UsagerFormulaireComponent } from './components/usager/usager-formulaire/usager-formulaire.component';
import { UsagerHomeComponent } from './components/usager/usager-home/usager-home.component';
import { SuggestionPublicComponent } from './components/usager/pages/suggestion-public/suggestion-public.component';
import { LstFournisseursComponent } from './components/lst-fournisseurs/lst-fournisseurs.component';
import { UserGuard } from './services/user-guard.service';
import { ImportComponent } from './components/admin/import/import.component';
import { NouvelAchatComponent } from './components/usager/pages/nouvel-achat/nouvel-achat.component';
import { ReponsesListComponent } from './components/admin/reponses/reponses-list.component';

const routes: Routes = [
  { path: '', component: AccueilComponent, canActivate: [AuthGuard] },
  { path: 'accueil', component: AccueilComponent, canActivate: [AuthGuard] },
  { path: 'items/nouveau', component: ItemFormulaireComponent },
  { path: 'items/details/:id', component: ItemDetailComponent },
  { path: 'items/:id', component: ItemFormulaireComponent },
  { path: 'items', component: ItemsListComponent },
  { path: 'processus', component: ListeProcessusComponent, canActivate: [AuthGuard,AdminGuard] },
  { path: 'processus/add', component: ListeProcessusComponent, canActivate: [AuthGuard,AdminGuard] },
  { path: 'rapport', component: RapportsComponent },
  { path: 'import', component: ImportComponent, canActivate: [AuthGuard,AdminGuard]  },
  { path: 'lst-fournisseurs', component: LstFournisseursComponent },
  { path: 'reponses', component: ReponsesListComponent, canActivate: [AuthGuard, AdminGuard] },
  // ── Nouvelle section usager ──
  {
    path: 'usager',
    component: UserLayoutComponent,
    canActivate: [AuthGuard, UserGuard],
    children: [
      { path: '',          component: UsagerHomeComponent },
      { path: 'demande', component: UsagerFormulaireComponent },
      { path: 'suggestion-public', component: SuggestionPublicComponent },
      { path: 'nouvel-achat', component: NouvelAchatComponent }
    ]
  },
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
