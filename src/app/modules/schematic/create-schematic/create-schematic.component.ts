import { Component, EventEmitter, Input, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { routeLinks } from '../../../common/enum/common-enum';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Wells } from '../../../common/model/wells';
import { CommonService } from '../../../services/common.service';
import { WellApplications } from '../../../common/model/well-applications';
import { BehaviorSubject, Subscription } from 'rxjs';
import { LookupsService } from '../../../services/lookups.service';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { ThorService } from '../../../services/thor.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-create-schematic',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './create-schematic.component.html',
  styleUrl: './create-schematic.component.scss'
})
export class CreateSchematicComponent implements OnDestroy {
  completionSchematicForm!: FormGroup;
  schematicsName: string = '';
  project: string = '';
  lease: string = '';
  wellName: string = '';
  wellLocation: string = '';
  chevronEngineer: string = '';
  chevronWBS: string = '';
  @Output() onClose = new EventEmitter<void>();
  userDetail: any;
  @Input() displayCreateSchematicDialog: boolean = false; // Controls dialog visibility
  @Input() isEditAllowed: boolean = true;
  visible: boolean = true;
  wellApplications: WellApplications;
  projects: any[] | undefined;
  wellsData: any[] = [];
  selectedWellId: any;
  newWell: string = '';
  planningEnginnersList: any[] | undefined;
  completionDesigns: { label: string; value: number }[] = [];// Array to hold completion design data
  private schematicSubscription: Subscription = new Subscription();
  constructor(

    private router: Router,
    // private schematicService: SchematicService, 
    private completionSchematicService: CompletionschematicService,
    private fb: FormBuilder,
    private authService: AuthService,
    private lookupService:LookupsService,
    private commonService: CommonService,
    private thorService: ThorService,
    private messageService: MessageService) {
    this.userDetail = this.authService.getUserDetail();
  }

  ngOnInit() {

    this.completionSchematicForm = this.fb.group({
      schematicsName: ['', Validators.required],
      project: ['',Validators.required],
      projectId: [null],
      lease: [''],
      wellName: ['', Validators.required],
      wellLocation: ['', Validators.required],
      chevronEngineer: ['', Validators.required],
      chevronWBS: [''],
      backupEngineer:[''],
      wellTypeId: [1],
      zoneCount:[2],
      userIdCreatedBy: this.userDetail.uid
    },
    { validators: this.validateEngineers }
  );
  }

  ngOnDestroy() {
    this.schematicSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges){
    this.getProjects();
    this.getPlanningEnginnersList();
    this.loadCompletionDesigns();
  }

  // getWells() {
  //   this.lookupService.getWellsByProject(2,1).subscribe({
  //     next: (response: any) => {
  //       console.log(response);
        
  //       if (response?.success && response.data?.length) {
  //         this.wellsData = response.data.map((well: any) => ({
  //           label: well.name, 
  //           value: well.id 
  //         }));
  //       } else {
  //         this.wellsData = [];
  //       }
  //     },
  //     error: () => {
  //       this.wellsData = [];
  //     },
  //   });
  // }

  // onWellChange(value: string) {
  //   console.log('Selected Well:', value);
  // }

  // addNewWell() {
  //   if (this.newWell.trim() !== '') {
  //     const newWellObj = { label: this.newWell, value: this.newWell };
  //     this.wellsData.push(newWellObj); 
  //     this.selectedWellId = this.newWell;
  //     this.newWell = '';
  //   }
  // }

  getProjects() {
    this.schematicSubscription = this.lookupService.getProjects().subscribe(data => {
      this.projects = data.map(resp => ({
        label: resp.projectDesc, 
        value: resp.id     
      }));
      const notAssignedProject = this.projects.find(p => p.label === 'Not Assigned');

        // If "Not Assigned" exists, set it as default in form
        if (notAssignedProject) {
            this.completionSchematicForm.patchValue({ project: notAssignedProject.value });
        }
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
  
  // Method for submitting the Create SchematicForm
  submitCompletionSchematicForm(): void {
    if (this.completionSchematicForm.valid) {
     
      const projectId = this.completionSchematicForm.value.project;
      const chevronEngineerId=this.completionSchematicForm.value.chevronEngineer;
      const  backupEngineerId=this.completionSchematicForm.value.backupEngineer;

      const selectedProject = this.projects.find(p => p.value === projectId);
      const projectDesc = selectedProject ? selectedProject.label : '';

      const selectChevronEngineerName=this.planningEnginnersList.find(ce=>ce.value===chevronEngineerId)
      const chevronEngineerName=selectChevronEngineerName ? selectChevronEngineerName.label :'';
  
      const selectBackupEngineerName=this.planningEnginnersList.find(ce=>ce.value===backupEngineerId)
      const backupEngineerName=selectBackupEngineerName ? selectBackupEngineerName.label :'';

      const payload = {
        ...this.completionSchematicForm.value,
        projectId: projectId, 
        project: projectDesc,
        chevronEngineer:chevronEngineerName,
        chevronEngineerId:chevronEngineerId,
        backupEngineer:backupEngineerName,
        backupEngineerId:Number(backupEngineerId), 
      };
      
      // this.schematicService.saveSchematicSelection(payload).subscribe(
      this.completionSchematicService.saveSchematicHeaders(payload).subscribe(
        {
          next: (response) => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Schematic Selection Created Successfully' });
            // console.log('Completion schematic created successfully!', response);
            const id = response.schematicsID;
          // after successfull creation of schematic inserting record in well feature on the basis of selected well type and entred no of zone 
           this.saveWellFeature(id,this.completionSchematicForm.getRawValue().wellTypeId,this.completionSchematicForm.getRawValue().zoneCount);
            //Create completions well
            const payload = {
              id: 0,
              wellName: response.wellName,
              //appId: 1,
              functionId: 2,
              schematicId: id
            };
            this.schematicSubscription = this.completionSchematicService.upsertWells(payload).subscribe({
              next: (wellResponse: Wells) => {
                //console.log(wellResponse)

                //Update wellid in completionSchematicHeader
                this.schematicSubscription =this.completionSchematicService.updateWellId(id, wellResponse.id)
                  .subscribe({
                    next: (res) => { /*console.log(res)*/ },
                    error: (error) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: error }); }
                  });

                //create completions well applications
                this.createWellApplications(4, wellResponse.id);
                this.completionSchematicService.setSelectedView(2);
                response.wellId = wellResponse.id;
                this.completionSchematicService.getSelectedSchematic(id) 
                this.commonService.setSelectedSchemanticData(response);
              },
              error: (wellError) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: wellError });
                // console.error('Error upserting well', wellError);
              }
            });

            this.router.navigateByUrl(`${routeLinks.schematicDetail}/${id}`);
          },

          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error });
            // console.error('Error creating completion schematic', error);
          }
        }
      );
    }
    // this.createdView=2;
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

  cancelSchematic() {
    this.onClose.emit();
    this.completionSchematicForm.reset();
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
    const zoneCountControl = this.completionSchematicForm.get('zoneCount');

    if (event.value === 1) {
      zoneCountControl?.enable();
      this.completionSchematicForm.patchValue({ zoneCount: 2 }); // zone count set 2 when we will have well type as single zone multi trip  and user can increares or decrease zone count
    } else {
      zoneCountControl?.disable();
      this.completionSchematicForm.patchValue({ zoneCount: 1 }); // for rest of the well type zone count always be 1 and disable
    }
  }

  /**
   * inserting record in well feature
   * @param schematicId 
   * @param completionDesignId 
   * @param noOfzones 
   */
saveWellFeature(schematicId:number,completionDesignId:number,noOfzones:number){
    const wellFeaturesPayload = {
        wellFeaturesId: 0,
        schematicsId: schematicId,
        userIdCreatedBy: this.userDetail.uid,
        noOfZones: noOfzones,
        completionDesignId: completionDesignId,
        copyZone: true
  };
  
    this.schematicSubscription = this.completionSchematicService.saveOrUpdateWellFeatures(wellFeaturesPayload).subscribe(
    {
      next: () => {
      
      },
      error: (error) => {
        console.error('Error adding well features', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error["errors"] });
      }
    }
  );
}

}
