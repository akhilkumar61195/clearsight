import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { GridApi, GridOptions } from 'ag-grid-community';
import { WellService } from '../../../services/well.service';
import { WellDetails } from '../../../common/model/WellDetails';
import { WellTypesInfo } from '../../../common/model/wellTypes';
import { AuthService } from '../../../services';
import { MessageService } from 'primeng/api';
import { CommonService } from '../../../services/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { OdinV2Service } from '../../../services/odinv2.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PlanningEnginner } from '../../../common/model/planningEngineer';
import { EditWellHeadstoreService } from '../../odinv3/services/editwellheadbuilder.service';
import { UpdateMaterialDemandRequest } from '../../../common/model/update-material-demand-request';
import { CloneThorDrillingWell_Other, ThorDrillingWellCloneRequest } from '../../../common/model/ThorDrillingWellCloneRequest';
import { ThorService } from '../../../services/thor.service';
import { LookupsService } from '../../../services/lookups.service';
import { WellInfo } from '../../../common/model/well-info';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { CustomDialogComponent } from '../custom-dialog/custom-dialog.component';
@Component({
  selector: 'app-view-wellheaders',
  standalone: true,
  imports: [...PRIME_IMPORTS,CustomDialogComponent],
  templateUrl: './view-wellheaders.component.html',
  styleUrl: './view-wellheaders.component.scss'
})
export class ViewWellheadersComponent {

  // Inputs and Outputs

  @Input() displayViewWellHeaders: boolean = false;
  // @Input() isCompletions: boolean = true;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<void>();
  @Input() wellHeadersData: any;

  // Grid-related variables
  perforationTableColumnDefs = [];
  rowHeight: number = 30;
  gridOptions: GridOptions;
  gridColumnApi: any;
  public gridApi!: GridApi;
  gridConfig: any = {};
  loading: boolean = false;
  wellHaedersColumnDefs = [];
  wellDetails: WellDetails[] = [];
  wellTypes: WellTypesInfo[] = [];
  changedRows: WellDetails[] = [];
  wellmaterials: any[] = [];
  odinData: any;
  userDetail: any;
  plantList: any[] | undefined;
  globalFilter: string = '';
  searchText: string = '';
  @Input() functionId: number;
  @Input() appId: number;
  planningEnginnersList: PlanningEnginner[] = [];
  editedRecords: WellDetails[] = [];
  isEdit = false;
  displayConfirmationComponentDialog: boolean = false;
  displayExportToThorDialog: boolean = false;
  displaycloneHeaderDialog: boolean = false;
  dialogContent: SafeHtml = 'Are you sure want to Delete ?';
  passRowdata: any;
  selectedWellHeaderData: any;
  projects: any[] | undefined;
  displayDeleteComponentDialog: boolean = false;
  isClone: boolean = false;
  materialDemandPayload: UpdateMaterialDemandRequest[] = []; // declare update material modelas a array
  selectedRows: any;
  existingWellName: any;
  selectedWellName: any;
  wellCoordinatorData: any;
  @ViewChild('selectWellComp') selectWellComp: any;

  constructor(private wellService: WellService,
    private messageService: MessageService,
    private commonService: CommonService,
    private authService: AuthService,
    private lookupsService: LookupsService,
    private odinV2Service: OdinV2Service,
    private sanitizer: DomSanitizer,
    private spinner: NgxSpinnerService,
    private store: EditWellHeadstoreService,
    private thorService: ThorService) { }


  // Column Definitions for the AG Grid
  initializeColumnDefs() {

    this.wellHaedersColumnDefs = [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        headerName: '',
        maxWidth: 50,
        editable: false,
        filter: false,
      },
      { headerName: 'Well Name', field: 'wellName', minWidth: 120, filter: true, sortable: true, editable: false },
      {
        headerName: 'P10 Start Date',
        field: 'p10startDate',
        minWidth: 150,
        maxWidth: 200,
        editable: false,
        sortable: true,
        filter: true,
        valueGetter: (params) => {
          // Log value to debug
          //console.log("valueGetter: ", params.data.p10startDate);

          // Ensure p10startDate is either null or valid
          if (params.data.p10startDate === undefined || params.data.p10startDate === null) {
            return null;  // Return null if there is no value
          }

          // If there is a valid date, return it
          return params.data.p10startDate;  // Returning Date object should be fine here
        },
        valueFormatter: (params) => {
          const date = new Date(params.value);

          // Check if the value is a valid date
          if (!params.value || isNaN(date.getTime())) {
            return '';  // Return empty string for invalid or null date
          }

          // Format valid date as MM/dd/yyyy
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        },
      },
      {
        headerName: 'P50 Start Date',
        field: 'p50startDate',
        minWidth: 150,
        maxWidth: 200,
        editable: false,
        sortable: true,
        filter: true,
        valueGetter: (params) => {
          return params.data.p50startDate !== undefined ? params.data.p50startDate : null;
        },
        valueFormatter: (params) => {
          const date = new Date(params.value);
          if (!params.value || isNaN(date.getTime())) {
            return '';
          }

          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        },
      },
      {
        headerName: 'Project',
        field: 'projectName', // Stores projectName but displays project name
        minWidth: 150,
        maxWidth: 200,
        editable: false,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Plant Code',
        field: 'plantCode', // change to plantCode
        minWidth: 120,
        maxWidth: 150,
        filter: true,
        sortable: true,
        editable: false,
      },
      { headerName: 'WBS', field: 'wbs', minWidth: 120, maxWidth: 150, editable: false, sortable: true, filter: false },
      {
        headerName: 'Well Type',
        field: 'wellType',
        minWidth: 150,
        maxWidth: 200,
        editable: false,
        sortable: true, filter: true,
      },
      // added a column wellhead Kit//
      {
        headerName: 'Wellhead Kit',
        field: 'wellheadKitType',
        minWidth: 180,
        maxWidth: 220,
        editable: false,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Planning Engineer',
        field: 'planningEngineer',
        minWidth: 200,
        maxWidth: 250,
        editable: false,
        sortable: true,
        filter: true,

      },
      { headerName: 'RIG', field: 'rig', minWidth: 100, maxWidth: 120, editable: false, sortable: true, filter: false },
      { headerName: 'IsExported', field: 'isExported', minWidth: 100, maxWidth: 120, hide: true }
    ];
  }

  ngOnInit(): void {
    // loading the store loadKits 
    this.loadKits();
    this.userDetail = this.authService.getUserDetail();
  }
  
  /**
  * get all well  list
  *
  */
  loadWellData() {
    this.gridConfig.loading = true;
    this.wellService.getAllWells(this.appId, this.functionId).subscribe({
      next: (resp: any) => {        
        this.gridConfig.loading = false;
        this.loading = false;
        if (resp) {
          this.spinner.show();
          this.wellDetails = resp.filter((well: any) => well.isExported === false);
          this.initializeColumnDefs();
          this.spinner.hide();
        }
        else {
          this.gridConfig.loading = false;
        }
      },
      error: () => {
        this.gridConfig.loading = false;
        this.spinner.hide();
      }
    });
  }

  //  load kits method
  loadKits() {
    this.store.loadKits();
  }

  // On grid ready event to capture the grid API
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }
  //  onrow click method
  onRowClicked() {
    this.selectedRows = this.gridApi.getSelectedRows();
    this.selectedWellName = this.selectedRows[0].wellName;
    // console.log(this.selectedRows);
  }
  //  to display the confirm message
  onContinue() {
    this.displayConfirmationComponentDialog = true;
    this.loadWellDetails();
    this.payloadWellDetails(); // This sets existingWellDetails
  }

  // Added close dialog //
  closeDialog() {
    this.onClose.emit();
  }
  refreshGrid() {
    this.loadWellData();
  }
  //Global Serch
  // onSearch(event: Event): void {
  //   const searchedWellHeaders = (event.target as HTMLInputElement).value.toLowerCase();
  //   this.globalFilter = searchedWellHeaders; // Update the quick filter text
  // }

  onSearch(): void {
    this.globalFilter = this.searchText.toLowerCase();
  }

  loadWellDetails() {
    const filerWell = this.commonService.getWellDetailsFilterData();
    this.lookupsService
      .getWellsById(filerWell.id, filerWell.appId, filerWell.functionId)
      .subscribe({
        next: (resp: any) => {
          if (resp) {
            this.wellCoordinatorData = resp;
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load well details.',
          });
        },
      });
  }


  payloadWellDetails(): CloneThorDrillingWell_Other {
    const wellDetails = this.commonService.getWellDetailsFilterData();
    // console.log(wellDetails);      
    this.existingWellName = wellDetails.wellName;
    return {
      fromWellId: wellDetails.id,
      userId: this.userDetail.uid,
      toWellId: this.selectedRows[0].id,
    };
  }

  //  submit payload to api
  submitOtherWells() {
    const payload = this.payloadWellDetails();
    // console.log(payload);

    if (!payload) {
      return; // form was invalid
    }

    this.thorService.cloneThorDrillingWell_Others(payload).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Other Well cloned successfully.' });
        this.onSave.emit();
        this.displayConfirmationComponentDialog = false;
        this.onClose.emit();
        this.commonService.triggerRefreshSelectWell(); //to refresh the select well // 

      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to clone well.' });
        this.displayConfirmationComponentDialog = false;

      }
    });
  }

  // Close the dialog
  closeConfirmationDialog() {
    this.displayConfirmationComponentDialog = false;
  }

  resetFilter() {
    this.searchText = '';
  this.globalFilter = '';
  }

}
