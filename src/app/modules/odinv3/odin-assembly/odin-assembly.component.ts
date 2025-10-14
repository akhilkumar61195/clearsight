import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ColDef, GridOptions } from 'ag-grid-community';
import { MessageService } from 'primeng/api';
import { Subscription, distinctUntilChanged } from 'rxjs';
import { LocaleTypeEnum, routeLinks } from '../../../common/enum/common-enum';
import { AdvanceFilterModel } from '../../../common/model/AdvanceFilterModel';
import { OdinAssemblyModel } from '../../../common/model/OdinAssemblyModel';
import { IOdinFilterPayloadStore, OdinAdvanceFilterAction, OdinAdvanceFilterActionType, READ_ODIN_ADVANCE_FILTER_ACTION_TYPE } from '../../../common/ngrx-store';
import { OdinV2Service } from '../../../services/odinv2.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { OdinTabComponent } from '../odin-tab/odin-tab.component';
import { OdinCommonService } from '../services/odin-common.service';
@Component({
  selector: 'app-odin-assembly',
  standalone:true,
  imports:[...PRIME_IMPORTS, OdinTabComponent],
  templateUrl: './odin-assembly.component.html',
  styleUrl: './odin-assembly.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class OdinAssembly3Component implements OnDestroy {

  quickFilterText: string = '';
  selectedView: number = 2;
  viewOptionsButtons = [
    { label: 'Drilling', value: 1 },
    { label: 'Completion', value: 2 }
  ];
  searchValue: string = "";
  loading: boolean = false;

  gridOptions: GridOptions = {
    //groupDisplayType: 'groupRows', // Display groups as rows
    groupDefaultExpanded: 1, // Expands all groups by default
  };

  subscription: Subscription;
  gridConfig: any = {};
  assemblyData: Array<OdinAssemblyModel> = [];
  filteredAssemblyData: Array<OdinAssemblyModel> = [];
  assemblies: Array<OdinAssemblyModel> = []; // to hold Assemblies
  totalRecords: number = 0;
  pageNumber: number = 0;
  pageSize: number = 3000;
  gridApi: any;
  gridColumnApi: any;
  autoGroupColumnDef: ColDef = {
    headerName: "Assembly Id",
    field: "assemblyIds",
    minWidth: 160,
    cellRenderer: "agGroupCellRenderer",
    cellStyle: (params) => {
      return params.node?.group ? { 'font-weight': 'bold' } : { 'font-weight': 'normal' };
    }
  };

  isCollapse: boolean = false;

  columnDefs: ColDef[] = [
    { headerName: 'Assembly Id', field: 'assemblyIds', minWidth: 180, cellStyle: { textAlign: 'center' }, rowGroup: true, hide: true },
    {
      headerName: 'Assembly Name', field: 'assemblyNames', minWidth: 200, aggFunc: "first",
      cellStyle: (params) => {
        return params.node?.group ? { textAlign: 'center', 'font-weight': 'bold' } : { textAlign: 'center', 'font-weight': 'normal' };
      }
    },
    {
      headerName: 'Location', field: 'location', minWidth: 180, cellStyle: (params) => {
        return params.node?.group ? { textAlign: 'center', 'font-weight': 'bold' } : { textAlign: 'center', 'font-weight': 'normal' };
      }, aggFunc: "first"
    },
    { headerName: 'Component Name', field: 'name', minWidth: 190, cellStyle: { textAlign: 'center' } },
    { headerName: 'MM# / MMR#', field: 'chevronMmr', minWidth: 150, cellStyle: { textAlign: 'center' } },
    { headerName: 'Supplier Part Number', field: 'supplierPartNumber', minWidth: 150, cellStyle: { textAlign: 'center' } },
    { headerName: 'Serial Number', field: 'supplierSerialNumber', minWidth: 150, cellStyle: { textAlign: 'center' } },
    { headerName: 'Item short Description', field: 'description', minWidth: 180, cellStyle: { textAlign: 'left' } },
    { headerName: 'Tag Id', field: 'tagIdentification', minWidth: 140, cellStyle: { textAlign: 'center' } },
    {
      headerName: 'Length', field: 'length', minWidth: 120, cellStyle: (params) => {
        return params.node?.group ? { textAlign: 'center', 'font-weight': 'bold' } : { textAlign: 'center', 'font-weight': 'normal' };
      }, valueFormatter: (params) => {
        const raw = params.value;
        const num = parseFloat(raw);

        if (isNaN(num)) return raw;

        const hasDecimal = raw.toString().includes('.');
            let truncated = num;


        if (hasDecimal) {
          // Truncate to 3 decimal places without rounding
          const parts = raw.toString().split('.');
          const integerPart = parts[0];
          const decimalPart = parts[1].substring(0, 3); // take only up to 3 digits
          truncated = parseFloat(`${integerPart}.${decimalPart}`);

          // return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
        }
// Format to 2 decimal places, USA locale
    return Number(truncated).toLocaleString(LocaleTypeEnum.enUS, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
        // return raw.toString(); // Integer, return as is
      }, aggFunc: "sum"
    },
    {
      headerName: 'Assembly Value', field: '', minWidth: 150, cellStyle: (params) => {
        return params.node?.group ? { textAlign: 'center', 'font-weight': 'bold' } : { textAlign: 'center', 'font-weight': 'normal' };
      }, aggFunc: (params) => this.assemblyValue(params)
    },
    { headerName: 'Next Project (Reserved)', field: 'project', minWidth: 150, cellStyle: { textAlign: 'center' } },
  ];

  // Adding Subscription to unsubscribe when component is destroyed
  private odinAssemblySubscription: Subscription = new Subscription();

  @Input() SelectedFunctionId: number = 2;
  Breakpoints = Breakpoints;
  currentBreakpoint: string = '';
  readonly breakpoint$ = this.breakpointObserver
    .observe([
      Breakpoints.Large,
      Breakpoints.Medium,
      Breakpoints.Small,
      '(min-width: 500px)',
    ])
    .pipe(distinctUntilChanged());

  constructor(private odinV2Service: OdinV2Service,
    private odinStore: Store<{ odinAdvanceFilterData: IOdinFilterPayloadStore }>,
    private router: Router, private messageService: MessageService, private commonService: OdinCommonService,
    private breakpointObserver: BreakpointObserver) {

  }

  ngOnInit() {
    this.commonService.setSelectedFunction(2)
  }

  /**
   * 
   * @returns Returns the grid options for the assembly grid
   */
  bindAssemblyData() {
    if (this.loading) {
      return; // Prevent duplicate requests
    }
    this.loading = true; // Set loading state
    this.assemblyData = []; // Clear existing records
    this.odinAssemblySubscription = this.odinV2Service.getAssembliesTotal().subscribe({
      next: (totalMaterials) => {
        if(totalMaterials.data == 0) {
          this.messageService.add({ severity: 'info', summary: 'No Assemblies Found', detail: 'There are no assemblies available.' });
          this.loading = false;
          return;
        }
        const fetchPage = (pageNumber: number): void => {
          this.odinAssemblySubscription = this.odinV2Service.getAssemblies(pageNumber, this.pageSize).subscribe({
            next: (data) => {
              if (data?.data?.length > 0) {
                this.assemblyData = [...this.assemblyData, ...data.data]; // Append new chunk of data
                this.filteredAssemblyData = [...this.assemblyData]; // Update filtered materials
                this.totalRecords = this.filteredAssemblyData.length; // Update total record count
                // Fetch the next chunk if we haven't fetched all records
                if (this.totalRecords < totalMaterials.data) {
                  fetchPage(pageNumber + 1);
                }
                else {
                  // Filter out components where assemblyIds is not equal to tagIdentification
                  this.filteredAssemblyData = this.filteredAssemblyData.filter(item => item.assemblyIds != item.tagIdentification); // Update filtered materials
                  // Filter out assemblies where assemblyIds is equal to tagIdentification
                  this.assemblies = this.assemblyData.filter(item => item.assemblyIds == item.tagIdentification);
                  this.filteredAssemblyData.forEach((item) => {
                    let val = parseInt(item.containedItemsTotalPrice?.toString());
                    item.containedItemsTotalPrice = isNaN(val) ? 0 : val;
                  });
                  this.loading = false;
                }
              }
            },
            error: (err) => {
              console.error('Error fetching assemblies data', err);
              this.loading = false;
            }
          });
        };
        // Start fetching from the first page
        fetchPage(this.pageNumber);
      },
      error: (err) => {
        console.error('Error fetching total assemblies count', err);
        this.loading = false;
      }
    });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.bindAssemblyData();
  }

  /**
   * Get the assembly value for a aggregated row
   * @param params - The row parameters
   * @returns The assembly value in US locale with 2 decimal places
   */
  assemblyValue(params) {
    const value = this.assemblies.find(assembly => assembly.tagIdentification == params.rowNode.key)?.containedItemsTotalPrice || 0;
    return Number(value).toLocaleString(LocaleTypeEnum.enUS, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  onSearchChange(): void {

    const searchValue = this.searchValue.toUpperCase();

    const matchedAssemblyIds = new Set<string>();
    const nullAssemblyIdData = new Set<OdinAssemblyModel>();

    this.assemblyData.forEach((row) => {
      const matches =
        row.assemblyIds?.toUpperCase().includes(searchValue) ||
        row.assemblyNames?.toUpperCase().includes(searchValue) ||
        row.name?.toUpperCase().includes(searchValue) ||
        row.chevronMmr?.toUpperCase().includes(searchValue) ||
        row.supplierPartNumber?.toUpperCase().includes(searchValue) ||
        row.supplierSerialNumber?.toUpperCase().includes(searchValue) ||
        row.description?.toUpperCase().includes(searchValue) ||
        row.tagIdentification?.toUpperCase().includes(searchValue) ||
        row.length?.toString().includes(this.searchValue) ||
        row.project?.toUpperCase().includes(searchValue) ||
        row.containedItemsTotalPrice?.toString().includes(this.searchValue) ||
        row.location?.toUpperCase().includes(searchValue);

      if (matches) {
        if (row.assemblyIds === '') {
          nullAssemblyIdData.add(row); // Returning rowData where assemblyIds is null or empty
        } else {
          matchedAssemblyIds.add(row.assemblyIds); // Returning unique assemblyIds
        }
      }
    });

    // Apply filter to show only matching assemblies and their components
    this.filteredAssemblyData = this.assemblyData.filter((assembly) =>
      Array.from(matchedAssemblyIds).includes(assembly.assemblyIds)
    );
    this.filteredAssemblyData = [...this.filteredAssemblyData, ...Array.from(nullAssemblyIdData)];
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.odinAssemblySubscription?.unsubscribe();
  }

  onViewSelectionChange() {
    const advanceFilter = new AdvanceFilterModel();
    advanceFilter.projects = [];
    advanceFilter.functions = this.selectedView;
    advanceFilter.timeline = "";
    advanceFilter.wells = [];
    let reducerObject: any;
    reducerObject = new OdinAdvanceFilterAction(null);
    reducerObject.payload = JSON.parse(JSON.stringify(advanceFilter));
    reducerObject.type = READ_ODIN_ADVANCE_FILTER_ACTION_TYPE as OdinAdvanceFilterActionType;
    reducerObject.payload['reset'] = true
    this.odinStore.dispatch(reducerObject);
    if (this.selectedView == 1) {
      this.router.navigate([routeLinks.odinDashboard3]);
    }
    if (this.selectedView == 2) {
      this.router.navigate([routeLinks.odinCompletionDashboard3]);
    }
  }

  expandOrCollapseGrid() {
    this.isCollapse = !this.isCollapse;
    this.isCollapse ? this.gridApi.collapseAll() : this.gridApi.expandAll();
  }
}
