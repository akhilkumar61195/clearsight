import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';  // Import CommonModule to use ngIf

@Component({
  selector: 'actions-cell-renderer',
  standalone: true,
  template: `
    <!-- Publish to Thor button: Always shown for both functionId 1 and 2 -->
    <p-button styleClass="chv-light-blue-btnsm"
              icon="pi pi-file-export" (click)="onButtonClick('export')" label=""
             pTooltip="Publish to THOR" [disabled]="isExported || !canPublish" [ngClass]="{'disabled': !canPublish}" *ngIf="showExport">
    </p-button>

    <!-- Clone button: Hidden for functionId 2 -->
    <p-button class="ml-2" styleClass="chv-light-blue-btnsm"
              icon="pi pi-clone" (click)="onButtonClick('clone')" label=""
              pTooltip="Clone" [disabled]="(params.data.demand === 0)|| !canClone" [ngClass]="{'disabled': !canClone}" *ngIf="showForClone">
    </p-button>
    <p-button icon="pi pi-trash" class="ml-2" styleClass="delete-action-icon" (click)="onButtonClick('delete')" [disabled]="!canDelete" [ngClass]="{'disabled': !canDelete}" label="" *ngIf="showDelete" ></p-button>
  `,
  imports: [ButtonModule, TooltipModule,CommonModule],
})
export class CustomButtonPublishToThor implements ICellRendererAngularComp {
  showForPublish: boolean = true;  // Always true to show the Publish to Thor button
  showForClone: boolean = true;    // Default to show the Clone button
  params: any;
  isExported: boolean;
  showExport:boolean= true;
  showDelete: boolean = false; // Default to show the Delete button
  canDelete: boolean = true;// Default to allow delete action
  canPublish: boolean = true; // Default to allow publish action
  canClone: boolean = true; // Default to allow clone action


  constructor(private cdr: ChangeDetectorRef) { }

  agInit(params: ICellRendererParams): void {
    this.params = params;
  // Hide Clone button when functionId is 2
    this.showForClone = this.params.data.functionId !== 2;

    this.isExported = this.params.data.isExported === true;
   // console.log("test params",this.params);
    (this.params?.colDef?.cellRendererParams?.hideExport && (this.showExport= false));
    (this.params?.colDef?.cellRendererParams?.showDelete && (this.showDelete= true));
    // Set canDelete canPublish and canClone based on access control
    this.canDelete = this.params?.colDef?.cellRendererParams?.isDeleteAllowed !== false;
    this.canPublish = this.params?.colDef?.cellRendererParams?.isPublishAllowed !== false;
    this.canClone = this.params?.colDef?.cellRendererParams?.isCloneAllowed !== false;


    this.cdr.detectChanges();
  }

  refresh(params: ICellRendererParams) {
    this.isExported = params.data.isExported === true;
    return true;
  }

  onButtonClick(buttonType: string) {
    const rowData = this.params.node.data;

    switch (buttonType) {
      case 'export':
        this.params.onClick({ action: 'export', rowData: rowData });
        break;
      case 'clone':
        this.params.onClick({ action: 'clone', rowData: rowData });
        break;
      case 'delete':
        this.params.onClick({ action: 'delete', rowData: rowData });
        break;
    }
  }
}
