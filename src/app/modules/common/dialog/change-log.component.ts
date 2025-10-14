import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { defaultRowNumber } from '../../../common/constant';
import { SortOrder } from '../../../common/enum/common-enum';
import { ChangeLogService } from '../../../services/changeLog.service';
import { IChangeLog } from '../../../common/model/IchangeLog';
import {  GridApi } from 'ag-grid-community';
import { GridOptions } from 'ag-grid-community';
import { ColumnService } from '../../../services/columnService/changeLogCoulmnService';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';


@Component({
  selector: 'change-log',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './change-log.component.html',
  styleUrl: './change-log.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ChangeLogComponent implements OnInit {

  @Output() onClose = new EventEmitter<void>();
  @Input() entityName: string;
  @Input() schematicDetailId: number;
  @Input() selectedFunction: number = 1;
  @Input() entityId: number;
  mdlChangeLogColumnDefs;
  schemticChangeColumnDefs;
  visible: boolean = true;
  loading: boolean = true;
  isGridInitialized: boolean = false;
  rowOffset: number = 1;
  fetchNextRows: number = 1000;
  totalRecords: number = 0;
  rows: number = defaultRowNumber;
  sortBy: string = 'auditId';
  sortDirection: string = SortOrder.DESC;
  changeLogData: Array<IChangeLog> = [];
  private gridApi!: GridApi;
  gridOptions: GridOptions;
  changeLogColumnDefs;
  changeLogList: any;
  searchText: string = ''; // it will store change log search text
  globalFilter: string = ''; // for change log global search
  constructor(private changelogService: ChangeLogService, private columnService: ColumnService) {
    this.gridOptions = {
    };
  }



  ngOnInit(): void {

    this.mdlChangeLogColumnDefs = this.columnService.mdlChangeLogColumnDefs;
    this.schemticChangeColumnDefs = this.columnService.schemticChangeColumnDefs;
    this.visible = true;
    this.totalRecords = 0;
    this.changeLogData = [];
    this.bindColumnDef();
  }
  getChangeLogList(pageIndex, pageSize) {

    this.loading = true;
    this.changelogService.getChangeLogs(pageIndex, pageSize, this.entityName).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.changeLogData = response.items;
        this.totalRecords = response.totalPages;

      },
      error: () => {
        this.loading = false;
        this.changeLogData = [];
        this.totalRecords = 0;

      },
    });


  }

  getSchematicsChangeLogById(pageIndex, pageSize) {
    this.loading = true;
    this.changelogService.getSchematicsChangeLogById(pageIndex, pageSize, this.schematicDetailId).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.changeLogData = response.items;
        this.totalRecords = response.totalPages;

      },
      error: () => {
        this.loading = false;
        this.changeLogData = [];
        this.totalRecords = 0;

      },
    });


  }

  getThorDrillingChangeLogList(pageIndex, pageSize) {
    this.loading = true;
    let body = {
      SearchTerms: '',
      pageNumber: this.rowOffset,
      rowsPerPage: this.fetchNextRows,
      SortBy: 'id',
      SortDescending: this.sortDirection == SortOrder.DESC ? true : false,
      SearchConditions: [],
    };

    let params = {
      wellMaterialId: this.entityId,
    };

    this.loading = true;

    this.changelogService.getThorChangeLog(pageIndex, pageSize, this.entityId).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.changeLogData = response.items;
        this.totalRecords = response.items.length;
      },
      error: () => {
        this.loading = false;
        this.changeLogList = [];


      },
    });



  }
  getOdinChangeLogList(pageIndex, pageSize) {
    this.loading = true;
    let body = {
      SearchTerms: '',
      pageNumber: this.rowOffset,
      rowsPerPage: this.fetchNextRows,
      SortBy: 'id',
      SortDescending: this.sortDirection == SortOrder.DESC ? true : false,
      SearchConditions: [],
    };


    this.loading = true;

    this.changelogService.getOdinChangeLog(pageIndex, pageSize, this.selectedFunction).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.changeLogData = response.items;
        this.totalRecords = response.items.length;
      },
      error: () => {
        this.loading = false;
        this.changeLogList = [];


      },
    });



  }
  getTyrChangeLogList(pageIndex, pageSize) {
    this.loading = true;
    let body = {
      SearchTerms: '',
      pageNumber: this.rowOffset,
      rowsPerPage: this.fetchNextRows,
      SortBy: 'id',
      SortDescending: this.sortDirection == SortOrder.DESC ? true : false,
      SearchConditions: [],
    };


    this.loading = true;

    this.changelogService.getTyrChangeLog(pageIndex, pageSize, this.selectedFunction).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.changeLogData = response.items;
        this.totalRecords = response.items.length;
      },
      error: () => {
        this.loading = false;
        this.changeLogList = [];


      },
    });



  }

  onGridReady(params: any): void {

    this.gridApi = params.api;
    this.isGridInitialized = true;

    switch (this.entityName) {
      case 'MaterialMaster':
        this.getChangeLogList(this.rowOffset, this.fetchNextRows); // entity name changes
        break;
      case 'completionSchematicsHeader':
        this.getChangeLogList(this.rowOffset, this.fetchNextRows);
        break;
      case 'thorDrillingHeaders':
        this.getThorDrillingChangeLogList(this.rowOffset, this.fetchNextRows);
        break;
      case 'thorCompletionHeaders':
        this.getThorDrillingChangeLogList(this.rowOffset, this.fetchNextRows);
        break;
      case 'odin':
        this.getOdinChangeLogList(this.rowOffset, this.fetchNextRows);
        break;
      case 'Tenaris Orders':
      case 'Valluorec Orders':
      case 'Liner Hanger Orders':
      case 'Wellhead Orders':
      case 'MITI':
        this.getChangeLogList(this.rowOffset, this.fetchNextRows);
        break;
      case 'Tyr':
        this.getTyrChangeLogList(this.rowOffset, this.fetchNextRows);
        break;
      default:
        this.getSchematicsChangeLogById(this.rowOffset, this.fetchNextRows);
        break;
    }

  }

  bindColumnDef() {

    switch (this.entityName) {
      case 'MaterialMaster':
        this.changeLogColumnDefs = this.columnService.mdlChangeLogColumnDefs;
        break;
      case 'completionSchematicsHeader':
        this.changeLogColumnDefs = this.columnService.schemticChangeColumnDefs;
        break;
      case 'thorCompletionHeaders':
      case 'thorDrillingHeaders':
        this.changeLogColumnDefs = this.columnService.thorCompletionChangeLogColumnDefs;
        break;

      case 'odin':
        this.changeLogColumnDefs = this.columnService.odinChangeColumnDefs;
        break;
      case 'Tenaris Orders':
      case 'Valluorec Orders':
      case 'Liner Hanger Orders':
      case 'Wellhead Orders':
      case 'MITI':
        this.changeLogColumnDefs = this.columnService.rawDataChangeColumnDefs;
        break;
      case 'Tyr':
        this.changeLogColumnDefs = this.columnService.tyrChangeColumnDefs;
        break;
      default:
        this.changeLogColumnDefs = this.columnService.schemticDetailsChangeColumnDefs;
        break;
    }
  }

  /**
   * global search for change log
   */
  onSearch(): void {
    this.globalFilter = this.searchText.toLowerCase();
  }

}
