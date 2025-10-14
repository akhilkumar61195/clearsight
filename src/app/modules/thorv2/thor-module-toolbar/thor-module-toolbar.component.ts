import { Component, computed, effect, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { AccessControls, schematicDetailsDataChangeLogTable, setFormattedContact } from '../../../common/constant';
import { routeLinks, storeFilters } from '../../../common/enum/common-enum';
import {
  IThorFilterPayloadStore,
} from '../../../common/ngrx-store';
import { select, Store } from '@ngrx/store';
import { map, Subscription } from 'rxjs';
import { MasterService } from '../../../services';
import { MasterObjectKeys } from '../../../common/enum/master-object-keys';
import { CommonService } from '../../../services/common.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LookupsService } from '../../../services/lookups.service';
import { MessageService } from 'primeng/api';
import { EditWellHeadstoreService } from '../../odinv3/services/editwellheadbuilder.service';
import { ThorDrillingWellCloneRequest } from '../../../common/model/ThorDrillingWellCloneRequest';
import { ThorService } from '../../../services/thor.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { WellsDetailsInteractiveDialogComponent } from '../Well-details-interactive-dialog/Well-details-interactive-dialog.component';
import { ViewWellheadersComponent } from '../../common/view-wellheaders/view-wellheaders.component';
import { CustomDialogComponent } from '../../common/custom-dialog/custom-dialog.component';

@Component({
  selector: 'app-thor-module-toolbar',
  standalone:true,
  imports:[...PRIME_IMPORTS, WellsDetailsInteractiveDialogComponent,
    ViewWellheadersComponent,
    CustomDialogComponent,
  ],
  templateUrl: './thor-module-toolbar.component.html',
  styleUrl: './thor-module-toolbar.component.scss'
})
export class ThorModuleToolBarComponent implements OnInit {
  schematicId: number;
  subscription: Subscription;
  holeSectionSelected: any;
  schematic: Completionschematicheader;
  userDetail: any;
  // Array of sections to populate the dropdown options
  masterTableFilterData: { id: number, name: string }[] = [];
  // The model for the selected section
  selectedmasterTableFilter: number | null = null;
  selectedCategory: number = 1;
  selectedView: number = 1;
  appId:number = 1;
  displayWellFeaturesDialog: boolean = false;
  displayPerforationTableDialog: boolean = false;
  displayCloneSchematicDialog: boolean = false;
  openChangeLog: boolean = false;
  schematicDetailId: number;
  isThor: boolean = false;
  isFilterBTNDisabled: boolean = false;
  isFilter = true;
  pageName = 'thor';
  advanceFilter: any;
  selectView = '1';
  viewOptions = [{ label: 'Drilling', value: 1 },
  { label: 'Completions', value: 2 }];
  viewData: { sectionID: number, itemNumber: number, zoneID: number };
  breadcrumbs: string[];
  isWellChanged: boolean = false;
  typeInterval: any = null;
  isTyping: boolean = false;
  searchValue: string;
  wellDetails: any = {};
  wellDetailsClone: any = {};
  wellDocumentTypes: any[] = [];
  materialDocumentTypes: any[] = [];
  planningEnginnersList: any[] = [];
  planningEngineerOptions: any[] = [];
  wellCoordinatorsList: any[] = [];
  displayWellDetailsDialog: boolean = false;
  displayUnsavedMessage: boolean = false;
  wellDetailsData: any;
  previousView: number;
  existingView: number;
  private originalUrl: string;
  visible: boolean = false;
  byPassvisible: boolean = false;
  isWellSelected: boolean = false;
  wellDetailsForm: FormGroup;
  projectList = []; // Populate this with the Project list 
  plantCodeList = []; // Populate this with the Plant Code list 
  wellTypeList = []; // Populate this with the Well Type list 
  wellTypeOptions = []; // Options for the Well Type dropdown
  // Computed signal for dropdown options (placed here)
  //  made the not assigned default selected //
  wellheadKitList = computed(() =>
    this.wellstore.kits().map(kit => ({
      label: kit.kitType,
      value: kit.id
    }))
  );

 
  // wellheadKitList = []; // Populate this with the Wellhead Kit list
  wellCoordinatorList = []; // Populate this with the Well Coordinator list 
  planningEngineerList = []; // Populate this with the Planning Engineer list 
  dialogTitle: string = '';
  savebuttonName: string = '';
  displayViewWellHeaders:boolean = false;
  displayConfirmationComponentDialog:boolean = false;
  byPassName:string;
  notAssignedKit:any;
  isUpdateEditable:boolean=true;
  showCloneBtn:boolean=true;
  private thorSubscription: Subscription = new Subscription();
  constructor(private route: ActivatedRoute,
    private location: Location,
    private thorStore: Store<{
      readThorAdvanceFilterData: IThorFilterPayloadStore;

    }>,
    private store: Store<{ thorAdvanceFilterData: IThorFilterPayloadStore }>,
    private wellstore: EditWellHeadstoreService,
    private completionSchematicService: CompletionschematicService,
    private authService: AuthService, private router: Router,
    private fb: FormBuilder,
    private messageService: MessageService,
    private masterService: MasterService,
    private thorService: ThorService,
    private commonService: CommonService,
    private lookupsService: LookupsService
  ) {
    this.userDetail = this.authService.getUserDetail();
    effect(() => {
      const kits = this.wellstore.kits();
      if (kits.length > 0) {
        const notAssignedKit = kits.find(
          kit => kit.kitType?.toLowerCase() === 'not assigned'
        );
        this.notAssignedKit = notAssignedKit?.id ?? 1;
      }
    }, { allowSignalWrites: true }); 
  
  }

  ngOnInit() {
    this.initializeForm();
    this.getUserDetails();
    this.commonService.thorSelectedWellObject$.subscribe((selectedWell) => {
      this.isWellSelected = !!selectedWell?.wellId; // Enable buttons if wellId is truthy
    });

    this.commonService.functionId$.subscribe((functionId) => {
      if (functionId !== null) {
        this.selectedView = functionId;
        this.existingView = functionId;
      }
    });
   
    }

    ngOnDestroy() {
        this.thorSubscription.unsubscribe();
      }
/**
 *  it will get the user details from jwt token
 */
   getUserDetails(){
     let userAccess=  this.authService.isAuthorized(AccessControls.THOR_DRILLING_ACCESS);
     this.commonService.setuserAccess(userAccess);
     this.isUpdateEditable=this.authService.isFieldEditable('showEquipment');
     
     this.showCloneBtn=this.authService.isFieldEditable('showClone');
  }
  initializeForm() {
    this.wellDetailsForm = this.fb.group({
      bypassName: ['', Validators.required],
      project: [null, Validators.required],
      plantCode: [null],
      wellType: [null, Validators.required],
      wellheadKit: [{ value: null, disabled: true }], // Set disabled at control creation time
      wellCoordinatorId: [''],
      WellCoordinatorName: [''],
      // cai: [''],
      phone: [''],
      planningEngineer: [null, Validators.required],
      p10SpudDate: [null],
      p50SpudDate: [null],
      fieldBlock: [''],
      ocsg: [''],
      rig: [''],
      wbs: [''],
    });
  }

  loadWellDetails() {
    this.loadKits();
    this.getPlanningEnginnersList();
    this.getProjects();
    this.getPlantCode();
    this.getWellTypes();
    this.getWellCoordinatorsList();

    this.wellDetailsForm.reset();
    const filerWell = this.commonService.getWellDetailsFilterData();
    this.wellDetailsForm.patchValue({
      id: filerWell.id,
    });
    this.thorSubscription = this.lookupsService
      .getWellsById(filerWell.id, filerWell.appId, filerWell.functionId)
      .subscribe({
        next: (resp: any) => {
          if (resp) {  
                      
            // Patch values from the JSON data
            this.wellDetailsForm.patchValue({
              bypassName: resp.wellName +' - Bypass',
              project: resp.projectId,
              plantCode: resp.plantId,
              wellType: resp.wellTypeId,
              wellheadKit: resp.wellHeadKitId, // Defaults to "Not Assigned"
              wellCoordinatorId: resp.wellCoordinatorId, // Add wellCoordinatorId
              WellCoordinatorName: resp.wellCoordinatorName, // Add WellCoordinatorName
              // cai: resp.cai,
              phone: resp.phone
                ? resp.phone.indexOf('(') > -1
                  ? resp.phone
                  : setFormattedContact(resp.phone, false)
                : '',
              planningEngineer: resp.planningEngineerId,
              p10SpudDate: resp.p10StartDate ? new Date(resp.p10StartDate) : null,
              p50SpudDate: resp.p50StartDate ? new Date(resp.p50StartDate) : null,
              fieldBlock: resp.filledAndBlock,
              ocsg: resp.ocsg,
              rig: resp.rig,
              wbs: resp.wbs,
            });
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load well details.',
          });
        },
      });
  }

  loadKits() {
    this.wellstore.loadKits();
  }

  /**
  * get all well coordinators list
  *
  */

  getWellCoordinatorsList() {
    this.masterService.get(MasterObjectKeys.GetWellCoordinatorsList).subscribe({
      next: (resp: any) => {
        
        if (resp && resp.success && resp.data) {
          this.wellCoordinatorsList = resp.data;
        } else {
          this.wellCoordinatorsList = [];
        }
      },
      error: () => {
        this.wellCoordinatorsList = [];
      },
    });
  }

  /**
  * get all planning enginners list
  *
  */
  /**
  * get all planning enginners list
  *
  */
  getPlanningEnginnersList() {
    this.thorSubscription = this.lookupsService
      .getPlanningEngineer()
      .subscribe({
        next: (resp: any) => {
          if (resp) {
            this.planningEnginnersList = resp;
            this.planningEngineerOptions = this.planningEnginnersList.map(planningEnginner => ({
              label: planningEnginner.chevronEngineer,
              value: planningEnginner.engineerId
            }));

          } else {
            this.planningEnginnersList = [];
          }
        },
        error: () => {
          this.planningEnginnersList = [];
        },
      });
  }
  /**
     * get all projects  list
     *
     */

  getProjects() {
    this.thorSubscription = this.lookupsService.getProjects().subscribe(data => {
      this.projectList = data.map(resp => ({
        label: resp.projectDesc,
        value: resp.id
      }));
    });
  }
  /**
 * get all plant code
 *
 */
  getPlantCode() {
    this.thorSubscription = this.lookupsService
      .getPlantCode()
      .subscribe({
        next: (resp: any) => {
          if (resp) {
            this.plantCodeList = resp;
            this.plantCodeList = resp.map(plant => ({
              label: plant.plantCode,
              value: plant.id
            }));
          } else {
            this.plantCodeList = [];
          }
        },
        error: () => {
          this.plantCodeList = [];
        },
      });
  }

  /**
      * get all well type  list
      *
      */
  getWellTypes() {
    // this.getWellHeaderData();
    this.thorSubscription = this.lookupsService.getWellTypes().subscribe({
      next: (resp: any) => {
        if (resp) {

          this.wellTypeList = resp;
          this.wellTypeOptions = this.wellTypeList.map(wellType => ({
            label: wellType.wellTypeName,
            value: wellType.id
          }));
        }
        else {

        }
      },
      error: () => {
        this.wellTypeList = [];
        this.wellTypeOptions = [];
      }
    });
  }

  /**
     * update CAI and Phone based on wellCoordinatorId
     *
     * @param wellCoordinatorId wellCoordinatorId
     */
  updateCoordinators(selectedId: number) {
    const selected = this.wellCoordinatorsList.find(c => c.WellCoordinatorId === selectedId);
    if (selected) {
      this.wellDetailsForm.patchValue({
        cai: selected.CAI,
        phone: setFormattedContact(selected.Phone, false), // optional formatting
        WellCoordinatorName: selected.WellCoordinatorName,
      });
    }
  }

  setWellSelection(filters: any) {
    this.advanceFilter = filters;
    this.isFilterBTNDisabled = !(this.advanceFilter.well > 0);
    this.isWellChanged = true;
  }
  openSidebar() {
    this.commonService.openSidebar();
  }
  closeWellFeaturesDialog() {
    this.displayWellFeaturesDialog = false;
  }
  showPerforationTableDialog() {
    this.displayPerforationTableDialog = true;
  }
  closePerforationTableDialog() {
    this.displayPerforationTableDialog = false;
  }
  showCloneSchematicDialog() {
    this.displayCloneSchematicDialog = true;
  }
  closeCloneSchematicDialog() {
    this.displayCloneSchematicDialog = false;
  }
  showWellFeaturesDialog() {
    this.displayWellDetailsDialog = true;
  }
  closeWellDetailsDialog() {
    this.displayWellDetailsDialog = false;
  }

  onViewSelectionChange() {
    if (this.commonService.hasUnsavedChanges()) {
      this.previousView = this.existingView;
      this.displayUnsavedMessage = true;
    } else {
      // this.displayUnsavedMessage = false
      this.switchView();

    }
  }

  // Helper function to switch views
  switchView() {
    const selectedViewTemp = this.selectedView;
    this.onClose();
    if (this.selectedView !== selectedViewTemp) {
      this.selectedView = selectedViewTemp;
    }

    if (this.selectedView === 1) {
      this.commonService.setFunctionIdThor(1);
      this.wellDetails.id = null;
      this.commonService.setWellDetailsFilterData(this.wellDetails);
      this.commonService.openSidebar();
      this.router.navigateByUrl(routeLinks.thor2LandingDashboard);
    } else if (this.selectedView === 2) {
      this.commonService.setFunctionIdThor(2);
      this.wellDetails.id = null;
      this.commonService.setWellDetailsFilterData(this.wellDetails);
      this.commonService.openSidebar();
      this.router.navigateByUrl(routeLinks.thor2Completions);
    }
  }

  onClose() {
    this.displayUnsavedMessage = false;
    if (this.commonService.hasUnsavedChanges()) {
      this.selectedView = this.previousView;
    }
  }
  changeLog() {
    this.openChangeLog = true;
  }

  getWellDetails() {
    let params = { WellId: this.advanceFilter?.well || 0 };
   this.thorSubscription = this.masterService
      .getDetails(MasterObjectKeys.GetWellDetails, params)
      .subscribe({
        next: (resp: any) => {
          if (resp && resp.success && resp.data) {
            this.wellDetails = resp.data;
            if (this.wellDetails.phone) {
              let isFormattedContact: boolean = (this.wellDetails.phone ?? "").indexOf("(") > -1;
              this.wellDetails.phone = ((isFormattedContact ? this.wellDetails.phone : setFormattedContact(this.wellDetails.phone, false)));
            }

            // convert with date object to apply calendar
            if (
              this.wellDetails.p10StartDate &&
              this.wellDetails.p10StartDate != '-'
            ) {
              this.wellDetails.p10StartDate = new Date(
                this.wellDetails.p10StartDate
              );
            }
            if (
              this.wellDetails.p50StartDate &&
              this.wellDetails.p50StartDate != '-'
            ) {
              this.wellDetails.p50StartDate = new Date(
                this.wellDetails.p50StartDate
              );
            }

            // store original data
            this.wellDetailsClone = structuredClone(this.wellDetails);
          } else {
            this.wellDetails = {};
            this.wellDetailsClone = {};
          }
        },
        error: () => {
          this.wellDetails = {};
          this.wellDetailsClone = {};
        },
      });
  }

  cloneWell() {
    this.visible = true;
  }
  handleCreate() {
    this.loadWellDetails();
    this.dialogTitle = 'Create Bypass Well';
    this.savebuttonName = 'Continue';
    this.visible = false;
    this.byPassvisible = true;

  }

  getLabelById(list: any[], id: number | string, labelKey = 'label', valueKey = 'value') {
    const item = list.find(i => i[valueKey] === id);
    return item ? item[labelKey] : '';
  }

  

  openConfirmationDialog(){
    this.displayConfirmationComponentDialog = true;
    this.payloadWellDetails();
  }

  payloadWellDetails(): ThorDrillingWellCloneRequest {
    if (this.wellDetailsForm.invalid) {
      this.wellDetailsForm.markAllAsTouched();
      return;
    }

    const wellDetails = this.commonService.getWellDetailsFilterData();
    this.wellDetailsForm.get('wellheadKit')?.enable(); // Ensure the field is enabled before retrieving values
    const formValue = this.wellDetailsForm.value;
    this.byPassName = formValue.bypassName;

    return {
      wellId: wellDetails.id,
      userId: this.userDetail.uid,
      wellTypeId: formValue.wellType,
      wellType: this.getLabelById(this.wellTypeOptions, formValue.wellType),
      wellName: formValue.bypassName,
      rig: formValue.rig,
      p10StartDate: formValue.p10SpudDate,
      p50StartDate: formValue.p50SpudDate,
      wbs: formValue.wbs,
      plantCodeId: formValue.plantCode,
      plantCode: this.getLabelById(this.plantCodeList, formValue.plantCode),
      planningEngineerId: formValue.planningEngineer,
      planningEngineer: this.getLabelById(this.planningEngineerOptions, formValue.planningEngineer),
      projectId: formValue.project,
      functionId: wellDetails.functionId,
      wellCoordinatorId: formValue.wellCoordinatorId,
      wellCoordinatorName: this.getLabelById(this.wellCoordinatorsList, formValue.wellCoordinatorId, 'WellCoordinatorName', 'WellCoordinatorId'),
      // cai: formValue.cai,
      phone: formValue.phone,
      filledAndBlock: formValue.fieldBlock,
      ocsg: formValue.ocsg,
      wellheadkitId: formValue.wellheadKit
    };
  }

  submitBypassForm() {
    const payload = this.payloadWellDetails();
    

    if (!payload) {
      return; // form was invalid
    }
    this.thorSubscription = this.thorService.cloneThorDrillingWell_ByPassWell(payload).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Bypass Well cloned successfully.' });
        this.byPassvisible = false;
        this.wellDetailsForm.get('wellheadKit')?.disable(); // Ensure the field is disable before retrieving values
        this.displayConfirmationComponentDialog = false;
        this.commonService.triggerRefreshSelectWell(); //to refresh the select well // 
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to clone well.' });
        this.displayConfirmationComponentDialog = false;
        this.wellDetailsForm.get('wellheadKit')?.disable(); // Ensure the field is disable before retrieving values
      }
    });
  }



  onOtherClick() {
    this.loadWellDetails();

    this.displayViewWellHeaders = true;
    this.visible = false;
  }
  closeDialog() {
    this.visible = false
  }
  
  onWellHeadersSave(){

  }
  onWellHeadersCancel(){
    this.displayViewWellHeaders = false;

  }
  closeBypassDialog() {
    this.byPassvisible = false;

  }
  onBypassDialogClose(){
    this.wellDetailsForm.get('wellheadKit')?.disable(); // Ensure the field is disable before retrieving values
  this.displayConfirmationComponentDialog=false
}
}
