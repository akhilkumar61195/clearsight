import { ChangeDetectorRef, Injectable, Input, signal, WritableSignal } from '@angular/core';
import { RawdataService } from '../../../../../services/rawdata.service';
import { MessageService } from 'primeng/api';
import { WellHeadUpload } from '../../../../../common/model/rawDataBulkUploadModel';
import { AuthService } from '../../../../../services';

@Injectable({
  providedIn: 'root'
})
export class WellheadOrdersService {
  loading: boolean = false;
  pagenumber: number = 1; // Start from page 
  pageSize: number = 500; // Default page size
  materials: WellHeadUpload[] = [];
  filteredMaterials: WritableSignal<Array<WellHeadUpload>> = signal<Array<WellHeadUpload>>([]);
  totalRecords: WritableSignal<number> = signal<number>(0);
  searchTerm: string = '';
  @Input() text: string = '';
  gridOptions: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  editedRows: { [rowId: string]: any } = {};
  userDetail: any;
  showEditConfirmationDialog: boolean = false;


  constructor(private api: RawdataService,
    private rawdataService: RawdataService, private authService:AuthService,
    //private cdRef: ChangeDetectorRef, // ChangeDetectorRef to force view updates
    private messageService: MessageService,
  ) { }

  // Triggered when AG Grid is initialized and ready
  // - Stores grid API references
  // - Resizes columns to fit container
  // - Loads the initial dataset
  onGridReady(event: any): void {
    this.gridOptions.api = event.api;
    this.gridOptions.columnApi = event.columnApi;
    setTimeout(() => {
      event.api.sizeColumnsToFit();
    }, 0);
    
    this.loadMoreData();
  }

  // Loads paginated material data from API and updates the grid
  loadMoreData(): void {
    if (this.loading) {
      return; // Prevent duplicate requests
    }
    if (this.pagenumber === 1) {
      this.gridOptions.api.showLoadingOverlay();
    }
    this.loading = true;

    this.api.getAllWellheadData1(this.pagenumber, this.pageSize).subscribe({
      next: (data) => {
        this.materials = [...this.materials, ...data]; // Append new data
        this.filteredMaterials.set([...this.filteredMaterials(), ...data])
        this.totalRecords.set(this.filteredMaterials.length);
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
        this.filteredMaterials.set([])
        this.loading = false;
      }
    });
  }

  isSaveDisabled(): boolean {
    return Object.keys(this.editedRows).length === 0;
  }
  // Resets any unsaved changes in the grid
  resetChanges() {
    this.editedRows = {}; // Clear edited rows
    this.loadMoreData();
    this.gridOptions.api.setRowData(this.filteredMaterials); // Refresh the grid with the original data
    this.gridOptions.api.refreshCells(); // Refresh cells to discard edits visually
  }

  // Called to save the edited rows to the backend
  onUpdateDetails() {
    this.userDetail = this.authService.getUserDetail();
    const updatedRows = Object.values(this.editedRows).map(row => {
      const parseDate = (date: string | Date | undefined | null): Date | null => {
        if (!date) return null;
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d;
      };

      return {
        id:row.id,
        due: parseDate(row.due),
        orderLine: row.orderLine ?? '',
        pONumber: row.ponumber ?? '', // Map 'ponumber' to 'pONumber'
        mmnumber: row.mmnumber ?? '',
        cpNum: row.cpnum ?? '',       // Map 'cpnum' to 'cpNum'
        customerDistrict: row.customerDistrict ?? '',
        orderNo: row.orderNo,
        item: row.item ?? '',
        qtyOpen: Number(row.qtyOpen ?? 0),
        description: row.description ?? '',
        salesValue: Number(row.salesValue ?? 0),
        costValue: Number(row.costValue ?? 0),
        netAvail: Number(row.netAvail ?? 0),
        currentNet: Number(row.currentNet ?? 0),
        orderDate: parseDate(row.orderDate),
        coord: row.coord ?? '',
        typeofWork: row.typeOfWork ?? '', // Map 'typeOfWork' to 'typeofWork'
        ordStatus: row.ordStatus ?? '',
        mTRJob: row.mtrjob ?? '',         // Map 'mtrjob' to 'mTRJob'
        jobStatus: row.jobStatus ?? '',
        comment: row.comment ?? '',
        delivery: row.delivery ?? '',
        userIdModifiedBy: Number(this.userDetail?.uid ?? 0)
      };
    });

    if (updatedRows.length === 0) return;

    this.rawdataService.updateWellHead(updatedRows).subscribe({
      next: (response) => {
        this.editedRows = {};
        this.pagenumber = 1;
        this.materials = [];
        this.filteredMaterials.set([]);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Well Head data updated successfully'
        });

        this.loadMoreData();
      },
      error: (err) => {
        console.error('Error updating Well Head data:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update Well Head data'
        });
      }
    });
  }

  // Filters material list based on searchTerm
  filterMaterials() {
    this.searchTerm = this.text;

    if (!this.searchTerm) {
      this.filteredMaterials.set(this.materials)
    } else {
      this.filteredMaterials.set(this.materials.filter(material =>
        String(material.mmnumber).includes(this.searchTerm)
      ))
    }

    this.totalRecords.set(this.filteredMaterials.length);
  }

  // Stores the updated row locally in the editedRows object
  onCellValueChanged(event: any) {
    const updatedData = event.data;

    // Use a unique identifier (e.g., `id` or `materialId`) as key
    const rowKey = updatedData.id;
    if (rowKey) {
      this.editedRows[rowKey] = { ...updatedData }; // Store a copy of the updated row
    }
    // console.log('Edited rows:', Object.values(this.editedRows)); // All modified rows
  }
}
