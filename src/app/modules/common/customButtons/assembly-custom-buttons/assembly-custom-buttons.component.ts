import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';  // Import CommonModule to use ngIf
import { AccessControls } from '../../../../common/constant';
import { AuthService } from '../../../../services';
import { CommonService } from '../../../../services/common.service';

@Component({
  selector: 'app-assembly-custom-buttons',
  standalone: true,
  template: `
   <div class="d-flex justify-content-between align-items-center">
    <p-button  icon="pi pi-plus-circle" class="mr-1" styleClass="chv-light-blue-btnsm" (onClick)="onButtonClick('component')" 
    [disabled]="!canAddComponent" label="Components"></p-button>

    <!-- Clone button: Hidden for functionId 2 -->
    <p-button icon="pi pi-clone" class="mr-1" (onClick)="onButtonClick('clone')" label=""
            [disabled]="!canCloneComponent"  pTooltip="Clone" styleClass="chv-light-blue-btnsm">
    </p-button>

    <p-button icon="pi pi-trash" class="mr-1" styleClass="delete-action-icon" (onClick)="onButtonClick('delete')" [disabled]="!canDeleteComponent" label="" ></p-button>
                </div>
  `,
  imports: [ButtonModule, TooltipModule,CommonModule],
})
export class AssemblyCustomButtonsComponent implements ICellRendererAngularComp {
  showForPublish: boolean = true;  // Always true to show the Publish to Thor button
  showForClone: boolean = true;    // Default to show the Clone button
  params: any;
  isExported: boolean;
  showExport:boolean= true;
  canAddComponent: boolean = false; // Default to false, can be set based on params
  canCloneComponent: boolean = false; // Default to false, can be set based on params
  canDeleteComponent: boolean = false; // Default to false, can be set based on params
  constructor(private cdr: ChangeDetectorRef, private authService: AuthService, private commonService: CommonService) { }

  agInit(params: ICellRendererParams): void {
    this.getUserDetails();
    this.params = params;
  // Hide Clone button when functionId is 2
    this.showForClone = this.params.data.functionId !== 2;

    this.isExported = this.params.data.isExported === true;
      // Set flag based on passed param
    
    
    // console.log("test params",this.params);
    (this.params?.colDef?.cellRendererParams?.hideExport && (this.showExport= false))
    this.cdr.detectChanges();
  }
  
  /**
   *  it will get the user details from jwt token
  */
  getUserDetails() {
   let userAccess =  this.authService.isAuthorized(
     AccessControls.ASSEMBLY_BUILDER
    );
    this.commonService.setuserAccess(userAccess);
    this.canAddComponent = this.authService.isFieldEditable(
      'isAddComponent'
    );
     this.canCloneComponent = this.authService.isFieldEditable(
      'isCloneComponent'
    );
    this.canDeleteComponent = this.authService.isFieldEditable(
      'isDeleteComponent'
    );
    }
  

  refresh(params: ICellRendererParams) {
    this.isExported = params.data.isExported === true;
    return true;
  }

  onButtonClick(buttonType: string) {
    const rowData = this.params.node.data;

    switch (buttonType) {
      case 'component':
        this.params.onClick({ action: 'component', rowData: rowData });
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
