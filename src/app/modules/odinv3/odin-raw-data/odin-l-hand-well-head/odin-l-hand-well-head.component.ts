import { ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { ColumnConfig, lhandwellheadOrdersColsNew } from '../columnconfig';
import { Subscription } from 'rxjs';
import { InventoryService } from '../../../../services/inventory.service';
import { SearchFilterService } from '../../../../services/search-filter.service';
import { LhAndWellHeadOrders } from '../../../../common/model/lh-and-well-head-orders';
import { LHAndWellHeadUpdate } from '../../../../common/model/rawData-LhAndWellHeadeUpdate';
import { RawdataService } from '../../../../services/rawdata.service';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../services';
import { AccessControls } from '../../../../common/constant';
import { CommonService } from '../../../../services/common.service';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { CustomDialogComponent } from '../../../common/custom-dialog/custom-dialog.component';
import { LocaleTypeEnum } from '../../../../common/enum/common-enum';

@Component({
  selector: 'app-odin-l-hand-well-head',
  standalone:true,
      imports:[...PRIME_IMPORTS,
        CustomDialogComponent
      ],
  templateUrl: './odin-l-hand-well-head.component.html',
  styleUrl: './odin-l-hand-well-head.component.scss'
})
export class OdinLHandWellHeadComponent implements OnDestroy{
  summaryCols: ColumnConfig[] = lhandwellheadOrdersColsNew;
  materials: LhAndWellHeadOrders[] = [];
  filteredMaterials: LhAndWellHeadOrders[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  pagenumber: number = 1; // Start from page 1
  pageSize: number = 500; // Default page size
  searchTerm: string = '';
  selectedOption: string = '';

  @Input() text: string = '';
  @Input() dropdownValue: string = '';
  columnDefs: any[] = [];
  gridOptions: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  filterSubscription: Subscription;
  editedRows: { [rowId: string]: any } = {}; // Store edited rows by their unique identifier
  showEditConfirmationDialog: boolean = false;
  userDetail: any;
  private gridRawData: Subscription;


  constructor(private api: RawdataService,
    private searchFilterService: SearchFilterService,
    private rawdataService: RawdataService,
    private messageService: MessageService,
    private authService: AuthService,
    private commonService: CommonService,
    private cdRef: ChangeDetectorRef // ChangeDetectorRef to force view updates
  ) {
    this.userDetail = this.authService.getUserDetail();
  }

  ngOnDestroy() {
    this.gridRawData.unsubscribe();
  }
  // Automatically filters materials when input properties change
  ngOnChanges(): void {
    this.filterMaterials();
  }

  // Initializes component: subscribes to search filter updates and sets up grid columns
  ngOnInit(): void {
    this.getUserDetails();
    this.filterSubscription = this.searchFilterService.filter$.subscribe(({ text, option }) => {
      this.searchTerm = text;
      this.selectedOption = option;
      // this.filterGrid();
    });
   
  }

  // Sets grid APIs, resizes columns to fit, and loads initial data when the grid is ready
  onGridReady(event: any): void {
    this.gridOptions.api = event.api;
    this.gridOptions.columnApi = event.columnApi;
    setTimeout(() => {
      event.api.sizeColumnsToFit();
    }, 0);

    this.loadMoreData();
  }
  // Method to create column definitions for the grid
   getUserDetails() {
    let userAccess =  this.authService.isAuthorized(AccessControls.LINERHANGER_ORDER_ACCESS);
    this.commonService.setuserAccess(userAccess);
    this.createColumnDefs();
  }
  // Handles cell value changes, storing edited rows in a dictionary
  onCellValueChanged(event: any) {
    const updatedData = event.data;

    // Use a unique identifier (e.g., `id` or `materialId`) as key
    const rowKey = updatedData.id;
    if (rowKey) {
      this.editedRows[rowKey] = { ...updatedData }; // Store a copy of the updated row
    }
  }

  // Checks if there are any edited rows
  get hasEditedRows(): boolean {
    return Object.keys(this.editedRows).length > 0;
  }

  // Loads material data from the API and updates the grid
  loadMoreData(): void {
    if (this.loading) {
      return; // Prevent duplicate requests
    }
    if (this.pagenumber === 1) {
      this.gridOptions.api.showLoadingOverlay();
    }
    this.loading = true;
    //this.gridRawData.unsubscribe();
    this.gridRawData = this.api.getAlLHAndWellheadData1(this.pagenumber, this.pageSize).subscribe({
      next: (data) => {
        this.materials = [...this.materials, ...data]; // Append new data
        this.filteredMaterials = [...this.filteredMaterials, ...data];
        this.totalRecords = this.filteredMaterials.length;
        if (data.length > 0) {
          this.pagenumber++;
        } else {
          this.gridOptions.api.hideOverlay();
        }
        setTimeout(() => {
          this.gridOptions.api.refreshCells(); // Refresh cells if needed
        }, 0);
        this.loading = false;
      },
      error: (err) => {
        this.materials = [];
        this.filteredMaterials = [];
        this.loading = false;
      }
    });
  }

  // Filters materials based on the search term and updates the record count
  filterMaterials() {
    this.searchTerm = this.text;

    if (!this.searchTerm) {
      this.filteredMaterials = this.materials;
    } else {
      this.filteredMaterials = this.materials.filter(material =>
        String(material.materialNumber).includes(this.searchTerm)
      );
    }

    this.totalRecords = this.filteredMaterials.length;
  }
    // Creates column definitions for the grid based on the summaryCols configuration

  createColumnDefs() {
    const dateFields = ['estimatedDeliveryDate', 'orderDate'];
    const currencyFields = ['unitCost'];
    this.columnDefs = this.summaryCols.map((col, index) => {
      let value: any = {
        headerName: col.header,
        field: col.field,
        sortable: col.sortable !== false,
        filter: true,
        hide: col.field === 'id', // Hide only the 'id' field
        resizable: true,
        editable:this.authService.isFieldEditable(col.field), // Disable editing for specified fields
        cellStyle: {
          'color': col.textColor,
          'white-space': 'nowrap',
        },
        headerClass: 'header-bold',
        headerTooltip: col.header,
        minWidth: col.width || 150,
      };

      // Date field configuration
      if (dateFields.includes(col.field)) {
        value.cellEditor = 'agDateCellEditor';
        value.cellEditorParams = {
          useBrowserDatePicker: true,
        };

        value.valueGetter = (params: any) => {
          return params.data[col.field] ?? null;
        };

        value.valueFormatter = (params: any) => {
          const date = new Date(params.value);
          if (!params.value || isNaN(date.getTime())) return '';
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        };

        value.onCellValueChanged = (params: any) => {
          const newDate = new Date(params.newValue);

          if (!params.newValue || isNaN(newDate.getTime()) || newDate.getTime() === 0) {
            if (params.oldValue === params.newValue || params.data[col.field] != null) {
              return;
            }
            params.api.getRowNode(params.node.id)?.setDataValue(col.field, params.oldValue);
          } else {
            const normalizedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
            if (params.oldValue !== normalizedDate.getTime()) {
              params.api.getRowNode(params.node.id)?.setDataValue(col.field, normalizedDate);
            }
          }
        };
      }
     // Currency field formatting
      if (currencyFields.includes(col.field)) {
        value.valueFormatter = this.currencyFormatter;
        value.hide = !this.authService.isFieldEditable(col.field);
        // Suppress column in the tool panel if it's hidden
        if (value['hide']) {
          value['suppressColumnsToolPanel'] = true;
        }
      }

      if (index === 0) {
        value.suppressSizeToFit = true;
      }

      return value;
    });
  }



  // Add dateFormatter method to format date values //
  dateFormatter(params) {
    if (params.value) {
      const date = new Date(params.value);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
    return null;
  }

  // Formats a numeric value as a currency string with two decimal places
  currencyFormatter(params: any): string {
    const value = params.value;
    if (value == null || isNaN(value)) {
      return '';
    }
    //return '$' + value.toFixed(2);
    // Format the number as currency with commas and two decimal places
    return isNaN(value) ? params.value : `$${value.toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  // Method to save changes made to edited rows
  saveChanges() {
    this.showEditConfirmationDialog = true;
  }

  // Method to confirm and save changes made to edited rows
  onUpdateDetails() {
    const updatedRows = Object.values(this.editedRows).map(row => {
      const formatDate = (date: string | Date | undefined | null): string => {
        if (!date) return null; // Return empty string for null/undefined/empty values

        const d = new Date(date);
        if (isNaN(d.getTime())) return ''; // Return empty if invalid date

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      return {
        id: row.id ?? 0,
        supplier: row.supplier ?? '',
        materialType: row.materialType ?? '',
        materialNumber: row.materialNumber ?? '',
        description: row.description ?? '',
        plantCode: row.plantCode ?? '',
        supplierPartNumber: row.supplierPartNumber ?? '',
        poNumber: row.poNumber ?? '',
        heatNumber: row.heatNumber ?? '',
        orderDate: formatDate(row.orderDate),
        wbs: row.wbs ?? '',
        project: row.project ?? '',
        unitCost: Number(row.unitCost ?? 0),
        quantity: row.quantity ?? 0,
        expectedDeliveryDate: formatDate(row.estimatedDeliveryDate),
        newOrderLeadTimeDays: Number(row.newOrderLeadTimeDays ?? 0),
        comments: row.comments ?? '',
        userId: Number(this.userDetail.uid) // Ensure this is correctly set from your auth/session
      };
    });
    if (updatedRows.length === 0) return;
    this.rawdataService.updateLhAndWellHead(updatedRows).subscribe({
      next: (response) => {
        this.editedRows = {}; // Clear after save
        this.cdRef.detectChanges(); // 🔁 Force view update
        this.showEditConfirmationDialog = false;
        this.pagenumber = 1;
        this.materials = [];
        this.filteredMaterials = [];
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Raw Data updated Successfully' });
        this.loadMoreData();
      },
      error: (err) => {
        console.error('Error saving changes:', err);
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'Failed to update Raw Data'
        });
      }
    });
  }

  // Method to reset changes made to edited rows
  resetChanges() {
    this.editedRows = {}; // Clear edited rows
    this.loadMoreData();
    this.gridOptions.api.setRowData(this.filteredMaterials); // Refresh the grid with the original data
    this.gridOptions.api.refreshCells(); // Refresh cells to discard edits visually

  }
//  close the dialog
  closeDialog() {
    this.showEditConfirmationDialog = false;
  }

}
