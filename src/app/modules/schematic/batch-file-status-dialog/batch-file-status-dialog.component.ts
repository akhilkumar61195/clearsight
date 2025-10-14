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




import { BatchJobWithLogs } from "../../../common/model/batch-job-with-logs";
import { CompletionschematicService } from "../../../services/completionschematic.service";
import { BulkuploadService } from "../../../services/bulkupload.service";
import { PRIME_IMPORTS } from "../../../shared/prime-imports";
@Component({
  selector: 'app-batch-file-status-dialog',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './batch-file-status-dialog.component.html',
  styleUrl: './batch-file-status-dialog.component.scss',
})


export class BatchFileStatusDialogComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  @Input() displayBatchStatusDialog: boolean = false;
  @Input() schematicId: number;
  selectedView: number = 1;

  viewOptions = [{ label: 'Depth Table', value: 1 },
  { label: 'Control Line Clamp', value: 2 }];

  public columnDefs: ColDef[] = [
    { headerName: 'Job Id', field: "batchJobId", maxWidth: 110, cellRenderer: "agGroupCellRenderer" },
    { field: "taskType", filter: true },
    { field: "fileName" },
    { field: "processStatus", maxWidth: 160 },
    {
      field: "transformationStatus",
      cellStyle: (params) => {
        //console.log(params);
        if (params.value && params.value.toLowerCase().includes("warning")) {
          return { color: "rgb(229, 96, 31)" };
        }
        return { color: "rgba(111,191,54,1)" }
      },
    },
    { headerName: 'Created By', field: "createdBy", maxWidth: 150, },
    { headerName: 'Created Date', field: "createdDate", valueFormatter: (params) => this.dateFormatter(params) }
  ];

  public defaultColDef: ColDef = {
    flex: 1,
    suppressHeaderMenuButton: true,
  };

  public detailCellRendererParams: any = {
    detailGridOptions: {
      columnDefs: [
        { headerName: 'Job Id', field: "batchJobId", maxWidth: 110 },
        { field: "timestamp", valueFormatter: (params) => this.formatTimestamp(params.value) },
        { field: "logMessage", minWidth: 250 },
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
    this.bulkuploadService.getBatchLogs('depthtable,clamps', schematicId).subscribe({
      next: (data: BatchJobWithLogs[]) => {
        //console.log('Batch logs:', data);
        this.rowData = data;
      },
      error: (err) => {
        console.error('Error fetching batch logs:', err);
      },
    });
  }

  closeBatch() {
    this.onClose.emit();

  }

}

