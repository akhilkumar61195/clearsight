import { Component, EventEmitter, Input, OnInit, Output,HostListener, OnDestroy  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { WellFeatures } from '../../../common/model/wellfeatures';
import { AuthService } from '../../../services';
import { LookupsService } from '../../../services/lookups.service';
import { CompletionDesign } from '../../../common/model/completion-design';
import { SchematicAssemblyDto } from '../../../common/model/schematic-assembly-dto';
import { SchematicDetailDto, SchematicsRequest } from '../../../common/model/schematic-detail-dto';
import { CommonService } from '../../../services/common.service';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { AssemblyBuilderService } from '../services/assembly-builder.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ConfirmationDialogComponent } from '../../common/confirmation-dialog/confirmation-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-well-features-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS,ConfirmationDialogComponent],
  templateUrl: './well-features-dialog.component.html',
  styleUrls: ['./well-features-dialog.component.scss'],
  providers: [ConfirmationService],
})
export class WellFeaturesDialogComponent implements OnInit , OnDestroy {
  @Input() schematicId!: number; // Input to accept schematicsID
  @Input() displayWellFeaturesDialog: boolean = false; // Controls dialog visibility
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<void>();
  @Input()statusId! :number;
  @Input() isEditAllowed: boolean = false; // To get the user access for edit the form
  dialogWidth: string = '40vw';
  wellFeaturesForm!: FormGroup; // Form Group for the dialog form
  oldSelectedDesignVariable:number= 1; // Selected radio button value
  selectedDesignVariable:number= 1; // Selected radio button value
  completionDesigns: CompletionDesign[] = []; // Array to hold completion designs
  isEdit: boolean = false;
  userDetail: any;
  originalFormValues: any;
  vitrunLengthVisible: boolean = true;
  psasealEngagementVisible: boolean = true;
  threeWayAdapterAdjustmentFactorVisible: boolean = true;
  productionSealAdjustmentFactorVisible: boolean = true;
  pisshiftingToolAdjustmentFactorVisible: boolean = true;
  sumpPackerFactorVisible: boolean = true;

  tubingHangerSpaceOutLengthVisible: boolean = false;
  chemicalInjectionAssemblySetDepthVisible: boolean = false;
  productionSealLocatorSpaceOutFactorVisible: boolean = false;
  productionPackerSetDepthVisible: boolean = false;
  snapLatchSpaceOutFactorVisible: boolean = false;
  productionScreenOverlapVisible: boolean = false;
  washdownAssemblySpaceOutFactorVisible: boolean = false;

  lSOTJMeteringModuleFactorVisible: boolean = false;
  landingNippleProfileSetDepthVisible: boolean = false;

  eSPProductionPackerSetDepthVisible: boolean = false;
  upperTeleswivelStrokeExtensionVisible: boolean = false;
  lowerTeleswivelStrokeExtensionVisible: boolean = false;
  chemicalInjectionMandrelAdjustmentFactorVisible: boolean = false;

  sealEngagementFactorVisible: boolean = false;
  oldZoneCount: number = 2;
  zoneCount: number = 2;
  copyZone: boolean = true;
  displayConfirmDialog: boolean = false;
  dialogContent: string = 'Are you Sure You Want to Continue';
  assemblyDetails: SchematicAssemblyDto[] = []; // Array to hold all assembly details
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.setDialogWidth();
  }
 private schematicSubscription: Subscription = new Subscription(); 
  designOptions = [
    { value: 1, label: 'Single-Trip Multi-Zone' },
    { value: 3, label: 'Conventional Single-Zone w/Artificial Lift (CAN System)' },
    { value: 2, label: 'Conventional Single-Zone' },
    { value: 5, label: 'Conventional Single-Zone w/Artificial Lift (Y-Check System)' },
    { value: 4, label: 'Injector' }
  ];
  constructor(
    private fb: FormBuilder, private authService: AuthService,
    private completionschematicService: CompletionschematicService,
    private messageService: MessageService,
    private lookupsService: LookupsService,
    private commonService: CommonService,
    private assemblyBuilderService: AssemblyBuilderService
  ) {
    this.setDialogWidth();
    this.userDetail = this.authService.getUserDetail();
   }

  ngOnInit(): void {
    this.initForm();   
    this.loadCompletionDesigns();
    this.schematicSubscription = this.completionschematicService.getSchematicAssemblies(this.schematicId, -1).subscribe((data: SchematicAssemblyDto[]) => {
      this.assemblyDetails = data;
    });
  }
  ngOnDestroy() {
  this.schematicSubscription.unsubscribe();
  }
  setDialogWidth() {
    const width = window.innerWidth;
    // If screen width is large, set width to 60vw, else 40vw
    this.dialogWidth = width > 1200 ? '60vw' : '40vw';
  }
  // Initialize the form
  private initForm(): void {
    this.wellFeaturesForm = this.fb.group({
      wellFeaturesId: [null],
      schematicsId: [null, Validators.required],
      rkbtoMsl: [null, [Validators.pattern('^[0-9, .-]+$')]],
      waterDepth: [null, [Validators.pattern('^[0-9, .-]+$')]],
      rkbtoMl: [null, [Validators.pattern('^[0-9,.-]+$')]],
      rkbto1834Hpwh: [null, [Validators.pattern('^[0-9, .-]+$')]],
      topofTubingHeadSpool: [null, [Validators.pattern('^[0-9, .-]+$')]],
      tol: [null, [Validators.pattern('^[0-9, .-]+$')]],
      tiebackGap: [null, [Validators.pattern('^[0-9, .-]+$')]],
      cflex: [null, [Validators.pattern('^[A-Za-z0-9- ]+$')]],
      safetyValveSetDepth: [null, [Validators.pattern('^[0-9, .-]+$')]],
      sumpPackerTop: [null, [Validators.pattern('^[0-9, .-]+$')]],
      sumpPackerMuleShoeEoa: [null, [Validators.pattern('^[0-9, .-]+$')]],
      bridgePlugGatekeeperTop: [null, [Validators.pattern('^[0-9, .-]+$')]],
      endofLiner: [null, [Validators.pattern('^[0-9, .-]+$')]],
      ratholeLength: [null, [Validators.pattern('^[0-9, .-]+$')]],
      ratholeLengthLcinstalled: [null, [Validators.pattern('^[0-9, .-]+$')]],
      noOfZones: [2, [Validators.pattern('^[0-9, .-]+$')]],
      vitrunLength: [null, [Validators.pattern('^[0-9, .-]+$')]],
      psasealEngagement: [null, [Validators.pattern('^[0-9, .-]+$')]],
      threeWayXoadjustmentFactor: [null, [Validators.pattern('^[0-9, .-]+$')]],
      productionSealAdjustmentFactor: [null, [Validators.pattern('^[0-9, -.]+$')]],
      pisshiftingToolAdjustmentFactor: [null, [Validators.pattern('^[0-9, .-]+$')]],
      sumpPackerFactor: [null, [Validators.pattern('^[0-9, .-]+$')]],
      tubingHangerSpaceOutLength: [null, [Validators.pattern('^[0-9, .-]+$')]],
      chemicalInjectionAssemblySetDepth: [null, [Validators.pattern('^[0-9, .-]+$')]],
      productionSealLocatorSpaceOutFactor: [null, [Validators.pattern('^[0-9, .-]+$')]],
      productionPackerSetDepth: [null, [Validators.pattern('^[0-9, .-]+$')]],
      threeWayAdapterAdjustmentFactor: [null, [Validators.pattern('^[0-9, .-]+$')]],
      snapLatchSpaceOutFactor: [null, [Validators.pattern('^[0-9, .-]+$')]],
      productionScreenOverlap: [null, [Validators.pattern('^[0-9, .-]+$')]],
      washdownAssemblySpaceOutFactor: [null, [Validators.pattern('^[0-9, .-]+$')]],
      lsotjmeteringModuleFactor: [null, [Validators.pattern('^[0-9, .-]+$')]],
      landingNippleProfileSetDepth: [null, [Validators.pattern('^[0-9, .-]+$')]],
      espproductionPackerSetDepth: [null, [Validators.pattern('^[0-9, .-]+$')]],
      upperTeleswivelStrokeExtension: [null, [Validators.pattern('^[0-9, .-]+$')]],
      lowerTeleswivelStrokeExtension: [null, [Validators.pattern('^[0-9, .-]+$')]],
      chemicalInjectionMandrelAdjustmentFactor: [null, [Validators.pattern('^[0-9, .-]+$')]],
      sealEngagementFactor: [null, [Validators.pattern('^[0-9, .-]+$')]],
    });
  }

  loadCompletionDesigns() {
    this.schematicSubscription = this.lookupsService.getCompletionDesigns().subscribe({
      next: (data) => {
        // console.log(data);
        this.completionDesigns = data;
      },
      error: (err) => {
        console.error('Error fetching completion designs', err);
      },
    });
  }

  // Load existing well features for editing
  loadWellFeatures(): void {
    if (!this.schematicId) return;
    this.schematicSubscription = this.completionschematicService.getWellFeaturesBySchematicId(this.schematicId).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.isEdit = true;
          this.oldZoneCount = data[0].noOfZones;
          this.zoneCount = data[0].noOfZones;
          this.oldSelectedDesignVariable = data[0].completionDesignId;
          this.selectedDesignVariable = data[0].completionDesignId;
          this.wellFeaturesForm.patchValue(data[0]);
          this.originalFormValues = { ...this.wellFeaturesForm.value };
          this.copyZone = (data[0].copyZone == null || data[0].copyZone === undefined) ? true : data[0].copyZone;
          if(this.selectedDesignVariable == 1){
            this.wellFeaturesForm.get('noOfZones')?.enable();
          }
          else{
            this.wellFeaturesForm.get('noOfZones')?.disable();
          }
        }
        else {
          this.isEdit = false;
          this.wellFeaturesForm.controls["schematicsId"].setValue(this.schematicId);
        }
      },
      error: (err) => {
        console.error('Error fetching well features', err);
      },
    });
  }

  // Handle form submission
  saveWellFeature(): void {
    
    if (this.wellFeaturesForm.invalid) return;
    const transformedValues = this.transformFormValuesToModel(this.wellFeaturesForm.value);
    const formData: WellFeatures = transformedValues;
    if (this.isEdit) {
      formData.userIdModifiedBy = this.userDetail.uid;
      formData.dateLastModified = new Date();
    }
    else {
      formData.userIdCreatedBy = this.userDetail.uid;
      formData.dateCreated = new Date();
      formData.userIdModifiedBy = this.userDetail.uid;
      formData.dateLastModified = new Date();
    }
    if(formData.noOfZones == null || formData.noOfZones == undefined || isNaN(formData.noOfZones)){
      formData.noOfZones = Number(this.zoneCount);
    }
    else{
      this.zoneCount = formData.noOfZones;
    }
    const currentValues = this.wellFeaturesForm.value;
    const isFormChanged = JSON.stringify(this.originalFormValues) !== JSON.stringify(currentValues);
    this.schematicSubscription = this.completionschematicService.saveOrUpdateWellFeatures(formData).subscribe((response) => {

      if(isFormChanged &&(this.statusId==2 ||this.statusId==3)){
        let payload: Completionschematicheader = {
          userIdModifiedBy: this.userDetail.uid,
          statusId: 1,
          schematicsID: this.schematicId,
          schematicsName: '',
          lease: '',
          wellName: '',
          wellLocation: '',
          chevronEngineer: '',
          chevronWBS: '',
          userIdCreatedBy: ''
        };

        
      
        this.commonService.changeStatus(payload);
      }
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Well features updated successfully' });      
    },
      (error) => {
        console.error('Error adding well features', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error["errors"] });
      });
  }

  // Close the dialog
  closeDialog(): void {
    this.wellFeaturesForm.reset(); // Reset the form
    this.onClose.emit();
  }

  transformFormValuesToModel(formValues: any): Partial<WellFeatures> {
    return {
      wellFeaturesId: Number(formValues.wellFeaturesId) || 0,
      schematicsId: Number(formValues.schematicsId),
      rkbtoMsl: Number(String(formValues.rkbtoMsl).replace(/,/g, '')),
      waterDepth: Number(String(formValues.waterDepth).replace(/,/g, '')),
      rkbtoMl: Number(String(formValues.rkbtoMl).replace(/,/g, '')),
      rkbto1834Hpwh: Number(String(formValues.rkbto1834Hpwh).replace(/,/g, '')),
      topofTubingHeadSpool: Number(String(formValues.topofTubingHeadSpool).replace(/,/g, '')),
      tol: Number(String(formValues.tol).replace(/,/g, '')),
      tiebackGap: Number(String(formValues.tiebackGap).replace(/,/g, '')),
      cflex: formValues.cflex,
      safetyValveSetDepth: Number(String(formValues.safetyValveSetDepth).replace(/,/g, '')),
      sumpPackerTop: Number(String(formValues.sumpPackerTop).replace(/,/g, '')),
      sumpPackerMuleShoeEoa: Number(String(formValues.sumpPackerMuleShoeEoa).replace(/,/g, '')),
      bridgePlugGatekeeperTop: Number(String(formValues.bridgePlugGatekeeperTop).replace(/,/g, '')),
      endofLiner: Number(String(formValues.endofLiner).replace(/,/g, '')),
      ratholeLength: Number(String(formValues.ratholeLength).replace(/,/g, '')),
      ratholeLengthLcinstalled: Number(String(formValues.ratholeLengthLcinstalled).replace(/,/g, '')),
      noOfZones: Number(String(formValues.noOfZones).replace(/,/g, '')),
      vitrunLength: Number(String(formValues.vitrunLength).replace(/,/g, '')),
      psasealEngagement: Number(String(formValues.psasealEngagement).replace(/,/g, '')),
      threeWayXoadjustmentFactor: Number(String(formValues.threeWayXoadjustmentFactor).replace(/,/g, '')),
      productionSealAdjustmentFactor: Number(String(formValues.productionSealAdjustmentFactor).replace(/,/g, '')),
      pisshiftingToolAdjustmentFactor: Number(String(formValues.pisshiftingToolAdjustmentFactor).replace(/,/g, '')),
      sumpPackerFactor: Number(String(formValues.sumpPackerFactor).replace(/,/g, '')),
      tubingHangerSpaceOutLength: Number(String(formValues.tubingHangerSpaceOutLength).replace(/,/g, '')),
      chemicalInjectionAssemblySetDepth: Number(String(formValues.chemicalInjectionAssemblySetDepth).replace(/,/g, '')),
      productionSealLocatorSpaceOutFactor: Number(String(formValues.productionSealLocatorSpaceOutFactor).replace(/,/g, '')),
      productionPackerSetDepth: Number(String(formValues.productionPackerSetDepth).replace(/,/g, '')),
      threeWayAdapterAdjustmentFactor: Number(String(formValues.threeWayAdapterAdjustmentFactor).replace(/,/g, '')),
      snapLatchSpaceOutFactor: Number(String(formValues.snapLatchSpaceOutFactor).replace(/,/g, '')),
      productionScreenOverlap: Number(String(formValues.productionScreenOverlap).replace(/,/g, '')),
      washdownAssemblySpaceOutFactor: Number(String(formValues.washdownAssemblySpaceOutFactor).replace(/,/g, '')),
      lsotjmeteringModuleFactor: Number(String(formValues.lsotjmeteringModuleFactor).replace(/,/g, '')),
      landingNippleProfileSetDepth: Number(String(formValues.landingNippleProfileSetDepth).replace(/,/g, '')),
      espproductionPackerSetDepth: Number(String(formValues.espproductionPackerSetDepth).replace(/,/g, '')),
      upperTeleswivelStrokeExtension: Number(String(formValues.upperTeleswivelStrokeExtension).replace(/,/g, '')),
      lowerTeleswivelStrokeExtension: Number(String(formValues.lowerTeleswivelStrokeExtension).replace(/,/g, '')),
      chemicalInjectionMandrelAdjustmentFactor: Number(String(formValues.chemicalInjectionMandrelAdjustmentFactor).replace(/,/g, '')),
      sealEngagementFactor: Number(String(formValues.sealEngagementFactor).replace(/,/g, '')),
      completionDesignId:Number(this.selectedDesignVariable),
      copyZone: this.copyZone,
    };
  }

  onDesignChange(design: number) {
  this.selectedDesignVariable = design;

  // reset all visibility flags
  this.vitrunLengthVisible = false;
  this.psasealEngagementVisible = false;
  this.threeWayAdapterAdjustmentFactorVisible = false;
  this.productionSealAdjustmentFactorVisible = false;
  this.pisshiftingToolAdjustmentFactorVisible = false;
  this.sumpPackerFactorVisible = false;

  this.tubingHangerSpaceOutLengthVisible = false;
  this.chemicalInjectionAssemblySetDepthVisible = false;
  this.productionSealLocatorSpaceOutFactorVisible = false;
  this.productionPackerSetDepthVisible = false;
  this.snapLatchSpaceOutFactorVisible = false;
  this.productionScreenOverlapVisible = false;
  this.washdownAssemblySpaceOutFactorVisible = false;

  this.lSOTJMeteringModuleFactorVisible = false;
  this.landingNippleProfileSetDepthVisible = false;

  this.eSPProductionPackerSetDepthVisible = false;
  this.upperTeleswivelStrokeExtensionVisible = false;
  this.lowerTeleswivelStrokeExtensionVisible = false;
  this.chemicalInjectionMandrelAdjustmentFactorVisible = false;

  this.sealEngagementFactorVisible = false;

  // ✅ Handle No of Zones based on design selection
  const zonesControl = this.wellFeaturesForm.get('noOfZones');
  if (design === 1) { // Single-Trip Multi-Zone
    zonesControl?.enable();
    zonesControl?.patchValue(this.oldZoneCount >= 2 ? this.oldZoneCount : 2);
    this.zoneCount = this.oldZoneCount >= 2 ? this.oldZoneCount : 2;
  } else {
    zonesControl?.patchValue(1);
    zonesControl?.disable();  // ✅ avoid warning by disabling via TS
    this.zoneCount = 1;
  }

  // ✅ disable all other controls initially (so Angular tracks state correctly)
  [
    'vitrunLength',
    'psasealEngagement',
    'threeWayAdapterAdjustmentFactor',
    'productionSealAdjustmentFactor',
    'pisshiftingToolAdjustmentFactor',
    'sumpPackerFactor',
    'tubingHangerSpaceOutLength',
    'chemicalInjectionAssemblySetDepth',
    'productionSealLocatorSpaceOutFactor',
    'productionPackerSetDepth',
    'snapLatchSpaceOutFactor',
    'productionScreenOverlap',
    'washdownAssemblySpaceOutFactor',
    'lSOTJMeteringModuleFactor',
    'landingNippleProfileSetDepth',
    'eSPProductionPackerSetDepth',
    'upperTeleswivelStrokeExtension',
    'lowerTeleswivelStrokeExtension',
    'chemicalInjectionMandrelAdjustmentFactor',
    'sealEngagementFactor'
  ].forEach(ctrl => this.wellFeaturesForm.get(ctrl)?.disable());

  // enable controls + set visible flags based on design
  switch (design) {
    case 1:
      this.vitrunLengthVisible = true;
      this.psasealEngagementVisible = true;
      this.threeWayAdapterAdjustmentFactorVisible = true;
      this.productionSealAdjustmentFactorVisible = true;
      this.pisshiftingToolAdjustmentFactorVisible = true;
      this.sumpPackerFactorVisible = true;

      ['vitrunLength','psasealEngagement','threeWayAdapterAdjustmentFactor',
       'productionSealAdjustmentFactor','pisshiftingToolAdjustmentFactor','sumpPackerFactor']
        .forEach(ctrl => this.wellFeaturesForm.get(ctrl)?.enable());
      break;

    case 2:
      this.tubingHangerSpaceOutLengthVisible = true;
      this.chemicalInjectionAssemblySetDepthVisible = true;
      this.productionSealLocatorSpaceOutFactorVisible = true;
      this.productionPackerSetDepthVisible = true;
      this.threeWayAdapterAdjustmentFactorVisible = true;
      this.snapLatchSpaceOutFactorVisible = true;
      this.productionScreenOverlapVisible = true;
      this.washdownAssemblySpaceOutFactorVisible = true;

      ['tubingHangerSpaceOutLength','chemicalInjectionAssemblySetDepth',
       'productionSealLocatorSpaceOutFactor','productionPackerSetDepth',
       'threeWayAdapterAdjustmentFactor','snapLatchSpaceOutFactor',
       'productionScreenOverlap','washdownAssemblySpaceOutFactor']
        .forEach(ctrl => this.wellFeaturesForm.get(ctrl)?.enable());
      break;

    case 3:
      this.tubingHangerSpaceOutLengthVisible = true;
      this.lSOTJMeteringModuleFactorVisible = true;
      this.landingNippleProfileSetDepthVisible = true;
      this.sumpPackerFactorVisible = true;

      ['tubingHangerSpaceOutLength','lSOTJMeteringModuleFactor',
       'landingNippleProfileSetDepth','sumpPackerFactor']
        .forEach(ctrl => this.wellFeaturesForm.get(ctrl)?.enable());
      break;

    case 5:
      this.tubingHangerSpaceOutLengthVisible = true;
      this.eSPProductionPackerSetDepthVisible = true;
      this.upperTeleswivelStrokeExtensionVisible = true;
      this.lowerTeleswivelStrokeExtensionVisible = true;
      this.chemicalInjectionMandrelAdjustmentFactorVisible = true;
      this.threeWayAdapterAdjustmentFactorVisible = true;
      this.sumpPackerFactorVisible = true;

      ['tubingHangerSpaceOutLength','eSPProductionPackerSetDepth',
       'upperTeleswivelStrokeExtension','lowerTeleswivelStrokeExtension',
       'chemicalInjectionMandrelAdjustmentFactor','threeWayAdapterAdjustmentFactor','sumpPackerFactor']
        .forEach(ctrl => this.wellFeaturesForm.get(ctrl)?.enable());
      break;

    case 4:
      this.landingNippleProfileSetDepthVisible = true;
      this.snapLatchSpaceOutFactorVisible = true;
      this.sealEngagementFactorVisible = true;
      this.threeWayAdapterAdjustmentFactorVisible = true;
      this.productionPackerSetDepthVisible = true;

      ['landingNippleProfileSetDepth','snapLatchSpaceOutFactor',
       'sealEngagementFactor','threeWayAdapterAdjustmentFactor','productionPackerSetDepth']
        .forEach(ctrl => this.wellFeaturesForm.get(ctrl)?.enable());
      break;
  }
}

  // onDesignChange(design: number) {
  //   this.selectedDesignVariable = design;
  //   this.vitrunLengthVisible = false;
  //   this.psasealEngagementVisible = false;
  //   this.threeWayAdapterAdjustmentFactorVisible = false;
  //   this.productionSealAdjustmentFactorVisible = false;
  //   this.pisshiftingToolAdjustmentFactorVisible = false;
  //   this.sumpPackerFactorVisible = false;

  //   this.tubingHangerSpaceOutLengthVisible = false;
  //   this.chemicalInjectionAssemblySetDepthVisible = false;
  //   this.productionSealLocatorSpaceOutFactorVisible = false;
  //   this.productionPackerSetDepthVisible = false;
  //   this.snapLatchSpaceOutFactorVisible = false;
  //   this.productionScreenOverlapVisible = false;
  //   this.washdownAssemblySpaceOutFactorVisible = false;

  //   this.lSOTJMeteringModuleFactorVisible = false;
  //   this.landingNippleProfileSetDepthVisible = false;

  //   this.eSPProductionPackerSetDepthVisible = false;
  //   this.upperTeleswivelStrokeExtensionVisible = false;
  //   this.lowerTeleswivelStrokeExtensionVisible = false;
  //   this.chemicalInjectionMandrelAdjustmentFactorVisible = false;


  //   this.sealEngagementFactorVisible = false;

  //   // Handle No of Zones based on design selection
  //   //const zonesControl = this.wellFeaturesForm.get('noOfZones');
  //   if (design === 1) { // Single-Trip Multi-Zone
  //       //zonesControl?.enable();
  //       //zonesControl?.setValue(this.oldZoneCount);
  //       this.wellFeaturesForm.get('noOfZones')?.patchValue(this.oldZoneCount>=2?this.oldZoneCount:2);
  //       this.wellFeaturesForm.get('noOfZones')?.enable();
  //       this.zoneCount = this.oldZoneCount>=2?this.oldZoneCount:2;
  //   } else {
  //       //zonesControl?.setValue(1);
  //       //zonesControl?.disable();
  //       this.wellFeaturesForm.get('noOfZones')?.patchValue(1);
  //       this.wellFeaturesForm.get('noOfZones')?.disable();
  //       this.zoneCount = 1;
  //   }

  //   switch (design) {
  //     case 1:
  //       this.vitrunLengthVisible = true;
  //       this.psasealEngagementVisible = true;
  //       this.threeWayAdapterAdjustmentFactorVisible = true;
  //       this.productionSealAdjustmentFactorVisible = true;
  //       this.pisshiftingToolAdjustmentFactorVisible = true;
  //       this.sumpPackerFactorVisible = true;
  //       break;
  //     case 2:
  //       this.tubingHangerSpaceOutLengthVisible = true;
  //       this.chemicalInjectionAssemblySetDepthVisible = true;
  //       this.productionSealLocatorSpaceOutFactorVisible = true;
  //       this.productionPackerSetDepthVisible = true;
  //       this.threeWayAdapterAdjustmentFactorVisible = true;
  //       this.snapLatchSpaceOutFactorVisible = true;
  //       this.productionScreenOverlapVisible = true;
  //       this.washdownAssemblySpaceOutFactorVisible = true;
  //       break;
  //     case 3:
  //       this.tubingHangerSpaceOutLengthVisible = true;
  //       this.lSOTJMeteringModuleFactorVisible = true;
  //       this.landingNippleProfileSetDepthVisible = true;
  //       this.sumpPackerFactorVisible = true;
  //       break;
  //     case 5:
  //       this.tubingHangerSpaceOutLengthVisible = true;
  //       this.eSPProductionPackerSetDepthVisible = true;
  //       this.upperTeleswivelStrokeExtensionVisible = true;
  //       this.lowerTeleswivelStrokeExtensionVisible = true;
  //       this.chemicalInjectionMandrelAdjustmentFactorVisible = true;
  //       this.threeWayAdapterAdjustmentFactorVisible = true;
  //       this.sumpPackerFactorVisible = true;
  //       break;
  //     case 4:
  //       this.landingNippleProfileSetDepthVisible = true;
  //       this.snapLatchSpaceOutFactorVisible = true;
  //       this.sealEngagementFactorVisible = true;
  //       this.threeWayAdapterAdjustmentFactorVisible = true;
  //       this.productionPackerSetDepthVisible = true;
  //       break;
  //   }
  // }

  confirmSave() {
    // Check if the design variable has changed and if the old selected design variable isSTMZ and the new selected design variable is not STMZ and there is data in the assembly details
    if (this.assemblyDetails.find(assembly => assembly.zoneId >= 2) && this.oldSelectedDesignVariable == 1 && this.oldSelectedDesignVariable != this.selectedDesignVariable) {
      this.dialogContent = 'You are attempting to change the Well Type on a Schematic where there is data in the Zone 2→ N of the Intermediate and/or Lower Section. Doing so will delete all existing data in those sections. If this is your intent, click the Update button, otherwise click the Cancel button.';
    }
    else{
      this.dialogContent = 'Make sure there is no pending change in assembly builder as this action will clear off all the unsaved change in assembly builder, if any. Are you sure you want to save the changes in well Header?';
    }
    this.displayConfirmDialog = true;
  }
  //Method to save the schematic data
  saveSchematic() {
    this.displayConfirmDialog = false;    
    this.saveWellFeature();
    //this.zoneCount = this.wellFeaturesForm.value.noOfZones;
    if (this.oldZoneCount != this.zoneCount) {
      this.schematicSubscription = this.assemblyBuilderService.updateAssembliesForZoneChange(
        this.schematicId, 
        this.zoneCount,
        this.userDetail,
        this.copyZone
      ).subscribe({
        next: () => {
          this.onSave.emit();
          this.onClose.emit();
        },
        error: (error) => {
          console.error('Error updating assemblies for zone change:', error);
        }
      });
    } else {
      this.onClose.emit();
    }
  }

}
