import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
// button-renderer.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
//Custom cell render for button in AG grid
@Component({
    selector: 'actions-cell-renderer',
    standalone: true,
    template: `<p-button  class="" styleClass="chv-light-blue-btnsm"
                icon="pi pi-plus-circle" (click)="onButtonClick()" [disabled]="isDisabled" label="Components"></p-button>`,
    imports: [ButtonModule], 
})
//Custom Button Class for use in AG grid
export class CustomButton implements ICellRendererAngularComp {

    @Input() rowData: any;
    //@Output() buttonClicked = new EventEmitter<any>();
    params: any;
    isDisabled: boolean = false;


    agInit(params: ICellRendererParams): void {
        this.params = params;
        this.isDisabled = this.params.isDisabled(params.node.data);
    }
    refresh(params: ICellRendererParams) {
        this.isDisabled = this.params.isDisabled(params.node.data);
        return true;
    }
    onButtonClick() {
      // Emit an event with row data when button is clicked
    //this.buttonClicked.emit(this.rowData);
    if (!this.isDisabled) {
    this.params.onClick(this.params.node.data);  
    }
    }
}