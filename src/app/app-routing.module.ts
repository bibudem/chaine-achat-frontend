import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccueilComponent } from './components/admin/accueil/accueil.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AuthGuard } from "./services/auth-guard.service";
import {NotUserComponent} from "./components/not-user/not-user.component";
import {AdminGuard} from "./services/admin-guard.service";
import {NotAutoriseComponent} from "./components/not-autorise/not-autorise.component";
import {ItemDetailComponent} from "./components/admin/item-detail/item-detail.component";
import {RapportsComponent} from "./components/admin/rapports/rapports.component";
import { ItemsListComponent } from './components/admin/items-list/items-list.component';
import { ItemFormulaireComponent } from './components/admin/item-formulaire/item-formulaire.component';
import { UserLayoutComponent } from './components/usager/user-layout/user-layout.component';
import { UsagerFormulaireComponent } from './components/usager/usager-formulaire/usager-formulaire.component';
import { UsagerHomeComponent } from './components/usager/usager-home/usager-home.component';
import { SuggestionPublicComponent } from './components/usager/pages/suggestion-public/suggestion-public.component';
import { UserGuard } from './services/user-guard.service';
import { ImportComponent } from './components/admin/import/import.component';
import { NouvelAchatComponent } from './components/usager/pages/nouvel-achat/nouvel-achat.component';
import { ModificationCcolComponent } from './components/usager/pages/modification-ccol/modification-ccol.component';
import { RequeteAccessibiliteComponent } from './components/usager/pages/requete-accessibilite/requete-accessibilite.component';
import { NouvelAbonnementComponent } from './components/usager/pages/nouvel-abonnement/nouvel-abonnement.component';
import { ReponsesListComponent } from './components/admin/reponses/reponses-list.component';
import { PebTipasaNumeriqueComponent } from './components/usager/pages/peb-tipasa-numerique/peb-tipasa-numerique.component';
import { UsagerProfilComponent } from './components/usager/usager-profil/usager-profil.component';
import { AcqDecisionComponent } from './components/acq-decision/acq-decision.component';
import { EditGuard } from './services/edit-guard.service';
import { StaffGuard } from './services/staff-guard.service';
import { ImportLogsComponent } from './components/admin/import-logs/import-logs.component';

const routes: Routes = [
  { path: '', component: AccueilComponent, canActivate: [AuthGuard, StaffGuard] },
  { path: 'accueil', component: AccueilComponent, canActivate: [AuthGuard, StaffGuard] },
  { path: 'items/nouveau', component: ItemFormulaireComponent, canActivate: [AuthGuard, StaffGuard, EditGuard] },
  { path: 'items/details/:id', component: ItemDetailComponent, canActivate: [AuthGuard, StaffGuard] },
  { path: 'items/:id', component: ItemFormulaireComponent, canActivate: [AuthGuard, StaffGuard, EditGuard] },
  { path: 'items', component: ItemsListComponent, canActivate: [AuthGuard, StaffGuard] },
  { path: 'acq-decision', component: AcqDecisionComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'rapport', component: RapportsComponent, canActivate: [AuthGuard, StaffGuard] },
  { path: 'import',       component: ImportComponent,     canActivate: [AuthGuard, AdminGuard] },
  { path: 'import-logs', component: ImportLogsComponent, canActivate: [AuthGuard, AdminGuard] },
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
      { path: 'nouvel-achat', component: NouvelAchatComponent },
      { path: 'modification-ccol', component: ModificationCcolComponent },
      { path: 'requete-accessibilite', component: RequeteAccessibiliteComponent },
      { path: 'nouvel-abonnement', component: NouvelAbonnementComponent },
      { path: 'peb-tipasa-numerique', component: PebTipasaNumeriqueComponent },
      { path: 'profil',              component: UsagerProfilComponent },
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
