import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription, map } from "rxjs";
import { MessageService } from "primeng/api";
import _ from 'lodash';
import { Store, select } from "@ngrx/store";
import { IOdinFilterPayloadStore, IThorFilterPayloadStore, OdinAdvanceFilterAction, OdinAdvanceFilterActionType, READ_ODIN_ADVANCE_FILTER_ACTION_TYPE, READ_THOR_ADVANCE_FILTER_ACTION_TYPE, ThorAdvanceFilterAction, ThorAdvanceFilterActionType } from "../../../common/ngrx-store";
import { consoleLogErrorMessage } from "../../../common/general-methods";
import { routeLinks, storeFilters } from "../../../common/enum/common-enum";
import { odinAdvanceFilterModel } from "../../../common/model/odinAdvanceFilterModel";
import { thorAdvanceFilterModel } from "../../../common/model/thorAdvanceFilterModel";
import { MasterService } from "../../../services";
import { LookupKeys } from "../../../common/enum/lookup-keys";
import { MasterObjectKeys } from "../../../common/enum/master-object-keys";
import { PRIME_IMPORTS } from "../../../shared/prime-imports";

@Component({
  selector: 'well-selector',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './well-selector.component.html',
  styleUrl: './well-selector.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class WellSelectorComponent implements OnInit {

  @Input() appliedFilter: any;
  @Output() setFilterValues = new EventEmitter<any>();

  @Input() isFilter: boolean = false;
  @Input() advanceFilterFor: string;
  noSpecial: RegExp = /^[^<>*!]+$/
  advanceFilter: any;

  lookUpType = LookupKeys;

  allLookUpData: any[] | undefined;
  filteredLookUpData: any[] | undefined;

  projects: any[] | undefined;
  selectedProject: string[] | undefined;

  functions: any[] | undefined;
  selectedFunction: string[] | undefined;

  wells: any[] | undefined;
  selectedWell: any | undefined;
  searchWell: string;

  timeline: any[] | undefined;
  selectedTimeLine: string | undefined;

  isOdin: boolean = false;
  subscription: Subscription;

  odinFilter: odinAdvanceFilterModel = new odinAdvanceFilterModel();
  thorFilter: thorAdvanceFilterModel = new thorAdvanceFilterModel();

  maxProjectSelection: number = 1;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private masterService: MasterService,
    private odinStore: Store<{ odinAdvanceFilterData: IOdinFilterPayloadStore }>,
    private thorStore: Store<{ thorAdvanceFilterData: IThorFilterPayloadStore }>
  ) {

    if (this.advanceFilterFor) {
      this.isOdin = this.advanceFilterFor.toLowerCase().includes("odin");
    } else
      this.isOdin = (activatedRoute.snapshot.data?.screen ?? "").toLowerCase().includes("odin");
    // (router.url ?? "").toLowerCase().includes("odin");
  }

  ngOnInit() {
    if (this.advanceFilterFor) {
      this.isOdin = this.advanceFilterFor.toLowerCase().includes("odin");
    }
    this.getLookupData();
  }

  ngOnDestroy() {
    let element = document.querySelector(".menuwithdd .menuicon");
    if (element && element.classList) {
      document.querySelector(".menuwithdd .menuicon").classList.remove("d-none");
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnChanges(changes: any) {
    if (changes && (changes.appliedFilter && !changes.appliedFilter?.firstChange)) {
      this.advanceFilter = changes.appliedFilter.currentValue;
      this.setSelectedValue();
      if (this.advanceFilter?.resetChanges) {
        this.resetChanges();
      }
      // if ((this.advanceFilter.well || 0) == 0 || (this.advanceFilter.wells && this.advanceFilter.wells.length == 0)) {
      //   this.dropDownChanged(LookupKeys.Project, null);
      // }
    }
  }

  sendFiltersToLandingPage(env?: any) {
    if (this.isFilter) {
      const areSelectedWellInList = this.wells.filter((well: any) => (this.isOdin ? (this.selectedWell.includes(well.WELLID) ? true : false) : (this.selectedWell == well.WELLID)));
      if (!areSelectedWellInList || (areSelectedWellInList && areSelectedWellInList.length == 0))
        this.selectedWell = [];
      if (this.isOdin) {
        this.advanceFilter = new odinAdvanceFilterModel();
        this.advanceFilter.projects = this.selectedProject ?? [];
        this.advanceFilter.functions = this.selectedFunction ?? [];
        this.advanceFilter.timeline = this.selectedTimeLine ?? "";
        this.advanceFilter.wells = this.selectedWell ?? [];
      } else {
        this.advanceFilter = new thorAdvanceFilterModel();
        this.advanceFilter.projects = this.selectedProject ?? [];
        this.advanceFilter.functions = this.selectedFunction ?? [];
        this.advanceFilter.well = this.selectedWell;
      }
      this.setFilterValues.emit(this.advanceFilter);
    }
  }

  getLookupData() {
    let lookupCall = this.isOdin ? this.masterService.get(MasterObjectKeys.GetAllWells, this.isOdin) : this.masterService.getThorWells();

    lookupCall.subscribe((resp: any) => {
      if (resp && resp.success) {
        this.allLookUpData = resp.data;
        this.allLookUpData.map((resp) => { resp.ISHIDDEN = false; });
        this.setLookups(resp.data, LookupKeys.AllWellsWithFunctionProject);
        if (this.isFilter)
          if (this.isOdin) {
            this.getAdvanceFilterData(this.odinStore, storeFilters.OdinAdvanceFilter);
          } else {
            this.getAdvanceFilterData(this.thorStore, storeFilters.ThorAdvanceFilter);
          }
      } else {
        consoleLogErrorMessage(resp.message);
        this.showToast(resp.message);
      }
    });

    this.timeline = [
      { name: '6 Months', code: '6' },
      { name: '12 Months', code: '12' },
      { name: '18 Months', code: '18' },
      { name: '24 Months', code: '24' }
    ];
  }

  setSelectedValue() {
    if (this.isFilter) {
      if (this.isOdin) {
        this.selectedProject = this.advanceFilter.projects ?? [];
        this.selectedFunction = this.advanceFilter.functions ?? [];
        this.selectedTimeLine = this.advanceFilter.timeline ?? "";
        this.selectedWell = this.advanceFilter.wells ?? [];
      } else {
        this.selectedProject = this.advanceFilter.projects ?? [];
        this.selectedFunction = this.advanceFilter.functions ?? [];
        this.selectedWell = this.advanceFilter.well;
      }
    }
  }

  setLookups(data: any, lookupTypeStr: LookupKeys) {
    if (lookupTypeStr == LookupKeys.AllWellsWithFunctionProject || lookupTypeStr == LookupKeys.Project)
      this.projects = _.uniqBy(data, 'PROJECTID');
    if (lookupTypeStr == LookupKeys.AllWellsWithFunctionProject || lookupTypeStr == LookupKeys.Function)
      this.functions = _.uniqBy(data, 'FUNCTIONID');
    if (lookupTypeStr == LookupKeys.AllWellsWithFunctionProject || lookupTypeStr == LookupKeys.Well)
      this.wells = _.uniqBy(data, 'WELLID');
    this.maxProjectSelection = this.isOdin ? this.projects.length : 1;
  }

  getNameCode(lookupvalues: any, idPropName: string, namePropName) {
    if (lookupvalues)
      return lookupvalues.map((resp: any) => {
        return { name: resp[namePropName], code: resp[idPropName] }
      })
  }

  showToast(message: string) {
    this.messageService.add({ severity: 'success', detail: message });
  }

  dropDownChanged(dropdown: LookupKeys, event?: any) {
    let lookupData = this.allLookUpData;
    lookupData = lookupData.filter((resp: any) => (this.selectedProject && this.selectedProject.length > 0) ? this.selectedProject.includes(resp.PROJECTID) : true && (this.selectedFunction && this.selectedFunction.length > 0) ? this.selectedFunction.includes(resp.FUNCTIONID) : true);
    if (dropdown == LookupKeys.Project) {
      this.setLookups(lookupData, LookupKeys.Function);
      this.setLookups(lookupData, LookupKeys.Well);
    }
    else if (dropdown == LookupKeys.Function) {
      this.setLookups(lookupData, LookupKeys.Well);
    }
    this.sendFiltersToLandingPage();
  }

  searchWellFIlter() {
    this.wells.map((resp: any) => {
      if ((this.searchWell || "") != "")
        resp.ISHIDDEN = !resp.WELLNAME.toLowerCase().includes(this.searchWell.toLowerCase());
      else
        resp.ISHIDDEN = false;
    })
  }

  selectAllWell() {
    if (!this.selectedWell || this.selectedWell.length != this.wells.length) {
      this.selectedWell = [];
      this.wells.map((resp) => { this.selectedWell.push(resp.WELLID); });
    } else {
      this.selectedWell = [];
    }
    this.sendFiltersToLandingPage();
  }

  goToLandingPage() {
    let redirectURL: string;
    let reducerObject: any;
    if (this.isOdin) {
      this.setFilters();
      redirectURL = routeLinks.odinLandingDashboard;
      reducerObject = this.setReducers();
      this.odinStore.dispatch(reducerObject);
    }
    else {
      this.setFilters();
      redirectURL = routeLinks.thorLandingDashboard;
      reducerObject = this.setReducers();
      this.thorStore.dispatch(reducerObject);
    }
    this.router.navigateByUrl(redirectURL);
  }

  setFilters() {
    if (this.isOdin) {
      this.odinFilter.projects = this.selectedProject ?? [];
      this.odinFilter.functions = this.selectedFunction ?? [];
      this.odinFilter.timeline = this.selectedTimeLine ?? "";
      this.odinFilter.wells = this.selectedWell ?? [];
    } else {
      this.thorFilter.globalSearch = "";
      this.thorFilter.projects = this.selectedProject ?? [];
      this.thorFilter.functions = this.selectedFunction ?? [];
      this.thorFilter.well = this.selectedWell;
    }
  }


  getAdvanceFilterData(store: Store<any>, storeFilters: any) {
    const _subscription = store.select(storeFilters).subscribe(data => {
      if (data) {
        if (this.isOdin) {
          this.advanceFilter = _.cloneDeep(data.odinFilterPayload);
        } else {
          this.advanceFilter = _.cloneDeep(data.thorFilterPayload);
        }
        if (this.advanceFilter) {
          this.setSelectedValue();
        }
      }
    });

    this.subscription = _subscription;
    //Get Initial values of filters
    store.pipe(
      select(storeFilters),
      map(state => state.odinFilterPayload) // now this.users$ returns users instead of state.
    ).forEach((res) => {
      this.advanceFilter = res
    });

    if (this.advanceFilter) {
      this.setSelectedValue();
      if (this.advanceFilter.projects.length > 0 || this.advanceFilter.functions.length > 0) {
        this.dropDownChanged(LookupKeys.Project, null);
      }
    }
  }

  setReducers() {
    let reducerObject: any;
    if (this.isOdin) {
      reducerObject = new OdinAdvanceFilterAction(null);
      reducerObject.payload = JSON.parse(JSON.stringify(this.odinFilter));
      reducerObject.type = READ_ODIN_ADVANCE_FILTER_ACTION_TYPE as OdinAdvanceFilterActionType;
    } else {
      reducerObject = new ThorAdvanceFilterAction(null);
      reducerObject.payload = JSON.parse(JSON.stringify(this.thorFilter));
      reducerObject.type = READ_THOR_ADVANCE_FILTER_ACTION_TYPE as ThorAdvanceFilterActionType;
    }
    return reducerObject;
  }

  /**
   * reset changes and filtered list
   *
   */
  resetChanges() {
    this.searchWell = '';
    this.dropDownChanged(LookupKeys.Project);
    this.searchWellFIlter();
  }
}
