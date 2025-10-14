import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../../services/inventory.service';
import * as XLSX from 'xlsx';
import { ColDef, GridOptions } from 'ag-grid-community';
import { BatchFileService } from '../../../services/batchFile.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { LocaleTypeEnum } from '../../../common/enum/common-enum';

@Component({
  selector: 'app-file-upload-status',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './file-upload-status.component.html',
  styleUrl: './file-upload-status.component.scss'
})
export class FileUploadStatusComponent implements OnInit {

  displayViewStatusDialog = false;
  files: any[] = [];
  columnDefs: ColDef[];
  showLogs: boolean = false;
  logs: any[] = [];
  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  public logColumnDefs: ColDef[] = [
    {
      headerName: 'Job Id',
      field: 'batchId',
      width:100,
      minWidth:130
    },
    {
      headerName: 'Timestamp',
      field: 'timestamp',
      width:200,
      cellRenderer: params => new Date(params.value).toLocaleString(LocaleTypeEnum.enUS, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    {
      headerName: 'Log Message',
      field: 'logMessage',
      flex: 1 // Adjusts width of the column to take available space
    }
  ];

  //public gridOptions = {
  //  defaultColDef: {
  //    resizable: true,
  //    sortable: true
  //  },
  //  rowData: this.logs, // Assign your data here
  //  //domLayout: 'autoHeight', // Automatically adjust the grid height
  //  //pagination: false,
  //  //suppressHorizontalScroll: true,
  //  //onGridReady: (params) => {
  //  //  this.gridApi = params.api;
  //  //  this.gridColumnApi = params.columnApi;
  //  //}
  //};
  constructor(private inventoryService: InventoryService,
    private batchFileService: BatchFileService
  ) { }

  ngOnInit(): void {
    this.columnDefs = [
      { headerName: 'Job ID', field: 'id'  , minWidth:80},
      { headerName: 'File Name', field: 'fileName', width: 250 },
      {
        headerName: 'Process Status',
        field: 'processStatus', minWidth: 120,
        //cellStyle: {'font-weight': 'bold'}
        //cellStyle: params => {
        //  if (params.value && (params.value.includes('Completed') || params.value.includes('Successful'))) {
        //    return { color: '#769231', 'font-weight': 'bold' };
        //  }
        //  if (params.value && (params.value.includes('Failed') || params.value.includes('Error') || params.value.includes('Exception'))) {
        //    return { color: '#97002E', 'font-weight': 'bold' };
        //  }
        //  if (params.value && params.value.includes('Warning')) {
        //    return { color: '#E5601F', 'font-weight': 'bold' };
        //  }
        //  if (params.value && (params.value.includes('Uploaded') || params.value.includes('Processing'))) {
        //    return { color: 'yellow', 'font-weight': 'bold' };
        //  }
        //  if (params.value && (params.value.includes('Validating') || params.value.includes('Validated'))) {
        //    return { color: 'blue', 'font-weight': 'bold' };
        //  }
        //  return null;
        //}
      },
      {
        headerName: 'Data Transformation Status',
        field: 'batchStatus',
        width:350,
        cellStyle: params => {
          if (params.value && (params.value.includes('Completed') || params.value.includes('Successful'))) {
            return { color: '#769231' };
          }
          if (params.value && (params.value.includes('Failed') || params.value.includes('Error') || params.value.includes('Exception'))) {
            return { color: '#97002E' };
          }
          if (params.value && params.value.includes('Warning')) {
            return { color: '#E5601F' };
          }
          if (params.value && (params.value.includes('Uploaded') || params.value.includes('Processing'))) {
            return { color: 'yellow' };
          }
          if (params.value && (params.value.includes('Validating') || params.value.includes('Validated'))) {
            return { color: 'blue' };
          }
          return null;
        }
      },
      { headerName: 'Created By', field: 'firstName', width: 150 },
      {
        headerName: 'Created Date',
        field: 'createdDate', width: 150,
        valueFormatter: this.dateFormatter
      }
      //{
      //  headerName: 'Logs',
      //  //cellRenderer: params => `
      //  //  <button (click)="toggleLogVisibility(${params.node.id})">
      //  //    <i class="pi" [ngClass]="{'pi-plus': !params.data.showLogs, 'pi-minus': params.data.showLogs}"></i>
      //  //    View Logs
      //  //  </button>`
      //}
    ];
  }

  // Date formatting
  dateFormatter(params) {
    return new Date(params.value).toLocaleDateString('en-US');
  }

  loadFiles() {
    this.batchFileService.getBatchFiles().subscribe((data) => {
      this.files = data.map((file: any) => ({
        ...file,
        showLogs: false,
        showErrors: false,
        logs: [],
        errors: []
      }));
    });
  }

  //toggleLogVisibility(batch: any) {
  //  console.log(batch.id);
  //  console.log(this.files);
  //  const file = this.files.find(f => f.id === batch.id);
  //  console.log(file);
  //  if (file) {
  //    file.showLogs = !file.showLogs;
  //    if (file.showLogs && file.logs.length === 0) {
  //      this.inventoryService.getBatchLogs(batch.id).subscribe((logs) => {
  //        console.log(logs);
  //        file.logs = logs;
  //      });
  //    }
  //  }
  //}

  toggleLogVisibility(batch: any) {
    const file = this.files.find(f => f.id === batch.id);
    if (file) {
      this.inventoryService.getBatchLogs(batch.id).subscribe((logs) => {
        this.logs = [...logs];
      });
    }
  }
  onShow() {
    this.logs = [];
    this.loadFiles();
  }
  onGridReady(params) {
    params.api.sizeColumnsToFit();
  }

  loadErrorDetails(batchId: number) {
    const file = this.files.find(f => f.BatchId === batchId);
    if (file) {
      file.showErrors = !file.showErrors;
      if (file.showErrors && file.errors.length === 0) {
        this.inventoryService.getErrorDetails(batchId).subscribe((errors) => {
          file.errors = errors;
        });
      }
    }
  }

  exportLogsToExcel(logs: any) {
    const logsData = logs.map(log => ({
      JobId: log.batchId,
      Timestamp: new Date(log.timestamp).toLocaleString(),
      LogMessage: log.logMessage,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(logsData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Logs': worksheet },
      SheetNames: ['Logs']
    };

    // Export the file
    XLSX.writeFile(workbook, `Logs_${new Date().toISOString()}.xlsx`);
  }

}
