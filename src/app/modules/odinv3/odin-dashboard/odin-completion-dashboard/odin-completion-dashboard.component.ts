import {
  Component,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { IOdinFilterPayloadStore, OdinAdvanceFilterAction, OdinAdvanceFilterActionType, READ_ODIN_ADVANCE_FILTER_ACTION_TYPE } from '../../../../common/ngrx-store';
import _ from 'lodash';
import { AccessControls, radioSummary } from '../../../../common/constant';
import {
  LocaleTypeEnum,
  routeLinks,
  SortOrder,
} from '../../../../common/enum/common-enum';
import { LookupKeys } from '../../../../common/enum/lookup-keys';
import { AuthService, MasterService } from '../../../../services';
import { InventoryService } from '../../../../services/inventory.service';
import { odinMoreFilterModel } from '../../../../common/model/odinMoreFilterModel';
import {
  FilterDDType,
} from '../../../../common/enum/odin-helper';
import { MessageService } from 'primeng/api';
import { DatePipe } from '@angular/common';
import { SideBarDef, ITooltipParams, FirstDataRenderedEvent, RowDataUpdatedEvent, IRowNode, ColDef, GridOptions } from 'ag-grid-community';

import { CustomHeaderGroup } from '../../odin-custom-headers/custom-header-group.component';
import { OdinV2Service } from '../../../../services/odinv2.service';
import { MdlDataService } from '../../../../services/mdl-data.service';
import { masterdatalibraryModelTable } from '../../../../common/model/masterdatalibraryModelTable';
import { Router } from '@angular/router';
import { CommonService } from '../../../../services/common.service';
import { WellService } from '../../../../services/well.service';
import { AdvanceFilterModel } from '../../../../common/model/AdvanceFilterModel';
import { LookupsService } from '../../../../services/lookups.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { OdinAssemblyModel } from '../../../../common/model/OdinAssemblyModel';
import { odinDemandTooltip } from '../../odin-custom-headers/odinDemandTooltip.component';
import { OdinOuterRibbonDto } from '../../../../common/model/OdinOuterRibbonDto';
import { OdinCommonService } from '../../services/odin-common.service';
import { GridStatePersistenceService } from '../../../../common/builder/persistant-builder.service'; // Grid state persistence service
import { CustomerPersonalizationService } from '../../../../services/customer-personalization.service'; // Customer personalization service
import { ResponsiveService } from '../../../../services/responsive.service';
import { OdinBalanceTooltipComponent } from '../../odin-custom-headers/odin-balance-tooltip.component';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { WellHeadersDialogComponent } from '../../../common/well-headers/well-headers.component';
import { ConfirmationDialogComponent } from '../../../common/confirmation-dialog/confirmation-dialog.component';
import { OdinCompletionsDashboardGridData } from '../../../../common/model/odin-completions-dashboard.model';
import { ConfigurationValuesService } from '../../../../services/configuration-values.service';
import { ConfigurationValues } from '../../../../common/model/configuration-values';
import { RadioSummaryDrilling } from '../../../../common/model/radio-summary-drilling.model';



@Component({
  selector: 'app-odin-completion-dashboard',
  standalone:true,
  imports:[...PRIME_IMPORTS,WellHeadersDialogComponent,ConfirmationDialogComponent],
  templateUrl: './odin-completion-dashboard.component.html',
  styleUrl: './odin-completion-dashboard.component.scss'
})
export class Odin3CompletionDashboardComponent implements OnDestroy {
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
  displayConfirmationComponentDialog: boolean = false;
  isAttributesExpanded: boolean = false;
  isConsigmentExpanded: boolean = false;
  isInventoryExpanded: boolean = false;
  isCommentExpanded: boolean = false;
  loading: boolean = false;
  gridOptions: GridOptions = {
    groupRemoveSingleChildren: true,
    groupAllowUnbalanced : true, // to ungroup blank supplier part numbers
    groupDisplayType: 'custom', // Display groups as rows
    // groupDefaultExpanded: 1, // Expands all groups by default
  };
  // autoGroupColumnDef: ColDef = {
  //     headerName: "Supplier Part #",
  //     field: "supplierPartNumber",
  //     minWidth: 160,
  //     cellRenderer: "agGroupCellRenderer",
  //     cellStyle: (params) => {
  //       return params.node?.group ? { 'font-weight': 'bold' } : { 'font-weight': 'normal' };
  //     }
  //   };
  columnDefs = [];
  globalFilter: string = '';
  //private gridApi!: GridApi;
  editedRecords: any[] = [];
  userDetail: any;
  @Output() sideBarVisible = new EventEmitter<any>();
  searchValue: string = '';
  wellsHeaderCols: any[];
  selectedWells: any;
  totalRecords: number = 0;
  assemblyData: Array<OdinAssemblyModel> = [];
  filteredAssemblyData: Array<OdinAssemblyModel> = [];
  assemblyTotalRecords: number = 0;
  selectedGroupColumns: any[];
  selectedHoleSectionColumns: any[];
  selectedHsTypeColumns: any[];
  selectedComponentTypeColumns: any[];
  selectedGradeColumns: any[];
  selectedOpenCloseColumns: any[];
  selectedActionsColumns: any[];
  selectedWeightColumns: any[];
  selectedConnectionColumns: any[];
  selectedSupplierColumns: any[];
  selectedStatusSummaryColumns: any[];
  selectedStatusSummaryFromList: any[];
  selectedMonthSummary: number = 12;
  selectedRadioSummaryColumns: RadioSummaryDrilling[] = radioSummary;
  selectedMonthsSummaryColumns: any[];
  selectedODColumns: any[];
  selectedSourServiceColumns: any[];
  tableData: OdinCompletionsDashboardGridData[];
  filterData: OdinCompletionsDashboardGridData[];
  groupSelected: string = '';
  componentTypeSelected: string = '';
  searchSelected: string = '';
  odSelected: string = '';
  sourServiceSelected: string = '';
  supplierSelected: string = '';
  weightsSelected: string = '';
  gradeSelected: string = '';
  connectionSelected: string = '';
  projectSelected: string = ''; // Project filter
  rowOffset: number = 1;
  fetchNextRows: number = 10;
  sortBy: string = 'id';
  sortDirection: string = SortOrder.DESC;
  selectedRadioSummary: any;
  selectedSummary: string = 'All';
  subscription: Subscription;
  filters: odinMoreFilterModel;
  gridConfig: any = {};
  unsavedChanges: boolean = false;
  hidePrimaryWellNumber: number = 0;
  hideContingencyWellNumber: number = 0;
  selectedPType: string = "P10";
  quickFilterText: string = '';
  functionId: number = 2;
  pageTitle: string = '';
  pageContent: string = '';
  buttonName: string = '';
  appId: number = 1;
  selectedFilterName: string = '';
  selectedInternalFilterName: string = '';
  selectedInternalFilterValues: string = '';
  hasRestoredPersonalization = false; // Flag to check if personalization has been restored
  height$: Observable<string>;
  // actionOptions = [
  //   { id: 1, label: "Divest", value: 336 },
  //   { id: 2, label: "Obsolete – Do Not Order", value: 337 },
  //   { id: 3, label: "Place New Order", value: 338 },
  //   { id: 4, label: "Remove From Dashboard", value: 339 },
  //   { id: 5, label: "Review with Team Lead", value: 340 },
  //   { id: 6, label: "Validate Inventory Quantities", value: 341 }
  // ];
  actionOptions:Array<ConfigurationValues> = []; // Lookup Action options from config values
  gridApi: any;
  isEdit: boolean = false;
  futureDate: any;
  selectedCategory: string[] = [];
  selectCategory: any[] = [];
  selectAll = [];
  selectedView: number = 2;
  viewOptionsButtons = [
    { label: 'Drilling', value: 1 },
    { label: 'Completion', value: 2 }
  ];
  pinnedBottomRowData: any;
  subtotalRow: any = {};
  newOrderDays: number = 180;
  backUpDays: number = 90;
  selectedRows: any[] = [];
  isButtonDisabled: boolean = true;
  runWhatIfURL: boolean = false;
  showWhatIfDialog: boolean = false;
  isRunAnalysisEnabled: boolean = false;
  showEditWellHeader: boolean = false;
  displayEditWellHeaders: boolean = false;
  wellMaterials: any;
  include_contingency: boolean = false;
  showContingency: boolean = false;
  userDetails: any;
  readonly stateKey = 'Odin - Completions'; // STATE KEY
  selectedInventory:number = 1; //1 for SAP Inventory, 2 for Yard Inventory
  projects: any[] | undefined; // Projects for the dropdown

  odinFilteredDropDownValue = {
    componentTypeName: [],
    groupName: [],
    nominalOD1: [],
    organizationName: [],
    weight1: [],
    materialGradePrimary: [],
    topConnection: [],
    project:[] // Added project filter
  };
  private odinCommonServicesubscription: Subscription;
  // Subscription to manage observable and avoid memory leaks
  private odinCompletionsSubscription: Subscription = new Subscription();
  selectedScenario: number = 0;
  columnsExpanion: Array<{ id: string | number, expanded: boolean }> = [];
  constructor(
    private messageService: MessageService,
    private datePipe: DatePipe,
    private commonService: CommonService,
    private masterService: MasterService,
    private mdlDataService: MdlDataService,
    private odinV2Service: OdinV2Service,
    private inventoryService: InventoryService,
    private lookupService: LookupsService,
    private wellservice: WellService,
    private authService: AuthService,
    private router: Router,
    private odinCommonService: OdinCommonService,
    private gridStateService: GridStatePersistenceService, // Grid state persistence service
    private personalizationService: CustomerPersonalizationService, // Customer personalization service
    private spinner: NgxSpinnerService,
    private responsiveService: ResponsiveService,
    private configurationValuesService: ConfigurationValuesService,
    private store: Store<{ readOdinAdvanceFilterData: IOdinFilterPayloadStore }>,
    private odinStore: Store<{ odinAdvanceFilterData: IOdinFilterPayloadStore }>
  ) {
    this.userDetails = this.authService.getUserDetail(); // Get user details from AuthService

  }

  ngOnInit() {
    this.sendCompletionFunction();
    this.userDetail = this.authService.getUserDetail();
    this.getUserDetails();
    this.getActions(); // Fetch action options from config values
    this.getOuterRibbonPersonalization(); // Get personalization data for outer ribbon
    this.selectedWells?.length ? this.selectedCategory = ['All', 'P', 'C'] : [];
    //this.getWellMaterials();
    this.loadWellPageData();
    this.getProjects(); // Fetch projects for the dropdown
    this.odinCommonServicesubscription = this.odinCommonService.outerRibbonDto$.subscribe((payload) => {
      this.onOuterRibbonSelectionChange(payload.payload, payload.key);
    });
    this.responsiveService.odinCompletionMediaQuerry();
    this.height$ = this.responsiveService.getHeight$();
  }

/**
   *  it will get the user details from jwt token
   */
     getUserDetails(){
       let userAccess =  this.authService.isAuthorized(AccessControls.ODIN_COMPLETION_ACCESS);
       this.commonService.setuserAccess(userAccess);
    }
    
    /**
     * Fetch action options from configuration values
     */
  getActions() {
    this.configurationValuesService.getAllEntities('configvalue','ActionMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.actionOptions = response;
      },
      error: (error) => {
        console.error('Error fetching Groups', error);
      }
    });
  }

// Fetch projects for the dropdown
getProjects() {
  this.odinCompletionsSubscription = this.lookupService.getProjects().subscribe(data => {
    this.projects = data.map(resp => ({
      text: resp.projectDesc,   // <-- Changed from label to text
      value: resp.projectName // <-- Changed from id to value
    }));
  });
}
  sendCompletionFunction() {
    this.odinCommonService.emitFunction(2);
  }

  /**
   * Gets the outer ribbon personalization data for the drilling dashboard.
   */
    getOuterRibbonPersonalization() {
      const userId = this.userDetails?.uid || 0;

      this.odinCompletionsSubscription = this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
        next: (res) => {
          const state = res?.result.appState ? JSON.parse(res.result.appState) : null;
          const contextData = res?.result?.contextData;
          const context = typeof contextData === 'string' ? JSON.parse(contextData) : contextData;
          this.restoreOuterRibbonState(context, state);     // Restore the outer ribbon state 
        },
        error: (err) => {
          console.warn('No personalization found or failed to load.', err);
        },
      });
    }

  /**
   * Restores the outer ribbon state for the drilling dashboard.
   * @param context The context data containing the state information.
   * @param state The overall state object.
   */
  restoreOuterRibbonState(context: any, state: any) {
  // Restore outer ribbon state
  const outerRibbonDto: OdinOuterRibbonDto = {
      month: context.selectedMonthSummary || this.selectedMonthSummary,
      pType: context.selectedPType || this.selectedPType,
      showContingency: context.showContingency || this.showContingency,
      whatIf: context.whatIf || this.runWhatIfURL, // Assuming whatIf is false for drilling dashboard
      SelectedProjects: context.selectedProjects || this.projectSelected,
      SelectedWells: context.selectedWells || this.selectedWells,
      SelectedInventory: context.selectedInventory || this.selectedInventory, // 1 for SAP Inventory, 2 for Yard Inventory
      SelectedScenario: context.selectedScenario ? context.selectedScenario : 0,
    };  
    this.odinCommonService.setOuterRibbonDto(outerRibbonDto,'odinCompletion');
    this.selectedMonthSummary = this.odinCommonService.getOuterRibbonDto().payload?.month;
    this.selectedPType = this.odinCommonService.getOuterRibbonDto().payload?.pType;
    this.runWhatIfURL = this.odinCommonService.getOuterRibbonDto().payload?.whatIf;
    this.selectedScenario = this.odinCommonService.getOuterRibbonDto().payload?.SelectedScenario;
    this.showContingency = this.odinCommonService.getOuterRibbonDto().payload?.showContingency;
    this.selectedWells = this.odinCommonService.getOuterRibbonDto().payload?.SelectedWells;
    this.selectedInventory = this.odinCommonService.getOuterRibbonDto().payload?.SelectedInventory;
}

  // getLookUpData() {
  //   forkJoin({

  //     monthsCategory: this.masterService.getLookupValues(
  //       LookupKeys.MonthsSummary
  //     ),
  //     componentType: this.inventoryService.getComponentType(),
  //     grade: this.inventoryService.getMaterialGrade(),
  //     connection: this.inventoryService.getEndConnections(),
  //     vendor: this.inventoryService.getOrganization(),
  //     actions: this.masterService.getLookupValues(LookupKeys.Actions)

  //   }).subscribe((response: any) => {

  //     const {

  //       statusSummary,
  //       monthsCategory,
  //       componentType,
  //       grade,
  //       connection,
  //       vendor,
  //       actions

  //     } = response;

  //     if (componentType && componentType.length) {
  //       this.selectedComponentTypeColumns = componentType;
  //     }
  //     if (grade) {
  //       this.selectedGradeColumns = grade;
  //     }

  //     if (actions && actions.success) {
  //       this.selectedActionsColumns = actions.data;
  //     }
  //     if (connection) {

  //       this.selectedConnectionColumns = connection;
  //     }
  //     if (vendor) {

  //       this.selectedSupplierColumns = vendor;
  //     }
  //     if (statusSummary && statusSummary.success) {
  //       this.selectedStatusSummaryColumns = statusSummary.data;
  //     }

  //     if (monthsCategory && monthsCategory.success) {
  //       this.selectedMonthsSummaryColumns = monthsCategory.data;
  //       if (!this.selectedMonthSummary) this.selectedMonthSummary = 12;
  //     }
  //   });
  // }

  getLookUpDataFromTable() {

    if (this.tableData) {
      const groupData = this.getUniqueMaterialNumbers(this.tableData, 'groupName');
      this.selectedGroupColumns = groupData;
    }

    if (this.tableData) {

      const weightData = this.getUniqueMaterialNumbers(this.tableData, 'weight1');
      this.selectedWeightColumns = weightData;
    }

    if (this.tableData) {
      const odData = this.getUniqueMaterialNumbers(this.tableData, 'nominalOD1');
      this.selectedODColumns = odData;
    }


  }

  // Function to extract unique records and return them in key-value format for dropdown
  getUniqueMaterialNumbers(dataset: any[], fieldName: string): { text: string, value: string }[] {
    const uniqueRecordSet = new Set<string>();

    switch (fieldName) {
      case 'groupName':
        dataset.forEach(record => {
          if (record.groupName && record.groupName.trim() !== '') {
            uniqueRecordSet.add(record.groupName);
          }
        });
        break;
      case 'nominalOD1':
        dataset.forEach(record => {
          if (record.nominalOD1) {
            uniqueRecordSet.add(record.actualOD1);
          }
        });
        break;
      case 'weight1':
        dataset.forEach(record => {
          if (record.weight1) {
            uniqueRecordSet.add(record.weight1);
          }
        });
        break;
      default:
        break;
    }

    return Array.from(uniqueRecordSet).map(value => ({
      text: value,
      value: value
    }));
  }

  getWellMaterials() {
    this.loading = true;
    this.odinCompletionsSubscription = this.wellservice.GetAllOdinWellMaterialDemand(2).subscribe({
      next: (response: any) => {
        if (response) {
          this.wellMaterials = response.data;
          this.wellMaterials.filter((col: any) => {
            // for p-calendar, need Date with Object instead of String
            if (col.p10StartDate) { col.p10StartDate = new Date(col.p10StartDate); }
            if (col.p50StartDate) { col.p50StartDate = new Date(col.p50StartDate); }
          });
          this.getWellsHeaderData();
        }
      },
    });
  }

loadWellPageData() {
  this.loading = true;
  forkJoin({
    wellMaterials: this.wellservice.GetAllOdinWellMaterialDemand(2),
    wellsHeaders: this.wellservice.GetOdinWellHeaders(2),
    odinGrid: this.odinV2Service.GetOdin3CompletionDashboard(0, 500)
  }).subscribe({
    next: ({ wellMaterials, wellsHeaders, odinGrid }) => {
      // --- Well Materials ---
      if (wellMaterials?.data) {
        this.wellMaterials = wellMaterials.data;
        this.wellMaterials.forEach((col: any) => {
          if (col.p10StartDate) col.p10StartDate = new Date(col.p10StartDate);
          if (col.p50StartDate) col.p50StartDate = new Date(col.p50StartDate);
        });
      }

      // --- Wells Headers ---
      this.wellsHeaderCols = [];
      wellsHeaders.forEach((item: any) => {
        if (item && item.duplicity > 0) this.wellsHeaderCols.push(item);
      });
      this.wellsHeaderCols.forEach((col: any) => {
        if (col.p10StartDate) col.p10StartDate = new Date(col.p10StartDate);
        if (col.p50StartDate) col.p50StartDate = new Date(col.p50StartDate);
      });

      // --- Odin Grid ---
      if (odinGrid) {
        this.tableData = odinGrid;
        this.selectedWells?.length ? this.selectedCategory = ['All', 'P', 'C'] : [];          
        this.filterData = this.aggregateByMaterialId(this.tableData.map(item => ({ ...item })));
        this.totalRecords = this.filterData.length;
        this.addWellMaterialDemand();
        this.addCalculatedColumns();
        this.createWellColumns();
        this.getPersonalization();
      } else {
        this.totalRecords = 0;
        this.tableData = [];
        this.filterData = [];
      }

      // --- UI setup ---
      this.gridConfig.loading = false;
      this.loading = false;

      const scrollHeight = document.getElementsByClassName('p-datatable-flex-scrollable')[0];
      if (scrollHeight) {
        (scrollHeight as HTMLElement).style.height = 'calc(100vh - 274px)';
      }

      this.getUserDetails();
    },
    error: (err) => {
      console.error(err);
      this.gridConfig.loading = false;
      this.loading = false;
      this.totalRecords = 0;
      this.tableData = [];
      this.filterData = [];
    }
  });
}

  getWellsHeaderData() {
    this.wellsHeaderCols = [];
    this.odinCompletionsSubscription = this.wellservice.GetOdinWellHeaders(2).subscribe(data => {
      //this.lookupService.getWellsByProject(1, 2, whatIf).subscribe(data => {
      data.forEach((item) => {
        //if (item.wells) { this.wellsHeaderCols.push(...item.wells); }
        if (item && item.duplicity > 0) { this.wellsHeaderCols.push(item); }
      });
      this.wellsHeaderCols.filter((col: any) => {
        // for p-calendar, need Date with Object instead of String
        if (col.p10StartDate) {
          col.p10StartDate = new Date(col.p10StartDate);
        }
        if (col.p50StartDate) {
          col.p50StartDate = new Date(col.p50StartDate);
        }
      });
      //this.bindAssemblyData(); // Commented out as bound/unbound columns are getting fetched in odingriddata directly
      this.getOdinGridData(); // Fetching grid data after well headers are loaded
    });
  }

  // bindAssemblyData() {
  //   let assemblyPageSize: number = 3000;
  //   let assemblyPageNumber: number = 0
  //   this.loading = true; // Set loading state
  //   this.assemblyData = []; // Clear existing records
  //   this.odinV2Service.getAssembliesTotal().subscribe({
  //     next: (totalMaterials) => {
  //       const fetchPage = (pageNumber: number): void => {
  //         this.odinV2Service.getAssemblies(pageNumber, assemblyPageSize).subscribe({
  //           next: (data) => {
  //             if (data.data.length > 0) {
  //               this.assemblyData = [...this.assemblyData, ...data.data]; // Append new chunk of data
  //               this.filteredAssemblyData = [...this.assemblyData]; // Update filtered materials
  //               this.assemblyTotalRecords = this.filteredAssemblyData.length; // Update total record count
  //               // Fetch the next chunk if we haven't fetched all records
  //               if (this.assemblyTotalRecords < totalMaterials.data) {
  //                 fetchPage(pageNumber + 1);
  //               }
  //               else {
  //                 this.getOdinGridData();
  //               }
  //             }
  //           },
  //           error: (err) => {
  //             console.error('Error fetching assemblies data', err);
  //             this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error fetching assemblies data' });
  //             this.loading = false;
  //           }
  //         });
  //       };
  //       // Start fetching from the first page
  //       fetchPage(assemblyPageNumber);
  //     },
  //     error: (err) => {
  //       console.error('Error fetching total assemblies count', err);
  //       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error fetching assemblies count' });
  //       this.loading = false;
  //     }
  //   });
  // }

  getOdinGridData() {
    this.loading = true;
    this.odinCompletionsSubscription = this.odinV2Service.GetOdin3CompletionDashboard(0, 500).subscribe({
      next: (response: any) => {
        this.getUserDetails();
        this.gridConfig.loading = false;
        if (
          response
        ) {
          this.tableData = response;
          this.selectedWells?.length ? this.selectedCategory = ['All', 'P', 'C'] : [];          
          this.filterData = this.tableData.map(item => ({ ...item }));
          this.filterData = this.aggregateByMaterialId(this.filterData);
          this.totalRecords = this.filterData.length;
          this.addWellMaterialDemand();
          this.addCalculatedColumns();
          this.createWellColumns();
          this.getPersonalization();
          this.loading = false;
        } else {
          this.totalRecords = 0;
          this.tableData = [];
          this.filterData = [];
          this.loading = false;
        }

        if (document.getElementsByClassName('p-datatable-flex-scrollable').length > 0) {
          let scrollHeight: any = document.getElementsByClassName('p-datatable-flex-scrollable')[0];
          scrollHeight.style = 'height : calc(100vh - 274px)';
        }
      },
      error: () => {
        this.gridConfig.loading = false;
        this.totalRecords = 0;
        this.tableData = [];
        this.filterData = [];
        this.loading = false;
      },
    });
  }

  /**
   * Aggregates the input data by material ID.
   * @param data The input data array to aggregate.
   * @returns The aggregated data array.
   */
  aggregateByMaterialId(data: any[]): any[] {
    const aggregatedMap = new Map<string, any>();

    data.forEach(item => {
      const key = item.materialNumber;  

      if (!aggregatedMap.has(key)) {
        // Clone item so we don't mutate the original
        aggregatedMap.set(key, { ...item });
      } else {
        const existing = aggregatedMap.get(key);

        // Sum up numerical fields
        existing.cvxOwnedInventory = (existing.cvxOwnedInventory || 0) + (item.cvxOwnedInventory || 0);
        existing.yardInventory = (existing.yardInventory || 0) + (item.yardInventory || 0); // Aggregate Yard Inventory by material number
        existing.openOrders6 = (existing.openOrders6 || 0) + (item.openOrders6 || 0);
        existing.openOrders12 = (existing.openOrders12 || 0) + (item.openOrders12 || 0);
        existing.openOrders18 = (existing.openOrders18 || 0) + (item.openOrders18 || 0);
        existing.openOrders24 = (existing.openOrders24 || 0) + (item.openOrders24 || 0);
        existing.consignmentInventory6 = (existing.consignmentInventory6 || 0) + (item.consignmentInventory6 || 0);
        existing.consignmentInventory12 = (existing.consignmentInventory12 || 0) + (item.consignmentInventory12 || 0);
        existing.consignmentInventory18 = (existing.consignmentInventory18 || 0) + (item.consignmentInventory18 || 0);
        existing.consignmentInventory24 = (existing.consignmentInventory24 || 0) + (item.consignmentInventory24 || 0);
      }
    });

    return Array.from(aggregatedMap.values());
  }

  // Retrieves the latest personalization for the current user and applies it to the grid

  getPersonalization() {
  const userId = this.userDetails?.uid || 0;

  this.odinCompletionsSubscription = this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
    next: (res) => {
      const state = res?.result.appState ? JSON.parse(res.result.appState) : null;
      const contextData = res?.result?.contextData;
      const context = typeof contextData === 'string' ? JSON.parse(contextData) : contextData;

      // Restore grid state
      if (state && this.gridApi) {
        if (state.columnState) {
          // Get current column state to find well columns
          const currentColumns = this.gridApi.getColumnDefs();
          const wellColumns = currentColumns.filter((col: any) => {
            if (col.children && (col.children[0].field.includes('_primary'))) {
              return col.children;
            }
            return false;
          });
          let flattenedWellColumns = wellColumns.map((col: any) => col.children).flat();

          // Apply saved column state first
          this.gridApi.applyColumnState({ state: state.columnState, applyOrder: true });

          // If we have well columns and they're not in saved state, move them near a target column
          if (flattenedWellColumns.length > 0) {
            const moveToFront = flattenedWellColumns.filter(well =>
              !state.columnState.some(col => col.colId == well.colId)
            );

            if (moveToFront.length > 0) {
              // Dynamically find the target column
              const targetField = 'discrepancy'; // Replace with actual field or colId
              const targetIndex = state.columnState.findIndex(col =>
                col.field === targetField || col.colId === targetField
              );

              // If target column found, insert well columns before it
              if (targetIndex !== -1) {
                const newOrder = [
                  ...state.columnState.slice(0, targetIndex),
                  ...moveToFront,
                  ...state.columnState.slice(targetIndex)
                ];
                this.gridApi.applyColumnState({ state: newOrder, applyOrder: true });
              }
            }
          }
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

      this.hasRestoredPersonalization = true;

      const waitForTableData = () => {
        if (this.tableData?.length && this.tableData[0]?.totalPrimaryDemand !== undefined) {
          this.restoreGridState(context, state);
        } else {
          setTimeout(waitForTableData, 50);
        }
      };
      waitForTableData();
    },
    error: (err) => {
      console.warn('No personalization found or failed to load.', err);
    },
  });
}

  restoreGridState(context: any, state: any) {
    if (context?.filterType && context?.filterValue?.length) {
      // Set local filter variable so UI reflects it
      switch (context.filterType) {
        case 'componentTypeName':
          this.componentTypeSelected = context.filterValue;
          break;
        case 'groupName':
          this.groupSelected = context.filterValue;
          break;
        case 'nominalOD1':
          this.odSelected = context.filterValue;
          break;
        case 'organizationName':
          this.supplierSelected = context.filterValue;
          break;
        case 'weight1':
          this.weightsSelected = context.filterValue;
          break;
        case 'materialGradePrimary':
          this.gradeSelected = context.filterValue;
          break;
        case 'topConnection':
          this.connectionSelected = context.filterValue;
          break;
        case 'project':
          this.projectSelected = context.filterValue; // Project filter Selected
      }
      // ✅ Reapply that filter
      this.applyComponentTypeFilter(null,context.filterType);
    }
    // Restore grid column and sort/filter model
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

    this.hasRestoredPersonalization = true;
  }

  addWellMaterialDemand() {
    let isWhatIf = this.runWhatIfURL ? 1 : 0;
    let wellsHeaderCols = this.wellsHeaderCols?.filter(item => item.whatIf == isWhatIf && item.edition === this.selectedScenario);
    this.filterData?.forEach((item) => {
      item.wellMaterials = [];
      wellsHeaderCols?.forEach((well) => {
        let wellMaterial = this.wellMaterials?.find(w => w.id == well.wellId && w.materialId == item.materialNumber && w.whatIf == (this.runWhatIfURL ? 1 : 0));
        if (!wellMaterial || wellMaterial.length == 0) {
          // Create a new wellMaterial entry if it doesn't exist
          wellMaterial = {
            id: well.wellId,
            wellId: well.id,
            wellNumber: well.wellNumber,
            primaryQuantity: 0,
            contingentQuantity: 0,
            secondaryQuantity: 0,
            materialId: item.materialNumber,
            p10StartDate: well.p10StartDate,
            p50StartDate: well.p50StartDate,
            wellName: well.wellName,
            projectName: well.projectName,
            plantCode: well.plantCode
          };
        }
        //if (wellMaterial) { 
        item.wellMaterials.push(wellMaterial);
        //}
      });
      //item.wellMaterials = this.wellMaterials?.filter((w) => w.materialId == item.materialId);
    });
  }

  addCalculatedColumns() {
    const toNum = (v: any) => {
      const num = Number.isFinite(Number(v)) ? Number(v) : 0;
      return Math.round(num * 100) / 100;
    };
    let dateSelectedMonth: Date = new Date();
    dateSelectedMonth.setMonth(dateSelectedMonth.getMonth() + parseInt(this.selectedMonthSummary.toString()));
    this.filterData?.forEach((item) => {
      let totalPrimaryDemand = 0;
      let totalContingentDemand = 0;
      let totalSecondaryDemand = 0;
      item.totalPrimaryDemandTooltip = [];
      item.totalContingencyDemandTooltip = [];
      item.totalSecondaryDemandTooltip = [];
      item?.wellMaterials?.forEach((wellMaterial: any) => {
        let runOutDate = new Date(this.selectedPType == "P50" ? wellMaterial?.p50StartDate : wellMaterial?.p10StartDate);
        if (runOutDate < dateSelectedMonth && (this.projectSelected.length == 0 || this.projectSelected.includes(wellMaterial.projectName))) {
          totalPrimaryDemand = totalPrimaryDemand + (wellMaterial.primaryQuantity == null ? 0 : Number(wellMaterial.primaryQuantity));
          totalContingentDemand = totalContingentDemand + (wellMaterial.contingentQuantity == null ? 0 : Number(wellMaterial.contingentQuantity));
          totalSecondaryDemand = totalSecondaryDemand + (wellMaterial.secondaryQuantity == null ? 0 : Number(wellMaterial.secondaryQuantity));
          
          // Logic added to fill the tooltip objects
          item.materialId = wellMaterial.materialId;
          if (wellMaterial.primaryQuantity > 0) {
            item.totalPrimaryDemandTooltip.push({
              wellName: wellMaterial.wellName,
              demand: wellMaterial.primaryQuantity
            });
          }

          if (wellMaterial.contingentQuantity > 0) {
            item.totalContingencyDemandTooltip.push({
              wellName: wellMaterial.wellName,
              demand: wellMaterial.contingentQuantity
            });
          }

          if (wellMaterial.secondaryQuantity > 0) {
            item.totalSecondaryDemandTooltip.push({
              wellName: wellMaterial.wellName,
              demand: wellMaterial.secondaryQuantity
            });
          }
        }
      });

      item.totalPrimaryDemand = Math.round(totalPrimaryDemand);
      item.totalContingencyDemand = Math.round(totalContingentDemand);
      item.totalSecondaryDemand = Math.round(totalSecondaryDemand);

      // item.cvxOwnedInventory = item.generalAccount + item.jackStMalo + item.tahiti + item.bigFoot + item.blindFaith + item.anchor + item.ballymore + item.surplus;
      // item.cvxOwnedInventory = item.cvxOwnedInventory;

      // Calculate the total CVX owned inventory based on the selected inventory type
      // If overrideInventory is set and greater than 0, use that; otherwise, use cvxOwnedInventory or yardInventory
      let calculatedCvxOwnedInventory = (item.overrideInventory && item.overrideInventory) > 0 ? item.overrideInventory : this.selectedInventory == 1 ? item.cvxOwnedInventory || 0 : item.yardInventory || 0;
      calculatedCvxOwnedInventory = toNum(calculatedCvxOwnedInventory)
      
      // Calculate the balance based on the selected month and contingency
      if(!this.showContingency) {
        item.balance6 = Math.round((item.openOrders6 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory6 || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0));
        item.balance12 = Math.round((item.openOrders12 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory12 || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0));
        item.balance18 = Math.round((item.openOrders18 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory18 || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0));
        item.balance24 = Math.round((item.openOrders24 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory24 || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0));
      }
      else{        
        item.balance6 = Math.round((item.openOrders6 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory6 || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
        item.balance12 = Math.round((item.openOrders12 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory12 || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
        item.balance18 = Math.round((item.openOrders18 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory18 || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
        item.balance24 = Math.round((item.openOrders24 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory24 || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
      }
      
      // Adding the logic for objects of balance tooltip
      item.balanceInclCont6Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders6, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: { header: 'Consignment Inventory', value: item.consignmentInventory6, unit: '+'},
        requiredBackup: { header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: { header: 'Primary Demand', value: totalPrimaryDemand, unit: '-'},
        totalContingentDemand: { header: 'Contingency Demand', value: totalContingentDemand, unit: '-'}
      };
      item.balanceInclCont12Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders12, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: { header: 'Consignment Inventory', value: item.consignmentInventory12, unit: '+'},
        requiredBackup: { header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: { header: 'Primary Demand', value: totalPrimaryDemand, unit: '-'},
        totalContingentDemand: { header: 'Contingency Demand', value: totalContingentDemand, unit: '-'}
      };
      item.balanceInclCont18Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders18, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: { header: 'Consignment Inventory', value: item.consignmentInventory18, unit: '+'},
        requiredBackup: { header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: { header: 'Primary Demand', value: totalPrimaryDemand, unit: '-'},
        totalContingentDemand: { header: 'Contingency Demand', value: totalContingentDemand, unit: '-'}
      };
      item.balanceInclCont24Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders24, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: { header: 'Consignment Inventory', value: item.consignmentInventory24, unit: '+'},
        requiredBackup: { header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: { header: 'Primary Demand', value: totalPrimaryDemand, unit: '-'},
        totalContingentDemand: { header: 'Contingency Demand', value: totalContingentDemand, unit: '-'}
      };
    });
  }

  createWellColumns() {
    // Save the grid current state
    //this.gridStateService.saveStateOnDestroy(this.stateKey);
    //let wellsHeaderCols = this.wellsHeaderCols?.filter(item => item.whatIf == (this.runWhatIfURL ? 1 : 0));
    //filter wells based on selected Start Date
    let isWhatIf = this.runWhatIfURL ? 1 : 0;
    let wellsHeaderCols = this.wellsHeaderCols?.filter(item => item.whatIf == isWhatIf && item.edition === this.selectedScenario);
    let dateSelectedMonth: Date = new Date();
    dateSelectedMonth.setMonth(dateSelectedMonth.getMonth() + this.selectedMonthSummary);
    let filteredWellsHeaderCols = wellsHeaderCols?.filter((w) => this.selectedWells?.includes(w.wellId));

    if (this.selectedPType.toUpperCase() == "P10") {
      //sort wellheaders based on p10StartDate
      filteredWellsHeaderCols = filteredWellsHeaderCols?.sort((a, b) => {
        if (a.p10StartDate && b.p10StartDate) {
          return new Date(a.p10StartDate).getTime() - new Date(b.p10StartDate).getTime();
        }
        else {
          return 0;
        }
      });
    }
    else {
      //sort wellheaders based on p50StartDate
      filteredWellsHeaderCols = filteredWellsHeaderCols?.sort((a, b) => {
        if (a.p50StartDate && b.p50StartDate) {
          return new Date(a.p50StartDate).getTime() - new Date(b.p50StartDate).getTime();
        }
        else {
          return 0;
        }
      });
    }

    const wellColumns = filteredWellsHeaderCols?.map(well => {
      // Define the children dynamically based on the selected radio button
      const children = [];
      //if (this.selectedCategory.includes('All') && this.selectedCategory.includes('P')) {
      children.push({
        headerName: "Primary",
        field: `well${well.wellId}_primary`,
        valueGetter: (params) => params.data?.wellMaterials?.find(w => w.id == well.wellId)?.primaryQuantity || 0,
        valueSetter: (params) => {
          let wellMaterial = params.data.wellMaterials?.find(w => w.id == well.wellId);
          wellMaterial.primaryQuantity = params.newValue;
          return true;
        },
        cellRenderer: (params) => {
          // return params.value;
          const value = Math.floor(parseFloat(params.value)); // Convert to number and round down
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        cellStyle: params => {
          if (params.node.level === -1) { return { 'font-weight': 'bold' }; }
          else {
            // if only primary is shown then add border-right
            if (!this.selectedCategory.includes('C') && !this.selectedCategory.includes('S')) {
              return { 'border-right': '2px solid #000' };
            }
            else {
              return { 'border-right': '0px' };
            }
          }
        },
        minWidth: (!this.selectedCategory.includes('S') && !this.selectedCategory.includes('C') && this.selectedCategory.includes('P')) ? 210 : 110,
        editable: false,
        hide: !this.selectedCategory.includes('P'),
        filter: 'agNumberColumnFilter',
      });
      //}
      //if (this.selectedCategory.includes('All') && this.selectedCategory.includes('C')) {
      children.push({
        headerName: "Contingency",
        field: `well${well.wellId}_contingency`,
        valueGetter: (params) => params.data?.wellMaterials?.find(w => w.id == well.wellId)?.contingentQuantity || 0,
        valueSetter: (params) => {
          let wellMaterial = params.data.wellMaterials?.find(w => w.id == well.wellId);
          wellMaterial.contingentQuantity = params.newValue;
          return true;
        },
        cellRenderer: (params) => {
          //return params.value;
          const value = Math.floor(parseFloat(params.value)); // Convert to number and round down
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        cellStyle: params => {
          if (params.node.level === -1) { return { 'font-weight': 'bold' }; }
          else {
            // add border-right
            if (!this.selectedCategory.includes('S')) {
              return { 'border-right': '2px solid #000' };
            }
            else {
              return { 'border-right': '0px' };
            }
          }
        },
        minWidth: (!this.selectedCategory.includes('S') && !this.selectedCategory.includes('P') && this.selectedCategory.includes('C')) ? 210 : 130,
        editable: false,
        hide: !this.selectedCategory.includes('C'),
        filter: 'agNumberColumnFilter',
      });
      //}
      //if (this.selectedCategory.includes('All') && this.selectedCategory.includes('S')) {
      children.push({
        headerName: "Secondary",
        field: `well${well.wellNumber}_secondary`,
        valueGetter: (params) => params.data.wellMaterials?.find(w => w.wellNumber === well.wellNumber)?.secondaryQuantity || 0,
        valueSetter: (params) => {
          let wellMaterial = params.data.wellMaterials?.find(w => w.wellNumber === well.wellNumber);
          wellMaterial.secondaryQuantity = params.newValue;
          return true;
        },
        cellRenderer: (params) => {
          // if (params.node.rowPinned) {
          //   let total = 0;
          //   this.wellMaterials?.filter((w) => w.wellNumber == well.wellNumber).forEach((w) => {
          //     total += w.secondaryQuantity;
          //   });
          //   return total;
          // }
          // else { 
          //return params.value; 
          const value = Math.floor(parseFloat(params.value)); // Convert to number and round down
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          //}
        },
        cellStyle: params => {
          if (params.node.level === -1) { return { 'font-weight': 'bold' }; }
          else {
            // add border-right
            return { 'border-right': '2px solid #000' };
          }
        },
        minWidth: (!this.selectedCategory.includes('P') && !this.selectedCategory.includes('C') && this.selectedCategory.includes('S')) ? 210 : 130,
        editable: false,
        hide: !this.selectedCategory.includes('S'),
        filter: 'agNumberColumnFilter',
      });
      //}

      return {
        headerGroupComponent: CustomHeaderGroup,
        headerGroupComponentParams: {
          "WellDetails": well, "SelectedDateType": this.selectedPType,
          hideWellKit:true,
          onClick: (event: any) => {
            this.expandOrCollapse(event, event.type)
          },
          uniqueId: this.getIdType(well)
        },
        headerName: well["wellName"].toString(),
        field: well,
        minWidth: 150,
        editable: false,
        autoHeaderHeight: true,
        children: children,
        marryChildren: true
      };
    });

    //green - Market Unit Price, Tier, HoleSection, HSType, Group, OD, Wall, Weight, Grade, Connection, Vendor, Manufacturer #, Sour Service - rgb(229, 255, 241)
    const greenCols = [
      {
        columnGroupShow: 'open', field: "sectionName", headerName: "Section Name", wrapHeaderText: true, minWidth: 110,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      // {
      //   columnGroupShow: 'open', headerName: 'Group', field: 'groupName', minWidth: 110,
      //   cellStyle: params => {
      //     if (params.node.level === -1) {
      //       return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
      //     }
      //     else {
      //       return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
      //     }
      //   },
      // },
      {
        columnGroupShow: 'open', headerName: 'Project Tag', field: 'projectTags', minWidth: 130, wrapHeaderText: true,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Threaded Connection?', field: 'isThreadedConnection', wrapHeaderText: true, minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      // { columnGroupShow: 'open', headerName: 'Contains Elastomer Elements?', field: 'isContainsElastomerElements',  minWidth: 240, cellStyle: { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' } },
      // {
      //   columnGroupShow: 'open', headerName: 'Description', field: 'materialDescription', wrapHeaderText: true, minWidth: 260,
      //   cellStyle: params => {
      //     if (params.node.level === -1) {
      //       return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
      //     }
      //     else {
      //       return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
      //     }
      //   },
      // },
      {
        columnGroupShow: 'open', headerName: 'Supplier', field: 'organizationName',
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Manufacturer', field: 'manufacturerDetails', minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Trade Name', field: 'tradeName', minWidth: 110, wrapHeaderText: true,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      // Added column Unit Of Measurement
      {
        columnGroupShow: 'open', headerName: 'UoM (FT or EA)', field: 'uom', wrapHeaderText: true, minWidth: 170,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      // Added column vendor SAP #
      {
        columnGroupShow: 'open', headerName: 'Manufacturer SAP #', field: 'vendorSapnumber', wrapHeaderText: true, minWidth: 170,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      // {
      //   columnGroupShow: 'open', headerName: 'Supplier Part #', field: 'supplierPartNumber', wrapHeaderText: true, minWidth: 120,
      //   cellStyle: params => {
      //     if (params.node.level === -1) {
      //       return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
      //     }
      //     else {
      //       return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
      //     }
      //   },
      // },
      {
        columnGroupShow: 'open', headerName: 'Legacy Ref #', field: 'legacyRefNumber', wrapHeaderText: true, minWidth: 100,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Nominal/Max OD (IN)', field: 'nominalOD1', wrapHeaderText: true, minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
        valueGetter: (params: any) => `${params.data.nominalOD1 || ''} ${params.data.nominalOD2 ? 'x ' + params.data.nominalOD2 : ''} ${params.data.nominalOD3 ? 'x ' + params.data.nominalOD3 : ''}`
      },
      {
        columnGroupShow: 'open',
        headerName: 'Actual OD (IN)',
        field: 'actualOD1', wrapHeaderText: true,
        sortable: true,
        filter: true, minWidth: 130,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
        valueGetter: (params: any) => `${params.data.actualOd1 || ''} ${params.data.actualOd2 ? 'x ' + params.data.actualOd2 : ''} ${params.data.actualOd3 ? 'x ' + params.data.actualOd3 : ''}`
      },
      {
        columnGroupShow: 'open',
        headerName: 'Actual ID (IN)',
        field: 'actualID1', wrapHeaderText: true,
        sortable: true,
        filter: true, minWidth: 120,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
        valueGetter: (params: any) => `${params.data.actualId1 || ''} ${params.data.actualId2 ? 'x ' + params.data.actualId2 : ''} ${params.data.actualId3 ? 'x ' + params.data.actualId3 : ''}`
      },
      {
        columnGroupShow: 'open', headerName: 'Drift (IN)', wrapHeaderText: true, field: 'drift',
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open',
        headerName: 'Weight (LB)',
        field: 'weight1', wrapHeaderText: true,
        sortable: true,
        filter: true, minWidth: 130, cellStyle: { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' },
        valueGetter: (params: any) => `${params.data.weight1 || ''} ${params.data.weight2 ? 'x ' + params.data.weight2 : ''} ${params.data.weight3 ? 'x ' + params.data.weight3 : ''}`
      },
      {
        columnGroupShow: 'open', headerName: 'Wall Thickness (IN)', wrapHeaderText: true, field: 'wallThickness', minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open',
        headerName: 'Material Grade',
        field: 'materialGradePrimary', wrapHeaderText: true,
        sortable: true,
        filter: true, minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
        valueGetter: (params: any) => `${params.data.materialGradePrimary || ''} ${params.data.materialGradeSecondary ? 'x ' + params.data.materialGradeSecondary : ''} ${params.data.materialGradeTertiary ? 'x ' + params.data.materialGradeTertiary : ''}`
      },
      {
        columnGroupShow: 'open', headerName: 'Range', field: 'rangeName', minWidth: 100,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Min Yield Strength (PSI)', wrapHeaderText: true, field: 'yeildStrength', minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Burst Pressure (PSI)', wrapHeaderText: true, field: 'burstPressure', minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Collapse Pressure (PSI)', wrapHeaderText: true, field: 'collapsePressure', minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Max Pressure Rating (PSI)', wrapHeaderText: true, field: 'maxPressureRating', minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Differential Pressure Rating (PSI)', wrapHeaderText: true, field: 'diffPressureRating', minWidth: 180,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Max Temperature Rating (F)', wrapHeaderText: true, field: 'maxTempRating', minWidth: 160,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Quality Plan Designation', wrapHeaderText: true, field: 'qualityPlanDesignation', minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Connection Configuration', wrapHeaderText: true, field: 'connectionConfigName', minWidth: 150,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Top Connection', wrapHeaderText: true, field: 'topConnection', minWidth: 130,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Middle Connection', wrapHeaderText: true, field: 'middleConnection', minWidth: 130,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Bottom Connection', wrapHeaderText: true, field: 'bottomConnection', minWidth: 130,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Connection Burst Pressure (PSI)', wrapHeaderText: true, field: 'connectionBurstPressure', minWidth: 170,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Connection Collapse Pressure (PSI)', wrapHeaderText: true, field: 'connectionCollapsePressure', minWidth: 180,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Connection Yield Strength (PSI)', wrapHeaderText: true, field: 'connectionYeildStrength', minWidth: 180,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Makeup-Loss (IN)', wrapHeaderText: true, field: 'makeupLoss', minWidth: 130,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'RBW', wrapHeaderText: true, field: 'rbw', minWidth: 90,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Min Temperature Rating (F) - Elastomers', wrapHeaderText: true, field: 'elastomersMinTempRating', minWidth: 200,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Max Temperature Rating (F) - Elastomers', wrapHeaderText: true, field: 'elastomersMaxTempRating', minWidth: 200,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Elastomer Type', field: 'elastomerTypeID', wrapHeaderText: true, minWidth: 140,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Elastomer Notes', field: 'elastomerNotes', wrapHeaderText: true, minWidth: 140,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Standard Notes (Specs, Ratings, Configurations, Design Elements)', wrapHeaderText: true, field: 'standardNotes', minWidth: 300,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
      {
        columnGroupShow: 'open', headerName: 'Administrative Notes', field: 'administrativeNotes', wrapHeaderText: true, minWidth: 140,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
          }
        },
      },
    ]
    const peachCols = [
      //peach - General Account, Jack St Malo, Tahiti, Big Foot, Blind Faith, Anchor, Ballymore, Surplus/Audit - rgb(255, 237, 223)
      {
        columnGroupShow: 'open', field: "generalAccount", headerName: "General Account", filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        wrapHeaderText: true, minWidth: 110,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "jackStMalo", headerName: "Jack St Malo", filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        wrapHeaderText: true, minWidth: 110,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "tahiti", headerName: "Tahiti", wrapHeaderText: true, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        minWidth: 100,
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "bigFoot", headerName: "Big Foot", wrapHeaderText: true, minWidth: 110, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "blindFaith", headerName: "Blind Faith", wrapHeaderText: true, minWidth: 110, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "anchor", headerName: "Anchor", wrapHeaderText: true, minWidth: 100, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "ballymore", headerName: "Ballymore", wrapHeaderText: true, minWidth: 120, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "surplus", headerName: "Surplus/Audit", wrapHeaderText: true, minWidth: 150, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(255, 237, 223)', 'border-color': 'rgb(255, 237, 223)' }
          }
        },
      },
    ]
    const greyCols = [
      //grey - Sooner, Tenaris, Drill Quip, OpenClosed, Lead Time in Days, Incoming Orders, rgb(235, 235, 235)
      {
        columnGroupShow: 'open', field: "leadTimeInDays", headerName: "Lead Time in Days",
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        editable: this.authService.isFieldEditable('leadTimeInDays'),
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
          }
        },
        wrapHeaderText: true
      },
      {
        columnGroupShow: 'open', field: "", headerName: "Well", minWidth: 140, filter: 'agNumberColumnFilter',
        valueGetter: (params: any) => {
          return this.findWell(params, "Well");
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
          }
        },
        wrapHeaderText: true
      },
      {
        columnGroupShow: 'open', field: "", headerName: "Deficit P10", minWidth: 120,
        valueGetter: (params: any) => {
          return this.findWell(params, "Deficit P10");
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
          }
        },
        wrapHeaderText: true
      },
      {
        columnGroupShow: 'open', field: "", headerName: "Re-order By Date", minWidth: 120,
        valueGetter: (params: any) => {
          return this.findWell(params, "Re-order By Date");
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
          }
        },
        wrapHeaderText: true
      },

    ]

    const materials = [
      {
        columnGroupShow: '', field: "componentTypeName", headerName: "Component Type", minWidth: 160,
        checkboxSelection: (params) => { 
          // Allow checkbox selection only for non-aggregated rows
          if (!params.node.group) {
            return true
          }
        },
        pinned: "left",
        aggFunc: "first", // Aggregate function to show the first value in the group
        cellRenderer: (params) => {
          if (params.node.level === -1) {
            return ``; // Don't show the header for the total row
          }
          return params.value;
        },
        cellStyle: params => {
          if (params.node.level === -1 || params.node?.group) { return { 'font-weight': 'bold' }; }
        },
        wrapHeaderText: true
      },
      { columnGroupShow: '', field: "materialDescription", headerName: "Material Description", minWidth: 350, pinned: "left", aggFunc: "first",
        cellRenderer: (params) => {
          if (params.node.level === -1) {
            return ``; // Don't show the header for the total row
          }
          let value = params.value;
          // If this is a group row, remove the last (...) including the brackets
          if (params.node.group && typeof value === 'string') {
            value = value.replace(/\s*\([^)]*\)\s*$/, '');
          }
          return value;
        },
        cellStyle: (params) => {
          return params.node?.group ? { 'font-weight': 'bold' } : { 'font-weight': 'normal' }; // Apply bold style to group rows
        }
      },
      { columnGroupShow: '', headerName: 'Supplier Part #', field: 'supplierPartNumber', wrapHeaderText: true, minWidth: 300, sortable: true,
        pinned: "left", rowGroup: true, showRowGroup: true, cellRenderer: 'agGroupCellRenderer',      
        // Custom keyCreator to group by the core supplier part number
         keyCreator: (params) => {
          return params.data?.uiGrouping;
         },        
        valueFormatter: (params) => {
          const node = params.node;
          const value = params.value;
          // If it's a group row, show just the core part (group key)
          if (node.group && node.key) {
            return node.key;
          }
          // Else show full supplier part number
          return value;
        },
        cellStyle: (params) => {
          return params.node?.group ? { 'font-weight': 'bold' } : { 'font-weight': 'normal' }; // Apply bold style to group rows
        }
      },
      { columnGroupShow:'', field: "sortByString", headerName: "Sort Field", minWidth: 150, pinned: "left", wrapHeaderText: true, sort: 'asc', hide: true },
      { columnGroupShow: '', field: "materialNumber", headerName: "Material ID", minWidth: 110, pinned: "left", wrapHeaderText: true },
      { columnGroupShow: '', headerName: 'Group', field: 'groupName', minWidth: 100,pinned: "left", wrapHeaderText: true },
    ]
    this.columnDefs = [
      { headerName: "Materials", children: [...materials, ...greenCols] }];

    //discrepancy - Yard Qty, Discrepancy, Calculation value
    const discrepancyCols = [
      {
        columnGroupShow: 'open', field: "cvxOwnedInventory", headerName: "ERP Qty", minWidth: 100, wrapHeaderText: true,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;// Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
        },
        filter: 'agNumberColumnFilter'
      },
      { // Yard Inventory
        columnGroupShow: 'open', field: "yardInventory", headerName: "Field Qty", sortable: true, minWidth: 100, editable: false, wrapHeaderText: true,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;// Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
        },
        filter: 'agNumberColumnFilter'
       },
      { columnGroupShow: 'open', field: "discrepancy", headerName: "Discrepancy", sortable: true, minWidth: 130, editable: false,wrapHeaderText: true,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;// Format with commas if it's a number
        },
        valueGetter: (params) => {
          return (params.data?.cvxOwnedInventory || 0) - (params.data?.yardInventory || 0); // Calculate discrepancy as cvxOwnedInventory - yardInventory
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
          else{
            if(params.value !== 0){
              return { 'background-color': 'var(--theme-red-color-op25)' , 'border-color': 'var(--theme-red-color-op25)' };
            }
          }
        },
        filter: 'agNumberColumnFilter'
       },
       { columnGroupShow: '', field: "overrideInventory", headerName: "Calculated Inventory", sortable: true,wrapHeaderText: true, minWidth: 130, editable: this.authService.isFieldEditable('overrideInventory'),
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? '' : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;// Format with commas if it's a number
        },
          valueGetter: (params) => {
            // Use overrideInventory if available, otherwise use cvxOwnedInventory or yardInventory
         const val = (params.data?.overrideInventory && params.data?.overrideInventory > 0) ? params.data.overrideInventory : this.selectedInventory == 1 ? params.data?.cvxOwnedInventory : params.data?.yardInventory;
         if (val === null || val === undefined || val === '') return '';
          // Restrict to 2 decimals
          return Math.round(Number(val) * 100) / 100;
          },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
          if (params?.data?.overrideInventory) {
            return { 'font-weight': 'bold', 'color': '#ba3093bf', 'font-style': 'italic' };
          } else {
            return { 'font-weight': 'normal','font-style': 'normal', 'color': 'black' };
          }
        },
        filter: 'agNumberColumnFilter'
       }
    ]
    const otherCols = [
      // Discrepancy Section
      {
        headerName: "Discrepancy",
        wrapHeaderText: true,
        minWidth: 150,
        children: [
          ...discrepancyCols
        ]
      },
      // Balance Section
      {
        field: "balance6", headerName: !this.showContingency ? "Balance" : "Balance (Incl. Cont.)", sortable: true, filter: true, minWidth: 120,
        hide: this.selectedMonthSummary != 6,
        suppressColumnsToolPanel: this.selectedMonthSummary != 6, // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
                tooltipComponent: OdinBalanceTooltipComponent, // Balance tooltip component added
                tooltipComponentParams: (params: ITooltipParams) => {
        
                // Getting the tooltip value from the add and update calculated methods
                return { demandDetails: params.data.balanceInclCont6Tooltip, isContingent: this.showContingency };
                },
                tooltipField: "balance6",
        cellRenderer: params => {
          if (!params.node.rowPinned) {
            const value = Math.floor(parseFloat(params.value)); // Convert to number
            if (params.node.level === -1) {
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
            }
            if (value < 0) {
              return `<span class = 'pi pi-chevron-circle-down balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : value.toLocaleString('en-US')}</span>`;
            } else if (value < 1000) {
              return `<span class = 'pi pi-exclamation-circle balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : value.toLocaleString('en-US')}</span>`;
            } else {
              return `<span class = 'pi pi-chevron-circle-up balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : value.toLocaleString('en-US')}</span>`;
            }
          }
          else {
            return params.value.toLocaleString('en-US')
          }
        },
        //cellStyle red if value is negative, orange if less than 1000 and green if greater than 1000
        cellStyle: params => {
          if (params.node.level === -1) { return { 'font-weight': 'bold' }; }
          if (params.value < 0) {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
            }
            else {
              return { 'background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
            }
          } else if (params.value < 1000) {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
            }
            else {
              return { 'background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
            }
          } else {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
            }
            else {
              return { 'background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
            }
          }
        }, wrapHeaderText: true
      },
      {
        field: "balance12", headerName: !this.showContingency ? "Balance" : "Balance (Incl. Cont.)", sortable: true, filter: true, minWidth: 120,
        hide: this.selectedMonthSummary != 12,
        suppressColumnsToolPanel: this.selectedMonthSummary != 12, // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        tooltipComponent: OdinBalanceTooltipComponent, // Balance tooltip component added
        tooltipComponentParams: (params: ITooltipParams) => {
        // Getting the tooltip value from the add and update calculated methods
        return { demandDetails: params.data.balanceInclCont12Tooltip, isContingent: this.showContingency };
        },
        tooltipField: "balance12",
        cellRenderer: params => {
          if (!params.node.rowPinned) {
            const value = Math.floor(parseFloat(params.value)); // Convert to number
            if (params.node.level === -1) {
              return isNaN(value) ? params.value : value.toLocaleString('en-US');
            }
            if (value < 0) {
              return `<span class = 'pi pi-chevron-circle-down balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : value.toLocaleString('en-US')}</span>`;
            } else if (value < 1000) {
              return `<span class = 'pi pi-exclamation-circle balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : value.toLocaleString('en-US')}</span>`;
            } else {
              return `<span class = 'pi pi-chevron-circle-up balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : value.toLocaleString('en-US')}</span>`;
            }
          }
          else {
            return params.value.toLocaleString('en-US')
          }
        },
        //cellStyle red if value is negative, orange if less than 1000 and green if greater than 1000
        cellStyle: params => {
          if (params.node.level === -1) { return { 'font-weight': 'bold' }; }
          if (params.value < 0) {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
            }
            else {
              return { 'background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
            }
          } else if (params.value < 1000) {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
            }
            else {
              return { 'background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
            }
          } else {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
            }
            else {
              return { 'background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
            }
          }
        }, wrapHeaderText: true
      },
      {
        field: "balance18", headerName: !this.showContingency ? "Balance" : "Balance (Incl. Cont.)", sortable: true, filter: true, minWidth: 120,
        hide: this.selectedMonthSummary != 18,
        suppressColumnsToolPanel: this.selectedMonthSummary != 18, // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        tooltipComponent: OdinBalanceTooltipComponent, // Balance tooltip component added
        tooltipComponentParams: (params: ITooltipParams) => {

        // Getting the tooltip value from the add and update calculated methods
        return { demandDetails: params.data.balanceInclCont18Tooltip, isContingent: this.showContingency };
        },
        tooltipField: "balance18",
        cellRenderer: params => {
          if (!params.node.rowPinned) {
            const value = Math.floor(parseFloat(params.value)); // Convert to number
            if (params.node.level === -1) {
              return isNaN(value) ? params.value : value.toLocaleString('en-US');
            }
            if (value < 0) {
              return `<span class = 'pi pi-chevron-circle-down balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : value.toLocaleString('en-US')}</span>`;
            } else if (value < 1000) {
              return `<span class = 'pi pi-exclamation-circle balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : value.toLocaleString('en-US')}</span>`;
            } else {
              return `<span class = 'pi pi-chevron-circle-up balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : value.toLocaleString('en-US')}</span>`;
            }
          }
          else {
            return params.value.toLocaleString('en-US')
          }
        },
        //cellStyle red if value is negative, orange if less than 1000 and green if greater than 1000
        cellStyle: params => {
          if (params.node.level === -1) { return { 'font-weight': 'bold' }; }
          if (params.value < 0) {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
            }
            else {
              return { 'background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
            }
          } else if (params.value < 1000) {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
            }
            else {
              return { 'background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
            }
          } else {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
            }
            else {
              return { 'background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
            }
          }
        }, wrapHeaderText: true
      },
      {
        field: "balance24", headerName: !this.showContingency ? "Balance" : "Balance (Incl. Cont.)", sortable: true, filter: true, minWidth: 120,
        hide: this.selectedMonthSummary != 24,
        suppressColumnsToolPanel: this.selectedMonthSummary != 24, // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        tooltipComponent: OdinBalanceTooltipComponent, // Balance tooltip component added
        tooltipComponentParams: (params: ITooltipParams) => {

        // Getting the tooltip value from the add and update calculated methods
        return { demandDetails: params.data.balanceInclCont24Tooltip, isContingent: this.showContingency };
        },
        tooltipField: "balance24",
        cellRenderer: params => {
          if (!params.node.rowPinned) {
            const value = Math.floor(parseFloat(params.value)); // Convert to number
            if (params.node.level === -1) {
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
            }
            if (value < 0) {
              return `<span class = 'pi pi-chevron-circle-down balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
            } else if (value < 1000) {
              return `<span class = 'pi pi-exclamation-circle balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
            } else {
              return `<span class = 'pi pi-chevron-circle-up balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
            }
          }
          else {
            return params.value.toLocaleString('en-US')
          }
        },
        //cellStyle red if value is negative, orange if less than 1000 and green if greater than 1000
        cellStyle: params => {
          if (params.node.level === -1) { return { 'font-weight': 'bold' }; }
          if (params.value < 0) {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
            }
            else {
              return { 'background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
            }
          } else if (params.value < 1000) {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
            }
            else {
              return { 'background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
            }
          } else {
            if(params.node?.group){
              return { 'font-weight': 'bold','background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
            }
            else {
              return { 'background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
            }
          }
        }, wrapHeaderText: true
      },      
      {
        headerName: "Inventory On Hand",
        wrapHeaderText: true,
        children: [
          {
            columnGroupShow: '', field: "cvxOwnedInventory", headerName: "CVX Inventory", minWidth: 120, wrapHeaderText: true, filter: 'agNumberColumnFilter',
            valueFormatter: (params) => {
              const value = Math.floor(parseFloat(params.value));
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            },
            valueGetter: (params) => {
              return (params.data?.overrideInventory && params.data?.overrideInventory) > 0 ? params.data.overrideInventory : this.selectedInventory == 1 ? params.data?.cvxOwnedInventory : params.data?.yardInventory; // Use overrideInventory if available, otherwise use cvxOwnedInventory
            },
            //tooltipValueGetter: (params: ITooltipParams) => {
            //  let assembly = this.assemblyData.filter(assembly => assembly.chevronMmr == params.data?.materialNumber);
            //  return "Bound: " + assembly.length + " | " + "Unbound : " + (params.data?.cvxOwnedInventory - assembly.length);
            //},
            tooltipValueGetter: (params: ITooltipParams) => {
              return "Bound: " + params.data?.bound + " | " + "Unbound : " + params.data?.unBound;
            },
            cellStyle: params => {
              if (params.node.level === -1 || params.node?.group) {
                return { 'font-weight': 'bold' }; // Apply bold style to group rows
              }
            }
          },
          ...peachCols
        ]
      },
      {
        field: "consignmentInventory", headerName: "Consignment Inventory", sortable: true, filter: 'agNumberColumnFilter', minWidth: 135, wrapHeaderText: true,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        valueGetter: (params) => {
          if (!params.data) return 0; // Return 0 if data is undefined
          const { consignmentInventory6 = 0, consignmentInventory12 = 0, consignmentInventory18 = 0, consignmentInventory24 = 0 } = params.data || {};
          switch (this.selectedMonthSummary) {
            case 6:
              return (consignmentInventory6 || 0);
            case 12:
              return (consignmentInventory12 || 0);
            case 18:
              return (consignmentInventory18 || 0);
            default:
              return (consignmentInventory24 || 0);
          }
        },
        cellStyle: params => {
          if (params.node.level === -1 || params.node?.group) {
            return { 'font-weight': 'bold' }; // Apply bold style to group rows
          }
        },
        cellRenderer: (params) => {
          if (params.node.rowPinned) {
            switch (this.selectedMonthSummary) {
              case 6: return Math.floor(this.subtotalRow.consignmentInventory6).toLocaleString('en-US');
              case 12: return Math.floor(this.subtotalRow.consignmentInventory12).toLocaleString('en-US');
              case 18: return Math.floor(this.subtotalRow.consignmentInventory18).toLocaleString('en-US');
              default: return Math.floor(this.subtotalRow.consignmentInventory24).toLocaleString('en-US');
            }

          }
          else {
            const value = Math.floor(parseFloat(params.value)); // Convert to number
            return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
          }
        },
      },
      {
        headerName: "Lead Times",
        wrapHeaderText: true,
        children: [
          {
            columnGroupShow: '', field: "openOrders6", headerName: "Open Orders",wrapHeaderText: true, minWidth: 100,
            hide: this.selectedMonthSummary != 6,
            suppressColumnsToolPanel: this.selectedMonthSummary != 6, // Hide from the columns tool panel on the right   
            valueFormatter: (params) => {
              const value = Math.floor(parseFloat(params.value)); // Convert to number
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
            },
            cellStyle: params => {
              if (params.node.level === -1 || params.node?.group) {
                return { 'font-weight': 'bold' }; // Apply bold style to group rows
              }
            },
          },
          {
            columnGroupShow: '', field: "openOrders12", headerName: "Open Orders", minWidth: 100,
            hide: this.selectedMonthSummary != 12,
            suppressColumnsToolPanel: this.selectedMonthSummary != 12, // Hide from the columns tool panel on the right 
            valueFormatter: (params) => {
              const value = Math.floor(parseFloat(params.value)); // Convert to number
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
            },
            cellStyle: params => {
              if (params.node.level === -1 || params.node?.group) {
                return { 'font-weight': 'bold' }; // Apply bold style to group rows
              }
            },
            wrapHeaderText: true
          },
          {
            columnGroupShow: '', field: "openOrders18", headerName: "Open Orders", minWidth: 100,
            hide: this.selectedMonthSummary != 18,
            suppressColumnsToolPanel: this.selectedMonthSummary != 18, // Hide from the columns tool panel on the right 
            valueFormatter: (params) => {
              const value = Math.floor(parseFloat(params.value)); // Convert to number
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
            },
            cellStyle: params => {
              if (params.node.level === -1 || params.node?.group) {
                return { 'font-weight': 'bold' }; // Apply bold style to group rows
              }
            },
            wrapHeaderText: true
          },
          {
            columnGroupShow: '', field: "openOrders24", headerName: "Open Orders", minWidth: 100,
            hide: this.selectedMonthSummary != 24,
            suppressColumnsToolPanel: this.selectedMonthSummary != 24, // Hide from the columns tool panel on the right 
            valueFormatter: (params) => {
              const value = Math.floor(parseFloat(params.value)); // Convert to number
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
            },
            cellStyle: params => {
              if (params.node.level === -1 || params.node?.group) {
                return { 'font-weight': 'bold' }; // Apply bold style to group rows
              }
            },
            wrapHeaderText: true
          },
          ...greyCols
        ]
      },
      {
        field: "totalPrimaryDemand", headerName: "Primary Demand", wrapHeaderText: true, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellRenderer: (params) => {
          if (params.node.rowPinned) { return Math.floor(this.subtotalRow.primaryDemand).toLocaleString('en-US'); }
          else {
            const value = Math.floor(parseFloat(params.value)); // Convert to number
            return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
          }
        },
        cellStyle: params => {
          if (params.node.level === -1 || params.node?.group) {
            return { 'font-weight': 'bold' }; // Apply bold style to group rows
          }
        },

        tooltipComponent: odinDemandTooltip,
        tooltipComponentParams: (params: ITooltipParams) => {

          // Added the tooltip logic in add and updated calculated methods
          return { demandDetails: params.data.totalPrimaryDemandTooltip, materialId: params.data.materialId  };
        },
        tooltipField: "totalPrimaryDemand",
      },
      {
        field: "requiredBackup", headerName: "Required B/U", editable: this.authService.isFieldEditable('requiredBackup'), minWidth: 110, filter: 'agNumberColumnFilter',
        cellStyle: params => {
          if (params.node.level === -1 || params.node?.group) {
            return { 'font-weight': 'bold' }; // Apply bold style to group rows
          }
        },
        wrapHeaderText: true
      },
      {
        field: "totalContingencyDemand", headerName: "Contingency Demand", minWidth: 129, wrapHeaderText: true, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellRenderer: (params) => {
          if (params.node.rowPinned) { return this.subtotalRow.contingencyDemand; }
          else {
            //return params.value; 
            const value = Math.floor(parseFloat(params.value)); // Convert to number
            return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
          }
        },
        cellStyle: params => {
          if (params.node.level === -1 || params.node?.group) {
            return { 'font-weight': 'bold' }; // Apply bold style to group rows
          }
        },
        tooltipComponent: odinDemandTooltip,
        tooltipComponentParams: (params: ITooltipParams) => {

          // Added the tooltip logic in add and updated calculated methods
          return { demandDetails: params.data.totalContingencyDemandTooltip, materialId: params.data.materialId  };

        },
        tooltipField: "totalContingencyDemand",
      },
      {
        field: "totalSecondaryDemand", headerName: "Secondary Demand", minWidth: 125, wrapHeaderText: true, filter: 'agNumberColumnFilter',
        cellRenderer: (params) => {
          if (params.node.rowPinned) { return Math.floor(this.subtotalRow.secondaryDemand); }
          else {
            //return params.value; 
            const value = Math.floor(parseFloat(params.value)); // Convert to number
            return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
          }
        },
        cellStyle: params => {
          if (params.node.level === -1 || params.node?.group) {
            return { 'font-weight': 'bold' }; // Apply bold style to group rows
          }
        },
        tooltipComponent: odinDemandTooltip,
        tooltipComponentParams: (params: ITooltipParams) => {

          // Added the tooltip logic in add and updated calculated methods
          return { demandDetails: params.data.totalSecondaryDemandTooltip, materialId: params.data.materialId  };

        },
        tooltipField: "totalSecondaryDemand",
      },
      // Added Class B
      {
        field: "classB", headerName: "Class B", minWidth: 100, wrapHeaderText: true, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1 || params.node?.group) {
            return { 'font-weight': 'bold' }; // Apply bold style to group rows
          }
        },
      },
      {
        field: "classC", headerName: "Class C", minWidth: 100, wrapHeaderText: true, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1 || params.node?.group) {
            return { 'font-weight': 'bold' }; // Apply bold style to group rows
          }
        },
      },
      {
        field: "surplus", headerName: "Surplus", minWidth: 100, wrapHeaderText: true,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1 || params.node?.group) {
            return { 'font-weight': 'bold' }; // Apply bold style to group rows
          }
        },
      },
      // Added column UoM (FT or EA)
      // {
      //   columnGroupShow: 'open', headerName: 'UoM (FT or EA)', field: 'uom', wrapHeaderText: true, minWidth: 170,        
      // },
      {
        headerName: 'Actions',
        field: 'odinActionLookupId',
        valueFormatter: params => {
          const item = this.actionOptions.find(item => item.id == params.value);
          return item ? item.value : null;
        },
        cellStyle: params => {
          if (params.node.level === -1 || params.node?.group) {
            return { 'font-weight': 'bold' }; // Apply bold style to group rows
          }
        }, 
        minWidth: 120,
        editable: this.authService.isFieldEditable('odinActionLookupId'),
        sortable: false,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.actionOptions.map(item => item.id),
        }, wrapHeaderText: true
      },
      {
        field: "odinComments", headerName: "Comments", editable: this.authService.isFieldEditable('Comments'), minWidth: 120, wrapHeaderText: true, cellEditor: 'agLargeTextCellEditor',
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
        },
        cellEditorPopup: true
      },
    ];
    if (wellColumns == undefined || wellColumns.length == 0) {
      this.columnDefs = [...this.columnDefs, ...otherCols];
    }
    else {
      this.columnDefs = [...this.columnDefs, ...wellColumns, ...otherCols];
    }
  }

  /**
   * This function finds the well based on the parameters provided and returns the well name, deficit P10 date, or reorder date.
   * It calculates the surplus or deficit based on the open orders, inventory, required backup,
  */
  findWell(params: any, field: string): any {
    const { openOrders6, openOrders12, openOrders18, openOrders24, overrideInventory, cvxOwnedInventory, yardInventory, requiredBackup, totalPrimaryDemand, totalContingencyDemand, consignmentInventory6, consignmentInventory12, consignmentInventory18, consignmentInventory24, wellMaterials } = params.data;
    // Calculate the inventory based on the overrideInventory or selectedInventory
    // If overrideInventory is greater than 0, use it; otherwise, use cvx
    let calculatedCvxOwnedInventory = parseInt((overrideInventory && overrideInventory) > 0 ? overrideInventory : this.selectedInventory == 1 ? cvxOwnedInventory : yardInventory);
    let openOrders = 0;
    let consignmentInventory = 0;
    switch (this.selectedMonthSummary) {
        case 6:
          openOrders = openOrders6 || 0;
          consignmentInventory = consignmentInventory6 || 0;
          break;
        case 12:
          openOrders = openOrders12 || 0;
          consignmentInventory = consignmentInventory12 || 0;
          break;
        case 18:
          openOrders = openOrders18 || 0;
          consignmentInventory = consignmentInventory18 || 0;
          break;
        case 24:
          openOrders = openOrders24 || 0;
          consignmentInventory = consignmentInventory24 || 0;
          break;
        default:
          openOrders = openOrders6 || 0;
          consignmentInventory = consignmentInventory6 || 0;
          break;
      }
    if (wellMaterials != null && wellMaterials.length > 0) {
      const totalInventory = (calculatedCvxOwnedInventory || 0) + (openOrders || 0) + (consignmentInventory || 0);
      // If Inventory is less than Required Backup, show "Insufficient Backup" in Well column
      if (totalInventory < requiredBackup) {
          if (field == "Well") {
            return "Insufficient Backup";
          }
        }
        // Calculate Surplus or Deficit
        // SurplusOrDeficit = Open Orders + Calculated Inventory - Primary Demand - Contingency Demand (if shown)
        // If SurplusOrDeficit is negative, find the first well that causes the deficit and return its name and P10 date
      const SurplusOrDeficit = (openOrders || 0) + (calculatedCvxOwnedInventory || 0) - (totalPrimaryDemand || 0) - (this.showContingency ? totalContingencyDemand || 0 : 0);
      
      if (SurplusOrDeficit < 0) {
          let totalDemand = 0;
          let wellName = "";
          let deficitiP10 = "";
          let ReorderByDate;
          let found = false;
          wellMaterials?.forEach((wellMaterial: any) => {
            totalDemand += wellMaterial?.primaryQuantity == null ? 0 : wellMaterial?.primaryQuantity;
            if (totalDemand > totalInventory) {
              if (!found) {
                wellName = wellMaterial?.wellName;
                let runOutDate = this.selectedPType == "P50" ? wellMaterial?.p50StartDate : wellMaterial?.p10StartDate;
                if (runOutDate != undefined && runOutDate != null) {
                  deficitiP10 = this.datePipe.transform(new Date(runOutDate), 'MM/dd/yyyy') || '';
                    ReorderByDate = new Date(runOutDate);
                    ReorderByDate.setDate(ReorderByDate.getDate() - this.newOrderDays);
                    ReorderByDate = this.datePipe.transform(new Date(ReorderByDate), 'MM/dd/yyyy');
                  found = true;
                }
              }
            }
          });
          if (field == "Well") {
            return wellName;
          }
          else if (field == "Deficit P10") {
            return deficitiP10;
          }
          else
            return ReorderByDate;
      }
      else {
        return "";
      }
    }
  }


  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridStateService.initialize(params.api, this.userDetails.uid);
    //  this.gridStateService.setContextData({
    //   selectedPType: this.selectedPType,
    //   selectedMonthSummary: this.selectedMonthSummary,
    //   showContingency: this.showContingency
    // });
  }

  onFirstDataRendered(event: FirstDataRenderedEvent) {
    this.updateFilterDropdowns();
  }

  onRowDataUpdated(event: RowDataUpdatedEvent) {
  }
  onSearchChange(event: Event): void {
    const searchOdinDashboard = (event.target as HTMLInputElement).value.toLowerCase();
    this.quickFilterText = searchOdinDashboard; // Update the quick filter text
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.odinCommonServicesubscription) {
      this.odinCommonServicesubscription.unsubscribe();
      this.odinCommonService.clearOuterRibbonDto();  // Clear data on destroy
    }
    this.odinCompletionsSubscription?.unsubscribe();
  }

  onSaveState() {
        this.gridStateService.saveStateOnDestroy(this.stateKey);
  }
  toggleSelectAll(event: any) {

    if (event.checked.length > 0) {
      this.selectedCategory = ['All', 'P', 'C', 'S'];
    }
    if (event.checked.length == 0) {

      this.selectedCategory = [];
    }
    this.createWellColumns();
  }

  onSelectCategory() {
    if (this.selectedCategory.length == 4) {
      this.selectAll = [true];
    }
    else {
      this.selectAll = [];
    }
    this.createWellColumns();

  }

  onMultiSelectChange(event: any, type: string) {
    this.applyComponentTypeFilter(event,type);
  }

  onServerMultiSelectChange(event: any, type: string) {
    if (event == null)
      return;

    if (type == FilterDDType.Months)
      this.selectedMonthSummary = parseInt(event.value);
    //this.futureSelectedDate();
    this.addWellMaterialDemand();
    this.addCalculatedColumns();
    this.filterData = this.tableData.map(item => ({ ...item }));
    this.createWellColumns();
  }
  //futureSelectedDate() {
  //  const currentDate = new Date();
  //  currentDate.setMonth(currentDate.getMonth() + this.selectedMonthSummary);
  //  const day = String(currentDate.getDate()).padStart(2, '0');  // Pad single digits with leading zero
  //  const month = String(((currentDate.getMonth() == 6 || currentDate.getMonth() == 12) ? currentDate.getMonth() + 0 : currentDate.getMonth() + 1)).padStart(2, '0');  // Months are 0-indexed, pad with leading zero
  //  const year = currentDate.getFullYear();
  //  this.futureDate = `${month}/${day}/${year}`;
  //}
  onViewSelectionChange() {
    const advanceFilter = new AdvanceFilterModel();
    advanceFilter.projects = [];
    advanceFilter.functions = this.selectedView;
    advanceFilter.timeline = "";
    advanceFilter.wells = [];
    let reducerObject: any;
    reducerObject = new OdinAdvanceFilterAction(null);
    reducerObject.payload = JSON.parse(JSON.stringify(advanceFilter));
    reducerObject.type = READ_ODIN_ADVANCE_FILTER_ACTION_TYPE as OdinAdvanceFilterActionType;
    reducerObject.payload['reset'] = true
    this.odinStore.dispatch(reducerObject);
    if (this.selectedView == 1) {
      this.router.navigate([routeLinks.odinDrillingDashboard3]);
    }
    if (this.selectedView == 2) {
      this.router.navigate([routeLinks.odinCompletionDashboard3]);
    }
  }

  // applyComponentTypeFilter(type: string) {

  //   this.gridApi.onFilterChanged();
  //   // Always start with the full dataset

  //   this.filterData = this.tableData.map(item => ({ ...item }));

  //   if (this.componentTypeSelected && this.componentTypeSelected.length > 0) {
  //     this.selectedFilterName = type;
  //     this.filterData = this.filterData.filter(data =>
  //       this.componentTypeSelected.includes(data.componentTypeName)
  //     );
  //   }
  //   else if (this.groupSelected && this.groupSelected.length > 0) {
  //     this.selectedFilterName = type;
  //     this.filterData = this.filterData.filter(data =>
  //       this.groupSelected.includes(data.groupName)
  //     );
  //   }

  //   else if (this.odSelected && this.odSelected.length > 0) {
  //     this.selectedFilterName = type;
  //     this.filterData = this.filterData.filter(data =>
  //       this.odSelected.includes(data.nominalOD1)
  //     );
  //   }

  //   else if (this.supplierSelected && this.supplierSelected.length > 0) {
  //     this.selectedFilterName = type;
  //     this.filterData = this.filterData.filter(data =>
  //       this.supplierSelected.includes(data.organizationName)
  //     );
  //   }

  //   else if (this.weightsSelected && this.weightsSelected.length > 0) {
  //     this.selectedFilterName = type;
  //     this.filterData = this.filterData.filter(data =>
  //       this.weightsSelected.includes(data.weight1)
  //     );
  //   }

  //   else if (this.gradeSelected && this.gradeSelected.length > 0) {
  //     2
  //     this.selectedFilterName = type;
  //     this.filterData = this.filterData.filter(data =>
  //       this.gradeSelected.includes(data.materialGradeID1)
  //     );
  //   }

  //   else if (this.connectionSelected && this.connectionSelected.length > 0) {
  //     this.selectedFilterName = type;
  //     this.filterData = this.filterData.filter(data =>
  //       this.connectionSelected.includes(data.topConnection)
  //     );
  //   }
  //   else
  //     this.selectedFilterName = '';
  // }

applyComponentTypeFilter(event: any, type: string) {

  if (!this.gridApi) {
    console.warn('Grid API is not initialized');
    return;
  }

  this.gridApi.onFilterChanged();
  this.filterData = this.tableData.map(item => ({ ...item })); // Reset to full data
  this.filterData = this.aggregateByMaterialId(this.filterData);
  this.addWellMaterialDemand();
  this.addCalculatedColumns();
  this.selectedFilterName = type;

  let filterValue: any = [];

  if (type === 'componentTypeName' && this.componentTypeSelected?.length) {
    filterValue = this.componentTypeSelected;
    this.filterData = this.filterData.filter(d =>
      filterValue.includes(d.componentTypeName)
    );

  } else if (type === 'groupName' && this.groupSelected?.length) {
    filterValue = this.groupSelected;
    this.filterData = this.filterData.filter(d =>
      filterValue.includes(d.groupName)
    );

  } else if (type === 'nominalOD1' && this.odSelected?.length) {
  filterValue = Array.isArray(this.odSelected)
    ? this.odSelected.map(Number)
    : [Number(this.odSelected)];

  this.filterData = this.filterData.filter(d =>
    filterValue.includes(d.nominalOD1)
  );
} else if (type === 'organizationName' && this.supplierSelected?.length) {
    filterValue = this.supplierSelected;
    this.filterData = this.filterData.filter(d =>
      filterValue.includes(d.organizationName)
    );

  } else if (type === 'weight1' && this.weightsSelected?.length) {
    filterValue = this.weightsSelected;
    this.filterData = this.filterData.filter(d =>
      filterValue.includes(d.weight1)
    );

  } else if (type === 'materialGradePrimary' && this.gradeSelected?.length) {
    filterValue = this.gradeSelected;
    this.filterData = this.filterData.filter(d =>
      filterValue.includes(d.materialGradePrimary)
    );

  } else if (type === 'topConnection' && this.connectionSelected?.length) {
    filterValue = this.connectionSelected;
    this.filterData = this.filterData.filter(d =>
      filterValue.includes(d.topConnection)
    );
  } 
  // else if (type === 'project' && this.projectSelected?.length) {
  //   filterValue = this.projectSelected;
  //   this.filterData = this.filterData.filter(d => filterValue.includes(d.project));
  // }
  else {
    this.selectedFilterName = '';
    filterValue = [];
  }
  this.gridStateService.setContextData({
    filterType: type,
    filterValue: filterValue
  });

  this.totalRecords = this.filterData.length;
}

  clearAllFilters(searchOdinDashboard: HTMLInputElement) {
    this.quickFilterText = '';
    searchOdinDashboard.value = '';
    this.componentTypeSelected = '';
    this.groupSelected = '';
    this.odSelected = '';
    this.supplierSelected = '';
    this.weightsSelected = '';
    this.gradeSelected = '';
    this.connectionSelected = '';
    this.projectSelected = ''; // Clear project filter
    this.selectedPType = "P10";
    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      this.gridApi.onFilterChanged();
      this.gridApi.deselectAll();
    }
    this.selectedMonthSummary = 12;
    this.filterData = this.tableData.map(item => ({ ...item }));
    this.filterData = this.aggregateByMaterialId(this.filterData);
    this.addWellMaterialDemand();
    this.addCalculatedColumns();
    this.totalRecords = this.filterData.length;
  }

  resetOdinGrid() {
    this.getOdinGridData();
    this.isEdit = false;
    document.querySelector('.selectWellBTN').classList.remove('btn-disabled');
  }

  updateCalculatedColumns(event: any) {
    let item = this.filterData.filter(row => row.id == event.data.id)[0];
    const toNum = (v: any) => {
      const num = Number.isFinite(Number(v)) ? Number(v) : 0;
      return Math.round(num * 100) / 100;
    };
    const dateSelectedMonth = new Date();
    dateSelectedMonth.setMonth(dateSelectedMonth.getMonth() + parseInt(this.selectedMonthSummary.toString()));

    item.totalPrimaryDemandTooltip = [];
    item.totalContingencyDemandTooltip = [];
    item.totalSecondaryDemandTooltip = [];

    if (event.colDef.field.includes('_primary')) {
      item.totalPrimaryDemand = item.totalPrimaryDemand - parseInt(event.oldValue) + parseInt(event.newValue);
      // Logic added to fill the totalPrimaryDemandTooltip object
      item?.wellMaterials?.forEach((wellMaterial: any) => {
        item.materialId = wellMaterial.materialId;
        let runOutDate = new Date(
          this.selectedPType == 'P50'
            ? wellMaterial?.p50StartDate
            : wellMaterial?.p10StartDate
        );
        if (runOutDate < dateSelectedMonth) {
          if (wellMaterial.primaryQuantity > 0) {
            item.totalPrimaryDemandTooltip.push({
              wellName: wellMaterial.wellName,
              demand: wellMaterial.primaryQuantity
            });
          }
        }
      });
    }
    if (event.colDef.field.includes('_contingency')) {
      item.totalContingencyDemand = item.totalContingencyDemand - parseInt(event.oldValue) + parseInt(event.newValue);
      
      // Logic added to fill the totalContingencyDemandTooltip object
      item?.wellMaterials?.forEach((wellMaterial: any) => {
        item.materialId = wellMaterial.materialId;
        let runOutDate = new Date(
          this.selectedPType == 'P50'
            ? wellMaterial?.p50StartDate
            : wellMaterial?.p10StartDate
        );
        if (runOutDate < dateSelectedMonth) {
          if (wellMaterial.contingentQuantity > 0) {
            item.totalContingencyDemandTooltip.push({
              wellName: wellMaterial.wellName,
              demand: wellMaterial.contingentQuantity
            });
          }
        }
      });
    }
    if (event.colDef.field.includes('_secondary')) {
      item.totalSecondaryDemand = item.totalSecondaryDemand - parseInt(event.oldValue) + parseInt(event.newValue);

      // Logic added to fill the totalContingencyDemandTooltip object
      item?.wellMaterials?.forEach((wellMaterial: any) => {
        item.materialId = wellMaterial.materialId;
        let runOutDate = new Date(
          this.selectedPType == 'P50'
            ? wellMaterial?.p50StartDate
            : wellMaterial?.p10StartDate
        );
        if (runOutDate < dateSelectedMonth) {
          if (wellMaterial.secondaryQuantity > 0) {
            item.totalSecondaryDemandTooltip.push({
              wellName: wellMaterial.wellName,
              demand: wellMaterial.secondaryQuantity
            });
          }
        }
      });
    }


    // Update ODIN Dashboard Downstream Calculations to Account the Calculation Value Column
    let calculatedCvxOwnedInventory = (item.overrideInventory && item.overrideInventory) > 0 ? item.overrideInventory : this.selectedInventory == 1 ? item.cvxOwnedInventory || 0 : item.yardInventory || 0;

    // Fixing balance issue after updating the values
    // Helper to safely convert to number
    // const toNum = (v: any) => Number.isFinite(Number(v)) ? Number(v) : 0;
    calculatedCvxOwnedInventory = toNum(calculatedCvxOwnedInventory);
    // Update the balance columns based on the new values
    if(!this.showContingency) {
      item.balance6 = Math.round((item.openOrders6 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory6 || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0));
      item.balance12 = Math.round((item.openOrders12 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory12 || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0));
      item.balance18 = Math.round((item.openOrders18 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory18 || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0));
      item.balance24 = Math.round((item.openOrders24 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory24 || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0));
    }
    else{        
      item.balance6 = Math.round((item.openOrders6 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory6 || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0));
      item.balance12 = Math.round((item.openOrders12 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory12 || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0));
      item.balance18 = Math.round((item.openOrders18 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory18 || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0));
      item.balance24 = Math.round((item.openOrders24 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory24 || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0));
    }

      // Adding the logic for objects of balance tooltip
      item.balanceInclCont6Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders6}, unit: '+',
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: { header: 'Consignment Inventory', value: item.consignmentInventory, unit: '+'},
        requiredBackup: { header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: { header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: { header: 'Contingency Demand', value: item.totalContingentDemand, unit: '-'}
      };
        item.balanceInclCont12Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders12, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: { header: 'Consignment Inventory', value: item.consignmentInventory, unit: '+'},
        requiredBackup: { header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: { header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: { header: 'Contingency Demand', value: item.totalContingentDemand, unit: '-'}
      };
        item.balanceInclCont18Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders18, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: { header: 'Consignment Inventory', value: item.consignmentInventory, unit: '+'},
        requiredBackup: { header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: { header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: { header: 'Contingency Demand', value: item.totalContingentDemand, unit: '-'}
      };
        item.balanceInclCont24Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders24, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: { header: 'Consignment Inventory', value: item.consignmentInventory, unit: '+'},
        requiredBackup: { header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: { header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: { header: 'Contingency Demand', value: item.totalContingentDemand, unit: '-'}
      };      
  }

  onCellValueChanged(event: any): void {
    this.updateCalculatedColumns(event);
    this.gridApi.refreshCells();
    const rowNode = event.node.data;
    const existingRecord = this.editedRecords.find((rec) => rec.materialNumber === rowNode.materialNumber);
    if (!existingRecord) {
      this.editedRecords.push(rowNode);
    }
    this.isEdit = true;
  }
  
  onSave() {
    this.displayConfirmationComponentDialog = true;
    this.pageTitle = "Confirm Save"
    this.pageContent = "Are you sure you want to save the changes?"
    this.buttonName = "Save"
  }
  onClickSave(isPreview: boolean = false) {
    if (isPreview) {
    }
    else { //save
      //transpose tabledata to masterdatalibraryModelTable format
      let transformedValues = [];
      this.editedRecords.forEach((record) => {
        transformedValues.push(this.transformFormValuesToModel(record));
      });
      let mdlRecordstoEdit = [];
      transformedValues.forEach((value: any) => {
        let mdlRecordtoEdit = new masterdatalibraryModelTable(value);
        mdlRecordtoEdit.dateLastModified = new Date();
        mdlRecordtoEdit.userIdModifiedBy = this.userDetail.uid;
        mdlRecordstoEdit.push(mdlRecordtoEdit);
      });
      this.mdlDataService.editMaterials(mdlRecordstoEdit).subscribe({
        next: (response: any) => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Data saved successfully' });
          this.getOdinGridData();
          this.editedRecords = [];
        },
        error: (err) => {
          console.error('Error fetching materials data', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error while saving data' });
          this.loading = false;
        }
      });
    }
    this.displayConfirmationComponentDialog = false;
  }

  transformFormValuesToModel(formValue: any): Partial<masterdatalibraryModelTable> {
    return {
      materialNumber: formValue.materialNumber,
      leadTimeInDays: Number(formValue.leadTimeInDays) || 0,
      requiredBackup: Number(formValue.requiredBackup) || 0,
      OdinActionLookupId: Number(formValue.odinActionLookupId) || 0,
      odinActions: formValue.odinActions || '',
      odinComments: formValue.odinComments || '',
      overrideInventory: Number(formValue.overrideInventory) || 0
    }
  }

  onSelectionChanged(event: any) {
    const selectedRows = event.api.getSelectedRows();
    this.selectedRows = event.api.getSelectedRows()
    this.isButtonDisabled = selectedRows.length === 0;
    const selectedRowIndexes = selectedRows.map(node => node.rowIndex + 1);
  }


  onFilterChanged(event: any): void {
    const filterModel = this.gridApi.getFilterModel();
    if (Object.keys(filterModel).length !== 0 && filterModel.constructor === Object) {
      this.selectedFilterName = "";
      if (filterModel[event.columns[0].colId].values.length > 0) {
        this.selectedInternalFilterName = event.columns[0].colId;
        this.selectedInternalFilterValues = filterModel[event.columns[0].colId].values;
        this.updateFilterDropdowns();
      }
      else {
        //this.filterData = []; //AG-Grid filter SelectAll break fix
        this.updateFilterDropdowns(event.columns[0].colId);
      }
    }
    else {
      this.updateFilterDropdowns(this.selectedFilterName);
    }
  }

  onRigAnalysisPage() {

    let data = {
      selectedRows: this.selectedRows,
      selectedWells: this.selectedWells,
      isP50Selected: this.selectedPType == "P50" ? true : false
    };
    this.commonService.setRigAnalysisData(data);

    this.router.navigateByUrl(routeLinks.odinRigAnalysisCompletion3);
  }

  onWellHeadersCancel() {
    this.displayEditWellHeaders = false;
    this.wellsHeaderCols = [];
    this.displayConfirmationComponentDialog = false;
  }
  onWellHeadersSave() {
    this.displayEditWellHeaders = false;
    this.wellsHeaderCols = [];
    this.getWellMaterials();
    this.displayConfirmationComponentDialog = false;
  }


  //filter change
  updateFilterDropdowns(selectedDropDownType?: string) {

    const fields = [
      'componentTypeName',
      'groupName',
      'nominalOD1',
      'organizationName',
      'weight1',
      'materialGradePrimary',
      'topConnection',
      'project'
    ];
    fields.forEach(field => {
      this.getDistinctValuesFromFilteredData(field, selectedDropDownType);
    });


  }

getDistinctValuesFromFilteredData(dynamicField: string, selectedDropDownType?: string): void {
  const distinctValuesForField: { text: string, value: string }[] = [];

  if (selectedDropDownType) {
    if (dynamicField !== selectedDropDownType) {
      this.filterData.forEach((node: any) => {
        const value = node;

        if (value[selectedDropDownType] !== undefined) {
          const fieldValue = value[dynamicField];
          const textValue = value[dynamicField];

          if (fieldValue !== undefined && fieldValue !== null &&
              !distinctValuesForField.some(item => item.value === fieldValue)) {
            distinctValuesForField.push({ text: textValue, value: fieldValue });
          }
        }
      });

      // Smart sort: Descending for numbers, ascending for strings
      distinctValuesForField.sort((a, b) => {
        const aNum = Number(a.value);
        const bNum = Number(b.value);
        const isNumeric = !isNaN(aNum) && !isNaN(bNum);

        if (isNumeric) {
          return bNum - aNum; // Descending numeric
        } else {
          const textA = String(a.text).toLowerCase();
          const textB = String(b.text).toLowerCase();
          return textA.localeCompare(textB); // Ascending alphabetical
        }
      });

      this.odinFilteredDropDownValue[dynamicField] = distinctValuesForField;
    } else {
      this.odinFilteredDropDownValue[dynamicField] = this.odinFilteredDropDownValue[dynamicField];
    }
  } else {
    // If no selectedDropDownType, just process all filtered nodes
    this.gridApi.forEachNodeAfterFilter((node: any) => {
      const value = node.data;

      if (!value || value[dynamicField] === undefined || value[dynamicField] === null) {
        return; // Skip if value is missing or invalid
      }

      const fieldValue = value[dynamicField];
      const textValue = value[dynamicField];

      if (!distinctValuesForField.some(item => item.value === fieldValue)) {
        distinctValuesForField.push({ text: textValue, value: fieldValue });
      }
    });

    // Smart sort: Descending for numbers, ascending for strings
    distinctValuesForField.sort((a, b) => {
      const aNum = Number(a.value);
      const bNum = Number(b.value);
      const isNumeric = !isNaN(aNum) && !isNaN(bNum);

      if (isNumeric) {
        return bNum - aNum; // Descending numeric
      } else {
        const textA = String(a.text).toLowerCase();
        const textB = String(b.text).toLowerCase();
        return textA.localeCompare(textB); // Ascending alphabetical
      }
    });

    if (this.selectedInternalFilterName === dynamicField) {
      this.odinFilteredDropDownValue[this.selectedInternalFilterName] =
        this.odinFilteredDropDownValue[this.selectedInternalFilterName];
    } else {
      this.odinFilteredDropDownValue[dynamicField] = distinctValuesForField;
    }
  }
}


  // for ag grid external filter

  isExternalFilterPresent = (): boolean => {

    if (this.componentTypeSelected?.length > 0 ||
      this.groupSelected?.length > 0 ||
      this.odSelected?.length > 0 ||
      this.supplierSelected?.length > 0 ||
      this.weightsSelected?.length > 0 ||
      this.gradeSelected?.length > 0 ||
      this.connectionSelected?.length > 0 // ||
      //this.projectSelected?.length > 0) 
     ) {
      return true;
    }
    else {
      return false;
    }

  };

  doesExternalFilterPass = (node: IRowNode<any>): boolean => {


    if (node.data) {
      if (this.componentTypeSelected.length && !this.componentTypeSelected.includes(node.data.componentTypeName)) {
        return false;
      }
      if (this.groupSelected.length && !this.groupSelected.includes(node.data.groupName)) {
        return false;
      }
      if (this.odSelected.length && !this.odSelected.includes(node.data.nominalOD1)) {
        return false;
      }
      if (this.supplierSelected.length && !this.supplierSelected.includes(node.data.organizationName)) {
        return false;
      }
      if (this.weightsSelected.length && !this.weightsSelected.includes(node.data.weight1)) {
        return false;
      }
      if (this.gradeSelected.length && !this.gradeSelected.includes(node.data.materialGradePrimary)) {
        return false;
      }
      if (this.connectionSelected.length && !this.connectionSelected.includes(node.data.topConnection)) {
        return false;
      }
      // Filter by project
      // if (this.projectSelected.length && !this.projectSelected.includes(node.data.project)) {
      //   return false;
      // }

      else {
        return true;
      }

    }
    return true;

  };

  /**
   * Updates the grid based on the Odin Outer Ribbon selection.
   * @param outerRibbonDto 
   * @param type 
   */
  onOuterRibbonSelectionChange(outerRibbonDto: OdinOuterRibbonDto, type: string) {
    // Save the grid state before Recreating columns
    // this.gridStateService.saveStateOnDestroy(this.stateKey);
    if (type == "IncludeContingency") {
      this.showContingency = outerRibbonDto.showContingency
      this.addCalculatedColumns();
      this.createWellColumns();
    }
    if (type == "Month") {
      this.selectedMonthSummary = outerRibbonDto.month;
      this.addWellMaterialDemand();
      this.addCalculatedColumns();
      this.createWellColumns();
    }
    if (type == "PType") {
      this.selectedPType = outerRibbonDto.pType;
      this.addWellMaterialDemand();
      this.addCalculatedColumns();
      this.createWellColumns();
    }
    if (type == "WhatIf") {
      this.runWhatIfURL = outerRibbonDto.whatIf;
      this.selectedScenario = outerRibbonDto.SelectedScenario;
      this.getWellMaterials(); // Fetch well materials for editing
      // this.addWellMaterialDemand();
      // this.addCalculatedColumns();
      // this.createWellColumns();
    }
    if (type == "Wells") {
      this.selectedWells = outerRibbonDto.SelectedWells;
      this.selectedCategory = this.selectedWells?.length ? ['All', 'P', 'C'] : [];
      this.selectedScenario = outerRibbonDto.SelectedScenario;
      this.createWellColumns();
    }
    if (type == "EditWellHeaders") {
      this.getWellMaterials(); // Fetch well materials to populate the headers
    }

    // Handle inventory selection
    if (type == "Inventory") {      
      this.selectedInventory = outerRibbonDto.SelectedInventory;
      this.addCalculatedColumns();
      this.createWellColumns();
      this.clearOverrideInventory();
    }

     // Update the grid state with the new context data
    this.gridStateService.setContextData({
      selectedPType: this.selectedPType,
      selectedMonthSummary: this.selectedMonthSummary,
      showContingency: this.showContingency,
      selectedWells:this.selectedWells,
      selectedInventory: this.selectedInventory
    });

    // Gets the grid saved state
    this.getPersonalization();
  }

  /**
   * Clears the override inventory for all rows in the grid.
   * This method iterates through each row and resets the `overrideInventory` field to 0.
   * It also updates the grid cell value to reflect this change.
   */
  clearOverrideInventory(){
    this.gridApi.forEachNode((node: IRowNode<any>) => {
      if (node.data && node.data.overrideInventory) {
        node.data.overrideInventory = 0; // Reset overrideInventory to 0
        node.setDataValue('overrideInventory', 0); // Update the grid cell value
        // also call onCellValueChanged(event) to update the calculated columns
        this.onCellValueChanged({
          node: node,
          data: node.data,
          colDef: { field: 'overrideInventory' },
          oldValue: node.data.overrideInventory,
          newValue: 0
        });
        // this.gridApi.dispatchEvent({
        //   type: 'cellValueChanged'
        // });
      }
    });
  }

  /**
   * Applies a project filter based on the selected event and type.
   * @param event 
   * @param type 
   */
  applyProjectFilter(event: any, type: string) {
    let projects: string[] = [];
    this.projects.map((project: any) => {
      if (this.projectSelected.includes(project.value)) {
        projects.push(project.value);
      }
    }); 
    
    this.filterData = this.tableData.map(item => ({ ...item }));

    this.filterData.forEach((item) => {
      if(this.projectSelected.length > 0 && !this.projectSelected.includes(item.projectName)) {
        item.cvxOwnedInventory = 0;
        item.yardInventory = 0;
        item.openOrders6 = 0;
        item.openOrders12 = 0;
        item.openOrders18 = 0;
        item.openOrders24 = 0;
        item.consignmentInventory6 = 0;
        item.consignmentInventory12 = 0;
        item.consignmentInventory18 = 0;
        item.consignmentInventory24 = 0;
      }
    });

    this.filterData = this.aggregateByMaterialId(this.filterData);   
    this.addWellMaterialDemand();
    this.addCalculatedColumns();

    this.gridApi.refreshCells();
    //refresh totals
    this.gridApi.refreshClientSideRowModel('aggregate');
  }

  getIdType(wellHead: any) {
    const ID = `customeHeaderExpandButton${wellHead.wellId}${wellHead.wellNumber}`
    const isExist = this.columnsExpanion.findIndex((id: any) => id === ID);
    if (isExist === -1) {
      this.columnsExpanion.push({ id: ID, expanded: false });
    }
    return `${ID}`;
  }

  // Case 1: Collapse all expanded columns
  // If 'expand' is false, and the current column is not expanded, but we still set it to true,
  // then simulate a click on the DOM element with the given ID
  expandOrCollapse(presentId: any, expand: boolean): void {

    this.columnsExpanion.forEach((val: any, index: number) => {
      if (!expand && !val.expanded && (val.expanded = true) && index > 0) {
        const selectorId = document.querySelector(`#${val.id}`) as HTMLInputElement;
        if (selectorId) {
          selectorId.click();
        }
      }
      if ((expand && val.expanded && index > 0)) {
        val.expanded = false
        const selectorId = document.querySelector(`#${val.id}`) as HTMLInputElement;
        if (selectorId) {
          selectorId.click();
        }
      }
    })
  }

  // state to reset personalaization

onResetState() {
    this.gridStateService.resetState();
}
}


