import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
//Custom cell render for button in AG grid
@Component({
    selector: 'actions-cell-renderer',
    standalone: true,
    template: `<p-button  class="" styleClass="delete-action-icon"
                icon="pi pi-trash" (click)="onButtonClick()" label="" [ngClass]="{'disabled': isDelete}" [disabled]="isDisabled || isDelete"></p-button>`,
    imports: [ButtonModule,CommonModule], 
})
//Custom Button Class for use in AG grid
export class CustomDeleteButton implements ICellRendererAngularComp {

    @Input() rowData: any;
    //@Output() buttonClicked = new EventEmitter<any>();
    // @Output() deleteClicked = new EventEmitter<any>();
     params: any;
     visible: boolean;
     isDisabled: boolean = false;
     isDelete:boolean=false;


    agInit(params: ICellRendererParams): void {
        this.params = params;
        this.isDelete=this.params.isDelete;

     if (this.params.isDisabled) {
      this.isDisabled = this.params.isDisabled(params.data);
    } else {
      this.isDisabled = false;
    }
    }
    refresh(params: ICellRendererParams) {
        if (this.params.isDisabled) {
            this.isDisabled = this.params.isDisabled(params.data);
          }
          return true;
    }
    onButtonClick() {
        if (!this.isDisabled && this.params.onClick) {
            this.params.onClick(this.params.node.data); 
          }
    // this.params.onClick(this.params.node.data); 
    // console.log('40',this.visible);
    }
}