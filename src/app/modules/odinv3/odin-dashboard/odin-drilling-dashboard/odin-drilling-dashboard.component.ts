import { Component, SimpleChange, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { RadioSummaryDrilling } from '../../../../common/model/radio-summary-drilling.model';
import { FirstDataRenderedEvent, GridApi, IRowNode, ITooltipParams, SideBarDef } from 'ag-grid-community';
import { AccessControls, radioSummaryDrilling } from '../../../../common/constant';
import { OverlayPanel } from 'primeng/overlaypanel';
import { MessageService } from 'primeng/api';
import { DatePipe } from '@angular/common';
import { OdinV2Service } from '../../../../services/odinv2.service';
import { WellService } from '../../../../services/well.service';
import { Router } from '@angular/router';
import { IOdinFilterPayloadStore } from '../../../../common/ngrx-store';
import { Store, select } from '@ngrx/store';
import { LocaleTypeEnum, SortOrder, routeLinks, storeFilters } from '../../../../common/enum/common-enum';
import _ from 'lodash';
import { odinMoreFilterModel } from '../../../../common/model/odinMoreFilterModel';
import { Observable, Subscription, forkJoin, map } from 'rxjs';
import { CustomHeaderGroup } from '../../odin-custom-headers/custom-header-group.component';
import { odinDemandTooltip } from '../../odin-custom-headers/odinDemandTooltip.component';
import { CommonService } from '../../../../services/common.service';
import { InventoryService } from '../../../../services/inventory.service';
import { OdinOuterRibbonDto } from '../../../../common/model/OdinOuterRibbonDto';
import { MaterialSaveModel } from '../../../../common/model/materrialModelSave';
import { OdinCommonService } from '../../services/odin-common.service';
import { GridStatePersistenceService } from '../../../../common/builder/persistant-builder.service';
import { CustomerPersonalizationService } from '../../../../services/customer-personalization.service';
import { AuthService } from '../../../../services';
import { ResponsiveService } from '../../../../services/responsive.service';
import { OdinBalanceTooltipComponent } from '../../odin-custom-headers/odin-balance-tooltip.component';
import { LookupsService } from '../../../../services/lookups.service';
import { OdinDrillingDashboardGridData } from '../../../../common/model/odin-drilling-dashboard.model';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { EquipmentInteractiveDialogComponent } from '../../../common/equipment-interactive-dialog/equipment-interactive-dialog.component';
import { ConfirmationDialogComponent } from '../../../common/confirmation-dialog/confirmation-dialog.component';
import { DeleteConfirmationDialogComponent } from '../../../common/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { ProceedConfirmationDialogComponent } from '../../../common/proceed-confirmation-dialog/proceed-confirmation-dialog.component';

@Component({
  selector: 'app-odin-drilling-dashboard',
  standalone:true,
  imports:[...PRIME_IMPORTS,EquipmentInteractiveDialogComponent,
    ConfirmationDialogComponent, DeleteConfirmationDialogComponent,
    ProceedConfirmationDialogComponent
  ],
  templateUrl: './odin-drilling-dashboard.component.html',
  styleUrl: './odin-drilling-dashboard.component.scss'
})
export class OdinV3DrillingDashboardComponent {
  @ViewChild('overlayAddEquipment') overlayAddEquipment: OverlayPanel;
  searchValue: string = '';
  unsavedChanges: boolean = false;
  quickFilterText: string = '';
  odinFilteredDropDownValue = {
    mGroup: [],
    od: [],
    weight: [],
    grade: [],
    connection: [],
    materialType: [],
    vendor: [],
    sourService: [],
    project: [] // Added project filter
  };
  materialTypeSelected: string = '';
  gridApi: GridApi;
  tableData: OdinDrillingDashboardGridData[];
  filterData: OdinDrillingDashboardGridData[];
  groupSelected: string = '';
  odSelected: string[] = [];
  sourServiceSelected: string = '';
  vendorSelected: string = '';
  weightsSelected: string = '';
  gradeSelected: string = '';
  connectionSelected: string = '';
  projectSelected: string = '';
  selectedRadioSummaryColumns: RadioSummaryDrilling[] = radioSummaryDrilling;
  selectedFilterName: string = '';
  selectedPType: string = "P10";
  selectedMonthSummary: number = 12;
  loading: boolean = false;
  columnDefs = [];
  public tooltipShowDelay: number = 0;
  public tooltipHideDelay: number = 20000;
  editedRecords: any[] = [];
  isEdit: boolean = false;
  selectedScenario: number = 0;
  hasRestoredPersonalization:boolean = false;
  height$: Observable<string>;

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
  selectedRows: any[] = [];
  isButtonDisabled: boolean = true;
  currentRowForOverLayPanel: any;
  selectedInternalFilterName: string = '';
  selectedInternalFilterValues: string = '';
  selectedWells: any = [];
  selectedCategory: string[] = [];
  selectAll = [true];
  filters: odinMoreFilterModel;
  subscription: Subscription;
  materialDemand: any;
  wellsHeaderCols: any[];
  gridRequestBody: any;
  searchSelected: string = '';
  rowOffset: number = 1;
  fetchNextRows: number = 10;
  sortBy: string = 'id';
  sortDirection: string = SortOrder.DESC;
  totalRecords: number = 0;
  gridConfig: any = {};
  runWhatIfURL: boolean = false;
  showContingency: boolean = false;
  futureDate: any;
  backUpDays: number = 90;
  newOrderDays: number = 180;
  isAbove: boolean = false;
  displaySaveComponentDialog: boolean = false;
  pageTitle: string = '';
  pageContent: string = '';
  buttonName: string = '';
  displayProceedComponentDialog: boolean = false;
  displayDeleteComponentDialog: boolean = false;
  showDeleteConfirmation: boolean = false;
  selectedEquipment: any = null;
  displayEquipmentDialog: boolean = false;
  hasPrimaryORContingency: boolean = false;
  deleteConfirmationTitle: string = "";
  deleteConfirmationMessage: string = "";
  selectedEquipmentWellList: any = [];
  isNewRowABoveOrBelowAllowed = true;
  private odinCommonServicesubscription: Subscription;
  columnsExpanion: Array<any> = [];
  userDetails:any;
  readonly stateKey = 'Odin - Drilling';
  selectedInventory:number = 1; //1 for SAP Inventory, 2 for Yard Inventory
  projects: any[] | undefined; // Projects for the dropdown
  private odinDrillingSubscription: Subscription = new Subscription();

  constructor(
    private messageService: MessageService,
    private datePipe: DatePipe,
    private commonService: CommonService,
    private odinV2Service: OdinV2Service,
    private inventoryService: InventoryService,
    private wellservice: WellService,
    private router: Router,
    private gridStateService: GridStatePersistenceService,
    private personalizationService: CustomerPersonalizationService,
    private authService: AuthService, // Assuming you have an AuthService for authentication
    private odinCommonService: OdinCommonService,
    private responsiveService: ResponsiveService,
    private lookupService: LookupsService, // lookup service
    private store: Store<{ readOdinAdvanceFilterData: IOdinFilterPayloadStore }>
  ) 
  {
    this.userDetails = this.authService.getUserDetail(); // Get user details from AuthService

  }

  /**
   * Lifecycle hook that is called after data-bound properties are initialized.
   * 
   */
  ngOnInit() {
    //this.getAdvanceFilterData();
    this.sendDrillingFunction();
    this.getUserDetails();
    this.getOuterRibbonPersonalization(); // Get personalization data for outer ribbon
    this.selectedWells?.length ? this.selectedCategory = ['All', 'P', 'C'] : [];
    //this.getAllWellMaterialDemand();
    this.loadWellDashboardData();
    this.getProjects(); // Fetch projects for the dropdown

    this.odinCommonServicesubscription = this.odinCommonService.outerRibbonDto$.subscribe((payload) => {
      this.onOuterRibbonSelectionChange(payload.payload, payload.key);
    });
     this.responsiveService.observeBreakpoints();
     this.height$ = this.responsiveService.getHeight$();
  }

  /**
   * Emits the drilling function event. It will set the selected function as 1, where 1 is for drilling and 2 is for completions.
   */
  sendDrillingFunction() {
    this.odinCommonService.emitFunction(1);  // Emit record to service
  }

  /**
   * Gets the outer ribbon personalization data for the drilling dashboard.
   */
  getOuterRibbonPersonalization() {
    const userId = this.userDetails?.uid || 0;

    this.odinDrillingSubscription = this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
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
      month: context?.selectedMonthSummary || this.selectedMonthSummary,
      pType: context?.selectedPType || this.selectedPType,
      showContingency: context?.showContingency || this.showContingency,
      whatIf: false, // Assuming whatIf is false for drilling dashboard
      SelectedProjects: context?.selectedProjects || this.projectSelected,
      SelectedWells: context?.selectedWells || this.selectedWells,
      SelectedInventory: context?.selectedInventory || this.selectedInventory,
      SelectedScenario: context?.selectedScenario ? context.selectedScenario : 0,
    };
    this.odinCommonService.setOuterRibbonDto(outerRibbonDto,'odinDrilling');
    this.selectedMonthSummary = this.odinCommonService.getOuterRibbonDto().payload?.month;
    this.selectedPType = this.odinCommonService.getOuterRibbonDto().payload?.pType;
    this.runWhatIfURL = this.odinCommonService.getOuterRibbonDto().payload?.whatIf;
    this.selectedScenario = this.odinCommonService.getOuterRibbonDto().payload?.SelectedScenario;
    this.showContingency = this.odinCommonService.getOuterRibbonDto().payload?.showContingency;
    this.selectedWells = this.odinCommonService.getOuterRibbonDto().payload?.SelectedWells;
    this.selectedInventory = this.odinCommonService.getOuterRibbonDto().payload?.SelectedInventory;
  }

  /**
   * Loads the well dashboard data by making parallel API calls to fetch material demand, well headers, and Odin grid data.
   * Sets the loading state and processes the results to update the component state.
   * Handles errors by logging and resetting the state.
   * */
loadWellDashboardData() {
  this.loading = true;
  this.getUserDetails();

  this.odinDrillingSubscription = forkJoin({
    materialDemand: this.wellservice.GetAllOdinWellMaterialDemand(1),
    wellsHeader: this.wellservice.GetOdinWellHeaders(1),
    odinGrid: this.odinV2Service.GetOdin3DrillingDashboard(0, 500),
  }).subscribe({
    next: (result) => {
      // === Material Demand ===
      this.materialDemand = result.materialDemand?.data || [];
      this.materialDemand.forEach((col: any) => {
        if (col.p10StartDate) col.p10StartDate = new Date(col.p10StartDate);
        if (col.p50StartDate) col.p50StartDate = new Date(col.p50StartDate);
      });

      // === Well Headers ===
      this.wellsHeaderCols = (result.wellsHeader || []).filter((item: any) => item.duplicity > 0);
      this.wellsHeaderCols.forEach((col: any) => {
        if (col.p10StartDate) col.p10StartDate = new Date(col.p10StartDate);
        if (col.p50StartDate) col.p50StartDate = new Date(col.p50StartDate);
      });

      // === Odin Grid ===
      const response = result.odinGrid;
      if (response) {
        this.tableData = response; // Only odin records will come from OdinInventoryDrilling stored procedure based on IsOdinMaterial column
        this.selectedWells?.length ? this.selectedCategory = ['All', 'P', 'C'] : [];
        this.filterData = this.aggregateByMaterialId(response.map((item: any) => ({ ...item })));
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

      this.loading = false;
    },
    error: (err) => {
      console.error(err);
      this.totalRecords = 0;
      this.tableData = [];
      this.filterData = [];
      this.loading = false;
    }
  });
}


  /**
   * Gets all well material demand data.
   */
  getAllWellMaterialDemand() {
    this.odinDrillingSubscription = this.wellservice.GetAllOdinWellMaterialDemand(1).subscribe({
      next: (response: any) => {
        if (response) {
          this.materialDemand = response.data;
          this.materialDemand.filter((col: any) => {
            // for p-calendar, need Date with Object instead of String
            if (col.p10StartDate) {
              col.p10StartDate = new Date(col.p10StartDate);
            }
            if (col.p50StartDate) {
              col.p50StartDate = new Date(col.p50StartDate);
            }
          });
          this.getWellsHeaderData();
        }
      },
    });
  }

  /**
   * Gets all the wells and their headers.
   */
  getWellsHeaderData() {
    this.wellsHeaderCols = [];
    this.odinDrillingSubscription = this.wellservice.GetOdinWellHeaders(1).subscribe(data => {
      data.forEach((item) => {
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
      this.getOdinGridData();
    });
  }

  /*
   * state to reset personalaization
   */
  onResetState() {
    this.gridStateService.resetState();
  }

  getOdinGridData() {
    this.loading = true;
    this.getUserDetails();
    this.odinDrillingSubscription = this.odinV2Service.GetOdin3DrillingDashboard(0, 500).subscribe({
      next: (response: any) => {
        
        if (
          response
        ) {
          this.tableData = response; // Only odin records will come from OdinInventoryDrilling stored procedure based on IsOdinMaterial column
          this.selectedWells?.length ? this.selectedCategory = ['All', 'P', 'C'] : [];
          this.filterData = this.tableData.map(item => ({ ...item }));
          this.filterData = this.aggregateByMaterialId(this.filterData);
          this.totalRecords = this.filterData.length;
          this.addWellMaterialDemand();
          this.addCalculatedColumns();
          this.createWellColumns();
          this.getPersonalization();

          //this.getLookUpDataFromTable();
          this.loading = false;
        } else {
          this.totalRecords = 0;
          this.tableData = [];
          this.filterData = [];
          this.loading = false;
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
      const key = item.materialId;  

      if (!aggregatedMap.has(key)) {
        // Clone item so we don't mutate the original
        aggregatedMap.set(key, { ...item });
      } else {
        const existing = aggregatedMap.get(key);

        // Sum up numerical fields
        existing.cvxOwnedInventory = (existing.cvxOwnedInventory || 0) + (item.cvxOwnedInventory || 0);
        existing.yardInventory = (existing.yardInventory || 0) + (item.yardInventory || 0);
        existing.openOrders6 = (existing.openOrders6 || 0) + (item.openOrders6 || 0);
        existing.openOrders12 = (existing.openOrders12 || 0) + (item.openOrders12 || 0);
        existing.openOrders18 = (existing.openOrders18 || 0) + (item.openOrders18 || 0);
        existing.openOrders24 = (existing.openOrders24 || 0) + (item.openOrders24 || 0);
      }
    });

    return Array.from(aggregatedMap.values());
  }



  addWellMaterialDemand() {
    let isWhatIf = this.runWhatIfURL ? 1 : 0;
    let wellsHeaderCols = this.wellsHeaderCols?.filter(item => item.whatIf == isWhatIf && item.edition === this.selectedScenario);

    this.filterData?.forEach((item) => {
      item.wellMaterials = [];
      wellsHeaderCols.forEach((well) => {
        let wellMaterial = this.materialDemand?.find(w => w.wellId == well.id && w.materialId == item.materialId && w.whatIf == (this.runWhatIfURL ? 1 : 0));
        if (!wellMaterial || wellMaterial.length == 0) {
          // Create a new wellMaterial entry if it doesn't exist
          wellMaterial = {
            id: well.wellId, 
            wellId: well.wellId, 
            wellNumber: well.wellNumber, 
            primaryQuantity: 0, 
            contingentQuantity: 0,
            materialId: item.materialId, 
            p10StartDate: well.p10StartDate, 
            p50StartDate: well.p50StartDate, 
            wellName: well.wellName, 
            projectName: well.projectName, 
            plantCode: well.plantCode
          };
        }        
        item.wellMaterials.push(wellMaterial);
      });
    });
  }

  addCalculatedColumns() {
    const toNum = (v: any) => {
      const num = Number.isFinite(Number(v)) ? Number(v) : 0;
      return Math.round(num * 100) / 100;
    };
    const dateSelectedMonth = new Date();
    dateSelectedMonth.setMonth(dateSelectedMonth.getMonth() + parseInt(this.selectedMonthSummary.toString()));

    this.filterData?.forEach((item) => {
      let totalPrimaryDemand = 0;
      let totalContingentDemand = 0;
      item.totalPrimaryDemandTooltip = [];
      item.totalContingencyDemandTooltip = [];
      item?.wellMaterials?.forEach((wellMaterial: any) => {
        let runOutDate = new Date(this.selectedPType == "P50" ? wellMaterial?.p50StartDate : wellMaterial?.p10StartDate);
        if (runOutDate < dateSelectedMonth && (this.projectSelected.length == 0 || this.projectSelected.includes(wellMaterial.projectName))) {
          totalPrimaryDemand = totalPrimaryDemand + (wellMaterial.primaryQuantity == null ? 0 : Number(wellMaterial.primaryQuantity));
          totalContingentDemand = totalContingentDemand + (wellMaterial.contingentQuantity == null ? 0 : Number(wellMaterial.contingentQuantity));

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
        }
      });
      
      item.totalPrimaryDemand = Math.round(totalPrimaryDemand);
      item.totalContingencyDemand = Math.round(totalContingentDemand);

      //item.cvxOwnedInventory = item.generalAccount + item.jackStMalo + item.tahiti + item.bigFoot + item.blindFaith + item.anchor + item.ballymore + item.surplus;

      // Update ODIN Dashboard Downstream Calculations to Account the Calculation Value Column
      let calculatedCvxOwnedInventory = (item.overrideInventory && item.overrideInventory) > 0 ? item.overrideInventory : this.selectedInventory == 1 ? item.cvxOwnedInventory || 0 : item.yardInventory || 0;
     calculatedCvxOwnedInventory = toNum(calculatedCvxOwnedInventory)
      // drillQuip: adjustment factor
      // Calculate the balance based on the selected month and contingency
      if(!this.showContingency) {
        item.balance6 = Math.round((item.openOrders6 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0));
        item.balance12 = Math.round((item.openOrders12 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0));
        item.balance18 = Math.round((item.openOrders18 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0));
        item.balance24 = Math.round((item.openOrders24 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0));
      }
      else{
        
        item.balance6 = Math.round((item.openOrders6 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
        item.balance12 = Math.round((item.openOrders12 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
        item.balance18 = Math.round((item.openOrders18 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
        item.balance24 = Math.round((item.openOrders24 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
      }

      
      // item.balanceInclCont6 = Math.round((item.openOrders6 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
      // item.balanceInclCont12 = Math.round((item.openOrders12 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
      // item.balanceInclCont18 = Math.round((item.openOrders18 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));
      // item.balanceInclCont24 = Math.round((item.openOrders24 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory || 0) - (item.requiredBackup || 0) - (totalPrimaryDemand || 0) - (totalContingentDemand || 0));

      // Adding the logic for objects of balance tooltip
      
      item.balanceInclCont6Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders6, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: {header: 'Consignment Inventory', value: item.tenaris, unit: '+'},
        //drillQuip: {header: 'Adjustment Factor', value: item.drillQuip, unit: '+'},
        requiredBackup: {header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: {header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: {header: 'Contingency Demand', value: totalContingentDemand, unit: '-'}
      };
      item.balanceInclCont12Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders12, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: {header: 'Consignment Inventory', value: item.tenaris, unit: '+'},
        //drillQuip: {header: 'Adjustment Factor', value: item.drillQuip, unit: '+'},
        requiredBackup: {header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: {header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: {header: 'Contingency Demand', value: totalContingentDemand, unit: '-'}
      };
      item.balanceInclCont18Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders18, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: {header: 'Consignment Inventory', value: item.tenaris, unit: '+'},
        //drillQuip: {header: 'Adjustment Factor', value: item.drillQuip, unit: '+'},
        requiredBackup: {header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: {header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: {header: 'Contingency Demand', value: totalContingentDemand, unit: '-'}
      };
      item.balanceInclCont24Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders24, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: {header: 'Consignment Inventory', value: item.tenaris, unit: '+'},
        //drillQuip: {header: 'Adjustment Factor', value: item.drillQuip, unit: '+'},
        requiredBackup: {header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: {header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: {header: 'Contingency Demand', value: totalContingentDemand, unit: '-'}
      };
    });
  }

  createWellColumns() {
    //let wellsHeaderCols = this.wellsHeaderCols?.filter(item => item.whatIf == (this.runWhatIfURL ? 1 : 0));
    let isWhatIf = this.runWhatIfURL ? 1 : 0;
    let wellsHeaderCols = this.wellsHeaderCols?.filter(item => item.whatIf == isWhatIf && item.edition === this.selectedScenario);
    //filter wells based on selected Start Date
    let dateSelectedMonth: Date = new Date();
    dateSelectedMonth.setMonth(dateSelectedMonth.getMonth() + this.selectedMonthSummary);
    let wellColumns;
    let filteredWellsHeaderCols = wellsHeaderCols?.filter((w) => this.selectedWells?.includes(w.wellId));
    if (filteredWellsHeaderCols) {
      if (this.selectedPType == "P10") {
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


      wellColumns = filteredWellsHeaderCols?.map(well => {
      // Define the children dynamically based on the selected radio button
      const children = [];

      children.push({
          headerName: "Primary",
          field: `well${well.wellId}_primary`,
          valueGetter: (params) => {
            return params.data?.wellMaterials?.find(w => w.id == well.wellId)?.primaryQuantity || 0
          },
          valueSetter: (params) => {
            let wellMaterial = params.data?.wellMaterials?.find(w => w.id == well.wellId);
            wellMaterial.primaryQuantity = params.newValue; // Update the value
            return true;
          },
          cellRenderer: (params) => {
            //return params.value;
            const value = Math.floor(parseFloat(params.value)); // Convert to number and round down
            return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          },
          cellStyle: params => { 
            if (params.node.level === -1) { return { 'font-weight': 'bold' }; } 
            else{
              if(!this.selectedCategory.includes('C')){
                return { 'border-right': '2px solid #000' };
              }
              else{
                return { 'border-right': '0px' };
              }
            }
          },
          minWidth: !this.selectedCategory.includes('C') && this.selectedCategory.includes('P') ? 210 : 110,
          editable: this.authService.isFieldEditable('primary'),
          hide: !this.selectedCategory.includes('P'),
          filter: 'agNumberColumnFilter'
        });

        children.push({
          headerName: "Contingency",
          field: `well${well.wellId}_contingency`,
          valueGetter: (params) => {
            return params.data?.wellMaterials?.find(w => w.id == well.wellId)?.contingentQuantity || 0
          },
          valueSetter: (params) => {
            let wellMaterial = params.data?.wellMaterials?.find(w => w.id == well.wellId);
            wellMaterial.contingentQuantity = params.newValue; // Update the value
            return true;
          },
          cellRenderer: (params) => {
            //return params.value;
            const value = Math.floor(parseFloat(params.value)); // Convert to number and round down
            return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format the number
          },
          cellStyle: params => { 
            if (params.node.level === -1) { return { 'font-weight': 'bold' }; } 
            else{
              // add border right
                return { 'border-right': '2px solid #000' };
            }
          },
          minWidth: !this.selectedCategory.includes('P') && this.selectedCategory.includes('C') ? 210 : 150,
          editable: this.authService.isFieldEditable('contingency'),
          hide: !this.selectedCategory.includes('C'),
          filter: 'agNumberColumnFilter'
        });
        //}

        return {
          headerGroupComponent: CustomHeaderGroup,
          headerGroupComponentParams: {
            "WellDetails": well, "SelectedDateType": this.selectedPType,
            onClick: (event: any) => {
              this.expandOrCollapse(event, event.type);
            },
            uniqueId: this.getIdType(well)
          },
          headerName: well["wellName"].toString(),
          field: well,
          minWidth: 150,
          editable: true,
          autoHeaderHeight: true,
          children: children,
          marryChildren: true
        };
      });

    }
    //green - Market Unit Price, Tier, HoleSection, HSType, Group, OD, Wall, Weight, Grade, Connection, Vendor, Manufacturer #, Sour Service - rgb(229, 255, 241)
    const greenCols = [
      {
        columnGroupShow: 'open', field: "marketUnitPrice", headerName: "Market Unit Price", sortable: true, 
        hide:!this.authService.isFieldEditable('marketUnitPrice'), 
        editable: this.authService.isFieldEditable('marketUnitPrice'), 
        filter: true, wrapHeaderText: true, minWidth: 150,
        // Format the number as currency with commas and two decimal places
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number and round down
          return isNaN(value) ? params.value : `$${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'font-weight': 'bold', 'text-align': 'right' };
          }
          else {
            return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)', 'text-align': 'right' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "tier", headerName: "Tier", sortable: true, filter: true, minWidth: 100, 
        editable: this.authService.isFieldEditable('tier'),
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' };
        },
      },
      {
        columnGroupShow: 'open', field: "holeSection", headerName: "Hole Section", sortable: true, filter: true, 
        editable: this.authService.isFieldEditable('holeSection'), minWidth: 100, wrapHeaderText: true, 
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' };
        },
      },
      {
        columnGroupShow: 'open', field: "hsType", headerName: "Hole Section Type", sortable: true, filter: true, 
        minWidth: 140, editable: this.authService.isFieldEditable('hsType'), wrapHeaderText: true, 
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      {
        columnGroupShow: 'open', field: "mGroup", headerName: "Material Group", sortable: true, filter: true, 
        minWidth: 150, editable: this.authService.isFieldEditable('mGroup'),wrapHeaderText: true, 
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      {
        columnGroupShow: 'open', field: "od", headerName: "Nominal/Max OD (IN)", sortable: true, filter: true, 
        minWidth: 140, editable: this.authService.isFieldEditable('od'),wrapHeaderText: true, 
        cellRenderer: (params) => {
          if (params.node.level !== -1) {
            return params.value;
          }
        },
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      {
        columnGroupShow: 'open', field: "wall", headerName: "Wall Thickness (IN)", sortable: true, filter: true, 
        minWidth: 140, editable: this.authService.isFieldEditable('wall'),wrapHeaderText: true, 
        cellRenderer: (params) => {
          if (params.node.level !== -1) {
            return params.value;
          }
        },
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      {
        columnGroupShow: 'open', field: "weight", headerName: "Weight (LB)", sortable: true, filter: true, 
        minWidth: 100, editable: this.authService.isFieldEditable('weight'),wrapHeaderText: true, 
        cellRenderer: (params) => {
          if (params.node.level !== -1) {
            return params.value;
          }
        },
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      {
        columnGroupShow: 'open', field: "grade", headerName: "Material Grade", sortable: true, filter: true, 
        minWidth: 120, editable: this.authService.isFieldEditable('grade'),wrapHeaderText: true, 
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      {
        columnGroupShow: 'open', field: "connection", headerName: "Connection", sortable: true, filter: true, 
        editable: this.authService.isFieldEditable('connection'), minWidth: 130,wrapHeaderText: true, 
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      {
        columnGroupShow: 'open', field: "vendor", headerName: "Manufacturer", sortable: true, filter: true, 
        minWidth: 140, editable: this.authService.isFieldEditable('vendor'),wrapHeaderText: true, 
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      {
        columnGroupShow: 'open', field: "manufacturerNum", headerName: "Supplier Part #", sortable: true, 
        filter: true, editable: this.authService.isFieldEditable('manufacturerNum'), minWidth: 120,wrapHeaderText: true, 
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      {
        columnGroupShow: 'open', field: "sourService", headerName: "Sour Service", wrapHeaderText: true, 
        sortable: true, filter: true, editable: this.authService.isFieldEditable('sourService'), minWidth: 100,
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      // Added column Unit Of Measurement
      { columnGroupShow: 'open', headerName: 'UoM (FT or EA)', field: 'uom', wrapHeaderText: true, sortable: true, 
        filter: true, editable: this.authService.isFieldEditable('uom'), minWidth: 110 ,
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
      // Added column vendor SAP #
      { columnGroupShow: 'open', headerName: 'Manufacturer SAP #', field: 'vendorSapnumber', wrapHeaderText: true, 
        sortable: true, filter: true, editable: this.authService.isFieldEditable('vendorSapnumber'), minWidth: 150 ,
        cellStyle: params => {
          return { 'background-color': 'rgb(229, 255, 241)', 'border-color': 'rgb(229, 255, 241)' }
        },
      },
    ]
    const peachCols = [
      //peach - General Account, Jack St Malo, Tahiti, Big Foot, Blind Faith, Anchor, Ballymore, Surplus/Audit - rgb(255, 237, 223)
      {
        columnGroupShow: 'open', field: "generalAccount", headerName: "General Account", wrapHeaderText: true, 
        sortable: true, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }, minWidth: 110,
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
        columnGroupShow: 'open', field: "jackStMalo", headerName: "Jack St Malo", wrapHeaderText: true, sortable: true, filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }, minWidth: 100,
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
        columnGroupShow: 'open', field: "tahiti", headerName: "Tahiti", sortable: true, filter: 'agNumberColumnFilter', minWidth: 90,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
        columnGroupShow: 'open', field: "bigFoot", headerName: "Big Foot", wrapHeaderText: true, sortable: true, filter: 'agNumberColumnFilter', 
        minWidth: 100,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
        columnGroupShow: 'open', field: "blindFaith", headerName: "Blind Faith", wrapHeaderText: true, sortable: true, 
        filter: 'agNumberColumnFilter', minWidth: 90,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
        columnGroupShow: 'open', field: "anchor", headerName: "Anchor", sortable: true, filter: 'agNumberColumnFilter', minWidth: 100,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
        columnGroupShow: 'open', field: "ballymore", headerName: "Ballymore", sortable: true, filter: 'agNumberColumnFilter', minWidth: 110,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
        columnGroupShow: 'open', field: "surplus", headerName: "Surplus/Audit", sortable: true, filter: 'agNumberColumnFilter', minWidth: 140,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
      // {
      //   columnGroupShow: 'open', field: "sooner", headerName: "Sooner", sortable: true, filter: 'agNumberColumnFilter', minWidth: 100, editable: this.authService.isFieldEditable('sooner'),
      //   valueFormatter: (params) => {
      //     const value = Math.floor(parseFloat(params.value)); // Convert to number
      //     return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      //   },
      //   cellStyle: params => {
      //     if (params.node.level === -1) {
      //       return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
      //     }
      //     else {
      //       return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
      //     }
      //   },
      // },
      // {
      //   columnGroupShow: 'open', field: "tenaris", headerName: "Tenaris", sortable: true, filter: 'agNumberColumnFilter', minWidth: 100, editable: this.authService.isFieldEditable('tenaris'),
      //   valueFormatter: (params) => {
      //     const value = Math.floor(parseFloat(params.value)); // Convert to number
      //     return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      //   },
      //   cellStyle: params => {
      //     if (params.node.level === -1) {
      //       return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
      //     }
      //     else {
      //       return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
      //     }
      //   },
      // },
      // {
      //   columnGroupShow: 'open', field: "drillQuip", headerName: "Adjustment Factor", sortable: true, wrapHeaderText: true, filter: 'agNumberColumnFilter', minWidth: 130, editable: this.authService.isFieldEditable('drillQuip'),
      //   valueFormatter: (params) => {
      //     const value = Math.floor(parseFloat(params.value)); // Convert to number
      //     return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      //   },
      //   cellStyle: params => {
      //     if (params.node.level === -1) {
      //       return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
      //     }
      //     else {
      //       return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
      //     }
      //   },
      // },
      {
        columnGroupShow: 'open', field: "openOrClosed", headerName: "Open / Closed", sortable: true, filter: 'agNumberColumnFilter', 
        minWidth: 140, editable: this.authService.isFieldEditable('openOrClosed'),
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "leadTimeInDays", headerName: "Lead Time (Days)", wrapHeaderText: true, sortable: true, 
        filter: true, minWidth: 120, editable: this.authService.isFieldEditable('leadTimeInDays'),
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "openOrders6", headerName: "Incoming Orders", wrapHeaderText: true, sortable: true, 
        filter: 'agNumberColumnFilter', minWidth: 120,
        hide: this.selectedMonthSummary != 6,
        suppressColumnsToolPanel: this.selectedMonthSummary != 6,  // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "openOrders12", headerName: "Incoming Orders", wrapHeaderText: true, sortable: true, filter: true, minWidth: 120,
        hide: this.selectedMonthSummary != 12,
        suppressColumnsToolPanel: this.selectedMonthSummary != 12,  // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "openOrders18", headerName: "Incoming Orders", wrapHeaderText: true, sortable: true, filter: true, minWidth: 120,
        hide: this.selectedMonthSummary != 18,
        suppressColumnsToolPanel: this.selectedMonthSummary != 18, // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
          }
        },
      },
      {
        columnGroupShow: 'open', field: "openOrders24", headerName: "Incoming Orders", wrapHeaderText: true, sortable: true, filter: true, minWidth: 120,
        hide: this.selectedMonthSummary != 24,
        suppressColumnsToolPanel: this.selectedMonthSummary != 24, // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)', 'font-weight': 'bold' };
          }
          else {
            return { 'background-color': 'rgb(235, 235, 235)', 'border-color': 'rgb(235, 235, 235)' }
          }
        },
      },
    ]

    // Materials Section
    const materials = [
      {
        columnGroupShow: '', field: "materialType", headerName: "Component Type", sortable: true, filter: true, minWidth: 140, pinned: "left",
        checkboxSelection: (params) => { return params.node.level === -1 ? false : true },
        cellRenderer: (params) => {
          if (params.node.level === -1) {
            return `Total`;
          }
          return params.value;
        },
        cellStyle: params => {
          if (params.node.level === -1) { return { 'font-weight': 'bold' }; }
        },
        wrapHeaderText: true
      },
      { columnGroupShow: '', field: "materialShortDesc", headerName: "Material Description", sortable: true, filter: true, minWidth: 320, pinned: "left", },
      { columnGroupShow: '', field: "sapMM", headerName: "Material ID", sortable: true, filter: true, pinned: "left", cellStyle: { 'text-decoration': 'underline', cursor: 'pointer' }, wrapHeaderText: true }
    ]
    // Filter out columns with hide:true so they do not appear in the sidebar
    const filterHiddenColumns = (columns) => columns.filter(col => !col.hide);
    this.columnDefs = [{ headerName: "Material", children: [...materials, ...filterHiddenColumns(greenCols)] }];

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
          return params.data?.cvxOwnedInventory - params.data?.yardInventory || 0; // Calculate discrepancy as cvxOwnedInventory - yardInventory
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
       { columnGroupShow: '', field: "overrideInventory", headerName: "Calculated Inventory", sortable: true,wrapHeaderText: true, 
        minWidth: 130, editable: this.authService.isFieldEditable('overrideInventory'),
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? '': `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;// Format with commas if it's a number
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
          if (params.data?.overrideInventory) {
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
        field: "balance6", headerName: !this.showContingency ? "Balance" : "Balance (Incl. Cont.)", sortable: true, filter: true, minWidth: 100,
        hide: this.selectedMonthSummary != 6,
        suppressColumnsToolPanel: this.selectedMonthSummary != 6, // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        tooltipComponent: OdinBalanceTooltipComponent, // Balance tooltip component added
        tooltipComponentParams: (params: ITooltipParams) => {

        // Getting the tooltip value from the add and update calculated methods
        return { demandDetails: params.data.balanceInclCont6Tooltip, isContingent: this.showContingency };
        },
        tooltipField: "balance6",
        cellRenderer: params => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          if (params.node.level === -1) {
            return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          }
          if (value < 0) {
            return `<span class = 'pi pi-chevron-circle-down balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          } else if (value < 1000) {
            return `<span class = 'pi pi-exclamation-circle balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          } else {
            return `<span class = 'pi pi-chevron-circle-up balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          }
        },
        ////cellStyle red if value is negative, orange if less than 1000 and green if greater than 1000
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
          if (Math.floor(parseFloat(params.value)) < 0) {
            return { 'background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
          } else if (Math.floor(parseFloat(params.value)) < 1000) {
            return { 'background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
          } else {
            return { 'background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
          }
        }, wrapHeaderText: true
      },
      {
        field: "balance12", headerName: !this.showContingency ? "Balance" : "Balance (Incl. Cont.)", sortable: true, filter: true, minWidth: 100,
        hide: this.selectedMonthSummary != 12,
        suppressColumnsToolPanel: this.selectedMonthSummary != 12, // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        tooltipComponent: OdinBalanceTooltipComponent, // Balance tooltip component added
        tooltipComponentParams: (params: ITooltipParams) => {

        // Getting the tooltip value from the add and update calculated methods
        return { demandDetails: params.data.balanceInclCont12Tooltip, isContingent: this.showContingency };
        },
        tooltipField: "balance12",
        cellRenderer: params => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          if (params.node.level === -1) {
            return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          }
          if (value < 0) {
            return `<span class = 'pi pi-chevron-circle-down balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          } else if (value < 1000) {
            return `<span class = 'pi pi-exclamation-circle balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          } else {
            return `<span class = 'pi pi-chevron-circle-up balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          }
        },
        ////cellStyle red if value is negative, orange if less than 1000 and green if greater than 1000
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
          if (Math.floor(parseFloat(params.value)) < 0) {
            return { 'background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
          } else if (Math.floor(parseFloat(params.value)) < 1000) {
            return { 'background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
          } else {
            return { 'background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
          }
        }, wrapHeaderText: true
      },
      {
        field: "balance18", headerName: !this.showContingency ? "Balance" : "Balance (Incl. Cont.)", sortable: true, filter: true, minWidth: 100,
        hide: this.selectedMonthSummary != 18,
        suppressColumnsToolPanel: this.selectedMonthSummary != 18, // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
                tooltipComponent: OdinBalanceTooltipComponent, // Balance tooltip component added
        tooltipComponentParams: (params: ITooltipParams) => {

        // Getting the tooltip value from the add and update calculated methods
        return { demandDetails: params.data.balanceInclCont18Tooltip, isContingent: this.showContingency };
        },
        tooltipField: "balance18",
        cellRenderer: params => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          if (params.node.level === -1) {
            return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          }
          if (value < 0) {
            return `<span class = 'pi pi-chevron-circle-down balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          } else if (value < 1000) {
            return `<span class = 'pi pi-exclamation-circle balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          } else {
            return `<span class = 'pi pi-chevron-circle-up balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          }
        },
        ////cellStyle red if value is negative, orange if less than 1000 and green if greater than 1000
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
          if (Math.floor(parseFloat(params.value)) < 0) {
            return { 'background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
          } else if (Math.floor(parseFloat(params.value)) < 1000) {
            return { 'background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
          } else {
            return { 'background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
          }
        }, wrapHeaderText: true
      },
      {
        field: "balance24", headerName: !this.showContingency ? "Balance" : "Balance (Incl. Cont.)", sortable: true, filter: true, minWidth: 100,
        hide: this.selectedMonthSummary != 24,
        suppressColumnsToolPanel: this.selectedMonthSummary != 24, // Hide from the columns tool panel on the right
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        },
        tooltipComponent: OdinBalanceTooltipComponent, // Balance tooltip component added
        tooltipComponentParams: (params: ITooltipParams) => {

        // Getting the tooltip value from the add and update calculated methods
        return { demandDetails: params.data.balanceInclCont24Tooltip, isContingent: this.showContingency };
        },
        tooltipField: "balance24",
        cellRenderer: params => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          if (params.node.level === -1) {
            return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          }
          if (value < 0) {
            return `<span class = 'pi pi-chevron-circle-down balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          } else if (value < 1000) {
            return `<span class = 'pi pi-exclamation-circle balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          } else {
            return `<span class = 'pi pi-chevron-circle-up balanceIcons' style='margin-left:-15px;'></span><span style='float:right'>${isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>`;
          }
        },
        ////cellStyle red if value is negative, orange if less than 1000 and green if greater than 1000
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
          if (Math.floor(parseFloat(params.value)) < 0) {
            return { 'background-color': 'var(--theme-red-color-op25)', 'border-color': 'var(--theme-red-color-op25)' };
          } else if (Math.floor(parseFloat(params.value)) < 1000) {
            return { 'background-color': 'var(--theme-orange-color-op25)', 'border-color': 'var(--theme-orange-color-op25)', };
          } else {
            return { 'background-color': 'var(--theme-green-color-op25)', 'border-color': 'var(--theme-green-color-op25)' };
          }
        }, wrapHeaderText: true
      },
      {
        headerName: "Inventory On Hand",
        wrapHeaderText: true,
        children: [
          {
            columnGroupShow: '', field: "overrideInventory", headerName: "CVX Inventory", minWidth: 120, wrapHeaderText: true, editable: false,
            valueFormatter: (params) => {
              const value = Math.floor(parseFloat(params.value)); // Convert to number
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;// Format with commas if it's a number
            },
            valueGetter: (params) => {
              return (params.data?.overrideInventory && params.data?.overrideInventory) > 0 ? params.data.overrideInventory : this.selectedInventory == 1 ? params.data?.cvxOwnedInventory : params.data?.yardInventory; // Use overrideInventory if available, otherwise use cvxOwnedInventory
            },
            cellStyle: params => {
              if (params.node.level === -1) {
                return { 'font-weight': 'bold' };
              }
            },
            filter: 'agNumberColumnFilter'
          },
          ...peachCols,
          
        ]
      },
      {
        field: "tenaris", headerName: "Consignment Inventory", sortable: true, minWidth: 135, wrapHeaderText: true,
        editable: this.authService.isFieldEditable('tenaris'),
        valueFormatter: (params) => {
          //return params.value.toLocaleString('en-US'); // Format with commas
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
      {
        headerName: "Lead Times",
        children: [
          {
            columnGroupShow: '', field: "openOrders6", headerName: "Open Orders", minWidth: 130,filter: 'agNumberColumnFilter',
            hide: this.selectedMonthSummary != 6,
            suppressColumnsToolPanel: this.selectedMonthSummary != 6,  // Hide from the columns tool panel on the right
            valueFormatter: (params) => {
              const value = Math.floor(parseFloat(params.value)); // Convert to number
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
            },
            cellStyle: params => {
              if (params.node.level === -1) {
                return { 'font-weight': 'bold' };
              }
            },
            wrapHeaderText: true,
            
          },
          {
            columnGroupShow: '', field: "openOrders12", headerName: "Open Orders", minWidth: 130,filter: 'agNumberColumnFilter',
            hide: this.selectedMonthSummary != 12,
            suppressColumnsToolPanel: this.selectedMonthSummary != 12,  // Hide from the columns tool panel on the right
            valueFormatter: (params) => {
              const value = Math.floor(parseFloat(params.value)); // Convert to number
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;// Format with commas if it's a number
            },
            cellStyle: params => {
              if (params.node.level === -1) {
                return { 'font-weight': 'bold' };
              }
            },
            wrapHeaderText: true
          },
          {
            columnGroupShow: '', field: "openOrders18", headerName: "Open Orders", minWidth: 130,filter: 'agNumberColumnFilter',
            hide: this.selectedMonthSummary != 18,
            suppressColumnsToolPanel: this.selectedMonthSummary != 18,  // Hide from the columns tool panel on the right
            valueFormatter: (params) => {
              const value = Math.floor(parseFloat(params.value)); // Convert to number
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
            },
            cellStyle: params => {
              if (params.node.level === -1) {
                return { 'font-weight': 'bold' };
              }
            },
            wrapHeaderText: true
          },
          {
            columnGroupShow: '', field: "openOrders24", headerName: "Open Orders", minWidth: 130,filter: 'agNumberColumnFilter',
            hide: this.selectedMonthSummary != 24,
            suppressColumnsToolPanel: this.selectedMonthSummary != 24,  // Hide from the columns tool panel on the right
            valueFormatter: (params) => {
              const value = Math.floor(parseFloat(params.value)); // Convert to number
              return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
            },
            cellStyle: params => {
              if (params.node.level === -1) {
                return { 'font-weight': 'bold' };
              }
            },
            wrapHeaderText: true
          },
          ...greyCols,
          {
            columnGroupShow: 'open', field: "", headerName: "Well", minWidth: 140,
            valueGetter: (params: any) => {
              return this.findWell(params, "Well");
            },
            cellStyle: params => {
              if (params.node.level === -1) {
                return { 'font-weight': 'bold' };
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
                return { 'font-weight': 'bold' };
              }
            },
            wrapHeaderText: true
          },
          {
            columnGroupShow: 'open', field: "", headerName: "Re-Order By Date", minWidth: 120,
            valueGetter: (params: any) => {
              return this.findWell(params, "Re-order By Date");
            },
            cellStyle: params => {
              if (params.node.level === -1) {
                return { 'font-weight': 'bold' };
              }
            },
            wrapHeaderText: true
          },
        ]
      },
      {
        field: "totalPrimaryDemand", headerName: "Primary Demand", wrapHeaderText: true,
        cellRenderer: (params) => {

          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;// Format with commas if it's a number

        },
        tooltipComponent: odinDemandTooltip,
        tooltipComponentParams: (params: ITooltipParams) => {

        // Getting the tooltip value from the add and update calculated methods
        return { demandDetails: params.data.totalPrimaryDemandTooltip, materialId: params.data.materialId };
        },
        tooltipField: "totalPrimaryDemand",
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
        },
        filter: 'agNumberColumnFilter',
      },
      {
        field: "requiredBackup", headerName: "Required B/U", minWidth: 110, wrapHeaderText: true, editable: this.authService.isFieldEditable('requiredBackup'), valueFormatter: (params) => {
          //return params.value.toLocaleString('en-US'); // Format with commas
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;// Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
        },
        filter: 'agNumberColumnFilter',
      },
      {
        field: "totalContingencyDemand", headerName: "Contingency Demand", minWidth: 129, wrapHeaderText: true,
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellRenderer: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        tooltipComponent: odinDemandTooltip,
        tooltipComponentParams: (params: ITooltipParams) => {

        // Getting the tooltip value from the add and update calculated methods
        return { demandDetails: params.data.totalContingencyDemandTooltip, materialId: params.data.materialId };

        },
        tooltipField: "totalContingencyDemand",
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
        },
        filter: 'agNumberColumnFilter',
      },
      // Added Class B
      {
        field: "classB", headerName: "Class B", minWidth: 100, wrapHeaderText: true,filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
        },
      },
      {
        field: "classC", headerName: "Class C", minWidth: 100, wrapHeaderText: true,filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
        },
      },
      {
        field: "surplus", headerName: "Surplus", minWidth: 100, wrapHeaderText: true,filter: 'agNumberColumnFilter',
        valueFormatter: (params) => {
          const value = Math.floor(parseFloat(params.value)); // Convert to number
          return isNaN(value) ? params.value : `${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Format with commas if it's a number
        },
        cellStyle: params => {
          if (params.node.level === -1) {
            return { 'font-weight': 'bold' };
          }
        },
      },
      // Added column UoM (FT or EA)
      // {
      //   columnGroupShow: 'open', headerName: 'UoM (FT or EA)', field: 'uom', wrapHeaderText: true, sortable: true, filter: true, editable: this.authService.isFieldEditable('uom'), minWidth: 170 ,        
      // },
      { field: "comments", headerName: "Comments", editable: this.authService.isFieldEditable('comments'), minWidth: 120, wrapHeaderText: true, cellEditor: 'agLargeTextCellEditor', cellEditorPopup: true },
    ];
    if (wellColumns == undefined || wellColumns.length == 0) {
      this.columnDefs = [...this.columnDefs, ...otherCols];
    }
    else {
      this.columnDefs = [...this.columnDefs, ...wellColumns, ...otherCols];
    }
  }

  /**
   * 
   * @param params 
   * @param field 
   * @returns The function checks if there is sufficient backup inventory for well materials and returns the wellname and deficit P10 date if there is a deficit.
   */
  findWell(params: any, field: string): any {
    if (params.data) {
      const { materialId, openOrders6, openOrders12, openOrders18, openOrders24, overrideInventory, cvxOwnedInventory, yardInventory, requiredBackup, totalPrimaryDemand, totalContingencyDemand, consignmentInventory, wellMaterials } = params.data;
      // Update ODIN Dashboard Downstream Calculations to Account the Calculation Value Column
      let calculatedCvxOwnedInventory = parseInt((overrideInventory && overrideInventory) > 0 ? overrideInventory : this.selectedInventory == 1 ? cvxOwnedInventory : yardInventory);
      let openOrders = 0;
      switch (this.selectedMonthSummary) {
        case 6:
          openOrders = openOrders6 || 0;
          break;
        case 12:
          openOrders = openOrders12 || 0;
          break;
        case 18:
          openOrders = openOrders18 || 0;
          break;
        case 24:
          openOrders = openOrders24 || 0;
          break;
        default:
          openOrders = openOrders6 || 0;
      }
      if (wellMaterials != null && wellMaterials.length > 0) {
        const totalInventory = (calculatedCvxOwnedInventory || 0) + (openOrders || 0) + (consignmentInventory || 0);
        // If Inventory is less than Required Backup, show "Insufficient Backup" in Well column
        if (totalInventory - requiredBackup < 0) {
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
  }  

  toggleSelectAll(event: any) {
    if (event.checked.length > 0) {
      this.selectedCategory = ['All', 'P', 'C'];
    }
    if (event.checked.length == 0) {

      this.selectedCategory = [];
    }
    this.createWellColumns();
  }

  /**
   *  it will get the user details from jwt token
   */
     getUserDetails(){
       let userAccess =  this.authService.isAuthorized(AccessControls.ODIN_DRILLING_ACCESS);
       this.commonService.setuserAccess(userAccess);
    }

    
  onSelectCategory() {
    if (this.selectedCategory.length == 3) {
      this.selectAll = [true];
    }
    else {
      this.selectAll = [];
    }
    this.createWellColumns();

  }

  onSearchChange(event: Event): void {
    this.quickFilterText = (event.target as HTMLInputElement).value.toLowerCase();
  }

// changed to use a single method to apply filters based on the type

applyComponentTypeFilter(event: any, type: string) {
  this.gridApi.onFilterChanged();
  this.filterData = this.tableData.map(item => ({ ...item }));
  this.filterData = this.aggregateByMaterialId(this.filterData);
  this.addWellMaterialDemand();
  this.addCalculatedColumns();
  this.selectedFilterName = type;

  let filterValue: any = [];
  // Determine which filter to apply based on the type
  if (type === 'materialType' && this.materialTypeSelected?.length) {
    filterValue = this.materialTypeSelected;
    this.filterData = this.filterData.filter(d => filterValue.includes(d.materialType));
  } else if (type === 'group' && this.groupSelected?.length) {
    filterValue = this.groupSelected;
    this.filterData = this.filterData.filter(d => filterValue.includes(d.mGroup));
  } else if (type === 'od' && this.odSelected?.length) {
    filterValue = this.odSelected.map(Number);
    this.filterData = this.filterData.filter(d => filterValue.includes(d.od));
  } else if (type === 'sourService' && this.sourServiceSelected?.length) {
    filterValue = this.sourServiceSelected;
    this.filterData = this.filterData.filter(d => filterValue.includes(d.sourService));
  } else if (type === 'vendor' && this.vendorSelected?.length) {
    filterValue = this.vendorSelected;
    this.filterData = this.filterData.filter(d => filterValue.includes(d.vendor));
  } else if (type === 'weight' && this.weightsSelected?.length) {
    filterValue = this.weightsSelected;
    this.filterData = this.filterData.filter(d => filterValue.includes(d.weight));
  } else if (type === 'grade' && this.gradeSelected?.length) {
    filterValue = this.gradeSelected;
    this.filterData = this.filterData.filter(d => filterValue.includes(d.grade));
  } else if (type === 'connection' && this.connectionSelected?.length) {
    filterValue = this.connectionSelected;
    this.filterData = this.filterData.filter(d => filterValue.includes(d.connection));
  }
  // else if (type === 'project' && this.projectSelected?.length) { //  projectSelected is a data
  //   filterValue = this.projectSelected;
  //   this.filterData = this.filterData.filter(d => filterValue.includes(d.project));
  // } 
  else {
    this.selectedFilterName = '';
    filterValue = [];
    // filterValue = Array.isArray(this.vendorSelected) ? this.vendorSelected : [this.vendorSelected];

  }

  // ✅ Save only the current applied filter and value
  this.gridStateService.setContextData({
    filterType: type,
    filterValue: filterValue,
  });

  this.totalRecords = this.filterData.length;
}
// Retrieves the list of projects 
getProjects() {
  this.odinDrillingSubscription = this.lookupService.getProjects().subscribe(data => {
    this.projects = data.map(resp => ({
      text: resp.projectDesc,   // <-- Changed from label to text
      value: resp.projectName
    }));
  });
}
  clearAllFilters(searchOdinDashboard: HTMLInputElement) {
    this.quickFilterText = '';
    searchOdinDashboard.value = '';
    this.materialTypeSelected = '';
    this.groupSelected = '';
    this.odSelected = [];
    this.vendorSelected = '';
    this.weightsSelected = '';
    this.gradeSelected = '';
    this.connectionSelected = '';
    this.projectSelected = '';
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


  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridStateService.initialize(params.api,this.userDetails.uid);
     // Set custom context like selectedWellId
    // this.gridStateService.setContextData({
    //   selectedPType: this.selectedPType,
    //   selectedMonthSummary: this.selectedMonthSummary,
    //   showContingency: this.showContingency
    // });
  }

  // Retrieves the latest personalization for the current user and applies it to the grid

getPersonalization() {
  const userId = this.userDetails?.uid || 0;
 
  this.odinDrillingSubscription = this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
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
           
            // Apply state first
            this.gridApi.applyColumnState({ state: state.columnState, applyOrder: true });

            // If we have well columns and they're not in saved state, move them after pinned columns
            if (flattenedWellColumns.length > 0) {
              // Find the first non-pinned column position
              const firstNonPinnedIndex = 18; //state.columnState.findIndex(col => col.field?.includes('_primary'));
              const moveToFront = flattenedWellColumns.filter(well =>
                !state.columnState.some(col => col.colId == well.colId)
              );
              if (moveToFront.length > 0) {
                const newOrder = [
                  ...state.columnState.slice(0, firstNonPinnedIndex),
                  ...moveToFront,
                  ...state.columnState.slice(firstNonPinnedIndex)
                ];
                this.gridApi.applyColumnState({ state: newOrder, applyOrder: true });
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
 
        this.hasRestoredPersonalization = true; // ✅ Prevent future re-runs
        const waitForTableData = () => {
        // Wait until tableData is populated and calculated (e.g., totalPrimaryDemand is not undefined)
        if (this.tableData?.length && this.tableData[0]?.totalPrimaryDemand !== undefined) {
          this.restoreGridState(context, state);
        } else {
          // Try again in 50ms
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
    // Set UI filter values
    switch (context.filterType) {
      case 'materialType':
        this.materialTypeSelected = context.filterValue;
        break;
      case 'group':
        this.groupSelected = context.filterValue;
        break;
      case 'od':
        this.odSelected = context.filterValue;
        break;
      case 'sourService':
        this.sourServiceSelected = context.filterValue;
        break;
      case 'vendor':
        this.vendorSelected = context.filterValue;
        break;
      case 'weight':
        this.weightsSelected = context.filterValue;
        break;
      case 'grade':
        this.gradeSelected = context.filterValue;
        break;
      case 'connection':
        this.connectionSelected = context.filterValue;
        break;
      case 'project':
        this.projectSelected = context.filterValue;
        break;
    }

    // ✅ Reapply that filter
    this.applyComponentTypeFilter(null, context.filterType);
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

  isExternalFilterPresent = (): boolean => {

    if (this.materialTypeSelected?.length > 0 ||
      this.groupSelected?.length > 0 ||
      this.odSelected?.length > 0 ||
      this.sourServiceSelected?.length > 0 ||
      this.vendorSelected?.length > 0 ||
      this.weightsSelected?.length > 0 ||
      this.gradeSelected?.length > 0 ||
      this.connectionSelected?.length > 0 // ||
      //this.projectSelected?.length > 0 // projectSelected
    ) {
      return true;
    }
    else {
      return false;
    }

  };

  doesExternalFilterPass = (node: IRowNode<any>): boolean => {


    if (node.data) {
      if (this.materialTypeSelected.length && !this.materialTypeSelected.includes(node.data.materialType)) {
        return false;
      }
      if (this.groupSelected.length && !this.groupSelected.includes(node.data.mGroup)) {
        return false;
      }
      if (this.odSelected.length && !this.odSelected.includes(node.data.od)) {
        return false;
      }
      if (this.sourServiceSelected.length && !this.sourServiceSelected.includes(node.data.sourService)) {
        return false;
      }
      if (this.vendorSelected.length && !this.vendorSelected.includes(node.data.vendor)) {
        return false;
      }
      if (this.weightsSelected.length && !this.weightsSelected.includes(node.data.weight)) {
        return false;
      }
      if (this.gradeSelected.length && !this.gradeSelected.includes(node.data.grade)) {
        return false;
      }
      if (this.connectionSelected.length && !this.connectionSelected.includes(node.data.connection)) {
        return false;
      }
      // if (this.projectSelected.length && !this.projectSelected.includes(node.data.project)) {
      //   return false;
      // }

      else {
        return true;
      }

    }
    return true;

  }

  onCellValueChanged(event: any): void {
    this.updateCalculatedColumns(event);
    this.gridApi.refreshCells();
    const rowNode = event.node.data;
    const existingRecord = this.editedRecords.find((rec) => rec.materialId == rowNode.materialId);
    if (!existingRecord) {
      this.editedRecords.push(rowNode);
    }

    this.isEdit = true;
  }

  updateCalculatedColumns(event: any) {
    let item = this.filterData.filter(row => row.id == event.data.id)[0];
    const toNum = (v: any) => {
      const num = Number.isFinite(Number(v)) ? Number(v) : 0;
      return Math.round(num * 100) / 100;
    };
    const dateSelectedMonth = new Date();
    dateSelectedMonth.setMonth(dateSelectedMonth.getMonth() + parseInt(this.selectedMonthSummary.toString()));

    if (event.colDef.field.includes('_primary')) {
      item.totalPrimaryDemandTooltip = [];
      item.totalPrimaryDemand = 0;
      //item.totalPrimaryDemand = item.totalPrimaryDemand - parseInt(event.oldValue) + parseInt(event.newValue);
      
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
            item.totalPrimaryDemand = item.totalPrimaryDemand + toNum(wellMaterial.primaryQuantity);
          }
        }
      });
    }
    if (event.colDef.field.includes('_contingency')) {
      item.totalContingencyDemandTooltip = [];
      item.totalContingencyDemand = 0;
      //item.totalContingencyDemand = item.totalContingencyDemand - parseInt(event.oldValue) + parseInt(event.newValue);

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
            item.totalContingencyDemand = item.totalContingencyDemand + toNum(wellMaterial.contingentQuantity);
          }
        }
      });
    }
    // Update ODIN Dashboard Downstream Calculations to Account the Calculation Value Column
    let calculatedCvxOwnedInventory = (item.overrideInventory && item.overrideInventory) > 0 ? item.overrideInventory : this.selectedInventory == 1 ? item.cvxOwnedInventory || 0 : item.yardInventory || 0;

    // Fixing balance issue after updating the values
    // Helper to safely convert to number
    
    calculatedCvxOwnedInventory = toNum(calculatedCvxOwnedInventory);
    if(!this.showContingency) {
        item.balance6 = Math.round((item.openOrders6 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0));
        item.balance12 = Math.round((item.openOrders12 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0));
        item.balance18 = Math.round((item.openOrders18 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0));
        item.balance24 = Math.round((item.openOrders24 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0));
    }
      else{        
        item.balance6 = Math.round((item.openOrders6 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0));
        item.balance12 = Math.round((item.openOrders12 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0));
        item.balance18 = Math.round((item.openOrders18 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0));
        item.balance24 = Math.round((item.openOrders24 || 0) + (calculatedCvxOwnedInventory || 0) + (item.tenaris || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0));
    }
    
    // item.balanceInclCont6 = (item.openOrders6 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0);
    // item.balanceInclCont12 = (item.openOrders12 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0);
    // item.balanceInclCont18 = (item.openOrders18 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0);
    // item.balanceInclCont24 = (item.openOrders24 || 0) + (calculatedCvxOwnedInventory || 0) + (item.consignmentInventory || 0) - (item.requiredBackup || 0) - (item.totalPrimaryDemand || 0) - (item.totalContingencyDemand || 0);
      
     // Adding the logic for objects of balance tooltip
      item.balanceInclCont6Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders6, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: {header: 'Consignment Inventory', value: item.tenaris, unit: '+'},
        //drillQuip: {header: 'Adjustment Factor', value: item.drillQuip, unit: '+'},
        requiredBackup: {header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: {header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: {header: 'Contingency Demand', value: item.totalContingencyDemand, unit: '-'}
      };
      item.balanceInclCont12Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders12, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: {header: 'Consignment Inventory', value: item.tenaris, unit: '+'},
        //drillQuip: {header: 'Adjustment Factor', value: item.drillQuip, unit: '+'},
        requiredBackup: {header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: {header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: {header: 'Contingency Demand', value: item.totalContingencyDemand, unit: '-'}
      };
      item.balanceInclCont18Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders18, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: {header: 'Consignment Inventory', value: item.tenaris, unit: '+'},
        //drillQuip: {header: 'Adjustment Factor', value: item.drillQuip, unit: '+'},
        requiredBackup: {header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: {header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: {header: 'Contingency Demand', value: item.totalContingencyDemand, unit: '-'}
      };
      item.balanceInclCont24Tooltip = {
        openOrders: {header: 'Open Orders', value: item.openOrders24, unit: '+'},
        calculatedCvxOwnedInventory: {header: 'CVX Inventory', value: calculatedCvxOwnedInventory, unit: '+'},
        consignmentInventory: {header: 'Consignment Inventory', value: item.tenaris, unit: '+'},
        //drillQuip: {header: 'Adjustment Factor', value: item.drillQuip, unit: '+'},
        requiredBackup: {header: 'Required Backup', value: item.requiredBackup, unit: '-'},
        totalPrimaryDemand: {header: 'Primary Demand', value: item.totalPrimaryDemand, unit: '-'},
        totalContingentDemand: {header: 'Contingency Demand', value: item.totalContingencyDemand, unit: '-'}
      };
  }

  resetOdinGrid() {
    this.getAllWellMaterialDemand();
    this.isEdit = false;
  }

  addOdinData(payload) {
    let params = {
      monthsOut: this.selectedMonthSummary,
      useP50StartDate: this.selectedPType == "P50" ? true : false
    };

    this.odinDrillingSubscription = this.odinV2Service.addOdinGrid(payload, params).subscribe({
      next: (response: any) => {

        this.isAbove = false;
        this.resetOdinGrid();
        if (response && response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message,
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'error',
            detail: response.message,
          });

        }
      },
      error: (err) => {
        if (err.error.message?.includes('duplicate key')) {
          this.messageService.add({
            severity: 'error',
            summary: 'error',
            detail: 'Material Id already exist!',
          });

        } else if (err.error.message) {
          this.messageService.add({
            severity: 'error',
            summary: 'error',
            detail: err.error.message,
          });

        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'error',
            detail: 'Changes failed to save',
          });

        }
      },
    });
  }

  onSelectionChanged(event: any) {
    const selectedRows = event.api.getSelectedRows();
    this.selectedRows = event.api.getSelectedRows()
    const focusedCell = event.api.getFocusedCell();

    if (focusedCell?.column?.colId != 'sapMM')
      this.isButtonDisabled = selectedRows.length === 0;
  }

  onCellClick(event) {
    if (event.colDef.field === 'sapMM') {

      this.currentRowForOverLayPanel = event;
      this.overlayAddEquipment.toggle(event.event);
    }
  }

  insertRowToAdd(isAbove: boolean) {

    this.isAbove = isAbove;
    this.displayEquipmentDialog = true;
    this.closeOverlayPanel();
  }

  deleteEquipmentRow() {
    this.gridConfig.loading = true;
    this.selectedEquipment = this.currentRowForOverLayPanel.data;
    const filteredWellMaterials = this.selectedEquipment.wellMaterials.filter(item => item.primaryQuantity > 0 || item.contingentQuantity > 0);
    this.promptDeleteConfirmation(filteredWellMaterials);
  }

  closeOverlayPanel() {
    this.overlayAddEquipment.hide(); // This will close the overlay panel
  }

  /**
  * prompt confirmation dialog before deleting equipment row or asking for edit wells
  *
  * @param list Material list
  */
  promptDeleteConfirmation(list: Array<any> = []) {

    if (list?.length) { // open Existing Well info
      this.deleteConfirmationTitle = "Existing Primary or Contingency Values";
      this.deleteConfirmationMessage = `The equipment you are attempting to delete has assigned Primary or Contingency Values in the following wells below. If you wish to continue, please update the impacted wells.`;
      this.showDeleteConfirmation = true;
      this.hasPrimaryORContingency = true;
      this.displayDeleteComponentDialog = false;
      this.selectedEquipmentWellList = list.slice();

    } else {
      this.deleteConfirmationTitle = "Delete Equipment Confirmation";
      this.deleteConfirmationMessage = `Do you wish to delete <b>${this.selectedEquipment.materialShortDesc || this.selectedEquipment.sapMM}</b>? <br>This action cannot be undone.`;
      this.hasPrimaryORContingency = false;
      this.showDeleteConfirmation = false;
      this.displayDeleteComponentDialog = true;
      this.buttonName = "Delete"
      this.pageTitle = "Delete Equipment";
      this.pageContent = "Are you sure you want to delete this equipment?"
    }
  }

  /**
   * Focus to update selected row if hasPrimaryORContingency otherwise process to delete selected equipment row
   *
   */
  deleteOrEditEquipmentRow() {
    if (this.hasPrimaryORContingency) {
      this.displayProceedComponentDialog = true;
    } else {

      this.deleteRowData();

    }

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

  onFirstDataRendered(event: FirstDataRenderedEvent) {
    this.updateFilterDropdowns();
  }

  updateFilterDropdowns(selectedDropDownType?: string) {
    const fields = [
      'mGroup',
      'od',
      'weight',
      'grade',
      'connection',
      'materialType',
      'vendor',
      'sourService',
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

        // Check if the current node corresponds to the selected dropdown type
        if (value[selectedDropDownType] !== undefined) {
          const fieldValue = value[dynamicField];
          const textValue = value[dynamicField];

          if (!distinctValuesForField.some(item => item.value === fieldValue)) {
            distinctValuesForField.push({ text: textValue, value: fieldValue });
          }
        }
      });

      // Sort logic: descending for numbers, ascending for strings
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

      const fieldValue = value[dynamicField];
      const textValue = value[dynamicField];

      if (!distinctValuesForField.some(item => item.value === fieldValue)) {
        distinctValuesForField.push({ text: textValue, value: fieldValue });
      }
    });

    // Sort logic: descending for numbers, ascending for strings
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
      this.odinFilteredDropDownValue[this.selectedInternalFilterName] = this.odinFilteredDropDownValue[this.selectedInternalFilterName];
    } else {
      this.odinFilteredDropDownValue[dynamicField] = distinctValuesForField;
    }
  }
}


  onRigAnalysisPage() {
    let data = {
      selectedRows: this.selectedRows,
      selectedWells: this.selectedWells,
      isP50Selected: this.selectedPType == "P50" ? true : false
    };
    this.commonService.setRigAnalysisData(data);

    this.router.navigateByUrl(routeLinks.odinRigAnalysis3);
  }

  onSave() {
    this.displaySaveComponentDialog = true;
    this.pageTitle = "Confirm Save"
    this.pageContent = "Are you sure you want to save the changes?"
    this.buttonName = "Edit"
  }

  saveOdinGrid() {
    this.displaySaveComponentDialog = false;
    this.loading = true;
    let filteredWellsHeaderCols = this.wellsHeaderCols?.filter((w) => this.selectedWells.includes(w.wellId));

    let payload = this.editedRecords?.map((ele) => {
      
      if (ele.hasOwnProperty('marketUnitPrice')) {
        ele.marketUnitPrice = ele.marketUnitPrice
          ? parseFloat(ele.marketUnitPrice).toFixed(2).toString()
          : '0';
      }
      if (ele.hasOwnProperty('wall')) {
        ele.wall = ele.wall
          ? parseFloat(ele.wall).toFixed(3).toString()
          : 0;
      }
      if (ele.hasOwnProperty('overrideInventory')) {
        ele.overrideInventory = ele.overrideInventory
          ? parseFloat(ele.overrideInventory).toFixed(2).toString()
          : 0;
      }
      return ele;
    }) || [];

    payload.forEach(element => {
      element['sooner'] = element['sooner'] || 0;
      element['tenaris'] = element['tenaris'] || 0;

      let wellMaterials = [];
      element.wellMaterials.forEach((element: any) => {
        if (filteredWellsHeaderCols.find((rec) => rec.wellNumber == element.wellNumber)) {
          wellMaterials.push({
            materialId: element.materialId,
            wellNumber: element.wellNumber,
            materialShortDesc: element.materialShortDesc,
            primaryQuantity: element.primaryQuantity == '' ? 0 : element.primaryQuantity, // Fixing null to 0 issue
            contingentQuantity: element.contingentQuantity == '' ? 0 : element.contingentQuantity, // Fixing null to 0 issue
            wellId: element.wellId,
            userIdModifiedBy:+this.userDetails.uid
          });
        }
      });
      element['wellMaterials'] = wellMaterials;
      element['userIdModifiedBy']=+this.userDetails.uid;
      element["isOdinMaterial"] = 1
    });
    this.odinDrillingSubscription = this.odinV2Service.saveOdinGrid(payload).subscribe({
      next: (response: any) => {

        if (response && response.success) {

          if (response.data[0].isDeleted) {
            this.displayProceedComponentDialog = false;
            this.showDeleteConfirmation = false;
            this.displayDeleteComponentDialog = false;
            this.deleteRowData();
          }
          else {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message,
            });
          }

          this.editedRecords = [];
          this.resetOdinGrid();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message });
        }
      },
      error: (err) => {
        if ((typeof err.error === "string" && err.error.includes('duplicate key')
          || err.error?.message?.includes('duplicate key'))) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Material Id already exist!' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Changes failed to save' });
        }
        this.loading = false;
      },
    });
    this.displayDeleteComponentDialog = false;
  }

  deleteEditWells() {
    this.selectedEquipment.wellMaterials.forEach((element: any) => {

      if (element.primaryQuantity > 0) element.primaryQuantity = 0;
      if (element.contingentQuantity > 0) element.contingentQuantity = 0;
    });
    this.selectedEquipment["isDeleted"] = true;

    this.editedRecords = Array(this.selectedEquipment);

    this.saveOdinGrid()
  }

  deleteRowData() {
    this.gridConfig.loading = true;
    this.odinDrillingSubscription = this.inventoryService.deleteEquipment(this.selectedEquipment.materialId)
      .subscribe({
        next: (res: any) => {
          if (res?.success && res.statusCode) {

            this.showDeleteConfirmation = false;
            this.displayDeleteComponentDialog = false;
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Equipment successfully deleted.' });
            this.resetOdinGrid();
          } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'Something went wrong!' });

          }
          this.gridConfig.loading = false;
        },
        error: (err) => {
          this.gridConfig.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Something went wrong!' });

        }
      });
  }

  /**
   * Handle changes to the outer ribbon selection
   * @param outerRibbonDto The outer ribbon DTO containing the selected values
   * @param type The type of selection change
   */
  onOuterRibbonSelectionChange(outerRibbonDto: OdinOuterRibbonDto, type: string) {
    // Save the grid state before Recreating columns
    // this.onSaveState();
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
      this.getAllWellMaterialDemand(); // Fetch well materials for editing
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
      this.getAllWellMaterialDemand(); // Fetch well materials for editing
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
      }
    });

    this.filterData = this.aggregateByMaterialId(this.filterData);
    this.addWellMaterialDemand();
    this.addCalculatedColumns();
    
    this.gridApi.refreshCells();
    //refresh totals
    this.gridApi.refreshClientSideRowModel('aggregate');
  }
 

  equipmentDialogData(data: MaterialSaveModel) {

    if (this.isAbove) {

      const newRow = { ...data }; // Define new row data
      data["buildPriorityNumber"] = this.currentRowForOverLayPanel.data.buildPriorityNumber;

    }
    else {
      const newRow = { ...data }; // Define new row data
      data["buildPriorityNumber"] = this.currentRowForOverLayPanel.data.buildPriorityNumber + 1;
    }
    data["isOdinMaterial"] = 1
    this.displayEquipmentDialog = false;
    this.addOdinData(data);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.odinCommonServicesubscription){
        this.odinCommonServicesubscription.unsubscribe();
        this.odinCommonService.clearOuterRibbonDto();  // Clear data on destroy
    }
    this.odinDrillingSubscription?.unsubscribe();
  }

  onSaveState() {
        this.gridStateService.saveStateOnDestroy(this.stateKey);
  }
  //getAdvanceFilterData() {
  //  const _subscription = this.store
  //    .select(storeFilters.OdinAdvanceFilter)
  //    .subscribe((data) => {
  //      if (data) {
  //        let filter = _.cloneDeep(data.odinFilterPayload);
  //        if (filter) {
  //          if (filter.wells && filter.wells != this.selectedWells) {
  //            this.selectedWells = filter.wells;
  //            this.getAllWellMaterialDemand();
  //            this.filters = new odinMoreFilterModel();
  //          }
  //        }
  //      }
  //    });
  //  this.subscription = _subscription;
  //  //Get Initial values of filters
  //  this.store
  //    .pipe(
  //      select(storeFilters.OdinAdvanceFilter),
  //      map((state) => state.odinFilterPayload) // now this.users$ returns users instead of state.
  //    )
  //    .forEach((res: any) => {
  //      if (res && res.wells) this.selectedWells = res.wells.toString();
  //    });
  //}

  getIdType(wellHead: any) {
    const ID = `customeHeaderExpandButton${wellHead.wellId}${wellHead.wellNumber}`
    const isExist = this.columnsExpanion.findIndex((id: any) => id === ID);
    if (isExist === -1) {
      this.columnsExpanion.push({ id: ID, expanded: false });
    }
    return `${ID}`;
  }

  expandOrCollapse(presentId: any, expand: boolean): void {

    this.columnsExpanion.forEach((val: any,index:number) => {
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
}
