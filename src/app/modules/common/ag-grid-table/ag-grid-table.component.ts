import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { ColDef, GridApi } from 'ag-grid-community';
import { GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-ag-grid-table',
  templateUrl: './ag-grid-table.component.html',
  styleUrls: ['./ag-grid-table.component.scss']
})
export class AgGridTableComponent implements OnInit {
  @Input() rowData: any[] = [];
  @Input() columnDefs: ColDef[] = [];
  @Input() paginationPageSize: number = 10;
  @Input() totalRecords: number = 0;
  @Input() loading: boolean = true;
  @Output() loadData = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<any>();
  private gridApi!: GridApi;
  constructor() {
  }

  ngOnInit(): void { }

  onGridReady(params: any) {
    params.api.sizeColumnsToFit();
    this.loadData.emit();
    //params.api.loading = false;
  }

  // OpenEditDialog(params: any) {
  //   this.editRequested.emit(params.data);
  // }
}
