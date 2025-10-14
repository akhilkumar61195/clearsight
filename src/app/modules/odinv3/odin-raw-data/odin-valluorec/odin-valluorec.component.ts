import { Component, Input, OnDestroy } from '@angular/core';
import { ColumnConfig, valluorecOrdersCols } from '../columnconfig';
import { Valluorec } from '../../../../common/model/valluorec';
import { Subscription } from 'rxjs';
import { InventoryService } from '../../../../services/inventory.service';
import { SearchFilterService } from '../../../../services/search-filter.service';
import { UpdateVallourec } from '../../../../common/model/rawData-vallourec-update';
import { MessageService } from 'primeng/api';
import { RawdataService } from '../../../../services/rawdata.service';
import { AuthService } from '../../../../services';
import { CommonService } from '../../../../services/common.service';
import { AccessControls } from '../../../../common/constant';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { CustomDialogComponent } from '../../../common/custom-dialog/custom-dialog.component';
import { LocaleTypeEnum } from '../../../../common/enum/common-enum';

@Component({
  selector: 'app-odin-valluorec',
  standalone:true,
  imports:[PRIME_IMPORTS,
    CustomDialogComponent
  ],
  templateUrl: './odin-valluorec.component.html',
  styleUrl: './odin-valluorec.component.scss'
})
export class OdinValluorecComponent implements OnDestroy {
  summaryCols: ColumnConfig[] = valluorecOrdersCols;
  materials: Valluorec[] = [];
  filteredMaterials: Valluorec[] = [];
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
  editedRows: { [rowId: string]: any } = {};
  showEditConfirmationDialog: boolean = false;
  userDetail: any;
  updateVallourec: UpdateVallourec[] = [];
  private gridRawData: Subscription = new Subscription();

  constructor(private api: RawdataService, private searchFilterService: SearchFilterService
    , private rawdataService: RawdataService, private messageService: MessageService,
    private authService: AuthService, private commonService: CommonService,
  ) {
    this.userDetail = this.authService.getUserDetail();

  }
ngOnDestroy() {
    this.gridRawData.unsubscribe();
  }
  ngOnChanges(): void {
    this.filterMaterials();
    this.getUserDetails();
    

  }

  ngOnInit(): void {
    /*this.getInventories();*/
    // this.loadMoreData();
    
    this.filterSubscription = this.searchFilterService.filter$.subscribe(({ text, option }) => {
      this.searchTerm = text;
      this.selectedOption = option;
    });
  }

  onGridReady(event: any): void {
    // event.api.sizeColumnsToFit();
    this.gridOptions.api = event.api;
    this.gridOptions.columnApi = event.columnApi;
    // event.api.setDatasource(this.createDatasource());
    event.api.sizeColumnsToFit();
    this.loadMoreData();
  }
   getUserDetails() {
    let userAccess = this.authService.isAuthorized(AccessControls.VALLOUREC_ORDER_ACCESS);
    this.commonService.setuserAccess(userAccess);
    this.createColumnDefs();
  }

  // currencyFormatter(params: any): string {
  //   const value = params.value;
  //   if (value == null || isNaN(value)) {
  //     return '';
  //   }
  //   return '$' + value.toFixed(2);
  // }

  // createColumnDefs() {
  //   this.columnDefs = this.summaryCols.map((col, index) => {
  //     let value = {
  //       headerName: col.header,
  //       field: col.field,
  //       sortable: col.sortable !== false,
  //       filter: true,
  //       hide: col.field === 'id', // Hide only the 'id' field
  //       resizable: true,
  //       editable: true,
  //       cellStyle: params => {
  //         return col.field === 'pricePerFoot' ? {
  //           'color': col.textColor,
  //           'white-space': 'nowrap',
  //           'text-align': 'right',
  //         } : {
  //           'color': col.textColor,
  //           'white-space': 'nowrap'
  //         };
  //       },
  //       headerClass: 'header-bold',
  //       headerTooltip: col.header,
  //       valueFormatter: col.field === 'pricePerFoot'
  //         ? this.currencyFormatter
  //         : col.field === 'expectedDeliveryDate'
  //           ? this.dateFormatter
  //           : undefined // Apply formatter for expectedDeliveryDate
  //     };
  //     if (index === 0) {
  //       value['suppressSizeToFit'] = true;
  //     }
  //     (value['minWidth'] = (col.width || 150))
  //     return value;
  //   });
  // }

  // Create column definitions based on summaryCols configuration
  // editableFields added

  createColumnDefs() {
    const dateFields = ['expectedDeliveryDate'];
    const currencyFields = ['pricePerFoot'];

    this.columnDefs = this.summaryCols.map((col, index) => {
      let value: any = {
        headerName: col.header,
        field: col.field,
        sortable: col.sortable !== false,
        filter: true,
        hide: col.field === 'id',
        resizable: true,
        editable: this.authService.isFieldEditable(col.field),
        cellStyle: (params: any) => {
          return currencyFields.includes(col.field)
            ? {
              'color': col.textColor,
              'white-space': 'nowrap',
              'text-align': 'right',
            }
            : {
              'color': col.textColor,
              'white-space': 'nowrap',
            };
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

  // oncell valuechanged method for edited values
  onCellValueChanged(event: any): void {
    const updatedData = event.data;

    // Use a unique identifier (e.g., `id` or `materialId`) as key
    const rowKey = updatedData.id;
    if (rowKey) {
      this.editedRows[rowKey] = { ...updatedData }; // Store a copy of the updated row
    }
    // console.log('Edited rows:', Object.values(this.editedRows)); // All modified rows
  }

  // Check if there are any edited rows
  get hasEditedRows(): boolean {
    return Object.keys(this.editedRows).length > 0;
  }

  loadMoreData(): void {
    if (this.loading) {
      return; // Prevent duplicate requests
    }
    if (this.pagenumber === 1) {
      this.gridOptions.api.showLoadingOverlay();
    }
    this.loading = true;
    this.gridRawData.unsubscribe();
    this.gridRawData = this.api.getAllValluorecData(this.pagenumber, this.pageSize).subscribe({
      next: (data) => {
        this.materials = [...this.materials, ...data]; // Append new data
        this.filteredMaterials = [...this.filteredMaterials, ...data];
        this.totalRecords = this.filteredMaterials.length;
        if (data.length > 0) {
          this.pagenumber++;
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
  // Method to confirm and update details of edited rows
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
      // Convert each row to UpdateVallourec format
      return {
        id: row.id ?? 0,
        materialId: String(row.materialId),
        productType: row.productType,
        orderQty: Number(row.quantity ?? 0),
        orderComments: row.orderComments,
        orderStatus: row.orderStatus,
        shipmentForeCastQty: row.shipmentForecastedQuantity ?? 0,
        expectedDeliveryDate: formatDate(row.expectedDeliveryDate),
        connection: row.connection ?? '',
        pricePerFoot: Number(row.pricePerFoot ?? 0),
        longDescription: row.description || '',
        userIdModifiedBy: Number(this.userDetail.uid),
      };
    });
    if (updatedRows.length === 0) return;
    this.rawdataService.updateVallourec(updatedRows).subscribe({
      next: (response) => {
        this.editedRows = {}; // Clear after save
        this.showEditConfirmationDialog = false;
        this.loadMoreData(); // Refresh the data
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Raw Data updated Successfully' });
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

  closeDialog() {
    this.showEditConfirmationDialog = false;
  }

}
