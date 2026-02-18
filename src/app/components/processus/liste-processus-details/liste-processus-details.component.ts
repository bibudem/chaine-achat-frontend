import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable} from "rxjs";
import {MethodesGlobal} from "../../../lib/MethodesGlobal";
import {ProcessusService} from "../../../services/processus.service";
import {TranslateService} from "@ngx-translate/core";

import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-liste-processus-details',
  templateUrl: './liste-processus-details.component.html',
  styleUrls: ['./liste-processus-details.component.css']
})
export class ListeProcessusDelailsComponent implements OnInit {

  processus$: Observable<any[]> | undefined;

  codes:any=[]

  //les entêts du tableau
  displayedColumns = ['numero','idRevue','titre','dateA','fiche','supprimer'];
  listeProcessus: any = [];
  // @ts-ignore
  dataSource: MatTableDataSource<any>;

  selectedProcessus: string | undefined;


  // @ts-ignore
  @ViewChild('closebutton') closebutton:any;

  //importer les fonctions global
  methodesGlobal: MethodesGlobal = new MethodesGlobal();

  /*name of the excel-file which will be downloaded. */
  fileName= 'liste-processus.xlsx';

  routerChek :string = ''

  idProcessus: string = '';

  constructor(private processusService: ProcessusService,
              private translate:TranslateService,
              private route: ActivatedRoute,
              private router: Router) { }

  //appliquer filtre
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    // @ts-ignore
    this.dataSource.filter = filterValue;
  }

  ngOnInit(): void {

    }




}
