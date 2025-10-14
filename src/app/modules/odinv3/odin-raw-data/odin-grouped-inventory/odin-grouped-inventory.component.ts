import { Component, Input, OnDestroy } from '@angular/core';
import { ColumnConfig, groupedInventoryCols } from '../columnconfig';
import { Groupedinventory } from '../../../../common/model/groupedinventory';
import { Subscription } from 'rxjs';
import { InventoryService } from '../../../../services/inventory.service';
import { SortEvent } from 'primeng/api';
import { SearchFilterService } from '../../../../services/search-filter.service';
import { RawdataService } from '../../../../services/rawdata.service';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { CustomDialogComponent } from '../../../common/custom-dialog/custom-dialog.component';
import { ExcelUploadComponent } from '../../../common/excel-upload-dialog/excel-upload-dialog.component';
import { FileStatusDialogComponent } from '../../../common/file-log-dialog/file-log-dialog.component';

@Component({
  selector: 'app-odin-grouped-inventory',
  standalone:true,
    imports:[...PRIME_IMPORTS
    ],
  templateUrl: './odin-grouped-inventory.component.html',
  styleUrl: './odin-grouped-inventory.component.scss'
})
export class OdinGroupedInventoryComponent implements OnDestroy {
  summaryCols: ColumnConfig[] = groupedInventoryCols;
  materials: Groupedinventory[] = [];
  filteredMaterials: Groupedinventory[] = [];
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
  private gridRawData: Subscription = new Subscription();


  constructor(private api: RawdataService, private searchFilterService: SearchFilterService
  ) { }

  ngOnDestroy() {
    this.gridRawData.unsubscribe();
  }

  ngOnChanges(): void {
    this.filterMaterials();

  }

  ngOnInit(): void {
    this.filterSubscription = this.searchFilterService.filter$.subscribe(({ text, option }) => {
      this.searchTerm = text;
      this.selectedOption = option;
      // this.filterGrid();
    });
    this.createColumnDefs();

  }


  onGridReady(event: any): void {
    this.gridOptions.api = event.api;
    this.gridOptions.columnApi = event.columnApi;
    event.api.sizeColumnsToFit();
    this.loadMoreData();
  }

  createColumnDefs() {
    this.columnDefs = this.summaryCols.map((col, index) => {
      let value = {
        headerName: col.header,
        field: col.field,
        sortable: col.sortable !== false,
        filter: true,
        resizable: true,
        editable: true,
        // valueSetter: (params: any) => {
        //   if (params.newValue !== params.oldValue) {
        //     params.data[params.colDef.field] = params.newValue;

        //     // Find the updated row in filteredMaterials and update it
        //     const index = this.filteredMaterials.findIndex(row => row.materialId === params.data.materialId);
        //     if (index > -1) {
        //       this.filteredMaterials[index] = { ...params.data }; // Replace the object to match immutability
        //     }

        //     return true;
        //   }
        //   return false;
        // },
        cellStyle: {
          'color': col.textColor,
          'white-space': 'nowrap'
        },
        headerClass: 'header-bold remove-ellipse',
        headerTooltip: col.header,
        width: (col.width || 100),
        // valueFormatter: valuesToConvert ? this.currencyFormatter : undefined
      };
      if (index === 1) {
        value['suppressSizeToFit'] = true;
        value['width'] = 200
      }
      return value;
    });
  }

  // edit working

  // createColumnDefs() {
  //   this.columnDefs = this.summaryCols.map((col, index) => {
  //     let value = {
  //       headerName: col.header,
  //       field: col.field,
  //       sortable: col.sortable !== false,
  //       filter: true,
  //       resizable: true,
  //       editable: true,
  //       valueSetter: (params: any) => {
  //         if (params.newValue !== params.oldValue) {
  //           // Directly update the property on the row object
  //           params.data[params.colDef.field] = params.newValue;

  //           // No array reassignment here, just update the object
  //           // This preserves references and grid internal edit state

  //           console.log('Updated', params.colDef.field, 'to', params.newValue);
  //           return true;
  //         }
  //         return false;
  //       },
  //       cellStyle: {
  //         'color': col.textColor,
  //         'white-space': 'nowrap'
  //       },
  //       headerClass: 'header-bold remove-ellipse',
  //       headerTooltip: col.header,
  //       width: col.width || 100
  //     };
  //     if (index === 1) {
  //       value['suppressSizeToFit'] = true;
  //       value['width'] = 200;
  //     }
  //     return value;
  //   });
  // }


  loadMoreData(): void {
    if (this.loading) {
      return; // Prevent duplicate requests
      
    }
    if (this.pagenumber === 1) {
      this.gridOptions.api.showLoadingOverlay();
    }
    this.loading = true;
    this.gridRawData.unsubscribe();
    this.gridRawData = this.api.getAllGroupedInventoryData(this.pagenumber, this.pageSize).subscribe({
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
          if (this.gridOptions.api && !this.gridOptions.api.isDestroyed()) {
            this.gridOptions.api.hideOverlay();
          }
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
        material.materialId.includes(this.searchTerm)
      );
    }

    this.totalRecords = this.filteredMaterials.length;
  }

  // Method to handle sorting
  onSort(event: SortEvent): void {
    const { field, order } = event;
    this.filteredMaterials = this.api.sortData(this.filteredMaterials, field as keyof Groupedinventory, order);
  }
  filterGrid() {
    if (this.gridOptions.api) {
      if (this.searchTerm.trim() === '') {
        const filterModel = this.gridOptions.api.getFilterModel() || {};
        delete filterModel['materialId'];
        this.gridOptions.api.setFilterModel(filterModel);
      } else {
        const filterModel = this.gridOptions.api.getFilterModel() || {};
        filterModel['materialId'] = {
          type: 'contains',
          filter: this.searchTerm
        };
        this.gridOptions.api.setFilterModel(filterModel);
      }
    }
  }

}
