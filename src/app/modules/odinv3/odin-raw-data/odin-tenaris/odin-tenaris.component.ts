import { Component, Input, OnDestroy } from '@angular/core';
import { MessageService, SortEvent } from 'primeng/api';
import { Tenaris } from '../../../../common/model/tenaris';
import { Subscription } from 'rxjs';
import { InventoryService } from '../../../../services/inventory.service';
import { SearchFilterService } from '../../../../services/search-filter.service';
import { ColumnConfig, tenarisOrdersCols } from '../columnconfig';
import { RawdataService } from '../../../../services/rawdata.service';
import { UpdateTenaris } from '../../../../common/model/rawData-tenaris-update';
import { AuthService } from '../../../../services';
import { AccessControls } from '../../../../common/constant';
import { CommonService } from '../../../../services/common.service';
import { CustomDialogComponent } from '../../../common/custom-dialog/custom-dialog.component';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { LocaleTypeEnum } from '../../../../common/enum/common-enum';

@Component({
  selector: 'app-odin-tenaris',
  standalone:true,
    imports:[PRIME_IMPORTS,
      CustomDialogComponent
    ],
  templateUrl: './odin-tenaris.component.html',
  styleUrl: './odin-tenaris.component.scss'
})
export class OdinTenarisComponent implements OnDestroy {

  summaryCols: ColumnConfig[] = tenarisOrdersCols;
  materials: Tenaris[] = [];
  filteredMaterials: Tenaris[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  pagenumber: number = 1; // Start from page 1
  pageSize: number = 500; // Default page size
  searchTerm: string = '';

  @Input() text: string = '';
  @Input() dropdownValue: string = '';
  columnDefs: any[] = [];
  gridOptions: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  selectedOption: string = '';
  filterSubscription: Subscription;
  editedRows: { [rowId: string]: UpdateTenaris } = {};
  showEditConfirmationDialog: boolean = false;
  userDetail: any;
  updateTenaris: UpdateTenaris[] = [];
  private gridRawData: Subscription = new Subscription();

  constructor(private api: RawdataService, private searchFilterService: SearchFilterService,
    private rawdataService: RawdataService,
    private messageService: MessageService,
    private authService: AuthService,
    private commonService: CommonService,
  ) {
    this.userDetail = this.authService.getUserDetail();
  }
ngOnDestroy() {
    this.gridRawData.unsubscribe();
  }

  ngOnChanges(): void {
    this.filterMaterials();
  }
  ngOnInit(): void {
     this.getUserDetails();
    this.filterSubscription = this.searchFilterService.filter$.subscribe(({ text, option }) => {
      this.searchTerm = text;
      this.selectedOption = option;
      // this.filterGrid();
    });
    

  }
  onGridReady(event: any): void {
    this.gridOptions.api = event.api;
    this.gridOptions.columnApi = event.columnApi;
    event.api.sizeColumnsToFit();
    this.loadMoreData();
  }
  // Retrieves and sets user access control info using the AuthService
   getUserDetails(){
       let userAccess=  this.authService.isAuthorized(AccessControls.TENARIS_ORDER_ACCESS);
       this.commonService.setuserAccess(userAccess);
       this.createColumnDefs();
    }
  // Method to create column definitions for the grid
  createColumnDefs() {
    const dateFields = ['expectedDeliveryDate']; // Add more fields if needed
    const currencyFields = ['unitPrice'];
    this.columnDefs = this.summaryCols.map((col, index) => {
      let value: any = {
        headerName: col.header,
        field: col.field,
        sortable: col.sortable !== false,
        filter: true,
        hide: col.field === 'id', // Hide only the 'id' field
        resizable: true,
        editable:this.authService.isFieldEditable(col.field),
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

  //  method to capture edited rows //

  onCellValueChanged(event: any) {
    const updatedData = event.data;
    // Use a unique identifier (e.g., `id` or `materialId`) as key
    const rowKey = updatedData.id;
    if (rowKey) {
      this.editedRows[rowKey] = { ...updatedData }; // Store a copy of the updated row
    }
    // console.log('Edited rows:', Object.values(this.editedRows)); // All modified rows
  }

  // Getter to check if there are any edited rows

  get hasEditedRows(): boolean {
    return Object.keys(this.editedRows).length > 0;
  }

  loadMoreData(): void {
    if (this.loading) {
      return; // Prevent duplicate requests
    }

    this.loading = true;
    this.gridRawData.unsubscribe();
    this.gridRawData = this.api.getAllTenarisData(this.pagenumber, this.pageSize).subscribe({
      next: (data) => {
        this.materials = [...this.materials, ...data]; // Append new data
        this.filteredMaterials = [...this.filteredMaterials, ...data];
        this.totalRecords = this.filteredMaterials.length;
        if (data.length > 0) {
          this.pagenumber++;
          setTimeout(() => {
            this.loadMoreData(); // Fetch next batch after delay
          });
        } else {
          this.gridOptions.api.hideOverlay();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching inventory data', err);
        this.materials = [];
        this.filteredMaterials = [];
        this.loading = false;
      }
    });
  }
  // added date formatter for expectedDeliveryDate column //
  dateFormatter(params) {
    if (params.value) {
      const date = new Date(params.value);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
    return null;
  }
  // date formatter for expectedDeliveryDate column //

  excelDateToJSDate(serial: number | null | undefined): Date | null {
    if (serial == null || isNaN(serial)) return null;

    // Adjust for Excel leap year bug
    const correctedSerial = serial > 60 ? serial - 1 : serial;

    // Excel epoch starts at 1899-12-30
    const baseDate = new Date(Date.UTC(1899, 11, 30)); // UTC date
    const utcMillis = correctedSerial * 24 * 60 * 60 * 1000;

    const result = new Date(baseDate.getTime() + utcMillis);
    return result;
  }


  filterMaterials() {
    this.searchTerm = this.text;

    if (!this.searchTerm) {
      this.filteredMaterials = this.materials;
    } else {
      this.filteredMaterials = this.materials.filter(material =>
        String(material.materialId).includes(this.searchTerm)
      );
    }

    this.totalRecords = this.filteredMaterials.length;
  }
  // Method to save changes made to edited rows
  saveChanges() {
    this.showEditConfirmationDialog = true;
  }
  // Method to confirm and save changes made to edited rows
  onUpdateDetails() {
    const updatedRows = Object.values(this.editedRows).map(row => {
      const formatDate = (date: string | Date | undefined | null): string => {
        if (!date) return null; // Return null for null/undefined/empty values

        const d = new Date(date);
        if (isNaN(d.getTime())) return ''; // Return empty if invalid date

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        id: row.id ?? 0,
        materialId: String(row.materialId),
        expectedDeliveryDate: formatDate(row.expectedDeliveryDate),
        transactionType: row.transactionType,
        quantity: Number(row.quantity ?? 0),
        description: row.description,
        unitPrice: row.unitPrice,
        userIdModifiedBy: Number(this.userDetail.uid)
      };
    });

    if (updatedRows.length === 0) return;


    this.rawdataService.updateTenaris(updatedRows).subscribe({
      next: (response) => {
        this.editedRows = {};
        this.showEditConfirmationDialog = false;
        // this.rawdataService.clearTenarisCachePage(this.pagenumber, this.pageSize); // Clear cache to ensure fresh data
        this.loadMoreData();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Raw Data updated Successfully' });
      },
      error: (err) => {
        console.error('Error saving changes:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update Raw Data'
        });
      }
    });
  }


  // Method to reset changes made to edited rows
  resetChanges() {
    this.editedRows = {}; // Clear edited rows
    // this.rawdataService.clearTenarisCachePage(this.pagenumber, this.pageSize); // Clear cache to ensure fresh data
    this.loadMoreData();
    this.gridOptions.api.setRowData(this.filteredMaterials); // Refresh the grid with the original data
    this.gridOptions.api.refreshCells(); // Refresh cells to discard edits visually

  }
  //  Method to close the confirmation dialog
  closeDialog() {
    this.showEditConfirmationDialog = false;
  }
  /**
   * adding $ in amount field
   * @param params 
   * @returns 
   */
  currencyFormatter(params: any): string {
    const value = params.value;
    if (value == null || isNaN(value)) {
      return '';
    }
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return '';
    }
    //return '$' + numericValue.toFixed(2);
    // Format the number as currency with commas and two decimal places
    const formattedValue = numericValue.toLocaleString(LocaleTypeEnum.enUS, { style: 'currency', currency: 'USD' });
    return isNaN(value) ? params.value : formattedValue;
  }
}

