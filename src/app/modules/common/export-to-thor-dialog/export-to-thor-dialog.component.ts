import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AuthService } from '../../../services';
import { MessageService } from 'primeng/api';
import { CommonService } from '../../../services/common.service';
import { OdinV2Service } from '../../../services/odinv2.service';
import { PublishWellRequest } from '../../../common/model/publish-well-request';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { WellApplications } from '../../../common/model/well-applications';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-export-to-thor-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './export-to-thor-dialog.component.html',
  styleUrl: './export-to-thor-dialog.component.scss'
})
export class ExportToThorDialogComponent implements OnInit, OnChanges {
  @Output() onClose = new EventEmitter<void>();
  @Output() publishCompleted: EventEmitter<void> = new EventEmitter<void>();
  @Input() displayExportToThorDialog: boolean = false;
  @Input() functionId: number;
  @Input() odinName: string;
  @Input() odin: any;
  userDetail: any;
  odinData: any;
  wellId:number;
  projectId:number;
  wellName: PublishWellRequest;
  completionSchematic: Completionschematicheader;
  wellApplications: WellApplications;
  displayWellNotPublish:boolean=false;
  constructor(private odinV2Service: OdinV2Service,
    private authService: AuthService,
    private messageService: MessageService,
    private commonService: CommonService,
    private completionSchematicService: CompletionschematicService
  ) {
    this.userDetail = this.authService.getUserDetail();
  }

  ngOnInit(): void {
    if (this.functionId === 2) {
      // console.log('This is a completion scenario.');
    } else {
      // console.log('This is a drilling scenario.');
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    const wellData = this.commonService.getWellHeadersData()
    // console.log('Changes detected:', changes.odin.currentValue);
    // this.odinData=changes.odin.currentValue;
    this.wellId=wellData?.id;
    this.wellName=wellData?.wellName;
    this.projectId=wellData?.projectId
  }


  closeExportToOdin() {
    this.onClose.emit();
  }

  importDepthTableDialog() {

  }

  createWellApplications(appId: number, wellId: number) {

    this.wellApplications = {
      id: 0,
      appId: appId,
      userId: Number(this.userDetail.uid),
      wellId: this.wellId,
    }

    this.completionSchematicService.createWellApplications(this.wellApplications).subscribe({
      next: (res) => { 
        //this.messageService.add({
         // severity: 'success',
         // summary: 'Success',
          // detail: data
        //  detail: `${this.wellName} Records Published To  Thor Successfully`
      //  });
       },
      error: (error) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: error }); }
    });

  }

  exportToThor() {
    
    if (this.functionId === 2) {
      this.createWellApplications(2, this.wellId);
    }

    const request:PublishWellRequest={
       wellId: this.wellId,
       userId : Number(this.userDetail.uid),
       projectId:this.projectId
    }
    this.publishOdinToThor(this.functionId,request);
    this.onClose.emit();

  }
  publishOdinToThor(functionId:number,payload:any){
    if(functionId===2){
      this.odinV2Service.publishOdinCompletionToThor(payload).subscribe({
        next: (data) => {
         
         if(data==2){
          this.displayWellNotPublish=!this.displayWellNotPublish;
         }
         else{
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            // detail: data
            detail: `${this.wellName} Records Published To  Thor Successfully`
          });
          this.publishCompleted.emit();
         }

        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `An error occurred: ${error.message || error}`
          });
          //console.error('Error upserting well', error);
        }
      });
    }
    else{
      this.odinV2Service.publishOdinToThor(payload).subscribe({
        next: (data) => {
          if(data==2){
            this.displayWellNotPublish=!this.displayWellNotPublish;
           }
           else{
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              // detail: data
              detail: `${this.wellName} Records Published To  Thor Successfully`
            });
            this.publishCompleted.emit();
           }

        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `An error occurred: ${error.message || error}`
          });
          //console.error('Error upserting well', error);
        }
      });
    }
  }
}
