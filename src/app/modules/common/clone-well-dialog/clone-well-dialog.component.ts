import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LookupsService } from '../../../services/lookups.service';
import { WellTypesInfo } from '../../../common/model/wellTypes';
import { AuthService, MasterService } from '../../../services';
import { MasterObjectKeys } from '../../../common/enum/master-object-keys';
import { CommonService } from '../../../services/common.service';
import { OdinV2Service } from '../../../services/odinv2.service';
import { MessageService } from 'primeng/api';
import { NgxSpinnerService } from 'ngx-spinner';
import { WellService } from '../../../services/well.service';
import { OdinCommonService } from '../../odinv3/services/odin-common.service';
import { EditWellHeadstoreService } from '../../odinv3/services/editwellheadbuilder.service';
import { WellheadKits } from '../../../common/model/wellhead-kits';
import { WellheadkitService } from '../../../services/wellheadkit.service';
import { NOTASSIGNED } from '../../../common/constant';
import { firstValueFrom } from 'rxjs';
import { UpdateMaterialDemandRequest } from '../../../common/model/update-material-demand-request';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-clone-well-dialog',
  standalone: true,
  imports: [ConfirmationDialogComponent,...PRIME_IMPORTS, ],
  templateUrl: './clone-well-dialog.component.html',
  styleUrl: './clone-well-dialog.component.scss'
})
export class CloneWellDialogComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<void>(); // Event emitter to notify parent component when the form is saved
  @Input() displaycloneHeaderDialog: boolean = false;
  @Input() rowData: any;
  @Input()isClone:boolean=false;
  @Output() refreshGrid = new EventEmitter<void>();
  cloneWellHeadersForm!: FormGroup;
  displayConfirmationComponentDialog: boolean = false;
  materialDemandPayload: UpdateMaterialDemandRequest[]=[];
  wellName: string = '';
  p10StartDate: string = '';
  p50StartDate: string = '';
  plantCode: string = '';
  wbs: string = '';
  // wellLocation: string = '';
  //wellType: string = '';
  planningEngineer: string = '';
  rig: string = '';
  loading: boolean = false;
  wellTypes= [];
  wellTypeOptions = [];
  planningEnginnersList = [];
  planningEngineerOptions = [];
  plantList = [];
  plantOptions = [];
  projects: any[] | undefined;
  userDetail: any;
  selectedWellType: any;
  selectedplanningEngineer: any;
  selectedFunction:number=1;
  wellheadKitOptions= []; // declare this to store wellheadekitdata
  constructor(private fb: FormBuilder,
    private lookupService: LookupsService,
    private masterService: MasterService,
    private commonService: CommonService,
    private odinCommonService:OdinCommonService,
    private odinV2Service: OdinV2Service,
    private messageService: MessageService,
    private authService: AuthService,
    private spinner: NgxSpinnerService,
    private wellService:WellService,
    private store:EditWellHeadstoreService,
    private wellheadkitService:WellheadkitService
  ) {
    this.userDetail = this.authService.getUserDetail();

  }
  ngOnInit() {
    
    this.cloneWellHeadersForm = this.fb.group({
      wellName: ['', Validators.required],
      p10startDate: ['3000-01-01'],
      p50startDate: ['3000-01-01'],
      projectId:[''],
      plantCode: [''],
      wbs: [''],
      wellType: [''],
      planningEngineer: [''],
      rig: [''],
      wellTypeId: [null],
      plantId:[null],
      planningEngineerId: [null],
      appId: [1],
      functionId: [1],
      userId: [this.userDetail.uid],
      wellId: [null],
      wellheadkitId: [null],
    });
    this.getWellTypes();
    this.getPlanningEnginnersList();
    this.getProjects();
    this.getPlantCode();
   
  }
 

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
  getWellHeaderData() {


    this.wellheadKitOptions = this.store.kits().map(kitType => ({
      label: kitType.kitType,
      value: kitType.id
    }));
    if(this.isClone){
      const wellData = this.commonService.getWellHeadersData()

      const validWellType = this.wellTypeOptions.some(option => option.value === wellData.wellType) ? wellData.wellType : null;
      const validplanningEngineer = this.planningEngineerOptions.some(option => option.value === wellData.planningEngineer) ? wellData.planningEngineer : null;
      this.selectedWellType = validWellType;
      this.selectedplanningEngineer = validplanningEngineer;
      const selectedProject = this.projects?.find(p => p.value === wellData.projectId);

      this.cloneWellHeadersForm?.patchValue({
        wellName: wellData.wellName + " Clone",
        p10startDate: wellData.p50startDate ? this.formatDate(wellData.p10startDate) : null,
        p50startDate: wellData.p50startDate ? this.formatDate(wellData.p50startDate) : null,
        projectId: selectedProject ? selectedProject.value : null,
        plantCode: wellData.plantCode,
        wbs: wellData.wbs,
        wellType: wellData.wellType,
        planningEngineer: wellData.planningEngineer,
        rig: wellData.rig,
  
        wellTypeId: wellData.wellTypeId,
        planningEngineerId: wellData.planningEngineerId,
        appId: wellData.appId,
        functionId: wellData.functionId,
        userId: this.userDetail.uid,
        wellId: wellData.id,
        plantId:wellData.plantId,
        wellheadkitId:wellData.wellheadkitId
      });
      
    }
   else{
   
    this.cloneWellHeadersForm.markAsPristine();
   
   }
    
  }
  /**
  * get all well type  list
  *
  */
  getWellTypes() {
    // this.getWellHeaderData();
    this.lookupService.getWellTypes().subscribe({
      next: (resp: any) => {

        this.loading = false;
        if (resp) {

          this.wellTypes = resp;
          this.wellTypeOptions = this.wellTypes.map(wellType => ({
            label: wellType.wellTypeName,
            value: wellType.id
          }));
        }
        else {

        }
      },
      error: () => {
        this.loading = false;

      }
    });
  }

  /**
  * get all planning enginners list
  *
  */
  getPlanningEnginnersList() {
    this.lookupService
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
  * get all plant code
  *
  */
  getPlantCode() {
    this.lookupService
      .getPlantCode()
      .subscribe({
        next: (resp: any) => {
          if (resp) {
            this.plantList = resp;
            this.plantOptions = this.plantList.map(plant => ({
              label: plant.plantCode,
              value: plant.id
            }));
           
          } else {
            this.plantList = [];
          }
        },
        error: () => {
          this.plantList = [];
        },
      });
  }
  getProjects() {
    this.lookupService.getProjects().subscribe(data => {
      this.projects = data.map(resp => ({
        label: resp.projectDesc, 
        value: resp.id     
      }));
    });
  }
  submitCloneWellHeadersForm(): void {
  
    if(this.cloneWellHeadersForm.value.wellTypeId){
      this.cloneWellHeadersForm.controls['wellType'].setValue(this.wellTypes.filter(Option=>Option.id===this.cloneWellHeadersForm.value.wellTypeId)[0].wellTypeName);
  
    }
    if(this.cloneWellHeadersForm.value.planningEngineerId){
      this.cloneWellHeadersForm.controls['planningEngineer'].setValue(this.planningEnginnersList.filter(option => option.engineerId ===this.cloneWellHeadersForm.value.planningEngineerId)[0].chevronEngineer);
  
    }
    if(this.cloneWellHeadersForm.value.plantId){
      this.cloneWellHeadersForm.controls['plantCode'].setValue(this.plantList.filter(option => option.id ===this.cloneWellHeadersForm.value.plantId)[0].plantCode);
  
    }
   const payload = this.cloneWellHeadersForm.value;

    if(this.isClone){
      
      this.odinV2Service.cloneWells(payload).subscribe({
        next: (id: number) => {
         
          this.spinner.show();
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Cloned Well Headers successfully' });
          this.cloneWellHeadersForm.reset();
                    //creating payload
          this.materialDemandPayload.push({
            wellId:payload.wellId,
            userId:payload.userId,
            selectedKit:payload.wellheadkitId

            });
                     
          this.updateMaterialDemandForKit(); //calling this method to update material demand
          this.onSave.emit(); // this will emit event to parent component
          this.refreshGrid.emit();
          this.spinner.hide();
        },
        error: (error) => {
          this.cloneWellHeadersForm.reset();
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to clone Well Headers' });
          this.spinner.hide();
        }
      });
    }
 else{
  this.displayConfirmationComponentDialog=true;

 }

    }
  
  CreateNewWell(){
    this.SubmitCreateWell();
  }
  async SubmitCreateWell(){
    
    if(this.cloneWellHeadersForm.value.wellTypeId){
      this.cloneWellHeadersForm.controls['wellType'].setValue(this.wellTypes.filter(Option=>Option.id===this.cloneWellHeadersForm.value.wellTypeId)[0].wellTypeName);
  
    }
    if(this.cloneWellHeadersForm.value.planningEngineerId){
      this.cloneWellHeadersForm.controls['planningEngineer'].setValue(this.planningEnginnersList.filter(option => option.engineerId ===this.cloneWellHeadersForm.value.planningEngineerId)[0].chevronEngineer);
  
    }
    if(this.cloneWellHeadersForm.value.plantId){
      this.cloneWellHeadersForm.controls['plantCode'].setValue(this.plantList.filter(option => option.id ===this.cloneWellHeadersForm.value.plantId)[0].plantCode);
  
    }
   const payload = this.cloneWellHeadersForm.value;
    let wellPayload={
      rig:payload.rig,
      p10StartDate:payload.p10startDate? payload.p10startDate :null,
      p50StartDate: payload.p50startDate ?payload.p50startDate:null,
      planningEngineerId: payload.planningEngineerId,
      planningEngineer: payload.planningEngineer,
      wellTypeId: payload.wellTypeId,
      wellType: payload.wellType,
      plantCode: payload.plantCode,
      wellName: payload.wellName,
      userId: this.userDetail.uid,
      appId: 1,
      projectId: payload.projectId ? payload.projectId :null,
      functionId:1,
      plantId:payload.plantId? payload.plantId :null,
      wellheadkitId :payload.wellheadkitId ? payload.wellheadkitId:await this.getKitName()  // if there will be no well headkit selected in model then it will call getketname for notassigned
     }
    
      this.wellService.createWells(wellPayload).subscribe({
        next: (resp: any) => {
       
          this.spinner.show();
          this.displayConfirmationComponentDialog=false;
          this.messageService.add({ severity: 'success', summary: 'Success', detail: ' Well Cretaed successfully' });
          this.cloneWellHeadersForm.reset();
          //creating payload
          this.materialDemandPayload.push({
           wellId:resp.id,
           userId:resp.userId,
           selectedKit:resp.wellheadkitId
          });
          
          this.updateMaterialDemandForKit(); //calling this method to update material demand
          this.onSave.emit(); // this will emit event to parent component
          this.refreshGrid.emit();
          this.spinner.hide();
        },
        error: (error) => {
          // console.log(error)
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create Well' });
          this.spinner.hide();
        }
      });
  }
/**
 * if user will not selected any wellheadkit then this method will call and it will return not assigned wellheadkit id
 * @returns id for not assigned
 */
  async getKitName(): Promise<number> {
    try {
      const resp: any = await firstValueFrom(
        this.wellheadkitService.getIdByKitName(NOTASSIGNED)
      );
      return resp.result.id;
    } catch (error) {
      return 0;
    }
  }
  cancelCloneWellHeader() {
    this.cloneWellHeadersForm.reset();
    this.onClose.emit();
  }

  /**
   * this will update the material demand after cloned/edit and create record
   * @param wellId 
   * @param userId 
   * @param selectedWellheadKitId 
   */
  updateMaterialDemandForKit(){
 
    this.wellheadkitService.updateMaterialDemandForKit(this.materialDemandPayload).subscribe({
      next: (resp) => {
       
      },
      error: (error) => {
       
      }
    });
  }
}
