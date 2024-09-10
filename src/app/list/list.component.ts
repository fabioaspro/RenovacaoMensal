import { CommonModule, formatDate } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild, } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import { PoModule, PoTableColumn, PoTableModule, PoButtonModule, PoMenuItem, PoMenuModule, PoModalModule, PoPageModule, PoToolbarModule, PoTableAction, PoModalAction, PoDialogService, PoNotificationService, PoFieldModule, PoDividerModule, PoTableLiterals, PoTableComponent, PoModalComponent,} from '@po-ui/ng-components';
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
  private formConsulta = inject(FormBuilder);
  
  @ViewChild('ttRenovacaoMensal') GridRemovacao!: PoTableComponent;
  @ViewChild('ChamaEntradas') telaRenovEntradas!: PoModalComponent;

  opcoesGrid: Array<PoTableAction> = [
    //{ label: "Detalhes" , action: this.Detalhe.bind(this), icon: 'po-icon po-icon-plus-circle' },
    //{ label: "Log" , action: this.Log.bind(this), icon: 'po-icon po-icon-news' },
  ]

  constructor( 
    private Pnotifica: PoNotificationService,
    private msgDialog: PoDialogService,
    private router: Router) { }

  //Variaveis 
  labelLoadTela:string = ''
  loadTela: boolean = false
  listaEstabelecimentos: any[] = [];
  
  codFilial!: string;
  registros!: any[];

  //Agendamento
  horaAgendamentoEntr!: string;
  horaAgendamentoSai!: string;
  dataAgendamentoprimeiro!: Date;
  dataAgendamentoultimo!: Date;

  //Formulario
  public form = this.formConsulta.group({
    DtRenovEntr: ['', Validators.required],
    HrRenovEntr: ['', Validators.required],
    DtRenovSai: ['', Validators.required],
    HrRenovSai: ['', Validators.required],
  });


  //---Grid
  pesquisa!:string
  colunas!: PoTableColumn[]
  lista!: any[]
   customLiterals: PoTableLiterals = {
    noData: 'Infome os filtros para Buscar os Dados'
  };

  public ChamaRenovacaoMensal(): void {
    // Gerar alerta -> console.log(this.GridRemovacao.getSelectedRows());
    //Obter os registros selecionados no grid

    this.telaRenovEntradas.close();

    this.loadTela = true;
    let registrosSelecionados = this.GridRemovacao.getSelectedRows();

    //Verificar se existe algum registro selecionado, caso nao exista,
    //exibir msg para o usuario na tela

    if (this.GridRemovacao.getSelectedRows().length > 0) {

      //Dialog solicitando confirmacao de processamento
      this.msgDialog.confirm({

        title: 'Confirma Execução?',
        message: 'Processar a Renovação Mensal dos registros selecionados ? ',
        literals: { cancel: 'Cancelar', confirm: 'Processar' },

        //Caso afirmativo
        confirm: () => {

          //Montar IDs de registros selecionados no grid
          let registrosComSeparador = '';

          registrosSelecionados.forEach((item) => { registrosComSeparador += item['CodEmitente'] + ';' });

          //Passando os parametros de data e hora entrada e saida do FORM
          //let paramsTela: any = { paramsTela: this.form.value }

          //Passando os parametros de técnicos selecionados
          let params = { DtRenovEntr: this.form.controls['DtRenovEntr'].value,
                         HrRenovEntr: this.form.controls['HrRenovEntr'].value,
                         DtRenovSai:  this.form.controls['DtRenovSai'].value,
                         HrRenovSai:  this.form.controls['HrRenovSai'].value,
                         CodFilial:   this.codFilial, 
                         CodEmitente: registrosComSeparador };

          //console.log(params)
          //Chamar a api para processar registros
          this.srvTotvs.ExecEntradas(params).subscribe({
            next: (data: any) => { 
                this.labelLoadTela = "Gerando Renovação Mensal"
                this.loadTela = true; 
                //console.log(data); 
            },
            error: (e:any) => {

              this.loadTela = false;
              //mensagem pro usuario
              this.Pnotifica.error("Erro ao chamar ExecEntradas.:" + e)
            },

            complete: () => {

              this.loadTela = false;
              this.Pnotifica.success("Processo de Renovação Mensal Agendado com sucesso.")
              this.atualizar();

            }
          })

          //this.atualizar();

        },

        //Caso cancelado notificar usuario
        cancel: () => {
          
          this.loadTela = false
          this.Pnotifica.error('Cancelado pelo usuario')
        
        }

      });

    }
    //Nenhum Registro selecionado no grid
    else this.Pnotifica.error('Nenhum registro selecionado !');
  }

  //Funcao 
  public PrimeiroDiaDoMes() {
    let hoje = new Date()
    let toDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

    this.dataAgendamentoprimeiro = toDate;

  }

  public ultimoDiaUtilDoMes() {
    let hoje = new Date()
    let toDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    while (toDate.getDate() == 0 || toDate.getDate() == 6)
      toDate.setDate(toDate.getDate() - 1);

    this.dataAgendamentoultimo = toDate;

  }

  //Chama tela do TOTVS
  public AbrirTelaTOTVS(programa: string): void {
    let params: any = { program: programa, params: '' };
    this.srvTotvs.AbrirTelaTOTVS(params).subscribe({
      next: (response: any) => {},
      error: (e) => {
        this.loadTela = false;
        //mensagem pro usuario
        this.Pnotifica.error("Erro ao chamar AbrirTelaTOTV:" + e)
      },
    });
  }

  ngOnInit(){

    this.ultimoDiaUtilDoMes();
    this.PrimeiroDiaDoMes();
    this.horaAgendamentoEntr = "00:00:05"
    this.horaAgendamentoSai  = "00:00:10"

    //Colunas do grid
    this.colunas = this.srvTotvs.obterColunas()

    this.srvTotvs.ObterColunasGrid().subscribe(
      (data: { items: Array<any> }) => {
        this.colunas = data.items;
        //console.log(this.colunas);
      });

    this.srvTotvs.ObterEstabelecimentos().subscribe({
      next: (data:any) => { 
                        //console.log(data);
                        this.listaEstabelecimentos = [];
                        this.listaEstabelecimentos = data;
                      },
      error: (error:any) => { //console.log('Ocorreu um erro', error) 
                              this.Pnotifica.error("Ocorreu um erro:" + error)  
      },
      complete: () => { //console.log('O carregamento terminou com sucesso !') 
                        //this.Pnotifica.success("O carregamento terminou com sucesso !")  
      }
    });
  }

  AbrirEfetuarRenovacao(){
    let registrosSelecionados = this.GridRemovacao.getSelectedRows()

    //Verificar se existe algum registro selecionado, caso nao exista,
    //exibir msg para o usuario na tela

    if (this.GridRemovacao.getSelectedRows().length > 0) {

      this.horaAgendamentoEntr = "00:00:05"
      this.horaAgendamentoSai  = "00:00:10"
      this.telaRenovEntradas.open();

    }
    //Nenhum Registro selecionado no grid
    else this.Pnotifica.error('Nenhum registro selecionado !');
  }

  public FecharChamaEntradas(): void {

    this.telaRenovEntradas.close();

  }

  public onEstabChange(obj: string) {

    //console.log(obj);
    this.codFilial = obj;
    this.atualizar();

  }

  public atualizar(): void {
    this.labelLoadTela = "Carregando Técnicos"
    this.loadTela = true;
    let params = { CodFilial: this.codFilial };
      this.srvTotvs.PopularMinhaLista(params).subscribe({
        next: (data: { items: Array<any> }) => { 
                        this.registros = data.items;
                        this.totalLabelSituacoes();
                        this.loadTela = false;
                        //console.log('OK', this.registros)
                        },
        error: (error:any) => { //console.log('Ocorreu um erro', error) 
                                this.Pnotifica.error("Ocorreu um erro:" + error)  
        },
        complete: () => { //console.log('O carregamento terminou com sucesso !') 
                          //this.Pnotifica.success("O carregamento terminou com sucesso !")  
        }
      });
  }

  private totalLabelSituacoes() {

    let colunaSituacao = this.colunas.findIndex(col => col.property === 'cSituacao')   //nome do campo
    let labelsSituacao = this.colunas[colunaSituacao].subtitles as any[]

    labelsSituacao.forEach(item => {

      //item.label = item.label + ' (' + this.registros.filter(data => data.cSituacao === item.value).length + ')'
      item.label = item.label.split('(')[0] + ' (' + this.registros.filter(data => data.cSituacao === item.value).length + ')'
    })

  }

}
