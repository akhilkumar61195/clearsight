import { formatDate } from '@angular/common';
import { OdinV2Service } from '../../../../services/odinv2.service';
import { AuthService } from '../../../../services';
import { RigMaterialDemands, RigScheduleAnalysis, RigScheduleFooter, RigScheduleFooterRow, RigScheduleMaterial, RigScheduleWell, WellData } from '../../../../common/model/completion-rig-analysis';
import { Component, effect, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ColDef, GridOptions, RowHeightParams } from 'ag-grid-community';
import { MessageService } from 'primeng/api';
import { Observable, Subscription } from 'rxjs';
import { customRigFooter } from '../../odin-custom-headers/custom-rig-footer.component';
import { LocaleTypeEnum, routeLinks } from '../../../../common/enum/common-enum';
import { AccessControls } from '../../../../common/constant';
import { AdvanceFilterModel } from '../../../../common/model/AdvanceFilterModel';
import { MaterialDemandModel } from '../../../../common/model/material-demand-model';
import { IOdinFilterPayloadStore, OdinAdvanceFilterAction, OdinAdvanceFilterActionType, READ_ODIN_ADVANCE_FILTER_ACTION_TYPE } from '../../../../common/ngrx-store';
import { CommonService } from '../../../../services/common.service';
import { ResponsiveService } from '../../../../services/responsive.service';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { CustomRigHeaderGroup } from '../../odin-custom-headers/custom-rig-header.component';
import { RigHeaderLable } from '../../odin-custom-headers/rig-header-lable.component';
import { OdinWhatIfComponent } from '../../odin-what-if/odin-what-if.component';
import { ListEditorBuilderService } from '../../../common/builders/list-editor-builder.service';

@Component({
  selector: 'app-odin-rig-schedule-drilling',
  standalone:true,
  imports:[PRIME_IMPORTS, OdinWhatIfComponent],
  templateUrl: './odin-rig-schedule-drilling.component.html',
  styleUrl: './odin-rig-schedule-drilling.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class OdinRigScheduleDrillingComponent implements OnDestroy {
  components = {
    'customRigFooter': customRigFooter
  };
  showWhatIfDialog: boolean = false;
  selectedRigAnalysisData: any = [];
  isRunAnalysisEnabled: boolean = false;
  isTyping: boolean = false;
  loading: boolean = false;
  columnDefs: ColDef[] = [];
  globalFilter: string = '';
  //typeInterval: any;
  searchSelected: string = "";
  searchValue: string = "";
  rowOffset: number = 1;
  subscription: Subscription;
  runWhatIfURL: boolean = false;
  useP50Date: boolean = false;
  scrollHeight: string = "350px";
  gridConfig: any = {};
  //tableData: any[];
  //vendor: any[] ;
  //wellColumnData: any[];
  wellsData: WellData[] = [];
  rigScheduleFooters: RigScheduleFooter[] = [];
  //materialData: any[];
  //materialCountArray: any[];
  unsavedChanges: boolean = false;
  selectedPType: string = "P10";
  include_contingency_demand: boolean[] = [];
  rigScheduleWells: RigScheduleWell[];
  rigScheduleAnalysis: RigScheduleAnalysis[] = [];
  rigScheduleMaterials: RigScheduleMaterial[];
  rigMaterialDemands: RigMaterialDemands[];
  gridOptions: GridOptions;
  pinnedBottomRowData: RigScheduleFooterRow[] = [];
  odinSelectedFunction: number;
  //footerCols: any[] = [];
  totalRecords: number = 0;
  gridApi: any;
  gridColumnApi: any;
  footerData: RigScheduleFooterRow[] = [];
  selectedView: number = 1;
  isCollapse: boolean = false;
  originalData: RigScheduleAnalysis[] = [];
  editedRows: RigScheduleAnalysis[] = []; // Store edited rows persistently
  userDetail: any;
  height$: Observable<string>;
  appId: number;


  viewOptionsButtons = [
    { label: 'Drilling', value: 1 },
    { label: 'Completion', value: 2 }
  ];

  public groupTotalRow: "top" | "bottom" = "bottom";
  // Subscription to manage API call subscriptions and prevent memory leaks
  private odinRigScheduleSubscription: Subscription = new Subscription();

  constructor(private commonService: CommonService,
    private odinStore: Store<{ odinAdvanceFilterData: IOdinFilterPayloadStore }>,
    private router: Router, private messageService: MessageService,
    private responsiveService: ResponsiveService,
    private odin2service: OdinV2Service,
    private listEditorBuilderService: ListEditorBuilderService,
    private authService: AuthService) {
    this.selectedRigAnalysisData = this.commonService.getRigAnalysisData();
    this.userDetail = this.authService.getUserDetail();

    if (this.selectedRigAnalysisData && this.selectedRigAnalysisData?.selectedRows?.length > 0) {
      localStorage.setItem('rigSelected', JSON.stringify(this.selectedRigAnalysisData));
    } else {
      let getRigData = localStorage.getItem('rigSelected');
      if (getRigData) {
        this.selectedRigAnalysisData = JSON.parse(getRigData);
      }
    }
    if (!this.selectedRigAnalysisData || this.selectedRigAnalysisData.length == 0) {
      this.router.navigateByUrl(routeLinks.odinDrillingDashboard3);
    }

    effect(() => {
       this.appId = this.listEditorBuilderService.selectedApplicationId();
    });
  }
  getRowHeight(params: RowHeightParams): number | undefined | null {
    if (params.data.measure === 'remainder') {
      return 10;
    }
    return 30;
  }
  ngOnInit() {
    this.gridOptions = {
      suppressAggFuncInHeader: true,
      getRowHeight: params => {
        if (params.node.group) return 30;
        if (["contingencyDemand", "orderQuantity", "primaryDemand"].includes(params.data.measure)) return 30;
        if (params.data.measure === "remainder") return 1;
        return params.node.isRowPinned ? 45 : 30;
      },
      autoGroupColumnDef: {
        cellRendererParams: { suppressCount: true },
        pinned: 'left'
      },
      rowClassRules: {
        'rigPDemand bt-1': params => { if (params.node.group) { return false; } if (params.data.measure === 'primaryDemand') return true; },
        'rigCDemand': params => { if (params.node.group) { return false; } if (params.data.measure === 'contingencyDemand') return true; },
        'order_row': params => { if (params.node.group) { return false; } if (params.data.measure === 'orderQuantity') return true; },
        'rigRemainder': params => { if (params.node.group) { return true; } if (params.data.measure === 'remainder') return false; },
        'hidden-row': params => { if (params.node.group) { return false; } if (params.data.measure === 'remainder') return true; },
        'odd-row': params => (params.rowIndex % 2 !== 0), // Class for odd rows
        'even-row': params => (params.rowIndex % 2 === 0), // Class for even rows
      },
      onCellValueChanged: this.onCellValueChanged.bind(this)

    };
    this.responsiveService.rigMediaQueries();
    this.height$ = this.responsiveService.getHeight$();

    this.bindWellsData();
  }

  //    addMediaQueries() {
  //   this.breakpointObserver.observe([
  //     '(min-width: 2560px) and (max-width: 3840px)',
  //     '(min-width: 1440px) and (max-width: 2560px)',
  //     '(min-width: 1024px) and (max-width: 1440px)',
  //     '(min-width: 768px) and (max-width: 1024px)'
  //   ]).subscribe(result => {
  //     if (result.breakpoints['(min-width: 2560px) and (max-width: 3840px)']) {
  //       this.height = '88vh';
  //     } else if (result.breakpoints['(min-width: 1440px) and (max-width: 2560px)']) {
  //       this.height = 'calc(100vh - 195px)';
  //     } else if (result.breakpoints['(min-width: 1024px) and (max-width: 1440px)']) {
  //       this.height = 'calc(100vh - 220px)';
  //     } else if (result.breakpoints['(min-width: 768px) and (max-width: 1024px)']) {
  //       this.height = '76vh';
  //     } else {
  //       this.height = '74vh'; // default fallback
  //     }
  //   });
  // }
  onCellValueChanged(event) {
    if (!this.editedRows) {
      this.editedRows = [];
    }
    if (!event.data) {
      return;
    }
    const wellName = event.data.wellName;
    const measure = event.data.measure;
    const rowIndex = event.node.rowIndex;

    let relatedRowData = null;
    if (measure === "contingencyDemand") {
      relatedRowData = event.api.getDisplayedRowAtIndex(rowIndex - 1)?.data;
    } else if (measure === "primaryDemand") {
      relatedRowData = event.api.getDisplayedRowAtIndex(rowIndex + 1)?.data;
    }
    if (relatedRowData) {
      let existingIndex = this.editedRows.findIndex(row => row.wellName === relatedRowData.wellName && row.measure === relatedRowData.measure);
      if (existingIndex === -1) {
        this.editedRows.push({ ...relatedRowData });
      }
    }
    let existingIndex = this.editedRows.findIndex(row => row.wellName === event.data.wellName && row.measure === event.data.measure);
    if (existingIndex === -1) {
      this.editedRows.push({ ...event.data });
    } else {
      this.editedRows[existingIndex] = { ...this.editedRows[existingIndex], ...event.data };
    }

  }

  createMaterialColumn() {
    this.columnDefs = [
      { headerName: 'Well Name', field: 'wellName', minWidth: 150, rowGroup: true, hide: true, cellStyle: { textAlign: 'center' }, pinned: 'left' },
      {
        headerName: 'Measure', field: 'measure', valueFormatter: this.formatValue.bind(this), cellStyle: { textAlign: 'center' },
        pinned: 'left'
      },
      { headerName: 'P10', field: 'p10StartDate', cellStyle: { textAlign: 'end' }, hide: this.selectedPType == "P50", headerComponent: RigHeaderLable, minWidth: 180, valueFormatter: this.dateFormatter, headerClass: 'pr-0', pinned: 'left' },
      { headerName: 'P50', field: 'p50StartDate', hide: this.selectedPType == "P10", cellStyle: { textAlign: 'end' }, headerComponent: RigHeaderLable, minWidth: 180, valueFormatter: this.dateFormatter, headerClass: 'pr-0', pinned: 'left' },
    ];
    const materialCols = this.rigScheduleMaterials.map((material) => {
      return {
        headerName: material.sapMM,
        field: material.sapMM,
        valueFormatter: (params) => {
          return (params.value != null && !isNaN(params.value))
            ? new Intl.NumberFormat(LocaleTypeEnum.enUS, { maximumFractionDigits: 0 }).format(params.value)
            : params.value;
        },
        // editable: (params) => {
        //   // if (this.authService.isFieldEditable(material.sapMM)) return true;
        //   if (!params.data) return false;
        //   if (params.data.measure === 'contingencyDemand') {
        //     const rowIndex = params.node.rowIndex;
        //     const previousRow = params.api.getDisplayedRowAtIndex(rowIndex - 1)?.data;    
        //   }
        //   if (params.data.measure  === 'primaryDemand') {
        //     const rowIndex = params.node.rowIndex;
        //     const afterRow = params.api.getDisplayedRowAtIndex(rowIndex + 1)?.data;
        //   }
        //   return params.data.measure === 'primaryDemand' || params.data.measure === 'contingencyDemand';
        // },
        editable: (params) => {
          const rowIndex = params.node.rowIndex;
          const rowData = params.data;

          const previousRow = params.api.getDisplayedRowAtIndex(rowIndex - 1)?.data;
          const afterRow = params.api.getDisplayedRowAtIndex(rowIndex + 1)?.data;

          // Check for measure
          const isPrimary = rowData.measure === 'primaryDemand';
          const isContingency = rowData.measure === 'contingencyDemand';

          // Get sapMM (assuming available in the row data)
          const sapMM = rowData?.material?.sapMM;

          // Return editable only if the field is editable by authService
          return (isPrimary || isContingency) && this.authService.isFieldEditable(rowData.measure);
        },

        cellDataType: 'text',
        maxWidth: 300,
        cellStyle: (params) => {
          if (params.value < 0) {
            return { backgroundColor: 'var(--theme-red-color-op25)' };
          } else {
            return { textAlign: 'center' };
          }
        },
        headerComponent: CustomRigHeaderGroup,
        headerComponentParams: { customParam: material },
        headerClass: 'custom-header-style',
        cellRendererSelector: (params: any) => {
          let footerRenderer = undefined;
          let footer = this.rigScheduleFooters.find(item => item.materialId === material.sapMM);
          if (footer) {
              const date = footer.noRemainderDate ? formatDate(footer.noRemainderDate, 'MM/dd/yy', 'en-US') : '';
              footerRenderer = {
                component: customRigFooter,
                params: {
                  well: footer.noRemainderWellName,
                  date: date,
                }
              };            
          }
          if (params.node.group) return undefined;
          if (params.node.sourceRowIndex === -1) return footerRenderer;
          return undefined;
        },
      };
    });


    this.setFooterData();

    this.columnDefs = [...this.columnDefs, ...materialCols];
    // this.frameworkComponents = { customFooter: CustomFooterComponent };
  }


  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.odinRigScheduleSubscription?.unsubscribe();
  }
  dateFormatter(params) {
    if (params.value) {
      const date = new Date(params.value);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
    return null;
  }

  /**
   *  it will get the user details from jwt token
   */
  getUserDetails() {
    let userAccess = this.authService.isAuthorized(AccessControls.DRILLING_RIG_SCHEDULE_ACCESS);
    this.commonService.setuserAccess(userAccess);
  }

  bindWellsData() {
    this.gridConfig.loading = true;
    this.wellsData = [];
    this.useP50Date = this.selectedPType == "P50" ? true : false;
    const materialIds = this.selectedRigAnalysisData.selectedRows
      .map(item => item.materialId)
      .filter(materialId => materialId !== undefined);

    // Joining materialIds with comma separator
    const commaSeparatedMaterialIds = materialIds.join(',');
    var body = {
      searchTerms: this.searchSelected,
      SearchConditions: [
        {
          FieldName: "MaterialId",
          Operator: "oneof",
          Value: commaSeparatedMaterialIds
        }
      ]
    };

    let params = {
      "includeContingency": this.include_contingency_demand.length > 0,
      "useP50StartDate": this.useP50Date,
      "useWhatIf": this.runWhatIfURL
    };

    this.loading = true;
    // this.inventoryService.getRigScheduleData(body, params)
    this.odinRigScheduleSubscription = this.odin2service.getDrillingRigScheduleData(body, params)
      .subscribe({
        next: (response: any) => {
          this.getUserDetails();
          this.loading = false;
          this.rigScheduleMaterials = response.data.rigScheduleMaterials;
          this.rigScheduleFooters = response.data.rigScheduleFooters;
          this.rigScheduleWells = response.data.rigScheduleWells;
          this.rigMaterialDemands = response.data.materialDemands;
          this.rigScheduleAnalysis = this.transformData(this.rigScheduleWells);
          this.originalData = JSON.parse(JSON.stringify(this.rigScheduleAnalysis));
          this.createMaterialColumn();
          // this.gridApi.setColumnDefs(this.columnDefs);

          if (response && response.data.rigScheduleWells) {
            this.rigScheduleWells = response.data.rigScheduleWells;
            this.wellsData = [];

            this.totalRecords = this.rigScheduleWells.reduce((count, well) => {
              return count + (well.wellMaterials ? well.wellMaterials.length : 0);
            }, 0);

            const initialChunkSize = 10;
            const wellsToProcess = this.rigScheduleWells.slice(0, initialChunkSize);
            //this.processWellData(wellsToProcess);
            const remainingWells = this.rigScheduleWells.slice(initialChunkSize);
            let index = 0;

            const processRemainingData = () => {
              if (index < remainingWells.length) {
                const chunkSize = 10;
                const chunk = remainingWells.slice(index, index + chunkSize);
                //this.processWellData(chunk);
                index += chunkSize;
                setTimeout(processRemainingData, 100);
              }
                this.isCollapse = false; //To set the title to collapsed as the grid is collapsed by default
                this.gridApi.expandAll();
            };
            processRemainingData();
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error fetching data:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err });
        }
      });
  }
  // processWellData(wells) {
  //   wells.forEach(well => {
  //     if (well.wellMaterials) {
  //       well.wellMaterials.forEach(material => {
  //         let wellData = {
  //           wellName: well.wellName,
  //           p10StartDate: well.p10StartDate,
  //           p50StartDate: well.p50StartDate,
  //           primaryDemand: material.primaryDemand || 0,
  //           contingencyDemand: this.include_contingency_demand ? (material.contingencyDemand || '-') : '-',
  //           orderQuantity: material.orderQuantity || 0,
  //           remainder: material.remainder || 0
  //         };
  //         this.wellsData.push(wellData);
  //       });
  //     }
  //   });
  // }


  formatValue(params: { value: string }): string {
    if (params.value) {
      return params.value
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, str => str.toUpperCase());
    }
    return params.value;
  }

  enableRunAnalysisButtonFlag(event: any) {
    this.isRunAnalysisEnabled = event;
    this.runWhatIfURL = event;
    this.runWhatIfAnalysis(true);
  }

  runWhatIfAnalysis(enableFromPopup?: boolean) {
    this.runWhatIfURL = (enableFromPopup) ? true : !this.runWhatIfURL;
    this.bindWellsData();
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.gridApi.sizeColumnsToFit();
    // this.gridColumnApi.setColumnVisible('contingencyDemand', this.include_contingency_demand);

  }
  setFooterData() {
    if (!this.rigScheduleMaterials || !this.rigScheduleFooters) {
      return;
    }
    const footerData = {
      measure: this.rigScheduleFooters.find(item => item.noRemainderWellName)?.noRemainderWellName || 'No Data',
    };

    this.rigScheduleMaterials.forEach(material => {
      const footer = this.rigScheduleFooters.find(item => item.materialId === material.sapMM);
      if (footer) {
        const date = footer.noRemainderDate? formatDate(footer.noRemainderDate, 'MM/dd/yy', 'en-US') : '';
          const footerValue = `${footer.noRemainderWellName || 'No Data'}  |` + ` ` + `  ${date || 'No Date'}`;
          footerData[material.sapMM] = String(footerValue);
        } 
        else footerData[material.sapMM] = "";      
    });
    this.pinnedBottomRowData = [footerData];
  }

  transformData(input: RigScheduleWell[]): RigScheduleAnalysis[] {
    const result: RigScheduleAnalysis[] = [];

    input.forEach((well) => {
      const { wellName, p10StartDate, p50StartDate, wellMaterials } = well;

      const measures: Record<string, Record<string, number>> = {
        primaryDemand: {},

      };
      if (this.include_contingency_demand.length > 0 && this.include_contingency_demand[0] == true) {
        measures['contingencyDemand'] = {}; // Add contingencyDemand only if the checkbox is checked
      }
      measures['orderQuantity'] = {};
      measures['remainder'] = {};
      const materialIds: Record<string, number> = {};
      wellMaterials?.forEach((material) => {
        const materialId = material.materialId;
        materialIds[materialId] = material.id;
        // measures['demand'][materialId] = material.demand;
        measures['primaryDemand'][materialId] = material.primaryDemand ?? 0;
        if (this.include_contingency_demand.length > 0 && this.include_contingency_demand[0] == true) {
          measures['contingencyDemand'][materialId] = material.contingencyDemand ?? 0;
        }
        measures['orderQuantity'][materialId] = material.orderQuantity ?? 0;
        measures['remainder'][materialId] = material.remainder;
      });
      Object.keys(measures).forEach((measure) => {
        if (measure === 'contingencyDemand' && this.include_contingency_demand.length > 0 && this.include_contingency_demand[0] == false) {
          return;
        }
        result.push({
          wellName,
          p10StartDate,
          p50StartDate,
          measure,
          id: materialIds,
          ...measures[measure],
        });
      });
    });

    return result;
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
      this.router.navigate([routeLinks.odinDrillingDashboard3]);
    }
    if (this.selectedView == 2) {
      this.router.navigate([routeLinks.odinCompletionDashboard3]);
    }
  }

  expandOrCollapseGrid() {
    this.isCollapse = !this.isCollapse;
    this.isCollapse ? this.gridApi.collapseAll() : this.gridApi.expandAll();
  }

  onSave() {
    if (!this.gridApi) return;
    if (!this.editedRows.length) {
      return;
    }

    const materialDataMap: Record<string, MaterialDemandModel> = {};

    this.editedRows.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (/^\d+$/.test(key)) {
          let materialId = key;
          let demandValue = entry[materialId] !== undefined ? Number(entry[materialId]) : null;
          let uniqueMaterialId = entry.id && entry.id[materialId] ? entry.id[materialId] : 0; // Fetch unique ID

          if (!isNaN(demandValue)) {
            let wellDetails = this.rigScheduleWells.find(well => well.wellName === entry.wellName);

            let wellKey = `${entry.wellName}_${materialId}`;
            if (!materialDataMap[wellKey]) {
              materialDataMap[wellKey] = {
                Id: uniqueMaterialId,
                MaterialNumber: materialId, // Ensure it's a string
                WellId: wellDetails ? wellDetails.wellId : 0,
                WellNumber: wellDetails ? wellDetails.wellNumber : 0,
                PrimaryDemand: 0,
                ContigencyDemand: 0,
                UserId: this.userDetail.uid
              };
            }

            if (entry.measure === "primaryDemand") {
              materialDataMap[wellKey].PrimaryDemand = demandValue;
            }
            if (entry.measure === "contingencyDemand") {
              materialDataMap[wellKey].ContigencyDemand = demandValue;
            }
          }
        }
      });
    });

    const transformedData: MaterialDemandModel[] = Object.values(materialDataMap);
    if (transformedData.length === 0) {
      return;
    }
    // console.log(transformedData);

    this.odinRigScheduleSubscription = this.odin2service.rigAnalysisUpsertMaterialDemand(transformedData).subscribe({
      next: (response) => {
        if (response) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Data saved successfully.',
          });
        }
        this.bindWellsData();
        this.editedRows = [];
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error saving data',
          detail: error,
        });
      }
    });
  }





  resetOdinGrid() {
    this.bindWellsData();
    this.editedRows = [];
  }
}
