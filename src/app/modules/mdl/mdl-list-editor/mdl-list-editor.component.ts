/**
 * Component for managing various types of master data lists including:
 * - Component Types
 * - Connection Configurations
 * - End Connections
 * - Material Grades
 * - Ranges
 * - Suppliers/Organizations
 * - Connection Types
 * - Assembly Types
 * - RBW (Reduced Bore Wall)
 * 
 * Features:
 * - Add new items to each list type
 * - Edit existing items with inline grid editing
 * - Delete items with confirmation
 * - Filter lists by name/value
 * - Track changes for batch saving
 */
import { Component, Input, OnInit } from '@angular/core';
import { InventoryService } from '../../../services/inventory.service';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from 'primeng/api';
import { ConnectionTypeService } from '../../../services/connection-type.service';
import { AssemblyTypeService } from '../../../services/assembly-type.service';
import { ComponentTypeModel } from '../../../common/model/ComponentTypeModel';
import { ConnectionConfigModel } from '../../../common/model/ConnectionConfigModel';
import { EndConnectionsModel } from '../../../common/model/EndConnectionsModel';
import { MaterialGradeModel } from '../../../common/model/MaterialGradeModel';
import { RangeModel } from '../../../common/model/RangeModel';
import { OrganizationModel } from '../../../common/model/OrganizationModel';
import { ManufacturerModel } from '../../../common/model/ManufacturerModel';
import { ConnectionTypeModel } from '../../../common/model/ConnectionTypeModel';
import { AssemblyTypeModel } from '../../../common/model/AssemblyTypeModel';
import { RbwModel } from '../../../common/model/rbw.model';
import { RbwService } from '../../../services/rbw.service';
import { SupplierService } from '../../../services/supplier.service';
import { ListEditorService } from '../../../services/list-editor.service';
import { ManufactureService } from '../../../services/manufacture.service';
import { AccessControls } from '../../../common/constant';
import { CommonService } from '../../../services/common.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { DeleteConfirmationDialogComponent } from '../../common/delete-confirmation-dialog/delete-confirmation-dialog.component';


@Component({
  selector: 'app-mdl-list-editor',
  standalone: true,
  imports: [...PRIME_IMPORTS, DeleteConfirmationDialogComponent],
  templateUrl: './mdl-list-editor.component.html'
})
export class MdlListEditorComponent implements OnInit {
  /** Flag to control visibility of the list editor dialog */
  isListEditorVisible = false;

  /** Arrays to store different types of list data */
  componentTypes: Array<ComponentTypeModel> = [];
  connectionConfigs: Array<ConnectionConfigModel> = [];
  endConnections: Array<EndConnectionsModel> = [];
  materialGrades: Array<MaterialGradeModel> = [];
  ranges: Array<RangeModel> = [];
  suppliers: Array<OrganizationModel> = [];
  manufacturerType: Array<OrganizationModel> = [];
  connectionTypes: Array<ConnectionTypeModel> = [];
  assemblyTypes: Array<AssemblyTypeModel> = [];
  rbws: Array<RbwModel> = [];
  @Input() isEditAllowed: boolean = false; // Checking the editability based on user access

  /** User details for tracking create/modify operations */
  userDetail: any;

  /** Name of item to be displayed in delete confirmation dialog */
  deleteItemDataName: string;
  /** Controls visibility of delete confirmation dialog */
  displayDeleteComponentDialog: boolean = false;

  /** Available list types that can be edited */
  lists = [
    { label: 'Component Type', value: 'componentType' },
    { label: 'Connection Config', value: 'connectionConfig' },
    { label: 'End Connections', value: 'endConnections' },
    { label: 'Material Grade', value: 'materialGrade' },
    { label: 'Range', value: 'range' },
    { label: 'Supplier', value: 'supplier' },
    { label: 'Manufacturer', value: 'manufacturerType' },
    { label: 'Connection Type', value: 'connectionType' },
    { label: 'Assembly Type', value: 'assemblyType' },
    { label: 'RBW', value: 'rbw' }
  ];

  /** Currently selected list type */
  selectedList: string;

  /** Filtered items for display */
  filteredItems = [];

  /** Text inputs for adding new items to each list type */
  componentTypeText = '';
  connectionConfigText = '';
  endConnectionsText = '';
  materialGradeText = '';
  rangeText = '';
  supplierText = '';
  manufacturerText = '';
  connectionTypeText = '';
  assemblyTypeText = '';
  rbwText: number | string = "";

  // Stores metadata for different ag-Grid tables, including type identifier, data to be deleted, and grid API reference
  tableDeletingData: Array<any> = [
    { type: 'componentType', agData: [], gridApi: null },  // Connection configuration table
    { type: 'connectionConfig', agData: [], gridApi: null },   // End connection table
    { type: 'endConnection', agData: [], gridApi: null },   // Material grade table
    { type: 'materialGrade', agData: [], gridApi: null },   // Range table
    { type: 'range', agData: [], gridApi: null },             // Organization table
    { type: 'supplier', agData: [], gridApi: null },             // Supplier table ---- changing the organization string with supplier
    { type: 'connectionType', agData: [], gridApi: null },
    { type: 'manufacturerType', agData: [], gridApi: null },   // Assembly type table
    { type: 'assemblyType', agData: [], gridApi: null },   // RBW table 
    { type: 'rbw', agData: [], gridApi: null }

  ]

  /** Column definitions for ag-grid */
  private createColumnDefs(headerName: string, fieldName: string, type: string): any[] {
    return [
      {
        headerName: headerName,
        field: fieldName,
        editable: true,
        sortable: true, filter: false, pinned: "left",
        checkboxSelection: true,
      }
    ];
  }

  // Replace individual columnDefs with factory calls
  columnDefsComponentType = this.createColumnDefs('Component Type', 'componentTypeName', 'componentType');
  columnDefsConnectionConfig = this.createColumnDefs('Connection Config', 'connectionConfigName', 'connectionConfig');
  columnDefsEndConnections = this.createColumnDefs('End Connections', 'endConnectionName', 'endConnection');
  columnDefsMaterialGrade = this.createColumnDefs('Material Grade', 'materialGrade', 'materialGrade');
  columnDefsRange = this.createColumnDefs('Range', 'rangeName', 'range');
  columnDefsSupplier = this.createColumnDefs('Supplier', 'organizationName', 'supplier'); // Replacing organization with supplier
  columnDefsManufacturer = this.createColumnDefs('Manufacturer', 'organizationName', 'manufacturerType');
  columnDefsConnectionType = this.createColumnDefs('Connection Type', 'name', 'connectionType');
  columnDefsAssemblyType = this.createColumnDefs('Assembly Type', 'assemblyTypeName', 'assemblyType');
  columnDefsRbw = this.createColumnDefs('RBW', 'value', 'rbw');

  /** Array to track edited rows before saving */
  editedRows: { type: string, data: any }[] = [];

  /** Data and type of item being deleted */
  deleteItemData: any;
  deleteItemType: string;
  isEditableField:boolean= false;
  isDeleteEditable:boolean= false;

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private messageService: MessageService,
    private connectionTypeService: ConnectionTypeService,
    private assemblyTypeService: AssemblyTypeService,
    private rbwService: RbwService,
    private listEditorService: ListEditorService,
    private supplierService: SupplierService,
    private manufacturerService: ManufactureService,
    private commonService:CommonService
  ) { }

  /**
   * Initialize component by getting user details
   */
  ngOnInit() {
    this.getUserDetails();
    this.userDetail = this.authService.getUserDetail();
  }
    /**
     *  it will get the user details from jwt token
     */

     getUserDetails() {
        let userAccess = this.authService.isAuthorized(
          AccessControls.MDL_DRILLING_ACCESS
        );
        this.commonService.setuserAccess(userAccess);
        this.isEditableField = this.authService.isFieldEditable('isEditAddRecord');
        this.isDeleteEditable = this.authService.isFieldEditable('IsAddDeleteListEditor');
      }
  /**
   * Close the list editor dialog
   * Resets all input fields and edited rows
   */
  closeDialog() {
    if (this.editedRows.length > 0) {
      // Show confirmation dialog before closing
    }
    this.componentTypeText = '';
    this.connectionConfigText = '';
    this.endConnectionsText = '';
    this.materialGradeText = '';
    this.rangeText = '';
    this.supplierText = '';
    this.manufacturerText = '';
    this.connectionTypeText = '';
    this.assemblyTypeText = '';
    this.rbwText = 0;
    this.editedRows = [];
    this.isListEditorVisible = false;
  }

  /**
   * Handles the grid initialization for Component Type data
   * Loads component type data and adjusts column width to fit the grid
   * @param params Grid API parameters from ag-grid
   */
  onGridReadyComponentType(params) {
    this.getComponentType();
    params.api.sizeColumnsToFit(); // Adjusts columns to fit the grid width
    this.getMethodName(params.api, "componentType")   // Calls a method to perform some action using the grid API and a string identifier "componentType"
  }

  /**
   * Retrieves component type data from the inventory service
   * Filters out soft-deleted items (isDeleted = 1)
   * Updates the componentTypes array with the fetched data
   */
  getComponentType() {
    this.inventoryService.getComponentType().subscribe((response) => {
      this.componentTypes = response.filter((item: any) => item.isDeleted != 1);
    }, (error) => {
      console.error('Error fetching record', error);
    });
  }

  /**
   * Filters the component types based on user input text
   * Performs case-insensitive search on componentTypeName
   * @returns Filtered array of component types
   */
  get filteredComponentTypes() {
    if (!this.componentTypeText || this.componentTypeText.trim() === '' || this.componentTypeText === '0') {
      return this.componentTypes;
    }
    return this.componentTypes.filter(item =>
      item.componentTypeName.toLowerCase().includes(this.componentTypeText.toLowerCase())
    );
  }

  /**
   * Creates a new component type with the entered text
   * Sets default values for audit fields (created by, modified by, dates)
   * Refreshes the component type list after successful creation
   */
  addComponentType() {
    let componentType = new ComponentTypeModel();
    componentType.componentTypeName = this.componentTypeText;
    componentType.userIdCreatedBy = this.userDetail.uid;
    componentType.userIdModifiedBy = this.userDetail.uid;
    componentType.dateCreated = new Date();
    componentType.dateLastModified = new Date();
    componentType.isDeleted = 0;
    this.inventoryService.addComponentType(componentType).subscribe((response) => {
      this.getComponentType();
      this.componentTypeText = '';
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Component Type saved successfully' });
    }, (error) => {
      console.error('Error saving record', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
    });
  }

  /**
   * Handles the grid initialization for Connection Config data
   * Loads connection config data and adjusts column width to fit the grid
   * @param params Grid API parameters from ag-grid
   */
  onGridReadyConnectionConfig(params) {
    this.getConnectionConfig();
    params.api.sizeColumnsToFit(); // Adjusts columns to fit the grid widt
    this.getMethodName(params.api, "connectionConfig")  // // Calls a method to perform some action using the grid API and a string identifier "connectionConfig"
  }

  /**
   * Retrieves connection configuration data from the inventory service
   * Filters out soft-deleted items (isDeleted = 1)
   * Updates the connectionConfigs array with the fetched data
   */
  getConnectionConfig() {
    this.inventoryService.getConnectionConfig().subscribe((response) => {
      this.connectionConfigs = response.filter((item: any) => item.isDeleted != 1);
    }, (error) => {
      console.error('Error fetching record', error);
    });
  }

  /**
   * Filters the connection configs based on user input text
   * Performs case-insensitive search on connectionConfigName
   * @returns Filtered array of connection configs
   */
  get filteredConnectionConfigs() {
    if (!this.connectionConfigText || this.connectionConfigText.trim() === '' || this.connectionConfigText === '0') {
      return this.connectionConfigs;
    }
    return this.connectionConfigs.filter(item =>
      item.connectionConfigName.toLowerCase().includes(this.connectionConfigText.toLowerCase())
    );
  }

  /**
   * Creates a new connection config with the entered text
   * Sets default values for audit fields (created by, modified by, dates)
   * Refreshes the connection config list after successful creation
   */
  addConnectionConfig() {
    let connectionConfig = new ConnectionConfigModel();
    connectionConfig.connectionConfigName = this.connectionConfigText;
    connectionConfig.connectionConfigType = 'std';
    connectionConfig.userIdCreatedBy = this.userDetail.uid;
    connectionConfig.userIdModifiedBy = this.userDetail.uid;
    connectionConfig.dateCreated = new Date();
    connectionConfig.dateLastModified = new Date();
    connectionConfig.isDeleted = 0;
    this.inventoryService.addConnectionConfig(connectionConfig).subscribe((response) => {
      this.getConnectionConfig();
      this.connectionConfigText = '';
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Connection Config saved successfully' });
    }, (error) => {
      console.error('Error saving record', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
    });
  }

  /**
   * Handles the grid initialization for End Connections data
   * Loads end connections data and adjusts column width to fit the grid
   * @param params Grid API parameters from ag-grid
   */
  onGridReadyEndConnections(params) {
    this.getEndConnections();
    params.api.sizeColumnsToFit(); // Adjusts columns to fit the
    this.getMethodName(params.api, "endConnection") // // Calls a method to perform some action using the grid API and a string identifier "endConnection"
  }

  /**
   * Retrieves end connection data from the inventory service
   * Filters out soft-deleted items (isDeleted = 1)
   * Updates the endConnections array with the fetched data
   */
  getEndConnections() {
    this.inventoryService.getEndConnections().subscribe((response) => {
      this.endConnections = response.filter((item: any) => item.isDeleted != 1);
    }, (error) => {
      console.error('Error fetching record', error);
    });
  }

  /**
   * Filters the end connections based on user input text
   * Performs case-insensitive search on endConnectionName
   * @returns Filtered array of end connections
   */
  get filteredEndConnections() {
    if (!this.endConnectionsText || this.endConnectionsText.trim() === '' || this.endConnectionsText === '0') {
      return this.endConnections;
    }
    return this.endConnections.filter(item =>
      item.endConnectionName.toLowerCase().includes(this.endConnectionsText.toLowerCase())
    );
  }

  /**
   * Creates a new end connection with the entered text
   * Sets default values for audit fields (created by, modified by, dates)
   * Refreshes the end connections list after successful creation
   */
  addEndConnection() {
    let endConnection = new EndConnectionsModel();
    endConnection.endConnectionName = this.endConnectionsText;
    endConnection.userIdCreatedBy = this.userDetail.uid;
    endConnection.userIdModifiedBy = this.userDetail.uid;
    endConnection.dateCreated = new Date();
    endConnection.dateLastModified = new Date();
    endConnection.isDeleted = 0;
    this.inventoryService.addEndConnection(endConnection).subscribe((response) => {
      this.getEndConnections();
      this.endConnectionsText = '';
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'End Connection saved successfully' });
    }, (error) => {
      console.error('Error saving record', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
    });
  }

  /**
   * Handles the grid initialization for Material Grade data
   * Loads material grade data and adjusts column width to fit the grid
   * @param params Grid API parameters from ag-grid
   */
  onGridReadyMaterialGrade(params) {
    this.getMaterialGrade();
    params.api.sizeColumnsToFit(); // Adjusts columns to fit the grid width
    this.getMethodName(params.api, "materialGrade") // // Calls a method to perform some action using the grid API and a string identifier "materialGrade"
  }

  /**
   * Retrieves material grade data from the inventory service
   * Filters out soft-deleted items (isDeleted = 1)
   * Updates the materialGrades array with the fetched data
   */
  getMaterialGrade() {
    this.inventoryService.getMaterialGrade().subscribe((response) => {
      this.materialGrades = response.filter((item: any) => item.isDeleted != 1);
    }, (error) => {
      console.error('Error fetching record', error);
    });
  }

  /**
   * Filters the material grades based on user input text
   * Performs case-insensitive search on materialGrade
   * @returns Filtered array of material grades
   */
  get filteredMaterialGrades() {
    if (!this.materialGradeText || this.materialGradeText.trim() === '' || this.materialGradeText === '0') {
      return this.materialGrades;
    }
    return this.materialGrades.filter(item =>
      item.materialGrade.toLowerCase().includes(this.materialGradeText.toLowerCase())
    );
  }

  /**
   * Creates a new material grade with the entered text
   * Sets default values for audit fields (created by, modified by, dates)
   * Refreshes the material grades list after successful creation
   */
  addMaterial() {
    let materialGrade = new MaterialGradeModel();
    materialGrade.materialGrade = this.materialGradeText;
    materialGrade.userIdCreatedBy = this.userDetail.uid;
    materialGrade.userIdModifiedBy = this.userDetail.uid;
    materialGrade.dateCreated = new Date();
    materialGrade.dateLastModified = new Date();
    materialGrade.isDeleted = 0;
    this.inventoryService.addMaterialGrade(materialGrade).subscribe((response) => {
      this.getMaterialGrade();
      this.materialGradeText = '';
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Material Grade saved successfully' });
    }, (error) => {
      console.error('Error saving record', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
    });
  }

  /**
   * Handles the grid initialization for Range data
   * Loads range data and adjusts column width to fit the grid
   * @param params Grid API parameters from ag-grid
   */
  onGridReadyRange(params) {
    this.getRange();
    params.api.sizeColumnsToFit(); // Adjusts columns to fit the grid width
    this.getMethodName(params.api, "range") // // Calls a method to perform some action using the grid API and a string identifier "range"
  }

  /**
   * Retrieves range data from the inventory service
   * Filters out soft-deleted items (isDeleted = 1)
   * Updates the ranges array with the fetched data
   */
  getRange() {
    this.inventoryService.getRange().subscribe((response) => {
      this.ranges = response.filter((item: any) => item.isDeleted != 1);
    }, (error) => {
      console.error('Error fetching record', error);
    });
  }

  /**
   * Filters the ranges based on user input text
   * Performs case-insensitive search on rangeName
   * @returns Filtered array of ranges
   */
  get filteredRanges() {
    if (!this.rangeText || this.rangeText.trim() === '' || this.rangeText === '0') {
      return this.ranges;
    }
    return this.ranges.filter(item =>
      item.rangeName.toLowerCase().includes(this.rangeText.toLowerCase())
    );
  }

  /**
   * Creates a new range with the entered text
   * Sets default values for audit fields (created by, modified by, dates)
   * Refreshes the ranges list after successful creation
   */
  addRange() {
    let range = new RangeModel();
    range.rangeName = this.rangeText;
    range.userIdCreatedBy = this.userDetail.uid;
    range.userIdModifiedBy = this.userDetail.uid;
    range.dateCreated = new Date();
    range.dateLastModified = new Date();
    range.isDeleted = 0;
    this.inventoryService.addRange(range).subscribe((response) => {
      this.getRange();
      this.rangeText = '';
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Range saved successfully' });
    }, (error) => {
      console.error('Error saving record', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
    });
  }

  /**
   * Handles the grid initialization for Organization (Supplier) data
   * Loads organization data and adjusts column width to fit the grid
   * @param params Grid API parameters from ag-grid
   */
  onGridReadySupplier(params) {
    this.getSupplier();
    params.api.sizeColumnsToFit(); // Adjusts columns to fit the
    this.getMethodName(params.api, "supplier") // // Calls a method to perform some action using the grid API and a string identifier "materialGrade"
  }

  /**
   * Retrieves organization data from the inventory service
   * Filters out soft-deleted items (isDeleted = 1)
   * Updates the suppliers array with the fetched data
   */
  getSupplier() {
    this.supplierService.getSupplier().subscribe((response) => {
      this.suppliers = response.filter((item: any) => item.isDeleted != 1);
    }, (error) => {
      console.error('Error fetching record', error);
    });
  }

  /**
   * Filters the suppliers based on user input text
   * Performs case-insensitive search on organizationName
   * @returns Filtered array of suppliers
   */
  get filteredSuppliers() {
    if (!this.supplierText || this.supplierText.trim() === '' || this.supplierText === '0') {
      return this.suppliers;
    }
    return this.suppliers.filter(item =>
      item.organizationName.toLowerCase().includes(this.supplierText.toLowerCase())
    );
  }

  /**
   * Creates a new organization (supplier) with the entered text
   * Sets default values for audit fields (created by, modified by, dates)
   * Refreshes the suppliers list after successful creation
   */
  addSupplier() {
    let organization = new OrganizationModel();
    organization.organizationName = this.supplierText;
    organization.userIdCreatedBy = this.userDetail.uid;
    organization.userIdModifiedBy = this.userDetail.uid;
    organization.dateCreated = new Date();
    organization.dateLastModified = new Date();
    organization.isDeleted = 0;
    organization.functionId = 1; // Set a supplier functionId
    this.supplierService.addSupplier(organization).subscribe((response) => {
      this.getSupplier();
      this.supplierText = '';
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Supplier saved successfully' });
    }, (error) => {
      console.error('Error saving record', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
    });
  }

  /**
   * Handles the grid initialization for Connection Type data
   * Loads connection type data and adjusts column width to fit the grid
   * @param params Grid API parameters from ag-grid
   */
  onGridReadyConnectionType(params) {
    this.getConnectionType();
    params.api.sizeColumnsToFit();
    this.getMethodName(params.api, "connectionType")   // // Calls a method to perform some action using the grid API and a string identifier "connectionType"
  }

  /**
   * Retrieves connection type data from the connection type service
   * Filters out soft-deleted items (isDeleted = 1)
   * Updates the connectionTypes array with the fetched data
   */
  getConnectionType() {
    this.connectionTypeService.getConnectionType().subscribe((response) => {
      this.connectionTypes = response.filter((item: any) => item.isDeleted != 1);
    }, (error) => {
      console.error('Error fetching record', error);
    });
  }

  /**
   * Filters the connection types based on user input text
   * Performs case-insensitive search on name
   * @returns Filtered array of connection types
   */
  get filteredConnectionTypes() {
    if (!this.connectionTypeText || this.connectionTypeText.trim() === '' || this.connectionTypeText === '0') {
      return this.connectionTypes;
    }
    return this.connectionTypes.filter(item =>
      item.name?.toLowerCase().includes(this.connectionTypeText.toLowerCase())
    );
  }

  /**
   * Creates a new connection type with the entered text
   * Sets default values for audit fields (created by, modified by, dates)
   * Refreshes the connection types list after successful creation
   */
  addConnectionType() {
    let connectionType = new ConnectionTypeModel();
    connectionType.name = this.connectionTypeText;
    connectionType.userIdCreatedBy = this.userDetail.uid;
    connectionType.userIdModifiedBy = this.userDetail.uid;
    connectionType.dateCreated = new Date();
    connectionType.dateLastModified = new Date();
    connectionType.isDeleted = 0;

    this.connectionTypeService.addConnectionType(connectionType).subscribe((response) => {
      this.getConnectionType();
      this.connectionTypeText = '';
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Connection Type saved successfully' });
    }, (error) => {
      console.error('Error saving record', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
    });
  }

  /**
   * Handles the grid initialization for Assembly Type data
   * Loads assembly type data and adjusts column width to fit the grid
   * @param params Grid API parameters from ag-grid
   */
  onGridReadyAssemblyType(params) {
    this.getAssemblyType();
    params.api.sizeColumnsToFit();
    this.getMethodName(params.api, "assemblyType")  // // Calls a method to perform some action using the grid API and a string identifier "assemblyType"
  }

  /**
   * Retrieves assembly type data from the assembly type service
   * Filters out soft-deleted items (isDeleted = 1)
   * Updates the assemblyTypes array with the fetched data
   */
  getAssemblyType() {
    this.assemblyTypeService.getAssemblyType().subscribe((response) => {
      this.assemblyTypes = response.filter((item: any) => item.isDeleted != 1);
    }, (error) => {
      console.error('Error fetching record', error);
    });
  }

  /**
   * Filters the assembly types based on user input text
   * Performs case-insensitive search on assemblyTypeName
   * @returns Filtered array of assembly types
   */
  get filteredAssemblyTypes() {
    if (!this.assemblyTypeText || this.assemblyTypeText.trim() === '' || this.assemblyTypeText === '0') {
      return this.assemblyTypes;
    }
    return this.assemblyTypes.filter(item =>
      item.assemblyTypeName.toLowerCase().includes(this.assemblyTypeText.toLowerCase())
    );
  }

  /**
   * Creates a new assembly type with the entered text
   * Sets default values for audit fields (created by, modified by, dates)
   * Refreshes the assembly types list after successful creation
   */
  addAssemblyType() {
    let assemblyType = new AssemblyTypeModel();
    assemblyType.assemblyTypeName = this.assemblyTypeText;
    assemblyType.userIdCreatedBy = this.userDetail.uid;
    assemblyType.userIdModifiedBy = this.userDetail.uid;
    assemblyType.dateCreated = new Date();
    assemblyType.dateLastModified = new Date();
    assemblyType.isDeleted = 0;

    this.assemblyTypeService.addAssemblyType(assemblyType).subscribe((response) => {
      this.getAssemblyType();
      this.assemblyTypeText = '';
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Assembly Type saved successfully' });
    }, (error) => {
      console.error('Error saving record', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
    });
  }

  /**
   * Handles the grid initialization for Assembly Type data
   * Loads assembly type data and adjusts column width to fit the grid
   * @param params Grid API parameters from ag-grid
   */
  onGridReadyManufacture(params) {
    this.getManufacturerType();
    params.api.sizeColumnsToFit();
    this.getMethodName(params.api, "manufacturerType")  // // Calls a method to perform some action using the grid API and a string identifier "assemblyType"
  }

  /**
   * Retrieves assembly type data from the assembly type service
   * Filters out soft-deleted items (isDeleted = 1)
   * Updates the assemblyTypes array with the fetched data
   */
  getManufacturerType() {
    this.manufacturerService.getManufacturerType().subscribe((response) => {
      this.manufacturerType = response.filter((item: any) => item.isDeleted != 1);
    }, (error) => {
      console.error('Error fetching record', error);
    });
  }

  /**
   * Filters the assembly types based on user input text
   * Performs case-insensitive search on assemblyTypeName
   * @returns Filtered array of assembly types
   */
  get filteredManufacturer() {
    if (!this.manufacturerText || this.manufacturerText.trim() === '' || this.manufacturerText === '0') {
      return this.manufacturerType;
    }
    return this.manufacturerType.filter(item =>
      item.organizationName.toLowerCase().includes(this.manufacturerText.toLowerCase())
    );
  }

  /**
   * Creates a new assembly type with the entered text
   * Sets default values for audit fields (created by, modified by, dates)
   * Refreshes the assembly types list after successful creation
   */
  addManufacturerType() {
    let manufacturerType = new OrganizationModel();
    manufacturerType.organizationName = this.manufacturerText;
    manufacturerType.userIdCreatedBy = this.userDetail.uid;
    manufacturerType.userIdModifiedBy = this.userDetail.uid;
    manufacturerType.dateCreated = new Date();
    manufacturerType.dateLastModified = new Date();
    manufacturerType.isDeleted = 0;
    manufacturerType.functionId = 2;

    this.manufacturerService.addManufacturerType(manufacturerType).subscribe((response) => {
      this.getManufacturerType();
      this.manufacturerText = '';
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Manufacturer saved successfully' });
    }, (error) => {
      console.error('Error saving record', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
    });
  }

  /**
   * Handles the grid initialization for RBW data
   * Loads RBW data and adjusts column width to fit the grid
   * @param params Grid API parameters from ag-grid
   */
  onGridReadyRbw(params) {
    this.getRbw();
    params.api.sizeColumnsToFit();
    this.getMethodName(params.api, "rbw") // // Calls a method to perform some action using the grid API and a string identifier "rbw"
  }

  /**
   * Retrieves RBW data from the RBW service
   * Filters out soft-deleted items (isDeleted = 1)
   * Updates the rbws array with the fetched data
   */
  getRbw() {
    this.rbwService.getRbw().subscribe((response) => {
      this.rbws = response.filter((item: any) => item.isDeleted != 1);
    }, (error) => {
      console.error('Error fetching record', error);
    });
  }

  /**
   * Filters the RBW values based on user input
   * @returns Filtered array of RBW values
   */
  get filteredRbws() {
    if (this.rbwText == 0 || this.rbwText == null || this.rbwText == undefined) {
      return this.rbws;
    }
    return this.rbws.filter(item =>
      item.value.toString().includes(this.rbwText.toString())
    );
  }

  /**
   * Creates a new RBW value with the entered text
   * Sets default values for audit fields (created by, modified by, dates)
   * Refreshes the RBW list after successful creation
   */
  addRbw() {
    let rbw = new RbwModel();
    rbw.value = this.rbwText;
    rbw.userIdCreatedBy = this.userDetail.uid;
    rbw.userIdModifiedBy = this.userDetail.uid;
    rbw.dateCreated = new Date();
    rbw.dateLastModified = new Date();
    rbw.isDeleted = 0;

    this.rbwService.addRbw(rbw).subscribe((response) => {
      this.getRbw();
      this.rbwText = 0;
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'RBW saved successfully' });
    }, (error) => {
      console.error('Error saving record', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
    });
  }

  /**
   * Add or update an edit in the editedRows array
   * @param edit Object containing the type and data of the edit
   */
  private addOrUpdateEdit(edit: { type: string, data: any }) {
    // Look for an existing edit for this item
    const existingEditIndex = this.editedRows.findIndex(e =>
      e.type === edit.type && this.getIdForType(e.type, e.data) === this.getIdForType(edit.type, edit.data)
    );

    if (existingEditIndex !== -1) {
      // Update the existing edit with the new value
      this.editedRows[existingEditIndex].data.originalValue = this.editedRows[existingEditIndex].data.originalValue;
      this.editedRows[existingEditIndex].data[this.getFieldNameForType(edit.type)] = edit.data[this.getFieldNameForType(edit.type)];
    } else {
      // Add as a new edit
      this.editedRows.push(edit);
    }
  }

  /**
   * Get the ID field name for a given type
   * @param type The type of item
   * @param data The item data
   * @returns The ID value for the item
   */
  private getIdForType(type: string, data: any): any {
    switch (type) {
      case 'componentType':
        return data.componentTypeId;
      case 'connectionConfig':
        return data.connectionConfigId;
      case 'endConnection':
        return data.endConnectionId;
      case 'materialGrade':
        return data.materialGradeId;
      case 'range':
        return data.rangeId;
      case 'supplier': // Replacing organization with supplier
        return data.organizationId;
      case 'connectionType':
        return data.id;
        case 'manufacturerType':
        return data.organizationId;
      case 'assemblyType':
        return data.assemblyTypeId;
      case 'rbw':
        return data.Id;
      default:
        return null;
    }
  }

  private getFieldNameForType(type: string): string {
    switch (type) {
      case 'componentType':
        return 'componentTypeName';
      case 'connectionConfig':
        return 'connectionConfigName';
      case 'endConnection':
        return 'endConnectionName';
      case 'materialGrade':
        return 'materialGrade';
      case 'range':
        return 'rangeName';
      case 'supplier': // Replacing organization with supplier
        return 'organizationName';
      case 'connectionType':
        return 'name';
      case 'manufacturerType':
        return 'organizationName';
      case 'assemblyType':
        return 'assemblyTypeName';
      case 'rbw':
        return 'value';
      default:
        return '';
    }
  }

  // Update cell value changed handlers to use addOrUpdateEdit
  /**
   * Records changes made to cells in the component type grid
   * Creates an edit record with the new value and audit information
   * @param params Grid edit event parameters containing old and new values
   */
  onComponentTypeCellValueChanged(params: any) {
    this.addOrUpdateEdit({
      type: 'componentType',
      data: {
        componentTypeName: params.newValue,
        componentTypeId: params.data.componentTypeId,
        userIdModifiedBy: this.userDetail.uid,
        dateLastModified: new Date(),
        isDeleted: 0,
        originalValue: params.oldValue
      }
    });
  }

  /**
   * Records changes made to cells in the connection config grid
   * Creates an edit record with the new value and audit information
   * @param params Grid edit event parameters containing old and new values
   */
  onConnectionConfigCellValueChanged(params: any) {
    this.addOrUpdateEdit({
      type: 'connectionConfig',
      data: {
        connectionConfigName: params.newValue,
        connectionConfigId: params.data.connectionConfigId,
        userIdModifiedBy: this.userDetail.uid,
        dateLastModified: new Date(),
        isDeleted: 0,
        originalValue: params.oldValue
      }
    });
  }

  /**
   * Records changes made to cells in the end connection grid
   * Creates an edit record with the new value and audit information
   * @param params Grid edit event parameters containing old and new values
   */
  onEndConnectionCellValueChanged(params: any) {
    this.addOrUpdateEdit({
      type: 'endConnection',
      data: {
        endConnectionName: params.newValue,
        endConnectionId: params.data.endConnectionId,
        userIdModifiedBy: this.userDetail.uid,
        dateLastModified: new Date(),
        isDeleted: 0,
        originalValue: params.oldValue
      }
    });
  }

  /**
   * Records changes made to cells in the material grade grid
   * Creates an edit record with the new value and audit information
   * @param params Grid edit event parameters containing old and new values
   */
  onMaterialGradeCellValueChanged(params: any) {
    this.addOrUpdateEdit({
      type: 'materialGrade',
      data: {
        materialGrade: params.newValue,
        materialGradeId: params.data.materialGradeId,
        userIdModifiedBy: this.userDetail.uid,
        dateLastModified: new Date(),
        isDeleted: 0,
        originalValue: params.oldValue
      }
    });
  }

  /**
   * Records changes made to cells in the range grid
   * Creates an edit record with the new value and audit information
   * @param params Grid edit event parameters containing old and new values
   */
  onRangeCellValueChanged(params: any) {
    this.addOrUpdateEdit({
      type: 'range',
      data: {
        rangeName: params.newValue,
        rangeId: params.data.rangeId,
        userIdModifiedBy: this.userDetail.uid,
        dateLastModified: new Date(),
        isDeleted: 0,
        originalValue: params.oldValue
      }
    });
  }

  /**
   * Records changes made to cells in the supplier (organization) grid
   * Creates an edit record with the new value and audit information
   * @param params Grid edit event parameters containing old and new values
   */
  onSupplierCellValueChanged(params: any) {
    this.addOrUpdateEdit({
      type: 'supplier', // Replacing organization with supplier
      data: {
        organizationName: params.newValue,
        organizationId: params.data.organizationId,
        userIdModifiedBy: this.userDetail.uid,
        dateLastModified: new Date(),
        isDeleted: 0,
        originalValue: params.oldValue
      }
    });
  }

  /**
   * Records changes made to cells in the connection type grid
   * Creates an edit record with the new value and audit information
   * @param params Grid edit event parameters containing old and new values
   */
  onConnectionTypeCellValueChanged(params: any) {
    this.addOrUpdateEdit({
      type: 'connectionType',
      data: {
        name: params.newValue,
        id: params.data.id,
        userIdModifiedBy: this.userDetail.uid,
        dateLastModified: new Date(),
        isDeleted: 0,
        originalValue: params.oldValue
      }
    });
  }

  /**
   * Records changes made to cells in the assembly type grid
   * Creates an edit record with the new value and audit information
   * @param params Grid edit event parameters containing old and new values
   */
  onManufacturerCellValueChanged(params: any) {
    this.addOrUpdateEdit({
      type: 'manufacturerType',
      data: {
        organizationName: params.newValue,
        organizationId: params.data.organizationId,
        userIdModifiedBy: this.userDetail.uid,
        dateLastModified: new Date(),
        isDeleted: 0,
        originalValue: params.oldValue,
        functionId: 2 // Assuming manufacturer type has a functionId of 2
      }
    });
  }

  /**
   * Records changes made to cells in the assembly type grid
   * Creates an edit record with the new value and audit information
   * @param params Grid edit event parameters containing old and new values
   */
  onAssemblyTypeCellValueChanged(params: any) {
    this.addOrUpdateEdit({
      type: 'assemblyType',
      data: {
        assemblyTypeName: params.newValue,
        assemblyTypeId: params.data.assemblyTypeId,
        userIdModifiedBy: this.userDetail.uid,
        dateLastModified: new Date(),
        isDeleted: 0,
        originalValue: params.oldValue
      }
    });
  }

  /**
   * Records changes made to cells in the RBW grid
   * Creates an edit record with the new value and audit information
   * @param params Grid edit event parameters containing old and new values
   */
  onRbwCellValueChanged(params: any) {
    this.addOrUpdateEdit({
      type: 'rbw',
      data: {
        value: params.newValue,
        id: params.data.id,
        userIdModifiedBy: this.userDetail.uid,
        dateLastModified: new Date(),
        isDeleted: 0,
        originalValue: params.oldValue
      }
    });
  }

  /**
   * Save all pending edits
   * Groups edits by type and ID to ensure only the latest edit for each item is saved
   * Refreshes all data after successful save
   */
  onSave() {
    // Group edits by type and ID to ensure we have the latest edit for each item
    const latestEdits = this.editedRows.reduce((acc, edit) => {
      const key = `${edit.type}_${this.getIdForType(edit.type, edit.data)}`;
      acc[key] = edit;
      return acc;
    }, {});
    const updatePromises = Object.values(latestEdits).map((edit: any) => {
      const { originalValue, ...data } = edit.data;
      switch (edit.type) {
        case 'componentType':
          const componentType = new ComponentTypeModel();
          Object.assign(componentType, data);
          return this.inventoryService.updateComponentType(componentType).toPromise();

        case 'connectionConfig':
          const connectionConfig = new ConnectionConfigModel();
          Object.assign(connectionConfig, data);
          connectionConfig.connectionConfigType = 'std';
          return this.inventoryService.updateConnectionConfig(connectionConfig).toPromise();

        case 'endConnection':
          const endConnection = new EndConnectionsModel();
          Object.assign(endConnection, data);
          return this.inventoryService.updateEndConnection(endConnection).toPromise();

        case 'materialGrade':
          const materialGrade = new MaterialGradeModel();
          Object.assign(materialGrade, data);
          return this.inventoryService.updateMaterialGrade(materialGrade).toPromise();

        case 'range':
          const range = new RangeModel();
          Object.assign(range, data);
          return this.inventoryService.updateRange(range).toPromise();

        case 'supplier': // Replacing organization with supplier
          const organization = new OrganizationModel();
          Object.assign(organization, data);
          return this.inventoryService.updateOrganization(organization).toPromise();

        case 'connectionType':
          const connectionType = new ConnectionTypeModel();
          Object.assign(connectionType, data);
          return this.connectionTypeService.updateConnectionType(connectionType).toPromise();

        case 'manufacturerType':
          const manufacturerType = new OrganizationModel();
          Object.assign(manufacturerType, data);
          return this.manufacturerService.updateManufacturerType(manufacturerType).toPromise();

        case 'assemblyType':
          const assemblyType = new AssemblyTypeModel();
          Object.assign(assemblyType, data);
          return this.assemblyTypeService.updateAssemblyType(assemblyType).toPromise();

        case 'rbw':
          const rbw = new RbwModel();
          Object.assign(rbw, data);
          return this.rbwService.updateRbw(rbw).toPromise();
      }
    });

    Promise.all(updatePromises)
      .then(() => {
        // Refresh all data after successful save
        this.getComponentType();
        this.getConnectionConfig();
        this.getEndConnections();
        this.getMaterialGrade();
        this.getRange();
        this.getSupplier();
        this.getManufacturerType();
        this.getConnectionType();
        this.getAssemblyType();
        this.getRbw();

        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'All changes saved successfully' });
        this.editedRows = [];
      })
      .catch(error => {
        console.error('Error saving changes:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error saving changes' });

      });
  }

  /**
   * Opens the delete confirmation dialog for the selected row.
   * Sets the `deleteItemDataName` to display the name of the item being deleted in the dialog.
   * Sets the `deleteItemData` and `deleteItemType` to track the selected row and its type.
   * @param rowData The data of the selected row.
   * @param type The type of the selected item (e.g., 'componentType', 'connectionConfig').
   */
  deleteAssemblyDialog(rowData: any, type: string) {
    const tableType = this.getDeletedItemsTypes(type);
    this.deleteItemDataName = rowData.map(element => element[tableType]).join(', ');
    this.deleteItemData = rowData;
    this.deleteItemType = type;
    this.displayDeleteComponentDialog = true;
  }

  /**
 * Confirms the deletion of the selected item.
 * Calls the appropriate delete API based on the `deleteItemType`.
 * Updates the `isDeleted` flag for the selected item and refreshes the corresponding data.
 * Displays success or error messages based on the API response.
 */
  deleteConfirm() {
    if (!this.deleteItemData || !this.deleteItemType) {
      return;
    }

    let dataTypeID: string = this.getDeletedItemsTypes(this.deleteItemType, "value");

    // Special handling for manufacturerType
    // if (this.deleteItemType === 'manufacturerType') {
    //   // deleteItemData is an array of selected rows
    //   const deleteObservables = this.deleteItemData.map(item =>
    //     this.manufacturerService.deleteManufacturerType(item[dataTypeID]).toPromise()
    //   );
    //   Promise.all(deleteObservables)
    //     .then(() => {
    //       this.getManufacturerType();
    //       this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Item deleted successfully' });
    //     })
    //     .catch(error => {
    //       console.error('Error deleting item:', error);
    //       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error deleting item' });
    //     })
    //     .finally(() => {
    //       this.displayDeleteComponentDialog = false;
    //       this.deleteItemData = null;
    //       this.deleteItemType = '';
    //     });
    //   return;
    // }

    // Default: use listEditorService for other types
    let deletePromise: Promise<any> = this.listEditorService.deleteMultipleListEditorItems(this.deleteItemType, this.deleteItemData.map(ele => ele[dataTypeID])).toPromise();
    if (deletePromise) {
      deletePromise
        .then(() => {
          // Refresh the data
          switch (this.deleteItemType) {
            case 'componentType':
              this.getComponentType();
              break;
            case 'connectionConfig':
              this.getConnectionConfig();
              break;
            case 'endConnection':
              this.getEndConnections();
              break;
            case 'materialGrade':
              this.getMaterialGrade();
              break;
            case 'range':
              this.getRange();
              break;
            case 'supplier': // Replacing organization with supplier
              this.getSupplier();
              break;
            case 'manufacturerType': // Replacing organization with manufacturerType
              this.getManufacturerType();
              break;
            case 'connectionType':
              this.getConnectionType();
              break;
            case 'assemblyType':
              this.getAssemblyType();
              break;
            case 'rbw':
              this.getRbw();
              break;
          }

          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Item deleted successfully' });
        })
        .catch(error => {
          console.error('Error deleting item:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error deleting item' });
        })
        .finally(() => {
          this.displayDeleteComponentDialog = false;
          this.deleteItemData = null;
          this.deleteItemType = '';
        });
    }
  }

  // Assigning the ag-Grid API to the corresponding entry in tableDeletingData based on gridType
  getMethodName(grid: any, gridType: string) {
    this.tableDeletingData.forEach(element => {
      if (element.type === gridType) {
        element.gridApi = grid;
      }
    })
  }
  // Retrieves the selected rows from the specified grid and initiates the delete confirmation dialogs
  sendSelectedRows(gridType: string) {
    const nameIndex = this.tableDeletingData.findIndex(element => element.type === gridType)
    const selectedRows = this.tableDeletingData[nameIndex]?.gridApi.getSelectedRows();
    this.deleteAssemblyDialog(selectedRows, gridType);
  }

  /**
 * Returns the corresponding field name (ID or name) for a given data type.
 * 
 * @param dataType - The type of data to evaluate (e.g., 'componentType', 'connectionConfig', etc.)
 * @param returnType - Optional parameter indicating the kind of field to return:
 *                     'value' returns the ID field, otherwise returns the name field.
 * @returns A string representing the appropriate field name based on the input parameters.
 */

  getDeletedItemsTypes(dataType: string, returnType?: string): string {
    let dataTypeID = '';
    switch (dataType) {
      case 'componentType':
        dataTypeID = returnType === "value" ? "componentTypeId" : "componentTypeName";
        break;
      case 'connectionConfig':
        dataTypeID = returnType === "value" ? "connectionConfigId" : "connectionConfigName";
        break;
      case 'endConnection':
        dataTypeID = returnType === "value" ? "endConnectionId" : "endConnectionName";
        break;
      case 'materialGrade':
        dataTypeID = returnType === "value" ? "materialGradeId" : "materialGrade";
        break;
      case 'range':
        dataTypeID = returnType === "value" ? "rangeId" : "rangeName";
        break;
      case 'supplier': // Replacing organization with supplier
      dataTypeID = returnType === "value" ? "organizationId" : "organizationName";  
        break;
      case 'manufacturerType':
        dataTypeID = returnType === "value" ? "organizationId" : "organizationName";
        break;
      case 'connectionType':
        dataTypeID = returnType === "value" ? "id" : "name";
        break;
      case 'assemblyType':
        dataTypeID = returnType === "value" ? "assemblyTypeId" : "assemblyTypeName";
        break;
      case 'rbw':
        dataTypeID = returnType === "value" ? "id" : "value";
        break;
    }
    return dataTypeID;
  }
}
