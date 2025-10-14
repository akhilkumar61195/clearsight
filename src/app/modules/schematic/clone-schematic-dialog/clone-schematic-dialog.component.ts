import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { routeLinks } from '../../../common/enum/common-enum';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Wells } from '../../../common/model/wells';
import { WellApplications } from '../../../common/model/well-applications';
import { LookupsService } from '../../../services/lookups.service';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { AccessControls } from '../../../common/constant';
import { CommonService } from '../../../services/common.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-clone-schematic-dialog',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './clone-schematic-dialog.component.html',
  styleUrl: './clone-schematic-dialog.component.scss'
})
export class CloneSchematicDialogComponent implements OnDestroy{
  cloneSchematicForm!: FormGroup;
  schematicsName: string = '';
  project: string = '';
  lease: string = '';
  wellName: string = '';
  wellLocation: string = '';
  chevronEngineer: string = '';
  chevronWBS: string = '';
  @Output() onClose = new EventEmitter<void>();
  userDetail: any;
  @Input() displayCloneSchematicDialog: boolean = false;
  isEditAllowed: boolean = false; // To get the user access for edit the form
  visible: boolean = true;
  wellApplications: WellApplications;
  completionDesigns: { label: string; value: number }[] = [];// Array to hold completion design data
  @Input() schematicId: number;
  projects: any[] | undefined;
  planningEnginnersList: any[] | undefined;
  schematic: Completionschematicheader; // Schematic data modal
  private schematicSubscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private completionSchematicService: CompletionschematicService,
    private lookupService: LookupsService,
    private fb: FormBuilder,
    private authService: AuthService,
    private commonService: CommonService,
    private messageService: MessageService) {
    this.userDetail = this.authService.getUserDetail();

  }

  ngOnInit() {
    /*console.log('clone', this.schematicId)*/
    this.cloneSchematicForm = this.fb.group({
      schematicsName: ['', Validators.required],
      project: ['', Validators.required],
      projectId: [null],
      lease: [''],
      wellName: ['', Validators.required],
      wellLocation: ['', Validators.required],
      chevronEngineer: ['', Validators.required],
      chevronWBS: [''],
      backupEngineer: [''],
      completionDesignId: [{ value: null, disabled: true }],
      noOfZones: [{ value: null, disabled: true }],
      userIdCreatedBy: this.userDetail.uid
    },
      { validators: this.validateEngineers }
    );
    this.getUserDetails();

    // Disabling the form for read only user
    this.getProjects();
    this.getPlanningEnginnersList(); // Fetch planning engineers list
    this.loadCompletionDesigns(); // fetching completion design
    //  this.fetchSchematicData(); // Fetch schematic data by ID

  }

  ngOnDestroy() {
    this.schematicSubscription.unsubscribe();
  }
  /**
       *  it will get the user details from jwt token
       */
  getUserDetails() {
    let userAccess = this.authService.isAuthorized(AccessControls.CLONE_SCHEMATIC);
    this.commonService.setuserAccess(userAccess);
    // Checking the user access for editability
    this.isEditAllowed = this.authService.isFieldEditable('isEditCloneSchematic');
    if (this.isEditAllowed) {
    this.cloneSchematicForm.enable();
  } else {
    this.cloneSchematicForm.disable();
  }
  }

  // Fetch schematic data by ID and patch the form with the response
  fetchSchematicData(): void {
    this.schematicSubscription = this.completionSchematicService.getSchematicHeaderById(this.schematicId).subscribe({
      next: (resp) => {

        if (resp) {
          const filteredPlanningEnginnersList = this.planningEnginnersList?.filter(
            (engineer) => engineer.label === resp.chevronEngineer
          );
          // Patch values from the response
          this.cloneSchematicForm.patchValue({
            schematicsName: resp.schematicsName || '',
            project: resp.projectId || '',
            projectId: resp.projectId,
            lease: resp.lease || '',
            wellName: resp.wellName + ' - Clone',
            wellLocation: resp.wellLocation || '',
            chevronEngineer: filteredPlanningEnginnersList?.length
              ? filteredPlanningEnginnersList[0].value
              : '',
            chevronWBS: resp.chevronWBS || '',
            backupEngineer: resp.backupEngineer || '',
            userIdCreatedBy: this.userDetail.uid,
            completionDesignId: resp.completionDesignId,
            noOfZones: resp.noOfZones
          });
          // Conditional enabling/disabling of noOfZones (completionDesignId =1 means single trip multizone)
          const hasZones = resp.completionDesignId === 1;
          const noOfZonesControl = this.cloneSchematicForm.get('noOfZones');

          if (hasZones) {
            noOfZonesControl?.disable();
          } else {
            noOfZonesControl?.disable();
          }
        }
      },
      error: (error) => {
        console.error('Error fetching schematic data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch schematic data',
        });
      },
    });
  }

  getProjects() {
    this.schematicSubscription = this.lookupService.getProjects().subscribe(data => {
      this.projects = data.map(resp => ({
        label: resp.projectDesc,
        value: resp.id
      }));
    });
  }
  getPlanningEnginnersList() {

    this.schematicSubscription = this.lookupService.getPlanningEngineer()
      .subscribe({
        next: (data: any) => {

          if (data) {

            this.planningEnginnersList = data.map(resp => ({
              label: resp.chevronEngineer,
              value: resp.engineerId
            }));
          }
        },
        error: () => {
          this.planningEnginnersList = [];
        },
      });
  }
  validateEngineers(form: AbstractControl) {
    const chevronEngineer = form.get('chevronEngineer')?.value;
    const backupEngineer = form.get('backupEngineer')?.value;
    if (chevronEngineer && backupEngineer && chevronEngineer === backupEngineer) {
      return { engineerMismatch: true }; // Return error if values are the same
    }
    return null; // Return null if validation passes
  }

  submitCloneSchematicForm(): void {
    if (this.cloneSchematicForm.valid) {
      const projectId = this.cloneSchematicForm.value.project;
      const chevronEngineerId = this.cloneSchematicForm.value.chevronEngineer;
      const backupEngineerId = this.cloneSchematicForm.value.backupEngineer;

      const selectedProject = this.projects.find(p => p.value === projectId);
      const projectDesc = selectedProject ? selectedProject.label : '';

      const selectChevronEngineerName = this.planningEnginnersList.find(ce => ce.value === chevronEngineerId)
      const chevronEngineerName = selectChevronEngineerName ? selectChevronEngineerName.label : '';

      const selectBackupEngineerName = this.planningEnginnersList.find(ce => ce.value === backupEngineerId)
      const backupEngineerName = selectBackupEngineerName ? selectBackupEngineerName.label : '';

      const payload = {
        ...this.cloneSchematicForm.value,
        projectId: projectId,
        project: projectDesc,
        chevronEngineer: chevronEngineerName,
        chevronEngineerId: chevronEngineerId,
        backupEngineer: backupEngineerName,
        backupEngineerId: Number(backupEngineerId),
      };
      this.schematicSubscription = this.completionSchematicService.cloneSchematicData(payload, this.schematicId).subscribe({
        next: (id: number) => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Cloned schematic successfully' });

          this.cancelCloneSchematic();

          //Create completions well
          const request = {
            id: 0,
            wellName: payload.wellName,
            //appId: 1,
            functionId: 2,
            schematicId: this.schematicId
          };

          this.schematicSubscription = this.completionSchematicService.upsertWells(request).subscribe({
            next: (wellResponse: Wells) => {
              // console.log('Well successfully upserted', wellResponse);
              this.completionSchematicService.updateWellId(id, wellResponse.id)
                .subscribe({
                  next: (res) => { /*console.log(res)*/ },
                  error: (error) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: error }); }
                });

              //create completions well applications
              this.createWellApplications(4, wellResponse.id);

            },
            error: (wellError) => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: wellError });
              // console.error('Error upserting well', wellError);
            }
          });


          //Uncomment the below 2lines for redirection to the newly created schematic
          //this.router.navigateByUrl(`${routeLinks.schematicDetail}/${id}`);
          //this.completionSchematicService.getSelectedSchematic(id)
        },
        error: (error) => {
          //console.log(error)
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to clone schematic' });
        }
      });

    }
  }

  createWellApplications(appId: number, wellId: number) {

    this.wellApplications = {
      id: 0,
      appId: appId,
      userId: this.userDetail.uid,
      wellId: wellId,
    }

    this.schematicSubscription = this.completionSchematicService.createWellApplications(this.wellApplications).subscribe({
      next: (res) => { /*console.log(res)*/ },
      error: (error) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: error }); }
    });

  }

  cancelCloneSchematic() {
    this.onClose.emit();
  }

  /**
   * fetching completion design and binding it to well type dropdown
   */
  loadCompletionDesigns() {
    this.schematicSubscription = this.lookupService.getCompletionDesigns().subscribe({
      next: (data) => {
        // console.log(data);
        this.completionDesigns = data.map((resp: any) => ({
          label: resp.completionDesign1,
          value: resp.completionDesignId
        }));
      },
      error: (err) => {
        console.error('Error fetching completion designs', err);

      },
    });
  }
  /**
   * 
   * @param event will disable and enable zone count field and will also changes zone count value
   */
  onWellTypeChange(event: any) {
    const zoneCountControl = this.cloneSchematicForm.get('noOfZones');

    if (event.value === 1) {
      zoneCountControl?.disable();
      this.cloneSchematicForm.patchValue({ noOfZones: 2 }); // zone count set 2 when we will have well type as single zone multi trip  and user can increares or decrease zone count
    } else {
      zoneCountControl?.disable();
      this.cloneSchematicForm.patchValue({ noOfZones: 1 }); // for rest of the well type zone count always be 1 and disable
    }
  }

}
