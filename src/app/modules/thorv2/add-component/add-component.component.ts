import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { masterdatalibraryModel } from '../../../common/model/masterdatalibraryModel';
import { GridApi, RowNode, RowSelectionOptions } from 'ag-grid-community';
import { AuthService } from '../../../services';
import { MdlDataService } from '../../../services/mdl-data.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-add-component',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './add-component.component.html',
  styleUrl: './add-component.component.scss'
})
export class AddComponentComponent implements OnInit, OnDestroy {
  @Input() showAddComponentDialog: boolean = false; 
  @Output() onClose = new EventEmitter<void>();
  loading: boolean = false;
  private gridApi!: GridApi;
  mdlRecords: Array<masterdatalibraryModel> = [];
  pageSize: number = 500;
  totalrecords: number;
  totalRecords: number = 0;
  pageNumber: number = 0;
  quickFilterText: string = '';
  searchComponents: string = '';
  filteredMaterials: Array<masterdatalibraryModel> = [];
  isAddRecordDisabled: boolean = true;
  private thorSubscription: Subscription = new Subscription();
  public rowSelection: RowSelectionOptions | "single" | "multiple" = {
    mode: "multiRow",
    checkboxes: true,
    headerCheckbox: true,
    enableClickSelection: false,
  };
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
  agGrid: any;

constructor( private mdlDataService: MdlDataService, private authService: AuthService){}

  ngOnInit() {
    this.loadMasterData();
  }

  ngOnDestroy() {
    this.thorSubscription.unsubscribe();
  }
  // Optional: Example of a number formatter function
  numberFormatter(params) {
    return params.value ? params.value.toFixed(2) : '';
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridApi.autoSizeAllColumns();
  }
 
  loadMasterData() {
      if (this.loading) {
        return; 
      }
      this.loading = true; 
      this.mdlRecords= []; 
    this.thorSubscription = this.mdlDataService.getMaterialsTotal().subscribe({
        next: (totalMaterials) => {
          const fetchPage = (pageNumber: number): void => {
            this.thorSubscription = this.mdlDataService.getMaterials(pageNumber, this.pageSize).subscribe({
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
  onSelectionChanged(event: any) {
    const selectedRows = event.api.getSelectedRows();
    this.isAddRecordDisabled = selectedRows.length === 0; // If no rows are selected, disable the button
  }
    //Global Search for  Add Components
    onSearch(event: Event): void {
      const searchedSchematic = (event.target as HTMLInputElement).value.toLowerCase();
      this.quickFilterText = searchedSchematic; 
    }
  cancelAddComponent(){
    this.onClose.emit();
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
    addRecords(){
        // Create an empty row with null values or any default values
    const emptyRow = { componentTypeName: '', groupName: '', projectTags: '', isThreadedConnection: '', isContainsElastomerElements: '', materialDescription: '' , organizationName: '', manufacturerDetails: '', tradeName: '' };

    // Use the AG Grid API to add the row
    if (this.agGrid.api) {
      this.agGrid.api.applyTransaction({ add: [emptyRow] });
    }


    // const selectedRows = this.gridApi.getSelectedRows();
    // // this.dataSelected.emit(selectedRows);
    // const selectedIds = selectedRows.map(row => ({
    //   cvxCrwId: row.cvxCrwId,
    //   materialNumber: row.materialNumber,
    //   componentTypeName: row.componentTypeName,
    //   materialDescription: row.materialDescription,
    //   supplierPartNumber: row.supplierPartNumber,
    //   legacyRefNumber: row.legacyRefNumber
    // }));
  }
    
}



