import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { GridApi, GridOptions, GridReadyEvent, IDetailCellRendererParams, SideBarDef, Column } from 'ag-grid-community';
import { ExcelService } from '../../../services/excel.service';
import * as XLSX from 'xlsx';
import { WellFeatures } from '../../../common/model/wellfeatures';
import { BatchJobWithLogs } from '../../../common/model/batch-job-with-logs';
import { NgxSpinnerService } from 'ngx-spinner';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { SchematicMasterTable } from '../../../common/model/schematic-master-table';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { SchematicPerforations } from '../../../common/model/schematic-perforations';
import { ExportSchematicMasterTableService } from '../../../services/columnService/exportMasteTableColumn.service';
import { InventoryService } from '../../../services/inventory.service';
import { select, Store } from '@ngrx/store';
import { routeLinks, storeFilters } from '../../../common/enum/common-enum';
import { interval, map, Observable, Subscription } from 'rxjs';
import _ from 'lodash';
import {
  IThorFilterPayloadStore,
  READ_THOR_ADVANCE_FILTER_ACTION_TYPE,
  ThorAdvanceFilterAction,
  ThorAdvanceFilterActionType,
} from '../../../common/ngrx-store';
import { AccessControls, thorCompletionHeaders } from '../../../common/constant';
import { CommonService } from '../../../services/common.service';
import { LookupsService } from '../../../services/lookups.service';
import { ProjectsDto } from '../../../common/model/wells-dto';
import { ThorService } from '../../../services/thor.service';
import { Router } from '@angular/router';
import { AuthService, MasterService } from '../../../services';
import { LookupKeys } from '../../../common/enum/lookup-keys';
import { CustomUploadButton } from '../customUploadButton.component';
import { DocumentEntityTypes } from '../../../common/enum/document-entity-types';
import { ThorCompletionsMaterials } from '../../../common/model/thor-completions-materials';
import { MessageService } from 'primeng/api';
import { ThorSelectedWells } from '../../../common/model/thor-selected-wells';
import { CustomerPersonalizationService } from '../../../services/customer-personalization.service';
import { GridStatePersistenceService } from '../../../common/builder/persistant-builder.service';
import { ResponsiveService } from '../../../services/responsive.service';
import { FileUploadWithButtonComponent } from '../../common/file-upload-interactive-dialog/file-upload-interactive-dialog.component';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { SelectWellThorComponent } from '../select-well-thor/select-well-thor.component';
import { ChangeLogComponent } from '../../common/dialog/change-log.component';

@Component({
  selector: 'app-completions',
  standalone:true,
  imports:[...PRIME_IMPORTS,FileUploadWithButtonComponent,SelectWellThorComponent,ChangeLogComponent],
  templateUrl: './completions-interactive.component.html',
  styleUrl: './completions-interactive.component.scss'
})
export class CompletionsInteractiveComponent implements OnInit, OnDestroy {

  //Grid Options
  display: boolean = true;
  subscription: Subscription;
  isFilterBTNDisabled: boolean = false;
  showMdlDialog: boolean = false;
  gridOptions: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  selectedView = 2;
  rowHeight: number = 50;
  totalRecords: number = 0;
  projects: any[] = [];
  wells: any[] = [];
  selectedProject: any[] = [];
  advanceFilter: any;
  inventories: any[] = [];
  quickFilterText: string = '';
  originalTableData: any;
  isWellSelected: boolean = false;
  selectedWellId: number | null = null;
  functionId: number = 2;
  appId: number = 2;
  searchTerm: string = '';
  entityType: string;
  entityId: number;
  wellDocumentTypes: any;
  selectedDocument: string;
  selectedEntity: string = "";
  isAddComponentShowing: boolean = true;
  // Array of sections to populate the dropdown options
  masterTableFilterData: SchematicMasterTable;
  masterDataColumnDefs = [];
  //required Inputs for the Component
  @Input({ required: true }) schematic: Completionschematicheader;
  schematicId: number;
  // The model for the selected section
  selectedmasterTableView: number = -1;
  masterDataGridData: SchematicMasterTable[];
  masterDataGridExcelData: SchematicMasterTable[];
  wellFeatures = [];
  isWellChanged: boolean = false;
  schematicPerforations: SchematicPerforations[] = [];
  displayExportToOdinDialog: boolean = false;
  displayImportDepthTableDialog: boolean = false;
  displayBatchStatusDialog: boolean = false;
  loading: boolean = false;
  thorWellsData: any[] = [];
  gridConfig: any = {};
  showAddComponentDialog: boolean = false;
  @Output() viewChanged = new EventEmitter<any>();
  entityName: string = thorCompletionHeaders;
  openChangeLog: boolean = false;
  currentEntityId: number = 0;
  noRowsFound: boolean = false;
  componentShortDescListFiltered: any[] = [];
  sectionShortDescListFiltered: any[] = [];
  displayfileUploadInteractiveDialog: boolean = false;
  height$: Observable<string>;
  // othersData:string='COMPLETION_MATERIAL,MATERIAL_CVX_PO,MATERIAL_SPEC_SHEET'
  othersData: string = 'MATERIAL,MATERIAL_SPEC_SHEET,MATERIAL_CVX_PO'

  // othersData:string='COMPLETION_MATERIAL, MATERIAL_SPEC_SHEET, MATERIAL_CVX_PO'
  currentDate = new Date().toISOString().split('T')[0];
  viewOptions = [{ label: 'Drilling', value: 1 },
  { label: 'Completions', value: 2 }];
  selectedWellNumber: number | null = null;
  selectedProjectId: number | null = null;
  wellDetails: {
    id: number;
    wellNumber: number;
    wellName: string;
    appId: number;
    functionId: number;
  } | null = null;
  selectedwellName: string | null = null;
  private gridApi!: GridApi;
  private gridColumnApi!: Column;
  componentTypeList: { label: string; value: string }[] = [];
  holeSelectionList: { label: string; value: string }[] = [];
  hsTypeList: { label: string; value: string }[] = [];
  uomList: { label: string; value: string }[] = [];
  sectionList: { label: string; value: string }[] = [];
  editedRowsData: ThorCompletionsMaterials[] = [];
  addedData: ThorCompletionsMaterials[] = [];
  savedData: ThorCompletionsMaterials[] = [];
  selectedThorCompletionsMaterials: ThorCompletionsMaterials;
  thorSelectedWell: ThorSelectedWells;
  schematicIdCompletions: number;
  displayValidationDialog: boolean = false;
  displayCompletionsPQty: boolean = false;
  userDetails: any; // To hold user details from AuthService
  pageNumber: number = 1;
  pageSize: number = 100;
  totalRecordsD: number = 0;
  CompletionsMaterials: ThorCompletionsMaterials[] = []
  intervalId: any;
  readonly stateKey = 'Thor - Completions';
  cachedGridState: any;
  cachedContextData: any;
  hasRestoredPersonalization = false;
  isUpdateEditable: boolean = true;
  hideDeleted: boolean = false;
  isCVXPODocumentUploaded = false;
  private thorSubscription: Subscription = new Subscription();

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

  //Define Columns for the masterData Grid
  initializeColumnDefs() {
    this.masterDataColumnDefs = [
      {
        headerName: '', // Toggle for masterDetail
        field: 'toggle',
        maxWidth: 60,
        cellRenderer: 'agGroupCellRenderer',
        pinned: true,
        cellRendererParams: {
          suppressCount: true,
        },
        cellClass: 'custom-expand-icon', // Add custom class
      },

      { headerName: 'Item', field: 'item', minWidth: 100, filter: true, sortable: true, pinned: true, editable: this.authService.isFieldEditable('item') },
      {
        headerName: 'Section', field: 'sectionName', minWidth: 100, editable: this.authService.isFieldEditable('sectionName'), filter: true, sortable: true, pinned: true,
        cellEditor: 'agSelectCellEditor',
        valueFormatter: params => {
          const item = this.sectionList.find(item => item.value === params.value);
          return item ? item.label : null;
        },
        cellEditorParams: () => {
          return {
            values: this.sectionList.map(item => item.label),
          };
        },
        valueSetter: (params) => {
          const selectedSection = this.sectionList.find(item => item.label === params.newValue);
          if (selectedSection) {
            // Update the sectionName with the label and sectionId with the corresponding value
            params.data.sectionName = selectedSection.label; // update sectionName
            params.data.sectionId = selectedSection.value;  // update sectionId
            return true;  // Indicate that the value has been updated successfully
          }
          return false;  // Return false if no match is found
        },
      },
      {
        headerName: 'Component Type',
        field: 'componentTypeName',
        minWidth: 100,
        editable: this.authService.isFieldEditable('componentTypeName'),
        sortable: true,
        filter: true,
        pinned: true,
        cellEditor: 'agSelectCellEditor',
        cellClassRules: {
          'strikeout': (params) => params.data?.masterDetailsCount === 0
        },
        valueFormatter: params => {
          const item = this.componentTypeList.find(item => item.value === params.value);
          return item ? item.label : null;
        },
        cellEditorParams: () => {
          return {
            values: this.componentTypeList.map(item => item.label),
          };
        },
        valueSetter: (params) => {
          const selectedComponentType = this.componentTypeList.find(item => item.label === params.newValue);
          if (selectedComponentType) {
            // Update the componentTypeName with the label and componentTypeId with the corresponding value
            params.data.componentTypeName = selectedComponentType.label; // update componentTypeName
            params.data.componentTypeId = selectedComponentType.value;
            // update componentTypeId
            return true;  // Indicate that the value has been updated successfully
          }
          return false;  // Return false if no match is found
        },
      },
      {
        headerName: 'Material Description', field: 'materialShortDesc', cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true, editable: this.authService.isFieldEditable('materialShortDesc'), sortable: true, minWidth: 170, filter: true, pinned: true
      },
      {
        headerName: 'Material ID', field: 'materialId', editable: this.authService.isFieldEditable('materialId'), sortable: true, minWidth: 150, filter: true,
        pinned: true,
        cellClassRules: {
          'strikeout': (params) => params.data?.masterDetailsCount === 0
        }
      },
      {
        headerName: 'Spec Sheet',
        cellRenderer: CustomUploadButton,
        minWidth: 160,
        sortable: true,
        cellRendererParams: {
          onClick: (data: any) => this.openUploadDialogBox(this.othersData, data, DocumentEntityTypes.SPEC_SHEET),
          additionalParam: 'SpecSheet'
        },
        suppressHeaderMenuButton: true
      },
      {
        headerName: 'Other Documents',
        cellRenderer: CustomUploadButton,
        cellRendererParams: {
          onClick: (data: any) => this.openUploadDialogBox(this.othersData, data),
          additionalParam: 'Others'
        },
        sortable: false,
        suppressHeaderMenuButton: true
      },
      {
        headerName: 'Design Comment', field: 'designComment', cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true, minWidth: 240, editable: this.authService.isFieldEditable('designComment'), sortable: true, filter: true
      },
      { headerName: 'Manufacturer Part #', field: 'manufacturerPart', minWidth: 200, editable: this.authService.isFieldEditable('manufacturerPart'), sortable: true, filter: true },
      {
        headerName: 'Serial #', field: 'serialNumber', editable: this.authService.isFieldEditable('serialNumber'), sortable: true, minWidth: 120, filter: true, cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true
      },
      {
        headerName: 'UoM (FT or EA)', field: 'uoM', minWidth: 180, editable: this.authService.isFieldEditable('uoM'), sortable: true, filter: true,
        cellEditor: 'agSelectCellEditor',
        valueFormatter: (params) => {
          const item = this.uomList.find(item => item.value === params.value);
          return item ? item.label : null;
        },
        cellEditorParams: () => {
          return {
            values: this.uomList.map(item => item.value),
          };
        },
      },
      // { headerName: 'Primary', field: 'primaryQuantity', minWidth: 150, editable: false, sortable: true, filter: true },
      { headerName: 'Primary Qty (EA)', field: 'primaryQuantity', minWidth: 170, editable: this.authService.isFieldEditable('primaryQuantity'), sortable: true, filter: true },
      { headerName: 'Primary Qty (FT)', field: 'primaryFt', minWidth: 120, editable: this.authService.isFieldEditable('primaryFt'), sortable: true, filter: true },
      { headerName: 'B/U Qty (EA)', field: 'backupQuantity', minWidth: 120, filter: true },
      { headerName: 'B/U Qty (FT)', field: 'sapDocNumber', editable: this.authService.isFieldEditable('sapDocNumber'), sortable: true, minWidth: 180, },
      { headerName: 'Secondary Qty (EA)', field: 'secondaryQuantity', minWidth: 180, editable: this.authService.isFieldEditable('secondaryQuantity'), sortable: true, filter: true },
      { headerName: 'Secondary Qty (FT)', field: 'secondaryFt', minWidth: 150, editable: this.authService.isFieldEditable('secondaryFt'), sortable: true, filter: true },
      { headerName: 'Contingency Qty (EA)', field: 'contingentQuantity', minWidth: 190, editable: this.authService.isFieldEditable('contingentQuantity'), sortable: true, filter: true },
      { headerName: 'Contingency Qty (FT)', field: 'contingencyFt', minWidth: 150, editable: this.authService.isFieldEditable('contingencyFt'), sortable: true, filter: true },
      // { headerName: 'Serial', field: 'serial', editable: true, sortable: true, cellEditor: 'agLargeTextCellEditor',
      //   cellEditorPopup: true},    
      { headerName: 'Qty Shipped', field: 'quantityShipped', minWidth: 140, editable: this.authService.isFieldEditable('quantityShipped'), sortable: true, filter: true },
      {
        headerName: 'Qty Returned', field: 'quantityReturned', editable: this.authService.isFieldEditable('quantityReturned'), sortable: true, minWidth: 150, filter: true,
      },
      {
        headerName: 'WellView Consumption', field: 'wellViewConsumption', minWidth: 200, editable: this.authService.isFieldEditable('wellViewConsumption'), sortable: true, filter: true,
      },
      {
        headerName: 'Rig Ready Date', field: 'rigReadyDate', minWidth: 200, editable: this.authService.isFieldEditable('rigReadyDate'), sortable: true, filter: true,
        cellEditor: 'agDateCellEditor',  // Use AG Grid's built-in date picker (calendar)
        cellEditorParams: {
          format: 'MM/dd/yyyy',  // Date format for the calendar (optional)
        },
        valueGetter: (params) => {
          // Log value to debug

          // Ensure p10startDate is either null or valid
          if (params.data.rigReadyDate === undefined || params.data.rigReadyDate === null) {
            return null;  // Return null if there is no value
          }

          // If there is a valid date, return it
          return params.data.rigReadyDate;  // Returning Date object should be fine here
        },
        valueFormatter: (params) => {
          const date = new Date(params.value);

          // Check if the value is a valid date
          if (!params.value || isNaN(date.getTime())) {
            return '';  // Return empty string for invalid or null date
          }

          // Format valid date as MM/dd/yyyy
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        },
        onCellValueChanged: (params) => {
          const newDate = new Date(params.newValue);

          // Debug log for checking new date value

          // Check if the new value is empty, invalid, or the default Unix epoch date (1/1/1970)
          if (!params.newValue || isNaN(newDate.getTime()) || newDate.getTime() === 0) {
            // If the value didn't change, don't update it
            if (params.oldValue === params.newValue) {
              return; // Don't update if the value is the same
            }


            if (params.data.rigReadyDate != null) {
              return;  // Keep the existing value
            }


            params.api.getRowNode(params.node.id).setDataValue('rigReadyDate', params.oldValue);
          } else {

            const normalizedDate = new Date(Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()));


            if (params.oldValue !== normalizedDate.getTime()) {
              params.api.getRowNode(params.node.id).setDataValue('rigReadyDate', normalizedDate);
            }
          }
        }
      },
      { headerName: 'Business Partner', field: 'vendor', minWidth: 170, editable: this.authService.isFieldEditable('vendor'), sortable: true, filter: true },
      {
        headerName: 'CVX PO', cellRenderer: CustomUploadButton, minWidth: 200, editable: false,
        cellRendererParams: {
          onClick: (data: any) => this.openUploadDialogBox(this.othersData, data, DocumentEntityTypes.CVX_PO),
          additionalParam: 'Cvx'
        },
        sortable: false, suppressHeaderMenuButton: true

      },
      { headerName: 'Release #', field: 'release', editable: this.authService.isFieldEditable('release'), sortable: true, minWidth: 180, },
      { headerName: 'Status', field: 'status', editable: this.authService.isFieldEditable('status'), sortable: true, minWidth: 180, },
      {
        headerName: 'Additional Comments', field: 'additionalComments', editable: this.authService.isFieldEditable('additionalComments'), sortable: true, minWidth: 180,
        cellEditor: 'agLargeTextCellEditor', cellEditorPopup: true
      },

      { headerName: 'SAP Document #', field: 'sapDocNumber', editable: this.authService.isFieldEditable('sapDocNumber'), sortable: true, minWidth: 180, },
      {
        headerName: 'Reconciled in SAP', field: 'reconciledInSap', editable: false, sortable: true, minWidth: 180,
        cellStyle: { backgroundColor: '#e1f5e6' },
        cellRenderer: params => {
          const isChecked = params.value === 'Yes';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.className = 'custom-checkbox';
          input.checked = isChecked;
          input.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            const newValue = target.checked ? 'Yes' : 'No';
            params.setValue(newValue);
          });
          return input;
        },
        cellEditor: 'agCheckboxCellEditor',
        cellEditorParams: {
          selectAllOnFocus: true,
          values: ['Yes', 'No']
        }
      },
      {
        headerName: 'MC Comments', field: 'mcComments', editable: this.authService.isFieldEditable('mcComments'), sortable: true, minWidth: 180,
        cellStyle: { backgroundColor: '#e1f5e6' }, cellEditor: 'agLargeTextCellEditor', cellEditorPopup: true
      },
      // { headerName: 'Reconciled In Sap', field: 'reconciledInSap', maxWidth: 100, editable: true, sortable: true , minWidth: 180,}


    ];
  }

  public detailCellRendererParams: any = {
    detailGridOptions: {
      columnDefs: [
        { headerName: 'Section', field: 'sectionName', minWidth: 100, filter: true, sortable: true, pinned: true },
        { headerName: 'Design Type', field: 'designType', minWidth: 130, filter: true, sortable: true, pinned: true },
        { headerName: 'Zone', field: 'zoneID', editable: false, sortable: true, filter: true, pinned: true },
        /*{ headerName: 'Assembly/Component', field: 'type', editable: false, sortable: true, minWidth: 200, filter: true, hide: true},*/
        { headerName: 'Item', field: 'itemNumber', editable: false, sortable: true, minWidth: 100, filter: true, pinned: true },
        {
          headerName: 'Sub-Item',
          field: 'subItemNumber',
          editable: false,
          sortable: true,
          minWidth: 120,
          filter: true,
          pinned: true,
          valueGetter: (params: any) => {
            const value = params.data.subItemNumber;
            if (value === '' || value === null || value === undefined) {
              return '';
            }
            return parseFloat(value);
          }
        },
        { headerName: 'Assembly Type', field: 'assemblyName', editable: false, sortable: true, minWidth: 255, filter: true, pinned: true },
        { headerName: 'Component Type', field: 'componentTypeName', minWidth: 180, filter: true, sortable: true },
        { headerName: 'Description', field: 'materialDescription', minWidth: 540, editable: false, sortable: true, filter: true },
        { headerName: 'Design Notes', field: 'designNotes', minWidth: 160, editable: false, sortable: true, filter: true },
        { headerName: 'MM / MMR', field: 'materialNumber', editable: false, sortable: true, minWidth: 150, filter: true },
        { headerName: 'Supplier Part', field: 'supplierPartNumber', minWidth: 160, editable: false, sortable: true, filter: true },
        { headerName: 'Legacy Ref', field: 'legacyRefNumber', minWidth: 150, editable: false, sortable: true, filter: true },
        // { headerName: 'Serial', field: 'serial', editable: true, sortable: true },  
        {
          headerName: 'Length', field: 'assemblyLengthinft', minWidth: 120, filter: true,
          valueFormatter: (params) => params.value ? Number(params.value).toFixed(2) : ''
        },
        { headerName: 'Supplier', field: 'supplier', minWidth: 140, editable: false, sortable: true, filter: true },
        {
          headerName: 'Actual O.D.', field: 'actualOD1', editable: false, sortable: true, minWidth: 150, filter: true,
          valueGetter: (params: any) => `${params.data.actualOD1 || ''} ${params.data.actualOD2 ? 'X ' + params.data.actualOD2 : ''} ${params.data.actualOD3 ? 'X ' + params.data.actualOD3 : ''}`
        },
        {
          headerName: 'Actual I.D.', field: 'actualID1', minWidth: 150, editable: false, sortable: true, filter: true,
          valueGetter: (params: any) => `${params.data.actualID1 || ''} ${params.data.actualID2 ? 'X ' + params.data.actualID2 : ''} ${params.data.actualID3 ? 'X ' + params.data.actualID3 : ''}`
        },
        // { headerName: 'Clamp?', field: 'clamp', maxWidth: 100, editable: true, sortable: true }, 
        // { headerName: 'Clamp Type', field: 'clampType', editable: true, sortable: true },  
        // { headerName: 'Clamp Top Depth (MD)',  field: 'clampTypeD', maxWidth: 100, rowDrag: true }, 
        { headerName: 'Top Depth (MD) - Inner String', field: 'topDepthInner', minWidth: 270, editable: false, sortable: true, filter: true },
        { headerName: 'Top Depth (MD) - Outer String', field: 'topDepthOuter', minWidth: 270, editable: false, sortable: true, filter: true },
        // { headerName: 'Depth Points of Interest', field: 'depthPointsOfInterest',  minWidth: 220, editable: false, sortable: true },
        // { headerName: 'POI Depth', field: 'poiDepth', maxWidth: 100, editable: true, sortable: true , minWidth: 180,}
        { headerName: 'SectionID', field: 'sectionID', hide: true },
      ],
      defaultColDef: {
        flex: 1,
        minWidth: 100,
        resizable: true,
        autoHeight: true,
        // wrapText: true,
        cellClass: 'wrap-text-cell'
      }
    },
    getDetailRowData: (params) => {
      const detailData = params.data.masterDetails || [];
      params.successCallback(detailData);
    }
  } as IDetailCellRendererParams<ThorCompletionsMaterials>;

  constructor(private inventoryService: InventoryService,
    private excelService: ExcelService,
    private spinner: NgxSpinnerService,
    private commonService: CommonService,
    private lookupService: LookupsService,
    private thorService: ThorService,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private masterService: MasterService,
    private authService: AuthService, // Assuming you have an AuthService for authentication
    private gridStateService: GridStatePersistenceService, // Service to manage grid state persistence
    private personalizationService: CustomerPersonalizationService, // Service to manage customer personalization
    // private store: Store<{ readThorAdvanceFilterData: IThorFilterPayloadStore }>,
    private responsiveService: ResponsiveService
  ) {
    this.userDetails = this.authService.getUserDetail(); // Get user details from AuthService

  }

  ngOnInit(): void {
    this.getUserDetails();
    this.getWellsForProjects();
    this.searchWells();
    this.displaySelectWell();
    this.initializeColumnDefs();
    const existingWellDetails = this.commonService.getWellDetailsFilterData();
    if (existingWellDetails && existingWellDetails.id && existingWellDetails.id !== 0) {
      this.setWellDetails(existingWellDetails);
    }
    this.responsiveService.thorMediaQueries()
    this.height$ = this.responsiveService.getHeight$();
    // this.getThorCompletionMaterials(49);

  }
  ngOnDestroy(): void {
    this.thorSubscription.unsubscribe();
  }
  /**
   *  it will get the user details from jwt token
   */
   getUserDetails() {
    let userAccess =  this.authService.isAuthorized(AccessControls.THOR_COMPLETION_ACCESS);
    this.commonService.setuserAccess(userAccess);
    this.isAddComponentShowing = this.authService.isFieldEditable('showEquipment');    
  }

  //  save the grid state when the component is destroyed
  
onSaveState() {
    this.gridStateService.saveStateOnDestroy(this.stateKey);
}

  onGridReady(params: any) {
    this.gridApi = params.api;
    // this.gridColumnApi = params.column;

    this.updateNoRowsOverlay(); // Check overlay when grid is ready
    this.gridStateService.initialize(params.api, this.userDetails.uid);
  }


  // Retrieves the latest personalization for the current user and applies it to the grid
  getPersonalization() {
    const userId = this.userDetails?.uid || 0;
    this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
      next: (res) => {
        const state = res?.result?.appState ? JSON.parse(res.result?.appState) : null;
        const contextData = res?.result?.contextData;
        const context = typeof contextData === 'string' ? JSON.parse(contextData) : contextData;
        // Restore context filters

        // Restore grid state
        if (state && this.gridApi) {
          if (state.columnState) {
            this.gridApi.applyColumnState({ state: state.columnState, applyOrder: true });
          }
          setTimeout(() => {
            if (state.filterModel) {
              this.gridApi.setFilterModel(state.filterModel);
            }
            if (state.sortModel && (this.gridApi as any).setSortModel) {
              (this.gridApi as any).setSortModel(state.sortModel);
            }
            this.gridApi.refreshHeader();
            this.gridApi.redrawRows();
          }, 50);
        }

        this.hasRestoredPersonalization = true; // ✅ Prevent future re-runs
      },
      error: (err) => {
        console.warn('No personalization found or failed to load.', err);
      },
    });
  }

  // hide deleted method

  applyFilter() {
    if (this.hideDeleted) {
      const filtered = this.thorWellsData.filter(row => row.masterDetailsCount !== 0);
      this.thorWellsData = filtered;
      this.gridApi.applyTransaction({ update: this.thorWellsData });
    } else {
      this.getThorCompletionWells();
    }

  }

  setWellDetails(wellDetails: any) {
    this.selectedWellId = wellDetails.id;
    this.selectedWellNumber = wellDetails.wellNumber;
    this.selectedwellName = wellDetails.wellName;
    this.functionId = wellDetails.functionId;
    this.getThorCompletionWells();  // Trigger fetching data once all details are set
  }

  displaySelectWell() {
    const wellDetails = this.commonService.getWellDetailsFilterData();
    if (wellDetails != null) {
      this.selectedWellId = wellDetails.id;
      this.commonService.display$.subscribe(
        (isVisible) => {
          this.display = isVisible;
        }
      );
      if (this.selectedWellId) {
        this.display = false
      }
    }
  }

  searchWells() {
    this.commonService.searchTerm$.subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.searchWellFilter();  // Re-apply the filter when the search term changes
    });

    this.commonService.filterApplied$.subscribe(() => {
      this.searchWellFilter();  // Trigger filter when event occurs
    });
  }

  searchWellFilter() {
    if (this.projects?.length > 0 && this.searchTerm.trim()) {
      this.projects.forEach(project => {
        if (!project.originalWells) {
          project.originalWells = [...project.wells];
        }
        project.wells = project.originalWells.filter(well =>
          well.wellName.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      });
      this.projects = this.projects.filter(project => project.wells.length > 0);
    } else {
      this.projects.forEach(project => {
        if (project.originalWells) {
          project.wells = [...project.originalWells];
        }
      });
      this.getWellsForProjects();
    }
  }

  onViewSelectionChange(selectedOption: any) {
    this.functionId = selectedOption;
    if (this.functionId) {
      this.getWellsForProjects();
    }

  }

  updateFilter() {
    // this.getUserDetails();
    if (this.selectedWellId && this.selectedProjectId) {
      this.commonService.getSelectedWellNumber(this.selectedWellNumber);
      this.display = false;
      // this.isWellSelected = true;
      this.wellDetails = {
        id: this.selectedWellId,
        wellNumber: this.selectedWellNumber,
        wellName: this.selectedwellName,
        appId: 2,            // Thor
        functionId: this.functionId, // Drilling/Completions
      };

      //Begin
      this.thorSelectedWell = {
        wellId: this.selectedWellId,
        wellNumber: this.selectedWellNumber,
        wellName: this.selectedwellName,
        appId: 2,            // Thor
        functionId: this.functionId, // Drilling/Completions
      };
      this.commonService.setThorSelectedWell(this.thorSelectedWell);
      //End


      if (this.functionId === 1) {
        this.commonService.setFunctionIdThor(1);
        this.commonService.setWellDetailsFilterData(this.wellDetails);
        this.router.navigateByUrl(routeLinks.thor2LandingDashboard);
      } else {
        this.commonService.setWellDetailsFilterData(this.wellDetails);
        this.commonService.setFunctionIdThor(this.functionId);
        this.getThorCompletionWells();
      }
    } else {
      console.warn('No Well ID selected for filtering.');
    }
  }

  onCellValueChanged(event: any): void {
    const updatedData = this.thorWellsData.find((row: any) => row.id === event.data.id);
    if (updatedData) {
      updatedData[event.colDef.field] = event.newValue;
      if (event.colDef.field === 'reconciledInSap') {
        const checkboxValue = event.newValue === 'Yes' ? 'Yes' : 'No';
      }
      updatedData.isEdited = true;
    }

    this.editedRowsData = this.thorWellsData.filter((row: any) => row.isEdited);
    this.commonService.editedRowsData = this.editedRowsData;

    // this.initializeColumnDefs();
  }

  getWellsForProjects() {
    this.projects = [];
    const appId = 2;
    const functionId = this.functionId;
    this.thorSubscription = this.lookupService.getWellsByProject(appId, functionId).subscribe(
      (data: ProjectsDto[]) => {
        this.projects = data;
      },
      error => {
        console.error('Error fetching wells by project:', error);
        this.projects = [];
      }
    );
  }

  toggleProjectWells(selectedValue: { wellId: number; projectId: number; wellNumber: number; wellName: string }) {
    if (selectedValue) {
      this.selectedProjectId = selectedValue.projectId;
      this.selectedWellId = selectedValue.wellId;
      this.selectedWellNumber = selectedValue.wellNumber;
      this.selectedwellName = selectedValue.wellName
    }
  }

  // getThorCompletionWells() {
  //   const wellDetails = this.commonService.getWellDetailsFilterData();
  //   this.selectedWellId = wellDetails.id;
  //   let wellId = this.selectedWellId
  //   this.spinner.show();
  //   this.thorService.getThorCompletionsMaterials(wellId).subscribe({
  //     next: (response: any) => {
  //       this.spinner.hide();
  //       if (response && response.success && response.data?.length) {
  //         this.isWellSelected = true;
  //         this.totalRecords = response.totalRecords;
  //         this.thorWellsData = response.data;
  //         this.initializeColumnDefs();
  //         this.initializeDropdowns();
  //         this.getComponentList();
  //         this.getSectionList();
  //         this.schematicIdCompletions = this.commonService.getSchemanticId();
  //         this.updateNoRowsOverlay()
  //       } else if (response.data?.length === 0) {
  //         this.isWellSelected = false;
  //         this.noRowsFound = true;

  //       }
  //       else {
  //         this.totalRecords = 0;
  //         this.thorWellsData = [];
  //       }
  //     },
  //     error: () => {
  //       this.spinner.hide();
  //       this.totalRecords = 0;
  //       this.thorWellsData = [];
  //       this.updateNoRowsOverlay();
  //     },
  //   });

  // }

  // Method to fetch data from the server and update the grid with setInterval Infinate Scroll //
  getThorCompletionWells() {
    const wellDetails = this.commonService.getWellDetailsFilterData();
    this.selectedWellId = wellDetails.id;
    this.pageNumber = 1;
    this.thorWellsData = [];
    this.loading = false;
    this.spinner.show();

    if (this.intervalId) {
      clearInterval(this.intervalId); // Clear any previous interval
    }

    // Load initial 100 records
    this.loadPagedThorWells();

    // Set interval to load next pages every 3 seconds (adjust as needed)
    this.intervalId = setInterval(() => {
      this.loadPagedThorWells();
    }, 0);
  }

  // set Interval // to load next pages every second
  // Load initial 100 records

  // loadPagedThorWells() {
  //   if (this.loading) return;

  //   this.loading = true;
  //   const wellId = this.selectedWellId;

  //   this.thorService.getCompletionsMaterialsPaged(wellId, this.pageNumber, this.pageSize)
  //     .subscribe({
  //       next: (response) => {
  //         this.spinner.hide();
  //         this.loading = false;
  //         const data = response.result?.data || [];
  //         this.totalRecords = response.result?.totalRecords || 0;
  //         this.schematicIdCompletions = this.commonService.getSchemanticId(); // Get schematic ID completions
  //         if (this.pageNumber === 1 && data.length === 0) {
  //           this.noRowsFound = true;
  //           this.isWellSelected = false;
  //           clearInterval(this.intervalId); // No data, stop further loads
  //           return;
  //         }

  //         this.thorWellsData = [...this.thorWellsData, ...data];
  //         this.isWellSelected = true;
  //         this.noRowsFound = false;
  //         this.display = false;

  //         this.initializeColumnDefs();
  //         this.initializeDropdowns();
  //         this.updateNoRowsOverlay();
  //         setTimeout(() => this.getPersonalization(), 50); // Load personalization after grid is ready

  //         if (data.length < this.pageSize) {
  //           clearInterval(this.intervalId); // No more pages left
  //           this.gridOptions.api.hideOverlay();
  //         } else {
  //           this.pageNumber++;
  //         }
  //       },
  //       error: () => {
  //         this.spinner.hide();
  //         this.loading = false;
  //         this.thorWellsData = [];
  //         this.totalRecords = 0;
  //         this.gridOptions.api.hideOverlay();
  //         this.updateNoRowsOverlay();
  //         clearInterval(this.intervalId); // Stop on error
  //       }
  //     });
  // }

  loadPagedThorWells() {
    if (this.loading) return;

    this.loading = true;
    const wellId = this.selectedWellId;

    this.thorSubscription =this.thorService.getCompletionsMaterialsPaged(wellId, this.pageNumber, this.pageSize)
      .subscribe({
        next: (response) => {
          this.getUserDetails();
          this.spinner.hide();
          this.loading = false;

          const data = response.result?.data || [];
          this.totalRecords = response.result?.totalRecords || 0;
          this.schematicIdCompletions = this.commonService.getSchemanticId();

          // No records on first page, stop
          if (this.pageNumber === 1 && data.length === 0) {
            this.noRowsFound = true;
            this.isWellSelected = false;
            clearInterval(this.intervalId);
            return;
          }

          // Only clear data on first page
          if (this.pageNumber === 1) {
            this.thorWellsData = [...data];
          } else {
            this.thorWellsData = [...this.thorWellsData, ...data];
          }

          this.isWellSelected = true;
          this.noRowsFound = false;
          this.display = false;

          this.initializeColumnDefs();
          this.initializeDropdowns();
          this.updateNoRowsOverlay();

          // ✅ Restore personalization only once after page 1 data is fully rendered
          if (this.pageNumber === 1 && !this.hasRestoredPersonalization) {
            setTimeout(() => this.getPersonalization(), 50);
          }

          if (data.length < this.pageSize) {
            clearInterval(this.intervalId);
            // this.gridOptions.api.hideOverlay();
          } else {
            this.pageNumber++;
          }
        },
        error: () => {
          this.spinner.hide();
          this.loading = false;
          this.thorWellsData = [];
          this.totalRecords = 0;
          // this.gridOptions.api.hideOverlay();
          this.updateNoRowsOverlay();
          clearInterval(this.intervalId);
        }
      });
  }


  dropDownChanged() {

  }

  initializeDropdowns() {
    // this.loadLookupDropdown(LookupKeys.ComponentType, 'componentTypeList');
    this.loadLookupDropdown(LookupKeys.HoleSection, 'holeSelectionList');
    this.loadLookupDropdown(LookupKeys.HSType, 'hsTypeList');
    this.loadLookupDropdown(LookupKeys.UOM, 'uomList');
    // this.loadLookupDropdown(LookupKeys.SECTION, 'sectionList');
    this.getComponentList();
    this.getSectionList();
  }

  loadLookupDropdown(lookupKey: LookupKeys, listName: string) {
    this.thorSubscription =this.masterService.getLookupValues(lookupKey).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this[listName] = response.data.map((item: any) => ({
            label: item.LOOKUPDISPLAYTEXT || item.LOOKUPTEXT,  // Display text
            value: item.LOOKUPTEXT                             // Actual value
          }));
        }
      },
      error: () => {
        console.error(`Failed to load lookup values for ${lookupKey}`);
        this[listName] = [];
      }
    });
  }

  dateFormatter(params) {
    return new Date(params.value).toLocaleDateString('en-US');
  }

  builtSearchCondition() {
    let conditions = [{
      FieldName: 'WellNumber',
      Operator: 'eq',
      // Value: this.advanceFilter?.well.toString(),
      Value: '3',
    }];
    if (this.advanceFilter?.functions?.length > 0) {
      conditions.push(this.advanceFilter?.functions[0]);
    }

    return conditions;
  }

  getComponentList() {
    this.thorSubscription = this.lookupService.getComponentTypes().subscribe({
      next: (response: any) => {
        this.componentTypeList = response
          ? response.map((item: any) => ({
            label: item.componentTypeName,
            value: item.componentTypeId
          }))
          : [];
        // this.initializeColumnDefs();
      }
    });
  }

  getSectionList(): void {
    this.thorSubscription =this.lookupService.getSections(true).subscribe({
      next: (response: any) => {
        this.sectionList = response
          ? response.map((item: any) => ({
            label: item.sectionName,
            value: item.sectionId
          }))
          : [];
      }
    });
  }

  // Method to add a new component
  onAddSelected(dataFromMdl: ThorCompletionsMaterials[]) {
    // Add components for the selected assembly
    this.addedData = [...dataFromMdl]
    this.thorWellsData = [...this.addedData, ...this.thorWellsData];
    this.commonService.addedData = this.addedData;
    this.initializeColumnDefs();
    this.initializeDropdowns();
    // this.showEquipmentAddDialog = false;
    this.cdr.detectChanges();
    this.showMdlDialog = false;
    // Display success message
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `${this.addedData.length} Components added`
    });
  }

  applyAlternatingRowColors(ws, startRow: number, data: any[], headerCount: number) {
    // Apply alternating row colors for each table
    data.forEach((row, rowIndex) => {
      const rowStyle = (rowIndex % 2 === 0) ? { fill: { fgColor: { rgb: 'F2F2F2' } } } : { fill: { fgColor: { rgb: 'FFFFFF' } } };
      Object.keys(row).forEach((key, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: startRow + rowIndex, c: colIndex });
        const cell = ws[cellAddress];
        if (cell) {
          cell.s = rowStyle; // Apply alternating row style
        }
      });
    });
  }

  onRowClicked(event: any) {
    const rowData = event.data;

    this.viewChanged.emit({
      sectionID: rowData.sectionID,
      itemNumber: rowData.itemNumber,
      zoneID: rowData.zoneID
    });
  }

  onSearch(event: Event): void {
    const searchedSchematic = (event.target as HTMLInputElement).value.toLowerCase();
    this.quickFilterText = searchedSchematic; // Update the quick filter text
  }

  viewStatus() {

    // this.completionSchematicService.getBatchLogs('schematic').subscribe({
    //   next: (res: BatchJobWithLogs[]) => {
    //   },
    //   error: (err) => {
    //     console.error('Error', err);
    //   }
    // });
    this.displayBatchStatusDialog = true;

  }

  getRowClass(params) {
    const classes = [];

    if (params.data?.rowOrder === 0) {
      classes.push('bold-row');
    }

    if (params.data?.masterDetailsCount === 0) {
      classes.push('row-no-details');
    }

    return classes.join(' ');
  }

  exportToOdin() {
    this.displayExportToOdinDialog = true;
  }

  closeExportToOdinDialog() {
    this.displayExportToOdinDialog = false;
  }

  importDepthTableDialog() {
    this.displayImportDepthTableDialog = true;

  }

  closeImportDepthTableDialog() {
    this.displayImportDepthTableDialog = false;
  }

  closeBatchStatusDialog() {
    this.displayBatchStatusDialog = false;
  }

  refreshTable() {
    this.initializeColumnDefs();

  }

  changeLog() {
    let self = this;
    self.currentEntityId = this.selectedWellNumber;
    self.openChangeLog = true;
  }

  openAddComponentDialog(): void {
    this.showMdlDialog = true;
  }

  closeAddComponentDialog(): void {
    this.showMdlDialog = false;
  }

  openUploadDialogBox(documentEntityTypes: any, data?: any, selectedEntity?: any) {

    this.selectedEntity = selectedEntity ? selectedEntity : "";
    this.getWellDocumentTypes(documentEntityTypes, data);
  }

  onClose() {
    if(this.isCVXPODocumentUploaded)
        this.thorService.cachedCompletionsMaterialsData ={};
    this.selectedDocument = "";
    this.selectedView = 0;
    this.entityId = 0;
    this.entityType = ""
    this.displayfileUploadInteractiveDialog = false;
    this.getThorCompletionWells();
  }

  getWellDocumentTypes(entityType: any, data?: any) {


    this.thorSubscription = this.lookupService
      .getDocumentTypes(entityType)
      .subscribe({
        next: (resp: any) => {
          if (resp) {
            this.isUpdateEditable = this.authService.isFieldEditable('uploadDocument');
            this.displayfileUploadInteractiveDialog = true;
            this.entityType = entityType;
            this.entityId = data ? data.id : this.wellDetails.id;
            this.wellDocumentTypes = resp;
            if (this.selectedEntity) {
              const documents = this.wellDocumentTypes.filter(x => x.entity === this.selectedEntity)
              this.selectedView = documents[0].id;
              this.selectedEntity = "";
            }
            else {
              this.selectedView = this.wellDocumentTypes[0].id;
            }

            this.selectedDocument = this.wellDocumentTypes.find(x => x.id === this.selectedView)?.name;
          } else {
            this.wellDocumentTypes = [];
          }
        },
        error: () => {
          this.wellDocumentTypes = [];
        },
      });
  }

  onClosePQty() {
    this.displayCompletionsPQty = false;
  }

  onClickSave() {

    // Check if there is any edited data to save
    if (!this.editedRowsData || this.editedRowsData.length === 0) {
      this.displayCompletionsPQty = true;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No data to save.' });
      return;
    }

    // Validate missing mandatory fields (materialId and materialShortDesc)

    const missingFields = this.editedRowsData.filter(item => !item.materialId || !item.materialShortDesc);
    if (missingFields.length > 0) {
      this.displayValidationDialog = true;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'MM and Description are mandatory for all items.' });
      return;
    }

    // Validate that at least one of primaryQuantity, secondaryQuantity, or contingentQuantity is greater than 0
    const invalidQuantities = this.editedRowsData.filter(item =>
      (!item.primaryQuantity || item.primaryQuantity <= 0 || item.primaryQuantity === null) &&
      (!item.secondaryQuantity || item.secondaryQuantity <= 0 || item.secondaryQuantity === null) &&
      (!item.contingentQuantity || item.contingentQuantity <= 0 || item.contingentQuantity === null)
    );

    if (invalidQuantities.length > 0) {
      this.displayCompletionsPQty = true;
      return;
    }

    // Map and prepare data for saving
    this.savedData = this.editedRowsData.map(item => {
      return {
        ...item,
        functionId: this.functionId,
        wellId: this.selectedWellId,
        wellNumber: this.selectedWellNumber,
        id: item.id ? item.id : 0,
        dateCreated: item.dateCreated ? item.dateCreated : this.currentDate,
        item: item.item ? item.item : "",
        holeSection: item.holeSection ? item.holeSection : "",
        materialType: item.materialType ? item.materialType : "",
        materialShortDesc: item.materialShortDesc ? item.materialShortDesc : "",
        materialId: item.materialId ? item.materialId : "",
        designComment: item.designComment ? item.designComment : "",
        manufacturerPart: item.manufacturerPart ? item.manufacturerPart : "",
        serialNumber: item.serialNumber ? item.serialNumber : "",
        uoM: item.uoM ? item.uoM : "",
        primaryQuantity: item.primaryQuantity ? item.primaryQuantity : 0,
        secondaryQuantity: item.secondaryQuantity ? item.secondaryQuantity : 0,
        contingentQuantity: item.contingentQuantity ? item.contingentQuantity : 0,
        primaryFt: item.primaryFt ? item.primaryFt : 0,
        secondaryFt: item.secondaryFt ? item.secondaryFt : 0,
        contingencyFt: item.contingencyFt ? item.contingencyFt : 0,
        primarySource: item.primarySource ? item.primarySource : "",
        backupQuantity: item.backupQuantity ? item.backupQuantity : 0,
        quantityShipped: item.quantityShipped ? item.quantityShipped : 0,
        quantityReturned: item.quantityReturned ? item.quantityReturned : 0,
        wellViewConsumption: item.wellNumber ? item.wellNumber : 0,
        rigReadyDate: item.rigReadyDate ? item.rigReadyDate : this.currentDate,
        vendor: item.vendor ? item.vendor : "",
        release: item.release ? item.release : "",
        status: item.status ? item.status : "",
        additionalComments: item.additionalComments ? item.additionalComments : "",
        sapDocNumber: item.sapDocNumber ? item.sapDocNumber : "",
        reconciledInSap: item.reconciledInSap ? item.reconciledInSap : "",
        specSheetDocumentCount: item.specSheetDocumentCount ? item.specSheetDocumentCount : 0,
        cvxPoDocumentCount: item.cvxPoDocumentCount ? item.cvxPoDocumentCount : 0,
        buildPriorityNumber: item.buildPriorityNumber ? item.buildPriorityNumber : 0,
        sectionId: item.sectionId ? item.sectionId : 0,
        sectionName: item.sectionName ? item.sectionName : "",
        sortOrder: item.sortOrder ? item.sortOrder : 0,
        primaryBackupFt: item.primaryBackupFt ? item.primaryBackupFt : 0,
        mcComments: item.mcComments ? item.mcComments : "",
        componentTypeId: item.componentTypeId ? item.componentTypeId : 0,
        componentTypeName: item.componentTypeName ? item.componentTypeName : "",
        userId: + this.userDetails.uid,

      };
    });

    // Call the service to save the data
    this.thorSubscription = this.thorService.upsertThorCompletionMaterials(this.savedData).subscribe({
      next: (response) => {
        this.spinner.show();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Updated Successfully' });
        this.getThorCompletionWells();
        this.editedRowsData = [];
        this.commonService.editedRowsData = [];
        this.commonService.addedData = [];
        this.spinner.hide();

      },
      error: (error) => {
        this.spinner.hide();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error });
        console.error('Error saving data:', error);
      }
    });
  }

  goToSchematic() {
    const id = this.schematicIdCompletions;
    if (id) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree([`${routeLinks.schematicDetail}/${id}`])
      );
      window.open(`${window.location.origin}${url}`, '_blank'); // Open the URL in a new tab
    } else {
      console.error('Schematic ID is not available in the service.');
    }
  }

  resetThorGrid() {
    this.getThorCompletionWells();
    this.editedRowsData = [];
    this.commonService.editedRowsData = [];
  }

  updateNoRowsOverlay() {
    if (!this.gridApi) {
      return;
    }
    if (!this.thorWellsData || this.thorWellsData.length === 0) {
      this.gridApi.showNoRowsOverlay();
    } else {
      this.gridApi.hideOverlay();
    }
  }
  onResetState() {
    this.gridStateService.resetState();
  }

  uploadedFileType(event : any) {
    this.isCVXPODocumentUploaded = false;
    
    if(event === true) {
      this.isCVXPODocumentUploaded = true;
    }
    
  }
  // download(){

  // }

}
