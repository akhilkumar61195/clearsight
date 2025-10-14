import { Component } from '@angular/core';
import { IHeaderGroupAngularComp, AgGridAngular } from 'ag-grid-angular';
import { IHeaderGroupParams } from 'ag-grid-community';



@Component({
  selector: 'app-custom-rig-header-label',
  template: `
    <div class="customHeaderLabel">
      <span class="header-span" >Vendor</span>
      <span class="header-span">SAP MM</span>
      <span class="header-span2">Material Description</span>
      <span class="header-span">Inventory</span>
      <span class="header-span">Inventory Minus Backup</span>
      <span class="header-span">Required Backup</span>
    </div>
  `,
  styles: [`
    :host { overflow: hidden; }
    .customExpandButton { float: right; margin-top: 2px; margin-left: 3px; }
    .expanded { animation-name: toExpanded; animation-duration: 1s; transform: rotate(180deg); }
    .collapsed { animation-name: toCollapsed; animation-duration: 1s; transform: rotate(0deg); }
    .ag-header-group-cell-label { display: flex; justify-content: center; align-items: center; gap: 0.25rem; overflow: hidden; }
    .customHeaderLabel { row-gap: 1px;overflow: hidden; justify-content: center; align-items: center; text-overflow: ellipsis; display: flex; flex-direction: column; }
    .header-span { width: 100%; height: 1.5em; text-align: right;padding-right:1em;}
    .header-span2 { width: 100%; height: 3em; text-align: right;padding-right:1em;}
    table th, table td {padding: 5px }
    table { width: 100%; border-collapse: collapse; }
    table th { text-align:right; vertical-align:middle }
    table td { font-weight: normal; text-align: left; vertical-align: middle; }
    @keyframes toExpanded { from { transform: rotate(0deg); } to { transform: rotate(180deg); } }
    @keyframes toCollapsed { from { transform: rotate(180deg); } to { transform: rotate(0deg); } }
  `]
})
export class RigHeaderLable implements IHeaderGroupAngularComp {
  public params!: IHeaderGroupParams;
  
 
  constructor() {}

  agInit(params: IHeaderGroupParams): void {
    this.params = params;
   
  }
 
}
