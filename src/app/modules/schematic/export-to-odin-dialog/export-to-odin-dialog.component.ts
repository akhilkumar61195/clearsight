import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { AuthService } from '../../../services';
import { MessageService } from 'primeng/api';
import { CommonService } from '../../../services/common.service';
import { WellApplications } from '../../../common/model/well-applications';
import { NgxSpinnerService } from 'ngx-spinner';
import { AccessControls } from '../../../common/constant';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-export-to-odin-dialog',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './export-to-odin-dialog.component.html',
  styleUrl: './export-to-odin-dialog.component.scss'
})
export class ExportToOdinDialogComponent implements OnInit , OnDestroy {

  @Output() onClose = new EventEmitter<void>();
  @Input() displayExportToOdinDialog: boolean = false;
  @Input() schematicName: string;
  @Input({ required: true }) schematic: Completionschematicheader;
  @Input() IsApprovedRequest:boolean=false;
  userDetail: any;
  userPersonaDetails:any;
  completionSchematic: Completionschematicheader;
  wellApplications: WellApplications;
  private schematicSubscription:Subscription = new Subscription();

  constructor(private completionSchematicService: CompletionschematicService,
    private authService: AuthService,
    private messageService: MessageService,
    private commonService: CommonService,
    private spinner:NgxSpinnerService
  ) {
    this.userDetail = this.authService.getUserDetail();
  }

  ngOnInit(): void {
   
    this.spinner.hide();
    this.getUserDetails();
    this.commonService.getSelectedSchemanticData().subscribe({
      next: (data: Completionschematicheader) => {
        if (data) {
          this.completionSchematic = data;
          //console.log('Selected Well Data:', data);          
        }
      }
    });

  }

  ngOnDestroy() {
    this.schematicSubscription.unsubscribe();
  }

  closeExportToOdin() {
    this.onClose.emit();
  }

  importDepthTableDialog() {

  }
 getUserDetails(){
  this.userPersonaDetails= this.authService.isAuthorized(AccessControls.PUB_APR);

 }
  exportToOdin() {
    this.spinner.show();
    const id = this.schematic.schematicsID;
    const userId = this.userDetail.uid;
    if(this.userPersonaDetails[0]?.accessAction !=='X')
    {
     this.approveWell(4);
    }
    else{
      this.completionSchematicService.exportToOdin(id, userId).subscribe({
        next: (data) => {
          // console.log(data);
          // this.spinner.show();
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: data
            //detail: `${data} Records Published To Odin & Thor Successfully`
          });
  
          this.createWellApplications(1, this.completionSchematic.wellId); //Odin
          //this.createWellApplications(2, this.completionSchematic.wellId); //Thor
          this.approveWell(2);
         
          // this.spinner.hide();
  
        },
        error: (error) => {
          this.spinner.hide();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `An error occurred: ${error.message || error}`
          });
          //console.error('Error upserting well', error);
        },
        complete: () => {
          this.onClose.emit();
          this.spinner.hide(); // Always hide spinner after completion

        }
      });

    }
 
  }

  createWellApplications(appId: number, wellId: number) {

    this.wellApplications = {
      id: 0,
      appId: appId,
      userId: this.userDetail.uid,
      wellId: wellId,
    }

    this.schematicSubscription = this.completionSchematicService.createWellApplications(this.wellApplications).subscribe({
      next: (res) => { /*console.log(res)*/ },
      error: (error) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: error }); }
    });

  }

  approveWell(statusId:number)
  {
    this.spinner.hide();
    this.schematic.userIdModifiedBy=this.userDetail.uid;
    this.schematic.statusId=statusId;
    this.schematic.schematicsID=this.schematic.schematicsID;
    
    this.schematicSubscription = this.completionSchematicService.updateStatusSchematicSelection(this.schematic).subscribe({
      next: (response) => {
        if(statusId==4){
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Schematic set for pending approval successfully' });
          this.onClose.emit()
       
        }
        else
        this.onClose.emit();

      },
      error: (wellError) => {
        this.spinner.hide();
        this.onClose.emit();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: wellError });
        
      }
    });
 
}

}
