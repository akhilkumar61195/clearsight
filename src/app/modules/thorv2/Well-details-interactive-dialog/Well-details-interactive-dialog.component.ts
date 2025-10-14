import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService, MasterService } from '../../../services';
import { MasterObjectKeys } from '../../../common/enum/master-object-keys';
import { setFormattedContact } from '../../../common/constant';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService } from '../../../services/inventory.service';
import { CommonService } from '../../../services/common.service';
import { LookupsService } from '../../../services/lookups.service';
import { WellInfo } from '../../../common/model/well-info';
import { ThorService } from '../../../services/thor.service';
import { formatDate } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-well-details-interactive-dialog',
  standalone:true,
  imports:[RouterModule,...PRIME_IMPORTS],
  templateUrl: './Well-details-interactive-dialog.component.html',
  styleUrls: ['./Well-details-interactive-dialog.component.scss'],
  providers: [ConfirmationService],
})
export class WellsDetailsInteractiveDialogComponent implements OnInit , OnDestroy {
  @Input() schematicId!: number; // Input to accept schematicsID
  @Input() displayWellDetailsDialog: boolean = false; // Controls dialog visibility
  @Output() onClose = new EventEmitter<void>();
  @Input()isUpdateEditable:boolean=true;
  advanceFilter: any;
  wellDetails: WellInfo[] = [];
  wellDetailsForm!: FormGroup; // Form Group for the dialog form
  wellDetailEditable: boolean = false;
  wellCoordinatorsList: any[] = [];
  planningEnginnersList: any[] = [];
  userDetail:any;
  filerWell:any;
  private thorSubscription: Subscription = new Subscription();
  constructor(
    private masterService: MasterService,
    private inventoryService: InventoryService,
    private messageService: MessageService,
    private commonService: CommonService,
    private lookupsService: LookupsService,
    private thorService: ThorService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    // this.userDetail = this.authService.getUserDetail();
    this.filerWell = this.commonService.getWellDetailsFilterData();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.getPlanningEnginnersList();
    this.getWellCoordinatorsList();
  }

  ngOnDestroy() {
    this.thorSubscription.unsubscribe();
  }

  initializeForm(): void {
    this.userDetail = this.authService.getUserDetail();    
    this.wellDetailsForm = this.fb.group({
      wellCoordinatorId: ['',Validators.required],
      // cai: ['',Validators.required],
      phone: [''],
      planningEngineerId: [null],
      p10StartDate: ['',Validators.required],
      p50StartDate: [''],
      filledAndBlock: [''],
      ocsg: [''],
      rig: [''],
      wbs: [''],
      userIdModifiedBy: [''],   // initialize empty
      wellCoordinatorName: [''],
      id: [''],
    });
  
  }

  loadWellDetails() {
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
            this.wellDetailsForm.patchValue(resp);
            if (resp.phone) {
              const isFormattedContact = resp.phone.indexOf('(') > -1;
              this.wellDetailsForm.patchValue({
                phone: isFormattedContact
                  ? resp.phone
                  : setFormattedContact(resp.phone, false),
              });
            }
            if (resp.p10StartDate && resp.p10StartDate !== '-') {
              this.wellDetailsForm.patchValue({
                p10StartDate: resp.p10StartDate ? new Date(resp.p10StartDate) : null,
              });
            }
            if (resp.p50StartDate && resp.p50StartDate !== '-') {
              this.wellDetailsForm.patchValue({
                p50StartDate: resp.p50StartDate ? new Date(resp.p50StartDate) : null,
              });
            }
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
  /**
   * get all planning enginners list
   *
   */
  getPlanningEnginnersList() {
    this.thorSubscription = this.masterService
      .get(MasterObjectKeys.GetPlanningEnginnersList)
      .subscribe({
        next: (resp: any) => {
          if (resp && resp.success && resp.data) {
            this.planningEnginnersList = resp.data;
          } else {
            this.planningEnginnersList = [];
          }
        },
        error: () => {
          this.planningEnginnersList = [];
        },
      });
  }
  // update well details record

  /**
   * get all well coordinators list
   *
   */
  getWellCoordinatorsList() {
    this.thorSubscription = this.masterService.get(MasterObjectKeys.GetWellCoordinatorsList).subscribe({
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
   * update CAI and Phone based on wellCoordinatorId
   *
   * @param planningEngineerId planningEngineerId
   */
  updatePlanningEnginners(planningEngineerId: number) {
    let planningEnginner = this.planningEnginnersList.find(
      (c) => c.EngineerId === planningEngineerId
    );
    if (planningEnginner) {
      this.wellDetailsForm.patchValue({
        planningEngineerName: planningEnginner.EngineerName,
      });
    }
  }

  /**
   * check validation if current press key is valid or not.
   *
   * @param event keydown event
   * @returns {boolean} true if valid otherwise false
   */
  allowAlphaNumericOnly(event: KeyboardEvent, allowSpace?: boolean): boolean {
    let formula = allowSpace ? /^[a-z0-9_\s]+$/i : /^[a-z0-9]+$/i;
    const pattern = new RegExp(formula);
    return pattern.test(event.key);
  }
  /**
   * update CAI and Phone based on wellCoordinatorId
   *
   * @param wellCoordinatorId wellCoordinatorId
   */
  updateCoordinators(wellCoordinatorId: number) {
    let wellCoordinators = this.wellCoordinatorsList.find(
      (c) => c.WellCoordinatorId === wellCoordinatorId
    );
    if (wellCoordinators) {
      this.wellDetailsForm.patchValue({
        // cai: wellCoordinators.CAI ?? '-',
        phone: wellCoordinators.Phone ?? '-',
        wellCoordinatorName: wellCoordinators.WellCoordinatorName ?? '',
        wellCoordinator: wellCoordinators.WellCoordinatorName ?? '',
      });
    }
  }
  editWellDetails() {
    this.wellDetailsForm.get('userIdModifiedBy')?.setValue(this.userDetail?.uid ? Number(this.userDetail.uid) : null);
    const wellDetails = this.wellDetailsForm.value;
    // console.log(wellDetails);
    
    if (wellDetails.p10StartDate) {
      const p10StartDate=this.convertISTToUTC(wellDetails.p10StartDate);
      const p50StartDate=this.convertISTToUTC(wellDetails.p50StartDate);
      wellDetails.p10StartDate = p10StartDate;
      wellDetails.p50StartDate = p50StartDate;
      
    }

    this.thorSubscription = this.thorService
      .updateWellDetails(wellDetails)
      .subscribe((response: any) => {

        this.closeDialog();
        if (response) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Well details successfully updated.',
          });
          this.closeDialog();
          this.commonService.getSelectedWellNumber(response.id);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please correct the errors in the form.',
          });
        }
      });
  }

  convertISTToUTC(istDate: string): string {
  
    const dateObj = new Date(istDate);
    const utcDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));  
  
    return utcDate.toISOString().split('T')[0];  
  }
  // Close the dialog
  closeDialog(): void {
    this.onClose.emit();
  }
}
