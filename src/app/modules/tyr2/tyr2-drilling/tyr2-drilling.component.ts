import {
  ChangeDetectorRef,
  Component,
  effect,
  OnDestroy,
  OnInit,
  ViewChild,
  WritableSignal
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  GridApi,
  SideBarDef
} from 'ag-grid-community';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Observable, Subscription } from 'rxjs';
import { AccessControls, thorDrillingHeaders } from '../../../common/constant';
import { CommonDisplayMessages, Tyr2TaskStatus } from '../../../common/enum/common-enum';
import { DocumentEntityTypes } from '../../../common/enum/document-entity-types';
import { LookupKeys } from '../../../common/enum/lookup-keys';
import { Personas } from '../../../common/enum/user-persona.enum';
import { ConfigurationValues } from '../../../common/model/configuration-values';
import { DocumentInfo } from '../../../common/model/Document/DocumentInfo';
import { ThorDrillingMaterials } from '../../../common/model/thor-drilling-materials';
import { ThorSelectedWells } from '../../../common/model/thor-selected-wells';
import { Ty2Tasks } from '../../../common/model/tyr2-task.model';
import { UserPrimaryRole } from '../../../common/model/UserInfo';
import { WellsByRig } from '../../../common/model/wells-by-rig';
import { AuthService, MasterService } from '../../../services';
import { CommonService } from '../../../services/common.service';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { LookupsService } from '../../../services/lookups.service';
import { ThorService } from '../../../services/thor.service';
import { Tyr2TasksService } from '../../../services/tyr2-tasks.service';
import { UserService } from '../../../services/user.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ChatComponent } from '../../common/chat/chat.component';
import { FileUploadWithButtonComponent } from '../../common/file-upload-interactive-dialog/file-upload-interactive-dialog.component';
import { CustomUploadButton } from '../../thorv2/customUploadButton.component';
import { CreateTaskDialogComponent } from '../create-task-dialog/create-task-dialog.component';
import { CommonTyrBuilderService } from '../services/common-tyr-builder.service';
import { SelectedWellBuilderService } from '../services/selected-well-builder.service';
import { WellSelectorComponent } from '../well-selector/well-selector.component';
import { MoveEmailComponent } from '../../common/move-email/move-email.component';


@Component({
  selector: 'app-tyr2-drilling',
  templateUrl: './tyr2-drilling.component.html',
  styleUrl: './tyr2-drilling.component.scss',
  standalone: true,
  imports: [PRIME_IMPORTS, 
    CreateTaskDialogComponent,
    FileUploadWithButtonComponent,
    ChatComponent,
    WellSelectorComponent,
    MoveEmailComponent
  ],
})
export class Tyr2DrillingComponent implements OnInit, OnDestroy {
  //Grid Options
  displaySidebar: boolean = true;
  displayfileUploadInteractiveDialog: boolean = false;
  subscription: Subscription;
  isFilterBTNDisabled: boolean = false;
  totalRecords: number = 0;
  projects: WellsByRig[] = [];
  selectedProjectId: number | null = null;
  selectedWellId: number | null = null;
  selectedWellNumber: number | null = null;
  selectedWellNumbers: number[] = [];
  selectedwellName: string | null = null;
  wells: any[] = [];
  selectedProject: any[] = [];
  thorWellsData: any[] = [];
  quickFilterText: string = '';
  viewOptionsFunctionId: number = 1;
  appId: number = 2;
  attachmentAppId: number = 3; // Separate appId for attachment uploads
  isWellSelected: boolean = false;
  masterDataColumnDefs = [];
  isWellChanged: boolean = false;
  maxProjectSelection: number = 5;
  maxWellSelection: number = 5;
  searchWell: string;
  allLookUpData: any;
  searchTerm: string = '';
  uploaddata: any;
  wellDocumentTypes: any;
  selectedView: number;
  entityType: string;
  entityName: string = thorDrillingHeaders;
  openChangeLog: boolean = false;
  openUploadDialog: boolean = false;
  currentEntityId: number = 0;
  entityId: number;
  isUpdateEditable: boolean = true;
  selectedDocument: string;
  addEquipmentForm!: FormGroup;
  displayEquipmentDialog: boolean = false;
  showEquipmentAddDialog: boolean = false;
  selectedEntity: string = '';
  noRowsFound: boolean = false;
  isPageView: boolean = false;
  private gridApi!: GridApi;
  loading: boolean = false;
  materialShortDescListFiltered: any[] = [];
  height$: Observable<string>;
  drillingGridApi: GridApi;
  submittedGridApi: GridApi;
  comparatorWellGridApi: GridApi;
  displayCreateTaskDialog: boolean = false;
  othersData: string = 'MATERIAL,MATERIAL_CVX_PO,MATERIAL_SPEC_SHEET';
  viewOptions = [
    { label: 'Drilling', value: 1 },
    { label: 'Completions', value: 2 },
  ];
  materialTypeList: { label: string; value: string }[] = [];
  holeSelectionList: { label: string; value: string }[] = [];
  hsTypeList: { label: string; value: string }[] = [];
  uomList: { label: string; value: string }[] = [];
  editedRowsData: ThorDrillingMaterials[] = [];
  addedData: ThorDrillingMaterials[] = [];
  savedData: ThorDrillingMaterials[] = [];
  thorSelectedWell: ThorSelectedWells;
  displayValidationDialog: boolean = false;
  @ViewChild('overlayAddEquipment') overlayAddEquipment: OverlayPanel;
  currentRowForOverLayPanel: any;
  hasDoc: boolean;
  userDetails: any;
  pageNumber: number = 1;
  pageSize: number = 100;
  totalRecordsD: number = 0;
  drillingMaterials: ThorDrillingMaterials[] = [];
  intervalId: any;
  isChatEnabled: boolean = false; // Flag to control chat visibility
  readonly stateKey = 'Thor - Drilling';
  cachedGridState: any;
  cachedContextData: any;
  hasRestoredPersonalization = false;
  isCVXPODocumentUploaded = false;
  functionId: number = 1;
  statusList: Array<ConfigurationValues> = [];
  taskTypeList: Array<ConfigurationValues> = [];
  materialCoordinatorsList: UserPrimaryRole[] = [];
  tyrFilteredDropDownValue = {
    supplierName: [],
    taskType: [],
    statusName: []
  };
  unsavedChanges: boolean = false;
  supplierSelected: string = '';
  statusNameSelected: string = '';
  selectedFilterName: string = '';
  supplierNameSelected: string = '';
  statusSelected: string = '';
  currentTaskData: any = null; // Store current task data for attachment dialog
  showCompletedTasks: boolean = false; // Controls visibility of Completed tasks

  // Comparator view toggle
  isComparatorWell: boolean = false;
  comparatorWellId: number;
  comparatorRowData: Ty2Tasks[] = [];
  comparatorTableData: Ty2Tasks[] = [];
  submittedColumnDefs=[];

  // PDF Modal properties
  showPdfModal: boolean = false;
  selectedPdfUrl: string = '';
  safePdfUrl: SafeResourceUrl | null = null;
  pdfLoadError: boolean = false;
  storeIsWellSelected: WritableSignal<boolean> = this.store.isWellSelected;
  gridOption: any = {
    api: null,
    columnApi: null,
    overlayLoadingTemplate: '<span class="my-custom-loader">Loading data...</span>'
  };
  storeProjects: WritableSignal<WellsByRig[]> = this.store.projects;
  storeSelectedProjectId: WritableSignal<number> = this.store.selectedProjectId;
  storeFunctionId: WritableSignal<number> = this.store.functionId;
  storeSelectedWellId: WritableSignal<number> = this.store.selectedWellId;
  storeSelectedwellName: WritableSignal<string> = this.store.selectedwellName;
  storeSelectedComparisonWellId: WritableSignal<number> = this.store.comparisonWellNumber; // Adding seperate signal for comparator well
  storeDisplay: WritableSignal<boolean> = this.store.display;
  storeSelectedFilterText: WritableSignal<string> = this.commonTyrBuilderService.selectedFilterText; // Getting the signal value for the searchTerm
  wellSelectButtonClicked: WritableSignal<boolean> = this.store.wellSelectButtonClicked; // Adding the sigbnal to check whether the select well button clicked or not

  // Grid expansion state - access from service
  isRightGridExpanded: WritableSignal<boolean> = this.commonTyrBuilderService.isRightGridExpanded;

  // Adding signal for comparator view
  isComparatorViewSelected: WritableSignal<boolean> = this.commonTyrBuilderService.isComparatorViewSelected;
  roomName: string = 'TYR';
  documentIds: number[] = [];
  moveEmailContent = CommonDisplayMessages.moveEmailContent;
  moveTypeHeader = CommonDisplayMessages.MoveTypeHeader;

  // Properties for the second grid (Drilling Interactive)
  wellDetails: {
    id: number;
    wellNumber: number;
    wellName: string;
    appId: number;
    functionId: number;
  } | null = null;

  // Sidebar configuration for the drilling grid
  public drillingSideBar: SideBarDef | string | string[] | boolean | null = {
    toolPanels: [
      {
        id: "columns",
        labelDefault: "Columns",
        labelKey: "columns",
        iconKey: "columns",
        toolPanel: "agColumnsToolPanel",
        toolPanelParams: {
          suppressRowGroups: true,
          suppressValues: true,
          suppressPivots: true,
          suppressPivotMode: true,
          suppressColumnFilter: true,
          suppressColumnSelectAll: false,
          suppressColumnExpandAll: true,
        },
      },
    ],
  };

  // Subscription to manage API call subscriptions and prevent memory leaks
  private tyrDrillingSubscription: Subscription = new Subscription();
  displayMoveToTaskDialog: boolean;
  constructor(private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef, private store: SelectedWellBuilderService, private authService: AuthService,
    private lookupService: LookupsService, private thorService: ThorService, private commonService: CommonService, private spinner: NgxSpinnerService,
    private masterService: MasterService, private tyr2TasksService: Tyr2TasksService, private messageService: MessageService, private configurationValuesService: ConfigurationValuesService,
    private commonTyrBuilderService: CommonTyrBuilderService, private userService: UserService
  ) {
    // Clearing the signal values
    this.clearAllSignals();
    effect(() => {
      this.projects = this.storeProjects();

      this.selectedProjectId = this.storeSelectedProjectId();
      const previousWellId = this.selectedWellId;
      this.selectedWellId = this.storeSelectedWellId();
      this.selectedwellName = this.storeSelectedwellName();
      // this.displaySidebar = this.storeDisplay();
      this.isWellSelected = this.storeIsWellSelected();
      // Getting search term from searchbox of module interaction menu
      this.quickFilterText = this.storeSelectedFilterText();

      this.isComparatorWell = this.isComparatorViewSelected();

      this.comparatorWellId = this.store.comparisonWellNumber();

      // Load tasks when well ID changes
      if ((this.selectedWellId !== previousWellId && this.selectedWellId) || (this.comparatorWellId && this.isComparatorWell)) {
        this.loadTasksByWellId();
      }
    });
  }
  ngOnInit(): void {
    // Component initialization
    this.getAllProjects();
    this.getUserDetails();
    this.getStatusList();
    this.getTaskTypeList();
    this.initializeColumnDefs();
    this.initializeDrillingData();
    this.loadMaterialCoordinators();
    // Load tasks for the current well
    this.loadTasksByWellId();
    this.initializeTaskData();
  }

  getUserDetails() {
    this.userDetails = this.authService.getUserDetail(); // Get user details from AuthService
    let userAccess = this.authService.isAuthorized(AccessControls.TYRWTR);
    this.commonService.setuserAccess(userAccess);
  }

  // Call for applying the filters for tyr
  applyComponentTypeFilter(event: any, type: string) {
    this.submittedGridApi.onFilterChanged();
    this.submittedRowData = this.submittedTableData.map(item => ({ ...item }));

    // Added changes for comparator view
    this.comparatorWellGridApi?.onFilterChanged();
    this.comparatorRowData = this.comparatorTableData.map(item => ({ ...item }));
    this.selectedFilterName = type;

    let filterValue: any = [];
    // Determine which filter to apply based on the type
    if (this.supplierSelected?.length) {
      filterValue = this.supplierSelected;
      this.submittedRowData = this.submittedRowData.filter(d => filterValue.includes(d.supplierName));
      // Added changes for comparator view
      this.comparatorRowData = this.comparatorRowData.filter(d => filterValue.includes(d.supplierName));
    }
    if (this.statusNameSelected?.length) {
      filterValue = this.statusNameSelected;
      this.submittedRowData = this.submittedRowData.filter(d => filterValue.includes(d.statusName));
      // Added changes for comparator view
      this.comparatorRowData = this.comparatorRowData.filter(d => filterValue.includes(d.statusName));
    }
    else {
      this.selectedFilterName = '';
      filterValue = [];
    }

    this.totalRecords = this.submittedTableData.length;
    setTimeout(() => {
      this.submittedGridApi.expandAll();
      this.comparatorWellGridApi.expandAll(); // Added changes for comparator view
    }, 100);
  }

  startDataLoading() {
    this.pageNumber = 1;
    this.thorWellsData = [];
    this.loading = false;
    this.spinner.show();

    if (this.intervalId) {
      clearInterval(this.intervalId); // Clear any previous interval
    }

    // Load initial 100 records
    this.loadPagedThorWells();

    // Set interval to load next pages every 3 seconds (adjust as needed)
    this.intervalId = setInterval(() => {
      this.loadPagedThorWells();
    }, 1000); // Load next page every 1 second
  }

  initializeTaskData() {
   this.submittedColumnDefs = [
    { headerName: 'Well', field: 'wellName', editable: this.authService.isFieldEditable('wellName'), minWidth: 150 },
    {//Task Type column added
      headerName: 'Task Type',
      field: 'taskTypeId',
      minWidth: 140,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params: any) => {
        return {
          values: this.taskTypeList.map(taskType => taskType.value)
        };
      },
      valueFormatter: (params) => {
        // params.value is taskTypeId from backend
        const taskType = this.taskTypeList.find(taskType => taskType.id === params.value);
        return taskType ? taskType.value : '';
      },
      valueSetter: (params) => {
        const taskType = this.taskTypeList.find(s => s.value === params.newValue);
        if (taskType) {
          params.data.taskType = taskType.value;
          params.data.taskTypeId = taskType.id;
          return true;
        }
        return false;
      }
    },
    {
      headerName: 'Sub Date', field: 'dateCreated', editable: true, minWidth: 120, sortable: true, filter: true,
      cellEditor: 'agDateCellEditor',  // Use AG Grid's built-in date picker (calendar)
      cellEditorParams: {
        format: 'MM/dd/yyyy',  // Date format for the calendar (optional)
      },
      valueGetter: (params) => {
        // Log value to debug

        // Ensure dateCreated is either null or valid
        if (params.data.dateCreated === undefined || params.data.dateCreated === null) {
          return null;  // Return null if there is no value
        }

        // If there is a valid date, return it
        return params.data.dateCreated;  // Returning Date object should be fine here
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
      onCellValueChanged: (params) => {
        const newDate = new Date(params.newValue);

        // Debug log for checking new date value

        // Check if the new value is empty, invalid, or the default Unix epoch date (1/1/1970)
        if (!params.newValue || isNaN(newDate.getTime()) || newDate.getTime() === 0) {
          // If the value didn't change, don't update it
          if (params.oldValue === params.newValue) {
            return; // Don't update if the value is the same
          }


          if (params.data.dateCreated != null) {
            return;  // Keep the existing value
          }


          params.api.getRowNode(params.node.id).setDataValue('dateCreated', params.oldValue);
        } else {

          const normalizedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());


          if (params.oldValue !== normalizedDate.getTime()) {
            params.api.getRowNode(params.node.id).setDataValue('dateCreated', normalizedDate);
          }
        }
      }
    },
    {
      headerName: 'Supplier',
      field: 'supplierName',
      // rowGroup: true,
      hide: true,
      // rowGroupIndex: 0, // First level grouping
    },
    { headerName: 'Rep No & Type', field: 'reportNoType', editable: this.authService.isFieldEditable('reportNoType'), minWidth: 150 },
    { headerName: 'Batch From', field: 'batchFrom', editable: this.authService.isFieldEditable('batchFrom'), minWidth: 130 },
    {
      headerName: 'Batch To',
      field: 'batchTo',
      editable: this.authService.isFieldEditable('batchTo'),
      minWidth: 120,
      // rowGroup: true,
      hide: false,
      // rowGroupIndex: 2, // Third level grouping (within status)
    },
    { headerName: 'WBS From', field: 'wbsfrom', editable: this.authService.isFieldEditable('wbsfrom'), minWidth: 120 },
    { headerName: 'WBS To', field: 'wbsto', editable: this.authService.isFieldEditable('wbsto'), minWidth: 120 },
    { headerName: 'SLOC To', field: 'slocto', editable: this.authService.isFieldEditable('slocto'), minWidth: 120 },
    { headerName: 'SLOC From', field: 'slocfrom', editable: this.authService.isFieldEditable('slocfrom'), hide: true, minWidth: 120 },
    { headerName: 'MD#', field: 'md', editable: this.authService.isFieldEditable('md'), hide: true, minWidth: 100 },
    { headerName: 'Task ID', field: 'taskId', editable: this.authService.isFieldEditable('taskId'), hide: true, minWidth: 140 },
    {
      headerName: 'Date Completed', field: 'dateCompleted', minWidth: 170, editable:false, sortable: true, filter: true, hide: true,
      cellEditor: 'agDateCellEditor',  // Use AG Grid's built-in date picker (calendar)
      cellEditorParams: {
        format: 'MM/dd/yyyy',  // Date format for the calendar (optional)
      },
      valueGetter: (params) => {
        // Log value to debug

        // Ensure dateCompleted is either null or valid
        if (params.data.dateCompleted === undefined || params.data.dateCompleted === null) {
          return null;  // Return null if there is no value
        }

        // If there is a valid date, return it
        return params.data.dateCompleted;  // Returning Date object should be fine here
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
      onCellValueChanged: (params) => {
        const newDate = new Date(params.newValue);

        // Debug log for checking new date value

        // Check if the new value is empty, invalid, or the default Unix epoch date (1/1/1970)
        if (!params.newValue || isNaN(newDate.getTime()) || newDate.getTime() === 0) {
          // If the value didn't change, don't update it
          if (params.oldValue === params.newValue) {
            return; // Don't update if the value is the same
          }


          if (params.data.dateCompleted != null) {
            return;  // Keep the existing value
          }


          params.api.getRowNode(params.node.id).setDataValue('dateCompleted', params.oldValue);
        } else {

          const normalizedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());


          if (params.oldValue !== normalizedDate.getTime()) {
            params.api.getRowNode(params.node.id).setDataValue('dateCompleted', normalizedDate);
          }
        }
      }
    },
    { headerName: 'Last Status', field: 'lastStatusName', editable: false, hide: true },
    {
      headerName: 'Last Status Change Date', field: 'lastStatusChangeDate', minWidth: 140, editable: false, sortable: true, filter: true, hide: true, wrapHeaderText: true,
      cellEditor: 'agDateCellEditor',  // Use AG Grid's built-in date picker (calendar)
      cellEditorParams: {
        format: 'MM/dd/yyyy',  // Date format for the calendar (optional)
      },
      valueGetter: (params) => {
        // Log value to debug

        // Ensure lastStatusChangeDate is either null or valid
        if (params.data.lastStatusChangeDate === undefined || params.data.lastStatusChangeDate === null) {
          return null;  // Return null if there is no value
        }

        // If there is a valid date, return it
        return params.data.lastStatusChangeDate;  // Returning Date object should be fine here
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
      onCellValueChanged: (params) => {
        const newDate = new Date(params.newValue);

        // Debug log for checking new date value

        // Check if the new value is empty, invalid, or the default Unix epoch date (1/1/1970)
        if (!params.newValue || isNaN(newDate.getTime()) || newDate.getTime() === 0) {
          // If the value didn't change, don't update it
          if (params.oldValue === params.newValue) {
            return; // Don't update if the value is the same
          }


          if (params.data.lastStatusChangeDate != null) {
            return;  // Keep the existing value
          }


          params.api.getRowNode(params.node.id).setDataValue('lastStatusChangeDate', params.oldValue);
        } else {

          const normalizedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());


          if (params.oldValue !== normalizedDate.getTime()) {
            params.api.getRowNode(params.node.id).setDataValue('lastStatusChangeDate', normalizedDate);
          }
        }
      }
    },
    { headerName: 'Project From', field: 'projectFrom', editable: this.authService.isFieldEditable('projectFrom'), hide: true, minWidth: 140 },
    {
      headerName: 'User',
      field: 'assignedTo',
      editable: this.authService.isFieldEditable('assignedTo'),
      hide: true,
      minWidth: 140,
      cellEditor: 'agSelectCellEditor',
      valueFormatter: (params) => {
        const coordinator = this.materialCoordinatorsList.find(item => item.userId === params.value);
        return coordinator ? coordinator.fullName : '';
      },
      cellEditorParams: () => {
        return {
          values: this.materialCoordinatorsList.map(item => item.userId),
          valueListGap: 0,
          valueListMaxHeight: 220
        };
      },
      valueSetter: (params) => {
        const selectedUserId = parseInt(params.newValue);
        params.data.assignedTo = selectedUserId;
        return true;
      }
    },
    { headerName: 'Quantity', field: 'quantity', editable: this.authService.isFieldEditable('quantity') },
    { headerName: 'Comments', field: 'comments', editable: this.authService.isFieldEditable('comments'), cellEditor: 'agLargeTextCellEditor', cellEditorPopup: true, },
    { headerName: 'Days In Submitted Status', field: 'daysinSubmittedStatus', editable: false, hide: true, wrapHeaderText: true, minWidth: 160 },
    { headerName: 'Days In Pending Status', field: 'daysinPendingStatus', editable: false, hide: true, wrapHeaderText: true, minWidth: 160 },
    {
      headerName: 'Attachment',
      field: 'documents',
      cellRenderer: (params: any) => {
        const documents = params.data?.documents || [];
        const hasDocuments = documents.length > 0;
        const iconColor = hasDocuments ? '#dc2626' : '#9ca3af';
        const title = hasDocuments ? 'View Attachments' : 'Upload Attachment';

        return `<div class="attachment-cell" 
                     title="${title}" 
                     onclick="window.openAttachmentDialog && window.openAttachmentDialog(${JSON.stringify(params.data).replace(/"/g, '&quot;')})">
                  <i class="pi pi-file-pdf attachment-icon" style="color: ${iconColor};"></i>
                  ${hasDocuments ? `<span class="attachment-count" style="color: ${iconColor};"></span>` : ''}
                </div>`;
      },
      minWidth: 150,
      editable: false,
      onCellClicked: (params: any) => {
        this.openAttachmentUploadDialog(params.data);
        // Only call API if status is Submitted
        if (params.data.statusName === Tyr2TaskStatus.Submitted) {
          this.saveAttachmentTask(params.data);
        }
      },
      sortable: false,
      suppressHeaderMenuButton: true
    },
    {
      headerName: 'Status',
      field: 'statusName',
      // rowGroup: true,
      hide: false,
      // rowGroupIndex: 1, // Second level grouping (within supplier)
      editable: this.authService.isFieldEditable('statusName'),
      cellEditor: 'agSelectCellEditor',
      sortingOrder: ['asc', 'desc'], // Allow both sorting directions
      sort: 'desc', // Set default sort direction to match data sort order
      valueFormatter: (params) => {
        const item = this.statusList.find((status) => status.value === params.value);
        return item ? item.value : params.value;
      },
      cellEditorParams: (params: any) => {
        const currentStatus = params.data?.statusName;
        let availableStatuses = this.statusList.map((status) => status.value);

        // Apply status transition rules
        if (currentStatus === 'Pending') {
          // If current status is Pending, disable Submitted
          availableStatuses = availableStatuses.filter(status => status !== 'Submitted');
        } else if (currentStatus === 'Completed') {
          // If current status is Completed, disable both Pending and Submitted
          availableStatuses = availableStatuses.filter(status => status !== 'Pending' && status !== 'Submitted');
        }

        return {
          values: availableStatuses,
        };
      },
      onCellValueChanged: (params) => {
        if (params.oldValue !== params.newValue) {
          // Handle status change if needed
          const updatedData = params.data;
          updatedData.isEdited = true;
        }
      }
    },
  ];
  }

  // Sidebar configuration for column visibility
  public sideBar: SideBarDef | string | string[] | boolean | null = {
    toolPanels: [
      {
        id: 'columns',
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: 'agColumnsToolPanel',
        toolPanelParams: {
          suppressRowGroups: true,
          suppressValues: true,
          suppressPivots: true,
          suppressPivotMode: true,
          suppressColumnFilter: true,
          suppressColumnSelectAll: false,
          suppressColumnExpandAll: true,
        },
      },
    ],
  };


  submittedRowData: Ty2Tasks[] = [];
  submittedTableData: Ty2Tasks[] = [];

  previewPdf(pdfUrl: string): void {
    // Reset error states
    this.pdfLoadError = false;

    // Handle different URL types
    let fullUrl = this.processUrl(pdfUrl);

    this.selectedPdfUrl = fullUrl;
    this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
    this.showPdfModal = true;

    // Trigger change detection manually
    this.cdr.detectChanges();
  }

  private processUrl(url: string): string {
    // Handle relative URLs for local assets
    if (url.startsWith('./assets/') || url.startsWith('../assets/')) {
      return url.replace(/^\.\.?\//, ''); // Remove './' or '../' prefix
    }

    // Handle absolute local paths
    if (url.startsWith('/assets/')) {
      return url.substring(1); // Remove leading '/'
    }

    // Handle external URLs (http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url; // Use as-is
    }

    // Default: return URL as-is
    return url;
  }

  private isExternalUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
  }
  closePdfModal(): void {
    this.showPdfModal = false;
    this.selectedPdfUrl = '';
    this.safePdfUrl = null;
    this.pdfLoadError = false;

    // Trigger change detection manually to ensure immediate close
    this.cdr.detectChanges();
  }

  onPdfLoad(): void {
    this.pdfLoadError = false;
  }

  onPdfError(): void {
    this.pdfLoadError = true;
    this.cdr.detectChanges();
  }
  // Gets called after well selector emits the event in oncontinue button
  updateFilter() {
    this.store.wellSelectButtonClicked.set(false);
    this.store.updateFilter();
    this.displaySidebar = false;
    this.store.display.set(false);
    this.loadPagedThorWells();
    this.roomName =
      'TYR-' + this.selectedWellId + ' ' + this.selectedwellName;
      // well details
    this.wellDetails = {
        id: this.selectedWellId,
        wellNumber: this.selectedWellNumber,
        wellName: this.selectedwellName,
        appId: 2,            // Thor
        functionId: this.functionId, // Drilling/Completions
   };
  }

  // Searching func for the wells on select well
  searchWellFilter() {
    this.store.functionId.set(this.viewOptionsFunctionId);
    this.store.searchWellFilter();
  }

  // Toggle between the drilling and completions
  toggleProjectWells(selectedValue: {
    wellId: number;
    projectId: number;
    wellNumber: number;
    wellName: string;
  }) {
    this.store.toggleProjectWells(selectedValue);
  }

  // Called after the selection changed in selectbutton
  onViewSelectionChange(selectedOption: any) {
    this.viewOptionsFunctionId = selectedOption;
    this.store.functionId.set(this.viewOptionsFunctionId);
    if (this.viewOptionsFunctionId) {
      this.getAllProjects();
    }
  }

  // Clearing the filters set
  clearAllFilters() {
    this.quickFilterText = '';
    this.supplierSelected = '';
    this.statusNameSelected = '';
    if (this.submittedGridApi) {
      this.submittedGridApi.setFilterModel(null);
      this.submittedGridApi.onFilterChanged();
      this.submittedGridApi.deselectAll();
    }
    this.submittedRowData = this.submittedTableData.map(item => ({ ...item }));
    this.isComparatorWell ? this.comparatorRowData = this.comparatorTableData.map(item => ({ ...item })) : [];
    setTimeout(() => {
      this.submittedGridApi.expandAll();
      this.comparatorWellGridApi.expandAll();
    }, 100);
  }

  clearAllSignals() {
    const thorSelectedWell = {
      wellId: 0,
      wellNumber: 0,
      wellName: '',
      appId: 0,
      functionId: 0, // Drilling/Completions
    };

    this.store.selectedWellNumber.set(null);
    this.store.isWellSelected.set(false);
    this.store.projects.set([]);
    this.store.selectedProjectId.set(null);
    this.store.selectedWellId.set(null);
    this.store.functionId.set(null);
    this.store.selectedWellNumber.set(null);
    this.store.selectedwellName.set(null);
    this.commonService.setThorSelectedWell(thorSelectedWell);
  }

  ngOnDestroy(): void {
    // adding this object to set the selected well as null to clear after navigation for header component
    this.clearAllSignals();
    this.tyrDrillingSubscription?.unsubscribe();
  }

  // Calls the service for getting all wells based on the selction
  getAllProjects() {
    this.store.getAllProjects(3, this.viewOptionsFunctionId);
  }

  joinChat() {
    this.isChatEnabled = true;
  }

  onLeaveChat() {
    this.isChatEnabled = false;
  }

  /**
   * Fetches the list of Status from the configuration values service.
   */
  getStatusList() {
    this.tyrDrillingSubscription = this.configurationValuesService.getAllEntities('configvalue', 'Status').subscribe({
      next: (response) => {
        this.statusList = response;
      },
      error: (error) => {
      }
    });
  }

  /**
   * Fetches the list of Task Types from the configuration values service.
   */
  getTaskTypeList() {
    this.tyrDrillingSubscription = this.configurationValuesService.getAllEntities('configvalue', 'TaskType').subscribe({
      next: (response) => {
        this.taskTypeList = response;
      },
      error: (error) => {
        console.error('Error fetching Task Type list:', error);
      }
    });
  }
  // Fetching the material coordinators for the dropdown
  loadMaterialCoordinators(): void {
    this.tyrDrillingSubscription = this.userService.getUserPrimaryRole(Personas.MaterialCoordinator).subscribe({
      next: (res: UserPrimaryRole[]) => {
        this.materialCoordinatorsList = res;
      },
      error: (err) => {
        console.error('Error fetching material coordinators:', err);
      }
    });
  }

  // Methods for the second grid (Drilling Interactive)
  initializeColumnDefs() {
    this.masterDataColumnDefs = [
      {
        headerName: 'Item',
        field: 'itemNumber',
        minWidth: 100,
        filter: true,
        editable: this.authService.isFieldEditable('itemNumber'), // Make it non-editable as it's updated dynamically
        sortable: true,
        valueFormatter: (params) => {
          const { itemLetter, itemNumber } = params.data || {}; // Safely extract data
          return itemLetter && itemNumber !== undefined
            ? `${itemLetter}${itemNumber}` // Concatenate itemLetter and itemNumber
            : ''; // Return an empty string if data is missing
        }
      },
      {
        headerName: 'Material Description', field: 'materialShortDesc', editable: this.authService.isFieldEditable('materialShortDesc'), sortable: true, minWidth: 260, filter: true,
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true,
      },
      { headerName: 'Material ID', field: 'materialId', editable: false, sortable: true, minWidth: 140, filter: true, },

      {
        headerName: 'Other Documents',
        cellRenderer: CustomUploadButton,
        minWidth: 150,
        cellRendererParams: {
          onClick: (data: any, hasDoc: boolean) => {
            this.hasDoc = hasDoc;
            if (this.hasDoc) {
              this.openUploadDialogBox(this.othersData, data);
            } else {
              const updatedData = { ...data, additionalParam: 'Others' };
              this.onCellClick(updatedData);
            }


          },
          additionalParam: 'Others'
        },
        sortable: false,
        suppressHeaderMenuButton: true
      },

      {
        headerName: 'Design Comment', field: 'designComment',
        cellEditor: "agLargeTextCellEditor",
        cellEditorPopup: false,
        wrapText: true,
        autoHeight: true,
        cellStyle: { 'white-space': 'pre', 'line-height': '1.25', 'align-content': 'center' },
        minWidth: 220, editable: this.authService.isFieldEditable('designComment'), sortable: true, filter: true
      },
      { headerName: 'Manufacturer Part #', field: 'manufacturerPart', minWidth: 200, editable: this.authService.isFieldEditable('manufacturerPart'), sortable: true, filter: true },

      { headerName: 'Business Partner', field: 'vendor', minWidth: 200, editable: false, sortable: true, filter: true },
      {
        headerName: 'Consumed In SAP',
        field: 'reconciledInSap',
        sortable: true,
        minWidth: 180,
        cellStyle: { backgroundColor: '#e1f5e6', textAlign: 'center' },
        cellRenderer: (params) => {
          const isChecked = params.value === 'Yes';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.className = 'custom-checkbox';
          input.checked = isChecked;

          input.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            const newValue = target.checked ? 'Yes' : 'No';
            params.setValue(newValue);

            if (target.checked) {
              this.messageService.add({
                severity: 'warn',
                summary: 'Consumed In SAP',
                detail: 'The demand will become 0 for ODIN and THOR if you check this.'
              });
            }
          });

          return input;
        }
      },
      {
        headerName: 'MC Comments', field: 'McComments', editable: this.authService.isFieldEditable('McComments'), sortable: true, minWidth: 180,
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true,
        cellStyle: { backgroundColor: '#e1f5e6' }
      },
      {
        headerName: 'ERP Quantity Out', field: 'erpQtyOut', editable: this.authService.isFieldEditable('erpQtyOut'), sortable: true, minWidth: 180,
        cellStyle: { backgroundColor: '#e1f5e6' },

      },
      {
        headerName: 'ERP Quantity In', field: 'erpQtyIn', editable: this.authService.isFieldEditable('erpQtyIn'), sortable: true, minWidth: 180,
        cellStyle: { backgroundColor: '#e1f5e6' },
      },
      {
        headerName: 'Line Item Reconciled',
        field: 'lineItemReconciled',
        sortable: true,
        minWidth: 180,
        cellStyle: { backgroundColor: '#e1f5e6', textAlign: 'center' },
        editable: false, // handled directly by checkbox
        cellRenderer: (params) => {
          const isChecked = params.value === 'Yes';
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.className = 'custom-checkbox';
          input.checked = isChecked;

          input.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            const newValue = target.checked ? 'Yes' : 'No';
            params.setValue(newValue);
          });

          return input;
        }
      },

      {
        headerName: 'Date Reconciled',
        field: 'dateReconciled',
        minWidth: 180,
        editable: false,
        sortable: true,
        cellStyle: { backgroundColor: '#e1f5e6' },
        valueFormatter: (params) => {
          if (!params.value) return ''; // handle null/undefined
          const date = new Date(params.value);
          if (isNaN(date.getTime())) return ''; // invalid date
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`; // ✅ DD/MM/YYYY format
        }
      },

    ];
  }

  initializeDrillingData(): void {
    // Sample data for the drilling grid
    this.thorWellsData = [
    ];
  }

  onDrillingGridReady(params: any): void {
    this.drillingGridApi = params.api;
    this.gridOption.api = params.api;
    this.gridOption.columnApi = params.columnApi;
    this.initializeDropdowns();
  }

  onSubmittedGridReady(params: any): void {
    this.submittedGridApi = params.api;
    // Expand all groups after grid is ready
    setTimeout(() => {
      this.submittedGridApi.expandAll();
    }, 100);
  }

  // Added changes for comparator view
  onSubmittedComparatorGridReady(params: any): void {
    this.comparatorWellGridApi = params.api;
    // Expand all groups after grid is ready
    setTimeout(() => {
      this.comparatorWellGridApi.expandAll();
    }, 100);
  }

  onSubmittedCellValueChanged(event: any): void {
    // Mark the row as edited when any cell value changes
    if (event.oldValue !== event.newValue) {
      const updatedData = event.data;
      updatedData.isEdited = true;
    }
  }

  onCellValueChanged(event: any): void {
    // Handle cell value changes for the drilling grid
    const updatedData = this.thorWellsData.find((row: any) => row.id === event.data.id);
    if (updatedData) {
      updatedData.isEdited = true;
    }
  }

  onCellClick(event: any): void {
    if (event.colDef.headerName === 'Other Documents' && !this.hasDoc) {
      if (this.overlayAddEquipment && event.event) {
        this.overlayAddEquipment.show(event.event);
      }
    }
  }

  getRowClass = (params: any) => {
    return params.data.rowOrder === 0 ? 'bold-row' : '';
  };

  handleHoleSectionChange(params: any) {
    const wellNumber = this.selectedWellNumber; // Assuming you have wellNumber in the row data
    const holeSection = params.newValue.replace(/\\"/g, '"');
    // Call the API
    this.tyrDrillingSubscription = this.thorService.getItemForHoleSection(wellNumber, holeSection).subscribe(
      (response) => {
        params.api.getRowNode(params.node.id).setDataValue('item', response);

      },
      (error) => {
        console.error('Error fetching item:', error);
      }
    );
  }

  // Open move task after clicking on move button
  openMoveTaskDialog(data) {
    this.displayMoveToTaskDialog = true;
  }

  openUploadDialogBox(documentEntityTypes: any, data?: any, selectedEntity?: any, selectedView?: any) {
    // this.selectedEntity=selectedEntity? selectedEntity:"";
    this.selectedEntity = selectedEntity || "";
    if (this.entityType !== documentEntityTypes) {
      this.selectedView = null; // Reset the selected view
    }
    this.getUserDetails();
    this.getWellDocumentTypes(documentEntityTypes, data, selectedView);
  }

  openAttachmentUploadDialog(data: any) {
    // Store the current task data for the attachment dialog
    this.currentTaskData = data;
    // Set the entity ID to the task ID for TYR attachments
    this.entityId = data.id;
    // Use separate appId property for attachments
    this.openUploadDialogBox(DocumentEntityTypes.TYR, data);
  }

  getWellDocumentTypes(entityType: any, data?: any, selectedView?: any) {
    this.tyrDrillingSubscription = this.lookupService
      .getDocumentTypes(entityType)
      .subscribe({
        next: (resp: any) => {
          if (resp) {
            this.isUpdateEditable = this.authService.isFieldEditable('uploadDocument');
            this.displayfileUploadInteractiveDialog = true;
            this.entityType = entityType;
            this.entityId = data ? data.id : this.wellDetails.id;
            this.wellDocumentTypes = resp;

            if (this.selectedEntity) {
              const documents = this.wellDocumentTypes.filter(x => x.entity === this.selectedEntity)
              // this.selectedView =documents[0].id;

              this.selectedView = selectedView ?? (documents.length > 0 ? documents[0].id : null);

              this.selectedEntity = "";

            }
            else {
              this.selectedView = selectedView ?? (this.wellDocumentTypes.length > 0 ? this.wellDocumentTypes[0].id : null);
            }

            this.selectedDocument = this.wellDocumentTypes.find(x => x.id === this.selectedView)?.name;
          } else {
            this.wellDocumentTypes = [];
          }
        },
        error: () => {
          this.wellDocumentTypes = [];
        },
      });
  }

  loadPagedThorWells() {
    if (this.loading) return;

    this.loading = true;
    const wellId = this.selectedWellId; // Hardcoded for testing purposes
    this.tyrDrillingSubscription = this.thorService.getthorDrillingMaterialsPaged(wellId, this.pageNumber, this.pageSize)
      .subscribe({
        next: (response) => {
          this.spinner.hide();
          this.loading = false;

          const data = response.result?.data || [];
          this.totalRecords = response.result?.totalRecords || 0;

          // No records on first page, stop
          if (this.pageNumber === 1 && data.length === 0) {
            this.noRowsFound = true;
            this.isWellSelected = false;
            clearInterval(this.intervalId);
            return;
          }

          // Only clear data on first page
          if (this.pageNumber === 1) {
            this.thorWellsData = [...data];
          } else {
            this.thorWellsData = [...this.thorWellsData, ...data];
          }
          // Refresh grid view with new data
          if (this.gridOption?.api) {
            this.gridOption?.api?.setRowData(this.thorWellsData); // optional
            this.gridOption?.api?.refreshCells({ force: true }); // needed for custom renderer updates
          }
          this.isWellSelected = true;
          this.noRowsFound = false;
          this.displaySidebar = false;

          this.initializeColumnDefs();
          this.updateNoRowsOverlay();
          // call the getPersonalization method to apply any saved grid state
          // if (this.pageNumber === 1 && !this.hasRestoredPersonalization) {
          //   setTimeout(() => this.getPersonalization(), 50);
          // }
          if (data.length < this.pageSize) {
            clearInterval(this.intervalId); // No more pages left
            // this.gridOption.api.hideOverlay();
          } else {
            this.pageNumber++;
          }
        },
        error: () => {
          this.spinner.hide();
          this.loading = false;
          this.thorWellsData = [];
          this.totalRecords = 0;
          // this.gridOption.api.hideOverlay();
          this.updateNoRowsOverlay();
          clearInterval(this.intervalId); // Stop on error
        }
      });
  }

  initializeDropdowns() {
    this.loadLookupDropdown(LookupKeys.MaterialType, 'materialTypeList');
    this.loadLookupDropdown(LookupKeys.HoleSection, 'holeSelectionList');
    this.loadLookupDropdown(LookupKeys.HSType, 'hsTypeList');
    this.loadLookupDropdown(LookupKeys.UOM, 'uomList');
    // this.getMaterialList();
  }
  loadLookupDropdown(lookupKey: LookupKeys, listName: string) {
    this.tyrDrillingSubscription = this.masterService.getLookupValues(lookupKey).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          let data = response.data.map((item: any) => ({
            label: item.LOOKUPDISPLAYTEXT || item.LOOKUPTEXT, // Display text
            value: item.LOOKUPTEXT                           // Actual value
          }));

          // Apply sorting only for 'holeSelectionList'
          if (listName === 'holeSelectionList') {
            data = data.sort((a, b) => {
              const extractLargestNumber = (str: string) => {
                const numbers = str.match(/\d+(\.\d+)?/g); // Extract all numbers (including decimals)
                return numbers ? Math.max(...numbers.map(Number)) : 0; // Return the largest number
              };

              const numA = extractLargestNumber(a.value);
              const numB = extractLargestNumber(b.value);
              return numB - numA;
            });
          }

          this[listName] = data;
        }
      },
      error: () => {
        console.error(`Failed to load lookup values for ${lookupKey}`);
        this[listName] = [];
      }
    });
  }

  updateNoRowsOverlay() {
    if (!this.gridOption?.api) {
      return;
    }
    if (!this.thorWellsData || this.thorWellsData.length === 0) {
      this.gridOption.api.showNoRowsOverlay();
    } else {
      this.gridOption.api.hideOverlay();
    }
  }

  showCreateTaskDialog() {
    this.displayCreateTaskDialog = true;
  }

  closeCreateTaskDialog() {
    this.displayCreateTaskDialog = false;
  }
  
  onClickSave() {
    // Get only edited data from the submitted grid
    const editedRowData: Ty2Tasks[] = [];
    this.submittedGridApi.forEachNode((node) => {
      if (node.data && !node.group && node.data.isEdited) { // Only get edited data rows, not group rows
        editedRowData.push(node.data);
      }
    });

    if (editedRowData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No changes to save'
      });
      return;
    }

    // Show loading spinner
    this.spinner.show();

    // Create an array to hold all tasks to save
    const tasksToSave: Ty2Tasks[] = editedRowData.map(task => {
      // Find the status ID based on the status name
      const selectedStatus = this.statusList.find(status => status.value === task.statusName);
      const statusId = selectedStatus ? selectedStatus.id : (task.statusId || 0);
      const documentDtos: DocumentInfo[] = this.documentIds.map(id => ({ id }));

      // Prepare the task data with proper structure
      const taskToSave: Ty2Tasks = {
        id: task.id || 0,
        wellId: this.selectedWellId || 0,
        taskTypeId: task.taskTypeId || 0,
        supplierId: task.supplierId || 0,
        statusId: statusId,
        // lastStatusId: task.lastStatusId || 0,
        lastStatusChangeDate: task.lastStatusChangeDate || new Date().toISOString(),
        reportNoType: task.reportNoType || null,
        batchFrom: task.batchFrom || null,
        batchTo: task.batchTo || null,
        wbsfrom: task.wbsfrom || null,
        wbsto: task.wbsto || null,
        slocfrom: task.slocfrom || null,
        slocto: task.slocto || null,
        quantity: task.quantity || 0,
        comments: task.comments || null,
        dateCompleted: task.dateCompleted || new Date().toISOString(),
        md: task.md || null,
        projectFrom: task.projectFrom || null,
        daysinSubmittedStatus: task.daysinSubmittedStatus || 0,
        daysinPendingStatus: task.daysinPendingStatus || 0,
        userIdCreatedBy: task.userIdCreatedBy || this.userDetails?.id || 0,
        dateCreated: task.dateCreated || new Date().toISOString(),
        userIdLastModifiedBy: this.userDetails?.uid,
        dateLastModified: new Date().toISOString(),
        assignedTo: task.assignedTo || 0,
        wellName: task.wellName || this.selectedwellName || '',
        supplierName: task.supplierName || '',
        statusName: task.statusName || '',
        documents: documentDtos,
        // lastStatusName: task.lastStatusName || '',
        // attachment: task.attachment || ''
      };

      return taskToSave;
    });

    // Execute save operation with array of tasks
    this.tyrDrillingSubscription = this.tyr2TasksService.addorUpdateTyrTasks(tasksToSave).subscribe({
      next: (result) => {
        this.spinner.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Successfully saved ${tasksToSave.length} task(s)`
        });

        // Clear the edited flags
        this.submittedGridApi.forEachNode((node) => {
          if (node.data && node.data.isEdited) {
            node.data.isEdited = false;
          }
        });

        // Refresh the grid data after successful save
        this.loadTasksByWellId();
      },
      error: (error) => {
        this.spinner.hide();
        console.error('Error saving tasks:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save tasks. Please try again.'
        });
      }
    });
  }

  resetTaskGrid() {
    // Reload the original data to reset any unsaved changes
    this.loadTasksByWellId();

    // Clear any edited flags and refresh the grid
    if (this.submittedGridApi) {
      this.submittedGridApi.forEachNode((node) => {
        if (node.data && node.data.isEdited) {
          node.data.isEdited = false;
        }
      });

      // Refresh the grid display
      this.submittedGridApi.refreshCells({ force: true });

      // Re-expand all groups to maintain the grouped view
      setTimeout(() => {
        this.submittedGridApi.expandAll();
      }, 100);
    }


    // Comparator view changes
    if (this.comparatorWellGridApi) {
      this.comparatorWellGridApi.forEachNode((node) => {
        if (node.data && node.data.isEdited) {
          node.data.isEdited = false;
        }
      });

      // Refresh the grid display
      this.comparatorWellGridApi.refreshCells({ force: true });

      // Re-expand all groups to maintain the grouped view
      setTimeout(() => {
        this.comparatorWellGridApi.expandAll();
      }, 100);
    }

  }

  loadTasksByWellId(): void {
    // Setting the latest selected well as an comparator well
    if (this.selectedWellId) {
      this.tyrDrillingSubscription = this.tyr2TasksService.getTasksByWellId(this.selectedWellId).subscribe({
        next: (response: any) => {
          let tasks = response as Ty2Tasks[];
            
            // Filter out Completed tasks unless showCompletedTasks is true
            if (!this.showCompletedTasks) {
              tasks = tasks.filter(task => task.statusName !== Tyr2TaskStatus.Completed);
            }
            // Sort tasks by status in the desired order: Submitted -> Pending -> Completed -> Others
            tasks = this.sortTasksByStatus(tasks);
            this.submittedRowData = this.submittedTableData = tasks;

          // Adding the options to the filter dropdown
          this.submittedRowData.forEach(element => {
            const supplierValue = element['supplierName'];
            if (supplierValue) {
              if (!this.tyrFilteredDropDownValue['supplierName']) {
                this.tyrFilteredDropDownValue['supplierName'] = [];
              }
              if (!this.tyrFilteredDropDownValue['supplierName'].includes(supplierValue)) {
                this.tyrFilteredDropDownValue['supplierName'].push(supplierValue);
              }
            }

            const statusValue = element['statusName'];
            if (statusValue) {
              if (!this.tyrFilteredDropDownValue['statusName']) {
                this.tyrFilteredDropDownValue['statusName'] = [];
              }
              if (!this.tyrFilteredDropDownValue['statusName'].includes(statusValue)) {
                this.tyrFilteredDropDownValue['statusName'].push(statusValue);
              };
            }
          });

          // Auto-expand all groups after data is loaded
          setTimeout(() => {
            if (this.submittedGridApi) {
              this.submittedGridApi.expandAll();
            }
          }, 50);
        },
        error: (error: any) => {
          // console.error('Error loading tasks:', error);
          this.submittedRowData = [];
        }
      });
    } else {
      this.submittedRowData = [];
    }
    this.loadComparatorWellData();
  }

  // Loading & Setting comparator well data
  loadComparatorWellData(): void {
    if (this.comparatorWellId && this.isComparatorViewSelected()) {
      this.tyrDrillingSubscription = this.tyr2TasksService.getTasksByWellId(this.comparatorWellId).subscribe({
        next: (response: any) => {
          let tasks = response as Ty2Tasks[];

          // Sort tasks by status in the desired order: Submitted -> Pending -> Completed -> Others
          tasks = this.sortTasksByStatus(tasks);

          this.comparatorRowData = this.comparatorTableData = tasks;

          // Adding the options to the filter dropdown
          this.comparatorRowData.forEach(element => {
            const supplierValue = element['supplierName'];
            if (supplierValue) {
              if (!this.tyrFilteredDropDownValue['supplierName']) {
                this.tyrFilteredDropDownValue['supplierName'] = [];
              }
              if (!this.tyrFilteredDropDownValue['supplierName'].includes(supplierValue)) {
                this.tyrFilteredDropDownValue['supplierName'].push(supplierValue);
              }
            }

            const statusValue = element['statusName'];
            if (statusValue) {
              if (!this.tyrFilteredDropDownValue['statusName']) {
                this.tyrFilteredDropDownValue['statusName'] = [];
              }
              if (!this.tyrFilteredDropDownValue['statusName'].includes(statusValue)) {
                this.tyrFilteredDropDownValue['statusName'].push(statusValue);
              };
            }
          });

          // Auto-expand all groups after data is loaded
          setTimeout(() => {
            if (this.comparatorWellGridApi) {
              this.comparatorWellGridApi.expandAll();
            }
          }, 50);
        },
        error: (error: any) => {
          // console.error('Error loading tasks:', error);
          this.comparatorRowData = [];
        }
      });
    } else {
      this.comparatorRowData = [];
    }
  }

  uploadedFileType(event: any) {

    this.isCVXPODocumentUploaded = false;

    if (event === true) {
      this.isCVXPODocumentUploaded = true;
    }

  }

  onClose() {
    if (this.isCVXPODocumentUploaded)
      this.thorService.cachedDrillingMaterialsData = {};
    this.selectedDocument = "";
    this.selectedView = 0;
    this.entityId = 0;
    this.entityType = ""
    this.displayfileUploadInteractiveDialog = false;
  }

  onFileUploadClose() {
    this.selectedDocument = "";
    this.selectedView = 0;
    this.entityId = 0;
    this.entityType = "";
    this.displayfileUploadInteractiveDialog = false;

    // Refresh the submitted grid data to show any new attachments
    this.loadTasksByWellId();
  }

  private sortTasksByStatus(tasks: Ty2Tasks[]): Ty2Tasks[] {
    const statusOrder = ['Submitted', 'Pending', 'Completed'];

    return tasks.sort((a, b) => {
      const indexA = statusOrder.indexOf(a.statusName);
      const indexB = statusOrder.indexOf(b.statusName);

      // If both statuses are in the predefined order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // If only one status is in the predefined order, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // If neither is in the predefined order, use alphabetical sort
      return (a.statusName || '').localeCompare(b.statusName || '');
    });
  }

  handleTaskSave(event: any): void {
    // Handle the save event from the task creation dialog
    if (event && event.success) {
      this.loadTasksByWellId(); // Reload tasks after creation
    } else if (event && !event.success) {
      // Handle error case if needed
    }
    // Only close dialog if not 'Save and Create Another'
    if (!event.createAnother) {
      this.closeCreateTaskDialog();
    }
  }

  documentIdsEmitter(event: any) {
    if (event && event.length > 0) {
      this.documentIds = event;
    }
  }

  //API call for saving attachment task
  saveAttachmentTask(data: any): void {
    // Only proceed if statusName is 'Submitted'
    if (data.statusName !== Tyr2TaskStatus.Submitted) return;
    // Find the Pending status object by name
    const selectedStatus = this.statusList.find(status => status.value === Tyr2TaskStatus.Pending);
    const statusId = selectedStatus ? selectedStatus.id : null;
    if (!statusId) return; // If Pending status not found, do not proceed
    const documentDtos: DocumentInfo[] = this.documentIds.map(id => ({ id }));

    const taskToSave: Ty2Tasks = {
      id: data.id || 0,
      wellId: this.selectedWellId || 0,
      supplierId: data.supplierId || 0,
      statusId: statusId,
      taskTypeId: data.taskTypeId || 0,
      lastStatusChangeDate: data.lastStatusChangeDate || new Date().toISOString(),
      reportNoType: data.reportNoType || null,
      batchFrom: data.batchFrom || null,
      batchTo: data.batchTo || null,
      wbsfrom: data.wbsfrom || null,
      wbsto: data.wbsto || null,
      slocfrom: data.slocfrom || null,
      slocto: data.slocto || null,
      quantity: data.quantity || 0,
      comments: data.comments || null,
      dateCompleted: data.dateCompleted || new Date().toISOString(),
      md: data.md || null,
      projectFrom: data.projectFrom || null,
      daysinSubmittedStatus: data.daysinSubmittedStatus || 0,
      daysinPendingStatus: data.daysinPendingStatus || 0,
      userIdCreatedBy: data.userIdCreatedBy || this.userDetails?.id || 0,
      dateCreated: data.dateCreated || new Date().toISOString(),
      userIdLastModifiedBy:this.userDetails?.uid,
      dateLastModified: new Date().toISOString(),
      assignedTo: data.assignedTo || 0,
      wellName: data.wellName || this.selectedwellName || '',
      supplierName: data.supplierName || '',
      documents: documentDtos,
    };

    this.spinner.show();
    this.tyrDrillingSubscription = this.tyr2TasksService.addorUpdateTyrTasks([taskToSave]).subscribe({
      next: (result) => {
        this.spinner.hide();
        this.loadTasksByWellId();
      },
      error: (error) => {
        this.spinner.hide();
      }
    });
  }

    // Handler for Completed checkbox toggle
    onCompletedCheckboxChange() {
      this.loadTasksByWellId();
    }
}
