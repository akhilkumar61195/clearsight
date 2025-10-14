import { Component, Input, OnDestroy, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { MasterService } from '../../../../services';
import { OdinV2Service } from '../../../../services/odinv2.service';
import { WellService } from '../../../../services/well.service';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { LocaleTypeEnum } from '../../../../common/enum/common-enum';

@Component({
  selector: 'app-odin-demand-valuation',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './odin-demand-valuation.component.html',
  styleUrl: './odin-demand-valuation.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class OdinDemandValuationComponent implements OnDestroy {
  columnDefs: any[] = [];
  defaultColDef: any = {};
  frameworkComponents: any = {};
 @Input() selectedWell: string | undefined;
  @Input() selectedWellId: string | undefined;
  @Input() selectedFunction :number=1 ; // input will get selected toggle value (drilling or completion) by default it will be dilling i.e 1;

  endVal: string = 'end';
  totalRecords: number = 0;
  totalConsumptionsRecords: number = 0;
  consumptionValuations: any[] = [];
  consumptionAndValuations: any[] = [];
  gridConfig: any = {};
  cols: any[];
  decimalFields: any[] = ['marketUnitPrice', 'sapUnitCostByPlant', 'primaryQuantityValue', 'contingentQuantityValue'];
  commaFields: any[] = ['primaryQuantity', 'contingentQuantity'];
  subTotals: any;
  tableData: any[] = [];
  colsConsumption: any[] = [];
  wellList: any[] = [];
  pinnedBottomRowData: any[] = [];
  selectedWells: any;

  // Subscription to manage API call subscriptions and prevent memory leaks
  private OndinDemandValuationSubscription: Subscription = new Subscription();

  constructor(private odinV2Service: OdinV2Service, private masterService: MasterService ,private wellService:WellService) { }
  // Unsubscribe from all subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    this.OndinDemandValuationSubscription.unsubscribe();
  }

  ngOnInit() {
    this.initializeColumns();
    // this.gtConsumptionHeader();
   // this.getwells();
    if (this.selectedWellId)
      this.getConsumptionAndValuation();
  }
  initializeColumns(): void {
    this.columnDefs = [
      {
        headerName: 'Material',
        field: 'materialType',
        width: 150,
        resizable: true,
      },
      {
        headerName: 'Group',
        field: 'mGroup',
        width: 150,
        resizable: true,
      },
      {
        headerName: 'Description',
        field: 'materialShortDesc',
        // cellClass: 'valuationOdinLeft',
        width: 250,
        resizable: true,
      },
      {
        headerName: 'SAP MM',
        field: 'materialId',
        width: 150,
        resizable: true,
      },
      {
        headerName: 'Market Unit Cost',
        field: 'marketUnitPrice',
        valueFormatter: (params: any) =>
          params.value ? `$${params.value.toFixed(2)}` : '',
        width: 150,
        resizable: true,
      },
      {
        headerName: 'SAP Unit Cost',
        field: 'sapUnitCostByPlant',
        valueFormatter: (params: any) =>
          params.value ? `$${params.value.toFixed(2)}` : '',
        width: 150,
        resizable: true,
      },
      {
        headerName: 'Unit Cost Plant',
        field: 'unitCostPlantUsed',
        width: 150,
        resizable: true,
      },
      {
        headerName: 'Planned Demand',
        field: 'primaryQuantity',
        valueFormatter: (params: any) =>
          params.value ? params.value.toLocaleString() : '',
        width: 150,
        resizable: true,
      },
      {
        headerName: 'Planned Demand Value',
        field: 'primaryQuantityValue',
        valueFormatter: (params: any) =>
          params.value ? `$${params.value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
        width: 150,
        resizable: true,
      },
      {
        headerName: 'Contingency Demand',
        field: 'contingentQuantity',
        valueFormatter: (params: any) =>
          params.value ? params.value.toLocaleString() : '',
        width: 150,
        resizable: true,
      },
      {
        headerName: 'Contingency Demand Value',
        field: 'contingentQuantityValue',
        valueFormatter: (params: any) =>
          params.value ? `$${params.value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
        width: 150,
        resizable: true,
      },
    ];

    this.defaultColDef = {
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
    };
  }

  onGridReady(params: any): void {
    params.api.sizeColumnsToFit();
  }
  getwells() {
    this.OndinDemandValuationSubscription = this.wellService.getWells(1, this.selectedFunction).subscribe((resp: any) => {
      if (resp && resp.length) {
        this.wellList = resp.map((well: any) => ({
          WELLNAME: well.wellName, 
          WELLID: well.id,         
          ISHIDDEN: false          
        }));
      } else {
        this.wellList = []; // Handle empty response
      }
    });
  }
  onMultiSelectChange(event: any) {
    if (event && event?.itemValue) {
      this.selectedWell = event?.itemValue.WELLNAME;
      this.selectedWellId = event?.itemValue.WELLID;
      this.selectedWells = [event?.itemValue.WELLNAME];
      this.getConsumptionAndValuation();
    }
  }

  // gtConsumptionHeader() {
  //   this.colsConsumption = [
  //     {
  //       dataType: 'text',
  //       field: 'materialType',
  //       header: 'Material',
  //       isFrozenColumn: true,
  //       width: '150px',
  //       minWidth: '150px',
  //       maxWidth: '150px',
  //       sortable: false,
  //       headerColor: '#D9D9D9'
  //     },
  //     {
  //       dataType: 'text',
  //       field: 'mGroup',
  //       header: 'Group',
  //       isFrozenColumn: false,
  //       width: '142px',
  //       minWidth: '142px',
  //       maxWidth: '142px',
  //       sortable: false,
  //       headerColor: '#D9D9D9'
  //     },
  //     {
  //       align: 'left',
  //       dataType: 'text',
  //       field: 'materialShortDesc',
  //       header: 'Description',
  //       isFrozenColumn: false,
  //       width: '250px',
  //       minWidth: '250px',
  //       maxWidth: '250px',
  //       sortable: false,
  //       headerColor: '#D9D9D9',
  //     },
  //     {
  //       dataType: 'text',
  //       field: 'materialId',
  //       header: 'SAP MM',
  //       isFrozenColumn: true,
  //       width: '150px',
  //       minWidth: '150px',
  //       maxWidth: '150px',
  //       sortable: false,
  //       headerColor: '#D9D9D9',
  //     },
  //     {
  //       dataType: 'text',
  //       field: 'marketUnitPrice',
  //       header: 'Market Unit Cost',
  //       isFrozenColumn: true,
  //       width: '90px',
  //       minWidth: '90px',
  //       maxWidth: '90px',
  //       sortable: false,
  //       headerColor: '#D9D9D9',
  //     },
  //     {
  //       dataType: 'text',
  //       field: 'sapUnitCostByPlant',
  //       header: 'SAP Unit Cost',
  //       isFrozenColumn: true,
  //       width: '90px',
  //       minWidth: '90px',
  //       maxWidth: '90px',
  //       sortable: false,
  //       headerColor: '#D9D9D9',
  //     },
  //     {
  //       dataType: 'text',
  //       field: 'unitCostPlantUsed',
  //       header: 'Unit Cost Plant',
  //       isFrozenColumn: true,
  //       width: '90px',
  //       minWidth: '90px',
  //       maxWidth: '90px',
  //       sortable: false,
  //       headerColor: '#D9D9D9',
  //     },
  //     {
  //       dataType: 'text',
  //       field: 'primaryQuantity',
  //       header: 'Planned Demand',
  //       isFrozenColumn: true,
  //       width: '90px',
  //       minWidth: '90px',
  //       maxWidth: '90px',
  //       sortable: false,
  //       headerColor: '#D9D9D9',
  //     },
  //     {
  //       dataType: 'text',
  //       field: 'primaryQuantityValue',
  //       header: 'Planned Demand Value',
  //       isFrozenColumn: true,
  //       width: '80px',
  //       minWidth: '80px',
  //       maxWidth: '80px',
  //       sortable: false,
  //       headerColor: '#D9D9D9',
  //       subHeadingField: 'primaryQuantityValueTotal'
  //     },
  //     {
  //       dataType: 'text',
  //       field: 'contingentQuantity',
  //       header: 'Contingency Demand',
  //       isFrozenColumn: true,
  //       width: '80px',
  //       minWidth: '80px',
  //       maxWidth: '80px',
  //       sortable: false,
  //       headerColor: '#D9D9D9',
  //     },
  //     {
  //       dataType: 'text',
  //       field: 'contingentQuantityValue',
  //       header: 'Contingency Demand Value',
  //       isFrozenColumn: true,
  //       width: '80px',
  //       minWidth: '80px',
  //       maxWidth: '80px',
  //       sortable: false,
  //       headerColor: '#D9D9D9',
  //       subHeadingField: 'contingentQuantityValueTotal'
  //     }];
  // }

  ngOnChanges(changes: SimpleChanges) {
    this.selectedFunction=changes.selectedFunction.currentValue;
    this.getwells();
    if (changes.selectedWell) {
      if (this.selectedWellId) {
       
        this.selectedWells = [this.selectedWell];
        this.getConsumptionAndValuation();
       
      }
    }
  }

  getConsumptionAndValuation() {
    this.gridConfig.loading = true;
    let params = {
      pageNumber: this.gridConfig.pageNumber ?? 1,
      SortBy: this.gridConfig.sortBy ?? 'p10StartDate',
      sortDirection: this.gridConfig.sortDirection ?? 'ASC',
      searchTerms: "",
      searchConditions: []
    };
    this.OndinDemandValuationSubscription = this.odinV2Service.getOdinDemandConsumptionAndValuation(params, this.selectedWellId,this.selectedFunction).subscribe({
      next: (response: any) => {
        this.gridConfig.loading = false;
        if (response && response.success && response.data?.consumptions?.length) {
          this.totalConsumptionsRecords = response.data?.totals;
          this.tableData = response.data?.consumptions;
          this.subTotals = response.data?.totals;
          this.calculateTotals();          
        } else {
          this.totalConsumptionsRecords = 0;
          this.tableData = [];
          this.pinnedBottomRowData = [];
        }
      },
      error: () => {
        this.gridConfig.loading = false;
        this.tableData = [];
        this.pinnedBottomRowData = [];
        this.totalRecords = 0;
        this.consumptionValuations = [];
      },
    });
  }
/**
 * Calculates the totals for planned demand value and contingency demand value.
 * Updates the pinned bottom row data with the calculated totals to display in the grid.
 */
  calculateTotals(){
      // Calculate the total planned demand value by summing up the 'primaryQuantityValue' field

    const totalPlannedDemandValue = this.tableData.reduce(
      (sum, row) => sum + (row.primaryQuantityValue || 0),
      0
    );
      // Calculate the total contingency demand value by summing up the 'contingentQuantityValue' field

    const totalContingencyDemandValue = this.tableData.reduce(
      (sum, row) => sum + (row.contingentQuantityValue || 0),
      0
    );
  // Update the pinned bottom row data with the calculated totals

    this.pinnedBottomRowData = [
      {
        materialType: 'Total',
        primaryQuantityValue: totalPlannedDemandValue,
        contingentQuantityValue: totalContingencyDemandValue,
      },
    ];
  }
}
