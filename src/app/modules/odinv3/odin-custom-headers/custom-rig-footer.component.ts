import { Component } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'customRigFooter',
  standalone: true,
  imports:[...PRIME_IMPORTS],
  template: `
    <div class="custom-cell">
      
      <div class="bottom-div-1">{{well}} </div>
      <div class="bottom-div-2">{{date}}</div>
    </div>
  `,
  styles: [`
    .custom-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .bottom-div-1, .bottom-div-2 {
      margin-top: .5em;
      line-height: 1;
      color: red;
    }
  `]
})

export class customRigFooter  implements ICellRendererAngularComp{
  params!: any;
  well!:string;
  date!:string;

  agInit(params: any): void {
    this.params = params;
    this.well = params.well;
    this.date= params.date;
  }
  refresh(params: any) {
    this.params = params;
    return false;
}

}
