import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { setFormattedContact } from '../../../common/constant';
import { Personas } from '../../../common/enum/user-persona.enum';
import { UserPrimaryRole } from '../../../common/model/UserInfo';
import { WellInfo } from '../../../common/model/well-info';
import { AuthService } from '../../../services';
import { CommonService } from '../../../services/common.service';
import { LookupsService } from '../../../services/lookups.service';
import { ThorService } from '../../../services/thor.service';
import { UserService } from '../../../services/user.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { SelectedWellBuilderService } from '../services/selected-well-builder.service';

@Component({
  selector: 'app-well-details-interactive-dialog',
  templateUrl: './Well-details-interactive-dialog.component.html',
  styleUrls: ['./Well-details-interactive-dialog.component.scss'],
  providers: [ConfirmationService, MessageService, UserService, CommonService, LookupsService, ThorService, FormBuilder,AuthService, SelectedWellBuilderService],
      standalone: true,
      imports: [...PRIME_IMPORTS],
})
export class WellsDetailsTYRDialogComponent implements OnInit, OnDestroy {
  @Input() schematicId!: number; // Input to accept schematicsID
  @Input() displayWellDetailsDialog: boolean = false; // Controls dialog visibility
  @Output() onClose = new EventEmitter<void>();
  @Input()isUpdateEditable:boolean=true;
  advanceFilter: any;
  wellDetails: WellInfo[] = [];
userDetail: any;
filerWell:any
  wellDetailsForm!: FormGroup; // Form Group for the dialog form
  wellDetailEditable: boolean = false;
  wellCoordinatorsList: any[] = [];
  materialCoordinatorsList: any[] = [];
  filteredCoordinators: any[] = [];
  selectedWellId = this.selectedWellBuilderService.selectedWellId; // Getting the well id

  // Subscription to manage API call subscriptions and prevent memory leaks
  private wellDetailsSubscription: Subscription = new Subscription();
  constructor(
    private messageService: MessageService,
    private userService: UserService,
    private commonService: CommonService,
    private lookupsService: LookupsService,
    private thorService: ThorService,
    private fb: FormBuilder,
    private authService: AuthService,
    private selectedWellBuilderService: SelectedWellBuilderService
  ) {
    this.userDetail = this.authService.getUserDetail();
    this.filerWell = this.commonService.getWellDetailsFilterData();
  }

  // Unsubscribe from all subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    this.wellDetailsSubscription.unsubscribe();
  }

  ngOnInit() {
    this.initializeForm();
    this.loadMaterialCoordinators();
    this.loadWellDetails();
  }

  initializeForm(): void {
    this.wellDetailsForm = this.fb.group({
      mcId: ['', Validators.required],
      // cai: ['',Validators.required],
      phone: [''],
      p10StartDate: ['',null],
      p50StartDate: [''],
      rig: ['',Validators.required],
      wbs: [''],
      llWbs: [''],
      auxWbs: [''],
      userIdModifiedBy: this.userDetail.uid,
      id: [''],
    });

  }

  loadWellDetails() {
    // Adding the check to handle the error on landing to the app
    if (this.selectedWellId()) {

      this.wellDetailsForm.reset();
      const filerWell = this.commonService.getWellDetailsFilterData();    
      this.wellDetailsForm.patchValue({
        id: filerWell.id,
      });
      this.wellDetailsSubscription = this.lookupsService
      .getWellsById(filerWell.id, filerWell.appId, filerWell.functionId)
      .subscribe({
        next: (resp: any) => {  
          if (resp) {
            this.wellDetailsForm.patchValue(resp);
            if (resp.mcId) {
              const selectedCoordinator = this.materialCoordinatorsList.find(
                m => m.materialCoordinatorId === resp.mcId
              );
              if (selectedCoordinator) {
                this.wellDetailsForm.patchValue({ mcId: selectedCoordinator });
              }
            }
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
  }

  filterCoordinators(event: any) {
  const query = event.query.toLowerCase();
  this.filteredCoordinators = this.materialCoordinatorsList.filter(item =>
    item.materialCoordinatorName.toLowerCase().includes(query)
  );
}

  loadMaterialCoordinators() {
  this.wellDetailsSubscription = this.userService.getUserPrimaryRole(Personas.MaterialCoordinator).subscribe({
    next: (res: UserPrimaryRole[]) => {
      this.materialCoordinatorsList = res.map(user => ({
        materialCoordinatorId: user.userId,
        materialCoordinatorName: user.fullName,
      }));
    },
    error: (err) => {
      console.error('Error fetching material coordinators:', err);
    }
  });
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
   
  // material coordinators change event
  updateMaterialCoordinators(materialCoordinatorId: number) {
    let materialCoordinators = this.materialCoordinatorsList.find(
      (c) => c.materialCoordinatorId === materialCoordinatorId
    );
    if (materialCoordinators) {
      this.wellDetailsForm.patchValue({
        mcId: materialCoordinators.materialCoordinatorId ?? null,
        materialCoordinatorName: materialCoordinators.materialCoordinatorName ?? '',
      });
    }
  }
  editWellDetails() {
    const wellDetails = this.wellDetailsForm.value;
    if (wellDetails.mcId && wellDetails.mcId.materialCoordinatorId) {
    wellDetails.mcId = wellDetails.mcId.materialCoordinatorId;
  }    
    if (wellDetails.p10StartDate) {
      const p10StartDate=this.convertISTToUTC(wellDetails.p10StartDate);
      const p50StartDate=this.convertISTToUTC(wellDetails.p50StartDate);
      wellDetails.p10StartDate = p10StartDate;
      wellDetails.p50StartDate = p50StartDate;
      
    }
    
    this.wellDetailsSubscription = this.thorService
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
