import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild, } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import { PoModule, PoTableColumn, PoTableModule, PoButtonModule, PoMenuItem, PoMenuModule, PoModalModule, PoPageModule, PoToolbarModule, PoTableAction, PoModalAction, PoDialogService, PoNotificationService, PoFieldModule, PoDividerModule, PoTableLiterals,} from '@po-ui/ng-components';
import { ServerTotvsService } from '../services/server-totvs.service';
//import { ExcelService } from '../services/excel-service.service';
import { escape } from 'querystring';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ReactiveFormsModule,
    FormsModule,
    PoModalModule,
    PoTableModule,
    PoModule,
    PoFieldModule,
    PoDividerModule,
    PoButtonModule,
    PoToolbarModule,
    PoMenuModule,
    PoPageModule,
    HttpClientModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {

  private srvTotvs = inject(ServerTotvsService);

  //Variaveis 
  labelLoadTela:string = ''
  loadTela: boolean = false
  listaEstabelecimentos: any[] = [];
  
  //---Grid
  pesquisa!:string
  colunas!: PoTableColumn[]
  lista!: any[]
   customLiterals: PoTableLiterals = {
    noData: 'Infome os filtros para Buscar os Dados'
  };

  ngOnInit(){

    //Duvida
    //this.srvTotvs.ObterUsuarioLogado().subscribe({
    //  next: (data:any) => { console.log(data);
    //                  }
    //});

    //Colunas do grid
    this.colunas = this.srvTotvs.obterColunas()

      this.srvTotvs.ObterEstabelecimentos("desouzfa").subscribe({
        next: (data:any) => { console.log(data);
                          this.listaEstabelecimentos = [];
                          this.listaEstabelecimentos = data;
                        },
        error: (error:any) => { console.log('Ocorreu um erro', error) },
        complete: () => { console.log('O carregamento terminou com sucesso !') }
      });  
  }

  AtualizarTela(){

  }

  AbrirChamaEntradas(){

  }

  onEstabChange(obj: string){

    //this.srvTotvs.ObterEstabelecimentosMensal(obj)
    alert(obj)
  }

}
