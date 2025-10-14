import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, WritableSignal } from '@angular/core';
import { SchematicService } from '../../../services/schematic.service';
import {
  ClientSideRowModelModule,
  FirstDataRenderedEvent,
  SizeColumnsToFitGridStrategy,
  ModuleRegistry,
  SideBarDef,
} from "ag-grid-community";
import { GridApi, ColDef, RowNode, GridReadyEvent, ValueFormatterParams, IDetailCellRendererParams } from 'ag-grid-community';
import { MessageService } from 'primeng/api';
import { LookupsService } from '../../../services/lookups.service';
import { Sections } from '../../../common/model/sections';
import { AssemblyTypes } from '../../../common/model/assembly-types';
import { AuthService } from '../../../services/auth.service';
import { CustomButton } from '../customButton.component';
import { CustomDeleteButton } from '../customDeleteButton.component';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { cloneAssembly, SchematicAssemblyDto } from '../../../common/model/schematic-assembly-dto';
import { SchematicDetailDto } from '../../../common/model/schematic-detail-dto';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { forkJoin, Observable, Subscription, tap } from 'rxjs';
import { WellFeatures } from '../../../common/model/wellfeatures';
import { SchematicsRequest } from '../../../common/model/schematic-detail-dto';
import { DesignTypes } from '../../../common/model/design-types';
import { CommonService } from '../../../services/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { HttpClient } from "@angular/common/http";
import { AgGridAngular } from "ag-grid-angular";
import {
  ColumnsToolPanelModule,
  GridOptions,
} from "ag-grid-enterprise";
import { BatchJobWithLogs } from '../../../common/model/batch-job-with-logs';
import { RowDragEvent } from 'ag-grid-community';
import { AssemblyBuilderService } from '../services/assembly-builder.service';
import { AssemblyTypeService } from '../../../services/assembly-type.service';
import { CustomButtonPublishToThor } from '../../common/customButtons/customButton.component';
import { AssemblyCustomButtonsComponent } from '../../common/customButtons/assembly-custom-buttons/assembly-custom-buttons.component';
import { MdlBuilderService } from './builder/mdl-builder.service';
import { AccessControls } from '../../../common/constant';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { DeleteConfirmationDialogComponent } from '../../common/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { ConfirmationDialogComponent } from '../../common/confirmation-dialog/confirmation-dialog.component';
import { CloneAssemblyComponent } from '../clone-assembly/clone-assembly.component';
import { MdlAddComponentComponent } from '../../common/mdl-add-component/mdl-add-component.component';

@Component({
  selector: 'app-assembly-builder',
  standalone:true,
  imports:[...PRIME_IMPORTS,
    DeleteConfirmationDialogComponent,
    DeleteDialogComponent,
    ConfirmationDialogComponent,
    CloneAssemblyComponent,
    MdlAddComponentComponent
  ],
  templateUrl: './assembly-builder.component.html',
  styleUrl: './assembly-builder.component.scss'
})
export class AssemblyBuilderComponent implements OnChanges, OnInit, OnDestroy {
  //required Inputs for the Component
  @Input({ required: true }) schematic: Completionschematicheader;
  @Input() viewData: { sectionID: number, itemNumber: number, zoneID: number };
  @Input() statusId!: number;
  //details of the current user for security
  userDetail: any;
  //Schematic Data  builder and Grids
  schematicId: number;
  assemblyColumnDefs = [];
  assemblyOriginalLength: number;
  private assemblyGridAPI!: GridApi;
  private gridApi!: GridApi; // Added to fix compile error
  allAssemblyDetails: SchematicAssemblyDto[] = [];
  assemblyGridData: SchematicAssemblyDto[] = [];
  private componentGridAPI!: GridApi;
  allComponentDetails: SchematicDetailDto[] = [];
  componentGridData: SchematicDetailDto[] = [];
  selectedView: number = 1;
  currentView: number = this.selectedView;
  selectedChangeZone: boolean = true;
  wellFeatures: WellFeatures[] = [];
  filteredDesignTypes: DesignTypes[] = [];
  viewZoneOptions = [{ label: 'ON', value: true },
  { label: 'OFF', value: false }];

  displayConfirmationZoneEnableDialog: boolean = false;
  displayConfirmationZoneDisableDialog: boolean = false;
  //Grid Options
  rowHeight: number = 30;
  gridOptions: GridOptions = {
    getRowHeight: params => {
      const isDetailRow = params.node.detail;
      // for all rows that are not detail rows, return nothing
      if (!isDetailRow) { return undefined; }
      const children = this.findComponentData(params.data.itemNumber, params.data.sectionID).length;
      // otherwise return height based on number of rows in detail grid
      const detailPanelHeight = (children * (this.rowHeight)) + 58;
      return detailPanelHeight;
    },
  };
  detailRowAutoHeight = true;
  // enable Master / Detail
  //boolian values to switch state
  showMdlDialog: boolean = false;
  displayDeleteComponentSchemanticDialog: boolean = false;
  displayDeleteComponentDialog: boolean = false;
  loading: boolean = false;
  isLowerSection = false;
  isIntermediateSection = false;
  //lookup Values for dropdown menu
  sections: Array<Sections> = [];
  assemblyTypes: Array<AssemblyTypes> = [];
  selectedRowNode: any;
  //Selections 
  selectedSection: number = 3; // Start with no selection
  selectedZone: number = 1; // Start with no selection
  zoneCount: number = 2;
  selectedAssemblyID: number = 0;
  selectedAssemblyItemNumber: number = 0;
  selectedAssemblyData: SchematicAssemblyDto;
  selectedComponentData: SchematicDetailDto;
  isNewRecordAdded: boolean = false;
  // Use selectedRowData if you want to pre-fill the dialog
  selectedRowData: any;
  componentDataWithMdl = [];
  deleteRowData: any;
  visible: boolean = false;
  designTypes: DesignTypes[] = [];
  editedRowsData: any;
  CopyZone: boolean = true;
  cloneAssemblyData = null;
  displayCloneModal: boolean = false;
  private cancelSubscription: Subscription;
  displayColoneConfirmation: boolean = false;
  cloneConfirmationContent: cloneAssembly = {
    cloneAssambly: "",
    section: "",
    zone: ""
  }

  formData: SchematicAssemblyDto | null = null;
  isCopyZone: boolean = false;
  isAddSpaceOut: boolean = false;
  isAddAssembly: boolean = false;
  groupOptionsMap: Map<string, { groupId: number; groupName: string; materialNumber: string; materialDescription: string;
    vendorSAPNumber:string;materialKey:number
   }[]> = new Map(); // key = `${componentType}|${supplierPartNumber}`
  canDeleteComponent: boolean=false;
  saveButtonAccess:boolean = false;
  private schematicSubscription: Subscription = new Subscription();
  selectedGroupName:string;
  showMissingMM:boolean = false;
  pendingGroupChange: {
    node: any;
    oldValue: string;
    newValue: string;
    matched: any;
  } | null = null;
  // pendingGroupChange:{
  //   node:any;
  //   data:any;
  //   matched
  // }

  findComponentData(itemNumber: number, section: number) {
    let componentDetails: SchematicDetailDto[] = [];
    if (itemNumber > 0) {
      componentDetails = this.allComponentDetails.filter(
        subItem => subItem.itemNumber === itemNumber && subItem.sectionID === section
          && subItem.isDeleted === 0
      );
      //sort by subitemnumber
      componentDetails.sort((a, b) => Number(a.subItemNumber) - Number(b.subItemNumber));
    } else {
      componentDetails = [];
    }
    return componentDetails;
  }
  autoSizeStrategy: SizeColumnsToFitGridStrategy = {
    type: 'fitGridWidth',
  };
  viewOptions = [{ label: 'Primary', value: 1 },
  { label: 'Secondary', value: 2 }];

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
  //Define Columns for the Components SubItems Grid
  componentColumnDefs = [];

  /*******************Initialize the Component******************* */
  //Constructor method for the class  
  constructor(
    private schematicService: SchematicService,
    private completionSchematicService: CompletionschematicService,
    private messageService: MessageService,
    private lookupsService: LookupsService,
    private assemblyTypeService: AssemblyTypeService,
    private authService: AuthService,
    private commonService: CommonService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    private assemblyBuilderService: AssemblyBuilderService,
    private mdlBuilderService: MdlBuilderService,
  ) {
    this.userDetail = this.authService.getUserDetail();

  }




  //Define Columns for the Assembly Table Grid  
  initializeColumnDefs() {

    this.assemblyColumnDefs = [
      {
        headerName: 'Item #',
        field: 'itemNumber', rowDrag: true, sortable: false, suppressHeaderMenuButton: true,
        // valueFormatter: params => {
        //   if(params.data.designTypeID == 3){
        //     return params.value.toString().split('.')[1] + 'c'
        //   }
        // },
      },
      //{ headerName: 'Item Number', valueGetter: 'node.rowIndex + 1', rowDrag: true, maxWidth: 120 },
      {
        headerName: 'Section', field: 'sectionID',
        valueFormatter: params => {
          switch (params.value) {
            case 3: return 'Upper';
            case 2: return 'Intermediate';
            case 1: return 'Lower';
            default: return '';
          }
        }
        , editable: false, sortable: false, suppressHeaderMenuButton: true
      },
      {
        headerName: 'Design Type',
        field: 'designTypeID',
        valueFormatter: params => {
          const item = this.designTypes.find(item => item.designTypeId === params.value);
          return item ? item.designTypeName : null;
        },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: (params) => ({
          values: this.filteredDesignTypes.map(item => item.designTypeId)
        }),
        minWidth: 130,
        // editable: true,
        editable: params => this.selectedSection !== 1,
        sortable: false,
        suppressHeaderMenuButton: true
      },
      { headerName: 'Zone', field: 'zoneId', minWidth: 100, editable: false, sortable: false, suppressHeaderMenuButton: true },
      {
        headerName: 'String Type', field: 'stringType', minWidth: 120,
        valueGetter: params => params.data.stringType,
        editable: true,
        sortable: false,
        cellEditor: 'agSelectCellEditor', // DropDown 
        cellEditorParams: {
          values: ['Inner', 'Outer'] // List of dropdown options
        },
        suppressHeaderMenuButton: true
      },
      {
        headerName: 'Assembly Name',
        field: 'assemblyName',
        valueGetter: params => {
          // Find the item that matches the assembly ID
          const item = this.assemblyTypes.find(item => item.assemblyTypeId === params.data.assemblyTypeID);
          // Check if both assemblyTradeName and assemblyName are present
          if (params.data.schematicsTradeName && item && item.assemblyTypeName) {
            return `${params.data.schematicsTradeName} ${item.assemblyTypeName}`; // removed brackets //
          }
          // If only assemblyTradeName is available
          if (params.data.schematicsTradeName) {
            return params.data.schematicsTradeName;
          }
          // If only assemblyName is available
          if (item && item.assemblyTypeName) {
            return item.assemblyTypeName;
          }
          // Fallback in case neither value is present
          return '';
        },
        editable: false, sortable: false, suppressHeaderMenuButton: true
      },
      {
        headerName: 'Trade Name / Modifier', field: 'schematicsTradeName', minWidth: 180,
        editable: true, //params => params.data.zoneId <= 2,
        sortable: false,
        suppressHeaderMenuButton: true
      },
      {
        headerName: 'Assembly Type',
        field: 'assemblyTypeID',
        valueFormatter: params => {
          const item = this.assemblyTypes.find(item => item.assemblyTypeId === params.value);
          return item ? item.assemblyTypeName : null;
        },
        editable: true, //params => params.data.zoneId <= 2, // Disable editing if zoneId > 2
        sortable: false,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          // Bind the fetched values
          values: this.assemblyTypes.map(item => item.assemblyTypeId),
        },
        suppressHeaderMenuButton: true
      },
      {
        headerName: 'Total Length', field: 'lengthInFt', minWidth: 120, editable: false, sortable: false, suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return params.value ? params.value.toFixed(2) : '';
        }
      },

      {
        headerName: '',
        cellRenderer: AssemblyCustomButtonsComponent,
        cellRendererParams: {
          onClick: (rowData: any) => {
            // Handle different actions based on the value of 'rowData.action'
            switch (rowData.action) {
              case 'component':
                this.openDialog(rowData);
                break;
              case 'clone':
                this.cloneConfirmationContent.cloneAssambly = rowData.rowData.assemblyName;
                this.showCloneModal(rowData)
                break;
              case 'delete':
                this.deleteAssemblyDialog(rowData);
                break;
            }

          }, // Show clone modal popup
          isAddComponent: !this.authService.isFieldEditable('isAddComponent'), // Pass permission to enable/disable the Add Component button
          sortable: false,
          suppressHeaderMenuButton: true,
          hideExport: true,
        },
      },

    ];
  }

  //Define Columns for the Component Table Grid  
  initializeComponentColumnDefs() {
    this.componentColumnDefs = [
      { headerName: 'Sub-Item #', field: 'subItemNumber', minWidth: 110, rowDrag: true, sortable: false, suppressHeaderMenuButton: true },
      { headerName: 'Component Type', field: 'componentTypeName', minWidth: 150, editable: false, sortable: false, suppressHeaderMenuButton: true },
      // ADDED THE GROUP DROPDOWN AND FUNCTIONALITY
       {
        headerName: 'Group',
        field: 'groupName',
        editable: (params) => {
          const key = `${params.data.componentTypeName}|${params.data.supplierPartNumber}`;
          const values = this.groupOptionsMap.get(key);
          return !!(values && values.length > 0);
        },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: (params) => {
          const key = `${params.data.componentTypeName}|${params.data.supplierPartNumber}`;
          const options = this.groupOptionsMap.get(key) || [];
          return {
            values: options.map(g => g.groupName)
          };
            },
            valueSetter: (params) => {
              const selectedGroupName = params.newValue;
              // const oldGroupName = params.oldValue;
              const key = `${params.data.componentTypeName}|${params.data.supplierPartNumber}`;
              const groupDetails = this.groupOptionsMap.get(key) || [];
              const matched = groupDetails.find(g => g.groupName === selectedGroupName);
              // if (!matched) return false;

              // const { materialNumber, materialDescription } = matched;

              // Show modal if materialNumber and materialDescription not matched
              // if (materialNumber === "100064") {
              //   this.pendingGroupChange = {
              //     node: params.node,
              //     oldValue: oldGroupName,
              //     newValue: selectedGroupName,
              //     matched
              //   };
              //   this.selectedGroupName = selectedGroupName;

              //   // Close editor, then show modal
              //   setTimeout(() => {
              //     this.componentGridAPI.stopEditing(true);
              //     this.showMissingMM = true;
              //   }, 0);

              //   return false;
              // }

              // Normal update
              params.data.groupName = matched.groupName;
              params.data.materialNumber = matched.materialNumber;
              params.data.schematicsDetailDescription = matched.materialDescription;
              params.data.vendorSAPNumber = matched.vendorSAPNumber;
              params.data.cvX_CRW_ID = matched.materialKey

              //  Also update the object inside allComponentDetails
            const index = this.allComponentDetails.findIndex(c => c.subItemNumber === params.data.subItemNumber);
            if (index > -1) {
              this.allComponentDetails[index].groupName = matched.groupName;
              this.allComponentDetails[index].materialNumber = matched.materialNumber;
              this.allComponentDetails[index].schematicsDetailDescription = matched.materialDescription;
              this.allComponentDetails[index].vendorSAPNumber = matched.vendorSAPNumber;
              this.allComponentDetails[index].cvX_CRW_ID = matched.materialKey
            }
            // console.log(this.allComponentDetails);
              params.api?.refreshCells({
                rowNodes: [params.node],
                columns: ['materialNumber', 'schematicsDetailDescription','vendorSAPNumber'],
                force: true
              });

              return true;
          }
      },
//       {
//   headerName: 'Group',
//   field: 'groupName',
//   editable: true,
//   cellEditor: GroupSelectEditorComponent,
// },
      { headerName: 'Material Description', field: 'schematicsDetailDescription', editable: false, sortable: false, suppressHeaderMenuButton: true },
      { headerName: 'Material ID', field: 'materialNumber', minWidth: 120, editable: false, sortable: false, suppressHeaderMenuButton: true },
      { headerName: 'Manufacturer SAP #', field: 'vendorSAPNumber', editable: false, sortable: true, minWidth: 250, filter: true },

      { headerName: 'Supplier Part #', field: 'supplierPartNumber', minWidth: 120, editable: false, sortable: false, suppressHeaderMenuButton: true },
      { headerName: 'Legacy Reference #', field: 'legacyRefNumber', minWidth: 120, editable: false, sortable: false, suppressHeaderMenuButton: true },
      {
        headerName: 'Length', field: 'assemblyLengthinft', minWidth: 110, editable: this.authService.isFieldEditable('assemblyLengthinft'), sortable: false, suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Number(params.value) ? Number(params.value).toFixed(2) : '';
        }
      },
      {
        headerName: 'Design Notes', field: 'schematicsNotes',editable:this.authService.isFieldEditable('schematicsNotes'), sortable: false, wrapText: true, autoHeight: true, suppressHeaderMenuButton: true,
        cellEditor: 'agLargeTextCellEditor', cellEditorPopup: this.authService.isFieldEditable('schematicsNotes')
      },
      {
        headerName: 'Serial #', field: 'serialNumber',editable:this.authService.isFieldEditable('serialNumber'), sortable: false, wrapText: true, autoHeight: true, suppressHeaderMenuButton: true,
        cellEditor: 'agLargeTextCellEditor', cellEditorPopup: this.authService.isFieldEditable('serialNumber')
      },
      {
        headerName: '', cellRenderer: CustomDeleteButton, suppressHeaderMenuButton: true, cellRendererParams: {
          isDelete: !this.canDeleteComponent,
          onClick: (rowData: any) => { this.deleteDialogOpen(rowData); }, sortable: false
        }
      }
    ];
  }


  // Master-Detail Config


  ngOnChanges(changes: SimpleChanges) {
    if (changes.viewData) {
      this.schematicId = this.schematic.schematicsID;
      this.loadWellFeatures();
      this.getSections();
      this.getDesignTypes();
      this.getAssemblyTypes();
      this.getAssemblyData();

    }
  }

  ngOnInit() {
    this.getUserDetails();
    this.cancelSubscription = this.commonService.getCancelClickedObservable().subscribe(cancelClicked => {
      if (cancelClicked) {
        // When cancel is clicked, bind the data from the service
        this.bindEditedDataToGrid();
      }
    });
    //this.loadWellFeatures();
    // load component data to reuse in the dialog
    this.mdlBuilderService.loadMaterials();
  }

  ngOnDestroy() {
    this.schematicSubscription.unsubscribe();
  }
  /**
   *  it will get the user details from jwt token
   */
   getUserDetails() {
    let userAccess = this.authService.isAuthorized(AccessControls.ASSEMBLY_BUILDER);
    this.commonService.setuserAccess(userAccess);
    this.isCopyZone = this.authService.isFieldEditable('isCopyZone');
    this.isAddSpaceOut = this.authService.isFieldEditable('isAddSpaceOut');
    this.isAddAssembly = this.authService.isFieldEditable('isAddAssembly');
    this.canDeleteComponent = this.authService.isFieldEditable('isDeleteComponent');
    this.saveButtonAccess = this.authService.isFieldEditable('saveSchematic')
    
    // Calling the component column definations to get the editable access for length field
    this.initializeComponentColumnDefs();

  }

    //   handleMissingMaterialModal(params: any, matched: any) {
    //   this.pendingGroupChange = {
    //     node: params.node,
    //     data: params.data,
    //     matched
    //   };
    //   this.showMissingMM = true;
    // }


  bindEditedDataToGrid() {
    const newRows = this.commonService.getAddedRowsData();
    if (newRows) {
      this.allAssemblyDetails.push(...newRows);
      this.refreshGrids();
    }
    const editedData = this.commonService.getEditedRowsData();

    if (editedData) {

      // this.componentGridData.forEach(component => {
      //   if (component.schematicAssemblyID === editedData.schematicAssemblyID) {
      //     // Restore the data to the row
      //     Object.assign(component, editedData);

      //   } 
      // });

      // this.assemblyGridData.forEach(assembly => {
      //   if (assembly.schematicAssemblyID === editedData.schematicAssemblyID) {
      //     Object.assign(assembly, editedData);  // Update the row in the assembly grid
      //   }
      // });

      editedData.forEach(editedRow => {
        if (editedRow.source === 'component') {
          // Bind the edited data to the component grid
          this.componentGridData.forEach(component => {
            if (component.schematicAssemblyID === editedRow.schematicAssemblyID) {
              Object.assign(component, editedRow);  // Update the row data for component grid
            }
          });
        } else if (editedRow.source === 'assembly') {
          // Bind the edited data to the assembly grid
          this.assemblyGridData.forEach(assembly => {
            if (assembly.schematicAssemblyID === editedRow.schematicAssemblyID) {
              Object.assign(assembly, editedRow);  // Update the row data for assembly grid
            }
          });
        }
      });
    }
  }

  // Load existing well features
  loadWellFeatures(): void {
    if (!this.schematicId) return;
    this.schematicSubscription = this.completionSchematicService.getWellFeaturesBySchematicId(this.schematicId).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.wellFeatures = data;
          this.zoneCount = this.wellFeatures[0].noOfZones;
          this.CopyZone = this.wellFeatures[0].copyZone ?? true;
          this.selectedChangeZone = this.CopyZone;
        }
      },
      error: (err) => {
        console.error('Error fetching well features', err);
      },
    });
  }

  /******************* API Calls******************* */
  //Method to Get the Sections to display in Drop down
  getSections() {
    this.schematicSubscription = this.lookupsService.getSections().subscribe((response) => {
      this.sections = response;
      if (this.viewData) {
        this.selectedSection = this.viewData.sectionID;
        if (this.selectedSection == 1) {
          this.isLowerSection = true;
          if (this.viewData.zoneID == 1) {
            this.selectedZone = 1;
          }
          else {
            this.selectedZone = 2;
          }
        }
        if (this.selectedSection == 2) {
          this.isIntermediateSection = true;
          if (this.viewData.zoneID == 1) {
            this.selectedZone = 1;
          }
          else {
            this.selectedZone = 2;
          }
        }
      }
      else {
        this.selectedSection = this.sections[0].sectionId;

      }
    }, (error) => {
      console.error('Error fetching sections', error);
    });
  }

  //Method to Get the Assembly Types to display in Drop down
  getAssemblyTypes() {
    this.schematicSubscription = this.assemblyTypeService.getAssemblyType().subscribe((response) => {
      const assemblyType: AssemblyTypes = new AssemblyTypes();
      assemblyType.assemblyTypeId = 0;
      assemblyType.assemblyTypeName = 'Not Assigned';
      this.assemblyTypes.push(assemblyType);
      this.assemblyTypes.push(...response);
      this.initializeColumnDefs();
    }, (error) => {
      console.error('Error fetching Assembly Types', error);
    });
  }

  //Method to Get the full schematic Assembly data  from API
  getAssemblyData() {
    const selectedSection = -1;

    this.schematicSubscription = this.completionSchematicService.getSchematicAssemblies(this.schematicId, selectedSection).subscribe({
      next: (response) => {
        this.allAssemblyDetails = response;
        //set uniqueid for each assembly
        this.allAssemblyDetails.forEach(assembly => assembly.uniqueId = this.assemblyBuilderService.generateUniqueId());
        this.setAssemblyGridData();
        this.getComponentData();
      },
      error: (error) => {
        console.error('Error fetching Assembly  Data', error);
      }
    });

  }

  //  filter the group dropdown data based on comp and supplier type
  preloadGroupDropdowns(componentType: string, supplierPartNumber: string, rowNode?: any) {
    const key = `${componentType}|${supplierPartNumber}`;
    if (this.groupOptionsMap.has(key)) {
      // If already present, trigger edit directly if rowNode is provided
      if (rowNode) {
        setTimeout(() => {
          this.gridApi.startEditingCell({
            rowIndex: rowNode.rowIndex,
            colKey: 'groupName'
          });
        }, 0);
      }
      return;
    }

    this.schematicSubscription = this.lookupsService.getcomponentGroupsBySupplier(componentType, supplierPartNumber).subscribe({
      next: (groups) => {
        // console.log(groups);
        const groupList = (groups || []).map(g => ({
          groupId: g.groupId,
          groupName: `Group ${g.groupId}`,
          materialNumber: g.materialNumber,
          materialDescription: g.materialDescription,
          vendorSAPNumber:g.vendorSAPNumber,
          materialKey:g.materialKey,
        }));

        this.groupOptionsMap.set(key, groupList);

        if (rowNode) {
          this.gridApi.refreshCells({ rowNodes: [rowNode], force: true });

          setTimeout(() => {
            this.gridApi.startEditingCell({
              rowIndex: rowNode.rowIndex,
              colKey: 'groupName'
            });
          }, 0);
        } else {
          this.gridApi?.refreshCells({ force: true });
        }
      },
      error: (err) => {
        console.error(`Failed to load groups for ${key}`, err);
        this.groupOptionsMap.set(key, []);
      }
    });
  }


  //Method to Get the full schematic Component  data  from API 
  getComponentData() {

    const sectionId = this.selectedSection;

    this.schematicSubscription = this.completionSchematicService.getSchematicComponents(this.schematicId, -1, -1).subscribe({
      next: (response) => {
        this.allComponentDetails = response;
        //set uniqueid for each component
        this.allComponentDetails.forEach(component => component.uniqueId = this.assemblyBuilderService.generateUniqueId());
        this.calculateTotalLength();
        this.selectedAssemblyItemNumber = this.assemblyGridData[0]?.itemNumber;
        if (this.viewData) {
          this.selectedAssemblyItemNumber = this.viewData.itemNumber;
          if (this.viewData.zoneID > 2) {
            this.selectedAssemblyItemNumber = this.selectedAssemblyItemNumber + this.assemblyGridData.length * (this.viewData.zoneID - 2);
          }
        }
        if (this.selectedAssemblyItemNumber > 0) {
          this.setComponentGridData();
        }
      },
      error: (error) => {
        console.error('Error fetching Component Data', error);
      }
    });
  }

  calculateTotalLength() {
    this.allAssemblyDetails.forEach((assembly) => {
      let totalLength: number = 0;
      let compdata = this.allComponentDetails.filter(component => component.schematicAssemblyID == assembly.schematicAssemblyID);
      compdata.forEach(component => {
        if (Number(component.assemblyLengthinft) > 0) {
          totalLength += Number(component.assemblyLengthinft);
        }
      });
      assembly.lengthInFt = totalLength;
    });
    this.assemblyGridAPI.refreshCells();
  }

  /******************* Component Event Handling****************** */

  onGridReady1(params: any) {
    this.assemblyGridAPI = params.api;
  }

  onGridReady2(params: any) {
    this.componentGridAPI = params.api;
  //   params.api.setGridOptions({
  //   context: {
  //     groupOptionsMap: this.groupOptionsMap,
  //     component: this,
  //     handleMissingMaterialModal: this.handleMissingMaterialModal.bind(this)
  //   }
  // });
  }

  onZoneChange() {
    this.setAssemblyGridData();
    if (this.assemblyGridData.length > 0) {
      this.selectedAssemblyItemNumber = this.assemblyGridData[0].itemNumber;
    } else {
      this.assemblyGridAPI.getDisplayedRowAtIndex(0)?.setSelected(true);
      this.selectedAssemblyItemNumber = 0;
      this.selectedAssemblyData = null;
    }
    this.setComponentGridData();
  }

  //On section change in dropdown
  onSectionChange() {
    if (this.selectedSection == 1) {
      this.isLowerSection = true;
      this.isIntermediateSection = false;
      this.selectedZone = 1;
    }
    else if (this.selectedSection == 2) {
      this.isLowerSection = false;
      this.isIntermediateSection = true;
      this.selectedZone = 1;
    }
    else {
      this.isLowerSection = false;
      this.isIntermediateSection = false;
      this.selectedZone = null;
    }

    this.setAssemblyGridData();
    if (this.assemblyGridData.length > 0) {
      this.selectedAssemblyItemNumber = this.assemblyGridData[0].itemNumber;
    } else {
      this.assemblyGridAPI.getDisplayedRowAtIndex(0)?.setSelected(true);
      this.selectedAssemblyItemNumber = 0;
      this.selectedAssemblyData = null;
    }
    this.setComponentGridData();

    this.updateDesignTypeOptions();


  }

  updateDesignTypeOptions() {
    if (this.selectedSection === 3 || this.selectedSection === 2) {
      // Display Primary (1st value) and Contingency (3rd value)
      this.filteredDesignTypes = this.designTypes.filter(
        (item) => item.designTypeId === 1 || item.designTypeId === 3
      );
    } else if (this.selectedSection === 1) {
      // Display Primary and Secondary
      this.filteredDesignTypes = this.designTypes.filter(
        (item) => item.designTypeId === 1 || item.designTypeId === 2
      );
    } else {
      // Show all options if no section is selected
      this.filteredDesignTypes = [...this.designTypes];
    }

    // Refresh the grid to reflect changes
    this.assemblyGridAPI.refreshCells({ force: true });
  }

  //On Assembly row clicked
  onRowClicked(event: any) {
    const rowData = event.data;
    this.selectedAssemblyData = rowData;
    this.selectedAssemblyItemNumber = rowData.itemNumber;
    this.selectedRowNode = event.node;
    this.setComponentGridData();
  }

  // On Component Row Clicked with service call

  onComponentRowClicked(event: any) {
    const rowNode = event.node;
    const rowData = event.data;

    const compType = rowData?.componentTypeName;
    const suppPart = rowData?.supplierPartNumber;

    if (!compType || !suppPart) return;

    this.preloadGroupDropdowns(compType, suppPart, rowNode); // <-- This handles fetching + starting edit
  }

  // Method to ADD new assembly to the selected section and zone
  addAssembly() {
    // Generate new rows based on the section and zone
    const newRows = this.generateNewRowsForSection(0);
    this.commonService.addedRowsSchemanticData = [
      ...(this.commonService.addedRowsSchemanticData || []),
      ...newRows
    ];
    this.commonService.setAddedRowsData(this.commonService.addedRowsSchemanticData);
    // Add new rows to the list of assemblies
    this.allAssemblyDetails.push(...newRows);
    this.refreshGrids();

  }

  addSpaceoutAssembly() {
    // Generate new rows based on the section and zone
    const newRows = this.generateNewRowsForSection(this.assemblyTypes.find(item => item.assemblyTypeName == 'Assembly Space Out Component')?.assemblyTypeId);
    // Add new rows to the list of assemblies
    this.allAssemblyDetails.push(...newRows);

    this.openDialog(newRows[0]);
    this.refreshGrids();
  }

  refreshGrids() {
    // Update item numbers and refresh the grids
    this.assemblyBuilderService.updateAssembliesItemNumbers(this.allAssemblyDetails);
    this.assemblyBuilderService.updateComponentsItemNumber(this.allAssemblyDetails, this.allComponentDetails);
    this.setAssemblyGridData();
    this.setComponentGridData();
  }

  // Helper method to generate new assembly rows based on the section and zone
  private generateNewRowsForSection(assemblyTypeId: number): SchematicAssemblyDto[] {
    const newRows: SchematicAssemblyDto[] = [];
    let newItemNumber = 0;
    if (assemblyTypeId == 0) {
      newItemNumber = this.assemblyGridData.length > 0 ? this.assemblyGridData[0].itemNumber - 1 : 0;
    }
    else {
      const lastRow = this.allAssemblyDetails[this.allAssemblyDetails.length - 1];
      newItemNumber = this.allAssemblyDetails.length ? Number.isInteger(lastRow.itemNumber) ? lastRow.itemNumber + 1 : Math.ceil(lastRow.itemNumber) : 1;
    }
    const isSecondary = (this.selectedSection === 1 && this.selectedView === 2);

    if (this.selectedSection === 1) {
      // For "Lower" section
      if (this.selectedZone === 1) {
        newRows.push(this.assemblyBuilderService.createNewAssemblyRow(this.schematicId, 1, null, this.selectedSection, newItemNumber, 'Outer', this.userDetail, isSecondary, assemblyTypeId));
      }
      else {
        const CopyAssemblyId = this.assemblyBuilderService.generateUniqueId();
        newRows.push(this.assemblyBuilderService.createNewAssemblyRow(this.schematicId, this.selectedZone, CopyAssemblyId, this.selectedSection, newItemNumber, 'Outer', this.userDetail, isSecondary, assemblyTypeId));//creating a zone 2 assembly with CopyAssemblyId
        //newRows.push(...this.copyAssembly(CopyAssemblyId)); // copy to higher zones
      }
    }
    else if (this.selectedSection === 2) {
      // For "Intermediate" section
      if (this.selectedZone === 0) {
        newRows.push(this.assemblyBuilderService.createNewAssemblyRow(this.schematicId, null, null, this.selectedSection, newItemNumber, 'Outer', this.userDetail, isSecondary, assemblyTypeId));
      }
      else if (this.selectedZone === 1) {
        newRows.push(this.assemblyBuilderService.createNewAssemblyRow(this.schematicId, 1, null, this.selectedSection, newItemNumber, 'Outer', this.userDetail, isSecondary, assemblyTypeId));
      }
      else {
        const CopyAssemblyId = this.assemblyBuilderService.generateUniqueId();
        newRows.push(this.assemblyBuilderService.createNewAssemblyRow(this.schematicId, this.selectedZone, CopyAssemblyId, this.selectedSection, newItemNumber, 'Outer', this.userDetail, isSecondary, assemblyTypeId));//creating a zone 2 assembly with CopyAssemblyId
        //newRows.push(...this.copyAssembly(CopyAssemblyId)); // copy to higher zones
      }
    }
    else {
      // For "Upper" sections
      newRows.push(this.assemblyBuilderService.createNewAssemblyRow(this.schematicId, null, null, this.selectedSection, newItemNumber, 'Outer', this.userDetail, isSecondary, assemblyTypeId));
    }

    return newRows;
  }


  recalculateAssemblyItemNumbers() {
    // Step 1: Get the reordered data from the grid
    const updatedAssemblies: SchematicAssemblyDto[] = [...this.assemblyGridData];
    //find minimum item number from updatedAssemblies by iterating through each assembly
    let minItemNumber = updatedAssemblies[0].itemNumber;
    updatedAssemblies.forEach(assembly => {
      if (assembly.itemNumber < minItemNumber) {
        minItemNumber = assembly.itemNumber;
      }
    });
    this.assemblyGridAPI.forEachNodeAfterFilterAndSort((rowNode, index) => {
      if (rowNode.data) {
        // Update itemNumber for filtered data
        if (index == 0) {
          updatedAssemblies.filter(assembly => assembly.uniqueId == rowNode.data.uniqueId)[0].itemNumber = parseFloat(minItemNumber.toFixed(1));
        }
        else if (rowNode.data.designTypeID == 1 || rowNode.data.designTypeID == 2) {  //Primary
          minItemNumber = Number.isInteger(minItemNumber) ? minItemNumber + 1 : Math.ceil(minItemNumber);
          updatedAssemblies.filter(assembly => assembly.uniqueId == rowNode.data.uniqueId)[0].itemNumber = parseFloat(minItemNumber.toFixed(1));
        }
        else if (rowNode.data.designTypeID == 3) {  //Contigency
          minItemNumber += 0.1;
          updatedAssemblies.filter(assembly => assembly.uniqueId == rowNode.data.uniqueId)[0].itemNumber = parseFloat(minItemNumber.toFixed(1));
        }
      }
    });
    // Step 2: Update the corresponding records in allAssemblyDetails
    updatedAssemblies.forEach(updatedAssembly => {
      const globalIndex = this.allAssemblyDetails.findIndex(
        assembly => assembly.uniqueId === updatedAssembly.uniqueId
      );
      if (globalIndex !== -1) {
        this.allAssemblyDetails[globalIndex] = { ...updatedAssembly };
      }
    });

    //this.refreshGrids();
  }

  onAssemblyCellValueChanged(event: any) {
    const rowData = event.data;
    this.editedRowsData = rowData;
    // Store the edited row data and mark the source as "assembly"
    const currentEditedData = this.commonService.getEditedRowsData();
    currentEditedData.push({ ...rowData, source: 'assembly' }); // Mark the source as "assembly"
    this.commonService.setEditedRowsData(currentEditedData);  // Send to service
    this.commonService.editedRowsSchemanticData = this.editedRowsData;
    if (event.colDef.headerName === 'Design Type') {
      const row = this.editedRowsData;
      if (event.newValue == 3) {
        this.assemblyGridData.map((data: any) => {
          if (data.uniqueId == row.uniqueId) {
            data.designType = 'Contigency';
            data.designTypeID = 3;
          }
        });
        this.allAssemblyDetails.map((data: any) => {
          if (data.uniqueId == row.uniqueId) {
            data.designType = 'Contigency';
            data.designTypeID = 3;
          }
        });
      }
      if (event.newValue == 1) {
        this.assemblyGridData.map((data: any) => {
          if (data.uniqueId == row.uniqueId) {
            data.designType = 'Primary';
            data.designTypeID = 1;
          }
        });
        this.allAssemblyDetails.map((data: any) => {
          if (data.uniqueId == row.uniqueId) {
            data.designType = 'Primary';
            data.designTypeID = 1;

          }
        });
      }
      if (event.newValue == 2) {
        this.assemblyGridData.map((data: any) => {
          if (data.uniqueId == row.uniqueId) {
            data.designType = 'Secondary';
            data.designTypeID = 2;
          }
        });
        this.allAssemblyDetails.map((data: any) => {
          if (data.uniqueId == row.uniqueId) {
            data.designType = 'Secondary';
            data.designTypeID = 2;

          }
        });
      }
      this.updateComponentDesignType();
      this.recalculateAssemblyItemNumbers();
      this.refreshGrids();
    }
  }

  updateComponentDesignType() {
    this.allComponentDetails.forEach(component => {
      let assembly = this.allAssemblyDetails.find(assembly => assembly.schematicAssemblyID == component.schematicAssemblyID);
      if (assembly == null) {
        assembly = this.allAssemblyDetails.find(assembly => assembly.uniqueId == component.schematicAssemblyID);
      }
      component.designType = assembly?.designType;
      component.designTypeID = assembly?.designTypeID;
    });
  }

  onComponentCellValueChanged(event: any) {
    const rowData = event.data;
    this.editedRowsData = rowData;

    // Store the edited row data and mark the source as "component"
    const currentEditedData = this.commonService.getEditedRowsData();
    currentEditedData.push({ ...rowData, source: 'component' }); // Mark the source as "component"
    this.commonService.setEditedRowsData(currentEditedData);  // Send to service
    this.commonService.editedRowsSchemanticData = this.editedRowsData;

  }

  onRowDragEndAssembly(event: any) {
    // Step 1: Get the reordered data from the grid
    const updatedAssemblies: SchematicAssemblyDto[] = this.assemblyGridData
    //find minimum item number from updatedAssemblies by iterating through each assembly
    let minItemNumber = updatedAssemblies[0].itemNumber;
    updatedAssemblies.forEach(assembly => {
      if (assembly.itemNumber < minItemNumber) {
        minItemNumber = assembly.itemNumber;
      }
    });
    this.assemblyGridAPI.forEachNodeAfterFilterAndSort((rowNode, index) => {
      if (rowNode.data) {
        // Update itemNumber for filtered data
        updatedAssemblies.filter(assembly => assembly.uniqueId === rowNode.data.uniqueId)[0].itemNumber = minItemNumber++;
      }
    });
    // Step 2: Update the corresponding records in allAssemblyDetails
    updatedAssemblies.forEach(updatedAssembly => {
      const globalIndex = this.allAssemblyDetails.findIndex(
        assembly => assembly.uniqueId === updatedAssembly.uniqueId
      );
      if (globalIndex !== -1) {
        this.allAssemblyDetails[globalIndex] = { ...updatedAssembly };
      }
    });

    //this.updateAssembliesItemNumbers();
    this.recalculateAssemblyItemNumbers();
    this.assemblyBuilderService.updateComponentsItemNumber(this.allAssemblyDetails, this.allComponentDetails);
    // Refresh the grid to ensure it reflects the updated data
    this.setAssemblyGridData();
    this.setComponentGridData();
  }

  onRowDragEndComponent(event: RowDragEvent) {
    event.api.forEachNodeAfterFilterAndSort((rowNode, index) => {
      if (rowNode) {
        rowNode.setDataValue('subItemNumber', (index + 1).toString());
      }
    });
    this.updateComponentsSubItemNumbers();
  }

  addSpaceOutComponent(dataFromMdl: any) {
    //this.componentGridData = [];
    this.addSelectedComponents(dataFromMdl);
  }

  // Method to add a new component
  addSelectedComponents(dataFromMdl: any) {
    // Add components for the selected assembly
    const newComponents = this.generateComponentData(dataFromMdl, this.selectedAssemblyData);
    this.allComponentDetails.push(...newComponents);

    // Display success message
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `${newComponents.length} Components added`
    });
    if (this.selectedRowNode) {
      this.selectedRowNode.setExpanded(false);
      setTimeout(() => {
        this.selectedRowNode.setExpanded(true);
      }, 0);
    }
    this.componentGridData.forEach((element, index) => {
      element.subItemNumber = (index + 1).toString();
    });
    this.setComponentGridData();
  }

  onComponentDeleted() {
    if (this.selectedComponentData.schematicsDetailID !== 0) {
      this.selectedComponentData.isDeleted = 1;
    }
    else {
      this.allComponentDetails = this.allComponentDetails.filter(
        (component) => component.uniqueId !== this.selectedComponentData.uniqueId
      );
    }
  }


  // Helper method to generate component data
  private generateComponentData(dataFromMdl: any, assembly: SchematicAssemblyDto): SchematicDetailDto[] {
    this.componentGridData = this.allComponentDetails.filter(component => component.schematicAssemblyID == assembly.schematicAssemblyID);
    if (this.componentGridData.length == 0) {
      this.componentGridData = this.allComponentDetails.filter(component => component.schematicAssemblyID == assembly.uniqueId);
    }
    let subItemNr = this.componentGridData.length + 1; // Start numbering from the next available index
    return dataFromMdl.map((item: any) => this.buildComponentData(item, assembly, subItemNr++));
  }

  private buildComponentData(item: any, assembly: SchematicAssemblyDto, subItemNumber: number): SchematicDetailDto {
    let CopyComponentId = null;
    if (this.selectedSection === 1 && this.selectedZone === 2) {
      CopyComponentId = this.assemblyBuilderService.generateUniqueId();
    }
    if (this.selectedSection === 2 && this.selectedZone === 2) {
      CopyComponentId = this.assemblyBuilderService.generateUniqueId();
    }
    return {
      schematicsDetailID: 0, // New sub-item
      schematicAssemblyID: assembly.uniqueId,
      schematicsID: this.schematicId,
      cvX_CRW_ID: item.cvxCRWID,
      componentTypeName: item.componentTypeName,
      materialNumber: item.materialNumber,
      assemblyLengthinft: item.lengthinft,
      schematicsNotes: item.specialNotes,
      schematicsDetailDescription: item.materialDescription,
      itemNumber: assembly.itemNumber,
      subItemNumber: subItemNumber.toString(),
      userId: this.userDetail.uid,
      sectionID: assembly.sectionID,
      isDeleted: 0,
      copyComponentId: CopyComponentId,
      zoneID: assembly.zoneId,
      supplierPartNumber: item.supplierPartNumber,
      legacyRefNumber: item.legacyRefNumber,
      serialNumber: item.serialNumber,
      designTypeID: assembly.designTypeID, // Add designTypeID
      designType: assembly.designType,
      groupName: item.groupName, //groupname added
      uniqueId: this.assemblyBuilderService.generateUniqueId(), // Generate a unique ID for the component
    };
  }

  RemoveSchematicAssemblyIdForNewAssemblies() {
    this.allComponentDetails.forEach(component => {
      if (this.allAssemblyDetails.filter(assembly => assembly.uniqueId == component.schematicAssemblyID).length > 0) {
        component.schematicAssemblyID = 0;
      }
    });
  }

  //Method to save the schematic data
  saveSchematic() {
    const noassemblytype = this.allAssemblyDetails.filter(assembly => assembly.assemblyTypeID == 0 && assembly.isDeleted != 1);
    if (noassemblytype.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Assembly Type is required.'
      });
      return;
    }
    else {
      this.spinner.show();
      if (this.CopyZone) {
        const result = this.assemblyBuilderService.copyAndUpdateAssemblies(
          this.allAssemblyDetails || [],
          this.allComponentDetails || [],
          this.zoneCount,
          this.schematicId,
          this.userDetail,
          this.CopyZone || true
        );
        // console.log(this.CopyZone);
        if (result) {
          this.allAssemblyDetails = result.assemblies;
          this.allComponentDetails = result.components;
          // console.log(this.allComponentDetails,'result');
          
        }
      }
      this.RemoveSchematicAssemblyIdForNewAssemblies();
      this.saveAssembliesAndComponents();
    }
  }

  deleteDialogOpen(rowData: any) {
    this.selectedComponentData = rowData;
    this.displayDeleteComponentSchemanticDialog = true;  // Show the dialog
  }

  deleteAssemblyDialog(rowData: any) {
    this.selectedAssemblyData = rowData;
    this.displayDeleteComponentDialog = true;
  }

  deleteConfirm() {
    if (this.selectedAssemblyData.schematicAssemblyID !== 0) {
      this.selectedAssemblyData.isDeleted = 1;
      this.assemblyBuilderService.deleteComponentsOfDeletedAssembly(this.selectedAssemblyData, this.allComponentDetails);
    } else {
      this.allAssemblyDetails = this.allAssemblyDetails.filter(
        (assembly) => assembly.uniqueId !== this.selectedAssemblyData.uniqueId
      );
    }
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Newly added assembly deleted locally.',
    });
    this.displayDeleteComponentDialog = false;
    this.refreshGrids();
    return;
  }


  deleteDialogClose() {
    this.displayDeleteComponentSchemanticDialog = false;
    this.setComponentGridData();
    this.componentGridData.forEach((component, index) => {
      component.subItemNumber = (index + 1).toString();
    });
    this.updateComponentsSubItemNumbers();
  }

  saveAssembliesAndComponents() {
    //forkJoin([
    //  this.completionSchematicService.saveOrUpdateAssemblies(this.allAssemblyDetails),
    //  this.completionSchematicService.saveOrUpdateComponents(this.allComponentDetails)
    //])
    const schematicRequest: SchematicsRequest = {
      AssemblyDtos: this.allAssemblyDetails,
      DetailDtos: this.allComponentDetails.filter(component => component.itemNumber !== null && component.itemNumber !== undefined),
    };
    // console.log(this.allComponentDetails,'saveAssembliesAndComponents');

    this.schematicSubscription = this.completionSchematicService.upsertSchematics(schematicRequest)
      .subscribe({
        next: (schematicRequest) => {
          this.spinner.show();
          this.getAssemblyData();
          this.loadWellFeatures();

          if (this.isNewRecordAdded && (this.statusId == 2 || this.statusId == 3)) {
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
              userIdCreatedBy: ''
            };
            this.isNewRecordAdded = false;
            this.commonService.changeStatus(payload);

          }
          // Handle both responses here 
          // Show success messages for both operations
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Data has been successfully updated.'
          });
          this.editedRowsData = '';
          this.commonService.editedRowsSchemanticData = '';
          this.commonService.addedRowsSchemanticData = '';
          this.spinner.hide()
        },
        error: (error) => {
          this.spinner.hide();
          console.error('Error updating schematic or components', error);

          // Show error message for the failure
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An error occurred while updating schematic and components.'
          });
        }
      });
    // this.recalculateItemNumbers();
  }

  /******************* Component Method***************** */
  // Method to change the Assembly Grid data to display filtered by Section
  setAssemblyGridData() {
    if (this.selectedSection == 1) {
      this.assemblyGridData = this.allAssemblyDetails.filter(assembly => assembly.sectionID === this.selectedSection && assembly.zoneId == this.selectedZone && assembly.isDeleted === 0
        && assembly.designTypeID === this.selectedView
      );

    }
    else if (this.selectedSection == 2) {
      if (this.selectedZone == 0) {
        this.assemblyGridData = this.allAssemblyDetails.filter(assembly => {
          if (assembly.sectionID === this.selectedSection && assembly.zoneId == null && assembly.isDeleted === 0) {
            return assembly
          }
        });
      }
      else {
        this.assemblyGridData = this.allAssemblyDetails.filter(assembly => {
          if (assembly.sectionID === this.selectedSection && assembly.zoneId == this.selectedZone && assembly.isDeleted === 0) {
            return assembly;
          }
        });
      }
    }
    else {
      this.assemblyGridData = this.allAssemblyDetails.filter(assembly => {
        if (assembly.sectionID === this.selectedSection && assembly.isDeleted === 0) {
          return assembly;
        }
      });
    }
    //show the data sort by itemnumber
    this.assemblyGridData.sort((a, b) => a.itemNumber - b.itemNumber);

    if (this.assemblyOriginalLength) {
      if (this.assemblyOriginalLength == this.assemblyGridData?.length) {
        this.isNewRecordAdded = false;

      }
      else
        this.isNewRecordAdded = true;

    }
    else {
      this.assemblyOriginalLength = this.assemblyGridData?.length;
      this.isNewRecordAdded = false;
    }
    // this.recalculateItemNumbers();
  }

  //Algorithm for rearranging componets sub Item Numbers
  updateComponentsSubItemNumbers() {
    this.allComponentDetails = this.allComponentDetails
      .sort((a, b) => {
        if (a.sectionID == 2 && b.sectionID == 2) {
          return Number(a.subItemNumber) - Number(b.subItemNumber);
        }

        if (a.sectionID == 3 && b.sectionID == 3) {
          return Number(a.subItemNumber) - Number(b.subItemNumber);
        }

        if (a.sectionID == 1 && b.sectionID == 1 && a.zoneID == b.zoneID && a.zoneID <= 2) {
          return Number(a.subItemNumber) - Number(b.subItemNumber);
        }
      });
  }

  // Method to change the Component Grid data to display filtered by selected Item in selected section
  setComponentGridData() {
    if (this.selectedAssemblyItemNumber > 0) {
      if (this.selectedSection == 1) { //Lower Section
        this.componentGridData = this.allComponentDetails.filter(
          subItem => subItem.itemNumber === this.selectedAssemblyItemNumber
            && subItem.sectionID === this.selectedSection
            && subItem.isDeleted === 0
            && subItem.designTypeID === this.selectedView
        );
      }
      else {
        this.componentGridData = this.allComponentDetails.filter(
          subItem => subItem.itemNumber === this.selectedAssemblyItemNumber && subItem.sectionID === this.selectedSection
            && subItem.isDeleted === 0
        );
      }
      //sort by subitemnumber
      this.componentGridData.sort((a, b) => Number(a.subItemNumber) - Number(b.subItemNumber));
    } else {
      this.componentGridData = [];
    }
  }


  openDialog(rowData: any): void {
    this.showMdlDialog = true; // Open the dialog
    this.selectedAssemblyData = rowData; // Store the row data directly 
  }

  getRowNodeId = (data: any) => data.name; // Use a unique identifier
  //initial grid api preperation

  isGridDataAvailable(): boolean {
    return this.componentGridData && this.allComponentDetails.length > 0;
  };


  isZoneDisabled(): boolean {
    if (this.selectedSection == 3) {
      return false;
    } // Disable if not 'Lower'
  }

  isaddAssemblyDisabled() {
    if (this.selectedSection == 1 || this.selectedSection == 2) {
      return this.selectedZone == null || this.zoneCount == null || this.zoneCount <= 0;
    }
    else if (this.selectedSection == 3) { return false; }
    return true;
  }

  getDesignTypes(): void {
    this.schematicSubscription = this.lookupsService.getDesignTypes()
      .subscribe(
        {
          next: (res: DesignTypes[]) => {
            this.designTypes = res;
            this.initializeColumnDefs();
            this.updateDesignTypeOptions();

          },
          error: (err) => { }
        });
  }

  onViewSelectionChange(event: any) {
    this.selectedView = event.value;
    this.setAssemblyGridData();
    this.setComponentGridData();
  }

  onViewSelectionZoneChange(event: any) {
    this.selectedChangeZone = event.value;
    if (this.selectedChangeZone == true && this.CopyZone == false) {
      this.displayConfirmationZoneEnableDialog = true;
    }
    else if (this.selectedChangeZone == false && this.CopyZone == true) {
      this.displayConfirmationZoneDisableDialog = true;
    }
  }

  copyZoneSave() {
    const copyZoneValue = this.selectedChangeZone;
    let formData = {
      wellFeaturesId: this.wellFeatures[0]?.wellFeaturesId,
      schematicsId: this.schematicId,
      userIdModifiedBy: this.userDetail.uid,
      dateLastModified: new Date(),
      copyZone: copyZoneValue
    };

    this.schematicSubscription = this.completionSchematicService.saveOrUpdateWellFeatures(formData).subscribe(
      {
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Well features updated successfully' });
          this.loadWellFeatures();
        },
        error: (error) => {
          console.error('Error adding well features', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: error["errors"] });
        }
      }
    );

    if (copyZoneValue == true) {
      this.schematicSubscription = this.assemblyBuilderService.updateAssembliesForZoneChange(
        this.schematicId,
        this.wellFeatures[0].noOfZones,
        this.userDetail,
        copyZoneValue,
      ).subscribe({
        next: () => {
          this.displayConfirmationZoneEnableDialog = false;
          this.displayConfirmationZoneDisableDialog = false;
          this.loadWellFeatures();
          this.getAssemblyData();
        },
        error: (error) => {
          console.error('Error updating assemblies for zone change:', error);
          this.displayConfirmationZoneEnableDialog = false;
          this.displayConfirmationZoneDisableDialog = false;
        }
      });
    }
    else {
      this.displayConfirmationZoneEnableDialog = false;
      this.displayConfirmationZoneDisableDialog = false;
    }
  }


  onZoneClose() {
    this.selectedChangeZone = this.CopyZone;
    this.displayConfirmationZoneEnableDialog = false;
    this.displayConfirmationZoneDisableDialog = false;
  }
  get zoneOptions() {
    if (!this.CopyZone) {
      // When copyzone is false, display zones in descending order
      const options = [];
      if (this.selectedSection == 2) {
        options.push({ label: 'No Zone', value: 0 });
      }
      for (let i = this.zoneCount; i >= 1; i--) {
        options.push({ label: `Zone ${i}`, value: i });
      }
      return options;
    }
    else {
      if (this.isLowerSection) {
        return [
          { label: 'Zone 1', value: 1 },
          { label: 'Zone 2 -> ' + this.zoneCount, value: 2 }
        ];
      }
      if (this.isIntermediateSection) {
        return [
          { label: 'No Zone', value: 0 },
          { label: 'Zone 2 -> ' + this.zoneCount, value: 2 },
          { label: 'Zone 1', value: 1 }
        ];
      }
    }
  }

  // Method to show the clone assembly modal
  // This method is called when the "Clone Assembly" button is clicked
  showCloneModal(event: any) {
    this.cloneAssemblyData = event.rowData;
    this.displayCloneModal = true;
  }

  // Method to hide the clone assembly modal
  hideCloneAssembly() {
    this.displayCloneModal = false;
  }

  // Method to handle the clone assembly button click
  onCloneClick(formData: any) {
    this.cloneConfirmationContent.section = formData?.section?.sectionName;
    this.cloneConfirmationContent.zone = formData.zone?.label;
    this.displayColoneConfirmation = true;
    this.formData = formData;
  }

  cancelCloneBtn() {
    this.displayColoneConfirmation = false;
  }

  /**
   * Confirms the cloning of an assembly
   */
  confirmationCloneModal() {
    if (this.formData.schematicAssemblyID === 0) {
      this.assemblyBuilderService.cloneAssembly(
        this.allAssemblyDetails,
        this.allComponentDetails,
        this.formData.uniqueId,
        this.formData?.section?.sectionId,
        this.formData.zone?.value,
        this.formData.stringType,
        this.userDetail);
    }
    else {
      this.assemblyBuilderService.cloneAssembly(
        this.allAssemblyDetails,
        this.allComponentDetails,
        this.formData.schematicAssemblyID,
        this.formData?.section?.sectionId,
        this.formData.zone?.value,
        this.formData.stringType,
        this.userDetail);
    }
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Assembly Cloned Successfully' });
    this.displayCloneModal = false;
    this.displayColoneConfirmation = false;
    this.refreshGrids(); // Refresh the grids after cloning

  }

  get cloneContent() {
    return `You are attempting to clone ${this.cloneConfirmationContent?.cloneAssambly} and place it in  ${this.cloneConfirmationContent?.section}  ${this.cloneConfirmationContent?.zone} . If this is correct, click Clone, otherwise click Cancel`
  }

//   onProceedChange() {
//         if (!this.pendingGroupChange) return;

//         const { node, matched } = this.pendingGroupChange;

//         node.setDataValue('groupName', matched.groupName);
//         node.setDataValue('materialNumber', matched.materialNumber);
//         node.setDataValue('schematicsDetailDescription', matched.materialDescription);

//         this.componentGridAPI.refreshCells({
//           rowNodes: [node],
//           columns: ['materialNumber', 'schematicsDetailDescription'],
//           force: true
//         });

//         this.pendingGroupChange = null;
//         this.showMissingMM = false;
// }

// closeMissingModel() {
//   if (this.pendingGroupChange) {
//     this.pendingGroupChange.node.setDataValue('groupName', this.pendingGroupChange.oldValue);
//     this.pendingGroupChange = null;
//   }

//   this.showMissingMM = false;

//   //  this.pendingGroupChange = null;
//   // this.showMissingMM = false;
// }

}
