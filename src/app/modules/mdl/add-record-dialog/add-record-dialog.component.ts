import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { InventoryService } from '../../../services/inventory.service';
import { MdlDataService } from '../../../services/mdl-data.service';
import { masterdatalibraryModelTable } from '../../../common/model/masterdatalibraryModelTable';
import { ComponentTypeModel } from '../../../common/model/ComponentTypeModel';
import { ConnectionConfigModel } from '../../../common/model/ConnectionConfigModel';
import { EndConnectionsModel } from '../../../common/model/EndConnectionsModel';
import { MaterialGradeModel } from '../../../common/model/MaterialGradeModel';
import { RangeModel } from '../../../common/model/RangeModel';
import { ManufacturerModel } from '../../../common/model/ManufacturerModel';
import { masterdatalibraryModel } from '../../../common/model/masterdatalibraryModel';
import { AuthService, MasterService } from '../../../services';
import { MessageService } from 'primeng/api';
import { OrganizationModel } from '../../../common/model/OrganizationModel';
import { LookupsService } from '../../../services/lookups.service';
import { Sections } from '../../../common/model/sections';
import { FormatNumberMask } from '../../../custom-pipe/decimal-masking.pipe';
import { ConnectionTypeService } from '../../../services/connection-type.service';
import { ConnectionTypeModel } from '../../../common/model/ConnectionTypeModel';
import { MaterialGroupService, MaterialGroup } from '../../../services/material-group.service';
import { MasterObjectKeys } from '../../../common/enum/master-object-keys';
import { RbwService } from '../../../services/rbw.service';
import { RbwModel } from '../../../common/model/rbw.model';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { ConfigurationValues } from '../../../common/model/configuration-values';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { LocaleTypeEnum } from '../../../common/enum/common-enum';

/**
 * Component for adding and editing records in the Material Data Library (MDL)
 * Handles form management, validation rules, and CRUD operations for material records
 */
@Component({
  selector: 'app-add-record-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './add-record-dialog.component.html',
  styleUrl: './add-record-dialog.component.scss',
  providers: [ConfirmationService],
})
export class AddRecordDialogComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false; // To receive the visibility flag from the parent
  @Input() isEdit: boolean = false; // To receive the edit flag from the parent
  @Input() originalRecord: masterdatalibraryModel = new masterdatalibraryModel();  // To store the original state
  @Output() onClose = new EventEmitter<'cancel' | 'save'>(); // To notify the parent to close the dialog
  newmdlRecord: masterdatalibraryModelTable = new masterdatalibraryModelTable();
  /** Dialog title */
  dialogTitle: any;
  /** Current user details */
  userDetail: any;
  /** Controls visibility of cancel confirmation dialog */
  cancelVisible: boolean = false;
  /** Flag to control dialog closing behavior */
  shouldClose: boolean = false;

  /** Lists and lookup data for form dropdowns */
  componentType: Array<ConfigurationValues> = [];
  connectionConfig: Array<ConfigurationValues> = []; // To get connectionConfig from ConfigValues
  connectionTypeList:Array<ConfigurationValues> =[]; // To get connectionType from ConfigValues
  endConnections: Array<ConfigurationValues> = []; // To get endConnections from ConfigValues
  materialGrade: Array<ConfigurationValues> = []; // To get materialGrade from ConfigValues
  range: Array<ConfigurationValues> = []; // To get range from ConfigValues
  supplier: Array<ConfigurationValues> = []; // Add Supplier array property. To get Supplier from ConfigValues
  manufacturer: Array<ConfigurationValues> = []; // Add Manufacturer array property. To get Manufacturer from ConfigValues
  rbwList: Array<ConfigurationValues> = []; // Add RBW array property. To get RBW from ConfigValues
  uomList: Array<ConfigurationValues> = []; // Add UOM array property. To get UOM from ConfigValues 
  groups: Array<ConfigurationValues> = []; /** Material groups for classification */

  /** Form validation flags for conditional fields */
  isBurstAndCollapesRequires: boolean = false;
  isNominalOd2Required: boolean = false;
  isActualOd2Required: boolean = false;
  isActualId2Required: boolean = false;
  isWeight2Required: boolean = false;
  isMaterialGradeId2Required: boolean = false;
  isMaterialGradeId3Required: boolean = false;
  isConnectionBurstPressure: boolean = false;
  isConnectionCollapsePressure: boolean = false;
  isconnectionYeildStrengthrequired: boolean = false;
  isMakeupLossRequired: boolean = false;
  isNominalOd3Required: boolean = false;
  isActualOd3Required: boolean = false;
  isActualId3Required: boolean = false;
  isWeight3Required: boolean = false;
  isMiddleendConnectionIdRequired: boolean = false;
  isMaxPressureRatingRequired: boolean = false;
  isAxialStrengthRequired:boolean = false;
  isDiffPressureRatingRequired: boolean = false;
  isQualityPlanDesignationRequired: boolean = false;
  isElastomersMinTempRatingRequired: boolean = false;
  isElastomersMaxTempRatingRequired: boolean = false;
  isElastomerTypeIDRequired: boolean = false;

  /** Main form group for the record */
  addRecordForm: FormGroup;

  /** Available sections for categorization */
  sections: Array<Sections> = [];
  uploadFileData=[];
  uploadedfileName:string='';
  filesList: Array<any> = [];
  entityId:number=0;
  shouldValidate: boolean = false; // Flag to control validation
  constructor(private fb: FormBuilder, private mdlDataService: MdlDataService,
     private inventoryService: InventoryService, private authService: AuthService,
      private messageService: MessageService, private lookupsService: LookupsService,
      private connectionTypeService: ConnectionTypeService,
      private masterService: MasterService,
      private materialGroupService: MaterialGroupService,
      private rbwService: RbwService,
      private configurationValuesService: ConfigurationValuesService) {
      this.initializeform(this.shouldValidate);

      }
      
      /**
       * Initializes the form with default values and validators
      */
     initializeform(shouldValidate: boolean = false) {
       if (shouldValidate) {
         this.addRecordForm = this.fb.group({
           cvxCrwId: [0],
           componentTypeID: ['', Validators.required],
           isThreadedConnection: [false],
           isContainsElastomerElements: [false],
           materialDescription: [{ value: '', disabled: true }],
           supplierId: [{ value: null, disabled: true }],
           supplierName: [null],
           manufacturerId: [null],
           tradeName: [''],
           materialNumber: ['', Validators.required],
           supplierPartNumber: ['', [Validators.pattern('^[A-Za-z0-9- ]+$')]],
           legacyRefNumber: ['', [Validators.pattern('^[A-Za-z0-9- ]+$')]],
           nominalOd1: ['', Validators.required],
           nominalOd2: [''],
           nominalOd3: [''],
           actualOd1: ['', Validators.required],
           actualOd2: [''],
           actualOd3: [''],
           actualId1: ['', Validators.required],
           actualId2: [''],
           actualId3: [''],
        drift: ['', Validators.required],
        weight1: ['', Validators.required],
        weight2: [''],
        weight3: [''],
        wallThickness: ['', Validators.required],
        rbwId: [],
        rbw: ['0'],
        materialGradeId1: [],
        materialGradeId2: [],
        materialGradeId3: [],
        rangeId: [],
        yeildStrength: ['', Validators.required],
        maxPressureRating: [''],
        axialStrength:[''],
        diffPressureRating: [''],
        burstPressure: [''],
        collapsePressure: [''],
        maxTempRating: [''],
        topendConnectionId: [],
        middleendConnectionId: [],
        bottomendConnectionId: [],
        connectionConfigId: [],
        connectionTypeId:[],
        elastomersMinTempRating: [''],
        elastomersMaxTempRating: [''],
        qualityPlanDesignation: [''],
        elastomerNotes: [''],
        standardNotes: [''],
        connectionBurstPressure: [''],
        connectionCollapsePressure: [''],
        connectionYeildStrength: [''],
        makeupLoss: [''],
        elastomerTypeID: [''],
        userIdCreatedBy: ['0'],
        dateCreated: [new Date()],
        dateLastModified: [new Date()],
        userIdModifiedBy: ['0'],
        isDeleted: ['0'],
        groupId:[],
        groupName:[''],
        materialGroup:[''],
        sectionId:[''],
        projectTags:[''],
        administrativeNotes:[''],
        uoMid:[''],
        uom:[''],
        vendorSapnumber:['']
      });
    }
    else{
      this.addRecordForm = this.fb.group({
        cvxCrwId: [0],
        componentTypeID: [''],
        isThreadedConnection: [false],
        isContainsElastomerElements: [false],
        materialDescription: [{ value: '', disabled: true }],
        supplierId: [{ value: null, disabled: true }],
        supplierName: [null],
        manufacturerId: [null],
        tradeName: [''],
        materialNumber: [''],
        supplierPartNumber: [''],
        legacyRefNumber: [''],
        nominalOd1: [''],
        nominalOd2: [''],
        nominalOd3: [''],
        actualOd1: [''],
        actualOd2: [''],
        actualOd3: [''],
        actualId1: [''],
        actualId2: [''],
        actualId3: [''],
        drift: [''],
        weight1: [''],
        weight2: [''],
        weight3: [''],
        wallThickness: [''],
        rbwId: [],
        rbw: ['0'],
        materialGradeId1: [],
        materialGradeId2: [],
        materialGradeId3: [],
        rangeId: [],
        yeildStrength: [''],
        maxPressureRating: [''],
        axialStrength:[''],
        diffPressureRating: [''],
        burstPressure: [''],
        collapsePressure: [''],
        maxTempRating: [''],
        topendConnectionId: [],
        middleendConnectionId: [],
        bottomendConnectionId: [],
        connectionConfigId: [],
        connectionTypeId:[],
        elastomersMinTempRating: [''],
        elastomersMaxTempRating: [''],
        qualityPlanDesignation: [''],
        elastomerNotes: [''],
        standardNotes: [''],
        connectionBurstPressure: [''],
        connectionCollapsePressure: [''],
        connectionYeildStrength: [''],
        makeupLoss: [''],
        elastomerTypeID: [''],
        userIdCreatedBy: ['0'],
        dateCreated: [new Date()],
        dateLastModified: [new Date()],
        userIdModifiedBy: ['0'],
        isDeleted: ['0'],
        groupId:[],
        groupName:[''],
        materialGroup:[''],
        sectionId:[''],
        projectTags:[''],
        administrativeNotes:[''],
        uoMid:[''],
        uom:[''],
        vendorSapnumber:['']
      });
    }
  }

  /**
   * Lifecycle hook that initializes component data and sets up form subscriptions
  */
  ngOnInit() {
    this.getComponentType();
    this.getConnectionConfig();
    this.getConnectionTypeList();
    this.getEndConnections();
    this.getMaterialGrade();
    this.getRange();
    this.getSupplier();
    this.getManufacturer();
    this.getSections();
    this.getGroups();
    this.getRbw();
    this.getUoM();
    this.userDetail = this.authService.getUserDetail();

    //Set up dynamic validation
    if(this.shouldValidate) {
      this.addRecordForm.get('componentTypeID').valueChanges.subscribe((componentTypeID) => {
        this.applyRules();
      });
      this.addRecordForm.get('isThreadedConnection').valueChanges.subscribe((isThreadedConnection) => {
        this.applyRules();
      });
      this.addRecordForm.get('isContainsElastomerElements').valueChanges.subscribe((isContainsElastomerElements) => {
        this.applyRules();
      });
    }
    this.addRecordForm.valueChanges.subscribe(() => {
      this.updateMaterialDescription();
    });
  }

  /**
   * Updates the material description based on form values
   * Concatenates various form fields to create a descriptive string
   */
  updateMaterialDescription() {
    const formValues = this.addRecordForm.value;
    // Get the component type from the form values
    const componentType = this.componentType.find(ct => ct.value === formValues.componentTypeID)?.value || '';

    const nominalOd1 = formValues.nominalOd1 ? `${formValues.nominalOd1}"` : '';
    const nominalOd2 = formValues.nominalOd2 ? `${formValues.nominalOd2}"` : '';
    const nominalOd3 = formValues.nominalOd3 ? `${formValues.nominalOd3}"` : '';
    
    const weight1 = formValues.weight1 ? `${formValues.weight1}#` : '';
    const weight2 = formValues.weight2 ? `${formValues.weight2}#` : '';
    const weight3 = formValues.weight3 ? `${formValues.weight3}#` : '';

    // Get Material Grade value
    const materialGrade = this.materialGrade.find(mg => mg.id === formValues.materialGradeId1)?.value || '';

    // Get End Connections values
    const topConn = this.endConnections.find(ec => ec.id === formValues.topendConnectionId)?.value || '';
    const middleConn = this.endConnections.find(ec => ec.id === formValues.middleendConnectionId)?.value || '';
    const bottomConn = this.endConnections.find(ec => ec.id === formValues.bottomendConnectionId)?.value || '';

    // Get connection configuration
    const connConfig = this.connectionConfig.find(cc => cc.id === formValues.connectionConfigId)?.value || '';
    
    const standardNotes = formValues.standardNotes || '';

    // Build the description parts
    let description = componentType;

    // Add ODs if they exist
    const odParts = [nominalOd1];
    if (nominalOd2) odParts.push(nominalOd2);
    if (nominalOd3) odParts.push(nominalOd3);
    if (odParts.length > 0) {
      description += ' - ' + odParts.join(' x ');
    }

    // Add weights if they exist
    const weightParts = [weight1];
    if (weight2) weightParts.push(weight2);
    if (weight3) weightParts.push(weight3);
    if (weightParts.some(w => w !== '')) {
      description += ' ' + weightParts.filter(w => w !== '').join(' x ');
    }

    // Add material grade
    if (materialGrade) {
      description += ' ' + materialGrade;
    }

    // Add connections if they exist
    const connParts = [topConn];
    if (middleConn) connParts.push(middleConn);
    if (bottomConn) connParts.push(bottomConn);
    if (connParts.some(c => c !== '')) {
      description += ' ' + connParts.filter(c => c !== '').join(' x ');
    }

    // Add connection configuration in parentheses
    if (connConfig) {
      description += ` (${connConfig})`;
    }

    // Add standard notes if they exist
    if (standardNotes) {
      description += ` - ${standardNotes}`;
    }

    this.addRecordForm.controls['materialDescription'].setValue(description.trim(), { emitEvent: false });
  }

  // changes top connection
  changedtopConnection(event: any) {
    this.addRecordForm.controls['bottomendConnectionId'].setValue(event.value);
  }

  /**
   * Applies validation rules based on component type and form values
   * Controls which fields are required based on business logic
   */
  applyRules() {
    const componentTypeID = this.addRecordForm.controls['componentTypeID'].value;
    const isThreadedConnection = this.addRecordForm.controls['isThreadedConnection'].value;
    const containsElastomerElement = this.addRecordForm.controls['isContainsElastomerElements'].value;

    this.addRecordForm.controls['burstPressure'].removeValidators([Validators.required]);
    this.addRecordForm.controls['collapsePressure'].removeValidators([Validators.required]);
    this.isBurstAndCollapesRequires = false;
    this.addRecordForm.controls['nominalOd2'].removeValidators([Validators.required]);
    this.isNominalOd2Required = false;
    this.addRecordForm.controls['actualOd2'].removeValidators([Validators.required]);
    this.isActualId2Required = false;
    this.addRecordForm.controls['actualId2'].removeValidators([Validators.required]);
    this.isActualOd2Required = false;
    this.addRecordForm.controls['weight2'].removeValidators([Validators.required]);
    this.isWeight2Required = false;
    this.addRecordForm.controls['materialGradeId2'].removeValidators([Validators.required]);
    this.isMaterialGradeId2Required = false;
    this.addRecordForm.controls['connectionBurstPressure'].removeValidators([Validators.required]);
    this.isConnectionBurstPressure = false;
    this.addRecordForm.controls['connectionCollapsePressure'].removeValidators([Validators.required]);
    this.isConnectionCollapsePressure = false;
    this.addRecordForm.controls['connectionYeildStrength'].removeValidators([Validators.required]);
    this.isconnectionYeildStrengthrequired = false;
    this.addRecordForm.controls['makeupLoss'].removeValidators([Validators.required]);
    this.isMakeupLossRequired = false;
    this.addRecordForm.controls['nominalOd3'].removeValidators([Validators.required]);
    this.isNominalOd3Required = false;
    this.addRecordForm.controls['actualOd3'].removeValidators([Validators.required]);
    this.isActualOd3Required = false;
    this.addRecordForm.controls['actualId3'].removeValidators([Validators.required]);
    this.isActualId3Required = false;
    this.addRecordForm.controls['weight3'].removeValidators([Validators.required]);
    this.isWeight3Required = false;
    this.addRecordForm.controls['materialGradeId3'].removeValidators([Validators.required]);
    this.isMaterialGradeId3Required = false;
    this.addRecordForm.controls['middleendConnectionId'].removeValidators([Validators.required]);
    this.isMiddleendConnectionIdRequired = false;
    this.addRecordForm.controls['maxPressureRating'].removeValidators([Validators.required]);
    this.isMaxPressureRatingRequired = false; 
    this.addRecordForm.controls['axialStrength'].removeValidators([Validators.required]);
    this.isAxialStrengthRequired = false;
    this.addRecordForm.controls['diffPressureRating'].removeValidators([Validators.required]);
    this.isDiffPressureRatingRequired = false;
    this.addRecordForm.controls['qualityPlanDesignation'].removeValidators([Validators.required]);
    this.isQualityPlanDesignationRequired = false;
    this.addRecordForm.controls['elastomersMinTempRating'].removeValidators([Validators.required]);
    this.isElastomersMinTempRatingRequired = false;
    this.addRecordForm.controls['elastomersMaxTempRating'].removeValidators([Validators.required]);
    this.isElastomersMaxTempRatingRequired = false;
    this.addRecordForm.controls['elastomerTypeID'].removeValidators([Validators.required]);
    this.isElastomerTypeIDRequired = false;


    const landingNipple = [18, 20, 24, 26, 30, 39, 53];
    if (landingNipple.includes(componentTypeID)) {
      // Add validations for specific component types
      this.isBurstAndCollapesRequires = true;
      this.addRecordForm.controls['burstPressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['collapsePressure'].addValidators([Validators.required]);
    }

    const tubingComponentTypes = [4, 6, 9, 10, 11, 12, 14, 16, 17, 19, 21, 22, 43, 44, 45, 46, 47, 48, 25, 31, 32, 34, 36, 38, 50];
    if (tubingComponentTypes.includes(componentTypeID)) {
      this.addRecordForm.controls['burstPressure'].setValidators([Validators.required]);
      this.addRecordForm.controls['collapsePressure'].setValidators([Validators.required]);
      this.isBurstAndCollapesRequires = true;
      if (isThreadedConnection == 1) {
        this.addRecordForm.controls['connectionBurstPressure'].setValidators([Validators.required]);
        this.addRecordForm.controls['connectionCollapsePressure'].setValidators([Validators.required]);
        this.addRecordForm.controls['connectionYeildStrength'].setValidators([Validators.required]);
        this.addRecordForm.controls['makeupLoss'].setValidators([Validators.required]);
        this.isConnectionBurstPressure = true;
        this.isConnectionCollapsePressure = true;
        this.isconnectionYeildStrengthrequired = true;
        this.isMakeupLossRequired = true;
      }
    }

    const pbrComponentTypes = [23, 37, 33, 40, 49, 51, 52, 2, 3];
    if (pbrComponentTypes.includes(componentTypeID)) {
      this.isNominalOd2Required = true;
      this.isActualOd2Required = true;
      this.isActualId2Required = true;
      this.isWeight2Required = true;
      this.isMaterialGradeId2Required = true;
      this.isMaterialGradeId2Required = true;
      this.isConnectionBurstPressure = true;
      this.isConnectionCollapsePressure = true;
      this.isconnectionYeildStrengthrequired = true;
      this.isMakeupLossRequired = true;
      this.addRecordForm.controls['nominalOd2'].addValidators([Validators.required]);
      this.addRecordForm.controls['actualOd2'].addValidators([Validators.required]);
      this.addRecordForm.controls['actualId2'].addValidators([Validators.required]);
      this.addRecordForm.controls['weight2'].addValidators([Validators.required]);
      this.addRecordForm.controls['materialGradeId2'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionBurstPressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionCollapsePressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionYeildStrength'].addValidators([Validators.required]);
      this.addRecordForm.controls['makeupLoss'].addValidators([Validators.required]);
    }

    const bridge = [5, 7, 8, 15, 27, 28, 29, 35, 41, 42, 13];
    if (bridge.includes(componentTypeID)) {
      this.isBurstAndCollapesRequires = true;
      this.isNominalOd2Required = true;
      this.isActualOd2Required = true;
      this.isActualOd2Required = true;
      this.isActualId2Required = true;
      this.isWeight2Required = true;
      this.isMaterialGradeId2Required = true;
      this.isConnectionBurstPressure = true;
      this.isConnectionCollapsePressure = true;
      this.isconnectionYeildStrengthrequired = true;
      this.isMakeupLossRequired = true;
      this.isMaxPressureRatingRequired = true;
      this.isAxialStrengthRequired = true;
      this.isDiffPressureRatingRequired = true;
      this.isQualityPlanDesignationRequired = true;
      this.addRecordForm.controls['nominalOd2'].addValidators([Validators.required]);
      this.addRecordForm.controls['actualOd2'].addValidators([Validators.required]);
      this.addRecordForm.controls['actualId2'].addValidators([Validators.required]);
      this.addRecordForm.controls['weight2'].addValidators([Validators.required]);
      this.addRecordForm.controls['materialGradeId2'].addValidators([Validators.required]);
      this.addRecordForm.controls['maxPressureRating'].addValidators([Validators.required]);
      this.addRecordForm.controls['axialStrength'].addValidators([Validators.required]);
      this.addRecordForm.controls['diffPressureRating'].addValidators([Validators.required]);
      this.addRecordForm.controls['burstPressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['collapsePressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['qualityPlanDesignation'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionBurstPressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionCollapsePressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionYeildStrength'].addValidators([Validators.required]);
      this.addRecordForm.controls['makeupLoss'].addValidators([Validators.required]);
    }

    if (bridge.includes(componentTypeID) && isThreadedConnection == 1) {
      this.isConnectionBurstPressure = true;
      this.isConnectionCollapsePressure = true;
      this.isconnectionYeildStrengthrequired = true;
      this.isMakeupLossRequired = true;
      this.addRecordForm.controls['connectionBurstPressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionCollapsePressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionYeildStrength'].addValidators([Validators.required]);
      this.addRecordForm.controls['makeupLoss'].addValidators([Validators.required]);
    }

    if (bridge.includes(componentTypeID) && containsElastomerElement == 1) {
      this.isElastomersMinTempRatingRequired = true;
      this.isElastomersMaxTempRatingRequired = true;
      this.isElastomerTypeIDRequired = true;
      this.addRecordForm.controls['elastomersMinTempRating'].addValidators([Validators.required]);
      this.addRecordForm.controls['elastomersMaxTempRating'].addValidators([Validators.required]);
      this.addRecordForm.controls['elastomerTypeID'].addValidators([Validators.required]);
    }

    const threeWay = [1];
    if (threeWay.includes(componentTypeID)) {
      this.isBurstAndCollapesRequires = true;
      this.isNominalOd2Required = true;
      this.isActualOd2Required = true;
      this.isActualId2Required = true;
      this.isWeight2Required = true;
      this.isMaterialGradeId2Required = true;
      this.isConnectionBurstPressure = true;
      this.isConnectionCollapsePressure = true;
      this.isconnectionYeildStrengthrequired = true;
      this.isconnectionYeildStrengthrequired = true;
      this.isMakeupLossRequired = true;
      this.isNominalOd3Required = true;
      this.isActualOd3Required = true;
      this.isActualId3Required = true;
      this.isWeight3Required = true;
      this.isMaterialGradeId3Required = true;
      this.isMiddleendConnectionIdRequired = true;
      this.addRecordForm.controls['nominalOd2'].addValidators([Validators.required]);
      this.addRecordForm.controls['nominalOd3'].addValidators([Validators.required]);
      this.addRecordForm.controls['actualOd2'].addValidators([Validators.required]);
      this.addRecordForm.controls['actualOd3'].addValidators([Validators.required]);
      this.addRecordForm.controls['actualId2'].addValidators([Validators.required]);
      this.addRecordForm.controls['actualId3'].addValidators([Validators.required]);
      this.addRecordForm.controls['weight2'].addValidators([Validators.required]);
      this.addRecordForm.controls['weight3'].addValidators([Validators.required]);
      this.addRecordForm.controls['materialGradeId2'].addValidators([Validators.required]);
      this.addRecordForm.controls['materialGradeId3'].addValidators([Validators.required]);
      this.addRecordForm.controls['middleendConnectionId'].addValidators([Validators.required]);
      this.addRecordForm.controls['burstPressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['collapsePressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionBurstPressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionCollapsePressure'].addValidators([Validators.required]);
      this.addRecordForm.controls['connectionYeildStrength'].addValidators([Validators.required]);
      this.addRecordForm.controls['makeupLoss'].addValidators([Validators.required]);
    }

    this.addRecordForm.controls['burstPressure'].updateValueAndValidity();
    this.addRecordForm.controls['collapsePressure'].updateValueAndValidity();
    this.addRecordForm.controls['nominalOd2'].updateValueAndValidity();
    this.addRecordForm.controls['actualOd2'].updateValueAndValidity();
    this.addRecordForm.controls['actualId2'].updateValueAndValidity();
    this.addRecordForm.controls['weight2'].updateValueAndValidity();
    this.addRecordForm.controls['materialGradeId2'].updateValueAndValidity();
    this.addRecordForm.controls['connectionBurstPressure'].updateValueAndValidity();
    this.addRecordForm.controls['connectionCollapsePressure'].updateValueAndValidity();
    this.addRecordForm.controls['connectionYeildStrength'].updateValueAndValidity();
    this.addRecordForm.controls['makeupLoss'].updateValueAndValidity();
    this.addRecordForm.controls['nominalOd3'].updateValueAndValidity();
    this.addRecordForm.controls['actualOd3'].updateValueAndValidity();
    this.addRecordForm.controls['actualId3'].updateValueAndValidity();
    this.addRecordForm.controls['weight3'].updateValueAndValidity();
    this.addRecordForm.controls['materialGradeId3'].updateValueAndValidity();
    this.addRecordForm.controls['middleendConnectionId'].updateValueAndValidity();
    this.addRecordForm.controls['maxPressureRating'].updateValueAndValidity();
    this.addRecordForm.controls['axialStrength'].updateValueAndValidity();
    this.addRecordForm.controls['diffPressureRating'].updateValueAndValidity();
    this.addRecordForm.controls['qualityPlanDesignation'].updateValueAndValidity();
    this.addRecordForm.controls['elastomersMinTempRating'].updateValueAndValidity();
    this.addRecordForm.controls['elastomersMaxTempRating'].updateValueAndValidity();
    this.addRecordForm.updateValueAndValidity();
  }


  onShow() {

  }

  ngOnChanges(changes) {
    
    setTimeout(() => {
      if (this.isEdit) {
        this.addRecordForm.controls['cvxCrwId'].setValue(this.originalRecord['cvxCrwId']);
        this.addRecordForm.controls['componentTypeID'].setValue(this.originalRecord['componentTypeId']);
        this.addRecordForm.controls['isThreadedConnection'].setValue(!!this.originalRecord['isThreadedConnection']);
        this.addRecordForm.controls['isContainsElastomerElements'].setValue(!!this.originalRecord['isContainsElastomerElements']);
        this.addRecordForm.controls['materialDescription'].setValue(this.originalRecord['materialDescription']);
        this.addRecordForm.controls['supplierName'].patchValue(this.originalRecord['organizationName']);
        this.addRecordForm.controls['manufacturerId'].setValue(Number(this.originalRecord['manufacturerId'] | 0));
        this.addRecordForm.controls['tradeName'].setValue(this.originalRecord['tradeName']);
        this.addRecordForm.controls['materialNumber'].setValue(this.originalRecord['materialNumber']);
        this.addRecordForm.controls['supplierPartNumber'].setValue(this.originalRecord['supplierPartNumber']);
        this.addRecordForm.controls['legacyRefNumber'].setValue(this.originalRecord['legacyRefNumber']);
        this.addRecordForm.controls['nominalOd1'].setValue(this.originalRecord['nominalOd1']?.toString());
        this.addRecordForm.controls['nominalOd2'].setValue(this.originalRecord['nominalOd2']?.toString());
        this.addRecordForm.controls['nominalOd3'].setValue(this.originalRecord['nominalOd3']?.toString());
        // this.addRecordForm.controls['actualOd1'].setValue(this.originalRecord['actualOd1']?.toString());
        this.addRecordForm.controls['actualOd1'].setValue(
          this.originalRecord['actualOd1'] ? this.originalRecord['actualOd1'].toLocaleString('en-US') : ''
        );
        this.addRecordForm.controls['actualOd2'].setValue(this.originalRecord['actualOd2']?.toString());
        this.addRecordForm.controls['actualOd3'].setValue(this.originalRecord['actualOd3']?.toString());
        this.addRecordForm.controls['actualId1'].setValue(this.originalRecord['actualId1']?.toString());
        this.addRecordForm.controls['actualId2'].setValue(this.originalRecord['actualId2']?.toString());
        this.addRecordForm.controls['actualId3'].setValue(this.originalRecord['actualId3']?.toString());
        this.addRecordForm.controls['drift'].setValue(this.originalRecord['drift']?.toString());
        this.addRecordForm.controls['weight1'].setValue(this.originalRecord['weight1']?.toString());
        this.addRecordForm.controls['weight2'].setValue(this.originalRecord['weight2']?.toString());
        this.addRecordForm.controls['weight3'].setValue(this.originalRecord['weight3']?.toString());
        this.addRecordForm.controls['wallThickness'].setValue(this.originalRecord['wallThickness']?.toString());
        this.addRecordForm.controls['rbwId'].setValue(this.originalRecord['rbwid']);
        this.addRecordForm.controls['rbw'].setValue(this.originalRecord['rbw']);
        this.addRecordForm.controls['materialGradeId1'].setValue(this.originalRecord['materialGradeId1']);
        this.addRecordForm.controls['materialGradeId2'].setValue(this.originalRecord['materialGradeId2']);
        this.addRecordForm.controls['materialGradeId3'].setValue(this.originalRecord['materialGradeId3']);
        this.addRecordForm.controls['rangeId'].setValue(this.originalRecord['rangeId']);
        this.addRecordForm.controls['yeildStrength'].setValue(this.originalRecord['yeildStrength']?.toString());
        this.addRecordForm.controls['maxPressureRating'].setValue(this.originalRecord['maxPressureRating']?.toString());
        this.addRecordForm.controls['axialStrength'].setValue(this.originalRecord['axialStrength']?.toString());
        this.addRecordForm.controls['diffPressureRating'].setValue(this.originalRecord['diffPressureRating']?.toString());
        this.addRecordForm.controls['burstPressure'].setValue(this.originalRecord['burstPressure']?.toString());
        this.addRecordForm.controls['collapsePressure'].setValue(this.originalRecord['collapsePressure']?.toString());
        this.addRecordForm.controls['maxTempRating'].setValue(this.originalRecord['maxTempRating']?.toString());
        this.addRecordForm.controls['topendConnectionId'].setValue(this.originalRecord['topendConnectionId']);
        this.addRecordForm.controls['middleendConnectionId'].setValue(this.originalRecord['middleendConnectionId']);
        this.addRecordForm.controls['bottomendConnectionId'].setValue(this.originalRecord['bottomendConnectionId']);
        this.addRecordForm.controls['connectionConfigId'].setValue(this.originalRecord['connectionConfigId']);
        this.addRecordForm.controls['connectionTypeId'].setValue(this.originalRecord['connectionTypeId']);
        this.addRecordForm.controls['elastomersMinTempRating'].setValue(this.originalRecord['elastomersMinTempRating']?.toString());
        this.addRecordForm.controls['elastomersMaxTempRating'].setValue(this.originalRecord['elastomersMaxTempRating']?.toString());
        this.addRecordForm.controls['qualityPlanDesignation'].setValue(this.originalRecord['qualityPlanDesignation']);
        this.addRecordForm.controls['elastomerNotes'].setValue(this.originalRecord['elastomerNotes']);
        this.addRecordForm.controls['standardNotes'].setValue(this.originalRecord['standardNotes']);
        this.addRecordForm.controls['connectionBurstPressure'].setValue(this.originalRecord['connectionBurstPressure']?.toString());
        this.addRecordForm.controls['connectionCollapsePressure'].setValue(this.originalRecord['connectionCollapsePressure']?.toString());
        this.addRecordForm.controls['connectionYeildStrength'].setValue(this.originalRecord['connectionYeildStrength']?.toString());
        this.addRecordForm.controls['makeupLoss'].setValue(this.originalRecord['makeupLoss']?.toString());
        this.addRecordForm.controls['elastomerTypeID'].setValue(this.originalRecord['elastomerTypeID']);
        this.addRecordForm.controls['userIdCreatedBy'].setValue(this.originalRecord['userIdCreatedBy']);
        this.addRecordForm.controls['userIdModifiedBy'].setValue(this.originalRecord['userIdModifiedBy']);
        this.addRecordForm.controls['dateCreated'].setValue(this.originalRecord['dateCreated']);
        this.addRecordForm.controls['groupId'].setValue(this.originalRecord['groupId']);
        this.addRecordForm.controls['groupName'].setValue(this.originalRecord['groupName']);
        this.addRecordForm.controls['materialGroup'].setValue(this.originalRecord['materialGroup']);
        this.addRecordForm.controls['sectionId'].setValue(this.originalRecord['sectionId']);
        this.addRecordForm.controls['projectTags'].setValue(this.originalRecord['projectTags']);
        this.addRecordForm.controls['administrativeNotes'].setValue(this.originalRecord['administrativeNotes']);

        if (this.originalRecord['organizationId'] != undefined && this.originalRecord['organizationId'] != null && this.originalRecord['organizationId'] != 0) {
          this.addRecordForm.controls['supplierId'].patchValue(this.originalRecord['organizationId']);
        }
        else {
          this.addRecordForm.controls['supplierId'].patchValue(Number(this.userDetail['organizationID']));
          //this.addRecordForm.controls['supplierId'].enable();
        }
        this.addRecordForm.controls['uoMid'].setValue(this.originalRecord['uoMid']);
        this.addRecordForm.controls['uom'].setValue(this.originalRecord['uom']);
        this.addRecordForm.controls['vendorSapnumber'].setValue(this.originalRecord['vendorSapnumber']);
        if(this.shouldValidate) {
          this.applyRules();
        }
      }
      else {
        this.addRecordForm.controls['supplierId'].patchValue(Number(this.userDetail['organizationID']));
      }
      this.addRecordForm.markAsPristine();
    });
  }


  //warning window
  okClick() {
    this.cancelVisible = false;
    this.addRecordForm.reset();
    this.onClose.emit();
  }

  // Method to close the dialog
  closeDialog() {
    if (this.addRecordForm.dirty) {
      this.cancelVisible = true;
    } else {
      this.addRecordForm.reset();
      this.onClose.emit('cancel');
    }
  }

  // Method to handle dialog close
  onHide() {
    this.resetDialog();
  }

  resetDialog() {
    this.shouldClose = false;
    this.addRecordForm.reset();
    this.onShow();
  }

  saveRecordAndClose() {
    this.shouldClose = true;
    this.saveRecord();
  }

  closeOnSaveSuccess(success: boolean) {
    if (success && this.shouldClose) {
      this.addRecordForm.reset();
      this.onClose.emit('save');
    }
  }

  // Method to save the record
  saveRecord() {
    // const invalidFields = this.validateZeroFields(this.addRecordForm);

    // if (invalidFields.length > 0) {
    //    this.messageService.add({ severity: 'error', summary: 'Error', detail: `These fields cannot be empty: ${invalidFields.join(', ')}`});
      
    //   return;
    // }
    if (this.addRecordForm.valid && this.validateNumericFields()) {
      const transformedValues = this.transformFormValuesToModel(this.addRecordForm.value);
      this.newmdlRecord = new masterdatalibraryModelTable(transformedValues);
      if (this.isEdit) {
        this.editRecord();
      } else {
        this.addRecord();
      }
    } else {
      this.addRecordForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please Select Required Fields to Proceed' });
      this.ValidateForm();
      return false;
    }
  }

  /**
   * Adds a new record to the MDL
   * Sends the new record data to the server and handles file uploads if any
   */
  addRecord() {
    this.newmdlRecord.userIdCreatedBy = this.userDetail.uid;
    this.newmdlRecord.dateCreated = new Date();
    if(this.uploadFileData.length){
      this.newmdlRecord.documentCount=1;
    }
    this.mdlDataService.addMaterial(this.newmdlRecord).subscribe((response) => {
     if(this.uploadFileData.length){
      this.entityId=response.cvxCrwId;
      this.uploadDocuments();
     }

      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Material saved successfully' });
      this.closeOnSaveSuccess(true);
    }, (error) => {
     
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
      console.error('Error saving record', error);
    });
  }

  /**
   * Edits an existing record in the MDL
   * Sends the updated record data to the server and handles file uploads if any
   */
  editRecord() {
    this.newmdlRecord.dateLastModified = new Date();
    this.newmdlRecord.userIdModifiedBy = this.userDetail.uid;
    this.newmdlRecord.userIdCreatedBy = this.userDetail.uid; // for change log
    if(this.uploadFileData.length){
      this.newmdlRecord.documentCount=this.newmdlRecord.documentCount+1;
    }
    this.mdlDataService.editMaterial(this.newmdlRecord).subscribe((response) => {
      if(this.uploadFileData.length){
        this.entityId=response.cvxCrwId;
        this.uploadDocuments();
       }
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Material saved successfully' });
      this.closeOnSaveSuccess(true);
    }, (error) => {
     
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"] });
      console.error('Error saving record', error);
    });
  }

  /**
   * Validates numeric field values in the form
   * @returns boolean indicating if all numeric fields are valid
   */
  validateNumericFields(): boolean {
    
    let status: boolean = true;
    if (this.addRecordForm.controls['nominalOd1'].value && isNaN(this.addRecordForm.controls['nominalOd1'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Nominal OD1 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['nominalOd2'].value && isNaN(this.addRecordForm.controls['nominalOd2'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Nominal OD2 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['nominalOd3'].value && isNaN(this.addRecordForm.controls['nominalOd3'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Nominal OD3 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['actualOd1'].value && isNaN(this.addRecordForm.controls['actualOd1'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Actual OD1 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['actualOd2'].value && isNaN(this.addRecordForm.controls['actualOd2'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Actual OD2 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['actualOd3'].value && isNaN(this.addRecordForm.controls['actualOd3'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Actual OD3 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['actualId1'].value && isNaN(this.addRecordForm.controls['actualId1'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Actual ID1 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['actualId2'].value && isNaN(this.addRecordForm.controls['actualId2'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Actual ID2 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['actualId3'].value && isNaN(this.addRecordForm.controls['actualId3'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Actual ID3 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['drift'].value && isNaN(this.addRecordForm.controls['drift'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Drift should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['weight1'].value && isNaN(this.addRecordForm.controls['weight1'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Weight1 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['weight2'].value && isNaN(this.addRecordForm.controls['weight2'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Weight2 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['weight3'].value && isNaN(this.addRecordForm.controls['weight3'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Weight3 should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['wallThickness'].value && isNaN(this.addRecordForm.controls['wallThickness'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Wall Thickness should be a number' });
      status = false;
    }
    if ((this.addRecordForm.controls['yeildStrength'].value) && isNaN(this.addRecordForm.controls['yeildStrength'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Yeild Strength should be a number' });
      status = false;
    }

   const maxPressureRating = this.addRecordForm.controls['maxPressureRating']?.value?.replace(',', '');
     
    if (maxPressureRating && isNaN(maxPressureRating)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Max Pressure Rating should be a number' });
      status = false;
    }

    const axialStrength = this.addRecordForm.controls['axialStrength']?.value?.replace(',', '');
     
    if (axialStrength && isNaN(axialStrength)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Axial Strength should be a number' });
      status = false;
    }
   
    const diffPressureRating = this.addRecordForm.controls['diffPressureRating']?.value?.replace(',', '');

    if (diffPressureRating && isNaN(diffPressureRating)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Diff Pressure Rating should be a number' });
      status = false;
    }
    const burstPressure= this.addRecordForm.controls['burstPressure']?.value?.replace(',', '');
    if (burstPressure && isNaN(burstPressure)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Burst Pressure should be a number' });
      status = false;
    }
    const collapsePressure= this.addRecordForm.controls['collapsePressure']?.value?.replace(',', '');
    if (collapsePressure && isNaN(collapsePressure)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Collapse Pressure should be a number' });
      status = false;

    }
    if (this.addRecordForm.controls['maxTempRating'].value && isNaN(this.addRecordForm.controls['maxTempRating'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Max Temp Rating should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['connectionBurstPressure'].value && isNaN(this.addRecordForm.controls['connectionBurstPressure'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Connection Burst Pressure should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['connectionCollapsePressure'].value && isNaN(this.addRecordForm.controls['connectionCollapsePressure'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Connection Collapse Pressure should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['connectionYeildStrength'].value && isNaN(this.addRecordForm.controls['connectionYeildStrength'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Connection Yeild Strength should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['makeupLoss'].value && isNaN(this.addRecordForm.controls['makeupLoss'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Makeup Loss should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['elastomersMinTempRating'].value && isNaN(this.addRecordForm.controls['elastomersMinTempRating'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Elastomers Min Temp Rating should be a number' });
      status = false;
    }
    if (this.addRecordForm.controls['elastomersMaxTempRating'].value && isNaN(this.addRecordForm.controls['elastomersMaxTempRating'].value)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Elastomers Max Temp Rating should be a number' });
      status = false;
    }

    return status;
  }

  /**
   * Transforms form values to model object for MDL record
   * Prepares the data structure for server communication by mapping form controls to model properties
   */
  transformFormValuesToModel(formValues: any): Partial<masterdatalibraryModelTable> {
    
    return {
      cvxCrwId: Number(formValues.cvxCrwId),
      materialNumber: formValues.materialNumber || '',
      isSupplierSpecificFlag: Number(formValues.isSupplierSpecificFlag) || 0,
      componentTypeID: Number(formValues.componentTypeID),
      materialGradeId1: Number(formValues.materialGradeId1),
      materialGradeId2: Number(formValues.materialGradeId2),
      materialGradeId3: Number(formValues.materialGradeId3),
      rangeId: Number(formValues.rangeId),
      rbwId: Number(formValues.rbwId),
      topendConnectionId: Number(formValues.topendConnectionId),
      middleendConnectionId: Number(formValues.middleendConnectionId),
      bottomendConnectionId: Number(formValues.bottomendConnectionId),
      connectionConfigId: Number(formValues.connectionConfigId),
      connectionTypeId: Number(formValues.connectionTypeId),
      materialDescription: this.addRecordForm.controls['materialDescription'].value || '',
      tradeName: formValues.tradeName || '',
      supplierPartNumber: formValues.supplierPartNumber || '',
      legacyRefNumber: formValues.legacyRefNumber || '',
      nominalOd1: Number(formValues.nominalOd1),
      nominalOd2: Number(formValues.nominalOd2),
      nominalOd3: Number(formValues.nominalOd3),
      wallThickness: Number(formValues.wallThickness),
      yeildStrength: Number(formValues.yeildStrength),
      drift: Number(formValues.drift),
      weight1: Number(formValues.weight1),
      weight2: Number(formValues.weight2),
      weight3: Number(formValues.weight3),
      actualOd1: Number(formValues.actualOd1),
      actualOd2: Number(formValues.actualOd2),
      actualOd3: Number(formValues.actualOd3),
      maxTempRating: Number(formValues.maxTempRating),
      actualId1: Number(formValues.actualId1),
      actualId2: Number(formValues.actualId2),
      actualId3: Number(formValues.actualId3),
      qualityPlanDesignation: formValues.qualityPlanDesignation || '',
      elastomersMinTempRating: Number(formValues.elastomersMinTempRating),
      elastomersMaxTempRating: Number(formValues.elastomersMaxTempRating),
      elastomerNotes: formValues.elastomerNotes || '',
      standardNotes: formValues.standardNotes || '',
      maxPressureRating: Number(formValues?.maxPressureRating?.replace(',', '')),
      axialStrength:Number(formValues?.axialStrength),
      diffPressureRating: Number(formValues?.diffPressureRating?.replace(',', '')),
      burstPressure: Number(formValues?.burstPressure?.replace(',', '')),
      collapsePressure: Number(formValues?.collapsePressure?.replace(',', '')),
      isThreadedConnection: Number(formValues.isThreadedConnection),
      isContainsElastomerElements: Number(formValues.isContainsElastomerElements),
      connectionBurstPressure: Number(formValues.connectionBurstPressure),
      connectionCollapsePressure: Number(formValues.connectionCollapsePressure),
      connectionYeildStrength: Number(formValues.connectionYeildStrength),
      makeupLoss: Number(formValues.makeupLoss),
      elastomerTypeID: Number(formValues.elastomerTypeID || '0'),
      manufacturerId: formValues.manufacturerId?.toString() || '0',
      userIdCreatedBy: formValues.userIdCreatedBy || '',
      dateCreated: formValues.dateCreated ? new Date(formValues.dateCreated) : undefined,
      dateLastModified: formValues.dateLastModified ? new Date(formValues.dateLastModified) : undefined,
      userIdModifiedBy: formValues.userIdModifiedBy || '',
      isDeleted: Number(formValues.isDeleted),
      supplierId: Number(this.addRecordForm.controls['supplierId'].value),
      groupName:formValues.groupName || '',
      groupId:Number(formValues.groupId),
      materialGroup:formValues.materialGroup || '',
      sectionId:Number(formValues.sectionId||'0'),
      projectTags: formValues.projectTags || '',
      administrativeNotes:formValues.administrativeNotes ||'',
      uoMid: Number(formValues.uoMid || '0'),
      uom: formValues.uom || '',
      vendorSapnumber: formValues.vendorSapnumber || '',
    };
  }

  /**
   * Fetches available sections from the server
   * Populates the sections dropdown in the form
   */
  getSections() {
    this.lookupsService.getSections(true).subscribe((response) => {
      this.sections = response;
    
    }, (error) => {
      console.error('Error fetching sections', error);
    });
  }
  /**
   * Fetches component types from the server
   * Populates the component type dropdown in the form
   */
  getComponentType() {
    // this.inventoryService.getComponentType().subscribe((response) => {
    //   this.componentType = response;
    // }, (error) => {
    //   console.error('Error fetching record', error);
    // });
    // Fetch component types using ConfigurationValuesService
    this.configurationValuesService.getAllEntities('configvalue','ComponentTypeMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.componentType = response;
      },
      error: (error) => {
        console.error('Error fetching component type', error);
      }
    });
  }


  /**
   * Fetches connection configurations from the server
   * Populates the connection configuration dropdown in the form
   */
  getConnectionConfig() {
    // this.inventoryService.getConnectionConfig().subscribe((response) => {
    //   this.connectionConfig = response;
    // }, (error) => {
    //   console.error('Error fetching record', error);
    // });
    // Fetch Connection Config using ConfigurationValuesService
    this.configurationValuesService.getAllEntities('configvalue','ConnectionConfigMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.connectionConfig = response;
      },
      error: (error) => {
        console.error('Error fetching connection config', error);
      }
    });
  }

  /**
   * Fetches connection types from the server
   * Populates the connection type dropdown in the form
   */
  getConnectionTypeList() {
    // this.connectionTypeService.getConnectionType().subscribe((response) => {
    //   this.connectionTypeList = response;
    // }, (error) => {
    //   console.error('Error fetching record', error);
    // });
    // Fetch Connection Type using ConfigurationValuesService
    this.configurationValuesService.getAllEntities('configvalue','ConnectionTypeMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.connectionTypeList = response;
      },
      error: (error) => {
        console.error('Error fetching connection types', error);
      }
    });
  }
  
  /**
   * Fetches end connections from the server
   * Populates the end connection dropdowns in the form
   */
  getEndConnections() {
    // this.inventoryService.getEndConnections().subscribe((response) => {
    //   this.endConnections = response;
    // }, (error) => {
    //   console.error('Error fetching record', error);
    // });
    // Fetch EndConnections using ConfigurationValuesService
    this.configurationValuesService.getAllEntities('configvalue','EndConnectionsMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.endConnections = response;
      },
      error: (error) => {
        console.error('Error fetching end connections', error);
      }
    });
  }


  /**
   * Fetches material grades from the server
   * Populates the material grade dropdowns in the form
   */
  getMaterialGrade() {
    // this.inventoryService.getMaterialGrade().subscribe((response) => {
    //   this.materialGrade = response;
    // }, (error) => {
    //   console.error('Error fetching record', error);
    // });
    // Fetch EndConnections using ConfigurationValuesService
    this.configurationValuesService.getAllEntities('configvalue','MaterialGradeMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.materialGrade = response;
      },
      error: (error) => {
        console.error('Error fetching material grade', error);
      }
    });
  }


  /**
   * Fetches ranges from the server
   * Populates the range dropdown in the form
   */
  getRange() {
    // this.inventoryService.getRange().subscribe((response) => {
    //   this.range = response;
    // }, (error) => {
    //   console.error('Error fetching record', error);
    // });
    // Fetch EndConnections using ConfigurationValuesService
    this.configurationValuesService.getAllEntities('configvalue','RangeMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.range = response;
      },
      error: (error) => {
        console.error('Error fetching range', error);
      }
    });
  }


  /**
   * Fetches suppliers from the server
   * Populates the supplier dropdown in the form
   */
  getSupplier() {
    // this.inventoryService.getSupplier().subscribe((response) => {
    //   this.supplier = response;
    // }, (error) => {
    //   console.error('Error fetching record', error);
    // });
    // Fetch Supplier using ConfigurationValues Service
    this.configurationValuesService.getAllEntities('configvalue','SupplierMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.supplier = response;
      },
      error: (error) => {
        console.error('Error fetching supplier', error);
      }
    });
  }

  /**
   * Fetches manufacturers from the server
   * Populates the manufacturer dropdown in the form
   */
  getManufacturer() {
    // this.inventoryService.getManufacturer().subscribe((response) => {
    //   this.manufacturer = response;
    // }, (error) => {
    //   console.error('Error fetching record', error);
    // });
    // Fetch Manufacturer using ConfigurationValues Service
    this.configurationValuesService.getAllEntities('configvalue','ManufacturerMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.manufacturer = response;
      },
      error: (error) => {
        console.error('Error fetching manufacturer', error);
      }
    });
  }

  /**
   * Fetches material groups from the server
   * Populates the material group dropdown in the form
   */
  getGroups() {
    // this.materialGroupService.getMaterialGroups().subscribe({
    //   next: (data) => {
    //     this.materialGroups = data;
    //   },
    //   error: (error) => {
    //     this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load material groups' });
    //   }
    // });
    // Fetch Groups using ConfigurationValues Service
    this.configurationValuesService.getAllEntities('configvalue','GroupMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.groups = response;
      },
      error: (error) => {
        console.error('Error fetching Groups', error);
      }
    });
  }
// Gets RBW values to be populated in the dropdown
  getRbw() {
    // this.rbwService.getRbw().subscribe({
    //   next: (response) => {
    //     this.rbwList = response.filter(item => item.isDeleted !== 1);
    //   },
    //   error: (error) => {
    //     console.error('Error fetching RBW list', error);
    //   }
    // });
    // Fetch RBW using ConfigurationValuesService
    this.configurationValuesService.getAllEntities('configvalue','RBWMDLCompletionsGOA').subscribe({
      next: (response) => {
        this.rbwList = response;
      },
      error: (error) => {
        console.error('Error fetching RBW list', error);
      }
    });
  }
  

  getUoM() {
    this.configurationValuesService.getAllEntities('configvalue','UoM').subscribe({
      next: (response) => {
        this.uomList = response;
      },
      error: (error) => {
        console.error('Error fetching UoM list', error);
      }
    });
  }

  /**
   * Validates the entire form
   * Checks for invalid controls and logs specific errors
   */
  ValidateForm() {

    if (this.addRecordForm.invalid) {

      // Iterate through form controls to find specific errors
      for (const controlName in this.addRecordForm.controls) {
        const control = this.addRecordForm.controls[controlName];
        if (control.invalid) { 
          this.messageService.add({ severity: 'error', summary: 'Error', detail: `Please fill out the ${controlName} field correctly: ${control.errors}` });
        }
      }
    }


  }

//   onInputChange(event: any,caseType:number): void {
    
//     // let inputValue = event.target.value;
//     // const inputElement = event.target as HTMLInputElement;
//     // const controlName = inputElement.getAttribute('formControlName');
//     // if(inputValue){
//     // // Create an instance of the pipe manually and apply formatting
//     // const formattedValue = new FormatNumberMask().transform(inputValue, caseType);
 
//     // // Set the formatted value back into the form control
//     // this.addRecordForm.controls[controlName].setValue(formattedValue, { emitEvent: false });
//     // }
 
//   }

  /**
   * Handles input change events for specific form controls
   * Formats the input value based on the type and updates the form control value
   */
onInputChange(event: any, type: string): void {
  const inputValue = event.target.value;
  const inputElement = event.target as HTMLInputElement;
  const controlName = inputElement.getAttribute('formControlName');
  const formattedValue = this.formatValue(inputValue, type);
  this.addRecordForm.controls[controlName].setValue(formattedValue, { emitEvent: false });
}

  /**
   * Formats the value for display in the input fields
   * Applies specific formatting for drift, weight, wall thickness, temperature, and pressure fields
   */
formatValue(value: any, type: string): string {
  if (value === null || value === undefined || value === '') return '';

  let formattedValue: string;

  switch (type) {
    case 'drift_od_id': // NN.NNN
      formattedValue = parseFloat(value).toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 1, maximumFractionDigits: 3 });
      break;

    case 'weight': // NNN.NN
      formattedValue = parseFloat(value).toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
      break;

    case 'wall_thickness': // N.NNN
      formattedValue = parseFloat(value).toLocaleString(LocaleTypeEnum.enUS, { minimumFractionDigits: 1, maximumFractionDigits: 3 });
      break;

    case 'temperature': // NNN
      formattedValue = Math.round(value).toLocaleString(LocaleTypeEnum.enUS, { maximumFractionDigits: 0 });
      break;

    case 'pressure': // NNN,NNN
      formattedValue = parseFloat(value).toLocaleString(LocaleTypeEnum.enUS, { maximumFractionDigits: 0 });
      break;

    default:
      formattedValue = value.toString();
  }

  return formattedValue;
}

  /**
   * Handles file selection events
   * Stores the selected files for upload
   */
  async onFileSelected(event:any){
  this.uploadFileData=event.target.files;

   
 }


   /**
    * Uploads the selected documents to the server
    * Associates uploaded documents with the MDL record
    */
   uploadDocuments() {
     
        let event=this.uploadFileData;
         let obj = {
           documentTypeId: 11,
           askHoleSection: false
         };
         if(obj.documentTypeId==12 && event[0].type!='application/pdf'){
           this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Only pdf allow for CVX PO' });
           this.uploadFileData=[];
           this.uploadedfileName='';
         }
         else{
           this.filesList.push(obj);
           let counter = 0;
           const filesLength = this.filesList.length;
       
           this.uploadedfileName='';
           const successCallback = () => {
             counter++; // update counter to trigger next document
       
             if (counter >= filesLength) {
             
               this.messageService.add({ severity: 'success', detail: "Upload files successfully!" });
              
             } else {
               sendDocument();
             }
           };
       
           const errorCallback = (error: any) => {
             //this.showSpinner = false;
             let msg = (error?.title ?? error.msg ?? error.message ?? "Failed to upload!");
             this.messageService.add({ severity: 'error', summary: 'Failed', detail: msg });
           };
       
           const sendDocument = async () => {
             let body = {
               'EntityId': this.entityId,
               'DocumentTypeId': this.filesList[counter].documentTypeId,
               'Base64Content': await this.convertFileToBase64(event[counter]),
               'ShortDescription': event[counter].name,
               'ContentType': event[counter].type,
               'Metadata':"",
               'LoggedInUserId': 0,
               'AppId':3,
               'FunctionId':2
             };
       
          
             // call API to send form data
             this.masterService.post(MasterObjectKeys.SaveCompletionDocument, body).subscribe({
               next: (resp: any) => {
                 
                 //const inputElement = this.fileInput.nativeElement;
                // inputElement.value = '';
                 this.filesList=[];
                 //this.holeSection='';
                 this.uploadFileData=[];
                 if (resp && resp.success) {
                   
                   successCallback();
                 }
                 else {
                   errorCallback(resp);
                 }
               },
               error: (error) => {
                 errorCallback(error);
               }
             });
           };
     
             sendDocument();
         }
      
   
    }
    
  // Method to convert file to base64
  // This method reads the file as a data URL and extracts the base64 content
  convertFileToBase64(file: any) {    
    if(file){
      return new Promise((resolve) => {
        let fileData: string = '';
        const reader = new FileReader();
        reader.onload = () => {
          fileData = reader.result.toString();
          fileData = ((fileData.length > 0 && fileData.indexOf(',')) ? fileData.substr(fileData.indexOf(",") + 1, fileData.length) : '');
          resolve(fileData);
        };
        reader.readAsDataURL(file);
      });
    }
  }

validateZeroFields(form: FormGroup): string[] {
  const fieldsToCheck = Object.keys(fieldLabelMap);
  const invalidLabels: string[] = [];

  for (const field of fieldsToCheck) {
    const control = form.get(field);
    
    if (control && control.value === "0" ||  control.value === "") {
      invalidLabels.push(fieldLabelMap[field]); 
    }
  }

  return invalidLabels;
}


}


const fieldLabelMap: { [key: string]: string } = {
  groupId: 'Group',
  rbwId: 'RBW',
  rangeId: 'Range',
  materialGradeId1: 'Material Grade 1',
  materialGradeId2: 'Material Grade 2',
  materialGradeId3: 'Material Grade 3',
  connectionTypeId: 'Connection Type',
  connectionConfigId: 'Connection Config',
  topendConnectionId: 'Top End Connection',
  bottomendConnectionId: 'Bottom End Connection',
  middleendConnectionId: 'Middle End Connection'
};