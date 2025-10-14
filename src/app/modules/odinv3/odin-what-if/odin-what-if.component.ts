import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { GridApi, GridOptions } from 'ag-grid-enterprise';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { WhatIfConfiguration } from '../../../common/constant';
import { SortOrder } from '../../../common/enum/common-enum';
import { CloneWhatIfWell, WellDetails } from '../../../common/model/WellDetails';
import { AuthService } from '../../../services';
import { OdinV2Service } from '../../../services/odinv2.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ConfirmationDialogComponent } from '../../common/confirmation-dialog/confirmation-dialog.component';
import { WhatIfRow } from '../../../common/model/odin-what-if-analysis';
import { IncludeExcludeCheckboxRendererComponent } from '../odin-custom-headers/custom-check-box.component';
import { SaveButtonRendererComponent } from '../odin-custom-headers/custom-save-button.component';

@Component({
  selector: 'app-odin-what-if',
  standalone:true,
      imports:[...PRIME_IMPORTS,
        ConfirmationDialogComponent,
        
      ],
  templateUrl: './odin-what-if.component.html',
  styleUrl: './odin-what-if.component.scss'
})


export class OdinWhatIfComponent implements OnInit, OnDestroy {

  // Inputs and Outputs

  @Input() displayWhatIFAnalysis: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Input() functionId: number;
  @Input() appId: number;
  @Output() setRunAnalysisButtonFlag = new EventEmitter<any>();
  @Output() selectedScenario = new EventEmitter<number>();
  @Input() isRunAnalysisEnabled: boolean;
  // Grid-related variables

  rowHeight: number = 30;
  gridOptions: GridOptions;
  gridColumnApi: any;
  public gridApi!: GridApi;
  gridConfig: any = {};
  loading: boolean = false;
  editWhatIfColumnDef = [];
  userDetail: any;
  globalFilter: string = '';
  editedRecords: WellDetails[] = [];
  clonedRecords:CloneWhatIfWell[]=[];
  searchSelected: string = '';
  rowOffset: number = 1;
  fetchNextRows: number = 10;
  totalRecords: number = 0;
  sortBy: string = "p10StartDate";
  sortDirection: string = SortOrder.ASC;
  selectedView: number = 0;
  whatIfList: Array<any> = [];
  isEdit: boolean=false;
  searchValue: string;
  whatIfConfigurationSetting=WhatIfConfiguration;
  tableDataEdited: WhatIfRow[] = [];
  editedIndexes: number[] = [];
  unsavedChanges: boolean;
  displayConfirmationComponentDialog:boolean=false;
  displayResetComponentDialog:boolean=false;
  includeOrExcludeList: any[] = [];
  duplicatedList: any[] = [];
  // Subscription to manage API call subscriptions and prevent memory leaks
  private odinWhatifSubscription: Subscription = new Subscription();
  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private odinV2Service: OdinV2Service,
    private sanitizer: DomSanitizer,
    private spinner: NgxSpinnerService) { }
  // Unsubscribe from all subscriptions to prevent memory leaks
   ngOnDestroy(): void {
    this.odinWhatifSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.initializeColumnDefs();
    this.userDetail = this.authService.getUserDetail();
    this.loadWhatIfList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes['displayWhatIFAnalysis'] && changes['displayWhatIFAnalysis'].currentValue === true) {
    //   this.reset();
    // }
  }
  // Column Definitions for the AG Grid
  initializeColumnDefs() {
    
    this.editWhatIfColumnDef = [
      { headerName: 'Well Number', field: 'wellNumber', minWidth: 80, filter: false, sortable: true, editable: false },
      { headerName: 'Well Name', field: 'wellName', minWidth: 80, filter: false, sortable: true, editable: false },
      { headerName: 'Rig', field: 'rig', minWidth: 80, filter: false, sortable: true, editable: false },
      {
        headerName: 'P10 Start Date',
        field: 'p10StartDate',
        minWidth: 150,
        editable: true,
        sortable: true,
        filter: false,
        cellEditor: 'agDateCellEditor',  // Use AG Grid's built-in date picker (calendar)
        cellEditorParams: {
          format: 'MM/dd/yyyy',  // Date format for the calendar (optional)
        },
        valueGetter: (params) => {
          // Log value to debug
          //console.log("valueGetter: ", params.data.p10StartDate);

          // Ensure p10StartDate is either null or valid
          if (params.data.p10StartDate === undefined || params.data.p10StartDate === null) {
            return null;  // Return null if there is no value
          }

          // If there is a valid date, return it
          return params.data.p10StartDate;  // Returning Date object should be fine here
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
        }
      },
      {
        headerName: 'P50 Start Date',
        field: 'p50StartDate',
        minWidth: 150,
        editable: true,
        sortable: true,
        filter: false,
        cellEditor: 'agDateCellEditor',
        cellEditorParams: {
          format: 'MM/dd/yyyy',
        },
        valueGetter: (params) => {
          return params.data.p50StartDate !== undefined ? params.data.p50StartDate : null;
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
        }
      },
      {
        headerName: 'Include/Exclude',
        field: 'includeOrExclude',
        minWidth: 120,
        filter: false,
        sortable: true,
        editable: false,
        cellRenderer: IncludeExcludeCheckboxRendererComponent,
        cellRendererParams: {}
      },
      // {
      //   headerName: 'Duplicated',
      //   field: 'duplicated',
      //   minWidth: 120,
      //   filter: false,
      //   sortable: true,
      //   editable: true,
      //   cellEditor: 'agSelectCellEditor',
      //   cellEditorParams: {
      //     values: ['Yes', 'No']
      //   }
      // }
      {
        headerName: 'Actions',
        field: '',
        minWidth: 120,
        filter: false,
        sortable: true,
        editable: false,
        cellRenderer: SaveButtonRendererComponent
       
      }
  ];
  }
  /**
  * get all what if wells list
  *
  */
  loadWhatIfList() {
    this.gridConfig.loading = true;
      let body = {
        SearchTerms: this.searchSelected,
        pageNumber: this.rowOffset,
        rowsPerPage: this.fetchNextRows,
        SortBy: this.sortBy,
        SortDescending: this.sortDirection == SortOrder.DESC ? true : false,
        SearchConditions: []
      };
  
      let params = {
        // 'wellMaterialId': this.wellMaterialId
      };
  
     
      this.odinWhatifSubscription = this.odinV2Service.getOdinWhatIfDataSearch(body, params,this.functionId,this.selectedView)
        .subscribe({
          next: (response: any) => {
            this.gridConfig.loading = false;
           
            if (response && response.success && response.data && response.data.length) {
              response.data?.forEach(element => {
                element.p10StartDate && (element.p10StartDate = new Date(element.p10StartDate));
                element.p50StartDate && (element.p50StartDate = new Date(element.p50StartDate));
              });
              this.whatIfList = response.data;
              this.totalRecords = response.data.length;
            }
            else {
              this.whatIfList = [];
              this.totalRecords = 0;
            }
          },
          error: () => {
            this.gridConfig.loading = false;
            this.whatIfList = [];
            this.totalRecords = 0;
          }
        });
    }
  /**
  * get latest edit what if wells
  *
  */
    reset() {
      this.gridConfig.loading = true;
      this.searchValue = '';
      this.rowOffset = 1;

      this.odinWhatifSubscription = this.odinV2Service.resetOdinWhatIfWells(this.functionId,this.selectedView)
        .subscribe({
          next: (response: any) => {
            this.gridConfig.loading = false;
            if (response && response.success) {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'The reset has been successfully done.' });
              this.displayResetComponentDialog=false;
              response.data?.forEach(element => {
                element.p10StartDate && (element.p10StartDate = new Date(element.p10StartDate));
                element.p50StartDate && (element.p50StartDate = new Date(element.p50StartDate));
              });
              this.whatIfList = response.data;
              this.totalRecords = response.data.length;
            }
            else {
              this.messageService.add({ severity: 'error', summary: 'Failed', detail: response.message });
            }
          },
          error: () => {
            this.gridConfig.loading = false;
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Changes failed to reset.' });
          }
        });
    }

  // On grid ready event to capture the grid API
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  onCellValueChanged(event: any): void {

    const rowNode = event.node.data;
    const selectedRowIndex=event.rowIndex;
    const formatDate = (date: any) => {
      if (!date) return null;
      const newDate = new Date(date);
      return `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}T00:00:00`;
    };
    rowNode.p10StartDate = formatDate(rowNode.p10StartDate);
    rowNode.p50StartDate = formatDate(rowNode.p50StartDate);

    //const existingRecord = this.editedRecords.find((rec) => rec.id === rowNode.id);
    //if (!existingRecord) {
      if(rowNode.canDelete){
        this.onRowReplace(rowNode,selectedRowIndex);
      }
      else{
        this.editedRecords.push(rowNode);

      }
    //}

    this.isEdit = true;
  }

 
  onRowReplace(updatedNodeItem: any,rowIndex:number) {
    
      const index = this.clonedRecords.findIndex(item => item.clonedIndex ===updatedNodeItem.clonedIndex);
      updatedNodeItem['edition']=this.selectedView;
      updatedNodeItem['userIdCreatedBy']=+this.userDetail.uid;
      this.clonedRecords[index] = updatedNodeItem;
    
  }
  
  refreshGrid() {
    this.loadWhatIfList();
  }
 
   //Global Serch
   onSearch(event: Event): void {
    const searchedWellHeaders = (event.target as HTMLInputElement).value.toLowerCase();
    this.globalFilter = searchedWellHeaders; // Update the quick filter text
  }

  closeDialog(): void {
    this.editedRecords = [];
    this.clonedRecords=[];
    this.isEdit = false;
    this.selectedScenario.emit(this.selectedView);
    this.onClose.emit();
    this.displayWhatIFAnalysis=false;
  }
  onViewSelectionChange(){
    this.loadWhatIfList();
  }

  runWhatIfAnalysis() {
    
    if (this.tableDataEdited.length > 0) {
      this.onClickSave(true);
    } else {
      this.clonedRecords=[];
      this.selectedScenario.emit(this.selectedView);
      this.setRunAnalysisButtonFlag.emit(true);
     
      this.onClose.emit();
    }
  }
  onClickSave(isFromRunWhatIfAnalysis?: boolean) {
    
      this.gridConfig.loading = true;
      this.searchValue = '';
      this.searchSelected = ''
      // this.setRunAnalysisButtonFlag.emit(isFromRunWhatIfAnalysis);
      //this.selectedScenario.emit(this.selectedView);
      if(this.clonedRecords.length){
        this.cloneWhatIfWell();
      }
      else{
        this.odinWhatifSubscription = this.odinV2Service.editOdinWhatIfWells(this.editedRecords,this.functionId,this.selectedView)
        .subscribe({
          next: (response: any) => {
            this.gridConfig.loading = false;
            if (response && response.success) {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Your changes have been successfully updated.' });
              if (isFromRunWhatIfAnalysis) {
                this.setRunAnalysisButtonFlag.emit(isFromRunWhatIfAnalysis);
                this.selectedScenario.emit(this.selectedView);
                this.onClose.emit();
              } else
                this.resetWhatIfGrid(true);
            }
            else {
              this.messageService.add({ severity: 'error', summary: 'Failed', detail: response.message });
            }
          },
          error: () => {
            this.gridConfig.loading = false;
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Changes failed to save' });
          }
        });
        this.editedRecords=[];
        this.isEdit=!this.isEdit;
        this.displayConfirmationComponentDialog=false;
      }

    }
    confirmSubmit(){
      this.displayConfirmationComponentDialog=true;
    }
    resetWhatIfGrid(isSave?: any) {
      this.editedIndexes = [];
      this.editedRecords = [];
      this.clonedRecords=[];
      this.unsavedChanges = false;
      this.isEdit = false;
      if (isSave)
        this.loadWhatIfList();
      else
        this.onClose.emit();
    }

    onContinueSaveConfiguration() {
      this.displayConfirmationComponentDialog = false;      
    }
    onRowSave(rowData: any,idx :number) {
      this.isEdit=true;
     
     
      const cloneRecord: CloneWhatIfWell = {
        id: rowData.id,
        edition: this.selectedView,
        p10StartDate: new Date(rowData.p10StartDate),  // Make sure it's a Date
        p50StartDate: new Date(rowData.p50StartDate),  // Same here
        includeOrExclude: rowData.includeOrExclude,
        duplicated: "No",
        userIdCreatedBy: +this.userDetail.uid,
        duplicity:rowData.duplicity,
        clonedIndex:idx

      };
      
      this.clonedRecords.push(cloneRecord);
      this.totalRecords=this.totalRecords+1;
     
    }
    
 cloneWhatIfWell(isFromRunWhatIfAnalysis?: boolean){
  this.gridConfig.loading = true;
  
  this.odinWhatifSubscription = this.odinV2Service.cloneOdinWhatIfWells(this.clonedRecords)
  .subscribe({
    next: (response: any) => {
      this.gridConfig.loading = false;
      if (response && response===1) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'What if well have been successfully cloned.' });
        if (isFromRunWhatIfAnalysis) {
          this.loadWhatIfList();
          this.setRunAnalysisButtonFlag.emit(isFromRunWhatIfAnalysis);
          this.selectedScenario.emit(this.selectedView);
          this.onClose.emit();
        } else
          this.resetWhatIfGrid(true);
      }
      else {
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: response.message });
      }
    },
    error: () => {
      this.gridConfig.loading = false;
      this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Changes failed to save' });
    }
  });
  this.clonedRecords=[];
  this.isEdit=!this.isEdit;
  this.displayConfirmationComponentDialog=false;
 }
 onRowRemove(rowData:any,idx :number){
  
  this.totalRecords=this.totalRecords-1;
  const index = this.clonedRecords.findIndex(item => item.id === rowData.id);
  if (index !== -1) {
    this.clonedRecords.splice(index, 1);
  }
  this.isEdit= this.clonedRecords.length >0 ?true :false;
 }

 changeView(){
  this.onViewSelectionChange();
 }
}