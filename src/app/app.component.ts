import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild, } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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

}
