import { Component } from '@angular/core';
import { IHeaderGroupAngularComp, AgGridAngular } from 'ag-grid-angular';
import { IHeaderGroupParams } from 'ag-grid-community';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';



@Component({
  selector: 'app-custom-rig-header',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  template: `
    <div class="customHeaderContent">

      <span class="header-span">{{ rigScheduleMaterial.vendor }}</span>
      <span class="header-span3">{{ rigScheduleMaterial.sapMM }}</span>
      <span class="header-span2">{{ rigScheduleMaterial.materialShortDesc }}</span>
      <span class="header-span3">{{ rigScheduleMaterial.inventory }}</span>
      <span class="header-span">{{ rigScheduleMaterial.inventoryMinusBackup }}</span>
      <span class="header-span3">{{ rigScheduleMaterial.requiredBackup }}</span>
    
    </div>
  `,
  styles: [`
    :host { overflow: hidden; }
    .customExpandButton { float: right; margin-top: 2px; margin-left: 3px; }
    .expanded { animation-name: toExpanded; animation-duration: 1s; transform: rotate(180deg); }
    .collapsed { animation-name: toCollapsed; animation-duration: 1s; transform: rotate(0deg); }
    .ag-header-group-cell-label { display: flex; justify-content: space-around; align-items: center; gap: 0.25rem; overflow: hidden; }
    .customHeaderContent {margin: 0;row-gap: 1px;font-weight: 500; overflow: hidden; justify-content: center; align-items: center;  display: flex; flex-direction: column; }
    .header-span {margin: 0; width: 100%; height: 1.5em; text-align: center;border-bottom: 0.1rem solid #f4f4f4}
    .header-span2 { margin: 0;width: 100%; height: 3em; text-align: center;text-wrap: wrap;overflow:hidden;border-bottom: 0.1rem solid   #f4f4f4; }
    .header-span3{margin: 0; width: 100%; height: 1.5em; text-align: center;border-bottom: 0.1rem solid   #f4f4f4;}
    table th, table td { padding: 5px;word-wrap: break-word;}
    table { width: 100%; border-collapse: collapse; }
    table th { background-color: #f4f4f4; font-weight: bold; font-size: 12px; }
    table td { font-weight: 500; text-align: left; vertical-align: middle;word-wrap: break-word; }
    @keyframes toExpanded { from { transform: rotate(0deg); } to { transform: rotate(180deg); } }
    @keyframes toCollapsed { from { transform: rotate(180deg); } to { transform: rotate(0deg); } }
  `]
})
export class CustomRigHeaderGroup implements IHeaderGroupAngularComp {
  public params!: IHeaderGroupParams;
  
  public rigScheduleMaterial:RigScheduleMaterial;

  constructor() {}

  agInit(params: IHeaderGroupParams): void {
    this.params = params;
    this.rigScheduleMaterial = this.params["customParam"];
  }

 
}
interface RigScheduleMaterial {
  "vendor": string;
  "materialId"?: string;
  "sapMM"?: string;
  "materialShortDesc": string;
  "inventory": number;
  "inventoryMinusBackup": number;
  "requiredBackup": number;
}