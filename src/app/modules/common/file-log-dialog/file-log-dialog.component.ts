import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AgGridAngular } from "ag-grid-angular";
import {
  ClientSideRowModelModule,
  ColDef,
  FirstDataRenderedEvent,
  GridApi,
  GridReadyEvent,
  IDetailCellRendererParams,
  SizeColumnsToFitGridStrategy,
  ModuleRegistry,
} from "ag-grid-community";
import {
  ColumnsToolPanelModule,
  MasterDetailModule,
} from "ag-grid-enterprise";



import { BatchJobWithLogs } from "../../../common/model/batch-job-with-logs";
import { CompletionschematicService } from "../../../services/completionschematic.service";
import { BulkuploadService } from "../../../services/bulkupload.service";
import { PRIME_IMPORTS } from "../../../shared/prime-imports";
@Component({
  selector: 'app-file-log-status-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './file-log-dialog.component.html',
  styleUrl: './file-log-dialog.component.scss',
})


export class FileStatusDialogComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  @Input() displayBatchStatusDialog: boolean = false;
  @Input() schematicId: number; // schematic id for schematic case we will get but in other casse it will be zero
  @Input() taskType:string; // it will get the view status record on the basis of selected task like it's depth table , mdl completion etc.
  selectedView: number = 1;

  viewOptions = [{ label: 'Depth Table', value: 1 },
  { label: 'Control Line Clamp', value: 2 }];

  public columnDefs: ColDef[] = [
    { headerName: 'Job Id', field: "batchJobId", width: 150, suppressSizeToFit: true, cellRenderer: "agGroupCellRenderer" },
    { field: "taskType", width: 120, filter: true, suppressSizeToFit: true, },
    { field: "fileName", width: 120, suppressSizeToFit: true, },
    { field: "processStatus", suppressSizeToFit: true, },
    {
      field: "transformationStatus",
      //here showing color using file status
      cellStyle: (params) => {
        //console.log(params);
        if (params.value && params.value.toLowerCase().includes("warning")) {
          return { color: "rgb(229, 96, 31)" };
        }
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
        if (params.value && (params.value.includes('Validation') || params.value.includes('Validated'))) {
          return { color: 'blue' };
        }
        
        return { color: "rgba(111,191,54,1)" }
      },
    },
    { headerName: 'Created By', field: "createdBy", width: 120, suppressSizeToFit: true, },
    { headerName: 'Created Date', field: "createdDate", width: 120,suppressSizeToFit: true, valueFormatter: (params) => this.dateFormatter(params) }
  ];

  public defaultColDef: ColDef = {
    flex: 1,
    suppressHeaderMenuButton: true,
  };

  public detailCellRendererParams: any = {
    detailGridOptions: {
      columnDefs: [
        { headerName: 'Job Id', field: "batchJobId", width: 110,suppressSizeToFit: true, },
        { field: "timestamp", width: 120,suppressSizeToFit: true, valueFormatter: (params) => this.formatTimestamp(params.value) },
        { field: "logMessage", width: 120, suppressSizeToFit: true, },
      ],
      defaultColDef: {
        flex: 1,
      },
    },
    getDetailRowData: (params) => {
      //params.successCallback([{id: 9999, batchJobId: 31, timestamp: '2025-03-12T13:48:46.647', logMessage: 'Test Custom Array'}]);
      //console.log(params.data.batchFileLogs);
      params.successCallback(params.data.batchFileLogs);
    },
  } as IDetailCellRendererParams<BatchJobWithLogs>;
  public rowData: any[] = [];
  gridApi: any;
  constructor(private http: HttpClient,
    private completionSchematicService: CompletionschematicService,
    private bulkuploadService: BulkuploadService
  ) { }

  ngOnInit() {
  }
  /**
 * Handles the view selection change event.
 * Updates the `selectedView` property based on the user's selection.
 * This determines which view (e.g., Depth Table or Control Line Clamp) is displayed in the dialog.
 * 
 * @param event The event object containing the selected view value.
 */
  onViewSelectionChange(event: any) {
    this.selectedView = event.value;
  }

  dateFormatter(params) {
    return new Date(params.value).toLocaleDateString('en-US');
  }

  onFirstDataRendered(params: FirstDataRenderedEvent) {
    // setTimeout(() => {
    //   params.api.getDisplayedRowAtIndex(0)?.setExpanded(true);
    // }, 0);
  }

  autoSizeStrategy: SizeColumnsToFitGridStrategy = {
    type: 'fitGridWidth',
  };

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  onGridReady(params: GridReadyEvent<BatchJobWithLogs>) {
    const schematicId = this.schematicId;
     this.gridApi = params.api;
     this.gridApi.showLoadingOverlay(); // showingn ag grid built-in loader

    // passing task type dynamically and getting it's from respective component as a input
    this.bulkuploadService.getBatchLogs(this.taskType, schematicId).subscribe({
      next: (data: BatchJobWithLogs[]) => {
        //console.log('Batch logs:', data);
        this.gridApi.hideOverlay(); // hiding ag grid built-in loader

        this.rowData = data;
      },
      error: (err) => {
        this.gridApi.hideOverlay();

        console.error('Error fetching batch logs:', err);
      },
    });
  }

  closeBatch() {
    this.onClose.emit();

  }

}

