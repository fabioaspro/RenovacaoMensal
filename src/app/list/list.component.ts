import { CommonModule, formatDate } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild, } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import { PoModule, PoTableColumn, PoTableModule, PoButtonModule, PoMenuItem, PoMenuModule, PoModalModule, PoPageModule, PoToolbarModule, PoTableAction, PoModalAction, PoDialogService, PoNotificationService, PoFieldModule, PoDividerModule, PoTableLiterals, PoTableComponent, PoModalComponent,} from '@po-ui/ng-components';
import { ServerTotvsService } from '../services/server-totvs.service';
//import { ExcelService } from '../services/excel-service.service';
import { escape } from 'querystring';
import { ExcelService } from '../services/excel-service.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
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
    HttpClientModule
],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {
 
  private srvTotvs = inject(ServerTotvsService);
  private srvExcel = inject(ExcelService);
  private formConsulta = inject(FormBuilder);
  private srvDialog = inject(PoDialogService);
  private srvNotification = inject(PoNotificationService);
  private formB = inject(FormBuilder);

  @ViewChild('ttRenovacaoMensal') GridRenovacao!: PoTableComponent;
  @ViewChild('ChamaEntradas') telaRenovEntradas!: PoModalComponent;

  //Altera do Grid
  @ViewChild('telaAltera', { static: true }) telaAltera:  | PoModalComponent  | undefined;

  //Referencia ao componente de login
  @ViewChild('loginModal_login', { static: true }) loginModal_login: PoModalComponent | undefined;

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
  loadExcel: boolean = false
  listaEstabelecimentos: any[] = [];
  alturaGrid:number=window.innerHeight - 295
  codFilial!: string;
  registros!: any[];
  codEstabelecimento_login:string=''
  codUsuario_login:string=''
  senha_login:string=''
  
  //Agendamento
  //horaAgendamentoEntr!: string;
  //horaAgendamentoSai!: string;
  //dataAgendamentoprimeiro!: Date;
  //dataAgendamentoultimo!: Date;
  
  //Formulario
  public form = this.formConsulta.group({
    DtRenovEntr: [new Date(), Validators.required],
    HrRenovEntr: ['', Validators.required],
    DtRenovSai: [new Date(), Validators.required],
    HrRenovSai: ['', Validators.required],
  });

  //Form Altera do Grid
  public formAltera = this.formB.group({
    "dDtRenovSai": ['', Validators.required],
    "chrRenovSai": ['', Validators.required],
  });

  //---Grid
  linhaSelecionada: any = undefined
  objSolic!: any[];
  pesquisa!:string
  colunas!: PoTableColumn[]
  lista!: any[]
   customLiterals: PoTableLiterals = {
    noData: 'Infome os filtros para Buscar os Dados',    
  };

  //----- Tela Login
acaoLogin_login: PoModalAction = {
  action: () => {
    this.onLogarUsuario()
  },
  label: 'Login',
  
};

//---- Acao Login
onLogarUsuario(){
  //Acompanhamento
  this.acaoLogin_login.loading=true;

  //Popular parametros de tela
  let paramsLogin: any = {CodEstabel: this.codEstabelecimento_login, CodUsuario: this.codUsuario_login, Senha: this.senha_login}

  //Chamar servico de login
  this.srvTotvs.LoginAdmin(paramsLogin).subscribe({
    next: (response: any) => {
      
      if (response.senhaValida){
          //Acompanhamento
          this.acaoLogin_login.loading=false

          //Fechar janela
          this.loginModal_login?.close()

          //Chamar rotina de aprovacao passando o Tipo de Aprovacao
          this.onListarSaldoTerc()
      }
      else{
        this.acaoLogin_login.loading=false
        this.srvNotification.error(response.mensagem)
      }
      },
    error:(e)=>{this.acaoLogin_login.loading=false}
  })
} 

acaoLogin_cancel: PoModalAction = {
  action: () => {
    this.loginModal_login?.close()
  },
  label: 'Cancelar'
};

  mostrarDetalhe(row:any, index: number) {
    return true;
  }

  //---- Chamar a tela de login passando o tipo de calculo
  onChamarLogin(){

    //Acompanhamento
    this.acaoLogin_login.loading=false

    //Zerar campos de tela
    this.codUsuario_login=''
    this.senha_login=''

    //Sugerir o estabelecimento do usuário
    this.codEstabelecimento_login = '116' //this.codEstabel

    //Abrir a tela de login
    this.loginModal_login?.open()
  }  

  acaoLogin: PoModalAction = {
    action: () => {
      this.onListarSaldoTerc();
    },
    label: 'Selecionar',
  };

  public onListarSaldoTerc(): void {

    let registrosSelecionados = this.GridRenovacao.getSelectedRows()

    //Verificar se existe algum registro selecionado, caso nao exista,
    //exibir msg para o usuario na tela

    if (this.GridRenovacao.getSelectedRows().length > 0) {

      this.srvDialog.confirm({
        title: 'Gerar listagem de Saldo Terceiros',
          message:
          "<div class='dlg'><i class='bi bi-question-circle po-font-subtitle'></i><span class='po-font-text-large'> CONFIRMA GERAÇÃO ?</span></div><p>O processamento também irá liberar os envios de baixa.</p>",
      
          confirm: () => {
            this.loadTela = true;
            //Montar IDs de registros selecionados no grid
            let registrosComSeparador = '';

            registrosSelecionados.forEach((item) => { registrosComSeparador += item['CodEmitente'] + ';' });

            //Passando os parametros de data e hora entrada e saida do FORM
            //let paramsTela: any = { paramsTela: this.form.value }

            //Passando os parametros de técnicos selecionados
            let params = { CodFilial:   this.codFilial, 
                           CodEmitente: registrosComSeparador };

            //Chamar a api para processar registros
            this.srvTotvs.ObterListaSaldoTerc(params).subscribe({
              next: (data: any) => { 
                  this.labelLoadTela = "Gerando Listagem Saldo Terceiros"
                  this.loadTela = true;
              },
              error: (e:any) => {

                this.loadTela = false;
                //mensagem pro usuario
                this.Pnotifica.error("Erro ao chamar ObterListaSaldoTerc.:" + e)
              },

              complete: () => {

                this.loadTela = false;
                this.Pnotifica.success("Processo de Listagem de Saldo Terceiros Efetuada com sucesso.")
                this.atualizar();

              }
            })
          },
          cancel: () => this.srvNotification.error('Cancelada pelo usuário'),
        });

    }
    //Nenhum Registro selecionado no grid
    else this.Pnotifica.error('3Nenhum registro selecionado !');

  }

  public ChamaRenovacaoMensal(): void {
    // Gerar alerta -> console.log(this.GridRenovacao.getSelectedRows());
    //Obter os registros selecionados no grid

    this.telaRenovEntradas.close();

    
    this.loadTela = true;
    let registrosSelecionados = this.GridRenovacao.getSelectedRows();

    //Verificar se existe algum registro selecionado, caso nao exista,
    //exibir msg para o usuario na tela

    if (this.GridRenovacao.getSelectedRows().length > 0) {

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

          //Chamar a api para processar registros
          this.srvTotvs.ExecEntradas(params).subscribe({
            next: (data: any) => { 
                this.labelLoadTela = "Gerando Renovação Mensal"
                this.loadTela = true; 
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
    else {
      this.Pnotifica.error('1Nenhum registro selecionado !')
      
    }
  }

  //Funcao 
  public PrimeiroDiaDoMes() {
    let hoje = new Date()
    let toDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

    this.form.controls.DtRenovSai.setValue(toDate)
  }

  public ultimoDiaUtilDoMes() {
    let hoje = new Date()
    let toDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    while (toDate.getDate() == 0 || toDate.getDate() == 6)
      toDate.setDate(toDate.getDate() - 1);

    this.form.controls.DtRenovEntr.setValue(toDate)

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
    
    this.form.controls.HrRenovEntr.setValue("00:00:05")
    this.form.controls.HrRenovSai.setValue("00:00:10")

    
    //Colunas do grid
    //this.colunas = this.srvTotvs.obterColunas()

    this.srvTotvs.ObterColunasGrid().subscribe(
      (data: { items: Array<any> }) => {
        this.colunas = data.items;
      });

    this.srvTotvs.ObterEstabelecimentos().subscribe({
      next: (data:any) => { 
                        this.listaEstabelecimentos = [];
                        this.listaEstabelecimentos = data;
                      },
      error: (error:any) => { this.Pnotifica.error("Ocorreu um erro:" + error)  
      },
      complete: () => { //console.log('O carregamento terminou com sucesso !') 
                        //this.Pnotifica.success("O carregamento terminou com sucesso !")  
      }
    });
  }

  AbrirEfetuarRenovacao(){
    let registrosSelecionados = this.GridRenovacao.getSelectedRows()

    //Verificar se existe algum registro selecionado, caso nao exista,
    //exibir msg para o usuario na tela

    if (this.GridRenovacao.getSelectedRows().length > 0) {

      //Voltar hora padrão ????
      this.form.controls.HrRenovEntr.setValue("00:00:05")
      this.form.controls.HrRenovSai.setValue("00:00:10")

      this.telaRenovEntradas.open();

    }
    //Nenhum Registro selecionado no grid
    else {
     
      this.Pnotifica.error('Nenhum registro selecionado !')
      
      /*
      setTimeout(() => {
        let filtro = (document.querySelector('.po-toaster-actions') as HTMLInputElement)
        console.log(filtro)
        filtro.style.display = 'none'
      }, 500)
      */  

    }
  }

  public FecharChamaEntradas(): void {

    this.telaRenovEntradas.close();

  }

  public onEstabChange(obj: string) {

    this.codFilial = obj;
    this.atualizar();
    
    //let filtro = (document.querySelector('.po-search-input') as HTMLInputElement)
    //filtro.placeholder = "Alterar Label do Search"

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
                        },
        error: (error:any) => { //console.log('Ocorreu um erro', error) 
                                this.Pnotifica.error("Ocorreu um erro:" + error)  
        },
        complete: () => { //console.log('O carregamento terminou com sucesso !') 
                          //this.Pnotifica.success("O carregamento terminou com sucesso !")
                          setTimeout(() => {
                            let filtro = (document.querySelector('.po-search-input') as HTMLInputElement)
                            filtro.dispatchEvent(new Event('input',{bubbles:true}))
                          }, 500); 
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

  public onExportarExcel() {
    let titulo = "RENOVAÇÃO MENSAL" //this.tituloTela.split(':')[0]
    let subTitulo = "LISTA E TÉCNICOS" //this.tituloTela.split(':')[1]
    this.loadExcel = true

    //let valorForm: any = { valorForm: this.form.value }
    this.srvExcel.exportarParaExcel('RENOVAÇÃO MENSAL: ' + titulo.toUpperCase(),
      subTitulo.toUpperCase(),
      this.colunas,
      this.registros,
      'RenovMensal_' + this.codFilial,
      'Plan1')

    this.loadExcel = false;
  }

  //Alterar Grid
  onAlterarGrid(obj: any | null){

    this.objSolic = [obj.CodEmitente + ' - ' + obj.NomeAbrev]
    this.linhaSelecionada = obj

    this.telaAltera?.open();

    if ((obj !== null) && (obj['$showAction'] !== undefined))
       delete obj['$showAction']

    if (obj !== null) {
      this.formAltera.patchValue(obj)
    }

  }
  readonly acaoAlterarLinha: PoModalAction = {
    label: 'Salvar',
    action: () => {this.onSalvar()},
   
    disabled: !this.formAltera.valid,
  };

  readonly acaoCancelarLinha: PoModalAction = {
    label: 'Cancelar',
    action: () => {
      this.telaAltera?.close();
    },
  }
  //---Salvar Registro
  onSalvar() {
    
    this.linhaSelecionada.dDtRenovSai = this.formAltera.controls.dDtRenovSai.value
    this.linhaSelecionada.chrRenovSai = this.formAltera.controls.chrRenovSai.value
    
    this.telaAltera?.close();
  }

  //marcar desmarcar linha
  total = 0
  changeOptions(selecionados: any[]) {

    this.total = this.GridRenovacao.getSelectedRows().length    

  }
}
