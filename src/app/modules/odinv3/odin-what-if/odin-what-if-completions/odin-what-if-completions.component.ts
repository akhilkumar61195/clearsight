import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation } from '@angular/core';
import { defaultRowNumber, paginationRowDD, WhatIfConfiguration } from '../../../../common/constant';
import { SortOrder } from '../../../../common/enum/common-enum';
import moment from 'moment';
import { MessageService } from 'primeng/api';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { OdinV2Service } from '../../../../services/odinv2.service';
import { ConfirmationDialogComponent } from '../../../common/confirmation-dialog/confirmation-dialog.component';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { WhatIfCol, WhatIfRow } from '../../../../common/model/odin-what-if-analysis';
@Component({
  selector: 'app-odin-what-if-completions',
  standalone:true,
  imports:[...PRIME_IMPORTS,
      ConfirmationDialogComponent
      ],
  templateUrl: './odin-what-if-completions.component.html',
  styleUrl: './odin-what-if-completions.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class OdinWhatIfCompletionsComponent implements AfterViewInit, OnDestroy{
 @Input() isRunAnalysisEnabled: boolean;
  @Output() setRunAnalysisButtonFlag = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();
  visible: boolean = true;
  loading: boolean = true;
  rowOffset: number = 1;
  fetchNextRows: number = 10;
  totalRecords: number = 0;
  rows: number = defaultRowNumber;
  first: number = 0;
  sortBy: string = "p10StartDate";
  sortDirection: string = SortOrder.ASC;
  whatIfList: WhatIfRow[] = [];
  paginationRowDD = paginationRowDD;
  scrollHeight: string = "0px";
  filterHeaderHeight: number = 446;
  whatIfCols: WhatIfCol[] = [];
  searchValue: string;
  isTyping: boolean = false;
  searchSelected: string = '';
  typeInterval: ReturnType<typeof setTimeout> | null = null;
  editedIndexes: number[] = [];
  tableDataEdited: WhatIfRow[] = [];
  unsavedChanges: boolean = false;
  includeOrExcludeList: string[] = [];
  duplicatedList: string[] = [];
  Breakpoints = Breakpoints;
  currentBreakpoint: string = '';
  displayConfirmationComponentDialog:boolean=false;
  selectedView: number = 0;
  whatIfConfigurationSetting=WhatIfConfiguration;
  readonly breakpoint$ = this.breakpointObserver
    .observe([
      Breakpoints.Large,
      Breakpoints.Medium,
      Breakpoints.Small,
      '(min-width: 500px)',
    ])
    .pipe(distinctUntilChanged());

    // Subscription to manage API call subscriptions and prevent memory leaks
    private whatIfSubscription: Subscription = new Subscription();

  constructor(private element: ElementRef,
    private odinV2Service: OdinV2Service,
    private breakpointObserver: BreakpointObserver, private messageService: MessageService) {
    this.scrollHeight = (window.innerHeight - this.filterHeaderHeight) + "px";
  }

  // Unsubscribe from all subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    this.whatIfSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.includeOrExcludeList = ['Include', 'Exclude'];
    this.duplicatedList = ['Yes', 'No'];
    this.getOdinGridFields();
  }

  getOdinGridFields() {
    this.whatIfCols = [
      {
        field: 'id',
        header: '#',
        width: '80px',
        headerColor: '#EDEDEE',
        isEditable: false,
      },
      {
        field: 'wellName',
        header: 'Well Name',
        width: '200px',
        headerColor: '#EDEDEE',
        isEditable: false,
      },
      {
        field: 'rig',
        header: 'Rig',
        width: '150px',
        headerColor: '#EDEDEE',
        isEditable: false,
      },
      {
        field: 'p10StartDate',
        header: 'P10 Start Date',
        width: '120px',
        headerColor: '#EDEDEE',
        isEditable: true,
      },
      {
        field: 'p50StartDate',
        header: 'P50 Start Date',
        width: '120px',
        headerColor: '#EDEDEE',
        isEditable: true,
      },
      {
        field: 'includeOrExclude',
        header: 'Include/Exclude',
        width: '135px',
        headerColor: '#EDEDEE',
        isEditable: true,
      },
      {
        field: 'duplicated',
        header: 'Duplicated',
        width: '150px',
        headerColor: '#EDEDEE',
        isEditable: true,
      }
    ];
    this.getWhatIfList();
  }

  ngAfterViewInit(): void {
    const flexScrollDiv = document.getElementsByClassName('p-datatable-flex-scrollable');
    
    if (flexScrollDiv.length > 0) {
      let scrollHeight: any = document.getElementsByClassName('p-datatable-flex-scrollable')[(flexScrollDiv.length == 1 ? 0 : 1)];
      scrollHeight.style = 'height : calc(100% - 160px)';
    }
  }
    getWhatIfList() {
      this.loading = true;
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
  
      this.loading = true;
      this.whatIfSubscription = this.odinV2Service.getOdinWhatIfDataSearch(body, params,2,this.selectedView)
        .subscribe({
          next: (response: any) => {
            this.loading = false;
            this.element.nativeElement.querySelector(".p-datatable-wrapper").classList.add("gridWrapperWhatIf");
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
            this.loading = false;
            this.whatIfList = [];
            this.totalRecords = 0;
          }
        });
    }
  
    onSearchChange(searchText: string) {
      this.isTyping = true;
  
      clearTimeout(this.typeInterval);
  
      this.typeInterval = setTimeout(() => {
        if (this.searchSelected == searchText && searchText == null) return;
        else if (this.searchSelected != searchText && searchText == '') {
          this.searchSelected = searchText;
          //set page to 1
          this.rowOffset = 1;
          this.getWhatIfList();
        }
  
        if (searchText.length > 0) {
          this.searchSelected = searchText;
          //set page to 1
          this.rowOffset = 1;
          this.getWhatIfList();
        }
        this.isTyping = false;
      }, 500);
    }
  
    updateRowData(index: number) {
      let isThere = this.editedIndexes.find((element) => element == index);
      if (isThere == undefined) {
        this.editedIndexes.push(index);
      }
      this.tableDataEdited = [];
      this.editedIndexes.forEach(element => {
        this.tableDataEdited.push(this.whatIfList[element]);
      });
    }
  
    resetWhatIfGrid(isSave?: any) {
      this.editedIndexes = [];
      this.tableDataEdited = [];
      this.unsavedChanges = false;
      if (isSave)
        this.getWhatIfList();
      else
        this.onClose.emit();
    }
  
    onClickSave(isFromRunWhatIfAnalysis?: boolean) {
      this.searchValue = '';
      this.searchSelected = ''
  
      this.tableDataEdited = this.tableDataEdited.map((x) => {
        if (x.p10StartDate) {
          x.p10StartDate =
            moment(x.p10StartDate).local().format("YYYY-MM-DDTHH:mm:ss.000") + 'Z';
        }
  
        if (x.p50StartDate) {
          x.p50StartDate =
            moment(x.p50StartDate).local().format("YYYY-MM-DDTHH:mm:ss.000") + 'Z';
        }
        return x;
      });
      this.setRunAnalysisButtonFlag.emit(true);
  
      this.whatIfSubscription = this.odinV2Service.editOdinWhatIfWells(this.tableDataEdited,2,this.selectedView)
        .subscribe({
          next: (response: any) => {
            if (response && response.success) {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Your changes have been successfully updated.' });
              if (isFromRunWhatIfAnalysis) {
                this.setRunAnalysisButtonFlag.emit(true);
                this.onClose.emit();
              } else
                this.resetWhatIfGrid(true);
            }
            else {
              this.messageService.add({ severity: 'error', summary: 'Failed', detail: response.message });
            }
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Changes failed to save' });
          }
        });
        this.displayConfirmationComponentDialog=false;
    }
    confirmSubmit(){
    this.displayConfirmationComponentDialog=true;
  }
    runWhatIfAnalysis() {
      if (this.tableDataEdited.length > 0) {
        this.onClickSave(true);
      } else {
        this.setRunAnalysisButtonFlag.emit(true);
        this.onClose.emit();
      }
    }
  
    reset() {
      this.searchValue = '';
      this.rowOffset = 1;
      this.editedIndexes = [];
      this.tableDataEdited = [];
      this.unsavedChanges = false;
      this.whatIfSubscription = this.odinV2Service.resetOdinWhatIfWells(2,this.selectedView)
      .subscribe({
        next: (response: any) => {
          if (response && response.success) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'The reset has been successfully done.' });
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
          this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Changes failed to reset.' });
        }
      });
    }
    onViewSelectionChange(){
      this.getWhatIfList();
    }
}
