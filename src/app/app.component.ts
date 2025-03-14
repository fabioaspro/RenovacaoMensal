import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild, } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import { PoDividerModule, PoModule, PoTableColumn, PoTableModule, PoButtonModule, PoMenuItem, PoMenuModule, PoModalModule, PoPageModule, PoToolbarModule, PoTableAction,} from '@po-ui/ng-components';
import { ServerTotvsService } from './services/server-totvs.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    PoModalModule,
    PoTableModule,
    PoMenuModule,
    PoModule,
    PoDividerModule,
    PoButtonModule,
    PoToolbarModule,
    PoMenuModule,
    PoPageModule,
    HttpClientModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  private srvTotvs = inject(ServerTotvsService);
  readonly menus: Array<PoMenuItem> = [
    { label: 'Home', action: this.onClick.bind(this) },
  ];

  colunas!: PoTableColumn[]

  private onClick() {
    alert('Clicked in menu item');
  }

  ngOnInit(): void {
    
    //Colunas do grid
    this.colunas = this.srvTotvs.obterColunas()
    
  }

  
    constructor(private swUpdate: SwUpdate) {
      console.log('FAS...')
      //location.reload()
      //this.checkForUpdates();
    }
   
    checkForUpdates() {
      console.log('FAS2...')
     
      console.log('4')
      if (this.swUpdate.isEnabled) {

        console.log('FAS3...')
        // Força a verificação de novas versões manualmente
        this.swUpdate.checkForUpdate().then(() => console.log('Checando por atualizações...'));
   
        // Se uma atualização for encontrada, ativa a atualização
        /*
        this.swUpdate.available.subscribe(event => {
          console.log('Nova versão disponível:', event);
          if (confirm('Nova versão disponível! Deseja atualizar?')) {
            this.swUpdate.activateUpdate().then(() => window.location.reload());
          }
        });
   
        // Se o SW for atualizado no servidor, forçar atualização
        this.swUpdate.activated.subscribe(event => {
          console.log('Versão ativada:', event);
        });*/
      }
      else {
        this.swUpdate.checkForUpdate().then(() => console.log('Checando por atualizações...'));
        console.log('FAS4...')
      }
    }


}