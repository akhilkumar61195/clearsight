import { Component, Input, OnDestroy } from '@angular/core';
import { InventoryService } from '../../../../services/inventory.service';
import { SearchFilterService } from '../../../../services/search-filter.service';
import { Subscription } from 'rxjs';
import { Sapunitcost } from '../../../../common/model/sapunitcost';
import { ColumnConfig, sapUnitCostCols } from '../columnconfig';
import { RawdataService } from '../../../../services/rawdata.service';
import { AuthService } from '../../../../services';
import { CommonService } from '../../../../services/common.service';
import { AccessControls } from '../../../../common/constant';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { LocaleTypeEnum } from '../../../../common/enum/common-enum';

@Component({
  selector: 'app-odin-sap-unit-cost',
  standalone:true,
  imports:[PRIME_IMPORTS],
  templateUrl: './odin-sap-unit-cost.component.html',
  styleUrl: './odin-sap-unit-cost.component.scss'
})
export class OdinSapUnitCostComponent implements OnDestroy{
  summaryCols: ColumnConfig[] = sapUnitCostCols;
  materials: Sapunitcost[] = [];
  filteredMaterials: Sapunitcost[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  pagenumber: number = 1; // Start from page 1
  pageSize: number = 20000; // Default page size
  searchTerm: string = '';
  @Input() text: string = '';
  @Input() dropdownValue: string = '';
  selectedOption: string = '';
  filterSubscription: Subscription;
  columnDefs: any[] = [];
  gridOptions: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  private gridRawData: Subscription = new Subscription();
  
  constructor(private api: RawdataService, private searchFilterService: SearchFilterService, private authService: AuthService, private commonService: CommonService) { }
  ngOnDestroy() {
    this.gridRawData.unsubscribe();
  }

  ngOnChanges(): void {
    this.getInventories();
    this.getUserDetails();
   
  }

  /**
   *  it will get the user details from jwt token
   */
   getUserDetails() {
    let userAccess =  this.authService.isAuthorized(AccessControls.SAP_ORDER);
    this.commonService.setuserAccess(userAccess);
    this.createColumnDefs();
  }
  ngOnInit(): void {
    this.filterSubscription = this.searchFilterService.filter$.subscribe(({ text, option }) => {
      this.searchTerm = text;
      this.selectedOption = option;
      // this.filterGrid();
    });
     this.getUserDetails();
  }

  onGridReady(event: any): void {
    this.gridOptions.api = event.api;
    this.gridOptions.columnApi = event.columnApi;
    this.loadMoreData();
  }
  // Create the column definitions for the grid
  createColumnDefs() {
    this.columnDefs = this.summaryCols.map((col, index) => {
      const valuesToConvert = [
        'unitPriceUSD',
        'cummValueByPlant',
        'incrementalCostBasisByPlant',
        'cummValueAllPlant',
        'mmCostBasisAvgAllPlant'
      ];
      let value = {
        headerName: col.header,
        field: col.field,
        sortable: col.sortable !== false,
        filter: true,
        // hide: !this.authService.isFieldEditable(col.field),
        resizable: true,
        cellStyle: params => {
          return valuesToConvert.includes(col.field) ? {
            'color': col.textColor,
            'white-space': 'nowrap',
            'text-align': 'right',
          } : {
            'color': col.textColor,
            'white-space': 'nowrap'
          };
        },
        headerClass: 'header-bold',
        headerTooltip: col.header,
        // width: this.getColumnWidth(col.header),
      };
      // Only apply valueFormatter for currency fields
      if (valuesToConvert.includes(col.field)) {
        value['valueFormatter'] = this.currencyFormatter;
        value['hide'] = !this.authService.isFieldEditable(col.field);
        // Suppress column in the tool panel if it's hidden
        if (value['hide']) {
          value['suppressColumnsToolPanel'] = true;
        }
      }
      if (index === 0) {
        value['suppressSizeToFit'] = true;
      }
      value['minWidth'] = (col.width || 150);
      return value;
    });
  }



  currencyFormatter(params: any): string {
    const value = params.value;
    if (value == null || isNaN(value)) {
      return '';
    }
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return '';
    }
    // Format the number as currency with commas and two decimal places
    //return '$' + numericValue.toFixed(2);
    return isNaN(value) ? params.value : `$${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  }
  // Load more data for the grid
  loadMoreData(): void {
    if (this.loading) {
      return;
    }
    if (this.pagenumber === 1) {
      this.gridOptions.api.showLoadingOverlay();
    }
    this.loading = true;
    this.gridRawData =this.api.getAllUnitCostData(this.pagenumber, this.pageSize).subscribe({
      next: (data) => {
        console.log('Fetched unit cost data:', data);
        this.materials = [...this.materials, ...data];
        this.filteredMaterials = [...this.filteredMaterials, ...data];
        this.totalRecords = this.filteredMaterials.length;
        if (data.length > 0) {
          this.pagenumber++;
          setTimeout(() => {
            this.loadMoreData(); // Fetch next batch after delay
          }, 0);
        } else {
          this.gridOptions.api.hideOverlay();
        }
        this.loading = false;
      },
      error: (err) => {
        this.materials = [];
        this.filteredMaterials = [];
        this.loading = false;
      }
    });
  }

  getInventories(): void {
    this.loading = true;
    this.text = this.searchTerm;
    this.api.getUnitCosts(this.pagenumber, this.pageSize, this.searchTerm).subscribe({
      next: (res) => {
        this.materials = res;
        this.filteredMaterials = res;
        this.totalRecords = this.filteredMaterials.length;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.materials = [];
        this.filteredMaterials = [];
        this.loading = false;
      }
    });
  }

}
