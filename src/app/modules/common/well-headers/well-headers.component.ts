import { Component, effect, EventEmitter, input, Input, OnInit, Output } from '@angular/core';
import { GridApi, GridOptions } from 'ag-grid-community';
import { WellService } from '../../../services/well.service';
import { WellDetails } from '../../../common/model/WellDetails';
import { LookupsService } from '../../../services/lookups.service';
import { WellTypesInfo } from '../../../common/model/wellTypes';
import { AuthService, MasterService } from '../../../services';
import { MasterObjectKeys } from '../../../common/enum/master-object-keys';
import { MessageService } from 'primeng/api';
import { CustomButtonPublishToThor } from '../customButtons/customButton.component';
import { CommonService } from '../../../services/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomDeleteButton } from '../../schematic/customDeleteButton.component';
import { PublishWellRequest } from '../../../common/model/publish-well-request';
import { OdinV2Service } from '../../../services/odinv2.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PlanningEnginner } from '../../../common/model/planningEngineer';
import { EditWellHeadstoreService } from '../../odinv3/services/editwellheadbuilder.service';
import { UpdateMaterialDemandRequest } from '../../../common/model/update-material-demand-request';
import { WellheadkitService } from '../../../services/wellheadkit.service';
import { AssemblyCustomButtonsComponent } from '../customButtons/assembly-custom-buttons/assembly-custom-buttons.component';
import { AccessControls } from '../../../common/constant';
import { OdinCommonService } from '../../odinv3/services/odin-common.service';
import { firstValueFrom } from 'rxjs';
import { CellEditor } from 'primeng/table';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { CustomDialogComponent } from '../custom-dialog/custom-dialog.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ExportToThorDialogComponent } from '../export-to-thor-dialog/export-to-thor-dialog.component';
import { CloneWellDialogComponent } from '../clone-well-dialog/clone-well-dialog.component';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { SelectedWellBuilderService } from '../../tyr2/services/selected-well-builder.service';
import { AddWellsRequest } from '../../../common/model/add-wells-request';
import { Tyr2TasksService } from '../../../services/tyr2-tasks.service';
import { ListEditorBuilderService } from '../builders/list-editor-builder.service';
import { CommonDisplayMessages, MessageSeverityTypes } from '../../../common/enum/common-enum';

@Component({
  selector: 'app-well-headers',
  standalone: true,
  imports: [...PRIME_IMPORTS,
    CustomDialogComponent,
    ConfirmationDialogComponent,
    ExportToThorDialogComponent,
    CloneWellDialogComponent,
    DeleteConfirmationDialogComponent
  ],
  templateUrl: './well-headers.component.html',
  styleUrl: './well-headers.component.scss',
})
export class WellHeadersDialogComponent implements OnInit {
  // Inputs and Outputs

  @Input() displayEditWellHeaders: boolean = false;
  @Input() isWellHeaders: boolean = true;
  @Input() dialogHeader: string = 'Edit Well Headers';
  // @Input() isCompletions: boolean = true;
  @Output() onClose = new EventEmitter<boolean>(); // Emit when the dialog is closed
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
  tyrColumnDefs = [];
  wellDetails: WellDetails[] = [];
  wellTypes: WellTypesInfo[] = [];
  changedRows: WellDetails[] = [];
  wellmaterials: any[] = [];
  odinData: any;
  userDetail: any;
  plantList: any[] | undefined;
  globalFilter: string = '';
  searchText: string = '';
  @Input() functionId: number = 1; // Default to Drilling
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
  isCloneWell: boolean = false;
  materialDemandPayload: UpdateMaterialDemandRequest[] = []; // declare update material modelas a array
  visible: boolean = false;
  pendingKitChange: { params: any; newValue: any; rowId: any } | null = null;
  oldValue: string;
  newValue: string;
  wellCreated: boolean = false; // Flag to indicate if a new well was created
  wellNameChanged: any; // Variable to store the changed well name
  userAccess: any;
  CreateWellAccess: boolean = false;

  // Tyr added
  @Input() isTyr: boolean = false;
  selectedTyrWells: any[];
  confirmationMessage: string = CommonDisplayMessages.wellHeaderConfirmation;
  confirmationTitle: string = CommonDisplayMessages.wellHeaderConfirmationTitle;

  constructor(
    private wellService: WellService,
    private lookupService: LookupsService,
    private masterService: MasterService,
    private messageService: MessageService,
    private commonService: CommonService,
    private authService: AuthService,
    private odinV2Service: OdinV2Service,
    private sanitizer: DomSanitizer,
    private spinner: NgxSpinnerService,
    private store: EditWellHeadstoreService,
    private builderService: SelectedWellBuilderService,
    private tyr2TasksService: Tyr2TasksService,
    private listEditorBuilderService: ListEditorBuilderService,
    private wellheadkitService: WellheadkitService
  ) { }

  // Column Definitions for the AG Grid
  initializeColumnDefs() {
    this.wellHaedersColumnDefs = [
      {
        headerName: 'Well Name',
        field: 'wellName',
        minWidth: 120,
        filter: true,
        sortable: true,
        editable: this.authService.isFieldEditable('wellName'),
      },
      {
        headerName: 'P10 Start Date',
        field: 'p10startDate',
        minWidth: 150,
        maxWidth: 200,
        editable: this.authService.isFieldEditable('p10startDate'),
        sortable: true,
        filter: true,
        cellEditor: 'agDateCellEditor', // Use AG Grid's built-in date picker (calendar)
        cellEditorParams: {
          format: 'MM/dd/yyyy', // Date format for the calendar (optional)
        },
        valueGetter: (params) => {
          // Log value to debug
          //console.log("valueGetter: ", params.data.p10startDate);

          // Ensure p10startDate is either null or valid
          if (
            params.data.p10startDate === undefined ||
            params.data.p10startDate === null
          ) {
            return null; // Return null if there is no value
          }

          // If there is a valid date, return it
          return params.data.p10startDate; // Returning Date object should be fine here
        },
        valueFormatter: (params) => {
          const date = new Date(params.value);

          // Check if the value is a valid date
          if (!params.value || isNaN(date.getTime())) {
            return ''; // Return empty string for invalid or null date
          }

          // Format valid date as MM/dd/yyyy
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        },
        onCellValueChanged: (params) => {
          this.onCellValueChanged(params);

          // Parse the new value as a Date object
          const newDate = new Date(params.newValue);
          // Ensure that the old value is treated as a date object as well
          const oldDate = new Date(params.oldValue);
          if (
            !params.newValue ||
            isNaN(newDate.getTime()) ||
            newDate.getTime() === 0
          ) {
            // If the value didn't change, don't update it
            if (params.oldValue === params.newValue) {
              return; // Don't update if the value is the same
            }

            if (params.data.p10startDate != null) {
              return; // Keep the existing value
            }
            // Set the old value back if the new value is invalid
            params.api
              .getRowNode(params.node.id)
              .setDataValue('p10startDate', params.oldValue);
          } else {
            const normalizedDate = new Date(
              newDate.getFullYear(),
              newDate.getMonth(),
              newDate.getDate()
            );

            // Compare old value and new normalized date
            if (oldDate.getTime() !== normalizedDate.getTime()) {
              params.api
                .getRowNode(params.node.id)
                .setDataValue('p10startDate', normalizedDate);
            }
          }
        },
      },
      {
        headerName: 'P50 Start Date',
        field: 'p50startDate',
        minWidth: 150,
        maxWidth: 200,
        editable: this.authService.isFieldEditable('p50startDate'),
        sortable: true,
        filter: true,
        cellEditor: 'agDateCellEditor',
        cellEditorParams: {
          format: 'MM/dd/yyyy',
        },
        valueGetter: (params) => {
          return params.data.p50startDate !== undefined
            ? params.data.p50startDate
            : null;
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
        onCellValueChanged: (params) => {
          const newDate = new Date(params.newValue);
          if (
            !params.newValue ||
            isNaN(newDate.getTime()) ||
            newDate.getTime() === 0
          ) {
            if (params.data.p50startDate == null) {
              params.api
                .getRowNode(params.node.id)
                .setDataValue(
                  'p50startDate',
                  params.oldValue ? params.oldValue : null
                );
            } else {
              params.api
                .getRowNode(params.node.id)
                .setDataValue('p50startDate', null);
            }
          } else {
            // const normalizedDate = new Date(Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()));
            const normalizedDate = new Date(
              newDate.getFullYear(),
              newDate.getMonth(),
              newDate.getDate()
            );
            params.api
              .getRowNode(params.node.id)
              .setDataValue('p50startDate', normalizedDate);
          }
        },
      },
      {
        headerName: 'Project',
        field: 'projectId', // Stores projectId but displays project name
        minWidth: 150,
        maxWidth: 200,
        editable: this.authService.isFieldEditable('projectId'),
        sortable: true,
        filter: true,
        cellEditor: 'agSelectCellEditor', // Use built-in select dropdown
        cellEditorParams: {
          values: this.projects?.map((proj) => proj.value), // Dropdown should contain projectId values
        },
        valueFormatter: (params) => {
          // Find the project name based on projectId
          const project = this.projects.find((p) => p.value === params.value);
          return project ? project.label : '';
        },
        onCellValueChanged: (params) => {
          // After value change, update the cell to reflect the projectId
          const selectedProject = this.projects.find(
            (p) => p.label === params.newValue
          );
          if (selectedProject) {
            this.onCellValueChanged(params);
            params.setValue(selectedProject.value); // Store projectId after selection
          }
        },
      },
      {
        headerName: 'Plant Code',
        field: 'plantId',
        minWidth: 120,
        maxWidth: 150,
        filter: true,
        sortable: true,
        editable: this.authService.isFieldEditable('plantId'),
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.plantList?.map((plant) => plant.value),
        },
        valueFormatter: (params) => {
          const plant = this.plantList.find((p) => p.value === params.value);
          return plant ? plant.label : '';
        },
        onCellValueChanged: (params) => {
          // After value change, update the cell to reflect the projectId
          const selectedPlant = this.plantList.find(
            (p) => p.label === params.newValue
          );
          if (selectedPlant) {
            this.onCellValueChanged(params);
            params.setValue(selectedPlant.value); // Store projectId after selection
          }
        },
      },
      {
        headerName: 'WBS',
        field: 'wbs',
        minWidth: 120,
        maxWidth: 150,
        editable: this.authService.isFieldEditable('wbs'),
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Well Type',
        field: 'wellType',
        minWidth: 150,
        maxWidth: 200,
        editable: this.authService.isFieldEditable('wellType'),
        sortable: true,
        filter: true,
        cellEditor: 'agSelectCellEditor', // Use built-in select dropdown
        cellEditorParams: {
          value: 'id', // The property to display in the dropdown
          values: this.wellTypes.map((wt) => wt.wellTypeName), // Array of well types for the dropdown options
        },
        valueFormatter: (params) => {
          // Find the chevronEngineer based on the EngineerId
          const wellTypes = this.wellTypes.find(
            (e) => e.wellTypeName === params.value
          );
          return wellTypes ? wellTypes.wellTypeName : ''; // Return the corresponding well types
        },
        onCellValueChanged: (params) => {
          // After value change, update the cell to reflect the EngineerId
          const selectedWellType = this.wellTypes.find(
            (e) => e.wellTypeName === params.newValue
          );
          if (selectedWellType) {
            this.onCellValueChanged(params);
            params.setValue(selectedWellType.wellTypeName); // Store the EngineerId after selection
          }
        },
      },
      // added a column wellhead Kit//
      {
        headerName: 'Wellhead Kit',
        field: 'wellheadkitId',
        minWidth: 180,
        maxWidth: 220,
        editable: this.authService.isFieldEditable('wellheadkitId'),
        sortable: true,
        filter: true,
        cellEditor: 'agSelectCellEditor',
        hide: this.functionId == 2 ? true : false, // make it display only for drilling //
        // cellEditorParams: () => ({
        //   values: this.store.kits().map(kit => kit.id) // Use appropriate property from WellheadKits
        // }),
        cellEditorParams: () => {
          if (this.functionId !== 1) return { values: [] };
          return {
            values: this.store.kits().map((kit) => kit.id),
          };
        },
        valueFormatter: (params) => {
          if (this.functionId !== 1) return '';
          const kit = this.store.kits().find((k) => k.id === params.value);
          return kit ? kit.kitType : '';
        },
        // onCellValueChanged: (params) => {
        //   const selectedKit = this.store.kits().find(k => k.id === params.newValue);

        //   if (selectedKit) {
        //     this.onCellValueChanged(params);
        //     params.setValue(selectedKit.kitType);
        //   }

        // }
        onCellValueChanged: this.onWellHeadKitChanged.bind(this),
      },
      {
        headerName: 'Planning Engineer',
        field: 'planningEngineer',
        minWidth: 200,
        maxWidth: 250,
        editable: this.authService.isFieldEditable('planningEngineer'),
        sortable: true,
        filter: true,
        cellEditor: 'agSelectCellEditor', // Use built-in select dropdown
        cellEditorParams: {
          value: 'EngineerId', // The property to display in the dropdown
          values: this.planningEnginnersList.map(
            (engineer) => engineer.chevronEngineer
          ), // Array of chevronEngineers for the dropdown options
        },
        valueFormatter: (params) => {
          // Find the chevronEngineer based on the EngineerId
          const engineer = this.planningEnginnersList.find(
            (e) => e.chevronEngineer === params.value
          );
          return engineer ? engineer.chevronEngineer : ''; // Return the corresponding chevronEngineer
        },
        onCellValueChanged: (params) => {
          // After value change, update the cell to reflect the EngineerId
          const selectedEngineer = this.planningEnginnersList.find(
            (e) => e.chevronEngineer === params.newValue
          );
          if (selectedEngineer) {
            this.onCellValueChanged(params);
            params.setValue(selectedEngineer.chevronEngineer); // Store the EngineerId after selection
          }
        },
      },
      {
        headerName: 'RIG',
        field: 'rig',
        minWidth: 100,
        maxWidth: 120,
        editable: this.authService.isFieldEditable('rig'),
        sortable: true,
        filter: true,
      },
      {
        headerName: '',
        cellRenderer: CustomButtonPublishToThor,
        minWidth: 180,
        cellRendererParams: {
          onClick: (rowData: any) => {
            switch (rowData.action) {
              case 'export':
              case 'clone':
                this.publisToThorDialog(rowData);
                break;
              case 'delete':
                this.deleteDialogOpen(rowData);
                break;
            }
          },
          sortable: false,
          showDelete: true, // Hide delete button for completion
          suppressHeaderMenuButton: true,
          isDeleteAllowed: this.authService.isFieldEditable('isDelete'),
          isPublishAllowed: this.authService.isFieldEditable('isPublish'),
          isCloneAllowed: this.authService.isFieldEditable('isClone'),
        },
        // hide: this.functionId == 2 ? true : false,
        disabled: (params) => params.data.isExported === true,
      },
      {
        headerName: 'IsExported',
        field: 'isExported',
        minWidth: 100,
        maxWidth: 120,
        hide: true,
      },
      // {
      //   headerName: '', cellRenderer: CustomDeleteButton, maxWidth: 100, suppressHeaderMenuButton: true,
      //   cellRendererParams: {
      //     onClick: (rowData: any) => { this.deleteDialogOpen(rowData); },
      //     sortable: false
      //   },
      // }
    ];
    // Column definations added for tyr
    this.tyrColumnDefs = [
      {
        headerCheckboxSelection: true, // Adds checkbox in header to select/deselect all rows
        checkboxSelection: true, // Adds checkbox for each row
        width: 50, // Set width to ensure checkbox column is visible
        suppressSizeToFit: true, // Optional: Prevent resizing of checkbox column
        maxWidth: 50,
      },
      {
        headerName: 'Well Name',
        field: 'wellName',
        minWidth: 120,
        filter: true,
        sortable: true,
        editable: this.authService.isFieldEditable('wellName'),
      },
      {
        headerName: 'P10 Start Date',
        field: 'p10startDate',
        minWidth: 150,
        maxWidth: 200,
        editable: this.authService.isFieldEditable('p10startDate'),
        sortable: true,
        filter: true,
        cellEditor: 'agDateCellEditor', // Use AG Grid's built-in date picker (calendar)
        cellEditorParams: {
          format: 'MM/dd/yyyy', // Date format for the calendar (optional)
        },
        valueGetter: (params) => {
          // Log value to debug
          //console.log("valueGetter: ", params.data.p10startDate);

          // Ensure p10startDate is either null or valid
          if (
            params.data.p10startDate === undefined ||
            params.data.p10startDate === null
          ) {
            return null; // Return null if there is no value
          }

          // If there is a valid date, return it
          return params.data.p10startDate; // Returning Date object should be fine here
        },
        valueFormatter: (params) => {
          const date = new Date(params.value);

          // Check if the value is a valid date
          if (!params.value || isNaN(date.getTime())) {
            return ''; // Return empty string for invalid or null date
          }

          // Format valid date as MM/dd/yyyy
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        },
        onCellValueChanged: (params) => {
          this.onCellValueChanged(params);

          // Parse the new value as a Date object
          const newDate = new Date(params.newValue);
          // Ensure that the old value is treated as a date object as well
          const oldDate = new Date(params.oldValue);
          if (
            !params.newValue ||
            isNaN(newDate.getTime()) ||
            newDate.getTime() === 0
          ) {
            // If the value didn't change, don't update it
            if (params.oldValue === params.newValue) {
              return; // Don't update if the value is the same
            }

            if (params.data.p10startDate != null) {
              return; // Keep the existing value
            }
            // Set the old value back if the new value is invalid
            params.api
              .getRowNode(params.node.id)
              .setDataValue('p10startDate', params.oldValue);
          } else {
            const normalizedDate = new Date(
              newDate.getFullYear(),
              newDate.getMonth(),
              newDate.getDate()
            );

            // Compare old value and new normalized date
            if (oldDate.getTime() !== normalizedDate.getTime()) {
              params.api
                .getRowNode(params.node.id)
                .setDataValue('p10startDate', normalizedDate);
            }
          }
        },
      },
      {
        headerName: 'Project',
        field: 'projectId', // Stores projectId but displays project name
        minWidth: 150,
        maxWidth: 200,
        editable: this.authService.isFieldEditable('projectId'),
        sortable: true,
        filter: true,
        cellEditor: 'agSelectCellEditor', // Use built-in select dropdown
        cellEditorParams: {
          values: this.projects?.map((proj) => proj.value), // Dropdown should contain projectId values
        },
        valueFormatter: (params) => {
          // Find the project name based on projectId
          const project = this.projects.find((p) => p.value === params.value);
          return project ? project.label : '';
        },
        onCellValueChanged: (params) => {
          // After value change, update the cell to reflect the projectId
          const selectedProject = this.projects.find(
            (p) => p.label === params.newValue
          );
          if (selectedProject) {
            this.onCellValueChanged(params);
            params.setValue(selectedProject.value); // Store projectId after selection
          }
        },
      },
      {
        headerName: 'RIG',
        field: 'rig',
        minWidth: 100,
        maxWidth: 120,
        editable: this.authService.isFieldEditable('rig'),
        sortable: true,
        filter: true,
      },
    ];
  }
  ngOnInit(): void {
    // loading the store loadKits
    this.loadKits();
    this.getPlanningEnginnersList();
    this.getProjects();
    this.getPlantCode();
    this.userDetail = this.authService.getUserDetail();
  }

  /**
   *  it will get the user details from jwt token
   */
  getUserDetails() {
    if (this.functionId == 1) {
      this.userAccess = this.authService.isAuthorized(
        AccessControls.ODIN_DRILLING_WELLHEADER_ACCESS
      );
    } else if (this.functionId == 2) {
      this.userAccess = this.authService.isAuthorized(
        AccessControls.ODIN_COMPLETION_WELLHEADER_ACCESS
      );
    }
    this.commonService.setuserAccess(this.userAccess);
    this.CreateWellAccess =
      this.authService.isFieldEditable('CreateWellAccess');
  }

  // Method to handle changes in the wellhead kit selection
  onWellHeadKitChanged(params: any): void {
    const newKit = this.store.kits().find((kit) => kit.id === params.newValue);
    const oldKit = this.store.kits().find((kit) => kit.id === params.oldValue);

    this.newValue = newKit ? newKit.kitType : params.newValue;
    this.oldValue = oldKit ? oldKit.kitType : params.oldValue;

    // If a change is already pending, reject new edits
    if (this.pendingKitChange) {
      this.refreshGrid(); // discard temp UI change
      return;
    }

    // If value actually changed, store and show confirm
    if (this.newValue !== this.oldValue) {
      this.pendingKitChange = {
        rowId: params.node.data.id,
        params,
        newValue: this.newValue,
      };
      this.visible = true;
    }
  }

  // Method to handle the confirmation of the wellhead kit change
  onWellHeadContinue(): void {
    if (this.pendingKitChange) {
      const { params, newValue } = this.pendingKitChange;

      // Apply only now (nothing was applied yet)
      params.node.setDataValue('wellheadkitId', newValue);

      this.pendingKitChange = null;
      this.visible = false;
    }
  }

  closeWellHeadDialog(): void {
    this.refreshGrid(); // reset all values/edits
    this.pendingKitChange = null;
    this.visible = false;
  }

  /**
   * get all well  list
   *
   */
  // loadWellData() {
  //   this.gridConfig.loading = true;
  //   this.wellService.getAllWells(this.appId, this.functionId).subscribe({
  //     next: (resp: any) => {

  //       this.gridConfig.loading = false;
  //       this.loading = false;
  //       if (resp) {
  //         this.spinner.show();
  //         this.wellDetails = resp;
  //         this.initializeColumnDefs();
  //         this.getUserDetails();
  //         this.getDemand();
  //         this.spinner.hide();
  //       }
  //       else {
  //         this.gridConfig.loading = false;
  //       }
  //     },
  //     error: () => {
  //       this.gridConfig.loading = false;
  //       this.spinner.hide();
  //     }
  //   });
  // }

  async loadWellData() {
    const resp = await firstValueFrom(
      this.wellService.getAllWells(this.appId, this.functionId)
    );
    if (resp) {
      this.spinner.show();
      this.wellDetails = resp;
      // Exclude TYR wells if in TYR context
      if (this.isTyr) {
        this.wellDetails = this.wellDetails.filter(
          (obj) => !this.builderService.tyrWellsIds().includes(obj.id)
        );
      }
      await this.getUserDetails(); // await this before initializing columnDefs
      this.initializeColumnDefs(); // Now build columnDefs with correct permissions
      this.getDemand();
      this.spinner.hide();
    }

    this.loading = false;
  }

  /**
   * get all projects  list
   *
   */

  getProjects() {
    this.lookupService.getProjects().subscribe((data) => {
      this.projects = data.map((resp) => ({
        label: resp.projectDesc,
        value: resp.id,
      }));
    });
  }
  /**
   * get all plant code
   *
   */
  getPlantCode() {
    this.lookupService.getPlantCode().subscribe({
      next: (resp: any) => {
        if (resp) {
          this.plantList = resp;
          this.plantList = resp.map((plant) => ({
            label: plant.plantCode,
            value: plant.id,
          }));
        } else {
          this.plantList = [];
        }
      },
      error: () => {
        this.plantList = [];
      },
    });
  }

  /**
   * get all planning enginners list
   *
   */
  getPlanningEnginnersList() {
    this.lookupService.getPlanningEngineer().subscribe({
      next: (resp: any) => {
        if (resp) {
          this.planningEnginnersList = resp;
          this.getWellTypes();
        } else {
          this.planningEnginnersList = [];
        }
      },
      error: () => {
        this.planningEnginnersList = [];
      },
    });
  }

  /**

* get well Demand for clone enable

*/

  getDemand() {
    if (this.appId == 1) {
      this.wellService.GetAllOdinWellMaterialDemand(this.functionId).subscribe({
        next: (resp: any) => {
          this.wellmaterials = resp.data;

          this.wellDetails.forEach((well) => {
            well.demand = this.wellmaterials.filter(
              (wm) => wm.wellId == well.id
            ).length;
          });
        },
      });
    }
  }

  /**
   * get all well type  list
   *
   */
  getWellTypes() {
    this.lookupService.getWellTypes().subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (resp) {
          this.wellTypes = resp;
        } else {
        }
      },
      error: () => {
        this.loading = false;
      },
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

  onCellValueChanged(event: any): void {
    const rowNode = event.node.data;
    // console.log('Row data after edit:', rowNode.wellName);
    this.wellNameChanged = rowNode.wellName;
    const formatDate = (date: any) => {
      if (!date) return null;
      const newDate = new Date(date);
      return `${newDate.getFullYear()}-${String(
        newDate.getMonth() + 1
      ).padStart(2, '0')}-${String(newDate.getDate()).padStart(
        2,
        '0'
      )}T00:00:00`;
    };
    rowNode.p10startDate = formatDate(rowNode.p10startDate);
    rowNode.p50startDate = formatDate(rowNode.p50startDate);

    const existingRecord = this.editedRecords.find(
      (rec) => rec.id === rowNode.id
    );
    if (!existingRecord) {
      //creating payload and checking selected well is published or not
      if (!rowNode.isExported) {
        this.materialDemandPayload.push({
          wellId: rowNode.id,
          userId: this.userDetail.uid,
          selectedKit: rowNode.wellheadkitId,
        });
      }

      this.editedRecords.push(rowNode);
    }

    this.isEdit = true;
  }

  onSelectionChanged() {
    this.selectedTyrWells = this.gridApi.getSelectedRows();
    this.isEdit = this.selectedTyrWells.length > 0;
  }

  onEdit() {
    this.displayConfirmationComponentDialog = true;
    // Condition handled in case of Tyr
    if (this.isTyr) {
      this.confirmationMessage =
        CommonDisplayMessages.tyrCreateDraftConfirmation;
      this.confirmationTitle = CommonDisplayMessages.tyrConfirmationTitle;
    }
  }
  /**
   *  delete row
   *
   *
   */
  deleteDialogOpen(rowData: any) {
    //this.dialogContent = rowData.isExported
    //  ? `${rowData.wellName} is published. Are you sure you want to delete it ?`
    //  : 'Are you sure want to Delete ?';

    this.dialogContent = rowData.isExported
      ? this.sanitizer.bypassSecurityTrustHtml(
          `<b>${rowData.wellName} is published </b>. Are you sure you want to delete it ?`
        )
      : this.sanitizer.bypassSecurityTrustHtml('Are you sure want to Delete ?');

    this.selectedWellHeaderData = rowData;
    //console.log(this.selectedWellHeaderData);

    this.displayDeleteComponentDialog = true;
  }

  deleteConfirm() {
    const request: PublishWellRequest = {
      wellId: this.selectedWellHeaderData.rowData.id,
      userId: this.userDetail.uid,
      projectId: 0,
    };

    //console.log(request);
    // console.log(this.selectedWellHeaderData.id);

    if (!request || !request.wellId || !this.userDetail.uid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid data. Unable to delete.',
      });
      return;
    }
    this.odinV2Service.deleteOdinWell(request).subscribe({
      next: (response) => {
        if (response) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Deleted successfully.',
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'deletion failed.',
          });
        }
        this.displayDeleteComponentDialog = false; // Close dialog after deletion
        this.refreshGrid();
      },
      error: (err) => {
        console.error('Error deleting well:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'An error occurred while deleting the well.',
        });
      },
    });
  }
  /**
   *  updating all changed row
   *
   *
   */
  updateWellDetails() {
    this.gridConfig.loading = true;
    this.spinner.show();
    // Find "Not Assigned" projectId from projects list
    const notAssignedProject = this.projects.find(
      (p) => p.label === 'Not Assigned'
    );
    // Ensure all edited records have a valid projectId
    this.editedRecords = this.editedRecords.map((record) => ({
      ...record,
      projectId: record.projectId
        ? record.projectId
        : notAssignedProject?.value,
      userIdModifiedBy: +this.userDetail.uid,
    }));

    this.wellService.updateAllWells(this.editedRecords).subscribe({
      next: (response) => {
        this.spinner.hide();
        this.gridConfig.loading = false;
      },
      error: (error) => {
        this.gridConfig.loading = false;
        // console.error('Error updating wells.', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred while updating  wells.',
        });
        this.spinner.hide();
      },
      complete: () => {
        this.gridConfig.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Wells has been successfully updated.',
        });
        this.editedRecords = [];
        this.onSave.emit();
      },
    });
    this.displayConfirmationComponentDialog = false;
  }
  closeExportToThorDialog() {
    this.displayExportToThorDialog = false;
  }
  closeCloneWellDialog() {
    this.displaycloneHeaderDialog = false;
  }

  // Save the cloned well header
  saveCloneWellDialog() {
    this.displaycloneHeaderDialog = false;
    this.wellCreated = true;
  }

  // Close the dialog
  closeDialog(): void {
    this.editedRecords = [];
    this.materialDemandPayload = [];
    this.pendingKitChange = null; // Reset pending kit change
    this.onClose.emit(this.wellCreated); // Emit the wellCreated flag to indicate if a new well was created
  }

  publisToThorDialog(rowData: any): void {
    let rowdata = { ...rowData.rowData }; // Clone to prevent mutating original data
    // console.log(rowdata)

    // Find "Not Assigned" projectId from projects list
    const notAssignedProject = this.projects.find(
      (p) => p.label === 'Not Assigned'
    );

    // Ensure projectId is assigned (default to "Not Assigned" projectId)

    if (rowData.action === 'clone') {
      this.isCloneWell = true;
      rowdata.projectId = rowdata.projectId
        ? rowdata.projectId
        : notAssignedProject?.value;
      this.displaycloneHeaderDialog = true;
      this.passRowdata = rowdata;
      this.commonService.setWellHeadersRowsData(this.passRowdata);
      this.refreshGrid();
    }

    if (rowdata.isExported === false) {
      if (rowData.action === 'export') {
        this.displayExportToThorDialog = true;
        this.passRowdata = rowdata;
        this.commonService.setWellHeadersRowsData(this.passRowdata);
        rowData.rowData.isExported = true;
        this.refreshGrid();
      }
    }
  }

  refreshGrid() {
    this.loadWellData();
  }
  addNewWell() {
    this.isCloneWell = false;
    this.displaycloneHeaderDialog = true;
  }
  //Global Search using form module //
  onSearch(): void {
    this.globalFilter = this.searchText.toLowerCase();
  }

  includeWellInTyr(wellIds: number[]) {
    this.spinner.show();
    const request: AddWellsRequest = {
      appId: this.listEditorBuilderService.selectedApplicationId(),
      wellIds: wellIds,
      userId: this.userDetail?.uid,
    };
    this.tyr2TasksService?.includeWells(request).subscribe({
      next: (resp) => {
        if (resp === 1) {
          this.messageService.add({
            severity: MessageSeverityTypes.Success,
            summary: CommonDisplayMessages.success,
            detail: CommonDisplayMessages.tyrDraftWellSucess,
          });
          this.onSave.emit();
        } else {
          this.messageService.add({
            severity: MessageSeverityTypes.Error,
            summary: CommonDisplayMessages.commonErrorMessage,
            detail: CommonDisplayMessages.tyrDraftWellFailure,
          });
        }
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error deleting well:', error);
        this.messageService.add({
            severity: MessageSeverityTypes.Error,
            summary: CommonDisplayMessages.commonErrorMessage,
            detail: CommonDisplayMessages.tyrDraftWellFailure,
        });
        this.spinner.hide();
      },
    });
  }

  //  Method to update changes
  updateChanges() {
    if (!this.isTyr) {
      if (this.functionId === 1) {
        this.updateMaterialDemandForKit();
      } else if (this.functionId === 2) {
        this.updateWellDetails();
      }
    } else {
      // Conditions handled for Tyr
      const selectedWells = this.selectedTyrWells.map((well: any) => well.id);
      this.includeWellInTyr(selectedWells);
      this.displayConfirmationComponentDialog = false;
      this.displayEditWellHeaders = false;
    }
  }
  /**
   * this will update the material demand after cloned/edit and create record
   * @param wellId
   * @param userId
   * @param selectedWellheadKitId
   */
  updateMaterialDemandForKit() {
    this.wellheadkitService
      .updateMaterialDemandForKit(this.materialDemandPayload)
      .subscribe({
        next: (resp) => {
          this.updateWellDetails();
        },
        error: (error) => {},
      });
  }
  //  resetFilter to clear the search text and global filter
  resetFilter() {
    this.searchText = '';
    this.globalFilter = '';
    this.isEdit = false;
    this.gridApi.deselectAll();
  }
}
