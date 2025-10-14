import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
// button-renderer.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
//Custom cell render for button in AG grid
@Component({
    selector: 'actions-cell-renderer',
    standalone: true,
    template:`<button class="upload-btn" title="Upload" (click)="onButtonClick()" style="border:0;background:transparent;margin-top:5px">
            <span *ngIf="isCVXPoDocumentUploaded()" class="po-button-label">{{this.PoNumber}}</span>    
            <i *ngIf="!isCVXPoDocumentUploaded()" [ngClass]="hasSpecSheet() ? 'pi pi-file' : 'pi pi-cloud-upload'"
            style="font-size: 24px">
</i>
     </button>`,
    imports: [ButtonModule,CommonModule], 
})
//Custom Button Class for use in AG grid
export class CustomUploadButton implements ICellRendererAngularComp {
  constructor(private cdr: ChangeDetectorRef,private authService: AuthService) {}
// <i class="pi pi-cloud-upload" style="font-size:24px"></i>
    @Input() rowData: any;
    //@Output() buttonClicked = new EventEmitter<any>();
    params: any;
    isDisbale:boolean=false;
    PoNumber: string = '';
    agInit(params: ICellRendererParams): void {
        this.params = params;
        this.rowData = params.node.data;
        this.PoNumber = this.rowData.poNumbers;
        this.cdr.detectChanges();
    }
    refresh(params: ICellRendererParams): boolean {
      this.params = params;
      this.rowData = params.node.data;
      this.PoNumber = this.rowData.poNumbers;
      this.cdr.detectChanges();
      return true;
    }
    onButtonClick() {
      // Emit an event with row data when button is clicked
    //this.buttonClicked.emit(this.rowData);    
    if (this.params.onClick) {
        this.params.onClick(this.rowData,this.hasSpecSheet());  // Trigger parent event with row data
      }
      
    }
    hasSpecSheet(): boolean {
    
      if(this.params.additionalParam=='SpecSheet')
        return (this.rowData && this.rowData.specSheetDocumentCount > 0)||(this.rowData && this.rowData.documentCount > 0);
      if(this.params.additionalParam=='Others')
        return this.rowData && (this.rowData.matDocumentCount > 0||this.rowData.specSheetDocumentCount > 0 || this.rowData.cvxPoDocumentCounts > 0);
      if(this.params.additionalParam=='Cvx')
        return this.rowData && this.rowData.cvxPoDocumentCount > 0;
    }

    isCVXPoDocumentUploaded(): boolean {
      if(this.params.additionalParam=='Cvx' && this.rowData && this.rowData.cvxPoDocumentCount > 0) {
        this.PoNumber= this.rowData.poNumbers.split(',').pop();
        return true;
      }

      return false;
    }
}
