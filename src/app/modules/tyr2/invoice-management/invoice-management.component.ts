import { Component, effect, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GridApi, SideBarDef } from 'ag-grid-community';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AccessControls } from '../../../common/constant';
import { DocumentTypeEnum, Tyr2InvoiceStatus } from '../../../common/enum/common-enum';
import { DocumentEntityTypes } from '../../../common/enum/document-entity-types';
import { ConfigurationValues } from '../../../common/model/configuration-values';
import { Tyr2Invoice } from '../../../common/model/tyr2-invoice.model';
import { UserPrimaryRole } from '../../../common/model/UserInfo';
import { WellDetails } from '../../../common/model/WellDetails';
import { AuthService } from '../../../services';
import { CommonService } from '../../../services/common.service';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { LookupsService } from '../../../services/lookups.service';
import { Tyr2InvoiceService } from '../../../services/tyr2-invoice.service';
import { UserService } from '../../../services/user.service';
import { WellService } from '../../../services/well.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ListEditorBuilderService } from '../../common/builders/list-editor-builder.service';
import { DeleteConfirmationDialogComponent } from '../../common/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { FileUploadWithButtonComponent } from '../../common/file-upload-interactive-dialog/file-upload-interactive-dialog.component';
import { InteractiveToolbarComponent } from '../../common/interactive-toolbar/interactive-toolbar.component';
import { CommonTyrBuilderService } from '../services/common-tyr-builder.service';
import { InvoiceBuilderService } from './Service/invoice-builder.service';
import { ChatComponent } from '../../common/chat/chat.component';

@Component({
  selector: 'app-invoice-management',
  templateUrl: './invoice-management.component.html',
  styleUrl: './invoice-management.component.scss',
    standalone: true,
    imports: [...PRIME_IMPORTS, 
      InteractiveToolbarComponent,
      DeleteConfirmationDialogComponent,
      FileUploadWithButtonComponent,
      ChatComponent
    ],
    providers: [ UserService,
     ConfigurationValuesService,
    FormBuilder,
     Tyr2InvoiceService,
    MessageService,
    NgxSpinnerService,
    LookupsService,
    AuthService,
    CommonService,]
})
export class InvoiceManagementComponent implements OnInit, OnDestroy {
  static isActive: boolean = false;
  includeCompleted: boolean = false;
  rejectForm: FormGroup;
  gridApi: any;
  materialCoordinatorsList: UserPrimaryRole[] = [];
  wellList: Array<WellDetails> = [];
  statusList: Array<ConfigurationValues> = [];
  buCodeList: Array<ConfigurationValues> = [];
  rigList: Array<ConfigurationValues> = [];
  projectList: Array<ConfigurationValues> = [];
  reasonCodeList: Array<ConfigurationValues> = [];
  supplierList: Array<ConfigurationValues> = [];
  deleteUserRow: any;
  selectedRow: any;
  showDeleteUserDialog: boolean = false;
  showRejectInvoiceModal: boolean = false;
  rowData: Tyr2Invoice[] = [];
  submittedGridApi: GridApi;
  selectedEntity: string = '';
  selectedView: number;
  entityType: string;
  entityId: number;
  isUpdateEditable: boolean = true;
  selectedDocument: string;
  wellDocumentTypes: any;
  currentInvoiceData: any = null; // Store current invoice data for attachment dialog
  wellDetails: {
    id: number;
    wellNumber: number;
    wellName: string;
    appId: number;
    functionId: number;
  } | null = null;
  displayfileUploadInteractiveDialog: boolean = false;
  isCVXPODocumentUploaded = false;
  functionId: number = 1;
  appId: number;
  documentIds: number[] = [];
  selectedSupplier: any[] = [];
  selectedStatus: any[] = [];
  originalRowData: Tyr2Invoice[] = [];
  quickFilterText: string = '';
  columnDefs = [];
  roomName: string = 'TYR';
  // Subscription to manage API call subscriptions and prevent memory leaks
  private invoiceDataSubscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private lookupService: LookupsService,
    private authService: AuthService,
    private commonService: CommonService,
  private listEditorBuilderService: ListEditorBuilderService,
  private invoiceBuilderService: InvoiceBuilderService,
  private commonTyrBuilderService: CommonTyrBuilderService,
  private wellService: WellService
  ) {
    this.rejectForm = this.fb.group({
      reason: [''],
      rejectionComment: ['']
    });
    effect(() => {
  this.appId = this.listEditorBuilderService.selectedApplicationId(); //getting Dynamic appId based on Application
  this.fetchWellsForDropdown(); // Fetch wells
  const tasks = this.invoiceBuilderService.invoices();
  this.originalRowData = tasks;
  this.quickFilterText = this.commonTyrBuilderService.selectedFilterText();
  this.applyCombinedFilter();
    });
    // Listen to all dropdown signals and update local arrays in a single effect
    effect(() => {
      this.materialCoordinatorsList = this.invoiceBuilderService.materialCoordinatorsList();
      this.statusList = this.invoiceBuilderService.statusList();
      this.buCodeList = this.invoiceBuilderService.buCodeList();
      this.rigList = this.invoiceBuilderService.rigList();
      this.reasonCodeList = this.invoiceBuilderService.reasonCodeList();
      this.projectList = this.invoiceBuilderService.projectList();
      this.supplierList = this.invoiceBuilderService.supplierList();
    });
  }

  // Unsubscribe from all subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    this.invoiceDataSubscription.unsubscribe();
  }


  ngOnInit() {
  InvoiceManagementComponent.isActive = true;
  this.getUserDetails();
  this.loadMaterialCoordinators();
  this.getStatusList();
  this.invoiceBuilderService.loadInvoices();
  this.getBUCode();
  this.getRigList();
  this.getProjectList();
  this.getReasonCode();
  this.getSupplierList();
  // this.fetchWellsForDropdown();
  this.initializeColumnDefs();
  this.invoiceBuilderService.invoiceCreated$.subscribe(() => {
    this.loadInvoiceTasks();
  });
  }

  // Get user details and set access
  getUserDetails() {
    let userAccess = this.authService.isAuthorized(AccessControls.INVOICE_MANAGEMENT);
    this.commonService.setuserAccess(userAccess);
  }
  // Load Material Coordinators
  public invoiceSideBar: SideBarDef | string | string[] | boolean | null = {
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
 
  initializeColumnDefs() {
    this.columnDefs = [
    { headerName: 'Sender', field: 'sender' },
    { headerName: 'PO/Invoice Number', field: 'invoiceNumber', minWidth: 200 },
    {
      headerName: 'Date/Time Received',
      field: 'dateCreated',
      minWidth: 200,
      sortable: true,
      filter: true,
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'MM/dd/yyyy HH:mm',
      },
      valueGetter: (params) => {
        if (params.data.dateCreated === undefined || params.data.dateCreated === null) {
          return null;
        }
        return params.data.dateCreated;
      },
      valueFormatter: (params) => {
        const date = new Date(params.value);
        if (!params.value || isNaN(date.getTime())) {
          return '';
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}/${day}/${year} ${hours}:${minutes}`;
      },
      onCellValueChanged: (params) => {
        const newDate = new Date(params.newValue);
        if (!params.newValue || isNaN(newDate.getTime()) || newDate.getTime() === 0) {
          if (params.oldValue === params.newValue) {
            return;
          }
          if (params.data.dateCreated != null) {
            return;
          }
          params.api.getRowNode(params.node.id).setDataValue('dateCreated', params.oldValue);
        } else {
          // Normalize to remove seconds/milliseconds
          const normalizedDate = new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate(),
            newDate.getHours(),
            newDate.getMinutes()
          );
          if (params.oldValue !== normalizedDate.getTime()) {
            params.api.getRowNode(params.node.id).setDataValue('dateCreated', normalizedDate);
          }
        }
      }
    },
    {
  headerName: 'Well Name',
  field: 'wellName',
  minWidth: 150,
  editable: this.authService.isFieldEditable('wellName'),
  cellEditor: 'agRichSelectCellEditor',
  cellEditorParams: (params: any) => {
    const allWells = this.wellList.map(well => well.wellName);
    if (params.data && params.data.isIncorrectWellName && params.data.incorrectWellName) {
      const input = params.data.incorrectWellName.trim().toLowerCase();
      const matches = allWells.filter(v => v.toLowerCase().includes(input));
      return {
        values: matches.length > 0 ? matches : allWells,
        allowTyping: true
      };
    }
    return {
      values: allWells,
      allowTyping: false
    };
  },
  cellStyle: (params: any) => {
    if (params.data && params.data.isIncorrectWellName) {
      return {
        'background-color': 'var(--theme-red-color-op25)',
        'border-color': 'var(--theme-red-color-op25)'
      };
    }
    return null;
  },
  valueFormatter: (params) => {
    if ((!params.value || params.value === '') && params.data && params.data.incorrectWellName) {
      return params.data.incorrectWellName;
    }
    const well = this.wellList.find(w => w.wellName === params.value);
    return well ? well.wellName : (params.value || params.data.incorrectWellName || '');
  },
  valueSetter: (params) => {
    if (params.data && params.data.isIncorrectWellName) {
      const well = this.wellList.find(w => w.wellName === params.newValue);
      if (well) {
        params.data.wellName = well.wellName;
        params.data.wellId = well.id;
        params.data.incorrectWellName = '';
      } else {
        params.data.wellName = '';
        params.data.wellId = null;
        params.data.incorrectWellName = params.newValue;
      }
      return true;
    } else {
      const well = this.wellList.find(w => w.wellName === params.newValue);
      if (well) {
        params.data.wellName = well.wellName;
        params.data.wellId = well.id;
      } else {
        params.data.wellName = '';
        params.data.wellId = null;
      }
      return true;
    }
  }
},
    {
      headerName: 'Status',
      field: 'statusName',
      minWidth: 120,
      cellEditor: 'agSelectCellEditor',
      editable: this.authService.isFieldEditable('statusName'),
      rowGroup: true,
      cellEditorParams: (params: any) => {
        return {
          values: this.statusList.map(s => s.value)
        };
      },
      valueFormatter: (params) => {
        const item = this.statusList.find((status) => status.value === params.value);
        return item ? item.value : params.value;
      },
      valueSetter: (params) => {
        const status = this.statusList.find(s => s.value === params.newValue);
        if (status) {
          params.data.statusName = status.value;
          params.data.statusId = status.id;
          // Show Reject Invoice dialog only when 'Reject' is selected
          if (status.value === Tyr2InvoiceStatus.Rejected) {
            this.selectedRow = params.data;
            this.showRejectInvoiceModal = true;
          }
          return true;
        }
        return false;
      },
    },
    {
      headerName: 'Supplier',
      field: 'supplierName',
      minWidth: 140,
      cellEditor: 'agSelectCellEditor',
      rowGroup: true,
      cellEditorParams: (params: any) => {
        return {
          values: this.supplierList.map(supplier => supplier.value)
        };
      },
      valueFormatter: (params) => {
        const supplier = this.supplierList.find(supplier => supplier.value === params.value);
        return supplier ? supplier.value : params.value;
      },
      valueSetter: (params) => {
        const supplier = this.supplierList.find(s => s.value === params.newValue);
        if (supplier) {
          params.data.supplierName = supplier.value;
          params.data.supplierId = supplier.id; // <-- Set supplierId here
          return true;
        }
        return false;
      }
    },
    {
      headerName: 'Attachments',
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
      minWidth: 160,
      onCellClicked: (params: any) => {
        this.openAttachmentUploadDialog(params.data);
        if (params.data.statusName === Tyr2InvoiceStatus.Submitted || params.data.statusName === Tyr2InvoiceStatus.ReadyToProcess) {
          this.saveAttachmentTask(params.data);
        }
      },
      sortable: false,
      suppressHeaderMenuButton: true
    },
    {
      headerName: 'Reason Code',
      field: 'reasonCodeValue',
      minWidth: 160,
      hide: true,
      cellEditor: 'agSelectCellEditor',
      editable: this.authService.isFieldEditable('reasonCodeValue'),
      cellEditorParams: (params: any) => {
        return {
          values: this.reasonCodeList.map(reason => reason.value)
        };
      },
      valueFormatter: (params) => {
        const reason = this.reasonCodeList.find(reason => reason.value === params.value);
        return reason ? reason.value : params.value;
      },
      valueSetter: (params) => {
        const reason = this.reasonCodeList.find(r => r.value === params.newValue);
        if (reason) {
          params.data.reasonCodeValue = reason.value;
          params.data.reasonCodeId = reason.id;
          return true;
        }
        return false;
      }
    },
    {
      headerName: 'BU',
      field: 'buValue',
      minWidth: 100,
      hide: true,
      cellEditor: 'agSelectCellEditor',
      editable: this.authService.isFieldEditable('buValue'),
      cellEditorParams: (params: any) => {
        return {
          values: this.buCodeList.map(bu => bu.value)
        };
      },
      valueFormatter: (params) => {
        const bu = this.buCodeList.find(bu => bu.value === params.value);
        return bu ? bu.value : params.value;
      },
      valueSetter: (params) => {
        const bu = this.buCodeList.find(b => b.value === params.newValue);
        if (bu) {
          params.data.buValue = bu.value;
          params.data.buId = bu.id;
          return true;
        }
        return false;
      }
    },
    {
      headerName: 'User',
      field: 'assignTo',
      minWidth: 120,
      cellEditor: 'agSelectCellEditor',
      hide: true,
      editable: this.authService.isFieldEditable('assignTo'),
      cellEditorParams: (params: any) => {
        return {
          values: this.materialCoordinatorsList.map(mc => mc.fullName)
        };
      },
      valueFormatter: (params) => {
        const user = this.materialCoordinatorsList.find(mc => mc.userId === params.value || mc.fullName === params.value);
        return user ? user.fullName : params.value;
      },
      valueGetter: (params) => {
        const user = this.materialCoordinatorsList.find(mc => mc.userId === params.data.assignTo);
        return user ? user.fullName : params.data.assignTo;
      },
      valueSetter: (params) => {
        const user = this.materialCoordinatorsList.find(mc => mc.fullName === params.newValue);
        if (user) {
          params.data.assignTo = user.userId;
          return true;
        }
        return false;
      }
    },
    // { headerName: 'Well', field: 'well', minWidth: 120, hide: true },
    {
      headerName: 'Project',
      field: 'projectValue',
      minWidth: 140,
      hide: true,
      cellEditor: 'agSelectCellEditor',
      editable: this.authService.isFieldEditable('projectValue'),
      cellEditorParams: (params: any) => {
        return {
          values: this.projectList.map(project => project.value)
        };
      },
      valueFormatter: (params) => {
        const project = this.projectList.find(project => project.value === params.value);
        return project ? project.value : params.value;
      },
      valueSetter: (params) => {
        const project = this.projectList.find(p => p.value === params.newValue);
        if (project) {
          params.data.projectValue = project.value;
          params.data.projectId = project.id;
          return true;
        }
        return false;
      }
    },
    {
      headerName: 'Rig',
      field: 'rigName',
      minWidth: 120,
      cellEditor: 'agSelectCellEditor',
      editable: this.authService.isFieldEditable('rigName'),
      cellEditorParams: (params: any) => {
        return {
          values: this.rigList.map(rig => rig.value)
        };
      },
      valueFormatter: (params) => {
        const rig = this.rigList.find(rig => rig.value === params.value);
        return rig ? rig.value : params.value;
      },
      valueSetter: (params) => {
        const rig = this.rigList.find(r => r.value === params.newValue);
        if (rig) {
          params.data.rigName = rig.value;
          params.data.rigId = rig.id;
          return true;
        }
        return false;
      }
    },
    {
      headerName: 'Days in Current Status',
      field: 'daysInCurrentStatus',
      minWidth: 220,
      cellStyle: (params: any) => {
        if (params.data && params.data.isThresholdReached) {
            return {
              'background-color': 'var(--theme-red-color-op25)',
              'border-color': 'var(--theme-red-color-op25)',
            };
        }
        return null;
      }
    },
    { headerName: 'Comments', field: 'comments', minWidth: 150, hide: true, editable: this.authService.isFieldEditable('comments'), cellEditor: 'agLargeTextCellEditor', cellEditorPopup: true },
    {
      headerName: 'Action',
      field: 'action',
      valueGetter: () => '',
      cellRenderer: () => {
        return `
            <div class="action-btn-container">
            <button pButton type="button" class="p-ripple p-element chv-red-btnsm p-button p-component custom-button-class delete-bg-transparent" data-action="delete" pTooltip="Delete" tooltipPosition="top">
                <i class="pi pi-trash delete-button-icon pr-2" data-action="delete"></i>
              </button>
            </div>`;
      },
      editable: false,
      cellClass: 'action-button-add',
      filter: false,
      maxWidth: 200,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
      onCellClicked: (params: any) => {
        // Determine which button was clicked
        const event = params.event;
        const target = event?.target;
        if (target) {
          const action = target.getAttribute('data-action') || (target.closest('button') && target.closest('button').getAttribute('data-action'));
          if (action === 'add') {
            this.onAddAction(params.data);
          } else if (action === 'delete') {
            this.onDeleteAction(params.data);
          }
        }
      }
    }
  ];
  }
  // Fetch wells for dropdown and initialize columns
  fetchWellsForDropdown() {
    this.invoiceDataSubscription = this.wellService.getAllWells(this.appId, this.functionId).subscribe((wells: WellDetails[]) => {
      this.wellList = wells;
    });
  }
  
  // Handle supplier selection from toolbar
  onSupplierSelected(selectedSuppliers: any[]) {
    this.selectedSupplier = selectedSuppliers;
    this.applyCombinedFilter();
  }
  // Handle status selection from toolbar
  onStatusSelected(selectedStatuses: any[]) {
    this.selectedStatus = selectedStatuses;
    this.applyCombinedFilter();
  }

  // Filter rowData based on selected suppliers and statuses
  applyCombinedFilter() {
    let filtered = [...this.originalRowData];
    if (Array.isArray(this.selectedSupplier) && this.selectedSupplier.length > 0) {
      filtered = filtered.filter(row =>
        this.selectedSupplier.some(supplier => supplier.id === row.supplierId)
      );
    }
    if (Array.isArray(this.selectedStatus) && this.selectedStatus.length > 0) {
      filtered = filtered.filter(row =>
        this.selectedStatus.some(status => status.id === row.statusId)
      );
    }
    const completedSelected = this.selectedStatus.some(status => status.value === Tyr2InvoiceStatus.Completed);
    if (!this.includeCompleted && !completedSelected) {
      filtered = filtered.filter(row => row.statusName !== Tyr2InvoiceStatus.Completed);
    }
    this.rowData = filtered;
  }
  // Handler for Completed checkbox change
  onCompletedCheckboxChange(event: any) {
    this.includeCompleted = event.checked;
    this.applyCombinedFilter();
  }

  onAddAction(row: any) {
    this.selectedRow = row;
    this.showRejectInvoiceModal = true;
  }

  onDeleteAction(row: any) {
    this.deleteUserRow = row;
    this.showDeleteUserDialog = true;
  }
  // Grid ready event
  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  closeDeleteUserDialog(): void {
    this.showDeleteUserDialog = false;
  }

  onRejectInvoiceModalClose() {
    this.showRejectInvoiceModal = false;
  }

   // Grid options for row grouping
  gridOptions = {
    groupDefaultExpanded: -1, // Expand all levels by default
    animateRows: true,
    groupDisplayType: 'groupRows' as const,
    suppressAggFuncInHeader: true,
    autoGroupColumnDef: {
      headerName: 'Status',
      minWidth: 200,
      cellStyle: (params: any) => {
        if (params.node.group) {
          return { fontWeight: 'bold', fontSize: '20px' };
        }
        return null;
      },
      cellRendererParams: {
        suppressCount: false, // Show count of items in each group
        checkbox: false
      }
    },
    getRowStyle: (params: any) => {
      if (params.node.group) {
        return { fontWeight: 'bold' };
      }
      return null;
    },
//      // ✅ Add zebra striping with rowClassRules
//   rowClassRules: {
//   // Only apply zebra striping to non-group rows
//   'ag-row-even-custom': params => !params.node.group && params.node.rowIndex % 2 === 0,
//   'ag-row-odd-custom': params => !params.node.group && params.node.rowIndex % 2 !== 0,
//   // Darker grey for group rows
//   'ag-row-group-dark': params => params.node.group
// }

  };

  
  //Save attachment task and update status if needed
  saveAttachmentTask(data: any) {
    this.invoiceBuilderService.saveAttachmentTask(
      data,
      this.statusList,
      this.documentIds,
    );
  }

  onRejectInvoice() {
    const reasonCodeId = this.rejectForm.get('reason')?.value;
    const comments = this.rejectForm.get('rejectionComment')?.value;
    this.invoiceBuilderService.rejectInvoice(
      this.selectedRow,
      reasonCodeId,
      comments,
      this.documentIds,
      () => {
        this.showRejectInvoiceModal = false;
        this.loadInvoiceTasks(); // Refresh the grid after rejection
      }
    );
  }

  // Mark row as edited when a cell value changes
  onCellValueChanged(params: any) {
    if (params && params.data) {
      params.data.isEdited = true;
    }
  }

  onDeleteUserConfirm(): void {
    this.invoiceBuilderService.deleteInvoice(
      this.deleteUserRow.id
    );
    this.loadInvoiceTasks(); // Refresh the grid
    this.closeDeleteUserDialog(); // Close the dialog
  }

  // Fetching the material coordinators for the dropdown (via builder service)
  loadMaterialCoordinators(): void {
    this.invoiceBuilderService.loadMaterialCoordinators();
  }
  // Fetching the status list for the dropdown (via builder service)
  getStatusList() {
    this.invoiceBuilderService.getStatusList();
  }
  // Fetching the BU codes for the dropdown (via builder service)
  getBUCode() {
    this.invoiceBuilderService.getBUCode();
  }
  // Fetching the Rig list for the dropdown (via builder service)
  getRigList() {
    this.invoiceBuilderService.getRigList();
  }
  // Fetching the Reason codes for the dropdown (via builder service)
  getReasonCode() {
    this.invoiceBuilderService.getReasonCode();
  }
  // Fetching the Project list for the dropdown (via builder service)
  getProjectList() {
    this.invoiceBuilderService.getProjectList();
  }
  // Fetching the Supplier list for the dropdown (via builder service)
  getSupplierList() {
    this.invoiceBuilderService.getSupplierList();
  }

  // Load invoice tasks from API
  loadInvoiceTasks(): void {
    this.invoiceBuilderService.loadInvoices();
  }
  //Reset the grid to original state
  resetTaskGrid() {
    this.loadInvoiceTasks();
  }
  // Save only edited rows to the API
  onClickSave() {
    this.invoiceBuilderService.saveEditedInvoices(
      this.gridApi,
      this.documentIds,
      () => {
        this.loadInvoiceTasks(); // This will refresh the grid after save
      }
    );
  }
  // Open the upload dialog box
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
    this.currentInvoiceData = data;
    // Set the entity ID to the task ID for TYR attachments
    this.entityId = data.id;
    // Use separate appId property for attachments
    this.openUploadDialogBox(DocumentEntityTypes.TYR, data);
  }
  // Fetch document types for the given entity type
  getWellDocumentTypes(entityType: any, data?: any, selectedView?: any) {
    this.invoiceDataSubscription = this.lookupService
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
              const invoiceDoc = this.wellDocumentTypes.find(x => x.name === DocumentTypeEnum.Invoice);
              this.selectedView = selectedView ?? (invoiceDoc ? invoiceDoc.id : (this.wellDocumentTypes.length > 0 ? this.wellDocumentTypes[0].id : null));
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

  uploadedFileType(event: any) {

    this.isCVXPODocumentUploaded = false;

    if (event === true) {
      this.isCVXPODocumentUploaded = true;
    }

  }


  onFileUploadClose() {
    this.selectedDocument = "";
    this.selectedView = 0;
    this.entityId = 0;
    this.entityType = "";
    this.displayfileUploadInteractiveDialog = false;

    // Refresh the submitted grid data to show any new attachments
    this.loadInvoiceTasks();
  }

}
