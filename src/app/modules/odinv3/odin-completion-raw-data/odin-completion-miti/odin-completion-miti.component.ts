import { Component, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { GridApi } from 'ag-grid-community';
import 'ag-grid-enterprise';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AccessControls } from '../../../../common/constant';
import { AuthService } from '../../../../services';
import { ColumnService } from '../../../../services/columnService/changeLogCoulmnService';
import { CommonService } from '../../../../services/common.service';
import { RawdataService } from '../../../../services/rawdata.service';
import { SearchFilterService } from '../../../../services/search-filter.service';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { CustomDialogComponent } from '../../../common/custom-dialog/custom-dialog.component';
import { LocaleTypeEnum } from '../../../../common/enum/common-enum';

@Component({
  selector: 'app-odin-completion-miti',
  standalone:true,
  imports:[...PRIME_IMPORTS, CustomDialogComponent],
  templateUrl: './odin-completion-miti.component.html',
  styleUrls: ['./odin-completion-miti.component.scss']
})
export class OdinCompletionMitiComponent implements OnInit, OnDestroy {
  gridOptions: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  gridApi!: GridApi; //declare grid api

  pageSize = 100;
  pagenumber = 1;
  loading = false;
  totalRecords: number = 0; // to show total record count
  materials: any[] = [];
  filteredMaterials: any[] = [];
  searchTerm: string = '';
  quickFilterText: string = '';
  selectedOption: string = '';
  filterSubscription: Subscription;
  editedRows: { [rowId: string]: any } = {}; // Store edited rows by their unique identifier
  showEditConfirmationDialog: boolean = false;
  userDetail: any;
  columnDefs = [];
  defaultColDef = {};

  // Subscription to manage observable and avoid memory leaks
  private odinCompletionsMitiSubscription: Subscription = new Subscription();

  constructor(
    private columnService: ColumnService,
    private rawdataService: RawdataService,
    private searchFilterService: SearchFilterService,
    private authService: AuthService, // AuthService to get user details
    private messageService: MessageService,
    private commonService: CommonService, // MessageService for notifications
  ) {
    this.userDetail = this.authService.getUserDetail();
  }

  // Unsubscribe to avoid memory leaks
  ngOnDestroy(): void {
    this.odinCompletionsMitiSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    
    this.getUserDetails();
    this.odinCompletionsMitiSubscription = this.filterSubscription = this.searchFilterService.filter$.subscribe(({ text, option }) => {
      this.searchTerm = text;
      this.selectedOption = option;
      // this.filterGrid();
    });
    // this.createColumnDefs();
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.getUserDetails();
  }
  onGridReady(event: any) {
    this.gridOptions.api = event.api;
    this.gridOptions.columnApi = event.columnApi;
    event.api.sizeColumnsToFit();
    this.loadMoreData();
  }
  // Retrieves and sets user access control info using the AuthService
   getUserDetails() {
    let userAccess =  this.authService.isAuthorized(AccessControls.MITI_ORDER_ACCESS);
    this.commonService.setuserAccess(userAccess);
    const editableColumnDefs = this.columnService.mitiColumnDefs;
    this.columnDefs = editableColumnDefs.map(col => ({
      ...col,
      editable: this.authService.isFieldEditable(col.field),
      hide: col.field === 'sopriceMatOnly' ? !this.authService.isFieldEditable(col.field) : false,
      // If the column is hidden, suppress it in the columns tool panel
      suppressColumnsToolPanel: col.field === 'sopriceMatOnly' ? !this.authService.isFieldEditable(col.field) : false,
      valueFormatter: (() => {
        if (col.field === 'sopriceMatOnly') {
          return this.currencyFormatter;
        }

        if (['etd', 'eta', 'deliveryDate'].includes(col.field)) {
          return (params: any) => {
            const value = params.value;
            if (!value) return '';

            const date = value instanceof Date ? value : new Date(value);
            if (isNaN(date.getTime())) return '';

            const day = String(date.getUTCDate()).padStart(2, '0');
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const year = date.getUTCFullYear();

            return `${month}/${day}/${year}`;
          };
        }

        return undefined; // no formatter for other fields
      })()
    }));


    this.defaultColDef = this.columnService.defaultColDef;
  }

  loadMoreData(): void {
    if (this.loading) return;

    if (this.pagenumber === 1 && this.gridApi) {
      this.gridOptions.api.showLoadingOverlay();
    }

    this.loading = true;

    this.odinCompletionsMitiSubscription = this.rawdataService.getMitiPaged(this.pagenumber, this.pageSize).subscribe({
      next: (res) => {
        const data = res.result.data || [];

        this.materials = [...this.materials, ...data];
        this.filteredMaterials = [...this.filteredMaterials, ...data];
        this.totalRecords = this.filteredMaterials.length;
        this.gridOptions.api.hideOverlay();

      },
      error: () => {
        this.materials = [];
        this.filteredMaterials = [];
        this.loading = false;

        if (this.gridApi && !this.gridApi.isDestroyed()) {
          this.gridApi.hideOverlay();
        }
      }
    });
  }

  // oncell valuechanged method for edited values
  onCellValueChanged(event: any): void {
    const updatedData = event.data;

    // Use a unique identifier (e.g., `id` or `materialId`) as key
    const rowKey = updatedData.id;
    if (rowKey) {
      this.editedRows[rowKey] = { ...updatedData }; // Store a copy of the updated row
    }
  }
  //  hasEditedRows getter to check if there are any edited rows
  get hasEditedRows(): boolean {
    return Object.keys(this.editedRows).length > 0;
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
      // Convert each row to UpdateMiti format
      return {
        id: row.id ?? 0,
        contract: row.contract ?? '',
        mitisoNo: row.mitisoNo ?? '',
        description: row.description ?? '',
        cvxPo: row.cvxPo ?? '',
        project: row.project ?? '',
        cvxEngineer: row.cvxEngineer ?? '',
        well: row.well ?? '',
        wbs: row.wbs ?? '',
        cvxMm: row.cvxMm ?? '',
        soonerSo: row.soonerSNNo ?? '', // mapping soonerSo from soonerSNNo field in grid
        lineNumber: Number(row.lineNumber ?? 0),
        comm: row.comm ?? '',
        grade: row.grade ?? '',
        odIn: Number(row.odIn ?? 0),
        wtIn: Number(row.wtIn ?? 0),
        wtLbsPerFt: Number(row.wtLbsPerFt ?? 0),
        lengthFt: row.lengthFt ?? '',
        end: row.end ?? '',
        quantityFt: Number(row.quantityFt ?? 0),
        quantityPc: Number(row.quantityPc ?? 0),
        cvxRequiredDeliveryMonthYear: row.cvxRequiredDeliveryMonthYear ?? '',
        partial: row.partial ?? '',
        vessel: row.vessel ?? '',
        etd: formatDate(row.etd),
        eta: formatDate(row.eta),
        deliveryDate: formatDate(row.deliveryDate),
        receivingReport: row.receivingReport ?? '',
        status: row.status ?? '',
        sopriceMatOnly: Number(row.sopriceMatOnly ?? 0),
        supplier: row.supplier ?? '',
        dateLastModified: formatDate(row.dateCreated), // current timestamp
        userIdModifiedBy: Number(this.userDetail?.uid ?? 0),
      };

    });
    if (updatedRows.length === 0) return;
    this.odinCompletionsMitiSubscription = this.rawdataService.updateMiti(updatedRows).subscribe({
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

  // Method to close the confirmation dialog
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
