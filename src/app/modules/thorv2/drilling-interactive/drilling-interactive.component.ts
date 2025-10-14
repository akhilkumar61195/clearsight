import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { GridApi, GridOptions, IDetailCellRendererParams, SideBarDef } from 'ag-grid-community';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable, Subscription } from 'rxjs';
import _ from 'lodash';
import { AuthService, MasterService } from '../../../services';
import { AccessControls, thorDrillingHeaders } from '../../../common/constant';
import { LookupsService } from '../../../services/lookups.service';
import { ProjectsDto } from '../../../common/model/wells-dto';
import { CommonService } from '../../../services/common.service';
import { CustomUploadButton } from '../customUploadButton.component';
import { DocumentEntityTypes } from '../../../common/enum/document-entity-types';
import { ThorService } from '../../../services/thor.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LookupKeys } from '../../../common/enum/lookup-keys';
import { InventoryService } from '../../../services/inventory.service';
import { MessageService } from 'primeng/api';
import { ThorDrillingMaterials } from '../../../common/model/thor-drilling-materials';
import { LocaleTypeEnum, routeLinks } from '../../../common/enum/common-enum';
import { Router } from '@angular/router';
import { ThorSelectedWells } from '../../../common/model/thor-selected-wells';
import { OverlayPanel } from 'primeng/overlaypanel';
import { CustomerPersonalizationService } from '../../../services/customer-personalization.service';
import { GridStatePersistenceService } from '../../../common/builder/persistant-builder.service';
import { ResponsiveService } from '../../../services/responsive.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { SelectWellThorComponent } from '../select-well-thor/select-well-thor.component';
import { FileUploadWithButtonComponent } from '../../common/file-upload-interactive-dialog/file-upload-interactive-dialog.component';
import { ChatComponent } from '../../common/chat/chat.component';
import { AddEquipmentDialogComponent } from '../../common/addEquipmentDialog/addEquipmentDialog.component';
import { ChangeLogComponent } from '../../common/dialog/change-log.component';

@Component({
  selector: 'app-drilling-interactive',
  standalone: true,
  imports: [...PRIME_IMPORTS,
    SelectWellThorComponent,
    FileUploadWithButtonComponent,
    ChatComponent,
    AddEquipmentDialogComponent,
    ChangeLogComponent
  ],
  templateUrl: './drilling-interactive.component.html',
  styleUrl: './drilling-interactive.component.scss'
})
export class DrillingInteractiveComponent implements OnInit, OnDestroy {
  //Grid Options
  display: boolean = true;
  displayfileUploadInteractiveDialog: boolean = false;
  subscription: Subscription;
  isFilterBTNDisabled: boolean = false;
  gridOptions: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  totalRecords: number = 0;
  projects: ProjectsDto[] = [];
  selectedProjectId: number | null = null;
  selectedWellId: number | null = null;
  selectedWellNumber: number | null = null;
  selectedwellName: string | null = null;
  wells: any[] = [];
  selectedProject: any[] = [];
  thorWellsData: any[] = [];
  quickFilterText: string = '';
  functionId: number = 1;
  appId: number = 2;
  isWellSelected: boolean = false;
  masterDataColumnDefs = [];
  isWellChanged: boolean = false;
  maxProjectSelection: number = 5;
  maxWellSelection: number = 5;
  searchWell: string;
  allLookUpData: any;
  searchTerm: string = '';
  uploaddata: any;
  wellDocumentTypes: any;
  selectedView: number;
  entityType: string;
  entityName: string = thorDrillingHeaders;
  openChangeLog: boolean = false;
  openUploadDialog: boolean = false;
  currentEntityId: number = 0;
  entityId: number;
  isUpdateEditable: boolean = true;
  selectedDocument: string;
  addEquipmentForm!: FormGroup;
  displayEquipmentDialog: boolean = false;
  showEquipmentAddDialog: boolean = false;
  selectedEntity: string = "";
  noRowsFound: boolean = false;
  isPageView: boolean = false;
  private gridApi!: GridApi;
  loading: boolean = false;
  materialShortDescListFiltered: any[] = [];
  height$: Observable<string>;
  othersData: string = 'MATERIAL,MATERIAL_CVX_PO,MATERIAL_SPEC_SHEET'
  viewOptions = [{ label: 'Drilling', value: 1 },
  { label: 'Completions', value: 2 }];
  wellDetails: {
    id: number;
    wellNumber: number;
    wellName: string;
    appId: number;
    functionId: number;
  } | null = null;

  materialTypeList: { label: string; value: string }[] = [];
  holeSelectionList: { label: string; value: string }[] = [];
  hsTypeList: { label: string; value: string }[] = [];
  uomList: { label: string; value: string }[] = [];
  editedRowsData: ThorDrillingMaterials[] = [];
  addedData: ThorDrillingMaterials[] = [];
  savedData: ThorDrillingMaterials[] = [];
  thorSelectedWell: ThorSelectedWells;
  displayValidationDialog: boolean = false;
  @ViewChild('overlayAddEquipment') overlayAddEquipment: OverlayPanel;
  currentRowForOverLayPanel: any;
  hasDoc: boolean;
  userDetails: any;
  pageNumber: number = 1;
  pageSize: number = 100;
  totalRecordsD: number = 0;
  drillingMaterials: ThorDrillingMaterials[] = [];
  intervalId: any;
  isChatEnabled: boolean = false; // Flag to control chat visibility
  readonly stateKey = 'Thor - Drilling';
  cachedGridState: any;
  cachedContextData: any;
  hasRestoredPersonalization = false;
  isCVXPODocumentUploaded = false;
  roomName: string = 'THOR';
  isAddEquipmentEditable: boolean = false; // disabling edit in thor for addEquipment dialog
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
        headerName: 'Item',
        field: 'itemNumber',
        minWidth: 100,
        filter: true,
        editable: this.authService.isFieldEditable('itemNumber'), // Make it non-editable as it's updated dynamically
        sortable: true,
        pinned: true,
        valueFormatter: (params) => {
          const { itemLetter, itemNumber } = params.data || {}; // Safely extract data
          return itemLetter && itemNumber !== undefined
            ? `${itemLetter}${itemNumber}` // Concatenate itemLetter and itemNumber
            : ''; // Return an empty string if data is missing
        }
      },
      {
        headerName: 'Hole Section',
        field: 'holeSection',
        cellEditor: 'agSelectCellEditor',
        valueFormatter: (params) => {
          const item = this.holeSelectionList.find((item) => item.value === params.value);
          return item ? item.label : null;
        },
        cellEditorParams: () => {
          return {
            values: this.holeSelectionList.map((item) => item.value),
          };
        },
        editable: this.authService.isFieldEditable('holeSection'),
        minWidth: 130,
        filter: true,
        sortable: true,
        pinned: true,
        onCellValueChanged: (params) => {
          if (params.oldValue !== params.newValue) {
            this.handleHoleSectionChange(params);
          }
        },
      },
      {
        headerName: 'Hole Section Type', field: 'hstype', editable: this.authService.isFieldEditable('hstype'), sortable: true, filter: true, pinned: true,
        cellEditor: 'agSelectCellEditor',
        valueFormatter: (params) => {
          const item = this.hsTypeList.find(item => item.value === params.value);
          return item ? item.label : null;
        },
        cellEditorParams: () => {
          return {
            values: this.hsTypeList.map(item => item.value),
          };
        },
      },
      /*{ headerName: 'Assembly/Component', field: 'type', editable: false, sortable: true, minWidth: 200, filter: true, hide: true},*/
      {
        headerName: 'Component Type', field: 'materialType',
        cellEditor: 'agSelectCellEditor',
        valueFormatter: (params) => {
          const item = this.materialTypeList.find(item => item.value === params.value);
          return item ? item.label : null;
        },
        cellEditorParams: () => {
          return {
            values: this.materialTypeList.map(item => item.value),
          };
        },
        editable: this.authService.isFieldEditable('materialType'), sortable: true, minWidth: 100, filter: true, pinned: true
      },
      {
        headerName: 'Material Description', field: 'materialShortDesc', editable: this.authService.isFieldEditable('materialShortDesc'), sortable: true, minWidth: 260, filter: true, pinned: true,
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true,
      },
      { headerName: 'Material ID', field: 'materialId', editable: false, sortable: true, filter: true, pinned: true },
      {
        headerName: 'Spec Sheet',
        cellRenderer: CustomUploadButton,
        minWidth: 160,
        sortable: true,
        cellRendererParams: {

          onClick: (data: any) => {
            this.openUploadDialogBox(this.othersData, data, DocumentEntityTypes.SPEC_SHEET);
          },
          additionalParam: 'SpecSheet'
        },
        suppressHeaderMenuButton: true
      },
      {
        headerName: 'Other Documents',
        cellRenderer: CustomUploadButton,
        cellRendererParams: {
          // onClick: (data: any) => this.openUploadDialogBox(this.othersData, data),

          onClick: (data: any, hasDoc: boolean) => {
            this.hasDoc = hasDoc;
            if (this.hasDoc) {
              this.openUploadDialogBox(this.othersData, data);
            } else {
              const updatedData = { ...data, additionalParam: 'Others' };
              this.onCellClick(updatedData);
            }


          },
          additionalParam: 'Others'
        },
        sortable: false,
        suppressHeaderMenuButton: true
      },

      {
        headerName: 'Design Comment', field: 'designComment',
        cellEditor: "agLargeTextCellEditor",
        cellEditorPopup: false,
        wrapText: true,
        autoHeight: true,
        cellStyle: { 'white-space': 'pre', 'line-height': '1.25', 'align-content': 'center' },
        minWidth: 220, editable: this.authService.isFieldEditable('designComment'), sortable: true, filter: true
      },
      { headerName: 'Manufacturer Part #', field: 'manufacturerPart', minWidth: 200, editable: this.authService.isFieldEditable('manufacturerPart'), sortable: true, filter: true },
      { headerName: 'Serial #', field: 'serialNumber', sortable: true, editable: this.authService.isFieldEditable('serialNumber'), minWidth: 150, filter: true },
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
      {
        headerName: 'Primary Qty', field: 'primaryQuantity', minWidth: 150, editable: this.authService.isFieldEditable('primaryQuantity'), sortable: true, filter: true,
        valueFormatter: this.formatNumber.bind(this)
      },
      {
        headerName: 'B/U Qty', field: 'backupQuantity', minWidth: 120, editable: this.authService.isFieldEditable('backupQuantity'), filter: true,
        valueFormatter: this.formatNumber.bind(this)
      },
      {
        headerName: 'Qty Shipped', field: 'quantityShipped', minWidth: 180, editable: this.authService.isFieldEditable('quantityShipped'), sortable: true, filter: true,
        valueFormatter: this.formatNumber.bind(this)
      },
      {
        headerName: 'Qty Returned', field: 'quantityReturned', editable: this.authService.isFieldEditable('quantityReturned'), sortable: true, minWidth: 180, filter: true,
        valueFormatter: this.formatNumber.bind(this)
      },
      {
        headerName: 'WellView Consumption', field: 'wellViewConsumption', minWidth: 240, editable: this.authService.isFieldEditable('wellViewConsumption'), sortable: true, filter: true,
        valueFormatter: this.formatNumber.bind(this)
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

            const normalizedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());


            if (params.oldValue !== normalizedDate.getTime()) {
              params.api.getRowNode(params.node.id).setDataValue('rigReadyDate', normalizedDate);
            }
          }
        }
      },
      { headerName: 'Business Partner', field: 'vendor', minWidth: 200, editable: false, sortable: true, filter: true },
      {
        headerName: 'CVX PO', cellRenderer: CustomUploadButton, minWidth: 200, editable: false,
        cellRendererParams: {

          onClick: (data: any) => this.openUploadDialogBox(this.othersData, data, DocumentEntityTypes.CVX_PO),
          additionalParam: 'Cvx'
        },
        sortable: false, suppressHeaderMenuButton: true

      },
      { headerName: 'Release #', field: 'release', editable: this.authService.isFieldEditable('release'), sortable: true, minWidth: 180, },
      {
        headerName: 'Status', field: 'status', editable: this.authService.isFieldEditable('status'), sortable: true, minWidth: 180,
        cellEditor: 'agSelectCellEditor',
      },
      {
        headerName: 'Additional Comments', field: 'additionalComments', editable: this.authService.isFieldEditable('additionalComments'), sortable: true, minWidth: 180,
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true,
      },
      {
        headerName: 'SAP Document #', field: 'sapDocNumber', editable: this.authService.isFieldEditable('sapDocNumber'), sortable: true, minWidth: 180,
        cellStyle: { backgroundColor: '#e1f5e6' },

        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true,
      },

      {
        headerName: 'Consumed In SAP', field: 'reconciledInSap', editable: false, sortable: true, minWidth: 180,
        cellStyle: { backgroundColor: '#e1f5e6' },
        cellRenderer: params => {
          const isChecked = params.value === 'Yes';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.className = 'custom-checkbox'
          input.checked = isChecked;
          input.disabled = !this.authService.isFieldEditable('reconciledInSap');
          input.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            const newValue = target.checked ? 'Yes' : 'No';
            params.setValue(newValue);
            if (target.checked) {
              this.messageService.add({
                severity: 'warn',
                summary: 'Consumed In SAP',
                detail: 'The demand will become 0 for ODIN and THOR if you check this.'
              });
            }
          });
          return input;
        },
        cellEditor: 'agCheckboxCellEditor',
        cellEditorParams: {
          selectAllOnFocus: true,
          values: ['Yes', 'No']
        }
      },
      // {
      //   headerName: 'MC Comments', field: 'McComments', editable: this.authService.isFieldEditable('McComments'), sortable: true, minWidth: 180,
      //   cellEditor: 'agLargeTextCellEditor',
      //   cellEditorPopup: true,
      //   cellStyle: { backgroundColor: '#e1f5e6' }
      // },
      //  { headerName: 'ERP Quantity Out', field: 'erpQtyOut', editable: this.authService.isFieldEditable('erpQtyOut'), sortable: true, minWidth: 180,
      //     cellStyle: { backgroundColor: '#e1f5e6' },

      //    },
      //   { headerName: 'ERP Quantity In', field: 'erpQtyIn', editable: this.authService.isFieldEditable('erpQtyIn'), sortable: true, minWidth: 180,
      //     cellStyle: { backgroundColor: '#e1f5e6' },
      //    },
      //   {
      //     headerName: 'Line Item Reconciled', field: 'lineItemReconciled', editable: false, sortable: true, minWidth: 180,
      //     cellStyle: { backgroundColor: '#e1f5e6' },
      //     cellRenderer: params => {
      //       const isChecked = params.value === 'Yes';
      //       const input = document.createElement('input');
      //       input.type = 'checkbox';
      //       input.className = 'custom-checkbox'
      //       input.checked = isChecked;
      //       input.disabled = !this.authService.isFieldEditable('lineItemReconciled');
      //       input.addEventListener('change', (event) => {
      //         const target = event.target as HTMLInputElement;
      //         const newValue = target.checked ? 'Yes' : 'No';
      //         params.setValue(newValue);
      //       });
      //       return input;
      //     },
      //     cellEditor: 'agCheckboxCellEditor',
      //     cellEditorParams: {
      //       selectAllOnFocus: true,
      //       values: ['Yes', 'No']
      //     }
      //   },
      //   {
      //   headerName: 'Date Reconciled',
      //   field: 'dateReconciled',
      //   minWidth: 180,
      //   editable: false,
      //   sortable: true,
      //   cellStyle: { backgroundColor: '#e1f5e6' },
      //   valueFormatter: (params) => {
      //     if (!params.value) return ''; // handle null/undefined
      //     const date = new Date(params.value);
      //     if (isNaN(date.getTime())) return ''; // invalid date
      //     const day = String(date.getDate()).padStart(2, '0');
      //     const month = String(date.getMonth() + 1).padStart(2, '0');
      //     const year = date.getFullYear();
      //     return `${day}/${month}/${year}`; // ✅ DD/MM/YYYY format
      //   }
      // },
    ];

  }

  constructor(
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
    private lookupService: LookupsService,
    private commonService: CommonService,
    private thorService: ThorService,
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private zone: NgZone,
    private gridStateService: GridStatePersistenceService,
    private personalizationService: CustomerPersonalizationService,
    private responsiveService: ResponsiveService,
    private authService: AuthService // Assuming you have an AuthService for authentication
  ) {
    this.userDetails = this.authService.getUserDetail(); // Get user details from AuthService
  }

  ngOnInit(): void {
    this.getUserDetails();
    this.getWellsForProjects();
    this.searchWells();
    this.displaySelectWell();
    this.initializeColumnDefs();
    // this.commonService.refreshSelectWell$.subscribe(() => {
    //   this.getWellsForProjects(); // refresh the select well on other wells and bypass wells //
    // });
    const existingWellDetails = this.commonService.getWellDetailsFilterData();
    if (existingWellDetails && existingWellDetails.id && existingWellDetails.id !== 0) {
      this.setWellDetails(existingWellDetails);
    }
    this.responsiveService.thorMediaQueries()
    this.height$ = this.responsiveService.getHeight$();
    // this.functionId = 1; // Added id 1 for default selection as it was vanishing after adding it into the tyr
    // this.commonService.openSidebar();

  }

  ngOnDestroy() {
    this.thorSubscription.unsubscribe();
  }
  /**
   *  it will get the user details from jwt token
   */
  getUserDetails() {
    let userAccess = this.authService.isAuthorized(AccessControls.THOR_DRILLING_ACCESS);
    this.commonService.setuserAccess(userAccess);
    this.isUpdateEditable = this.authService.isFieldEditable('showEquipment');
  }

  // saves the current state of the grid
  onSaveState() {
    this.gridStateService.saveStateOnDestroy(this.stateKey);
  }

  // initializes the grid options and column definitions
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.updateNoRowsOverlay(); // Check overlay when grid is ready
    this.gridStateService.initialize(params.api, this.userDetails.uid);
  }

  // Formats 
  formatNumber(params: any): string {
    return params.value != null
      ? new Intl.NumberFormat(LocaleTypeEnum.enUS, { maximumFractionDigits: 0 }).format(params.value)
      : '0';
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
        // ✅ Restore selected well from context
        if (context?.selectedWellId && context?.selectedWellNumber && context?.wellName) {
          this.setWellDetails({
            id: context.selectedWellId,
            wellNumber: context.selectedWellNumber,
            wellName: context.wellName,
            functionId: context.functionId || null,
          });
        }
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

  onCellClick(event) {
    if (event.colDef.headerName === 'Other Documents' && !this.hasDoc) {
      if (this.overlayAddEquipment && event.event) {
        this.overlayAddEquipment.show(event.event);
      }
    }
  }

  handleHoleSectionChange(params: any) {
    const wellNumber = this.selectedWellNumber; // Assuming you have wellNumber in the row data
    const holeSection = params.newValue.replace(/\\"/g, '"');
    // Call the API
    this.thorSubscription = this.thorService.getItemForHoleSection(wellNumber, holeSection).subscribe(
      (response) => {
        params.api.getRowNode(params.node.id).setDataValue('item', response);

      },
      (error) => {
        console.error('Error fetching item:', error);
      }
    );
  }

  // sets the well details based on the provided wellDetails object
  setWellDetails(wellDetails: any) {
    this.selectedWellId = wellDetails.id;
    this.selectedWellNumber = wellDetails.wellNumber;
    this.selectedwellName = wellDetails.wellName;
    this.functionId = wellDetails.functionId;
    this.getThorDrillingWells();
  }

  // displays the well selection dialog and subscribes to changes in well details
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

  // searches for wells based on the search term and applies the filter
  searchWells() {
    this.commonService.searchTerm$.subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.searchWellFilter();  // Re-apply the filter when the search term changes
    });

    this.commonService.filterApplied$.subscribe(() => {
      this.searchWellFilter();  // Trigger filter when event occurs
    });
  }

  getMaterialList(query: string = ''): void {
    const request = {
      searchTerms: query,
      sortDescending: true,
      rowsPerPage: 25,
      pageNumber: 1,
    };

    this.thorSubscription = this.inventoryService.getMaterials(request).subscribe({
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

  onViewSelectionChange(selectedOption: any) {
    this.functionId = selectedOption;
    if (this.functionId) {
      this.getWellsForProjects();
    }

  }

  initializeDropdowns() {
    this.loadLookupDropdown(LookupKeys.MaterialType, 'materialTypeList');
    this.loadLookupDropdown(LookupKeys.HoleSection, 'holeSelectionList');
    this.loadLookupDropdown(LookupKeys.HSType, 'hsTypeList');
    this.loadLookupDropdown(LookupKeys.UOM, 'uomList');
    // this.getMaterialList();

  }

  loadLookupDropdown(lookupKey: LookupKeys, listName: string) {
    this.thorSubscription = this.masterService.getLookupValues(lookupKey).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          let data = response.data.map((item: any) => ({
            label: item.LOOKUPDISPLAYTEXT || item.LOOKUPTEXT, // Display text
            value: item.LOOKUPTEXT                           // Actual value
          }));

          // Apply sorting only for 'holeSelectionList'
          if (listName === 'holeSelectionList') {
            data = data.sort((a, b) => {
              const extractLargestNumber = (str: string) => {
                const numbers = str.match(/\d+(\.\d+)?/g); // Extract all numbers (including decimals)
                return numbers ? Math.max(...numbers.map(Number)) : 0; // Return the largest number
              };

              const numA = extractLargestNumber(a.value);
              const numB = extractLargestNumber(b.value);
              return numB - numA;
            });
          }

          this[listName] = data;
        }
      },
      error: () => {
        console.error(`Failed to load lookup values for ${lookupKey}`);
        this[listName] = [];
      }
    });
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
        this.projects = []; // Clear old data to avoid stale display
      }
    );
  }

  openUploadDialogBox(documentEntityTypes: any, data?: any, selectedEntity?: any, selectedView?: any) {
    // this.selectedEntity=selectedEntity? selectedEntity:"";
    this.selectedEntity = selectedEntity || "";
    if (this.entityType !== documentEntityTypes) {
      this.selectedView = null; // Reset the selected view
    }
    this.getUserDetails();
    this.getWellDocumentTypes(documentEntityTypes, data, selectedView);
  }

  getWellDocumentTypes(entityType: any, data?: any, selectedView?: any) {
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
              // this.selectedView =documents[0].id;

              this.selectedView = selectedView ?? (documents.length > 0 ? documents[0].id : null);

              this.selectedEntity = "";

            }
            else {
              this.selectedView = selectedView ?? (this.wellDocumentTypes.length > 0 ? this.wellDocumentTypes[0].id : null);
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

  updateFilter() {
    // this.getUserDetails();
    if (this.selectedWellId && this.selectedProjectId) {
      this.roomName = 'THOR-' + this.selectedWellNumber + ' ' + this.selectedwellName;
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

      if (this.functionId === 2) {
        this.commonService.setFunctionIdThor(2);
        this.commonService.setWellDetailsFilterData(this.wellDetails);
        this.router.navigateByUrl(routeLinks.thor2Completions);
      } else {
        this.commonService.setWellDetailsFilterData(this.wellDetails);
        this.commonService.setFunctionIdThor(this.functionId);
        this.getThorDrillingWells();
      }
    } else {
      console.warn('No Well ID selected for filtering.');
    }
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

  // Method to fetch data from the server and update the grid with setInterval Infinate Scroll //
  getThorDrillingWells() {
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

  loadPagedThorWells() {
    if (this.loading) return;

    this.loading = true;
    const wellId = this.selectedWellId;

    this.thorService.getthorDrillingMaterialsPaged(wellId, this.pageNumber, this.pageSize)
      .subscribe({
        next: (response) => {
          this.spinner.hide();
          this.loading = false;

          const data = response.result?.data || [];
          this.totalRecords = response.result?.totalRecords || 0;

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
          // Refresh grid view with new data
          if (this.gridOptions?.api) {
            this.gridOptions.api.setRowData(this.thorWellsData); // optional
            this.gridOptions.api.refreshCells({ force: true }); // needed for custom renderer updates
          }
          this.isWellSelected = true;
          this.noRowsFound = false;
          this.display = false;

          this.initializeColumnDefs();
          this.initializeDropdowns();
          this.updateNoRowsOverlay();
          // call the getPersonalization method to apply any saved grid state
          if (this.pageNumber === 1 && !this.hasRestoredPersonalization) {
            setTimeout(() => this.getPersonalization(), 50);
          }
          if (data.length < this.pageSize) {
            clearInterval(this.intervalId); // No more pages left
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
          clearInterval(this.intervalId); // Stop on error
        }
      });
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

  sortByItem(data: any[]): any[] {
    return data.sort((a, b) => {
      if (a.item < b.item) return -1;
      if (a.item > b.item) return 1;
      return 0;
    });
  }

  toggleProjectWells(selectedValue: { wellId: number; projectId: number; wellNumber: number; wellName: string }) {
    if (selectedValue) {
      this.selectedProjectId = selectedValue.projectId;
      this.selectedWellId = selectedValue.wellId;
      this.selectedWellNumber = selectedValue.wellNumber;
      this.selectedwellName = selectedValue.wellName
    }
  }

  dateFormatter(params) {
    return new Date(params.value).toLocaleDateString('en-US');
  }

  onSearch(event: Event): void {
    const searchedWells = (event.target as HTMLInputElement).value.toLowerCase();
    this.quickFilterText = searchedWells; // Update the quick filter text
  }

  getRowClass(params) {
    return params.data.rowOrder === 0 ? 'bold-row' : '';
  }

  changeLog() {
    this.currentEntityId = this.wellDetails.wellNumber;
    this.openChangeLog = true;
  }

  onClose() {
    this.thorService.cachedDrillingMaterialsData = {};
    this.selectedDocument = "";
    this.selectedView = 0;
    this.entityId = 0;
    this.entityType = ""
    this.displayfileUploadInteractiveDialog = false;
    this.getThorDrillingWells();
    setTimeout(() => {
      this.gridOptions.api.setRowData(this.thorWellsData);
    }, 100); // slight delay to ensure data is ready

  }

  showEquipmentDialog() {

    this.showEquipmentAddDialog = true;
  }

  onAddSelected(selectedComponents: ThorDrillingMaterials[]) {
    const existingMaterialIds = new Set(this.thorWellsData.map(item => item.materialId));
    const newComponents: ThorDrillingMaterials[] = [];

    for (const component of selectedComponents) {
      if (existingMaterialIds.has(component.materialId)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Duplicate Material',
          detail: `Material ID ${component.materialId} already exists.`
        });
      } else {
        newComponents.push(component);
      }
    }
    if (newComponents.length > 0) {
      this.addedData = [...newComponents];
      this.thorWellsData = [...newComponents, ...this.thorWellsData];
      this.commonService.addedData = this.addedData;
      this.getUserDetails();
      this.initializeColumnDefs();
      this.initializeDropdowns();
      this.showEquipmentAddDialog = false;
      this.cdr.detectChanges();
    }
  }

  onClickSave() {
    const addedmissingFields = this.addedData.filter(
      item => (item.primaryQuantity !== undefined && item.primaryQuantity <= 0)
    )
    const missingFields = this.editedRowsData.filter(
      item =>
        !item.materialId ||
        !item.materialShortDesc ||
        (item.primaryQuantity !== undefined && item.primaryQuantity <= 0) // Validate primaryQuantity
    );

    if (missingFields.length > 0 || addedmissingFields.length > 0) {
      this.displayValidationDialog = true;

      const invalidRows = missingFields.map(item =>
        item.primaryQuantity !== undefined && item.primaryQuantity <= 0
          ? `Row with Material ID: ${item.materialId || 'N/A'} has invalid primaryQuantity`
          : null
      ).filter(Boolean);

      const errorDetail = `MM Id, Item Short Description, and valid Primary Quantity (> 0) are mandatory for all items.${invalidRows.length > 0 ? '\n' + invalidRows.join('\n') : ''
        }`;

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorDetail
      });
      return;
    }
    const mergedData = [...this.addedData, ...this.editedRowsData].reduce((unique, item) => {
      const existingItem = unique.find(
        uniqueItem => uniqueItem.item === item.item && uniqueItem.materialId === item.materialId
      );

      if (existingItem) {
        const hasEdits = JSON.stringify(existingItem) !== JSON.stringify(item);
        if (hasEdits) {
          const index = unique.indexOf(existingItem);
          unique[index] = { ...item }; // Replace with the updated row
        }
      } else {
        unique.push({ ...item }); // Add new unique rows
      }
      return unique;
    }, []);

    // Prepare data to save
    this.savedData = mergedData.map(item => {
      return {
        ...item,
        wellNumber: this.selectedWellNumber,
        wellId: this.selectedWellId,
        item: item.itemLetter + item.itemNumber,
        userId: + this.userDetails.uid,
      };
    });

    // Save data only if there are changes
    if (this.savedData.length > 0) {
      this.thorSubscription = this.thorService.upsertThorMaterials(this.savedData).subscribe({
        next: (response) => {
          this.thorService.cachedDrillingMaterialsData = {};
          this.spinner.show();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Updated Successfully'
          });
          this.getThorDrillingWells();
          this.editedRowsData = [];
          this.addedData = [];
          this.commonService.editedRowsData = [];
          this.commonService.addedData = [];
          this.spinner.hide();

        },
        error: (error) => {
          this.spinner.hide();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error
          });
          console.error('Error saving data:', error);
        }
      });
    } else {
      this.spinner.hide();
      this.messageService.add({
        severity: 'info',
        summary: 'No Changes',
        detail: 'No new or edited rows to save.'
      });
    }
  }

  resetThorGrid() {
    this.getThorDrillingWells();
    this.editedRowsData = [];
    this.addedData = [];
    this.commonService.editedRowsData = [];
    this.commonService.addedData = [];

  }

  joinChat() {
    this.isChatEnabled = true;
  }

  onLeaveChat() {
    this.isChatEnabled = false;
  }
  onResetState() {
    this.gridStateService.resetState();
  }

  uploadedFileType(event: any) {
    console.log(event);

    this.isCVXPODocumentUploaded = false;

    if (event === true) {
      this.isCVXPODocumentUploaded = true;
    }

  }

}
