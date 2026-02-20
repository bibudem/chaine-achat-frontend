import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable} from "rxjs";
import {MethodesGlobal} from "../../../../lib/MethodesGlobal";
import {TranslateService} from "@ngx-translate/core";
import {tap} from "rxjs/operators";
import {Router} from "@angular/router";

@Component({
  selector: 'app-liste-processus',
  templateUrl: './liste-processus.component.html',
  styleUrls: ['./liste-processus.component.css']
})
export class ListeProcessusComponent implements OnInit {

  processus$: Observable<any[]> | undefined;

  codes:any=[]

  //les entêts du tableau
  displayedColumns = ['id_processus','titre','admin','h_debut','h_fin','statut','note','details'];
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

  constructor(private translate:TranslateService,
              private router: Router) { }

  //appliquer filtre
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    // @ts-ignore
    this.dataSource.filter = filterValue;
  }

  ngOnInit(): void {
    this.getAllProcessus();
    this.routerChek = this. router.url.toString();
  }

  async getAllProcessus() {

  }

  async deleteProcessus(id:string){
  }

  linkCreerProcessus(routeLink:string):void{

    this.closebutton.nativeElement.click();
    //console.log(routeLink);
    this.router.navigateByUrl(routeLink);
  }

  detailsProcessous(id:string){
    this.router.navigate(['/processus/details/'+id])
  }

  addContenuNote(note:string){
    // @ts-ignore
    document.getElementById("note-contenu").innerHTML = note.toString();
  }

}
