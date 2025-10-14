import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { GridApi, GridOptions } from 'ag-grid-community';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { SchematicPerforations } from '../../../common/model/schematic-perforations';
import { WellFeatures } from '../../../common/model/wellfeatures';
import { MessageService } from 'primeng/api';
import { NgxSpinnerService } from 'ngx-spinner';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { AuthService } from '../../../services';
import { CommonService } from '../../../services/common.service';
import { AccessControls } from '../../../common/constant';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-perforations-table-dialog',
  standalone:true,
  imports:[...PRIME_IMPORTS,
    ],
  templateUrl: './perforations-table-dialog.component.html',
  styleUrl: './perforations-table-dialog.component.scss',
})
export class PerforationsTableDialogComponent implements OnInit, OnDestroy {
  // Inputs and Outputs
  @Input() schematicId!: number;
  @Input() statusId!: number;
  @Input() displayPerforationTableDialog: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() zoneCountChanged = new EventEmitter<boolean>();
  @Input() set refresh(value: boolean) {
    if (value) {
      this.loadWellFeatures(); // Or call any specific refresh logic here
    }
  }

  // Grid-related variables
  perforationTableColumnDefs = [];
  rowHeight: number = 30;
  gridOptions: GridOptions;
  wellfeatures: WellFeatures[] = [];
  gridColumnApi: any;
  schematicPerforations: SchematicPerforations[] = [];
  public gridApi!: GridApi;
  isPerfomationTableHasChanged: boolean = false;
  schematic: Completionschematicheader;
  private _refresh = false;
  userDetail: any;
  private schematicSubscription: Subscription = new Subscription();
  constructor(
    private api: CompletionschematicService,
    private messageService: MessageService,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private commonService: CommonService
  ) {
    this.userDetail = this.authService.getUserDetail();

  }

  // Column Definitions for the AG Grid
  initializeColumnDefs() {
    const canEditDepth = this.authService.isFieldEditable('perforationDepth'); // now correct value
    this.perforationTableColumnDefs = [
      {
        headerName: 'Zone',
        field: 'zoneID',
        minWidth: 80,
        filter: false,
        sortable: true,
        editable: false,
      },
      {
        headerName: 'Description',
        field: 'perforationDescription',
        minWidth: 250,
        editable: false,
        sortable: true,
        filter: false,
      },
      //{ headerName: 'Depth (MD)', field: 'perforationDepth', editable: true, sortable: true, minWidth: 180, maxWidth: 200, filter: true },
      {
        headerName: 'Depth (MD)',
        field: 'perforationDepth',
        editable: canEditDepth,
        sortable: true,
        minWidth: 180,
        filter: true,
        valueFormatter: (params: any) => {
          return params.value !== undefined && params.value !== null
            ? parseFloat(params.value).toFixed(2)
            : '';
        },
        valueSetter: (params: any) => {
          const newValue = parseFloat(params.newValue);
          if (!isNaN(newValue)) {
            params.data[params.colDef.field] = newValue.toFixed(2);
            return true;
          }
          return false;
        },
      },
      /*{ headerName: 'Zone Length (MD)', field: 'lengthOfPZone', editable: false, sortable: false, minWidth: 180, maxWidth: 200, filter: false },*/
      {
        headerName: 'Zone Length (MD)',
        field: 'lengthOfPZone',
        editable: false,
        sortable: false,
        minWidth: 180,
        filter: false,
        //valueFormatter: (params: any) => {
        //  return params.value !== undefined ? params.value.toFixed(2) : ''; // Show 2 decimal places
        //}
        valueFormatter: (params: any) => {
          const rowIndex = params.node.rowIndex;
          if (rowIndex % 2 === 0) {
            return '';
          } else {
            return params.value !== undefined ? params.value.toFixed(2) : '';
          }
        },
      },
      //{ headerName: 'Perf to Perf Length', field: 'perfToPerfLength', editable: false, sortable: false, minWidth: 180, maxWidth: 200, filter: false },
      {
        headerName: 'Perf to Perf Length',
        field: 'perfToPerfLength',
        editable: false,
        sortable: false,
        minWidth: 180,
        filter: false,
        valueFormatter: (params: any) => {
          const rowIndex = params.node.rowIndex;
          if (rowIndex % 2 === 0) {
            return params.value !== undefined ? params.value.toFixed(2) : '';
          } else {
            return '';
          }
        },
      },
      {
        headerName: 'Screen Coverage',
        field: 'screenCoverage',
        editable: false,
        sortable: false,
        minWidth: 150,
        filter: false,
        valueFormatter: (params: any) => {
          return params.value !== undefined ? params.value.toFixed(2) : '';
        },
      },
      {
        headerName: 'Top Depth Outer',
        field: 'topDepthOuter',
        editable: false,
        sortable: false,
        minWidth: 180,
        filter: false,
        valueFormatter: (params: any) => {
          return params.value !== undefined ? params.value.toFixed(2) : '';
        },
      },
    ];
  }

  async ngOnInit() {
    // this.getUserDetails();
    await this.getUserDetails();
    this.initializeColumnDefs();
    //this.perforationTableColumnDefs = InitializeColumnDefs(ColDefTables.Perforations);
    this.loadWellFeatures();
  }

  ngOnDestroy() {
      this.schematicSubscription.unsubscribe();
    }
  /**
         *  it will get the user details from jwt token
         */
   getUserDetails() {
    let userAccess = this.authService.isAuthorized(AccessControls.SCHEMATIC_PERFORATIONS);
    this.commonService.setuserAccess(userAccess);
    // console.log(this.authService.isFieldEditable('perforationDepth'));
    
  }

  // --------------- Data Handling ----------------

  // Load well features from the API
  loadWellFeatures(): void {
    if (!this.schematicId) return;
    this.schematicSubscription = this.api.getWellFeaturesBySchematicId(this.schematicId).subscribe({
      next: (data: WellFeatures[]) => {
        // console.log(data, 'perfections');
        this.wellfeatures = data;
        const noOfZones = this.wellfeatures && this.wellfeatures.length > 0 ? this.wellfeatures[0].noOfZones : 2;
        // console.log(noOfZones);
        this.zoneCountChanged.emit(false);
        if (noOfZones >= 1) { // Check if noOfZones is greater than or equal to 1
          this.zoneCountChanged.emit(true);
        }
        this.getSchematicPerforations();
      },
      error: (err) => {
        this.wellfeatures = [];
        console.error('Error fetching well features', err);
        // this.zoneCountChanged.emit(false);
      },
    });
  }

  // Fetch schematic perforations data
  getSchematicPerforations() {
    // if (!this.schematicId && !this.wellfeatures) return;
    if (!this.schematicId) return;
    const noOfZones = this.wellfeatures?.[0]?.noOfZones ?? 2;

    this.schematicSubscription = this.api.getSchematicPerforations(this.schematicId, noOfZones).subscribe({
      next: (response: SchematicPerforations[]) => {
        //console.log(response);
        this.schematicPerforations = response;
        this.calculateZoneLength(); // Calculate the 'lengthOfPZone' after receiving the data
        if (this.gridApi) {
          this.gridApi.applyTransaction({ add: this.schematicPerforations });
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  // Calculate lengthOfPZone based on perforationDepth differences
  calculateZoneLength(): void {
    for (let i = 1; i < this.schematicPerforations.length; i++) {
      // Calculate lengthOfPZone based on perforationDepth difference
      const lengthOfPZone =
        this.schematicPerforations[i].perforationDepth -
        this.schematicPerforations[i - 1].perforationDepth;

      // Assign calculated lengthOfPZone value
      this.schematicPerforations[i].lengthOfPZone = lengthOfPZone;

      // Calculate and assign perfToPerfLength based on the same logic
      this.schematicPerforations[i].perfToPerfLength = lengthOfPZone;

      // New logic for screenCoverage: Update screenCoverage with perforationDepth - screenCoverage
      const perforationDepth =
        this.schematicPerforations[i - 1].perforationDepth;
      const currentScreenCoverage =
        this.schematicPerforations[i - 1].topDepthOuter;
      const newScreenCoverage = perforationDepth - currentScreenCoverage;
      //console.log(perforationDepth, currentScreenCoverage, newScreenCoverage)
      this.schematicPerforations[i - 1].screenCoverage = newScreenCoverage;
    }

    // After recalculation, update the grid rows (if the grid is initialized)
    if (this.gridApi) {
      this.gridApi.refreshCells({ force: true });
    }
  }

  // --------------- Event Handlers ----------------

  // Listen for changes in cell values
  onCellValueChanged(event: any): void {
    if (event.colDef.field === 'perforationDepth') {
      // Recalculate the zone length if perforationDepth is updated
      this.isPerfomationTableHasChanged = !this.isPerfomationTableHasChanged;
      this.calculateZoneLength();
    }
  }

  // On grid ready event to capture the grid API
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  // --------------- Save/Update ----------------

  // Save or update schematic perforations to the server
  saveOrUpdate() {
    const rowData: SchematicPerforations[] = [];

    this.gridApi.forEachNode((node) => {
      rowData.push(node.data);
    });

    this.schematicPerforations = rowData;

    //console.log('Grid Data:', rowData, this.schematicPerforations);

    this.schematicSubscription = this.api.upsertSchematicPerforations(this.schematicPerforations).subscribe({
      next: (response) => {
        this.spinner.show();
        //console.log(response);
        this.schematicPerforations = response;
        if (
          this.isPerfomationTableHasChanged &&
          (this.statusId == 2 || this.statusId == 3)
        ) {
          let payload: Completionschematicheader = {
            userIdModifiedBy: this.userDetail.uid,
            statusId: 1,
            schematicsID: this.schematicId,
            schematicsName: '',
            lease: '',
            wellName: '',
            wellLocation: '',
            chevronEngineer: '',
            chevronWBS: '',
            userIdCreatedBy: '',
          };

          this.schematic = payload;
          this.commonService.changeStatus(this.schematic);
          this.isPerfomationTableHasChanged =
            !this.isPerfomationTableHasChanged;
        }
        this.getSchematicPerforations();
      },
      error: (error) => {
        // console.log(error);
        console.error('Error updating perforations table', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred while updating  perforations table.',
        });
      },
      complete: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Perforations table has been successfully updated.',
        });
        // console.log("success"); //Present Toast Message instead of log
        this.onClose.emit();
        this.spinner.hide();
      },
    });
  }

  // Close the dialog
  closeDialog(): void {
    this.onClose.emit();
  }
}
