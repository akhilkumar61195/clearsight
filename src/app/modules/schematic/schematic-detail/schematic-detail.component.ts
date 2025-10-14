import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { LookupsService } from '../../../services/lookups.service';
import { AuthService } from '../../../services/auth.service';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { AccessControls, schematicDetailsDataChangeLogTable } from '../../../common/constant';
import { Subscription } from 'rxjs';
import { CommonService } from '../../../services/common.service';
import { DocumentEntityTypes } from '../../../common/enum/document-entity-types';
import { WellFeatures } from '../../../common/model/wellfeatures';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { AssemblyBuilderComponent } from '../assembly-builder/assembly-builder.component';
import { MasterTableComponent } from '../master-table/master-table.component';
import { WellFeaturesDialogComponent } from '../well-features-dialog/well-features-dialog.component';
import { PerforationsTableDialogComponent } from '../perforations-table-dialog/perforations-table-dialog.component';
import { CloneSchematicDialogComponent } from '../clone-schematic-dialog/clone-schematic-dialog.component';
import { ExcelUploadComponent } from '../../common/excel-upload-dialog/excel-upload-dialog.component';
import { ConfirmationDialogComponent } from '../../common/confirmation-dialog/confirmation-dialog.component';
import { FileUploadWithButtonComponent } from '../../common/file-upload-interactive-dialog/file-upload-interactive-dialog.component';
import { ExportToOdinDialogComponent } from '../export-to-odin-dialog/export-to-odin-dialog.component';
import { RejectSchematicComponent } from '../../common/rejection-dialog/rejection-dialog.component';
import { FileStatusDialogComponent } from '../../common/file-log-dialog/file-log-dialog.component';
import { ChangeLogComponent } from '../../common/dialog/change-log.component';
@Component({
  selector: 'app-schematic-detail',
  standalone: true,
  imports: [...PRIME_IMPORTS,
    AssemblyBuilderComponent,
    MasterTableComponent,
    WellFeaturesDialogComponent,
    PerforationsTableDialogComponent,
    CloneSchematicDialogComponent,
    FileUploadWithButtonComponent,
    ConfirmationDialogComponent,
    ExportToOdinDialogComponent,
    RejectSchematicComponent,
    FileStatusDialogComponent,
    ChangeLogComponent
  ],
  templateUrl: './schematic-detail.component.html',
  styleUrl: './schematic-detail.component.scss'
})
export class SchematicDetailComponent implements OnInit, OnDestroy {

  schematicId: number;
  schematic: Completionschematicheader;
  userDetail: any;
  userPersona: any;
  // Array of sections to populate the dropdown options
  masterTableFilterData: { id: number, name: string }[] = [];
  // The model for the selected section
  selectedmasterTableFilter: number | null = null;
  selectedCategory: number = 1;
  selectedView: number = 1;
  selectedDocumentView: number;
  displayWellFeaturesDialog: boolean = false;
  displayPerforationTableDialog: boolean = false;
  displayCloneSchematicDialog: boolean = false;
  openChangeLog: boolean = false;
  displayExportToOdinDialog: boolean = false;
  IsApprovedRequest: boolean = true;
  wellDocumentTypes: any;
  selectedDocument: string;
  entityId: number;
  entityType: string;
  schematicDetailId: number;
  selectView = '1';
  viewOptions = [{ label: 'Master Table', value: 1 },
  { label: 'Assembly Builder', value: 2 }];
  viewData: { sectionID: number, itemNumber: number, zoneID: number };
  breadcrumbs: string[];
  wellFeatures: WellFeatures[] = [];

  receivedView: any = 1;
  displayfileUploadInteractiveDialog: boolean = false;
  displayConfirmationComponentDialog: boolean = false;
  appId: number = 4;
  functionId: number = 2; displayConfirmationZoneEnableDialog: boolean = false;
  displayConfirmationZoneDisableDialog: boolean = false;

  displayRejectSchematicDialog: boolean = false;
  previousView: number | null = null;
  currentView: number = this.selectedView;
  CopyZone: boolean = true;
  isPerforationsEnabled: boolean = false;
  private viewSubscription: Subscription;
  selectedEntity: any;
  refreshPerforationTable = false;
  displayBatchStatusDialog: boolean = false; // variable declartion to show/hide view status
  isWellFeaturesEditable: boolean = false; // variable to check if well details are editable
  isClampAndControlEditable: boolean = false; // variable to check if clamp and control line is editable
  private schematicSubscription: Subscription = new Subscription();
  constructor(private route: ActivatedRoute,
    private completionSchematicService: CompletionschematicService,
    private authService: AuthService,
    private messageService: MessageService,
    private lookupService: LookupsService,
    private commonService: CommonService,) {


  }

  ngOnInit(): void {

    this.getUserDetails();
    this.route.paramMap.subscribe(params => {
      this.schematicId = +params.get('id');
      this.schematicDetailId = this.schematicId;
    });

    this.fetchSchematicData();

    this.masterTableFilterData = [
      { id: 1, name: 'Assembly Builder' },
      { id: 2, name: 'Master Table' },
      { id: 3, name: 'Perforation Table' },
      { id: 4, name: 'Depth Table' }
    ];
    this.viewSubscription = this.completionSchematicService.view$.subscribe(data => {
      this.receivedView = data;
      this.selectedView = this.receivedView;
    });

    if (this.receivedView == undefined) {
      this.selectedView = 1;
    }
  }
  ngOnDestroy() {
    this.schematicSubscription.unsubscribe();
    this.viewSubscription.unsubscribe();
  }

  /**
       *  it will get the user details from jwt token
       */
  getUserDetails() {

    let userAccess = this.authService.isAuthorized(AccessControls.SCHEMATIC_WELL_FEATURES);
    this.commonService.setuserAccess(userAccess);
    // Checking the user access for editability
    this.isWellFeaturesEditable = this.authService.isFieldEditable('isEditWellFeatures');
    this.userDetail = this.authService.isAuthorized(AccessControls.PUB_APR);

  }

  showWellFeaturesDialog() {
    this.displayWellFeaturesDialog = true;
  }
  closeWellFeaturesDialog() {
    this.displayWellFeaturesDialog = false;
  }

  saveWellFeaturesDialog() {
    this.displayWellFeaturesDialog = false;
    this.refreshPerforationTable = true;

    // Reset the trigger so it can be triggered again in the future
    setTimeout(() => this.refreshPerforationTable = false, 100);
    this.reloadAssemblyBuilder();
    this.reloadMasterTable();
  }

  reloadAssemblyBuilder() {
    // Logic to reload or refresh assembly builder
    if (this.selectedView === 2) {
      // Trigger change detection or fetch updated data
      this.viewData = { ...this.viewData };
    }
  }

  reloadMasterTable() {
    // Logic to reload or refresh master table
    if (this.selectedView === 1) {
      // Trigger a data fetch or update input bindings
      this.viewData = { ...this.viewData };
    }
  }

  showPerforationTableDialog() {
    this.displayPerforationTableDialog = true;
  }
  closePerforationTableDialog() {
    this.displayPerforationTableDialog = false;
  }
  showCloneSchematicDialog() {
    this.displayCloneSchematicDialog = true;
  }
  closeCloneSchematicDialog() {
    this.displayCloneSchematicDialog = false;
  }
  fetchSchematicData(): void {
    this.schematicSubscription = this.completionSchematicService.getSchematicHeaderById(this.schematicId).subscribe(
      {
        next: (response) => {
          // console.log('Schematic data response:', response);
          if (response && response.schematicsName) {

            this.schematic = response;
          }
        },
        error: (error) => {
          console.error('Error fetching schematic data', error);
        }
      }

    );
  }

  onViewSelectionChange(event: any) {
    if (this.commonService.hasUnsavedChangesSchemantic()) {
      this.displayConfirmationComponentDialog = true;

      // Revert the view immediately to the previous value
      setTimeout(() => {
        this.selectedView = this.currentView;

      });

      return;
    }

    // If no unsaved changes, allow the change and update currentView
    this.currentView = event.value;
    this.selectedView = event.value;
  }


  // onViewSelectionChange(event: any) {
  //   // console.log('Selected View:', event.value);
  //   // if (this.commonService.hasUnsavedChangesSchemantic()) {
  //   //   this.previousView = this.selectedView;
  //   //   console.log(this.previousView);
  //   //   this.displayConfirmationComponentDialog= true;
  //   // } else {
  //   //   this.displayConfirmationComponentDialog= false;
  //   // }
  //   if (this.commonService.hasUnsavedChangesSchemantic()) {
  //     this.displayConfirmationComponentDialog = true;
  //     setTimeout(() => {
  //         this.selectedView = this.selectedView;
  //         console.log(this.selectView);

  //     });
  //     return;
  // }

  // this.selectedView = event.value;
  // }

  onViewChanged(data: { sectionID: number, itemNumber: number, zoneID: number }) {
    this.selectedView = 1;
    this.viewData = data;
    // console.log('recieved', data);
  }
  changeLog() {
    this.openChangeLog = true;
  }
  onCancel() {
    this.displayConfirmationComponentDialog = false;
    this.commonService.cancelClicked();

    //   if (this.previousView !== null) {
    //     this.selectedView = this.previousView;
    // }
    // this.selectedView=2;
  }
  changeView() {
    this.displayConfirmationComponentDialog = false;
    this.commonService.editedRowsSchemanticData = '';
    this.commonService.addedRowsSchemanticData = '';
    this.selectedView = 1;
  }


  closeRejectDilaog(statusId: number) {

    if (statusId)
      this.schematic.statusId = statusId;

    this.displayRejectSchematicDialog = false;
  }

  onZoneCountChanged(isEnabled: boolean) {
    this.isPerforationsEnabled = isEnabled;
  }


  closeExportToOdinDialog() {

    this.displayExportToOdinDialog = false;
  }
  onClose() {
    this.selectedDocument = "";
    this.selectedDocumentView = 0;
    this.entityId = 0;
    this.entityType = ""
    this.displayfileUploadInteractiveDialog = false;

  }
  showControlLineDialog() {
    this.getWellDocumentTypes(DocumentEntityTypes.CONTROL_LINE);
    // this.isClampAndControlEditable = this.authService.isFieldEditable('isClampAndControlEditable');
  }
  getWellDocumentTypes(entityType: any) {


    this.schematicSubscription = this.lookupService
      .getDocumentTypes(entityType)
      .subscribe({
        next: (resp: any) => {
          if (resp) {

            this.displayfileUploadInteractiveDialog = true;
            this.wellDocumentTypes = resp;
            this.selectedDocumentView = this.wellDocumentTypes[0].id;
            this.entityId = this.schematicDetailId; // passed selected schematic id in upload model
            this.selectedDocument = this.wellDocumentTypes.find(x => x.id === this.selectedDocumentView)?.name;
            this.displayfileUploadInteractiveDialog = true; //opening control line once we will have api response it will minimize unnecassry api call at ngonint

          } else {
            this.wellDocumentTypes = [];
            this.displayfileUploadInteractiveDialog = false; // if there will be any no respone it will not open control line popup
          }
        },
        error: () => {
          this.wellDocumentTypes = [];
          this.displayfileUploadInteractiveDialog = false; // if there will be any error it will not open control line popup
        },
      });
  }
  // show/hide view status
  viewStatus() {
    this.displayBatchStatusDialog = true;

  }
}