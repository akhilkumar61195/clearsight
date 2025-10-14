import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { Inventory } from '../../../../common/model/inventory';
import { SearchFilterService } from '../../../../services/search-filter.service';
import { InventoryService } from '../../../../services/inventory.service';
import { Subscription } from 'rxjs';
import { ColumnConfig } from '../columnconfig';
import { inventoryCols } from './inventorycoldefs';
import { Grid, GridApi, GridOptions, IDatasource, IGetRowsParams, SideBarDef } from 'ag-grid-community';
import { RawdataService } from '../../../../services/rawdata.service';
import { AuthService } from '../../../../services';
import { CommonService } from '../../../../services/common.service';
import { AccessControls } from '../../../../common/constant';
import { GridStatePersistenceService } from '../../../../common/builder/persistant-builder.service';
import { LocaleTypeEnum, StateKeys } from '../../../../common/enum/common-enum';
import { CustomerPersonalizationService } from '../../../../services/customer-personalization.service';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
@Component({
  selector: 'app-odin-inventory',
  standalone:true,
    imports:[...PRIME_IMPORTS
      ],
  templateUrl: './odin-inventory.component.html',
  styleUrl: './odin-inventory.component.scss'
})
export class OdinInventoryComponent implements OnDestroy , OnChanges {
  summaryCols: ColumnConfig[] = inventoryCols;
  materials: Inventory[] = [];
  filteredMaterials: Inventory[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  pagenumber: number = 1; // Start from page 1
  pageSize: number = 500; // Default page size
  searchTerm: string = '';
  quickFilterText: string = '';
  selectedOption: string = '';
  filterSubscription: Subscription;
  userDetails: any;
  columnDefs: any[] = [];
  @Input() text: string = '';
  @Input() dropdownValue: string = '';
  @Input() resetFlag: number = 0;
  resetSubscription!: Subscription;
  saveSubscription!: Subscription;
  private gridRawData: Subscription = new Subscription();

  stateKey = StateKeys.OdinInventory;

  gridOptions: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  gridApi!: GridApi; //declare grid api
  hasRestoredPersonalization = false; // Flag to prevent re-running personalization restoration


  constructor(private api: RawdataService,
    private searchFilterService: SearchFilterService,private authService: AuthService, 
    private commonService: CommonService, private gridStateService: GridStatePersistenceService,
    private personalizationService: CustomerPersonalizationService) {
    this.userDetails = this.authService.getUserDetail(); // Get user details from AuthService

    // Define datasource BEFORE grid initializes
    //  const dataSource: IDatasource = {
    //   getRows: (params: IGetRowsParams) => {

    //     const pageNumber = Math.floor(params.startRow / 100) + 1;
    //     this.gridApi.showLoadingOverlay(); // showing ag grid in-build loader
    //      this.api.getAutomaticReadInventoryPaged(pageNumber, this.pageSize).subscribe(res => {

    //       const rowsThisPage = res.result.data;
    //       const totalRows = res.result.totalRecords; // Use actual total records
    //       this.totalRecords= res.result.totalRecords;// to show number of record's
    //       const lastRow = totalRows <= params.endRow ? totalRows : -1;
    //       this.gridApi.hideOverlay(); // hiding ag grid in-build loader
    //       params.successCallback(rowsThisPage, lastRow);
    //     });

    //   }
    // };

    // this.gridOptions = {
    //   rowModelType: 'infinite',
    //   cacheBlockSize: 100,
    //   maxBlocksInCache: 10,
    //   datasource: dataSource,
    // };


  }
  

  ngOnChanges(): void {

    this.filterMaterials();
    this.getUserDetails();
    // this.createColumnDefs();  // Re-create column definitions on changes
  }

  ngOnInit(): void {
    this.filterSubscription = this.searchFilterService.filter$.subscribe(({ text, option }) => {
      this.searchTerm = text;
      this.selectedOption = option;
      // this.filterGrid();
    });
    this.getUserDetails();
      this.resetSubscription = this.commonService.reset$.subscribe(() => {
      this.gridStateService.resetState(); 
    });
     this.saveSubscription = this.commonService.save$.subscribe(() => {
      this.gridStateService.saveStateOnDestroy(this.stateKey);
    });
  }

  //  save the grid state when the component is destroyed
  ngOnDestroy() {
  this.gridRawData.unsubscribe();
  this.resetSubscription?.unsubscribe();
  this.saveSubscription?.unsubscribe();
    // this.gridStateService.saveStateOnDestroy(this.stateKey);
  }
  /**
   *  it will get the user details from jwt token
   */
   getUserDetails() {
    let userAccess =this.authService.isAuthorized(AccessControls.INVENTORY_ORDER);
    this.commonService.setuserAccess(userAccess);
    this.createColumnDefs();
  }
  //   onGridReady(params: any) {

  //   // No need to call setDatasource here anymore
  //   this.gridApi = params.api;
  //   // Auto-size all columns to fit header content
  //   setTimeout(() => {
  //     const allColumnIds: string[] = [];
  //     params.api.getAllColumns()?.forEach(col => {
  //       if (col) allColumnIds.push(col.getId());
  //     });

  //     params.api.autoSizeColumns(allColumnIds, false);
  //   });
  // }

  onGridReady(event: any): void {
    this.gridApi = event.api;
    this.gridOptions.api = event.api;
    this.gridOptions.columnApi = event.columnApi;
    event.api.sizeColumnsToFit();
    this.loadMoreData();
    this.gridStateService.initialize(event.api, this.userDetails.uid);
     // ✅ Only call personalization now that gridApi is assigned
   }

  loadMoreData(): void {
    if (this.loading) {
      return; // Prevent duplicate requests
    }

    this.loading = true;
    if (this.pagenumber === 1) {
      this.gridOptions.api.showLoadingOverlay();
    }

    this.gridRawData = this.api.getAllReadInventoryData(this.pagenumber, this.pageSize).subscribe({
      next: (data) => {        
        if (this.pagenumber === 1) {
          this.materials = data;
          this.filteredMaterials = data;
          this.totalRecords = this.filteredMaterials.length;
          // ✅ Call personalization ONLY after first data load
        if (!this.hasRestoredPersonalization) {
          setTimeout(() => this.getPersonalization(), 100);
        }
        } else {
          this.materials = [...this.materials, ...data]; // Append new data
          this.filteredMaterials = [...this.filteredMaterials, ...data];
          this.totalRecords = this.filteredMaterials.length;
        }
        if (data.length > 0) {
          this.pagenumber++; // Increment page number for the next request
        }
        if (data.length > 0) {
          setTimeout(() => {
            this.loadMoreData(); // Fetch next batch after delay
          });
        } else {
          this.gridOptions.api.hideOverlay();
        }
        this.loading = false;

      },
      error: (err) => {
        this.materials = [];
        this.filteredMaterials = [];
        this.loading = false;
        this.gridOptions.api.hideOverlay();
      }
    });
  }

  // Retrieves the latest personalization for the current user and applies it to the grid
  getPersonalization() {
    const userId = this.userDetails?.uid || 0;
    this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
      next: (res) => {
        const state = res?.result.appState ? JSON.parse(res.result.appState) : null;
        const contextData = res?.result?.contextData;
        const context = typeof contextData === 'string' ? JSON.parse(contextData) : contextData;
       
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

  filterMaterials() {
    this.searchTerm = this.text;
    if (!this.searchTerm) {
      this.filteredMaterials = this.materials;
    } else {
      this.filteredMaterials = this.materials.filter(material =>
        material.materialID.includes(this.searchTerm)
      );
    }
    this.totalRecords = this.filteredMaterials.length;
  }
  
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
    
  createColumnDefs() {

     const currencyFields = [
    'unitPriceUSD',
    'unitPriceLocal',
    'amountLocal',
    'amountUSD',
    'valuatedAmountUSD',
    'valuatedAmountLocal'
  ];

    this.columnDefs = this.summaryCols.map((col, index) => {
      const isCurrency = currencyFields.includes(col.field);
      const value = {
        headerName: col.header,
        field: col.field,
        sortable: col.sortable !== false,
        filter: true,
        resizable: true,
        cellStyle: params => {
          return col.field === 'unitPriceUSD'
            ? {
              'color': col.textColor,
              'white-space': 'normal',
              'text-align': 'right',
              'overflow': 'visible',
              'text-overflow': 'unset',
            }
            : {
              'color': col.textColor,
              'white-space': 'normal',
              'overflow': 'visible',
              'text-overflow': 'unset',
            };
        },
        headerClass: 'header-bold',
        headerTooltip: col.header,
        valueFormatter: isCurrency ? this.currencyFormatter : undefined,
        // valueFormatter: col.field === 'unitPriceUSD' ? this.currencyFormatter : undefined,
      };
       if (currencyFields.includes(col.field)) {
       
        value['hide'] = !this.authService.isFieldEditable(col.field);
        // If the column is hidden, suppress it in the columns tool panel
        if (value['hide']) {
          value['suppressColumnsToolPanel'] = true;
        }
      }
      if (index === 0) {
        value['suppressSizeToFit'] = true;
      }
      (value['minWidth'] = (col.width || 150))
      return value;
    });
  }

  currencyFormatter(params: any): string {
    const value = params.value;
    if (value == null || isNaN(value)) {
      return '';
    }
    //return '$' + value.toFixed(2);
    // Format the number as currency with commas and two decimal places
    return isNaN(value) ? params.value : `$${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  

}
