import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { Router } from '@angular/router';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { GridStatePersistenceService } from '../../../common/builder/persistant-builder.service';
import { routeLinks } from '../../../common/enum/common-enum';
import { AdvanceFilterModel } from '../../../common/model/AdvanceFilterModel';
import { OdinOuterRibbonDto } from '../../../common/model/OdinOuterRibbonDto';
import { AuthService } from '../../../services';
import { CustomerPersonalizationService } from '../../../services/customer-personalization.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { CustomDialogComponent } from '../../common/custom-dialog/custom-dialog.component';
import { OdinWellSelectorComponent } from './odin-well-selector/odin-well-selector.component';
import { WellHeadersDialogComponent } from '../../common/well-headers/well-headers.component';
import { OdinTabComponent } from '../odin-tab/odin-tab.component';
import { OdinWhatIfComponent } from '../odin-what-if/odin-what-if.component';
import { OdinCommonService } from '../services/odin-common.service';
import { ChangeLogComponent } from '../../common/dialog/change-log.component';

@Component({
  selector: 'app-odin-dashboard',
  standalone:true,
  imports:[...PRIME_IMPORTS, WellHeadersDialogComponent, OdinWhatIfComponent,
    OdinTabComponent, CustomDialogComponent,OdinWellSelectorComponent,
    ChangeLogComponent
  ],
  templateUrl: './odin-dashboard.component.html',
  styleUrl: './odin-dashboard.component.scss'
})
export class OdinDashboardComponent implements OnDestroy {
  //@ViewChild(OdinV3DrillingDashboardComponent) drillingDashBoard!: OdinV3DrillingDashboardComponent;
  //@ViewChild(Odin3CompletionDashboardComponent) completionDashBoard!: Odin3CompletionDashboardComponent;
  displaySelectWells: boolean = false;
  whatIf: boolean = false;
  selectedMonthSummary: any = 12;
  selectedView: number = 1;
  //selectedDashboard: number = 1;
  displayEditWellHeaders: boolean = false;
  wellsHeaderCols: any[];
  selectedPType: string = "P10";
  selectedProjects: Array<string>;
  selectedWells: Array<string>;
  showWhatIfDialog: boolean = false;
  include_contingency: boolean[] = [];
  futureDate: any;
  selectedScenario: number;
  displayConfirmationComponentDialog: boolean = false;
  appId = 1
  @Output() sideBarVisible = new EventEmitter<any>();
  viewOptionsButtons = [
    { label: 'Drilling', value: 1 },
    { label: 'Completions', value: 2 }
  ];
  inventoryButtons = [
    { label: 'ERP', value: 1 },
    { label: 'FIELD', value: 2 }
  ];
  outerRibbonDto: OdinOuterRibbonDto;
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
  openChangeLog: boolean;
  isRunAnalysisEnabled: boolean = false;
  runWhatIfURL: any;
  userDetails: any;
  selectedInventory: number = 1; // Default to SAP view
  previousInventory: number = 1;
  openInventoryModal: boolean = false;
  tempSelectedInventory: number = 1; // Temporary storage for inventory selection
  readonly stateKey = 'Odin - Dashboard';
  private odinCommonServicesubscription: Subscription;
  private OdinDashboardSubscription: Subscription = new Subscription();

  constructor(
    private breakpointObserver: BreakpointObserver, private router: Router,
    private odinCommonService: OdinCommonService,
    private gridStateService: GridStatePersistenceService,
    private personalizationService: CustomerPersonalizationService,
    private authService: AuthService, // Assuming you have an AuthService for authentication

  ) {
    this.userDetails = this.authService.getUserDetail(); // Get user details from AuthService

  }

  ngOnInit() {
    // this.getPersonalization();
    this.OdinDashboardSubscription = this.odinCommonService.currentRecord.subscribe((functionId) => {
      if (functionId) {
        this.selectedView = functionId;
      }

    });
    this.futureSelectedDate();

    this.odinCommonServicesubscription = this.odinCommonService.outerRibbonDto$.subscribe((payload) => {
      this.onOuterRibbonSelectionChange(payload.payload, payload.key);
    });
  }
  /**
   * Gets the state from personalization and update the selected values
   * @param outerRibbonDto 
   * @param type 
   */
  onOuterRibbonSelectionChange(outerRibbonDto: OdinOuterRibbonDto, type: string) {
    this.selectedPType = outerRibbonDto.pType.toUpperCase();
    this.selectedMonthSummary = outerRibbonDto.month;
    this.include_contingency = [outerRibbonDto.showContingency];
    this.selectedWells = outerRibbonDto.SelectedWells;
    this.selectedInventory = outerRibbonDto.SelectedInventory;
    this.selectedProjects = outerRibbonDto.SelectedProjects;
    this.selectedScenario = outerRibbonDto.SelectedScenario;
    this.whatIf = outerRibbonDto.whatIf;
  }

  // Unsubscribe to avoid memory leaks
   ngOnDestroy() {
        this.OdinDashboardSubscription.unsubscribe();
    }
  futureSelectedDate() {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + parseInt(this.selectedMonthSummary));
    const day = String(currentDate.getDate()).padStart(2, '0');  // Pad single digits with leading zero
    const month = String(((currentDate.getMonth() == 6 || currentDate.getMonth() == 12) ? currentDate.getMonth() + 0 : currentDate.getMonth() + 1)).padStart(2, '0');  // Months are 0-indexed, pad with leading zero
    const year = currentDate.getFullYear();
    this.futureDate = `${month}/${day}/${year}`;
  }

  /** Handle the cancellation of well header edits */
  onWellHeadersCancel(wellCreated: boolean = false) {
    this.displayEditWellHeaders = false;
    this.wellsHeaderCols = [];
    this.displayConfirmationComponentDialog = false;
    // If wellCreated is true, we need to update the outerRibbonDto with the current state
    if (wellCreated) {
      this.UpdateOuterRibbonDto();
      this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "EditWellHeaders");
    }
  }

  /**
   * Updates the outerRibbonDto with the current state of the dashboard
   */
  UpdateOuterRibbonDto() {
    this.outerRibbonDto = {
      month: this.selectedMonthSummary,
      pType: this.selectedPType,
      showContingency: (this.include_contingency.length > 0 && this.include_contingency[this.include_contingency.length - 1] == true) ? true : false,
      whatIf: this.whatIf,
      SelectedProjects: this.selectedProjects,
      SelectedWells: this.selectedWells,
      SelectedInventory: this.selectedInventory,
      SelectedScenario: this.selectedScenario ? this.selectedScenario : 0,
    };

  }
  /** Handle the saving of well header edits */
  onWellHeadersSave() {
    this.displayEditWellHeaders = false;
    this.wellsHeaderCols = [];
    this.displayConfirmationComponentDialog = false;
    // Update the outerRibbonDto with the current state
    this.UpdateOuterRibbonDto();
    this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "EditWellHeaders");
  }

  toggleBalance() {
    this.UpdateOuterRibbonDto();
    // this.setContextData(); // stores the selected to method
    this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "IncludeContingency");
  }

  toggleSelectwell() {
    this.displaySelectWells = !this.displaySelectWells;
  }

  onMonthChange() {
    this.UpdateOuterRibbonDto();
    // this.setContextData(); // stores the selected to method
    this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "Month");
    this.futureSelectedDate();
  }

  onPChange() {
    this.UpdateOuterRibbonDto();
    //  this.setContextData();// stores the selected to method
    this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "PType");
  }

  runWhatIfAnalysis() {
    this.whatIf = !this.whatIf;
    this.UpdateOuterRibbonDto();
    this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "WhatIf");
  }

  setWellSelection(filters: AdvanceFilterModel) {

    this.selectedProjects = filters.projects;
    this.selectedWells = filters.wells;

    //this.outerRibbonDto = {
    //  month: this.selectedMonthSummary,
    //  pType: this.selectedPType,
    //  includeContingency: this.include_contingency,
    //  whatIf: this.whatIf,
    //  SelectedProjects: this.selectedProjects,
    //  SelectedWells: this.selectedWells
    //}
    //this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "Wells");
    this.odinCommonService.setSelectedFunction(filters.functions)
  }

  updateFilter() {
    this.UpdateOuterRibbonDto();
    this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "Wells");
    this.displaySelectWells = !this.displaySelectWells;

    //this.selectedView = this.odinCommonService.getSelectedFunction() ? this.odinCommonService.getSelectedFunction() : 1;
    if (this.selectedView != this.odinCommonService.getSelectedFunction()) {
      this.selectedView = this.odinCommonService.getSelectedFunction();
      this.onViewChange(this.selectedView);
    }
  }

  onViewChange(selectedValue: number): void {
    //this.selectedDashboard = this.odinCommonService.setSelectedFunction(selectedValue);
    if (selectedValue == 1)
      this.router.navigate(['/' + routeLinks.odinDashboard3]);
    else
      this.router.navigate(['/' + routeLinks.odinCompletionDashboard3]);
  }


  // onInventoryChange() {  
  //   // this.selectedInventory = this.tempSelectedInventory;
  //   this.UpdateOuterRibbonDto();
  //   this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "Inventory");
  //   // this.openInventoryModal = false;
  // }

  onInventoryChange(newValue: number) {
    if (newValue !== this.previousInventory) {
      this.tempSelectedInventory = newValue;
      this.openInventoryModal = true; // Open the modal
    }
  }

  // modal for warning the calculate columns clear //

  onInventoryButtonClicked() {
    this.selectedInventory = this.tempSelectedInventory;
    this.previousInventory = this.tempSelectedInventory;
    this.openInventoryModal = false;

    this.UpdateOuterRibbonDto();
    this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, 'Inventory');
  }
  // close the inventor modal
  closeInventoryModal() {
    this.selectedInventory = this.previousInventory; // Revert to old selection
    this.openInventoryModal = false;
  }
  /**
   * Reset the outerRibbonDto to default values
   */
  clearValues() {
    this.outerRibbonDto = {
      month: this.selectedMonthSummary,
      pType: this.selectedPType,
      showContingency: (this.include_contingency.length > 0 && this.include_contingency[0] == true) ? this.include_contingency[0] : false,
      whatIf: this.whatIf,
      SelectedProjects: [],
      SelectedWells: [],
    }
    //this.displaySelectWells = !this.displaySelectWells;
    this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "Wells");
  }
  enableRunAnalysisButtonFlag(event: any) {

    this.isRunAnalysisEnabled = event;
    this.runWhatIfURL = event;
    //this.runWhatIfAnalysis();
    this.whatIf = event;
    this.UpdateOuterRibbonDto();
    this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "WhatIf");
  }

  changeLog() {

    this.openChangeLog = true;
  }
  getSelectedScenario(evnt: number) {
    this.selectedScenario = evnt;
  }

  setContextData() {
    // Set custom context like selectedWellId
    this.gridStateService.setContextData({
      selectedPType: this.selectedPType,
      selectedMonthSummary: this.selectedMonthSummary,
      showContingency: this.include_contingency,
    });

  }
  // Retrieves the latest personalization for the current user and applies it to the grid
  getPersonalization() {
    const userId = this.userDetails?.uid || 0;
    this.OdinDashboardSubscription = this.personalizationService.getLatestCustomerPersonalization(this.stateKey, userId).subscribe({
      next: (res) => {
        const state = res?.result.appState ? JSON.parse(res.result.appState) : null;
        const contextData = res?.result?.contextData;
        const context = typeof contextData === 'string' ? JSON.parse(contextData) : contextData;
        if (context) {
          // Bind values from context to local component variables
          this.selectedPType = context.selectedPType;
          this.selectedMonthSummary = context.selectedMonthSummary;
          this.include_contingency = context.showContingency;

          // Update outerRibbonDto after binding personalization
          this.UpdateOuterRibbonDto();

          this.odinCommonService.setOuterRibbonDto(this.outerRibbonDto, "ContextLoad");

          // // Optionally call dependent methods
          this.futureSelectedDate(); // If you want to re-run logic dependent on month
        }


      },
      error: (err) => {
        console.warn('No personalization found or failed to load.', err);
      },
    });
  }
}
