import { Component, effect, ViewEncapsulation } from '@angular/core';
import { ColDef, GridOptions, RowHeightParams } from 'ag-grid-community';
import { Observable, Subscription } from 'rxjs';
import { RigMaterialDemands, RigScheduleAnalysis, RigScheduleFooter, RigScheduleFooterRow, RigScheduleMaterial, RigScheduleWell, WellData } from '../../../../common/model/completion-rig-analysis';
import { CommonService } from '../../../../services/common.service';
import { OdinV2Service } from '../../../../services/odinv2.service';
import { IOdinFilterPayloadStore, OdinAdvanceFilterAction, OdinAdvanceFilterActionType, READ_ODIN_ADVANCE_FILTER_ACTION_TYPE } from '../../../../common/ngrx-store';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LocaleTypeEnum, routeLinks } from '../../../../common/enum/common-enum';
import { AdvanceFilterModel } from '../../../../common/model/AdvanceFilterModel';
import { formatDate } from '@angular/common';
import { CustomRigHeaderGroup } from '../../odin-custom-headers/custom-rig-header.component';
import { customRigFooter } from '../../odin-custom-headers/custom-rig-footer.component';
import { RigHeaderLableCompletion } from '../../odin-custom-headers/rig-header-lable-completion.component';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';
import { ResponsiveService } from '../../../../services/responsive.service';
import { AccessControls } from '../../../../common/constant';
import { AuthService } from '../../../../services';
import { ListEditorBuilderService } from '../../../common/builders/list-editor-builder.service';
import { OdinWhatIfComponent } from '../../odin-what-if/odin-what-if.component';

@Component({
  selector: 'app-odin-rig-schedule-completions',
  standalone:true,
  imports:[PRIME_IMPORTS, OdinWhatIfComponent],
  templateUrl: './odin-rig-schedule-completions.component.html',
  styleUrl: './odin-rig-schedule-completions.component.scss',
   encapsulation: ViewEncapsulation.None
})
export class OdinRigScheduleCompletionsComponent {
components = {
    'customRigFooter': customRigFooter
};  
  showWhatIfDialog: boolean = false;
  selectedRigAnalysisData: any = [];
  isRunAnalysisEnabled: boolean = false;
  isTyping: boolean = false;
  loading: boolean = false;
  columnDefs: ColDef[]  = [];
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
  //vendor: string[];
  //wellColumnData: any[];
  wellsData: WellData[] = [];
  rigScheduleFooters:RigScheduleFooter[] = [];
  //materialData: any[];
  //materialCountArray: any[];
  unsavedChanges: boolean = false;
  selectedPType: string = "P10";
  include_contingency_demand: boolean[] = [];
  rigScheduleWells: RigScheduleWell[] ;
  rigScheduleAnalysis: RigScheduleAnalysis[]=[];
  rigScheduleMaterials: RigScheduleMaterial[];
  rigMaterialDemands: RigMaterialDemands[];
  gridOptions: GridOptions;
  pinnedBottomRowData: RigScheduleFooterRow[] = [];
  odinSelectedFunction:number;
  //footerCols:any[]=[];
  totalRecords: number = 0;
  gridApi: any;
  gridColumnApi: any;
  footerData: RigScheduleFooterRow[] = [];
  selectedView: number = 2;
  isCollapse:boolean=false;
  userDetail: any;
  height$: Observable<string>;
  appId: number;

  viewOptionsButtons = [
    { label: 'Drilling', value: 1 },
    { label: 'Completion', value: 2 }
  ];

  public groupTotalRow: "top" | "bottom" = "bottom";

  // Subscription to manage API call subscriptions and prevent memory leaks
  private rigScheduleSubscription: Subscription = new Subscription();

  constructor(private commonService: CommonService,
    private odinV2Service: OdinV2Service,
        private authService: AuthService,
        private listEditorBuilderService: ListEditorBuilderService,
    private odinStore: Store<{ odinAdvanceFilterData: IOdinFilterPayloadStore }>,
    private router: Router, private messageService: MessageService,
  private responsiveService: ResponsiveService) {
    this.selectedRigAnalysisData = this.commonService.getRigAnalysisData();
    this.userDetail = this.authService.getUserDetail();

    if (
      this.selectedRigAnalysisData &&
      this.selectedRigAnalysisData?.selectedRows?.length > 0
    ) {
      localStorage.setItem(
        'rigSelected',
        JSON.stringify(this.selectedRigAnalysisData)
      );
    } else {
      let getRigData = localStorage.getItem('rigSelected');
      if (getRigData) {
        this.selectedRigAnalysisData = JSON.parse(getRigData);
      }
    }
    if (
      !this.selectedRigAnalysisData ||
      this.selectedRigAnalysisData.length == 0
    ) {
      this.router.navigateByUrl(routeLinks.odinCompletionDashboard3);
    }

    effect(() => {
      this.appId = this.listEditorBuilderService.selectedApplicationId();
    });
  }
  getRowHeight(params: RowHeightParams): number | undefined | null {
    if(params.data.measure === 'remainder')
    {
      return 10;
    }
    return 30;
  }
  ngOnInit() {
    this.gridOptions =  {
      suppressAggFuncInHeader: true,
      getRowHeight: params => {
    if (params.node.group) {  return 30; }
    if(params.data.measure === 'contingencyDemand'){ return 30;}
    if(params.data.measure === 'orderQuantity'){ return 30;}
    if(params.data.measure === 'primaryDemand'){ return 30;}
    if(params.data.measure === 'remainder'){ return 1;}
    else
    if(params.node.isRowPinned) {return 45;   } 
    else   return 30;},
     // getRowHeight: this.getRowHeight,
      autoGroupColumnDef: {   
        cellRendererParams: { suppressCount: true},
        maxWidth: 220,
        pinned:'left'
      },
      rowClassRules: {
      'rigPDemand bt-1': params => {if (params.node.group) { return false;  } if(params.data.measure === 'primaryDemand') return true;},
      'rigCDemand': params => {if (params.node.group) { return false; } if(params.data.measure === 'contingencyDemand') return true;},
      'order_row': params => {if (params.node.group) {  return false; } if(params.data.measure === 'orderQuantity') return true;},
      'rigRemainder': params => {if (params.node.group){return true; } if(params.data.measure === 'remainder') return false;},
      'hidden-row':params => {if (params.node.group) {   return false;} if(params.data.measure === 'remainder') return true;},
      'odd-row': params => (params.rowIndex % 2 !== 0), // Class for odd rows
      'even-row': params => (params.rowIndex % 2 === 0), // Class for even rows
      },
    };
    this.responsiveService.rigMediaQueries();
    this.height$ = this.responsiveService.getHeight$();

    this.bindWellsData();
  }
  
  createMaterialColumn(){
    this.columnDefs = [
      { headerName: 'Well Name', field: 'wellName', minWidth: 150, rowGroup: true, maxWidth: 170, hide:true, cellStyle: { textAlign: 'center' },pinned: 'left'},
      { headerName: 'Measure', field: 'measure', maxWidth: 170, valueFormatter: this.formatValue.bind(this), cellStyle: { textAlign: 'center' }, pinned: 'left'},
      { headerName: 'P10', field: 'p10StartDate', cellStyle: { textAlign: 'end' }, hide: this.selectedPType == "P50", headerComponent: RigHeaderLableCompletion, minWidth: 180, valueFormatter: this.dateFormatter, headerClass: 'pr-0',pinned: 'left', },
      { headerName: 'P50', field: 'p50StartDate', hide: this.selectedPType == "P10", cellStyle: { textAlign: 'end' }, headerComponent: RigHeaderLableCompletion, minWidth: 180, valueFormatter: this.dateFormatter, headerClass: 'pr-0',pinned: 'left', },
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
        // editable: true,
        // editable: (params) => {
        //   return params.data && (params.data.measure === 'primaryDemand' || params.data.measure === 'contingencyDemand');
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
        cellDataType: 'text' ,
        maxWidth: 300,
        cellStyle: params => {
          if (params.value < 0) {
            return { backgroundColor: 'var(--theme-red-color-op25)' };
          } else {
            return { textAlign: 'center' };
          }
        },
        headerComponent: CustomRigHeaderGroup,
        headerComponentParams: { customParam: material },
        headerClass: 'custom-header-style',
      //  cellRenderer: 'customFooter'
      cellRendererSelector: (params: any) => {
        let footerRenderer = undefined;
        let  footer = this.rigScheduleFooters.find(item => item.materialId === material.sapMM);        
        if (footer) {
          const date = footer.noRemainderDate ? formatDate(footer.noRemainderDate, 'MM/dd/yy', 'en-US'): '';
         // const footerValue = `${footer.noRemainderWellName || 'No Data'}  |`+ ` ` +`  ${date || 'No Date'}`;
          footerRenderer = {  
            component: customRigFooter,
            params: {
              well: footer.noRemainderWellName,
              date: date,
            }
          };        
          }
        if (params.node.group) {   return undefined;  }
        if (  params.node.sourceRowIndex === -1) return footerRenderer  ;
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
    this.rigScheduleSubscription?.unsubscribe();
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
      .map(item => item.materialNumber)
      .filter(materialNumber => materialNumber !== undefined);
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
        "includeContingency": this.include_contingency_demand.length>0,
        "useP50StartDate": this.useP50Date,
        "useWhatIf": this.runWhatIfURL
    };
  
    this.loading = true;
    this.rigScheduleSubscription = this.odinV2Service.getCompletionRigScheduleData(body, params)
        .subscribe({
            next: (response: any) => {
                this.loading = false;
                this.rigScheduleMaterials = response.data.rigScheduleMaterials;
                this.rigScheduleFooters = response.data.rigScheduleFooters;
                this.rigScheduleWells = response.data.rigScheduleWells;
                this.rigScheduleAnalysis = this.transformData(this.rigScheduleWells);
                this.createMaterialColumn();
                //this.gridApi.setColumnDefs(this.columnDefs);
  
                if (response && response.data.rigScheduleWells) {
                    this.rigScheduleWells = response.data.rigScheduleWells;
                    this.wellsData = [];
  
                    this.totalRecords = this.rigScheduleWells.reduce((count, well) => {
                      return count + (well.wellMaterials ? well.wellMaterials.length : 0);
                  }, 0);

                    const initialChunkSize = 1; // Process the first well immediately
                    const wellsToProcess = this.rigScheduleWells.slice(0, initialChunkSize);
                    this.processWellData(wellsToProcess);
                    const remainingWells = this.rigScheduleWells.slice(initialChunkSize);
                    let index = 0;
  
                    const processRemainingData = () => {
                        if (index < remainingWells.length) {
                            const chunkSize = 10;
                            const chunk = remainingWells.slice(index, index + chunkSize);
                            this.processWellData(chunk);
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
  processWellData(wells) {
    wells.forEach(well => {
        if (well.wellMaterials) {
            well.wellMaterials.forEach(material => {
                let wellData = {
                    wellName: well.wellName,
                    p10StartDate: well.p10StartDate,
                    p50StartDate: well.p50StartDate,
                    primaryDemand: material.primaryDemand || 0,
                    contingencyDemand: this.include_contingency_demand  ? (material.contingencyDemand|| '-') : '-',
                    orderQuantity: material.orderQuantity || 0,
                    remainder: material.remainder || 0
                };
                this.wellsData.push(wellData);
            });
        }
    });
  }
  
  
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
          const date = footer.noRemainderDate ? formatDate(footer.noRemainderDate, 'MM/dd/yy', 'en-US') : '';
          const footerValue = `${footer.noRemainderWellName || 'No Data'}  |`+ ` ` +`  ${date}`;
          footerData[material.sapMM] = String(footerValue);
        }
        else footerData[material.sapMM] = "";
    });
   // console.log('285',footerData);
    this.pinnedBottomRowData = [footerData];
  }
  
    transformData(input: RigScheduleWell[]): RigScheduleAnalysis[] {
      const result: RigScheduleAnalysis[] = [];
    
      input.forEach((well) => {
        const { wellName, p10StartDate, p50StartDate, wellMaterials } = well;
    
        const measures: Record<string, Record<string, number>> = {
          primaryDemand: {},
          
        };
        if (this.include_contingency_demand.length> 0 && this.include_contingency_demand[0] == true) {
          measures['contingencyDemand'] = {}; // Add contingencyDemand only if the checkbox is checked
        } 
        measures['orderQuantity'] = {};
        measures['remainder'] = {};
  
        wellMaterials.forEach((material) => {
          const materialId = material.materialId;
          // measures['demand'][materialId] = material.demand;
          measures['primaryDemand'][materialId] = material.primaryDemand??0;
          if (this.include_contingency_demand.length> 0 && this.include_contingency_demand[0] == true) {
          measures['contingencyDemand'][materialId] = material.contingencyDemand??0;
          }
          measures['orderQuantity'][materialId] = material.orderQuantity??0;
          measures['remainder'][materialId] = material.remainder;
        });
        Object.keys(measures).forEach((measure) => {
            if (measure === 'contingencyDemand' && this.include_contingency_demand.length> 0 && this.include_contingency_demand[0] == false) {
              return;
            }
          result.push({
            wellName,
            p10StartDate,
            p50StartDate,
            measure,
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
    
    expandOrCollapseGrid(){
     this.isCollapse= !this.isCollapse;
     this.isCollapse ? this.gridApi.collapseAll() : this.gridApi.expandAll();
    }
}
