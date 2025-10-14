import { Component, OnDestroy, OnInit, SimpleChanges, ViewChild, WritableSignal, effect, untracked } from '@angular/core';
import { ColDef, GridApi, SideBarDef } from 'ag-grid-community';
import { MdlDataService } from '../../../../services/mdl-data.service';
import { masterdatalibraryModel } from '../../../../common/model/masterdatalibraryModel';
import { AuthService } from '../../../../services/auth.service';
import { AccessControls, FilterValues, masterDataChangeLogTable } from '../../../../common/constant';
import { CustomUploadButton } from '../../../thorv2/customUploadButton.component';
import { DocumentEntityTypes } from '../../../../common/enum/document-entity-types';
import { LookupsService } from '../../../../services/lookups.service';
import { MdlCompletionBuilderService } from './builder/mdl-completion-builder.service';
import { GridStatePersistenceService } from '../../../../common/builder/persistant-builder.service';
import { CustomerPersonalizationService } from '../../../../services/customer-personalization.service';
import { Observable } from 'rxjs';
import { ResponsiveService } from '../../../../services/responsive.service';
import { CommonService } from '../../../../services/common.service';
import { AuthorizedResult } from '../../../../common/accessType';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { MdlFileUploadComponent } from '../../../common/mdl-file-upload/mdl-file-upload.component';
import { MdlChangeLogComponent } from '../../mdl-change-log/mdl-change-log.component';
import { AddRecordDialogComponent } from '../../add-record-dialog/add-record-dialog.component';
import { FileStatusDialogComponent } from '../../../common/file-log-dialog/file-log-dialog.component';
import { ChangeLogComponent } from '../../../common/dialog/change-log.component';
import { FileUploadWithButtonComponent } from '../../../common/file-upload-interactive-dialog/file-upload-interactive-dialog.component';
import { MdlListEditorComponent } from '../../mdl-list-editor/mdl-list-editor.component';
import { ListEditorBuilderService } from '../../../common/builders/list-editor-builder.service';
import { ListEditorComponent } from '../../../common/list-editor/list-editor.component';

@Component({
  selector: 'app-mdl-completion',
  standalone: true,
  imports: [...PRIME_IMPORTS,MdlFileUploadComponent,
    MdlChangeLogComponent,
    AddRecordDialogComponent,
    FileStatusDialogComponent,
    ChangeLogComponent,
    ListEditorComponent,
  ],
  templateUrl: './mdl-completion.component.html',
  styleUrl: './mdl-completion.component.scss'
})

/** MDL Completion Component */
export class MdlCompletionComponent implements OnInit, OnDestroy {
  //records: Array<masterdatalibraryModel> = [];
  records: WritableSignal<Array<masterdatalibraryModel>> = this.mdlCompletionBuilderService.mdlRecords; // Signal to hold MDL records
  supplierIds: number[] = []; // Array to hold supplier IDs
  //filteredMaterials: Array<masterdatalibraryModel> = [];  loading: boolean = false;
  totalRecords: number = 0; // Initialize to 0
  rows: number = 500;
  sortField: string;
  sortOrder: number = 1;
  totalPages: number = 0;
  pages: number[] = []; // Array to hold the page numbers
  selectedRecord: masterdatalibraryModel = new masterdatalibraryModel(); // This holds the record being edited
  dialogTitle: any;
  globalFilter: string = '';
  displayAddRecordDialog: boolean = false;
  isEdit: boolean = false;
  displayEditRecordDialog: boolean = false;
  displayUploadDialog: boolean = false;
  permissionToEditRecord: boolean = false
  selectedView: number;
  functionId: number = 2;
  appId :number=3;
  showChangeLogDialog: boolean = false;
  supplierName: any;
  userDetail: any;
  openChangeLog: boolean = false;
  entityName: string = masterDataChangeLogTable;
  pageNumber: number = 0;
  pageSize: number = 500;
  private mdlGridAPI!: GridApi;
  isPageView :boolean=true;
  showEquipmentAddDialog: boolean = false;
  displayfileUploadInteractiveDialog: boolean=false;
  wellDocumentTypes: any;
  entityType: string;
  entityId: number;
  mdlRecord: any;
   hasRestoredPersonalization = false;
  private gridApi!: GridApi;
  selectedDocument: string;
  displayViewStatusDialog:boolean =false ;// show/hide global view status dialog
  readonly stateKey = 'MDL - Completion';
  height$: Observable<string>;
  isEditableField: boolean = false; // To get the user access for editability
  isRecordEditable: boolean = false; // To get the user access for editability
  isListEditable: boolean = false; // To get the user access for editability
  userAccess:AuthorizedResult[]=[]; // user access will saved globally
  // Defines the configuration for ag-Grid's sidebar
  public sideBar: SideBarDef | string | string[] | boolean | null = {
    toolPanels: [
      {
        id: "columns",
        labelDefault: "Columns",
        labelKey: "columns",
        iconKey: "columns",
        toolPanel: "agColumnsToolPanel",
        toolPanelParams: {
          suppressRowGroups: true,
          suppressValues: true,
          suppressPivots: true,
          suppressPivotMode: true,
          suppressColumnFilter: true,
          suppressColumnSelectAll: false,
          suppressColumnExpandAll: true,
        },
      },
    ],
  };

  // Column definitions for the ag-Grid
  columnDefs = [
    { headerName: 'Component Type', field: 'componentTypeName', sortable: true, filter: true, minWidth:180 },
    { headerName: 'Group', field: 'groupName', sortable: true, filter: true, minWidth: 120 },
    { headerName: 'Material Group', field: 'materialGroup', sortable: true, filter: true, minWidth: 160 },
    { headerName: 'Project Tag', field: 'projectTags', sortable: true, filter: true, minWidth: 150 },
    { headerName: 'Description', field: 'materialDescription', sortable: true, filter: true, minWidth: 360 },
    { headerName: 'Supplier', field: 'organizationName', sortable: true, filter: true , minWidth: 130},
    { headerName: 'Manufacturer', field: 'manufacturerDetails', sortable: true, filter: true, minWidth: 160 },
    { headerName: 'Trade Name', field: 'tradeName', sortable: true, filter: true, minWidth: 150 },
    {
      headerName: 'MM# / MMR#',
      field: 'materialNumber',
      sortable: true,
      filter: true, minWidth: 180
    },
    { headerName: 'UoM (FT or EA)', field: 'uom', sortable: true, filter: true, minWidth: 170 }, // <--- New column Unit Of Measurement
    { headerName: 'Manufacturer SAP #', field: 'vendorSapnumber', sortable: true, filter: true, minWidth: 170 }, // <--- New column Vendor SAP #
    { headerName: 'Supplier Part #', field: 'supplierPartNumber', sortable: true, filter: true, minWidth: 170 },
    { headerName: 'Legacy Reference #', field: 'legacyRefNumber', sortable: true, filter: true, minWidth: 160 },
    {
      headerName: 'Nominal/Max OD (IN)',
      field: 'nominalOD1',
      sortable: true,
      filter: true, minWidth: 210,
      valueGetter: (params: any) => `${params.data.nominalOd1 || ''} ${params.data.nominalOd2 ? 'x ' + params.data.nominalOd2 : ''} ${params.data.nominalOd3 ? 'x ' + params.data.nominalOd3 : ''}`
    },  
    {
      headerName: 'Actual OD (IN)',
      field: 'actualOD1',
      sortable: true,
      filter: true, minWidth: 170,
      valueGetter: (params: any) => `${params.data.actualOd1 || ''} ${params.data.actualOd2 ? 'x ' + params.data.actualOd2 : ''} ${params.data.actualOd3 ? 'x ' + params.data.actualOd3 : ''}`
    },
    {
      headerName: 'Actual ID (IN)',
      field: 'actualID1',
      sortable: true,
      filter: true, minWidth: 170,
      valueGetter: (params: any) => `${params.data.actualId1 || ''} ${params.data.actualId2 ? 'x ' + params.data.actualId2 : ''} ${params.data.actualId3 ? 'x ' + params.data.actualId3 : ''}`
    },
    { headerName: 'Drift (IN)', field: 'drift', sortable: true, filter: true ,minWidth: 140,},
    {
      headerName: 'Weight (LB)',
      field: 'weight1',
      sortable: true,
      filter: true, minWidth: 150,
      valueGetter: (params: any) => `${params.data.weight1 || ''} ${params.data.weight2 ? 'x ' + params.data.weight2 : ''} ${params.data.weight3 ? 'x ' + params.data.weight3 : ''}`
    },
    { headerName: 'Wall Thickness (IN)', field: 'wallThickness', sortable: true, filter: true, minWidth: 210},
    {
      headerName: 'Material Grade',
      field: 'materialGradeID1',
      sortable: true,
      filter: true, minWidth: 170,
      valueGetter: (params: any) => `${params.data.materialGradePrimary || ''} ${params.data.materialGradeSecondary ? 'x ' + params.data.materialGradeSecondary : ''} ${params.data.materialGradeTertiary ? 'x ' + params.data.materialGradeTertiary : ''}`
    },
    { headerName: 'Range', field: 'rangeName', sortable: true, filter: true, minWidth: 120 },
    { headerName: 'Min Yield Strength (PSI)', field: 'yeildStrength', sortable: true, filter: true, minWidth: 230 },
    { headerName: 'Burst Pressure (PSI)', field: 'burstPressure', sortable: true, filter: true, minWidth: 200 },
    { headerName: 'Collapse Pressure (PSI)', field: 'collapsePressure', sortable: true, filter: true, minWidth: 240 },
    { headerName: 'Max Pressure Rating (PSI)', field: 'maxPressureRating', sortable: true, filter: true, minWidth: 240 },
    { headerName: 'Axial Strength (PSI)', field: 'axialStrength', sortable: true, filter: true, minWidth: 180 },
    { headerName: 'Differential Pressure Rating (PSI)', field: 'diffPressureRating', sortable: true, filter: true, minWidth: 280 },
    { headerName: 'Max Temperature Rating (F)', field: 'maxTempRating', sortable: true, filter: true, minWidth: 250 },
    { headerName: 'Quality Plan Designation', field: 'qualityPlanDesignation', sortable: true, filter: true, minWidth: 230 },
    { headerName: 'Connection Configuration', field: 'connectionConfigName', sortable: true, filter: true, minWidth: 240 },
    { headerName: 'Connection Type', field: 'connectionTypeName', sortable: true, filter: true, minWidth: 240 },
    { headerName: 'Top Connection', field: 'topConnection', sortable: true, filter: true, minWidth: 180 },
    { headerName: 'Middle Connection', field: 'middleConnection', sortable: true, filter: true, minWidth: 200 },
    { headerName: 'Bottom Connection', field: 'bottomConnection', sortable: true, filter: true, minWidth: 200 },
    { headerName: 'Connection Burst Pressure (PSI)', field: 'connectionBurstPressure', sortable: true, filter: true, minWidth: 270 },
    { headerName: 'Connection Collapse Pressure (PSI)', field: 'connectionCollapsePressure', sortable: true, filter: true, minWidth: 290 },
    { headerName: 'Connection Yield Strength (PSI)', field: 'connectionYeildStrength', sortable: true, filter: true, minWidth: 280 },
    { headerName: 'Makeup-Loss (IN)', field: 'makeupLoss', sortable: true, filter: true, minWidth: 190 },
    { headerName: 'RBW', field: 'rbw', sortable: true, filter: true, minWidth: 90 },
    { headerName: 'Min Temperature Rating (F) - Elastomers', field: 'elastomersMinTempRating', sortable: true, filter: true, minWidth: 330 },
    { headerName: 'Max Temperature Rating (F) - Elastomers', field: 'elastomersMaxTempRating', sortable: true, filter: true, minWidth: 330 },
    { headerName: 'Elastomer Type', field: 'elastomerTypeID', sortable: true, filter: true, minWidth: 180 }, 
    { headerName: 'Elastomer Notes', field: 'elastomerNotes', sortable: true, filter: true, minWidth: 180 },
    { headerName: 'Standard Notes (Specs, Ratings, Configurations, Design Elements)', field: 'standardNotes', sortable: true, filter: true, minWidth: 490 },
    {
      headerName: 'Spec Sheet',
      cellRenderer: CustomUploadButton,
      minWidth: 160,
      sortable: true,
      cellRendererParams: {
        onClick: (data: any) => {
          //this.openUploadDialogBox(this.othersData, data,DocumentEntityTypes.SPEC_SHEET);
        },
         additionalParam: 'SpecSheet'
      },
      suppressHeaderMenuButton: true
    },
    { headerName: 'Administrative Notes', field: 'administrativeNotes', sortable: true, filter: true, minWidth: 220 },
    { headerName: 'Threaded Connection?', field: 'isThreadedConnection', sortable: true, filter: true, minWidth: 220, 
      cellStyle: { 'text-align': 'center' },
      valueFormatter: (params: any) => {
        return params.value ? 'Yes' : 'No';
      },
    },
    { headerName: 'Contains Elastomer Elements?', field: 'isContainsElastomerElements', sortable: true, filter: true, minWidth: 260,
      cellStyle: { 'text-align': 'center' },
      valueFormatter: (params: any) => {
        return params.value ? 'Yes' : 'No';
      }, 
    }
  ];

  /** MDL Completion Component */
  constructor(private authService: AuthService,private lookupService: LookupsService, 
    private mdlCompletionBuilderService: MdlCompletionBuilderService,
    private gridStateService: GridStatePersistenceService,
    private responsiveService: ResponsiveService,
    private personalizationService: CustomerPersonalizationService,
    private editorBuilderService: ListEditorBuilderService,
    private commonService: CommonService) {
    // Watch for changes in the records signal and update totalRecords
    effect(() => {
      this.totalRecords = this.records().length;
    });
    this.userDetail = this.authService.getUserDetail();

   }  
  ngOnDestroy(): void {
    // Resetting the signal
    this.editorBuilderService.selectedFunctionId.set(-1);
  }
  
  /** Lifecycle hook that is called after data-bound properties are initialized. */
  ngOnInit() {
    this.supplierIds = this.userDetail["readAccessSuppliers"];
    // Setting default selection for drilling
    this.editorBuilderService.selectedFunctionId.set(2);
    this.getUserDetails();
    this.mdlCompletionBuilderService.loadMaterials(this.supplierIds,this.getPersonalization.bind(this));
    this.responsiveService.observeBreakpoints();
    this.height$ = this.responsiveService.getHeight$();
  }

    /**
     *  it will get the user details from jwt token
     */
    getUserDetails(){
      this.userAccess = this.authService.isAuthorized(AccessControls.MDL_ACCESS);
      this.commonService.setuserAccess(this.userAccess);
      
      // Checking the user access for editability
      this.isEditableField = this.authService.isFieldEditable('isUpload');  
      this.isRecordEditable = this.authService.isFieldEditable('isEditAddRecord');
      this.isListEditable = this.authService.isFieldEditable('IsAddDeleteListEditor');
    }

  /** Method to close the file upload dialog */
  onClose() {
    this.displayfileUploadInteractiveDialog = false;
  }

  /**Global Search */
  onSearch(event: Event): void {
    const searchedMaterials = (event.target as HTMLInputElement).value.toLowerCase();
    this.globalFilter = searchedMaterials; // Update the quick filter text
  }

  /** Method to reset the search filter */
  resetFilter(search) {
    this.globalFilter = '';
    search.value = ''; // Clear the input field visually
    if (this.mdlGridAPI) {
      this.mdlGridAPI.setFilterModel(null);
      this.mdlGridAPI.onFilterChanged();
      this.mdlGridAPI.deselectAll();
      // Reset total records to show all records when filters are cleared
      this.totalRecords = this.records().length;
    }
  }

  /** Method to open the dialog */
  showAddRecordDialog() {
    this.isEdit = false;
    this.displayAddRecordDialog = true;
  }

  /** Method to open the edit dialog */
  OpenEditDialog(record: any,event:any) {
    if(event.api.getFocusedCell().column.colDef.headerName=='Spec Sheet'){
      this.openUploadDialogBox(record,DocumentEntityTypes.SPEC_SHEET);
    }
    else{
      this.isEdit = true;
      this.commonService.setuserAccess(this.userAccess);
      const isSupplierExist = this.authService.checkFilterValue(FilterValues.SUPPLIER,FilterValues.ACCESS_SUPPLIER_VALUE);
      if (isSupplierExist) {  
      //if ((record.organizationId == undefined && this.userDetail["organizationID"] == 2) || this.userDetail["organizationID"] == record.organizationId) {      
          this.selectedRecord = { ...record };        
        setTimeout(() => {
          this.displayAddRecordDialog = true;
        }, 200);
        }
        else {
          this.permissionToEditRecord = true;
          this.supplierName = record["organizationName"];
      }
    }
  }


  /** Method to handle grid ready event */
  onGridReady(params: any) {
    this.mdlGridAPI= params.api;
    // Set initial total records count
    this.totalRecords = this.records().length;
    
    // Listen for filter changes to update total records
    this.mdlGridAPI.addEventListener('filterChanged', () => {
      // Update total records to show filtered count when filters are applied
      this.totalRecords = this.mdlGridAPI.getDisplayedRowCount();
    });
    this.gridStateService.initialize(params.api,this.userDetail.uid);
  }

  getPersonalization() {
    // Safely retrieve user ID; fallback to 0 if not available
    const userId = this.userDetail?.uid || 0;

    // Call the service to fetch the latest saved personalization for the user
    this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
      next: (res) => {
        // Parse the saved app state JSON string, if available
        const state = res?.result.appState ? JSON.parse(res.result.appState) : null;

        // Parse the context data (filters, etc.), handling both stringified and object formats
        const contextData = res?.result?.contextData;
        const context = typeof contextData === 'string' ? JSON.parse(contextData) : contextData;

        // Restore context filters (if applicable) — placeholder comment, actual filter logic may go here

        // Restore AG Grid state if it exists and grid API is available
        if (state && this.mdlGridAPI) {
          // Restore column state with order preservation
          if (state.columnState) {
            this.mdlGridAPI.applyColumnState({ state: state.columnState, applyOrder: true });
          }

          // Use a timeout to delay restoring filter and sort models until grid is ready
          setTimeout(() => {
            // Restore filter model
            if (state.filterModel) {
              this.mdlGridAPI.setFilterModel(state.filterModel);
            }

            // Restore sort model (ensure the API supports it)
            if (state.sortModel && (this.mdlGridAPI as any).setSortModel) {
              (this.mdlGridAPI as any).setSortModel(state.sortModel);
            }

            // Refresh grid header and redraw rows to reflect the restored state
            this.mdlGridAPI.refreshHeader();
            this.mdlGridAPI.redrawRows();
          }, 50);
        }

        // Mark that personalization has been restored to prevent repeated reapplication
        this.hasRestoredPersonalization = true;
      },
      // Handle error case — likely when no personalization exists or fetch fails
      error: (err) => {
        console.warn('No personalization found or failed to load.', err);
      },
    });
  }


  /** on Close add record dialog */
  closeAddRecordDialog( action: 'cancel' | 'save' ) {
    this.displayAddRecordDialog = false;
    if(action==='save')
    {
      this.mdlCompletionBuilderService.loadMaterials(this.supplierIds, '');
    }
  }

  /** on Close upload dialog */
  closeUploadDialog() {
    this.displayUploadDialog = false;
    this.mdlCompletionBuilderService.loadMaterials(this.supplierIds,'');
  }

  /** show upload dialog */
  showUploadDialog() {
    this.displayUploadDialog = true;
  }

  /** Method to open the change log */
  mdlChangeLog() {
    this.openChangeLog = true;
    //this.showEquipmentAddDialog=true;
  }

  /** Method to handle OK click */
  okClick() {
    this.permissionToEditRecord = false;
  }

  /** Method to open the upload dialog box */
  openUploadDialogBox(data?: any, selectedEntity?: any, selectedView?: any) {

   // this.displayfileUploadInteractiveDialog=true;
   this.getWellDocumentTypes(data, selectedEntity, selectedView);
  }

  /** Method to get well document types */
  getWellDocumentTypes(data?: any, entityType?: any, selectedView?: any) {

    this.lookupService
      .getDocumentTypes(entityType)
      .subscribe({
        next: (resp: any) => {
          if (resp) {
            
            this.displayfileUploadInteractiveDialog = true;
            this.entityType = entityType;
            this.entityId = data.cvxCrwId;
            this.wellDocumentTypes = resp;
            this.selectedDocument = this.wellDocumentTypes[0].name + ' '+ data.componentTypeName + ' ' +data.materialNumber;
            this.selectedView= this.wellDocumentTypes[0].id;
            this.mdlRecord=data;

          } else {
            this.wellDocumentTypes = [];
          }
        },
        error: () => {
          this.wellDocumentTypes = [];
        },
      });
  }
  /** Method to save the state of the grid */
  onSaveState() {
   this.gridStateService.saveStateOnDestroy(this.stateKey);
  }

  onResetState() {
    this.gridStateService.resetState();
  }

}
