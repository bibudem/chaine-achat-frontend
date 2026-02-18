import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from "./app.component";

//Import material designer
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';

// import pour multiselect
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
//import pour traduction
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgbNavModule, NgbModule } from '@ng-bootstrap/ng-bootstrap'; 

import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { MenuComponent } from './menu/menu.component';
import { AccueilComponent } from './components/accueil/accueil.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './components/login/login.component';
import { LoginRoutingModule } from './components/login/login-routing.module';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AuthGuard } from "./services/auth-guard.service";
import {AdminGuard} from "./services/admin-guard.service";
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeFr, 'fr');
import { LOCALE_ID } from '@angular/core';
import {DragDropModule} from "@angular/cdk/drag-drop";
import {NotAutoriseComponent} from "./components/not-autorise/not-autorise.component";
// directive pour les masks
import {NotUserComponent} from "./components/not-user/not-user.component";
import { ListeProcessusComponent } from './components/processus/liste-processus/liste-processus.component';
import {ListeProcessusDelailsComponent} from "./components/processus/liste-processus-details/liste-processus-details.component";
import {MiseAjourMonographieComponent} from "./components/processus/mise-a-jour-monografies/mise-a-jour-monografies.component";
import {ListFondsComponent} from "./components/configuration/fonds/list-fonds/list-fonds.component";
import {ListFournisseursComponent} from "./components/configuration/fournisseurs/list-fournisseurs/list-fournisseurs.component";
import {ListBoxModule} from "@syncfusion/ej2-angular-dropdowns";
import { RouterModule } from '@angular/router';
import { ItemsListComponent } from './components/items-list/items-list.component';
import { ItemFormulaireComponent } from './components/item-formulaire/item-formulaire.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { DialogService } from './services/dialog.service';
import { RapportsComponent } from './components/rapports/rapports.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    MenuComponent,
    AccueilComponent,
    LoginComponent,
    PageNotFoundComponent,
    NotUserComponent,
    NotAutoriseComponent,
    ListeProcessusComponent,
    ListeProcessusDelailsComponent,
    MiseAjourMonographieComponent,
    ListFournisseursComponent,
    ListFondsComponent,
    ItemsListComponent,
    ItemFormulaireComponent,
    DialogComponent,
    RapportsComponent
  ],
    imports: [
        RouterModule,
        BrowserModule,
        LoginRoutingModule,
        AppRoutingModule,
        FormsModule,
        NgbModule,
        NgbNavModule,
        HttpClientModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        }),
        ReactiveFormsModule,
        BrowserAnimationsModule,
        ListBoxModule,
        DragDropModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatSelectModule,
        MatFormFieldModule,
        MatCheckboxModule,
        NoopAnimationsModule,
        MatInputModule
    ],
  providers: [
    CurrencyPipe, 
    DialogService,
    AuthGuard,
    AdminGuard,
    { provide: LOCALE_ID, useValue: "fr-FR" }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

//fonction ajouté pour la traduction
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}