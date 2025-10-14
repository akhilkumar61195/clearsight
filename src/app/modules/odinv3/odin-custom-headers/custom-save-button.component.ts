import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { RowNodeTransaction } from 'ag-grid-enterprise';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-save-button-renderer',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  template: `

    <p-button class="ml-5" styleClass="chv-light-blue-btnsm"
              icon="pi pi-clone" (click)="onCloneClick()" label=""
              pTooltip="Save">
    </p-button>
    <p-button class="ml-5"  *ngIf="params.data?.canDelete" styleClass="delete-action-icon"
              icon="pi pi-trash" (click)="onDeleteClick()" label=""
              pTooltip="Save">
    </p-button>
  `
})
export class SaveButtonRendererComponent implements ICellRendererAngularComp {
  params: any;

  agInit(params: any): void {
    this.params = params;
   
  }

  refresh(params: any): boolean {
    return true;
  }

  onCloneClick() {
    
    const gridApi = this.params.api;
    const rowIndex = this.params.node.rowIndex+1;
    const originalData = this.params.node.data;
    const clonedData = { ...originalData, canDelete: true,clonedIndex:rowIndex};
  

    const res = gridApi.applyTransaction({
      add: [clonedData],
      addIndex: rowIndex,
    })!;
    if (res.add) {
      res.add.forEach((rowNode) => {
      
        if (this.params.context && this.params.context.componentParent) {
        this.params.context.componentParent.onRowSave(clonedData,rowIndex); // Call method on parent
      }
      });
    }
  }
  onDeleteClick(){
    const gridApi = this.params.api;
    const originalData = this.params.node.data;
    const rowIndex = this.params.node.rowIndex;

    const res = gridApi.applyTransaction({
      remove: [originalData],
    });
    
    if (res.remove) {
      res.remove.forEach((rowNode) => {
        if (this.params.context && this.params.context.componentParent) {
          this.params.context.componentParent.onRowRemove(originalData,rowIndex); // Optionally notify parent
        }
      });
    }
    
  }

  
}
