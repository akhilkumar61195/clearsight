import { Component, effect, Input, OnDestroy, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { OdinV2Service } from '../../../../services/odinv2.service';
import { GridApi } from 'ag-grid-community';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { ListEditorBuilderService } from '../../../common/builders/list-editor-builder.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-odin-consumption-valuation',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './odin-consumption-valuation.component.html',
  styleUrl: './odin-consumption-valuation.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class OdinConsumptionValuationComponent implements OnDestroy {
endVal: string = 'end';
  totalRecords: number = 0;
  totalConsumptionsRecords: number = 0;
  consumptionValuations: any[] = [];
  consumptionAndValuations: any[] = [];
  @Input() selectedFunction :number=1 ; // input will get selected toggle value (drilling or completion) by default it will be dilling i.e 1;
  gridConfig: any = {};
  cols: any[];
  decimalFields: any[] = ['primaryWellTotal', 'contingentWellTotal'];
  subTotals: any;
  selectedWell: string | undefined;
  selectedWellId: string | undefined;
  tableData: any[] = [];
  colsConsumption: any[] = [];
  defaultColDef: any = {};
  columnDefs: any[] = [];
  columnDemandDefs: any[] = [];// Column definitions for the second grid
  pinnedBottomRowData: any[] = []; // Data for pinned bottom rows in the second grid
  gridApi: GridApi | null = null; // Grid API for the first grid
  appId: number = 1; // Default application ID

  // Subscription to manage API call subscriptions and prevent memory leaks
  private OdinConsumptionValuationSubscription: Subscription = new Subscription();

  constructor(private odinV2Service: OdinV2Service, private store: ListEditorBuilderService) {
    // effect(() => {
    //   this.appId = this.store.selectedApplicationId();
    // });
}
  // Unsubscribe from all subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    this.OdinConsumptionValuationSubscription.unsubscribe();
  }

  ngOnInit() {
    this.initializeColumns();
    this.initializeDemandColumns(); // Initialize columns for the second grid
   
   
  }

  // Initializes the column definitions for the main grid
  initializeColumns(): void {
    this.columnDefs = [

      {
        headerName: 'Well Name',
        field: 'wellName',
        minWidth: 150,
        resizable: true,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Plant Code',
        field: 'plantCode',
        minWidth: 150,
        resizable: true,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Planned',
        field: 'primaryValue',
        minWidth: 170,
        resizable: true,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) =>
          params.value ? `$${params.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
      },
      // {
      //   headerName: 'Secondary',
      //   field: 'secondaryWellTotal',
      //   maxWidth: 180,
      //   hide: true,
      //   resizable: true,
      //   sortable: true,
      //   filter: true,
      //   valueFormatter: (params: any) =>
      //     params.value ? `$${params.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
      // },
      {
        headerName: 'Contingency',
        field: 'contingencyValue',
        minWidth: 160,
        resizable: true,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) =>
          params.value ? `$${params.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
      },
    ];

    this.defaultColDef = {
      resizable: true,
      sortable: true,
      filter: true,
    };
  }
  // Initializes the column definitions for the second grid

  initializeDemandColumns(): void {
    this.columnDemandDefs = [
      {
        headerName: 'Material',
        field: 'componentType',
        minWidth: 150,
        resizable: true,
      },
      {
        headerName: 'Group',
        field: 'groupName',
        minWidth: 150,
        resizable: true,
      },
      {
        headerName: 'Description',
        field: 'materialShortDesc',
        // cellClass: 'valuationOdinLeft',
        minWidth: 250,
        resizable: true,
      },
      {
        headerName: 'SAP MM',
        field: 'materialId',
        minWidth: 150,
        resizable: true,
      },
      {
        headerName: 'Market Unit Cost',
        field: 'marketUnitCost',
        minWidth: 200,
        resizable: true,
         valueFormatter: (params: any) =>
          params.value ? `$${params.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
      },
      {
        headerName: 'SAP Unit Cost',
        field: 'sapUnitCost',
         valueFormatter: (params: any) =>
          params.value ? `$${params.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
        minWidth: 180,
        resizable: true,
      },
      {
        headerName: 'Unit Cost Plant',
        field: 'plantCode',
        minWidth: 200,
        resizable: true,
      },
      {
        headerName: 'Planned Demand',
        field: 'primaryDemand',
        valueFormatter: (params: any) =>
          params.value ? params.value.toLocaleString() : '',
        minWidth: 240,
        resizable: true,
      },
      {
        headerName: 'Planned Demand Value',
        field: 'primaryValue',
        valueFormatter: (params: any) =>
          params.value ? `$${params.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
        minWidth: 200,
        resizable: true,
      },
      {
        headerName: 'Contingency Demand',
        field: 'contigencyDemand',
        valueFormatter: (params: any) =>
          params.value ? params.value.toLocaleString() : '',
        minWidth: 200,
        resizable: true,
      },
      {
        headerName: 'Contingency Demand Value',
        field: 'contingencyValue',
        valueFormatter: (params: any) =>
          params.value ? `$${params.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
        minWidth: 200,
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
// Fetches the main grid data (consumption valuations) from the API
  getValuations() {
    this.gridConfig.loading = true;
    this.OdinConsumptionValuationSubscription = this.odinV2Service.getDemandValuationSummary(this.appId, this.selectedFunction).subscribe({
      next: (response: any) => {
        this.gridConfig.loading = false;
        if (Array.isArray(response) && response.length) {
          this.totalRecords = response.length;
          this.consumptionValuations = response;
        } else {
          this.totalRecords = 0;
          this.consumptionValuations = [];
        }
      },
      error: () => {
        this.gridConfig.loading = false;
        this.totalRecords = 0;
        this.consumptionValuations = [];
      },
    });
  }

// ngonchange will detect drilling and completion toggle
  ngOnChanges(changes: SimpleChanges): void {
  if (changes.selectedFunction) {
    // Use the new value, but do not reassign the Input
    const newValue = changes.selectedFunction.currentValue;
    if (newValue === 1 || newValue === 2) {
      this.tableData = [];
      this.pinnedBottomRowData = [];
    }
    this.getValuations();
  }
}
/**
 * Fetches the detail grid data for a specific well based on the selectedWellId.
 * Makes an API call to retrieve consumption and valuation data for the selected well.
 * Updates the table data and totals for the detail grid.
 */

getConsumptionAndValuation() {
    this.gridConfig.loading = true;
    this.OdinConsumptionValuationSubscription = this.odinV2Service.getDemandValuationDetails(this.appId, this.selectedFunction, this.selectedWellId ).subscribe({
      next: (response: any) => {
        this.gridConfig.loading = false;
        if (Array.isArray(response) && response.length) {
          this.tableData = response;
          this.calculateTotals();
        } else {
          this.tableData = [];
          this.pinnedBottomRowData = [];
        }
      },
      error: () => {
        this.gridConfig.loading = false;
        this.tableData = [];
        this.pinnedBottomRowData = [];
      },
    });
}

  onGridReady(params: any): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  /**
   * Handles row click in the first grid.
   * Extracts the wellId from the selected row and fetches data for the second grid.
   * @param event The row click event
   */
  onRowClicked(event: any): void {
    const selectedRow = event.data;
    this.selectedWell = selectedRow?.wellName; // Extract wellName from the selected row
    this.selectedWellId = selectedRow?.wellId; // Extract wellId from the selected row
    if (this.selectedWellId) {
      this.getConsumptionAndValuation(); // Fetch data for the second grid
    }
  }

  /**
 * Calculates the totals for planned demand value and contingency demand value.
 * Updates the pinned bottom row data with the calculated totals to display in the grid.
 */
  calculateTotals(){
    // Calculate the total planned demand value by summing up the 'primaryValue' field

  const totalPlannedDemandValue = this.tableData.reduce(
    (sum, row) => sum + (row.primaryValue || 0),
    0
  );
    // Calculate the total contingency demand value by summing up the 'contingencyValue' field

  const totalContingencyDemandValue = this.tableData.reduce(
    (sum, row) => sum + (row.contingencyValue || 0),
    0
  );
// Update the pinned bottom row data with the calculated totals

  this.pinnedBottomRowData = [
    {
      materialType: 'Total',
      primaryValue: totalPlannedDemandValue,
      contingencyValue: totalContingencyDemandValue,
    },
  ];
}
}
