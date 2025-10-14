import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AccessControls, bulkUploadOdinDrilling, inventoryBulkUploadTemplate, inventoryScreen, mitiBulkUploadTemplate, mitiScreen, rawDataBulkUploadTemplate, vallorecDataBulkUploadTemplate } from '../../../../common/constant';
import { RawDataVisualizations, routeLinks } from '../../../../common/enum/common-enum';
import { DocumentEntityTypes } from '../../../../common/enum/document-entity-types';
import { AdvanceFilterModel } from '../../../../common/model/AdvanceFilterModel';
import { IOdinFilterPayloadStore, OdinAdvanceFilterAction, OdinAdvanceFilterActionType, READ_ODIN_ADVANCE_FILTER_ACTION_TYPE } from '../../../../common/ngrx-store';
import { AuthService } from '../../../../services/auth.service';
import { BulkuploadService } from '../../../../services/bulkupload.service';
import { CommonService } from '../../../../services/common.service';
import { ExcelColumnMapService } from '../../../../services/excel-column-service/excel-column.service';
import { LookupsService } from '../../../../services/lookups.service';
import { SearchFilterService } from '../../../../services/search-filter.service';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { CustomDialogComponent } from '../../../common/custom-dialog/custom-dialog.component';
import { ExcelUploadComponent } from '../../../common/excel-upload-dialog/excel-upload-dialog.component';
import { FileStatusDialogComponent } from '../../../common/file-log-dialog/file-log-dialog.component';
import { ChangeLogComponent } from '../../../common/dialog/change-log.component';


@Component({
  selector: 'app-odin-completion-ddl',
  standalone:true,
  imports:[...PRIME_IMPORTS, CustomDialogComponent,
    ExcelUploadComponent,
   FileStatusDialogComponent,ChangeLogComponent],
  templateUrl: './odin-completion-ddl.component.html',
  styleUrl: './odin-completion-ddl.component.scss'
})
export class OdinCompletionDdlComponent implements OnDestroy {

  visualizations = RawDataVisualizations;
  //selectedVisualization: RawDataVisualizations;
  displayControlLineAndClampDialog: boolean = false;
  textValue: string = '';
  selectedOption: string = '';
  isShowingSelectedButton: boolean = true; // it will show selected button view in upload dialog
  openChangeLog: boolean = false;// using this we can show/hide change log popup
  @Output() valuesChanged = new EventEmitter<{ text: string, option: string }>();
  @Input() selectedFunction: number; // 1 for drilling and 2 for completion
  displayBulkUploadInteractiveDialog: boolean = false; // this flag will show/hide custom bulk upload
  wellDocumentTypes: any;
  selectedDocumentView: number; // it will show default view id
  selectedDocument: string; // it will pass default document name
  isShowDescription: boolean = false;  //if app-excel dialog will not use inside the custom dialog in this case it will be true.
  schematicId: number = 0; // it will be zero if custom model not used in schematics screen
  bulkUploadScreen = bulkUploadOdinDrilling; // it will use for excel generic things
  userDetail = {
    uid: 0
  };  // declare user details object to get logged in user detail
  isDialogClose:boolean=false; // it will detect close button and will remove file from upload components
  viewOptionsButtons = [
    { label: 'Drilling', value: 1 },
    { label: 'Completion', value: 2 }
  ];
  downloadTemplate: string = vallorecDataBulkUploadTemplate; //dynamic template url and by default vallorec 
  keyMap: Record<string, string>;
  selectedTabView: string = mitiScreen; // by default vallorec selected in custome component
  displayBatchStatusDialog: boolean = false; // variable declartion to show/hide view status
  expectedExcelHeader: string[] = []; // dynamic excel header's
  isBulkUploadEditable:boolean = false; // it will be used to check if user has access to edit bulk upload

  // Adding Subscription to unsubscribe when component is destroyed
  private odinCompletionDdlSubscription: Subscription = new Subscription();

  constructor(private searchService: SearchFilterService, private lookupService: LookupsService,
    private messageService: MessageService,
    private authService: AuthService,
    private spinner: NgxSpinnerService,
    private bulkUploadService: BulkuploadService,
    private excelColumnMapService: ExcelColumnMapService,
    private commonService: CommonService,
    private odinStore: Store<{ odinAdvanceFilterData: IOdinFilterPayloadStore }>,
    private router: Router) {
  }

  // Destroy subscription to avoid memory leaks
  ngOnDestroy(): void {
    this.odinCompletionDdlSubscription?.unsubscribe();
  }
  ngOnInit(): void {
    this.getUserDetails();
    const storedValue = this.selectedOption;
    this.selectedOption = storedValue ? (storedValue as RawDataVisualizations) : RawDataVisualizations.Miti;
    this.userDetail = this.authService.getUserDetail();
    this.onSelectChange();
  }

  /**
       *  it will get the user details from jwt token
       */
   getUserDetails(){
           let userAccess= this.authService.isAuthorized(AccessControls.RAW_DATA_COMPLETION_UPLOAD);
           this.commonService.setuserAccess(userAccess);
           this.isBulkUploadEditable = this.authService.isFieldEditable('isCompletionUpload');
    }
    
  onTextChange() {
    this.searchService.updateFilter(this.textValue, this.selectedOption);
  }

  onSelectChange() {
    this.valuesChanged.emit({ text: this.textValue, option: this.selectedOption });
  }

  reset() {
    this.textValue = '';
    this.valuesChanged.emit({ text: this.textValue, option: this.selectedOption });
  }

  /**
   *  on click of raw data upload this method will hit
   */

  showBulkUplodModel() {
    this.isDialogClose=false;
    this.getUserDetails();
    this.getWellDocumentTypes(DocumentEntityTypes.RAW_DATA_COMPLETION)
  }

  /**
   * method will get the document type 
   * @param entityType  
   */
  getWellDocumentTypes(entityType: any) {

    this.odinCompletionDdlSubscription = this.lookupService
      .getDocumentTypes(entityType)
      .subscribe({
        next: (resp: any) => {
          if (resp) {

           
            this.wellDocumentTypes = resp;
            this.selectedDocumentView = this.wellDocumentTypes[0].id;
            
            this.selectedDocument = this.wellDocumentTypes.find(x => x.id === this.selectedDocumentView)?.name;
            this.keyMap = this.excelColumnMapService.MitiDataKeyMap; // called miti key map as default
            this.expectedExcelHeader = this.excelColumnMapService.mitiHeaders; // called miti header as default
            this.bulkUploadScreen = mitiScreen;
            this.downloadTemplate = mitiBulkUploadTemplate;
            this.displayBulkUploadInteractiveDialog = true; //opening control line once we will have api response it will minimize unnecassry api call at ngonint
          
          } else {
            this.wellDocumentTypes = [];
            this.displayBulkUploadInteractiveDialog = false; // if there will be any no respone it will not open control line popup
          }
        },
        error: () => {
          this.wellDocumentTypes = [];
          this.displayBulkUploadInteractiveDialog = false; // if there will be any error it will not open control line popup
        },
      });
  }
  /**
   * closing raw data bulk upload model also clearing selected value
   */
  closeRawDataModel() {
    this.isDialogClose=true;
    this.displayBulkUploadInteractiveDialog = false;
    this.selectedDocumentView = 0;
    this.selectedDocument = '';
    this.selectedTabView= mitiScreen; //default view
    this.downloadTemplate=mitiBulkUploadTemplate ; // default template
  }

  /**
   * to get selcted view in tab 
   */

  handleSelectedView(evnt: string) {
    this.selectedTabView = evnt;

    switch (evnt) {
      case mitiScreen:
        this.downloadTemplate = mitiBulkUploadTemplate;
        this.keyMap = this.excelColumnMapService.MitiDataKeyMap;
        this.expectedExcelHeader = this.excelColumnMapService.mitiHeaders;
        this.bulkUploadScreen = mitiScreen;
        break;
       case inventoryScreen:
        this.downloadTemplate=inventoryBulkUploadTemplate;
        this.keyMap=this.excelColumnMapService.inventoryDataKeyMap;
        this.expectedExcelHeader=this.excelColumnMapService.inventoryHeader;
        this.bulkUploadScreen=inventoryScreen;
        break;

      default:
        this.downloadTemplate = rawDataBulkUploadTemplate;
        break;
    }

  }
  /**
   *  validating excel headerss
   * @param data 
   * @returns 
   */
  customValidate = (data: any[]): string[] => {
    const validationErrors: string[] = [];

    if (!data || data.length === 0) {
      validationErrors.push('The uploaded file is empty. Please upload a valid file with data.');
    }

    

    if (validationErrors.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Errors',
        detail: validationErrors.join('\n'),
        life: 10000,
      });
    }

    return validationErrors;
  };


  /**
  * Handles the upload event triggered by the custom Excel upload dialog.
  * Constructs the request payload with the uploaded file, parsed data, and user ID,
  * and sends it to the API for processing.
  * Displays success or error messages based on the API response and refreshes the table.
  * 
  * @param event The event object containing the uploaded file and parsed data.
  */


handleUpload(event: { file: File; data: any[] }) {
  const file = event.file;
  const data = event.data;
  const userId = this.userDetail.uid;

  this.spinner.show();
  this.messageService.add({ severity: 'success', summary: 'Upload Complete', detail: 'Upload is being processed. It may take few minutes to upload' }); //it for lare data set
  this.spinner.hide();
  this.displayBulkUploadInteractiveDialog=false;
  this.odinCompletionDdlSubscription = this.bulkUploadService.bulkUpload(file, data, userId, this.selectedTabView).subscribe({
    next: (res) => {
      this.spinner.hide();
      this.closeRawDataModel();
      this.bulkUploadService.refreshInventoryData().subscribe();
    },
    error: (err) => {
      
      this.spinner.hide();
      this.closeRawDataModel();
      const errorMessage = err?.error || err?.error || 'Upload failed.';
      this.messageService.add({ severity: 'error', summary: 'Upload Failed', detail:errorMessage });
    }
  });
}




  onViewSelectionChange() {
    const advanceFilter = new AdvanceFilterModel();
    advanceFilter.projects = [];
    advanceFilter.functions = this.selectedFunction;
    advanceFilter.timeline = "";
    advanceFilter.wells = [];
    let reducerObject: any;
    reducerObject = new OdinAdvanceFilterAction(null);
    reducerObject.payload = JSON.parse(JSON.stringify(advanceFilter));
    reducerObject.type = READ_ODIN_ADVANCE_FILTER_ACTION_TYPE as OdinAdvanceFilterActionType;
    reducerObject.payload['reset'] = true
    this.odinStore.dispatch(reducerObject);
    if (this.selectedFunction == 1) {
      this.router.navigate([routeLinks.odinRawdata3]);
    }
    if (this.selectedFunction == 2) {
      this.router.navigate([routeLinks.odinCompletionRawdata3]);
    }
  }

    /**
   * 
   * @param evt error message
   */
  errorMessage(evt :string){
  this.messageService.add({ severity: 'error', summary: 'Upload failed', detail: evt });
  }
}