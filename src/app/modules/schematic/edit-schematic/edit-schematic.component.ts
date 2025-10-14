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
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { LookupsService } from '../../../services/lookups.service';
import { PlanningEnginner } from '../../../common/model/planningEngineer';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-edit-schematic',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './edit-schematic.component.html',
  styleUrl: './edit-schematic.component.scss'
})
export class EditSchematicComponent implements OnDestroy {
  completionSchematicForm!: FormGroup;
  schematicsName: string = '';
  project: string = '';
  lease: string = '';
  wellName: string = '';
  wellLocation: string = '';
  chevronEngineer: string = '';
  chevronWBS: string = '';
  schematicId:number;
  @Output() onClose = new EventEmitter<void>();
  @Output() schematicUpdated = new EventEmitter<void>()
  schematic: Completionschematicheader;
  userDetail: any;
  @Input() displayEditSchematicDialog: boolean = false; // Controls dialog visibility
  visible: boolean = true;
  wellApplications: WellApplications;
  projects: any[] | undefined;
  originalFormValues: any;
  planningEnginnersList: any[] | undefined;
  completionDesigns: { label: string; value: number }[] = [];// Array to hold completion design data
  private schematicSubscription: Subscription = new Subscription();
  constructor(

    private router: Router,
    private completionSchematicService: CompletionschematicService,
    private fb: FormBuilder,
    private authService: AuthService,
    private commonService: CommonService,
    private lookupService:LookupsService,
    private messageService: MessageService) {
    this.userDetail = this.authService.getUserDetail();
  }

  ngOnInit() {
    this.completionSchematicForm = this.fb.group({
      schematicsName: ['', Validators.required],
      project: ['', Validators.required],
      projectId: [null],
      lease: [''],
      wellName: ['', Validators.required],
      wellLocation: ['', Validators.required],
      chevronEngineer: ['', Validators.required],
      chevronWBS: [''],
      backupEngineer:[''],
      completionDesignId: [null],
      noOfZones:[null],
      userIdCreatedBy: this.userDetail.uid,
      statusId:[0]
    },  
    { validators: this.validateEngineers }
  );
  this.getProjects();
  this.getPlanningEnginnersList();
  this.loadCompletionDesigns();
  }

  ngOnDestroy() {
  this.schematicSubscription.unsubscribe();
  }
  validateEngineers(form: AbstractControl) {
      const chevronEngineer = form.get('chevronEngineer')?.value;
      const backupEngineer = form.get('backupEngineer')?.value;
      if (chevronEngineer && backupEngineer && chevronEngineer === backupEngineer) {
        return { engineerMismatch: true }; // Return error if values are the same
      }
      return null; // Return null if validation passes
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

  ngOnChanges(changes: SimpleChanges) {
   
    if (changes['displayEditSchematicDialog'] && this.displayEditSchematicDialog) {
      const editedSchematicData = this.commonService.getEditedSchemanticRow();
      console.log(editedSchematicData);
     

      if (editedSchematicData) {
      this.completionSchematicForm.patchValue({
        ...editedSchematicData,
        project: editedSchematicData.projectId,
        chevronEngineer:editedSchematicData.chevronEngineerId,
        backupEngineer:editedSchematicData.backupEngineerId
       
      });
        // Conditional enabling/disabling of noOfZones (completionDesignId =1 means single trip multizone)
      const hasZones = editedSchematicData.completionDesignId === 1;
      const noOfZonesControl = this.completionSchematicForm.get('noOfZones');

      if (hasZones) {
        noOfZonesControl?.enable();
      } else {
        noOfZonesControl?.disable();
      }
      this.originalFormValues = { ...this.completionSchematicForm.value };
      }
    }
  }

  
  updateEditSchematic() { 
   
    if (this.completionSchematicForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all required fields.',
      });
      return;
    }
  
    const editedSchematicData = this.commonService.getEditedSchemanticRow();
    if (!editedSchematicData || !editedSchematicData.schematicsID) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No schematic selected for update.',
      });
      return;
    }
 
    // Extract projectId, chevronEngineerId and backupengineerId from form
    const projectId = this.completionSchematicForm.value.project;
    const chevronEngineerId=this.completionSchematicForm.value.chevronEngineer;
    const  backupEngineerId=this.completionSchematicForm.value.backupEngineer;

    // Find projectDesc, chevron engineer name and backupEngineer name based on projectId, chevronEngineerId and backupEngineerId
    const selectedProject = this.projects.find(p => p.value === projectId);
    const projectDesc = selectedProject ? selectedProject.label : '';
    
    const selectChevronEngineerName=this.planningEnginnersList.find(ce=>ce.value===chevronEngineerId)
    const chevronEngineerName=selectChevronEngineerName ? selectChevronEngineerName.label :'';

    const selectBackupEngineerName=this.planningEnginnersList.find(ce=>ce.value===backupEngineerId)
    const backupEngineerName=selectBackupEngineerName ? selectBackupEngineerName.label :'';

    // Construct correct payload
    let updatedSchematicData;
    const currentValues = this.completionSchematicForm.value;
    const isFormChanged = JSON.stringify(this.originalFormValues) !== JSON.stringify(currentValues);
  
    if(isFormChanged && (this.completionSchematicForm.value.statusId==2 ||this.completionSchematicForm.value.statusId==3)){
       updatedSchematicData = {
        ...this.completionSchematicForm.value,
        projectId: projectId,
        project: projectDesc, 
        chevronEngineer:chevronEngineerName,
        chevronEngineerId:chevronEngineerId,
        backupEngineer:backupEngineerName,
        backupEngineerId:backupEngineerId,
        schematicsId:editedSchematicData.schematicsID,
        wellId:editedSchematicData.wellId,
        statusId:1
      };
    }
    else{
       updatedSchematicData = {
        ...this.completionSchematicForm.value,
        projectId: projectId,
        project: projectDesc, 
        chevronEngineer:chevronEngineerName,
        chevronEngineerId:chevronEngineerId,
        backupEngineer:backupEngineerName,
        backupEngineerId:backupEngineerId,
        schematicsId:editedSchematicData.schematicsID,
        statusId:editedSchematicData.statusId,
        wellId:editedSchematicData.wellId,

      };
    }


    this.schematicSubscription =this.completionSchematicService.updateSchematicSelection(updatedSchematicData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Schematic updated successfully.',
        });
        // after successfull creation of schematic inserting record in well feature on the basis of selected well type and entred no of zone 
        this.updateWellFeature(editedSchematicData.wellFeaturesId,editedSchematicData.schematicsID,this.completionSchematicForm.getRawValue().completionDesignId,this.completionSchematicForm.getRawValue().noOfZones);
        this.schematicUpdated.emit();
        this.onClose.emit(); // Emit event to close the dialog
      },
      error: (err) => {
        console.error('Error updating schematic:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'An error occurred while updating the schematic.',
        });
      }
    });
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
    const zoneCountControl = this.completionSchematicForm.get('noOfZones');

    if (event.value === 1) {
      zoneCountControl?.enable();
      this.completionSchematicForm.patchValue({ noOfZones: 2 }); // zone count set 2 when we will have well type as single zone multi trip  and user can increares or decrease zone count
    } else {
      zoneCountControl?.disable();
      this.completionSchematicForm.patchValue({ noOfZones: 1 }); // for rest of the well type zone count always be 1 and disable
    }
  }

  // Method for submitting the Create SchematicForm
  // submitCompletionSchematicForm(): void {
  //   if (this.completionSchematicForm.valid) {
  //     const payload = this.completionSchematicForm.value; // Prepare the payload

  //     // this.schematicService.saveSchematicSelection(payload).subscribe(
  //     this.completionSchematicService.saveSchematicHeaders(payload).subscribe(
  //       {
  //         next: (response) => {
  //           this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Schematic Selection Created Successfully' });
  //           // console.log('Completion schematic created successfully!', response);
  //           const id = response.schematicsID;

  //           //Create completions well
  //           const payload = {
  //             id: 0,
  //             wellName: response.wellName,
  //             //appId: 1,
  //             functionId: 2,
  //             schematicId: id
  //           };
  //           this.completionSchematicService.upsertWells(payload).subscribe({
  //             next: (wellResponse: Wells) => {
  //               //console.log(wellResponse)

  //               //Update wellid in completionSchematicHeader
  //               this.completionSchematicService.updateWellId(id, wellResponse.id)
  //                 .subscribe({
  //                   next: (res) => { /*console.log(res)*/ },
  //                   error: (error) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: error }); }
  //                 });

  //               //create completions well applications
  //               this.createWellApplications(4, wellResponse.id);
  //               this.completionSchematicService.setSelectedView(2);
  //               response.wellId = wellResponse.id;
  //               this.completionSchematicService.getSelectedSchematic(id) 
  //               this.commonService.setSelectedSchemanticData(response);
  //             },
  //             error: (wellError) => {
  //               this.messageService.add({ severity: 'error', summary: 'Error', detail: wellError });
  //               // console.error('Error upserting well', wellError);
  //             }
  //           });

  //           this.router.navigateByUrl(`${routeLinks.schematicDetail}/${id}`);
  //         },

  //         error: (error) => {
  //           this.messageService.add({ severity: 'error', summary: 'Error', detail: error });
  //           // console.error('Error creating completion schematic', error);
  //         }
  //       }
  //     );
  //   }
  //   // this.createdView=2;
  // }

  // createWellApplications(appId: number, wellId: number) {

  //   this.wellApplications = {
  //     id: 0,
  //     appId: appId,
  //     userId: this.userDetail.uid,
  //     wellId: wellId,
  //   }

  //   this.completionSchematicService.createWellApplications(this.wellApplications).subscribe({
  //     next: (res) => { /*console.log(res)*/ },
  //     error: (error) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: error }); }
  //   });

  // }
  /**
   * inserting record in well feature
   * @param wellFeatureId 
   * @param schematicId 
   * @param completionDesignId 
   * @param noOfzones 
   */
  updateWellFeature(wellFeatureId:number,schematicId:number,completionDesignId:number,noOfzones:number){
    
      const wellFeaturesPayload = {
          wellFeaturesId: wellFeatureId,
          schematicsId: schematicId,
          userIdModifiedBy: this.userDetail.uid,
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
  cancelSchematic() {
    this.onClose.emit();
  }
// Inside your component


}
