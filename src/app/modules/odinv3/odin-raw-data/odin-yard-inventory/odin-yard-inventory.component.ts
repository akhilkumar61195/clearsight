import { Component, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ColumnConfig, yardInventoryCols } from '../columnconfig';
import { YardInventory } from '../../../../common/model/yardinventory';
import { RawdataService } from '../../../../services/rawdata.service';
import { CustomerPersonalizationService } from '../../../../services/customer-personalization.service';
import { AuthService } from '../../../../services';
import { StateKeys } from '../../../../common/enum/common-enum';
import { GridApi } from 'ag-grid-community';
import { GridStatePersistenceService } from '../../../../common/builder/persistant-builder.service';
import { CommonService } from '../../../../services/common.service';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';


@Component({
  selector: 'app-odin-yard-inventory',
  standalone:true,
  imports:[PRIME_IMPORTS],
  templateUrl: './odin-yard-inventory.component.html',
  styleUrls: ['./odin-yard-inventory.component.scss']
})
export class OdinYardInventoryComponent implements  OnDestroy{
  summaryCols: ColumnConfig[] = yardInventoryCols;
  inventories: YardInventory[] = [];
  filteredInventories: YardInventory[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  pagenumber: number = 1;
  pageSize: number = 20000;
  searchTerm: string = '';
  @Input() text: string = '';
  @Input() dropdownValue: string = '';
  selectedOption: string = '';
  filterSubscription: Subscription;
  userDetails: any;
  columnDefs: any[] = [];
  gridApi!: GridApi; //declare grid api
  gridOptions: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  stateKey = StateKeys.OdinYardInventory;
  resetSubscription!: Subscription;
  hasRestoredPersonalization = false; // Flag to prevent re-running personalization restoration
  private gridRawData: Subscription = new Subscription();

  constructor(private api: RawdataService,private authService: AuthService,
    private personalizationService: CustomerPersonalizationService,private gridStateService: GridStatePersistenceService,private commonService: CommonService){
    this.userDetails = this.authService.getUserDetail(); // Get user details from AuthService
  }
    ngOnChanges(): void {

    this.filterMaterials();
    
  }
  ngOnInit(): void {
    this.createColumnDefs();
    this.resetSubscription = this.commonService.reset$.subscribe(() => {
      this.gridStateService.resetState(); // ✅ your actual reset logic
    });
    // Initialize the grid options with the column definitions
  }  //  save the grid state when the component is destroyed

  

  ngOnDestroy() {
    this.gridStateService.saveStateOnDestroy(this.stateKey);
    this.gridRawData.unsubscribe();
  }
  onGridReady(event: any): void {
    this.gridApi = event.api;
    this.gridOptions.api = event.api;
    this.gridOptions.columnApi = event.columnApi;
    event.api.sizeColumnsToFit();
    this.loadMoreData();
    this.gridStateService.initialize(event.api, this.userDetails.uid);

  }
    filterMaterials() {
    this.searchTerm = this.text;
    if (!this.searchTerm) {
      this.filteredInventories = this.inventories;
    } else {
      this.filteredInventories = this.inventories.filter(material =>
        material.materialId.includes(this.searchTerm)
      );
    }
    this.totalRecords = this.filteredInventories.length;
  }
  createColumnDefs() {
    this.columnDefs = this.summaryCols.map((col, index) => {
      let value = {
        headerName: col.header,
        field: col.field,
        sortable: col.sortable !== false,
        filter: true,
        resizable: true,
        headerClass: 'header-bold',
        headerTooltip: col.header,
        minWidth: col.width || 150
      };
      if (index === 0) {
        value['suppressSizeToFit'] = true;
      }
      return value;
    });
  }

    loadMoreData(): void {
    if (this.loading) {
      return; // Prevent duplicate requests
    }

    this.loading = true;
    if (this.pagenumber === 1) {
      this.gridOptions.api.showLoadingOverlay();
    }
    this.gridRawData.unsubscribe();
    this.gridRawData = this.api.getAllYardInventoryData(this.pagenumber, this.pageSize).subscribe({
      next: (data) => {
        // console.log(data);
        
        if (this.pagenumber === 1) {
          this.inventories = data;
          this.filteredInventories = data;
          this.totalRecords = this.filteredInventories.length;
          // ✅ Call personalization ONLY after first data load
        if (!this.hasRestoredPersonalization) {
          setTimeout(() => this.getPersonalization(), 100);
        }
        } else {
          this.inventories = [...this.inventories, ...data]; // Append new data
          this.filteredInventories = [...this.filteredInventories, ...data];
          this.totalRecords = this.filteredInventories.length;
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
        this.inventories = [];
        this.filteredInventories = [];
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
}
