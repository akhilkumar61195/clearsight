import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { InventoryService } from '../../../services/inventory.service';
import { MdlDataService } from '../../../services/mdl-data.service';
import { masterdatalibraryModel } from '../../../common/model/masterdatalibraryModel';
import { AuthService } from '../../../services/auth.service';
import { AccessControls, defaultRowNumber } from '../../../common/constant';
import { AgGridAngular } from 'ag-grid-angular';
import { RowSelectionOptions, SideBarDef } from 'ag-grid-community';
import { GridApi } from 'ag-grid-community';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LookupKeys } from '../../../common/enum/lookup-keys';
import { MasterService } from '../../../services';
import { ThorService } from '../../../services/thor.service';
import { MaterialAttribute } from '../../../common/model/MaterialAttribute';
import { ThorDrillingMaterials } from '../../../common/model/thor-drilling-materials';
import { MessageService } from 'primeng/api';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { ConfigurationValues } from '../../../common/model/configuration-values';
import { GridStatePersistenceService } from '../../../common/builder/persistant-builder.service';
import { CustomerPersonalizationService } from '../../../services/customer-personalization.service';
import { Observable } from 'rxjs';
import { ResponsiveService } from '../../../services/responsive.service';
import { CommonService } from '../../../services/common.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { MdlFileUploadComponent } from '../mdl-file-upload/mdl-file-upload.component';
import { FileStatusDialogComponent } from '../file-log-dialog/file-log-dialog.component';
import { ListEditorComponent } from '../list-editor/list-editor.component';
import { ListEditorBuilderService } from '../builders/list-editor-builder.service';




@Component({
  selector: 'app-addEquipmentDialog',
  standalone: true,
  imports: [...PRIME_IMPORTS, MdlFileUploadComponent, FileStatusDialogComponent, ListEditorComponent],
  templateUrl: './addEquipmentDialog.component.html',
  styleUrls: ['./addEquipmentDialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class AddEquipmentDialogComponent implements OnInit, OnDestroy {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  //Input and Outps for the dialog 
  filteredMaterials: Array<masterdatalibraryModel> = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() addSelected = new EventEmitter<any>();
  @Input() assemblyData: any;
  @Input() isPageView: boolean = true;
  @Input() isUpdateEditable: boolean = true; // Adding flag for checking the editability access
  @Input() isListEditable: boolean = true; // Adding flag for checking the list editor editability access
  @Input() isAddEquipmentEditable: boolean = true; // by default this dialog will be editable
  searchComponents: string = '';
  private gridApi!: GridApi;
  globalFilter: string = '';
  rows: number = defaultRowNumber;
  rowHeight: number = 30;
  hasRestoredPersonalization = false;
  readonly stateKey = 'MDL - Drilling';
  public rowSelection: RowSelectionOptions | "single" | "multiple" = {
    mode: "multiRow",
    checkboxes: true,
    headerCheckbox: true,
    enableClickSelection: false,
  };
  dialogHeader: string = 'Add Material'; // Adding the variable to toggle between edit/add material functionality
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
  sortField: string;
  sortOrder: number = 1;
  totalPages: number = 0;
  currentPage: number = 1; // Current active page
  pages: number[] = []; // Array to hold the page numbers
  loading: boolean = false;
  totalrecords: number;
  userDetail: any;
  // Use selectedRowData if you want to pre-fill the dialog
  selectedRowData: any;
  materialRecords: any = [];
  visible: boolean = true;
  selectedCvxCrwIds: [] = [];
  rowOffset: number = 1;
  fetchNextRows: number = 10;
  totalRecords: number = 0;
  first: any;
  displayEquipmentDialog: boolean = false;
  sortBy: string = 'auditId';
  quickFilterText: string = '';
  isAddRecordDisabled: boolean = true;
  pageNumber: number = 0;
  pageSize: number = 500;
  addEquipmentForm!: FormGroup;
  materialShortDescListFiltered: any[] = [];
  height$: Observable<string>;
  // items: any[] = [{ label: 'Option 1', value: 'Option 1' }, { label: 'Option 2', value: 'Option 2' }];
  // selectedItem!: string;
  newItem: string = '';

  vendorList: any[] = []; // Store vendor list
  selectedVendor!: string;
  dialogVisible: boolean = false;
  uomList: Array<ConfigurationValues> = []; // Add UOM array property
  unsavedChanges: boolean = false; // Track unsaved changes
  editedRecords: any[] = []; // Track edited records
  isEditableField: boolean = false; // To get the user access for editability
  displayUploadDialog: boolean = false;
  displayViewStatusDialog: boolean = false;// show/hide global view status dialog
  addEditHeaderText: string; // To set the header text of dialog based on add or edit   
  materialColumnDefs= [];
  gridOptions = {

    alwaysShowHorizontalScroll: true, // Always show horizontal scroll
    columnDefs: this.materialColumnDefs, // Column definitions
    rowData: this.materialRecords, // Data for the grid
    rowSelection: { type: 'multiple' }, // Allow multiple row selection
    overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Loading Data...</span>',
    overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No Rows to Show</span>',


  };
  addedRecords = [];
  constructor(private inventoryService: InventoryService,
    private mdlDataService: MdlDataService,
    private authService: AuthService,
    private fb: FormBuilder,
    private masterService: MasterService,
    private thorService: ThorService,
    private messageService: MessageService,
    private configurationValuesService: ConfigurationValuesService,
    private gridStateService: GridStatePersistenceService,
    private personalizationService: CustomerPersonalizationService,
    private responsiveService: ResponsiveService,
    private commonService: CommonService,
    private editorBuilderService: ListEditorBuilderService

  ) {

  }
  initializeColumnDefs() {
    this.materialColumnDefs = [
    {
      headerName: 'Inc in ODIN', field: 'isOdinMaterial', editable: false, hide: !this.isAddEquipmentEditable, sortable: true, minWidth: 180,
      cellStyle: { backgroundColor: '#e1f5e6' },
      cellRenderer: params => {
        const isChecked = params.value === 1;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'custom-checkbox'
        input.checked = isChecked;
        input.addEventListener('change', (event) => {
          const target = event.target as HTMLInputElement;
          const newValue = target.checked ? 1 : 0;
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
    { headerName: 'ODIN Sequence', hide: !this.isAddEquipmentEditable,rowDrag: true, field: 'buildPriorityNumber', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable }, // Added row drag to make the list reorderable
    { headerName: 'Component Type', field: 'materialType', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Material Description', field: 'materialShortDesc', sortable: true, filter: true, minWidth: 180, editable: params => params.data.editable },
    { headerName: 'Material ID', field: 'materialId', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Market Unit Price', field: 'marketUnitPrice', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Tier', field: 'tier', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Hole Section', field: 'holeSection', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Hole Section Type', field: 'hsType', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Material Group', field: 'mGroup', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
    { headerName: 'Nominal/Max OD (IN)', field: 'od', sortable: true, filter: true, minWidth: 200, editable: params => params.data.editable },
    { headerName: 'Wall Thickness (IN)', field: 'wall', sortable: true, filter: true, minWidth: 160, editable: params => params.data.editable },
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
  }
  ngOnDestroy(): void {
    // Reseeting the signal
    this.editorBuilderService.selectedFunctionId.set(-1);
  }

  ngOnInit() {
    this.initializeColumnDefs();
    this.dialogVisible = !this.isPageView;
    this.getUserDetails();
    // Setting default selection for drilling
    this.editorBuilderService.selectedFunctionId.set(1);
    this.initializeForm();
    this.loadMaterials(this.getPersonalization.bind(this));
    this.height$ = this.responsiveService.getHeight$();
  }

  /**
     *  it will get the user details from jwt token
     */
  getUserDetails() {
    this.userDetail = this.authService.getUserDetail();
    let userAccess = this.authService.isAuthorized(AccessControls.MDL_DRILLING_ACCESS);
    this.commonService.setuserAccess(userAccess);
    this.isEditableField = this.authService.isFieldEditable('isUpload');
  }

  // Save the grid state
  onSaveState() {
    this.gridStateService.saveStateOnDestroy(this.stateKey);
  }

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


  initializeForm(): void {
    this.addEquipmentForm = this.fb.group({
      id: [0],
      item: [''],
      holeSection: [''],
      hsType: [''],
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
      manufacturerNum: [''],
      userid: [this.userDetail.uid],
      uoMid: [null],
      uom: [''],
      isOdinMaterial: ['No'],
      vendorSapnumber: ['']
    });

    if (!this.isUpdateEditable) {
      this.addEquipmentForm.disable();
    }
  }

  // SAMPLE OF COMBO BOX LOGIC STARTS

  // onVendorChange(value: string) {
  //   this.addEquipmentForm.get('vendor')?.setValue(value); // Update FormControl manually
  // }
  // addNewVendor() {
  //   if (this.newItem.trim() !== '') {
  //     const newVendor = { label: this.newItem, value: this.newItem };
  //     this.vendorList.push(newVendor); // Add to vendor list
  //     this.selectedVendor = this.newItem; // Select newly added vendor
  //     this.addEquipmentForm.get('vendor')?.setValue(this.newItem);
  //     this.newItem = ''; // Clear input field
  //   }
  // }

  // SAMPLE OF COMBO BOX LOGIC ENDS

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

  private handleMaterialListResponse(response: any): void {

    this.materialShortDescListFiltered = response?.success && response?.data?.length > 0
      ? response.data.map((item: any) => ({
        label: item.materialShortDesc,
        value: item.materialId
      }))
      : [];
  }

  private handleMaterialListError(): void {
    this.totalRecords = 0;
    this.materialShortDescListFiltered = [];
  }

  // Optional: Example of a number formatter function
  numberFormatter(params) {
    return params.value ? params.value.toFixed(2) : '';
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
      // Conditionally hide/show after grid loads
    this.gridApi.setColumnVisible('isOdinMaterial', this.isAddEquipmentEditable);
    this.gridApi.autoSizeAllColumns();
    this.gridStateService.initialize(params.api, this.userDetail.uid);
  }

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
   * Fetches the list of Units of Measurement (UoM) from the configuration values service.
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
      isOdinMaterial: row.isOdinMaterial == 'No' ? false : true
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

  onSelectionChanged(event: any) {
    const selectedRows = event.api.getSelectedRows();
    this.isAddRecordDisabled = selectedRows.length === 0; // If no rows are selected, disable the button
  }

  //Global Search for  Add Components
  onSearch(event: Event): void {
    const searchedSchematic = (event.target as HTMLInputElement).value.toLowerCase();

    this.quickFilterText = searchedSchematic;
  }


  //Reset for Filters, Checkbox,Global Search Add Components
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
  addNewRecord() {
    this.addEditHeaderText = "Add New Material";
    this.displayEquipmentDialog = true
  }

  closeDialog() {
    this.displayEquipmentDialog = false
  }
  addNewMaterial() {

    const formData = this.addEquipmentForm.value;
    if (formData.id == null || formData.id == undefined) {
      formData.id = 0; // Set ID to 0 for new record
    }
    formData.userId = parseInt(this.userDetail.uid, 10);
    formData.isOdinMaterial = formData.isOdinMaterial == 'Yes' ? 1 : 0;
    this.thorService.saveMaterailAttribute(formData).subscribe(
      (response: MaterialAttribute) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record Added Successfully' });
        this.closeDialog();
        this.loadMaterials();
        this.addEquipmentForm.reset();
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error['error'] });
        console.error('Error saving material', error);
      }
    );
  }
  //Add Record Button enable/disable
  isAddRecordButtonDisabled(): boolean {
    const selectedRows = this.gridApi.getSelectedRows();
    return selectedRows.length === 0; // Disable if no rows selected
  }
  //close the Add Component Dialog Box
  cancelSchematic() {
    this.visible = false;
  }

  //Opens the Add Component Dialog Box in Edit mode
  // This function is called when a row is selected in the grid
  // It populates the form with the selected row's data and opens the dialog
  OpenEditDialog(event: any) {
    if (this.isAddEquipmentEditable) {
      this.selectedRowData = event;

      this.addEditHeaderText = "Edit Material";
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
        uoMid: Number(this.selectedRowData.uoMid),
        uom: this.selectedRowData.uom,
        vendorSapnumber: this.selectedRowData.vendorSapnumber,
        isOdinMaterial: this.selectedRowData.isOdinMaterial == 1 ? 'Yes' : 'No'
      });
      this.displayEquipmentDialog = true;

      // Added check for disabling the form based on user access
      if (!this.isUpdateEditable) {
        this.addEquipmentForm.disable();
      }
    }

  }

  /**
   * Handles the end of a row drag event.
   * Updates the build priority number for each row based on its new position.
   * @param event The row drag event.
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
    const existingRecord = this.editedRecords.find((rec) => rec.id == rowNode.id);
    if (!existingRecord) {
      this.editedRecords.push({ id: rowNode.id, buildPriorityNumber: rowNode.buildPriorityNumber });
    }
    this.unsavedChanges = true;
  }

  /**
   * Resets the grid to its original state
   * Reloads materials with personalization settings applied
   */
  resetGrid() {
    this.loadMaterials(this.getPersonalization.bind(this));
    this.unsavedChanges = false;
  }

  /**
   * Saves changes made to the grid
   * Reloads materials with personalization and resets edit flag
   */
  onSave() {
    this.mdlDataService.updateDrillingMaterialsBuildPriorityNumber(this.editedRecords).subscribe({
      next: (response) => {
        this.resetGrid();
      }
    });
  }
  onResetState() {
    this.gridStateService.resetState();
  }

  /** on Close upload dialog */
  closeUploadDialog() {
    this.displayUploadDialog = false;
    this.loadMaterials(this.getPersonalization.bind(this));
  }

  /** show upload dialog */
  showUploadDialog() {
    this.displayUploadDialog = true;
  }
}