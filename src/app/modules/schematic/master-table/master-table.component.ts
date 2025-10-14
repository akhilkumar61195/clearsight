import { Component, effect, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { GridApi, GridOptions, SideBarDef } from 'ag-grid-community';
import { SchematicService } from '../../../services/schematic.service';
import { DepthTable, SchematicMasterTable } from '../../../common/model/schematic-master-table';
import { SchematicSelection } from '../../../common/model/schematic-selection';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { ExcelService } from '../../../services/excel.service';
import * as XLSX from 'xlsx';
import { ExportSchematicMasterTableService } from '../../../services/columnService/exportMasteTableColumn.service';
import { WellFeatures } from '../../../common/model/wellfeatures';
import { SchematicPerforations } from '../../../common/model/schematic-perforations';
import { BatchJobWithLogs } from '../../../common/model/batch-job-with-logs';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';
import { BatchFileUpload } from '../../../common/model/batch-file-upload';
import { AuthService } from '../../../services';
import { BulkuploadService } from '../../../services/bulkupload.service';
import { LocaleTypeEnum, TaskTypes } from '../../../common/enum/common-enum';
import { AgGridStateService } from '../../../services/ag-grid-state.service';
import { CustomerPersonalizationService } from '../../../services/customer-personalization.service';
import { CustomerPersonalization } from '../../../common/model/customer-personalization';
import { AccessControls } from '../../../common/constant';
import { CommonService } from '../../../services/common.service';
import { GridStatePersistenceService } from '../../../common/builder/persistant-builder.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ExportToOdinDialogComponent } from '../export-to-odin-dialog/export-to-odin-dialog.component';
import { ImportDepthTableDialogComponent } from '../import-depth-table-dialog/import-depth-table-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-master-table',
  standalone:true,
  imports:[...PRIME_IMPORTS,
    ExportToOdinDialogComponent,
    ImportDepthTableDialogComponent

  ],
  templateUrl: './master-table.component.html',
  styleUrl: './master-table.component.scss'
})
export class MasterTableComponent implements OnChanges , OnDestroy {

  // Default selected view for resetGridState
  defaultSelectedView: number = -1;
  defaultColumnState: any = null; // Add this property to fix the error

  //Grid Options
  rowHeight: number = 30;
  gridOptions: GridOptions;
  @Input() statusId!: number;
  gridApi!: GridApi;
  // Array of sections to populate the dropdown options
  masterTableFilterData: SchematicMasterTable;
  masterDataColumnDefs = [];
  //required Inputs for the Component
  @Input({ required: true }) schematic: Completionschematicheader;
  @Input() viewData: { sectionID: number, itemNumber: number, zoneID: number };
  schematicId: number;
  // The model for the selected section
  selectedmasterTableView: number = -1;
  masterDataGridData: SchematicMasterTable[];
  filteredMasterDataGridData: SchematicMasterTable[];
  masterDataGridExcelData: SchematicMasterTable[];
  wellFeatures = [];
  schematicPerforations: SchematicPerforations[] = [];
  displayExportToOdinDialog: boolean = false;
  IsApprovedRequest: boolean = false;
  displayImportDepthTableDialog: boolean = false;
  displayControlLineAndClampDialog: boolean = false;
  displayBatchStatusDialog: boolean = false;
  readonly stateKey = 'Schematic-MasterTable';
  // readonly stateKey = enum.SchematicText.SchematicMasterTable; // Use enum for consistency
  isShowDescription: boolean = false; //if app-excel dialog will  use inside the custom dialog in this case it will be false
  @Output() viewChanged = new EventEmitter<any>();
  selectedViewPS: number = 1;
  currentView: number = this.selectedViewPS;
  userDetail: any;
  viewOptions = [{ label: 'Master Table', value: 2 },
  { label: 'Assembly Builder', value: 1 }];
  selectedView: number = -1;
  cachedGridState: any;
  cachedContextData: any;
  hasRestoredPersonalization = false;
  isPublishSchematic: boolean = false;
  isImportDepthTable: boolean = false;
  private schematicSubscription: Subscription = new Subscription();

  viewOptionsButtons = [
    { label: 'All', value: -1 },
    { label: 'Assembly', value: 0 },
    { label: 'Components', value: 1 }
  ];

  // Defines the configuration for ag-Grid's sidebar
  public sideBar: SideBarDef | string | string[] | boolean | null = {
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

  viewOptionsPS = [{ label: 'Primary', value: 1 },
  { label: 'Secondary', value: 2 }];
  depthTableExcelData: DepthTable[];
  includeContingencyOnly: boolean = false;
  showUpload: boolean = true;
  uploadDescription = `
  To add your control line and clamp calculations, either drag your file into the space below or click choose file:
`;

  /**
   * Validates the uploaded Excel data to ensure it meets the required criteria.
   * Performs checks for empty data, missing or invalid fields, duplicate entries,
   * and ensures numeric values for specific columns.
   * Populates the `validationErrors` array with error messages for any validation failures.
   * Displays a combined error message if validation errors are found.
   * 
   * @param data The parsed Excel data to validate.
   * @returns An array of validation error messages.
   */

  customValidate = (data: any[]): string[] => {
    // console.log('Custom validation function called with data:', data);

    const validationErrors: string[] = [];

    if (!data || data.length === 0) {
      validationErrors.push('The uploaded file is empty. Please upload a valid file with data.');
    }

    const manufacturerPartSet = new Set();

    data.forEach((row, rowIndex) => {
      const manufacturerPart = row['manufacturerPart'];
      const minQty = row['primaryDemand'];
      const totalQty = row['totalQty'];

      if (!manufacturerPart || manufacturerPart.toString().trim() === '') {
        validationErrors.push(`Row ${rowIndex + 1}: 'Manufacturer Part #' cannot be empty.`);
      }

      if (manufacturerPart) {
        if (manufacturerPartSet.has(manufacturerPart)) {
          validationErrors.push(`Duplicate Manufacturer Part # found at Row ${rowIndex + 1}: '${manufacturerPart}'.`);
        } else {
          manufacturerPartSet.add(manufacturerPart);
        }
      }

      if (minQty === null || minQty === undefined || minQty === '') {
        validationErrors.push(`Row ${rowIndex + 1}: 'Min Quantity (Primary)' cannot be empty.`);
      }

      if (totalQty === null || totalQty === undefined || totalQty === '') {
        validationErrors.push(`Row ${rowIndex + 1}: 'Total Quantity Provided' cannot be empty.`);
      }

      if (typeof minQty !== 'number' || isNaN(minQty)) {
        validationErrors.push(`Row ${rowIndex + 1}, Column 'Min Quantity (Primary)': Value '${minQty}' is not a valid numeric value.`);
      }

      if (typeof totalQty !== 'number' || isNaN(totalQty)) {
        validationErrors.push(`Row ${rowIndex + 1}, Column 'Total Quantity Provided': Value '${totalQty}' is not a valid numeric value.`);
      }
    });

    if (validationErrors.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Errors',
        detail: validationErrors.join('<br/>'),
        life: 10000,
      });
    }

    return validationErrors;
  };


  //Define Columns for the masterData Grid
  initializeColumnDefs() {
    this.masterDataColumnDefs = [
      { headerName: 'Section', field: 'sectionName', minWidth: 100, filter: true, sortable: true, pinned: true },
      { headerName: 'Design Type', field: 'designType', minWidth: 130, filter: true, sortable: true, pinned: true },
      { headerName: 'String Type', field: 'stringType', minWidth: 130, filter: true, sortable: true, pinned: true }, // added new column stringType //
      { headerName: 'Zone', field: 'zoneID', editable: false, sortable: true, filter: true, pinned: true },
      /*{ headerName: 'Assembly/Component', field: 'type', editable: false, sortable: true, minWidth: 200, filter: true, hide: true},*/
      /*{ headerName: 'Item', field: 'itemNumber', maxWidth: 110, editable: false, sortable: true, minWidth: 100, filter: true, pinned: true },*/
      {
        headerName: 'Item #',
        field: 'itemNumber',
        editable: false,
        sortable: true,
        minWidth: 100,
        filter: true,
        pinned: true,
        valueGetter: (params: any) => {
          const val = parseFloat(params.data.itemNumber);
          if (isNaN(val)) return '';
          return Number.isInteger(val) ? val : `${Math.round((val % 1) * 10)}c`;
        }
      },
      {
        headerName: 'Sub-Item #',
        field: 'subItemNumber',
        editable: false,
        sortable: true,
        minWidth: 120,
        filter: true,
        pinned: true,
        valueGetter: (params: any) => {
          const value = params.data.subItemNumber;
          if (value === '' || value === null || value === undefined) {
            return '';
          }
          return parseFloat(value);
        }
      },
      { headerName: 'Assembly Name', field: 'assemblyName', editable: false, sortable: true, minWidth: 255, filter: true, pinned: true }, // changed to assemblyName //
      { headerName: 'Component Type', field: 'componentTypeName', minWidth: 180, filter: true, sortable: true },
      { headerName: 'Material Description', field: 'materialDescription', minWidth: 540, editable: false, sortable: true, filter: true },
      { headerName: 'Design Notes', field: 'designNotes', minWidth: 160, editable: false, sortable: true, filter: true },
      { headerName: 'Material ID', field: 'materialNumber', editable: false, sortable: true, minWidth: 150, filter: true },
      { headerName: 'Manufacturer SAP #', field: 'vendorSAPNumber', editable: false, sortable: true, minWidth: 250, filter: true },
      { headerName: 'Supplier Part #', field: 'supplierPartNumber', minWidth: 160, editable: false, sortable: true, filter: true },
      { headerName: 'Legacy Reference #', field: 'legacyRefNumber', minWidth: 150, editable: false, sortable: true, filter: true },
      // { headerName: 'Serial', field: 'serial', editable: true, sortable: true },  
      {
        headerName: 'Length', field: 'assemblyLengthinft', minWidth: 120, filter: true,
        valueFormatter: (params) => {
          const value = Number(params.value);
          return isNaN(value)
            ? params.value
            : value.toLocaleString(LocaleTypeEnum.enUS, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
        }
      },
      { headerName: 'Supplier', field: 'supplier', minWidth: 140, editable: false, sortable: true, filter: true },
      {
        headerName: 'Actual O.D.', field: 'actualOD1', editable: false, sortable: true, minWidth: 150, filter: true,
        valueGetter: (params: any) => `${params.data.actualOD1 || ''} ${params.data.actualOD2 ? 'X ' + params.data.actualOD2 : ''} ${params.data.actualOD3 ? 'X ' + params.data.actualOD3 : ''}`
      },
      {
        headerName: 'Actual I.D.', field: 'actualID1', minWidth: 150, editable: false, sortable: true, filter: true,
        valueGetter: (params: any) => `${params.data.actualID1 || ''} ${params.data.actualID2 ? 'X ' + params.data.actualID2 : ''} ${params.data.actualID3 ? 'X ' + params.data.actualID3 : ''}`
      },
      // { headerName: 'Clamp?', field: 'clamp', maxWidth: 100, editable: true, sortable: true }, 
      // { headerName: 'Clamp Type', field: 'clampType', editable: true, sortable: true },  
      // { headerName: 'Clamp Top Depth (MD)',  field: 'clampTypeD', maxWidth: 100, rowDrag: true }, 
      {
        headerName: 'Top Depth (MD) - Inner String', field: 'topDepthInner', minWidth: 270, editable: false, sortable: true, filter: true,
        valueFormatter: (params) => {
          const value = Number(params.value);
          return isNaN(value)
            ? params.value
            : value.toLocaleString(LocaleTypeEnum.enUS, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
        }

      },
      {
        headerName: 'Top Depth (MD) - Outer String', field: 'topDepthOuter', minWidth: 270, editable: false, sortable: true, filter: true,
        valueFormatter: (params) => {
          const value = Number(params.value);
          return isNaN(value)
            ? params.value
            : value.toLocaleString(LocaleTypeEnum.enUS, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
        }
      },
      // { headerName: 'Depth Points of Interest', field: 'depthPointsOfInterest',  minWidth: 220, editable: false, sortable: true },
      // { headerName: 'POI Depth', field: 'poiDepth', maxWidth: 100, editable: true, sortable: true , minWidth: 180,}
      { headerName: 'SectionID', field: 'sectionID', hide: true },
    ];
  }

  constructor(
    private completionSchematicService: CompletionschematicService,
    private api: BulkuploadService,
    private excelService: ExcelService,
    private exportSchematicMasterTableService: ExportSchematicMasterTableService,
    private spinner: NgxSpinnerService,
    private messageService: MessageService,
    private authService: AuthService,
    private stateService: AgGridStateService,
    private gridStateService: GridStatePersistenceService,
    private personalizationService: CustomerPersonalizationService,
    private commonService: CommonService
  ) {
    this.userDetail = this.authService.getUserDetail();
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes.viewData) {
      this.schematicId = this.schematic.schematicsID;
      this.getUserDetails();
      this.getUserDetailsImportDepthTable();
      this.loadWellFeatures();
      this.getmasterDataDetails();
      this.getSchematicPerforations();
      this.getComponentDataDetails();
    }
  }

  ngOnDestroy() {
    this.schematicSubscription.unsubscribe();
  }
  /**
       *  it will get the user details from jwt token
       */
   getUserDetails() {
    let userAccess = this.authService.isAuthorized(AccessControls.PUBLISH_SCHEMATIC);
    this.commonService.setuserAccess(userAccess);
    // Checking the user access for editability
    this.isPublishSchematic = this.authService.isFieldEditable('isPublishSchematic');

  }

   getUserDetailsImportDepthTable() {
    let userAccess = this.authService.isAuthorized(AccessControls.IMPORT_DEPTHTABLE);
    this.commonService.setuserAccess(userAccess);
    this.isImportDepthTable = this.authService.isFieldEditable('isImportDepthTable');
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridStateService.initialize(params.api, this.userDetail.uid);
  }

  // Retrieves the latest personalization for the current user and applies it to the grid

  getPersonalization() {
    const userId = this.userDetail?.uid || 0;
    this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
      next: (res) => {
        const state = res?.result.appState ? JSON.parse(res.result.appState) : null;
        const contextData = res?.result?.contextData;
        const context = typeof contextData === 'string' ? JSON.parse(contextData) : contextData;
        // Restore context filters
        if (context) {
          this.selectedView = context.type ?? this.selectedView;
          this.selectedViewPS = context.demandType ?? this.selectedViewPS;
          this.includeContingencyOnly = context.includeContigency ?? false;
        }

        this.applyFilter(); // apply filter using restored values
        // Restore grid state
        if (state && this.gridApi) {
          if (state.columnState) {
            this.gridApi.applyColumnState({ state: state.columnState, applyOrder: true });
          }
          setTimeout(() => {
            if (state.filterModel) {
              this.gridApi.setFilterModel(state.filterModel);
            }
            if (state.sortModel && (this.gridApi as any).setSortModel) {
              (this.gridApi as any).setSortModel(state.sortModel);
            }
            this.gridApi.refreshHeader();
            this.gridApi.redrawRows();
          }, 50);
        }

        this.hasRestoredPersonalization = true; // ✅ Prevent future re-runs
      },
      error: (err) => {
        console.warn('No personalization found or failed to load.', err);
      },
    });

  }


  

  onSaveState() {
    this.gridStateService.saveStateOnDestroy(this.stateKey);
  }

  // Load well features based on schematic ID
  loadWellFeatures() {
    if (!this.schematicId) return;
    this.schematicSubscription = this.completionSchematicService.getWellFeaturesBySchematicId(this.schematicId).subscribe({
      next: (response) => {
        // Key mapping to human-readable labels
        const keyMapping = {
          rkbtoMsl: 'RKB to MSL',
          waterDepth: 'Water Depth',
          rkbtoMl: 'RKB to ML',
          rkbto1834Hpwh: 'RKB to 18-3/4" HPWH',
          topofTubingHeadSpool: 'Top of Tubing Head Spool',
          tol: 'TOL',
          tiebackGap: 'Tieback Gap',
          cflex: 'C-Flex',
          safetyValveSetDepth: 'Safety Valve Set Depth',
          sumpPackerTop: 'Sump Packer (Top)',
          sumpPackerMuleShoeEoa: 'Sump Packer Mule Shoe (EOA)',
          bridgePlugGatekeeperTop: 'Bridge Plug/Gatekeeper (Top)',
          endofLiner: 'End of Liner',
          ratholeLength: 'Rathole Length',
          ratholeLengthLcinstalled: 'Rathole Length (LC Installed)'
        };

        // Function to transform the keys dynamically and return the desired format
        const transformKeys = (obj: any) => {
          const transformedArr = [];

          Object.keys(obj).forEach(key => {
            // Check if the key exists in keyMapping
            if (keyMapping.hasOwnProperty(key)) {
              const transformedKey = keyMapping[key]; // Get the transformed key from keyMapping
              transformedArr.push({
                Code: transformedKey, // Map the transformed key to 'Code'
                Depth: obj[key] // Map the value to 'Depth'
              });
            }
          });

          return transformedArr;
        };

        // Transform the array to the desired format
        const transformedData = response.map(item => transformKeys(item));
        const flattenedArray = transformedData.flat();
        // Log the transformed data

        this.wellFeatures = flattenedArray;
        // console.log(this.wellFeatures);
        // Restore grid state AFTER data is set and grid has rendered
        // setTimeout(() => {
        //   if (this.gridApi) {
        //     this.stateService.restoreState(this.gridApi, this.stateKey);
        //     console.log('✅ Grid state restored after data load');
        //   }
        // }, 100); // You can increase delay slightly (e.g. 200ms) if needed

      },
      error: (err) => {
        console.error('Error fetching well features', err);
      },
    });
  }

  getSchematicPerforations() {
    this.schematicSubscription = this.completionSchematicService.getSchematicPerforations(this.schematicId, 2).subscribe({
      next: (response: SchematicPerforations[]) => {
        //console.log(response);
        this.schematicPerforations = response;
      },
      error: (err) => { console.log(err) }
    });
  }

  onMasterTableClick(view: number) {
    this.selectedmasterTableView = view;
    this.getmasterDataDetails();
  }

  getmasterDataDetails() {
    const selectedmasterTableView = isNaN(this.selectedmasterTableView) ? -1 : this.selectedmasterTableView;
    this.schematicSubscription = this.completionSchematicService
      .getMasterTableByDesignType(this.schematicId, selectedmasterTableView, this.selectedViewPS)
      .subscribe({
        next: (response) => {
          this.masterDataGridData = response.flat();
          this.applyFilter();
          if (selectedmasterTableView === -1) {
            this.masterDataGridExcelData = response;
          }

          // If personalization is already restored, just update the data — don't reset grid
          if (this.hasRestoredPersonalization) {
            this.gridApi.applyTransaction({ update: this.filteredMasterDataGridData });
            return;
          }
          this.initializeColumnDefs();
          // ✅ Restore personalization after data is applied
          // ✅ Apply personalization only once
          if (!this.hasRestoredPersonalization) {
            setTimeout(() => this.getPersonalization(), 50);
          }
        },
        error: (error) => {
          console.error('Error fetching Master Table Data', error);
        },
      });
  }

  // includes contingency only flag
  applyFilter() {
    if (this.includeContingencyOnly) {
      this.filteredMasterDataGridData = [...this.masterDataGridData]; // Load all data
    } else {
      this.filteredMasterDataGridData = this.masterDataGridData.filter(item =>
        item.designType?.trim().toLowerCase() === 'primary' ||
        item.designType?.trim().toLowerCase() === 'secondary'
      );
    }
    // Set custom context like selectedWellId
    this.gridStateService.setContextData({
      type: this.selectedView,
      includeContigency: this.includeContingencyOnly,
      demandType: this.selectedViewPS
    });
  }

  getComponentDataDetails() {
    const selectedmasterTableView = 1;

    this.schematicSubscription = this.completionSchematicService.getDepthTableView(this.schematicId, selectedmasterTableView).subscribe({
      next: (response) => {

        this.depthTableExcelData = response;
        this.depthTableExcelData.forEach(item => {
          item.subItemNumber = +item.subItemNumber;
        });

      },
      error: (error) => {
        console.error('Error fetching Master Table Data', error);
      }
    });

  }

  hasComponentType(): boolean {
    return this.masterDataGridData?.some(item => item.type === "Component") || false;

  }

  exportMasterTableDataAsExcel() {
    // Create the workbook object
    const wb = {
      Sheets: {},
      SheetNames: []
    };

    // Define header and data styles
    const headerStyle = {
      fill: {
        fgColor: { rgb: 'FFFF00' }  // Yellow background color
      },
      font: {
        bold: true,
        color: { rgb: '000000' }  // Black text color
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      }
    };

    const dataStyle = {
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      }
    };

    // Helper function to create a worksheet with data and style
    const createWorksheet = (sheetName, headers, data, headerStyle, dataStyle, includeTopHeader = true) => {
      const ws = XLSX.utils.aoa_to_sheet([]);

      // Step 1: Add the top-level header (only if required, for "Master Table" sheet)
      if (includeTopHeader) {
        const topLevelHeader = [`Completion Schematic Header Information`];
        XLSX.utils.sheet_add_aoa(ws, [topLevelHeader], { origin: 'A1' });

        // Get column count to merge cells
        const colCount = headers.length;
        ws['!merges'] = [{
          s: { r: 0, c: 0 },
          e: { r: 0, c: colCount - 1 }
        }];

        // Apply the style to the top-level header (centered, bold)
        const topLevelHeaderCell = ws['A1'];
        if (topLevelHeaderCell) {
          topLevelHeaderCell.s = headerStyle;
        }
      }

      // Step 2: Add the header row for the table
      XLSX.utils.sheet_add_aoa(ws, [headers], { origin: `A${includeTopHeader ? 2 : 1}` });

      // Apply header style
      headers.forEach((_, index) => {
        const headerCell = ws[XLSX.utils.encode_cell({ r: includeTopHeader ? 1 : 0, c: index })];
        if (headerCell) {
          headerCell.s = headerStyle; // Apply header style
        }
      });

      // Step 3: Add data rows
      XLSX.utils.sheet_add_json(ws, data, { header: headers, skipHeader: true, origin: `A${includeTopHeader ? 3 : 2}` });

      // Step 4: Apply the data style (center alignment)
      const dataStartRow = includeTopHeader ? 3 : 2;
      const dataEndRow = dataStartRow + data.length - 1;
      const dataEndCol = headers.length - 1;

      for (let r = dataStartRow; r <= dataEndRow; r++) {
        for (let c = 0; c <= dataEndCol; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          const cell = ws[cellAddress];
          if (cell) {
            cell.s = dataStyle;
          }
        }
      }

      // Apply alternating row colors if needed
      this.applyAlternatingRowColors(ws, dataStartRow, data, headers.length);

      return ws;
    };

    // Step 1: Create the "Master Table" sheet with all sections in one (no section headers)
    const masterTableWs = XLSX.utils.aoa_to_sheet([]);

    // Add "Completion Schematic Header Information" as top-level header
    XLSX.utils.sheet_add_aoa(masterTableWs, [["Completion Schematic Header Information", this.schematic.schematicsName]], { origin: 'A1' });

    // Add "Project Data" section
    const projectHeaders = this.exportSchematicMasterTableService.projectColumnDefs
      .filter(col => col.headerName && col.headerName.trim() !== '')
      .map(col => col.headerName);

    const projectData = Array.isArray(this.schematic) ? this.schematic : [this.schematic];
    const filteredProjectData = projectData.map(row => {
      const filteredRow = {};
      this.exportSchematicMasterTableService.projectColumnDefs.forEach(col => {
        if (row[col.field] !== undefined) {
          filteredRow[col.headerName] = row[col.field];
        }
      });
      return filteredRow;
    });

    // Add "Project Data" directly (no section header)
    XLSX.utils.sheet_add_aoa(masterTableWs, [projectHeaders], { origin: 'A2' });
    XLSX.utils.sheet_add_json(masterTableWs, filteredProjectData, { header: projectHeaders, skipHeader: true, origin: 'A3' });

    // Add "Well Features" section
    const wellFeatureHeaders = this.exportSchematicMasterTableService.wellFeatureColumnDefs
      .map(col => col.headerName);

    const wellFeatureData = this.wellFeatures.map(row => {
      const filteredRow = {};
      this.exportSchematicMasterTableService.wellFeatureColumnDefs.forEach(col => {
        if (row[col.field] !== undefined) {
          filteredRow[col.headerName] = row[col.field];
        }
      });
      return filteredRow;
    });

    // Add "Well Features" directly (no section header)
    const wellFeatureStartRow = filteredProjectData.length + 4;
    XLSX.utils.sheet_add_aoa(masterTableWs, [wellFeatureHeaders], { origin: `A${wellFeatureStartRow}` });
    XLSX.utils.sheet_add_json(masterTableWs, wellFeatureData, { header: wellFeatureHeaders, skipHeader: true, origin: `A${wellFeatureStartRow + 1}` });

    // Add "Master Data" section
    const masterHeaders = this.exportSchematicMasterTableService.masterDataExportColumnDefs
      .map(col => col.headerName);

    const masterData = this.masterDataGridData.map(row => {
      const filteredRow = {};
      this.exportSchematicMasterTableService.masterDataExportColumnDefs.forEach(col => {
        if (row[col.field] !== undefined) {
          filteredRow[col.headerName] = row[col.field];
        }
      });
      return filteredRow;
    });

    // Add "Master Data" directly (no section header)
    const masterTableStartRow = wellFeatureStartRow + wellFeatureData.length + 3;
    XLSX.utils.sheet_add_aoa(masterTableWs, [masterHeaders], { origin: `A${masterTableStartRow}` });
    XLSX.utils.sheet_add_json(masterTableWs, masterData, { header: masterHeaders, skipHeader: true, origin: `A${masterTableStartRow + 1}` });

    wb.Sheets['Master Table'] = masterTableWs;
    wb.SheetNames.push('Master Table');

    // Step 2: Create the "Metrics & Tables" sheet with no top-level header
    const singleTableHeaders = this.exportSchematicMasterTableService.perforationTableColumnDefs
      .map(col => col.headerName);

    const matricsTableData = this.schematicPerforations.map(row => {
      const filteredRow = {};
      this.exportSchematicMasterTableService.perforationTableColumnDefs.forEach(col => {
        if (row[col.field] !== undefined) {
          filteredRow[col.headerName] = row[col.field];
        }
      });
      return filteredRow;
    });

    const singleTableWs = createWorksheet(
      "Metrics & Tables",
      singleTableHeaders,
      matricsTableData,
      headerStyle,
      dataStyle,
      false  // No top-level header in the Metrics & Tables sheet
    );

    wb.Sheets['Metrics & Tables'] = singleTableWs;
    wb.SheetNames.push('Metrics & Tables');

    // Step 4: Create the "Depth Table" sheet with appropriate headers and data
    const depthTableHeaders = this.exportSchematicMasterTableService.depthTableColumnDefs
      .map(col => col.headerName);

    const depthTableData = this.depthTableExcelData.map(row => {
      const filteredRow = {};
      this.exportSchematicMasterTableService.depthTableColumnDefs.forEach(col => {
        if (row[col.field] !== undefined) {
          filteredRow[col.headerName] = row[col.field];
        }
      });
      return filteredRow;
    });

    const depthTableWs = createWorksheet(
      "DepthTable",
      depthTableHeaders,
      depthTableData,
      headerStyle,
      dataStyle,
      false  // No top-level header in the Depth Table sheet
    );

    wb.Sheets['DepthTable'] = depthTableWs;
    wb.SheetNames.push('DepthTable');

    // Step 5: Export the workbook (ONLY ONCE)
    XLSX.writeFile(wb, `${this.schematic.schematicsName}_${new Date().toISOString()}.xlsx`);
  }

  applyAlternatingRowColors(ws, startRow: number, data: any[], headerCount: number) {
    // Apply alternating row colors for each table
    data.forEach((row, rowIndex) => {
      const rowStyle = (rowIndex % 2 === 0) ? { fill: { fgColor: { rgb: 'F2F2F2' } } } : { fill: { fgColor: { rgb: 'FFFFFF' } } };
      Object.keys(row).forEach((key, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: startRow + rowIndex, c: colIndex });
        const cell = ws[cellAddress];
        if (cell) {
          cell.s = rowStyle; // Apply alternating row style
        }
      });
    });
  }

  onRowClicked(event: any) {
    const rowData = event.data;
    //console.log('377 Row clicked:', rowData);

    this.viewChanged.emit({
      sectionID: rowData.sectionID,
      itemNumber: rowData.itemNumber,
      zoneID: rowData.zoneID
    });
  }
  //moved this to header so commented for now
  // viewStatus() {
  //   //console.log(this.displayBatchStatusDialog, 'checking');

  //   // this.completionSchematicService.getBatchLogs('schematic').subscribe({
  //   //   next: (res: BatchJobWithLogs[]) => {
  //   //     console.log('Batch logs:', res);
  //   //   },
  //   //   error: (err) => {
  //   //     console.error('Error', err);
  //   //   }
  //   // });
  //   this.displayBatchStatusDialog = true;
  //   //console.log(this.displayBatchStatusDialog, 'checking2');

  // }

  getRowClass(params) {
    //console.log('387',params.data)
    return params.data.rowOrder === 0 ? 'bold-row' : '';
  }

  exportToOdin() {
    this.IsApprovedRequest = false;
    this.displayExportToOdinDialog = true;
  }

  closeExportToOdinDialog() {

    this.displayExportToOdinDialog = false;
  }

  importDepthTableDialog() {
    this.displayImportDepthTableDialog = true;
  }

  closeImportDepthTableDialog() {
    this.displayImportDepthTableDialog = false;
  }

  controlLineClampDialog() {
    this.displayControlLineAndClampDialog = true;
  }
  closeControlClamp() {
    this.displayControlLineAndClampDialog = false;
  }
  // closeBatchStatusDialog() {
  //   this.displayBatchStatusDialog = false;
  // }

  onViewSelectionChange() {
    this.selectedmasterTableView = this.selectedView;
    this.getmasterDataDetails();
    // Cache grid state only after data and personalization is applied
    // Set custom context like selectedWellId
    this.gridStateService.setContextData({
      type: this.selectedView,
      includeContigency: this.includeContingencyOnly,
      demandType: this.selectedViewPS
    });
  }



  refreshTable() {
    this.getmasterDataDetails();
    this.initializeColumnDefs();

  }

  onViewSelectionPSChange(event: any) {
    // Update selected view
    this.selectedViewPS = event.value;
    this.getmasterDataDetails();
    // Set custom context like selectedWellId
    this.gridStateService.setContextData({
      type: this.selectedView,
      includeContigency: this.includeContingencyOnly,
      demandType: this.selectedViewPS
    });
  }

  /**
 * Handles the upload event triggered by the custom Excel upload dialog.
 * Constructs the request payload with the uploaded file, parsed data, and user ID,
 * and sends it to the API for processing.
 * Displays success or error messages based on the API response and refreshes the table.
 * 
 * @param event The event object containing the uploaded file and parsed data.
 */

  handleUpload(event: { file: File, data: any[] }) {
    // Construct the request object with userId, file, and data
    const request: BatchFileUpload = {
      file: event.file, // File from the event
      jsonData: JSON.stringify(event.data), // Convert the parsed Excel data to JSON
      userId: this.userDetail.uid, // Add the userId from the current user details
    };

    // Show the spinner while the API call is in progress
    this.spinner.show();

    // Call the API to upload the clamps file
    this.api.uploadFile(request, TaskTypes.CONTROLLINECLAMPS).subscribe({
      next: (res) => {
        // Hide the spinner and show a success message
        this.spinner.hide();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: res.details });

        // Refresh the table or perform any additional actions
        this.refreshTable();
        this.displayControlLineAndClampDialog = false; // Close the dialog
      },
      error: (error) => {
        // Hide the spinner and show an error message
        this.spinner.hide();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error });
        this.displayControlLineAndClampDialog = false; // Close the dialog
      },
    });
  }
  onResetState() {
    this.gridStateService.resetState();
  }

}
