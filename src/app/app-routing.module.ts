import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccueilComponent } from './components/admin/accueil/accueil.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AuthGuard } from "./services/auth-guard.service";
import {NotUserComponent} from "./components/not-user/not-user.component";
import {AdminGuard} from "./services/admin-guard.service";
import { SuperAdminGuard } from "./services/super-admin-guard.service";
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
import { StatutDecisionComponent } from './components/statut-decision/statut-decision.component';
import { EditGuard } from './services/edit-guard.service';
import { StaffGuard } from './services/staff-guard.service';
import { DecisionGuard } from './services/decision-guard.service';
import { ImportLogsComponent } from './components/admin/import-logs/import-logs.component';
import { SuggestionEmbedComponent } from './components/public/suggestion-embed/suggestion-embed.component';
import { AuthPopupComponent } from './components/auth-popup/auth-popup.component';
import { TriSuggestionsComponent } from './components/usager/pages/tri-suggestions/tri-suggestions.component';
import { TriGuard } from './services/tri-guard.service';
import { TdmItemsComponent } from './components/usager/pages/tdm-items/tdm-items.component';
import { TdmDecisionComponent } from './components/usager/pages/tdm-decision/tdm-decision.component';
import { TdmGuard } from './services/tdm-guard.service';
import { TauxDevisesComponent } from './components/admin/taux-devises/taux-devises.component';
import { UtilisateursComponent } from './components/configuration/utilisateurs/utilisateurs.component';
import { FondsBudgetairesComponent } from './components/configuration/fonds-budgetaires/fonds-budgetaires.component';
import { BibliothequesComponent } from './components/configuration/bibliotheques/bibliotheques.component';

const routes: Routes = [
  { path: 'auth-callback', component: AuthCallbackComponent },
  // Fenêtre de connexion ouverte par le formulaire public embarqué en iframe (Microsoft refuse
  // de s'afficher dans un iframe) — voir AuthService.loginWithPopup.
  { path: 'auth-popup', component: AuthPopupComponent },
  { path: '', component: AccueilComponent, canActivate: [AuthGuard, StaffGuard] },
  { path: 'accueil', component: AccueilComponent, canActivate: [AuthGuard, StaffGuard] },
  { path: 'items/nouveau', component: ItemFormulaireComponent, canActivate: [AuthGuard, StaffGuard, EditGuard] },
  { path: 'items/details/:id', component: ItemDetailComponent, canActivate: [AuthGuard, StaffGuard] },
  { path: 'items/:id', component: ItemFormulaireComponent, canActivate: [AuthGuard, StaffGuard, EditGuard] },
  { path: 'items', component: ItemsListComponent, canActivate: [AuthGuard, StaffGuard] },
  { path: 'statut-decision', component: StatutDecisionComponent, canActivate: [AuthGuard, DecisionGuard] },
  { path: 'rapport', component: RapportsComponent, canActivate: [AuthGuard, StaffGuard] },
  { path: 'import',       component: ImportComponent,     canActivate: [AuthGuard, AdminGuard] },
  { path: 'import-logs', component: ImportLogsComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'reponses', component: ReponsesListComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'configuration/taux-change', component: TauxDevisesComponent, canActivate: [AuthGuard, AdminGuard] },
  // Exclusif au SuperAdmin : pas d'AdminGuard ici, même si l'Admin peut accéder au reste de
  // Configuration (voir authService.isAdmin / AdminGuard, qui incluent le SuperAdmin).
  { path: 'configuration/utilisateurs', component: UtilisateursComponent, canActivate: [AuthGuard, SuperAdminGuard] },
  { path: 'configuration/fonds-budgetaires', component: FondsBudgetairesComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'configuration/bibliotheques', component: BibliothequesComponent, canActivate: [AuthGuard, AdminGuard] },
  // ── Nouvelle section usager ──
  {
    path: 'usager',
    component: UserLayoutComponent,
    canActivate: [AuthGuard, UserGuard],
    children: [
      { path: '',          component: UsagerHomeComponent },
      { path: 'demande', component: UsagerFormulaireComponent },
      { path: 'suggestion-bib', component: SuggestionPublicComponent },
      { path: 'nouvel-achat', component: NouvelAchatComponent },
      { path: 'modification-ccol', component: ModificationCcolComponent },
      { path: 'requete-accessibilite', component: RequeteAccessibiliteComponent },
      { path: 'nouvel-abonnement', component: NouvelAbonnementComponent },
      { path: 'peb-tipasa-numerique', component: PebTipasaNumeriqueComponent },
      { path: 'profil',              component: UsagerProfilComponent },
      // Équipe TechDoc : tri des suggestions publiques + historique partagé de l'équipe.
      { path: 'tri',                 component: TriSuggestionsComponent, canActivate: [TriGuard] },
      // Profil TDM : items routés (creation_notice_dtdm) à traiter directement depuis le portail.
      { path: 'tdm',                 component: TdmItemsComponent, canActivate: [TdmGuard] },
      // Traitement d'un item TDM — vue dédiée (pas le formulaire /statut-decision au complet,
      // voir tdm-decision.component.ts), même gabarit que « Tri des suggestions ».
      { path: 'tdm/:id',             component: TdmDecisionComponent, canActivate: [TdmGuard] },
    ]
  },
  // Formulaire public embarqué (iframe sur le site des Bibliothèques) : ni en-tête/pied de page
  // (pas sous UserLayoutComponent). Seule page accessible à la communauté UdeM (rôle Usager).
  // Pas d'AuthGuard : la redirection vers /login ne fonctionnerait pas dans l'iframe — le
  // composant demande lui-même la connexion, dans une popup (voir suggestion-embed.component.ts).
  { path: 'suggestion-public', component: SuggestionEmbedComponent },
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
