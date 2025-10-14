import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  ViewChild
} from '@angular/core';


import { InventoryService } from '../../../services/inventory.service';
import { MdlDataService } from '../../../services/mdl-data.service';
import { masterdatalibraryModel } from '../../../common/model/masterdatalibraryModel';
import { AuthService } from '../../../services/auth.service';
import { defaultRowNumber, paginationRowDD } from '../../../common/constant';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, RowSelectionOptions } from 'ag-grid-community';
import { GridApi, RowNode } from 'ag-grid-community';
import { ValueFormatterParams } from 'ag-grid-community';
import { Inject } from '@angular/core';
import { SchematicAssembly } from '../../../common/model/schematic-assembly';
import { PaginatedDataModel } from '../../../common/model/PaginatedDataModel';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';


@Component({
  selector: 'mdlSelectDialog',
  standalone:true,
  imports:[...PRIME_IMPORTS
    ],
  templateUrl: './mdlSelectDialog.component.html',
  styleUrl: './mdlSelectDialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})

export class MdlSelectDialogComponent implements OnInit {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  //Input and Outps for the dialog 
  filteredMaterials: Array<masterdatalibraryModel> = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() addSelected = new EventEmitter<any>();
  @Input() assemblyData: any;
  searchComponents: string = '';
  private gridApi!: GridApi;
  globalFilter: string = '';
  rows: number = defaultRowNumber;
  rowHeight: number = 30;
  public rowSelection: RowSelectionOptions | "single" | "multiple" = {
    mode: "multiRow",
    checkboxes: true,
    headerCheckbox: true,
    enableClickSelection: false,
  };
  sortField: string;
  sortOrder: number = 1;
  totalPages: number = 0;
  currentPage: number = 1; // Current active page
  pages: number[] = []; // Array to hold the page numbers
  loading: boolean = false;
  totalrecords: number;
  userDetail: any;
  // Use selectedRowData if you want to pre-fill the dialog
  selectedRowData: any;
  mdlRecords: Array<masterdatalibraryModel> = [];
  visible: boolean = true;
  selectedCvxCrwIds: [] = [];
  rowOffset: number = 1;
  fetchNextRows: number = 10;
  totalRecords: number = 0;
  first: any;
  sortBy: string = 'auditId';
  quickFilterText: string = '';
  isAddRecordDisabled: boolean = true;
  pageNumber: number = 0;
  pageSize: number = 500;
  //Define  Columns for the Master Data Library Grid

  mdlColumnDefs = [
    { headerName: 'Component Type', field: 'componentTypeName', sortable: true, filter: true, minWidth:160 },
    { headerName: 'Group', field: 'groupName', sortable: true, filter: true, minWidth: 220 },
    { headerName: 'Project Tag', field: 'projectTags', sortable: true, filter: true, minWidth: 180 },
    { headerName: 'Threaded Connection?', field: 'isThreadedConnection', sortable: true, filter: true, minWidth: 210 },
    { headerName: 'Contains Elastomer Elements?', field: 'isContainsElastomerElements', sortable: true, filter: true, minWidth: 240 },
    { headerName: 'Description', field: 'materialDescription', sortable: true, filter: true, minWidth: 360 },
    { headerName: 'Supplier', field: 'organizationName', sortable: true, filter: true },
    { headerName: 'Manufacturer', field: 'manufacturerDetails', sortable: true, filter: true, minWidth: 200 },
    { headerName: 'Trade Name', field: 'tradeName', sortable: true, filter: true, minWidth: 140 },
    {
      headerName: 'MM# / MMR#',
      field: 'materialNumber',
      sortable: true,
      filter: true, minWidth: 160
      //cellRenderer: (params) => {
      //  const element = document.createElement('a');
      //  element.innerText = params.value;
      //  element.style.color = '#007bff';
      //  element.style.textDecoration = 'underline';
      //  element.style.cursor = 'pointer';
      //  element.style.fontWeight = 'bold';
      //  element.style.transition = 'color 0.2s ease';
      //  return element;
      //}
    },
    { headerName: 'Supplier Part #', field: 'supplierPartNumber', sortable: true, filter: true, minWidth: 160 },
    // { headerName: 'Supplier', field: 'organizationName', sortable: true, filter: true },
    { headerName: 'Legacy Ref #', field: 'legacyRefNumber', sortable: true, filter: true, minWidth: 140 },
    {
      headerName: 'Nominal/Max OD (IN)',
      field: 'nominalOD1',
      sortable: true,
      filter: true, minWidth: 190,
      valueGetter: (params: any) => `${params.data.nominalOd1 || ''} ${params.data.nominalOd2 ? 'x ' + params.data.nominalOd2 : ''} ${params.data.nominalOd3 ? 'x ' + params.data.nominalOd3 : ''}`
    },
    // {
    //   headerName: 'MM# / MMR#',
    //   field: 'materialNumber',
    //   sortable: true,
    //   filter: true, minWidth: 160
    //   //cellRenderer: (params) => {
    //   //  const element = document.createElement('a');
    //   //  element.innerText = params.value;
    //   //  element.style.color = '#007bff';
    //   //  element.style.textDecoration = 'underline';
    //   //  element.style.cursor = 'pointer';
    //   //  element.style.fontWeight = 'bold';
    //   //  element.style.transition = 'color 0.2s ease';
    //   //  return element;
    //   //}
    // },
    
    
   
    {
      headerName: 'Actual OD (IN)',
      field: 'actualOD1',
      sortable: true,
      filter: true, minWidth: 150,
      valueGetter: (params: any) => `${params.data.actualOd1 || ''} ${params.data.actualOd2 ? 'x ' + params.data.actualOd2 : ''} ${params.data.actualOd3 ? 'x ' + params.data.actualOd3 : ''}`
    },
    {
      headerName: 'Actual ID (IN)',
      field: 'actualID1',
      sortable: true,
      filter: true, minWidth: 150,
      valueGetter: (params: any) => `${params.data.actualId1 || ''} ${params.data.actualId2 ? 'x ' + params.data.actualId2 : ''} ${params.data.actualId3 ? 'x ' + params.data.actualId3 : ''}`
    },
    { headerName: 'Drift (IN)', field: 'drift', sortable: true, filter: true },
    {
      headerName: 'Weight (LB)',
      field: 'weight1',
      sortable: true,
      filter: true, minWidth: 130,
      valueGetter: (params: any) => `${params.data.weight1 || ''} ${params.data.weight2 ? 'x ' + params.data.weight2 : ''} ${params.data.weight3 ? 'x ' + params.data.weight3 : ''}`
    },
    { headerName: 'Wall Thickness (IN)', field: 'wallThickness', sortable: true, filter: true, minWidth: 170},
    {
      headerName: 'Material Grade',
      field: 'materialGradeID1',
      sortable: true,
      filter: true, minWidth: 150,
      valueGetter: (params: any) => `${params.data.materialGradePrimary || ''} ${params.data.materialGradeSecondary ? 'x ' + params.data.materialGradeSecondary : ''} ${params.data.materialGradeTertiary ? 'x ' + params.data.materialGradeTertiary : ''}`
    },
    { headerName: 'Range', field: 'rangeName', sortable: true, filter: true, minWidth: 100 },
    { headerName: 'Min Yield Strength (PSI)', field: 'yeildStrength', sortable: true, filter: true, minWidth: 180 },
    { headerName: 'Burst Pressure (PSI)', field: 'burstPressure', sortable: true, filter: true, minWidth: 180 },
    { headerName: 'Collapse Pressure (PSI)', field: 'collapsePressure', sortable: true, filter: true, minWidth: 200 },
    { headerName: 'Max Pressure Rating (PSI)', field: 'maxPressureRating', sortable: true, filter: true, minWidth: 220 },
    { headerName: 'Differential Pressure Rating (PSI)', field: 'diffPressureRating', sortable: true, filter: true, minWidth: 270 },
    { headerName: 'Max Temperature Rating (F)', field: 'maxTempRating', sortable: true, filter: true, minWidth: 230 },
    { headerName: 'Quality Plan Designation', field: 'qualityPlanDesignation', sortable: true, filter: true, minWidth: 210 },
    { headerName: 'Connection Configuration', field: 'connectionConfigName', sortable: true, filter: true, minWidth: 220 },
    { headerName: 'Top Connection', field: 'topConnection', sortable: true, filter: true, minWidth: 160 },
    { headerName: 'Middle Connection', field: 'middleConnection', sortable: true, filter: true, minWidth: 170 },
    { headerName: 'Bottom Connection', field: 'bottomConnection', sortable: true, filter: true, minWidth: 180 },

    { headerName: 'Connection Burst Pressure (PSI)', field: 'connectionBurstPressure', sortable: true, filter: true, minWidth: 250 },

    { headerName: 'Connection Collapse Pressure (PSI)', field: 'connectionCollapsePressure', sortable: true, filter: true, minWidth: 250 },
    { headerName: 'Connection Yield Strength (PSI)', field: 'connectionYeildStrength', sortable: true, filter: true, minWidth: 250 },
    { headerName: 'Makeup-Loss (IN)', field: 'makeupLoss', sortable: true, filter: true, minWidth: 180 },
    { headerName: 'Min Temperature Rating (F) - Elastomers', field: 'elastomersMinTempRating', sortable: true, filter: true, minWidth: 310 },
    { headerName: 'Max Temperature Rating (F) - Elastomers', field: 'elastomersMaxTempRating', sortable: true, filter: true, minWidth: 310 },
    { headerName: 'Elastomer Type', field: 'elastomerTypeID', sortable: true, filter: true, minWidth: 180 }, 
    { headerName: 'Elastomer Notes', field: 'elastomerNotes', sortable: true, filter: true, minWidth: 160 },
    { headerName: 'Standard Notes (Specs, Ratings, Configurations, Design Elements)', field: 'standardNotes', sortable: true, filter: true, minWidth: 350 },
    { headerName: 'Administrative Notes', field: 'administrativeNotes', sortable: true, filter: true, minWidth: 200 },
  

    // { headerName: 'Section', field: 'sectionName', sortable: true, filter: true, minWidth: 150 },
  ];
  // mdlColumnDefs = [
  //   { headerName: 'Component Type', field: 'componentTypeName',filter: true ,minWidth:180,maxWidth:220},
  //   { headerName: 'Description', field: 'materialDescription',filter: true,minWidth:180,maxWidth:250},
  //   { headerName: 'Supplier', field: 'organizationName',filter: true},
  //   { headerName: 'Trade Name', field: 'tradeName',filter: true},
  //   { headerName: 'MM# / MMR#', field: 'materialNumber' ,filter: true},
  //   { headerName: 'Supplier Part #', field: 'supplierPartNumber',filter: true},
  //   { headerName: 'Legacy Ref #', field: 'legacyRefNumber',filter: true},
  //   { headerName: 'Nominal/Max OD (IN)', field: 'nominalOD1',filter: true,
  //     valueGetter: (params: any) => `${params.data.nominalOd1 || ''} ${params.data.nominalOd2 ? 'x ' + params.data.nominalOd2 : ''} ${params.data.nominalOd3 ? 'x ' + params.data.nominalOd3 : ''}`
  //   },
  //   { headerName: 'Actual OD (IN)',  field: 'actualOD1',filter: true,
  //     valueGetter: (params: any) => `${params.data.actualOd1 || ''} ${params.data.actualOd2 ? 'x ' + params.data.actualOd2 : ''} ${params.data.actualOd3 ? 'x ' + params.data.actualOd3 : ''}`
  //   },
  //   { headerName: 'Actual ID (IN)', field: 'actualID1',filter: true, 
  //     valueGetter: (params: any) => `${params.data.actualId1 || ''} ${params.data.actualId2 ? 'x ' + params.data.actualId2 : ''} ${params.data.actualId3 ? 'x ' + params.data.actualId3 : ''}`
  //   },
  //   { headerName: 'Drift (IN)', field: 'drift',filter: true},
  //   { headerName: 'Weight (LB)', field: 'weight1',filter: true, 
  //     valueGetter: (params: any) => `${params.data.weight1 || ''} ${params.data.weight2 ? 'x ' + params.data.weight2 : ''} ${params.data.weight3 ? 'x ' + params.data.weight3 : ''}`
  //   },
  //   { headerName: 'Wall Thickness (IN)', field: 'wallThickness',filter: true},
  //   { headerName: 'Material Grade',      field: 'materialGradeID1',filter: true,
  //      valueGetter: (params: any) => `${params.data.materialGradePrimary || ''} ${params.data.materialGradeSecondary ? 'x ' + params.data.materialGradeSecondary : ''} ${params.data.materialGradeTertiary ? 'x ' + params.data.materialGradeTertiary : ''}`
  //   },
  //   { headerName: 'Range', field: 'rangeName',filter: true},
  //   { headerName: 'Yield Strength (PSI)', field: 'yeildStrength',filter: true},
  //   { headerName: 'Max Pressure Rating (PSI)', field: 'maxPressureRating',filter: true},
  //   { headerName: 'Differential Pressure Rating (PSI)', field: 'diffPressureRating',filter: true},
  //   { headerName: 'Burst Pressure (PSI)', field: 'burstPressure',filter: true},
  //   { headerName: 'Collapse Pressure (PSI)', field: 'collapsePressure',filter: true},
  //   { headerName: 'Max Temperature Rating (F)', field: 'maxTempRating',filter: true},
  //   { headerName: 'Top Connection', field: 'topConnection',filter: true},
  //   { headerName: 'Middle Connection', field: 'middleConnection',filter: true},
  //   { headerName: 'Bottom Connection', field: 'bottomConnection',filter: true},
  //   { headerName: 'Connection Configuration', field: 'connectionConfigName',filter: true},
  //   { headerName: 'Min Temperature Rating (F) - Elastomers', field: 'elastomersMinTempRating',filter: true},
  //   { headerName: 'Max Temperature Rating (F) - Elastomers', field: 'elastomersMaxTempRating',filter: true},
  //   { headerName: 'Quality Plan Designation', field: 'qualityPlanDesignation',filter: true},
  //   { headerName: 'Elastomer Notes', field: 'elastomerNotes',filter: true},
  //   { headerName: 'Standard Notes', field: 'standardNotes',filter: true},
  //   { headerName: 'Is Threaded Connection', field: 'isThreadedConnection',filter: true},
  //   { headerName: 'Contains Elastomer Elements', field: 'isContainsElastomerElements',filter: true},
  //   { headerName: 'Connection Burst Pressure (PSI)', field: 'connectionBurstPressure',filter: true},
  //   { headerName: 'Connection Collapse Pressure (PSI)', field: 'connectionCollapsePressure',filter: true},
  //   { headerName: 'Connection Yield Strength (PSI)', field: 'connectionYeildStrength',filter: true},
  //   { headerName: 'Makeup Loss (IN)', field: 'makeupLoss',filter: true},
  //   { headerName: 'Elastomer Type ID', field: 'elastomerTypeID',filter: true},
  //   { headerName: 'Manufacturer Details', field: 'manufacturerDetails',filter: true}
  //   ];

  gridOptions = {
    // suppressScrollOnNewData: false,
    // suppressHorizontalScroll: false,  // Enable horizontal scroll
    alwaysShowHorizontalScroll: true, // Always show horizontal scroll
    columnDefs: this.mdlColumnDefs, // Column definitions
    rowData: this.mdlRecords, // Data for the grid
   /* defaultColDef: {
      resizable: true, // Enable resizing
      sortable: true, // Enable sorting
      filter: true, // Enable filtering
      minWidth: 90, // Minimum column width
      // debounceVerticalScrollbar:true
    },*/
    rowSelection: { type: 'multiple' }, // Allow multiple row selection
    overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Loading Data...</span>',
    overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No Rows to Show</span>',

   
  };
  
  addedRecords = [];
  constructor(private inventoryService: InventoryService, private mdlDataService: MdlDataService, private authService: AuthService) {
    this.userDetail = this.authService.getUserDetail();
  }

  ngOnInit() {
    this.loadMasterData();
  }
  // Optional: Example of a number formatter function
  numberFormatter(params) {
    return params.value ? params.value.toFixed(2) : '';
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridApi.autoSizeAllColumns();
   // params.columnApi.autoSizeAllColumns();
  //  const gridContainer = document.querySelector('.ag-body-viewport');
  ///  if (gridContainer) {
    //  gridContainer.scrollLeft = 1;  // Try manually setting a small scroll value to "activate" horizontal scroll
   // }
    
    // Optionally, trigger column size fitting if needed
   // params.api.sizeColumnsToFit();
  // Ensure horizontal scroll appears if necessary
  // const totalWidth = params.columnApi.getAllColumns().reduce((acc, column) => acc + column.getActualWidth(), 0);
  // const gridWidth = params.api.gridOptions.api.getGridSize().width;
 // if (totalWidth > gridWidth) {
  //  params.api.getHorizontalScrollbarVisible();
 // }
  }
 
  loadMasterData() {
      if (this.loading) {
        return; // Prevent duplicate requests
      }
      this.loading = true; // Set loading state
      this.mdlRecords= []; // Clear existing records
    //let supplierIds = this.userDetail["readAccessSuppliers"];
      // Fetch total number of materials first
    this.mdlDataService.getMaterialsTotal().subscribe({
        next: (totalMaterials) => {
          const fetchPage = (pageNumber: number): void => {
            this.mdlDataService.getMaterials(pageNumber, this.pageSize).subscribe({
              next: (data) => {
                if (data.length > 0) {
                
                  this.mdlRecords = [...this.mdlRecords, ...data]; // Append new chunk of data
                  this.filteredMaterials = [...this.mdlRecords]; // Update filtered materials
                  this.totalRecords = this.filteredMaterials.length; // Update total record count
                  // Fetch the next chunk if we haven't fetched all records
                  if (this.totalRecords < totalMaterials) {
                    fetchPage(pageNumber + 1);
                  } 
                }
                this.loading = false;
              },
              error: (err) => {
                console.error('Error fetching materials data', err);
                this.loading = false;
              }
            });
          };
          // Start fetching from the first page
          fetchPage(this.pageNumber);
        },
        error: (err) => {
          console.error('Error fetching total materials count', err);
          this.loading = false;
        }
      }); 
  }
  
  addRecord() {
    const selectedRows = this.gridApi.getSelectedRows();
    // this.dataSelected.emit(selectedRows);
    const selectedIds = selectedRows.map(row => ({
      cvxCrwId: row.cvxCrwId,
      materialNumber: row.materialNumber,
      componentTypeName: row.componentTypeName,
      materialDescription: row.materialDescription,
      supplierPartNumber: row.supplierPartNumber,
      legacyRefNumber: row.legacyRefNumber
    }));

    if (selectedIds.length > 0) {
      let assemblyDataArray: SchematicAssembly[] = [];

      const commonProperties = { ...this.assemblyData };

      assemblyDataArray = selectedIds.map(data => {
        const newAssembly = new SchematicAssembly();
        for (const [key, value] of Object.entries(commonProperties)) {
          newAssembly[key] = value;
        }
        newAssembly.cvxCRWID = data.cvxCrwId;
        newAssembly.materialNumber = data.materialNumber;
        newAssembly.materialDescription = data.materialDescription;
        newAssembly.componentTypeName = data.componentTypeName;
        newAssembly.supplierPartNumber = data.supplierPartNumber;
        newAssembly.legacyRefNumber = data.legacyRefNumber;
        return newAssembly;
      });
      //Emit the selected Component
      this.addSelected.emit(assemblyDataArray);
    }
  }
  onSelectionChanged(event: any) {
    const selectedRows = event.api.getSelectedRows();
    this.isAddRecordDisabled = selectedRows.length === 0; // If no rows are selected, disable the button
  }
  //Global Search for  Add Components
  onSearch(event: Event): void {
    const searchedSchematic = (event.target as HTMLInputElement).value.toLowerCase();
    this.quickFilterText = searchedSchematic; // Update the quick filter text
  }

  onEnter() {
    // Call the API and pass the search term
    this.loading = true;
    const orgId = Number(this.userDetail["organizationID"]);
    const supplierIds = this.userDetail["readAccessSuppliers"];
    this.mdlDataService.searchGlobal(this.searchComponents, 0, 500, supplierIds).subscribe(
      //this.mdlDataService.searchByMMR(this.globalFilter, 0, 500, 'undefined', 1).subscribe(
      (response: PaginatedDataModel) => {
        this.mdlRecords = response.data;
        this.totalrecords = response.totalRecords;
        this.totalPages = Math.ceil(this.totalrecords / this.rows);
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.loading = false;
      },
      (error) => {
        this.loading = false;
      }
    );
  }
  //Reset for Filters, Checkbox,Global Search Add Components
  reset(searchComponent: HTMLInputElement) {
    this.loadMasterData();
    this.searchComponents = '';
    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      this.gridApi.onFilterChanged();
      this.gridApi.deselectAll();
    }

    this.quickFilterText = '';
    searchComponent.value = ''; // Clear the input field
  }
//Add Record Button enable/disable
  isAddRecordButtonDisabled(): boolean {
    const selectedRows = this.gridApi.getSelectedRows();
    return selectedRows.length === 0; // Disable if no rows selected
  }
  //close the Add Component Dialog Box
  cancelSchematic() {
    this.visible = false;
  }
}
