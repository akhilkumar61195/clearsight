import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  ViewChild
} from '@angular/core';
import { InventoryService } from '../../../../services/inventory.service';
import { AuthService } from '../../../../services/auth.service';
import { RowSelectionOptions, SideBarDef } from 'ag-grid-community';
import { GridApi } from 'ag-grid-community';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LookupKeys } from '../../../../common/enum/lookup-keys';
import { MasterService } from '../../../../services';
import { ThorService } from '../../../../services/thor.service';
import { MaterialAttribute } from '../../../../common/model/MaterialAttribute';
import { ThorDrillingMaterials } from '../../../../common/model/thor-drilling-materials';
import { MessageService } from 'primeng/api';
import { ConfigurationValuesService } from '../../../../services/configuration-values.service';
import { ConfigurationValues } from '../../../../common/model/configuration-values';
import { GridStatePersistenceService } from '../../../../common/builder/persistant-builder.service';
import { CustomerPersonalizationService } from '../../../../services/customer-personalization.service';
import { Observable } from 'rxjs';
import { ResponsiveService } from '../../../../services/responsive.service';
import { AccessControls } from '../../../../common/constant';
import { CommonService } from '../../../../services/common.service';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { ListEditorComponent } from '../../../common/list-editor/list-editor.component';


/**
 * MDL Drilling Interactive Component
 * 
 * This component provides an interactive interface for managing drilling materials in the MDL (Master Data Library) system.
 * It features a comprehensive ag-Grid implementation with the following capabilities:
 * 
 * Key Features:
 * - Interactive data grid with sorting, filtering, and column management
 * - Row selection with multi-select capabilities
 * - Drag-and-drop row reordering for build priority management
 * - In-line cell editing for quick data modifications
 * - Add/Edit dialog for detailed material record management
 * - Global search functionality across all grid data
 * - Personalization settings persistence (column state, filters, sort)
 * - Responsive design with dynamic height adjustment
 * 
 * Data Management:
 * - Loads drilling materials from Thor service
 * - Supports CRUD operations on material attributes
 * - Integrates with lookup services for dropdown populations
 * - Handles UOM (Unit of Measurement) configurations
 * 
 * Grid Capabilities:
 * - 20+ column definitions for comprehensive material data display
 * - Editable cells with validation
 * - Custom row drag functionality for priority ordering
 * - State persistence across sessions
 * - Export and column management via sidebar
 * 
 * @author Generated Component
 * @version 1.0.0
 * @since 2024
 */
@Component({
  selector: 'app-mdl-drilling-interactive',
  standalone: true,
  imports: [...PRIME_IMPORTS,ListEditorComponent],
  templateUrl: './mdl-drilling-interactive.component.html',
  styleUrl: './mdl-drilling-interactive.component.scss',
  encapsulation: ViewEncapsulation.None,
})

export class MdlDrillingInteractiveComponent implements OnInit {

  // Component event emitters
  @Output() onClose = new EventEmitter<void>();
  @Output() addSelected = new EventEmitter<any>();
  @Input() assemblyData: any;
  
  // Search and grid properties
  searchComponents: string = '';
  private gridApi!: GridApi;
  rowHeight: number = 30;
  hasRestoredPersonalization = false;
  readonly stateKey = 'MDL - Drilling';
  
  // Grid configuration properties
  public rowSelection: RowSelectionOptions | "single" | "multiple" = {
    mode: "multiRow",
    checkboxes: true,
    headerCheckbox: true,
    enableClickSelection: false,
  };
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

  // Component state properties
  loading: boolean = false;
  userDetail: any;
  selectedRowData: any; // Used to pre-fill the dialog in edit mode
  materialRecords: any = [];
  totalRecords: number = 0;
  displayEquipmentDialog: boolean = false;
  quickFilterText: string = '';
  isAddRecordDisabled: boolean = true;

  // Form and dropdown properties
  addEquipmentForm!: FormGroup;
  materialShortDescListFiltered: any[] = [];
  height$: Observable<string>;
  vendorList: any[] = []; // Store vendor list
  uomList: Array<ConfigurationValues> = []; // UOM array property
  isEdit: boolean = false; // Flag to track if the form is in edit mode

  // Grid column definitions with editable cells and drag-drop functionality
  materialColumnDefs = [
    { headerName: 'ODIN Sequence', rowDrag: true, field: 'buildPriorityNumber', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable }, // Added row drag to make the list reorderable
    { headerName: 'Component Type12121', field: 'materialType', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Material Description', field: 'materialShortDesc', sortable: true, filter: true, minWidth: 180, editable: params => params.data.editable },
    { headerName: 'Material ID', field: 'materialId', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Market Unit Price', field: 'marketUnitPrice', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Tier', field: 'tier', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Hole Section', field: 'holeSection', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Hole Section Type', field: 'hsType', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Material Group', field: 'mGroup', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Nominal/Max OD (IN)', field: 'od', sortable: true, filter: true, minWidth: 200, editable: params => params.data.editable },
    { headerName: 'Wall Thickness', field: 'wall', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Weight (LB)', field: 'weight', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Material Grade', field: 'grade', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Connection', field: 'connection', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Manufacturer', field: 'vendor', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Supplier Part #', field: 'manufacturerNum', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Sour Service', field: 'sourService', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Manufacturer Name', field: 'manufacturerName', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    // Added column Unit Of Measurement
    { headerName: 'UoM (FT or EA)', field: 'uom', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    // Added column vendor SAP #
    { headerName: 'Manufacturer SAP #', field: 'vendorSapnumber', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
  ];

  // Grid options configuration
  gridOptions = {
    alwaysShowHorizontalScroll: true, // Always show horizontal scroll
    columnDefs: this.materialColumnDefs, // Column definitions
    rowData: this.materialRecords, // Data for the grid
    rowSelection: { type: 'multiple' }, // Allow multiple row selection
    overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Loading Data...</span>',
    overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No Rows to Show</span>',
  };

  /**
   * Component constructor - Dependency injection and initialization
   * Injects required services and sets user details
   * @param inventoryService - Service for inventory operations
   * @param authService - Service for authentication operations
   * @param fb - Angular FormBuilder for reactive forms
   * @param masterService - Service for master data operations
   * @param thorService - Service for Thor drilling materials operations
   * @param messageService - PrimeNG service for displaying messages
   * @param configurationValuesService - Service for configuration values
   * @param gridStateService - Service for grid state persistence
   * @param personalizationService - Service for user personalization
   * @param responsiveService - Service for responsive design
   */
  constructor(private inventoryService: InventoryService,
    private authService: AuthService,
    private fb: FormBuilder,
    private masterService: MasterService,
    private thorService: ThorService,
    private messageService: MessageService,
    private configurationValuesService: ConfigurationValuesService,
    private gridStateService: GridStatePersistenceService,
    private personalizationService: CustomerPersonalizationService,
    private responsiveService: ResponsiveService,
    private commonService: CommonService
  ) {
    this.userDetail = this.authService.getUserDetail();
  }

  /**
   * Angular lifecycle hook - Component initialization
   * Initializes the component by setting up the form, loading materials, and setting up responsive height
   */
  ngOnInit() {
    this.getUserDetails();
    this.initializeForm();
    this.loadMaterials(this.getPersonalization.bind(this));
    this.height$ = this.responsiveService.getHeight$();
  }

  /**
   * Angular lifecycle hook - Component cleanup
   * Saves the current grid state before component destruction for persistence
   */
  ngOnDestroy() {
    this.gridStateService.saveStateOnDestroy(this.stateKey);
  }

  /**
   *  it will get the user details from jwt token
   */
    getUserDetails(){
       let userAccess = this.authService.isAuthorized(AccessControls.MDL_DRILLING_ACCESS);
       this.commonService.setuserAccess(userAccess);
    }

  /**
   * Retrieves and applies user personalization settings for the component
   * Restores grid state including column state, filter model, and sort model
   */
  getPersonalization() {
    const userId = this.userDetail?.uid || 0;
    this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
      next: (res) => {
        const state = res?.result.appState ? JSON.parse(res.result.appState) : null;
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


  /**
   * Initializes the reactive form for adding/editing equipment records
   * Sets up form controls with validation rules and default values
   */
  initializeForm(): void {
    this.addEquipmentForm = this.fb.group({
      id: [0],
      item: [''],
      holeSection: ['', Validators.required],
      hsType: ['', Validators.required],
      mGroup: [''],
      materialType: ['', Validators.required],
      marketUnitPrice: [null],
      materialShortDesc: ['', Validators.required],
      tier: [''],
      materialId: ['', Validators.required],
      primaryQuantity: [''],
      od: [null],
      weight: [null],
      wall: [null],
      grade: [''],
      connection: [''],
      vendor: [''],
      sourservice: ['No'],
      manufacturerName: [''],
      manufacturerNum: ['', Validators.required],
      userid: [this.userDetail.uid],
      uoMid: [''],
      uom: [''],
      vendorSapnumber: ['']
    });
  }


  /**
   * Initializes all dropdown lists by loading lookup values from the master service
   * Loads material types, hole sections, UOM lists, and other dropdown options
   */
  initializeDropdowns() {
    this.loadLookupDropdown(LookupKeys.MaterialType, 'materialTypeList');
    this.loadLookupDropdown(LookupKeys.HoleSection, 'holeSelectionList');
    this.loadLookupDropdown(LookupKeys.HSType, 'hsTypeList');
    this.loadLookupDropdown(LookupKeys.UOM, 'uomList');
    this.loadLookupDropdown(LookupKeys.Group, 'groupList');
    this.loadLookupDropdown(LookupKeys.OD, 'odList');
    this.loadLookupDropdown(LookupKeys.Weight, 'weightList');
    this.loadLookupDropdown(LookupKeys.Grade, 'gradeList');
    this.loadLookupDropdown(LookupKeys.Connection, 'connectionList');
    this.loadLookupDropdown(LookupKeys.Vendor, 'vendorList');
    this.loadLookupDropdown(LookupKeys.sourService, 'sourList');
    this.getMaterialList();
    this.getUoM();
  }


  /**
   * Loads dropdown data from lookup service for a specific lookup key
   * @param lookupKey - The lookup key to fetch data for
   * @param listName - The property name to store the fetched data
   */
  loadLookupDropdown(lookupKey: LookupKeys, listName: string) {
    this.masterService.getLookupValues(lookupKey).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this[listName] = response.data.map((item: any) => ({
            label: item.LOOKUPDISPLAYTEXT || item.LOOKUPTEXT,  // Display text
            value: item.LOOKUPTEXT                             // Actual value
          }));
        }
      },
      error: () => {
        this[listName] = [];
      }
    });
  }

  /**
   * Fetches material list from inventory service with search functionality
   * @param query - Optional search query to filter materials
   */
  getMaterialList(query: string = ''): void {
    const request = {
      searchTerms: query,
      sortDescending: true,
      rowsPerPage: 25,
      pageNumber: 1,
    };

    this.inventoryService.getMaterials(request).subscribe({
      next: (response: any) => this.handleMaterialListResponse(response),
      error: () => this.handleMaterialListError(),
    });
  }

  /**
   * Handles successful response from material list API
   * Maps the response data to filtered material list for dropdowns
   * @param response - API response containing material data
   */
  private handleMaterialListResponse(response: any): void {

    this.materialShortDescListFiltered = response?.success && response?.data?.length > 0
      ? response.data.map((item: any) => ({
        label: item.materialShortDesc,
        value: item.materialId
      }))
      : [];
  }

  /**
   * Handles error response from material list API
   * Resets material list and total records on error
   */
  private handleMaterialListError(): void {
    this.totalRecords = 0;
    this.materialShortDescListFiltered = [];
  }


  /**
   * Callback function triggered when the ag-Grid is ready
   * Initializes grid API, auto-sizes columns, and sets up grid state persistence
   * @param params - Grid ready event parameters containing the grid API
   */
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridApi.autoSizeAllColumns();
    this.gridStateService.initialize(params.api, this.userDetail.uid);
  }

  /**
   * Loads material data from Thor service and initializes dropdowns
   * @param callBackFuntion - Optional callback function to execute after loading materials
   */
  loadMaterials(callBackFuntion?: any) {
    
    this.thorService.getMaterialAttribute().subscribe({
      next: (res: any) => {
        if (res.data.length > 0) {
          this.materialRecords = res.data;
          this.totalRecords = this.materialRecords.length;
          this.initializeDropdowns();
          if (callBackFuntion !== "" && typeof callBackFuntion !== 'string') {
            callBackFuntion();
          }
        }
      },
      error: (error) => {
        console.error('Error fetching materials:', error);
      }
    });
  }

  /**
   * Fetches the list of Units of Measurement (UoM) from the configuration values service
   * Populates the uomList array with available UoM options
   */
  getUoM() {
    this.configurationValuesService.getAllEntities('configvalue', 'UoM').subscribe({
      next: (response) => {
        this.uomList = response;
      },
      error: (error) => {
        console.error('Error fetching UoM list', error);
      }
    });
  }

  /**
   * Adds selected records from the grid to the drilling materials assembly
   * Maps selected grid rows to ThorDrillingMaterials objects and emits them
   */
  addRecord() {
    const selectedRows = this.gridApi.getSelectedRows();
    const selectedMaterials: MaterialAttribute[] = selectedRows.map(row => ({
      Eid: row.id,
      Id: 0,
      MaterialType: row.materialType || '',
      MaterialShortDesc: row.materialShortDesc || '',
      MaterialId: row.materialId || '',
      MarketUnitPrice: row.marketUnitPrice || 0,
      Tier: row.tier || '',
      HoleSection: row.holeSection || '',
      HsType: row.hsType || '',
      MGroup: row.mGroup || '',
      Od: row.od || 0,
      Wall: row.wall || 0,
      Weight: row.weight || 0,
      Grade: row.grade || '',
      Connection: row.connection || '',
      Vendor: row.vendor || '',
      ManufacturerNum: row.manufacturerNum || '',
      SourService: row.sourService || '',
      ManufacturerName: row.manufacturerName || '',
      uoMid: Number(row.uoMid || '0'),
      uom: row.uom || '',
      vendorSapnumber: row.vendorSapnumber || '',
      isOdinMaterial:row.isOdinMaterial
    }));

    if (selectedMaterials.length > 0) {
      let assemblyDataArray: ThorDrillingMaterials[] = [];

      const commonProperties = { ...this.assemblyData };
      const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

      assemblyDataArray = selectedMaterials.map(data => {
        const newAssembly = new ThorDrillingMaterials();
        for (const [key, value] of Object.entries(commonProperties)) {
          newAssembly[key] = value;
        }
        newAssembly.eid = data.Eid;
        newAssembly.id = data.Id;
        newAssembly.materialId = data.MaterialId;
        newAssembly.materialShortDesc = data.MaterialShortDesc;
        newAssembly.materialType = data.MaterialType;
        newAssembly.manufacturerPart = data.ManufacturerNum;
        newAssembly.designComment = '';
        newAssembly.serialNumber = '';
        newAssembly.uoM = '';
        newAssembly.primaryQuantity = 0;
        newAssembly.primarySource = '';
        newAssembly.holeSection = data.HoleSection;
        newAssembly.hstype = data.HsType;
        newAssembly.vendor = data.Vendor;
        newAssembly.backupQuantity = 0;
        newAssembly.quantityShipped = 0;
        newAssembly.quantityReturned = 0;
        newAssembly.wellViewConsumption = 0;
        newAssembly.rigReadyDate = currentDate;
        newAssembly.release = '';
        newAssembly.status = '';
        newAssembly.additionalComments = '';
        newAssembly.sapDocNumber = '';
        newAssembly.reconciledInSap = '';
        newAssembly.specSheetDocumentCount = 0;
        newAssembly.cvxPoDocumentCount = 0;
        newAssembly.buildPriorityNumber = 0;
        newAssembly.searchTerms = '';
        newAssembly.userId = 0;
        newAssembly.dateCreated = currentDate;
        newAssembly.uoMid = 0;
        newAssembly.uom = '';
        newAssembly.vendorSapnumber = '';
        return newAssembly;
      });
      this.addSelected.emit(assemblyDataArray);
    }
  }

  /**
   * Handles grid row selection changes
   * Enables/disables the Add Record button based on selection state
   * @param event - Selection change event from ag-Grid
   */
  onSelectionChanged(event: any) {
    const selectedRows = event.api.getSelectedRows();
    this.isAddRecordDisabled = selectedRows.length === 0; // If no rows are selected, disable the button
  }

  /**
   * Handles global search functionality for filtering grid data
   * Updates the quick filter text based on user input
   * @param event - Input event from search field
   */
  onSearch(event: Event): void {
    const searchedSchematic = (event.target as HTMLInputElement).value.toLowerCase();

    this.quickFilterText = searchedSchematic;
  }


  /**
   * Resets all filters, selections, and search criteria in the grid
   * Reloads material data and clears all applied filters
   * @param searchComponent - Reference to the search input element to clear
   */
  reset(searchComponent: HTMLInputElement) {
    this.loadMaterials();
    this.searchComponents = '';// Clear the input field
    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      this.gridApi.onFilterChanged();
      this.gridApi.deselectAll();
    }

    this.quickFilterText = '';
    // searchComponent.value = ''; // Clear the input field
  }
  /**
   * Opens the dialog for adding a new material record
   * Sets the display flag to show the equipment dialog
   */
  addNewRecord() {

    this.displayEquipmentDialog = true
  }

  /**
   * Closes the material add/edit dialog
   * Sets the display flag to hide the equipment dialog
   */
  closeDialog() {
    this.displayEquipmentDialog = false
  }
  /**
   * Saves a new material record using form data
   * Validates form data, calls Thor service to save, and handles success/error responses
   */
  addNewMaterial() {

    const formData = this.addEquipmentForm.value;
    if (formData.id == null || formData.id == undefined) {
      formData.id = 0; // Set ID to 0 for new record
    }
    formData.userId = parseInt(this.userDetail.uid, 10);
    this.thorService.saveMaterailAttribute(formData).subscribe(
      (response: MaterialAttribute) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record Added Successfully' });
        this.closeDialog();
        this.loadMaterials();
        this.addEquipmentForm.reset();
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill mandatory fields' });
        console.error('Error saving material', error);
      }
    );
  }

  /**
   * Opens the edit dialog with pre-populated data from selected row
   * Populates the form with the selected row's data for editing
   * @param event - The selected row data from the grid
   */
  OpenEditDialog(event: any) {
    this.selectedRowData = event;
    this.addEquipmentForm.patchValue({
      id: this.selectedRowData.id,
      materialType: this.selectedRowData.materialType,
      materialShortDesc: this.selectedRowData.materialShortDesc,
      materialId: this.selectedRowData.materialId,
      marketUnitPrice: this.selectedRowData.marketUnitPrice,
      tier: this.selectedRowData.tier,
      holeSection: this.selectedRowData.holeSection,
      hsType: this.selectedRowData.hsType,
      mGroup: this.selectedRowData.mGroup,
      od: this.selectedRowData.od,
      wall: this.selectedRowData.wall,
      weight: this.selectedRowData.weight,
      grade: this.selectedRowData.grade,
      connection: this.selectedRowData.connection,
      vendor: this.selectedRowData.vendor,
      manufacturerNum: this.selectedRowData.manufacturerNum,
      sourService: this.selectedRowData.sourService,
      manufacturerName: this.selectedRowData.manufacturerName,
      uoMid: this.selectedRowData.uoMid,
      uom: this.selectedRowData.uom,
      vendorSapnumber: this.selectedRowData.vendorSapnumber,
    });
    this.displayEquipmentDialog = true
  }

  /**
   * Handles the end of a row drag event in the grid
   * Updates the build priority number for each row based on its new position
   * Sorts the material records array by the updated build priority numbers
   * @param event - The row drag end event from ag-Grid
   */
  onRowDragEnd(event: any) {
    event.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
      if (rowNode) {
        rowNode.setDataValue('buildPriorityNumber', (index + 1));
      }
    });
    this.materialRecords = this.materialRecords.sort((a, b) => Number(a.buildPriorityNumber) - Number(b.buildPriorityNumber));
  }

  /**
   * Handles cell value changes in the grid
   * Refreshes grid cells and sets edit flag when data is modified
   * @param event - Cell value change event from ag-Grid
   */
  onCellValueChanged(event: any): void {
    this.gridApi.refreshCells();
    const rowNode = event.node.data;
    // const existingRecord = this.editedRecords.find((rec) => rec.materialId == rowNode.materialId);
    // if (!existingRecord) {
    //   this.editedRecords.push(rowNode);
    // }
    this.isEdit = true;
  }

  /**
   * Resets the grid to its original state
   * Reloads materials with personalization settings applied
   */
  resetGrid() {
    this.loadMaterials(this.getPersonalization.bind(this));
  }

  /**
   * Saves changes made to the grid
   * Reloads materials with personalization and resets edit flag
   */
  onSave() {
    this.loadMaterials(this.getPersonalization.bind(this));
    this.isEdit = false;
  }

  // reset the state of the component
  onResetState() {
    this.gridStateService.resetState();
  }
}
