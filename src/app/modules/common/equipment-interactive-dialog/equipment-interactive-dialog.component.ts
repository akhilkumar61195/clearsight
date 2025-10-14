import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  ViewChild
} from '@angular/core';
import { InventoryService } from '../../../services/inventory.service';
import { MdlDataService } from '../../../services/mdl-data.service';
import { masterdatalibraryModel } from '../../../common/model/masterdatalibraryModel';
import { AuthService } from '../../../services/auth.service';
import { defaultRowNumber, openClose } from '../../../common/constant';
import { AgGridAngular } from 'ag-grid-angular';
import { RowSelectionOptions } from 'ag-grid-community';
import { GridApi } from 'ag-grid-community';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LookupKeys } from '../../../common/enum/lookup-keys';
import { MasterService } from '../../../services';
import { ThorService } from '../../../services/thor.service';
import { MaterialAttribute } from '../../../common/model/MaterialAttribute';
import { ThorDrillingMaterials } from '../../../common/model/thor-drilling-materials';
import { MessageService } from 'primeng/api';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';


@Component({
  selector: 'app-equipmwnt-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './equipment-interactive-dialog.component.html',
  styleUrl: './equipment-interactive-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})

export class EquipmentInteractiveDialogComponent implements OnInit {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  //Input and Outps for the dialog 
  filteredMaterials: Array<masterdatalibraryModel> = [];
  @Output() onClose = new EventEmitter<void>();
  @Input() displayEquipmentDialog: boolean = false; 
  @Output() equipmentDialogData = new EventEmitter<MaterialAttribute>();

  userDetail: any;
  materialRecords: any = [];
  totalRecords: number = 0;
  first: any;
  openCloseDropDownData=openClose;
  pageNumber: number = 0;

  addEquipmentForm!:FormGroup;
  materialShortDescListFiltered:any[] =[];
  addedRecords = [];
  constructor(private inventoryService: InventoryService, 
    private configurationValuesService: ConfigurationValuesService,
    private authService: AuthService,
    private fb:FormBuilder,
    private masterService: MasterService,
    private thorService:ThorService,
    private messageService: MessageService  
    
  ) {
    this.userDetail = this.authService.getUserDetail();
  }

  ngOnInit() {
    this.initializeForm();
    this.loadMaterials();
  }

  initializeForm(): void {
    this.addEquipmentForm = this.fb.group({
    
      holeSection: [''],
      hsType: [''],
      mGroup:[''],
      materialType: ['',Validators.required],
      marketUnitPrice:[null],
      materialShortDesc: ['',Validators.required],
      tier:[''],
      materialId: ['',Validators.required],
      od:[null],
      weight:[null],
      wall:[null],
      grade:[''],
      connection:[''],
      vendor:[''],
      sourservice:['No'],
      manufacturerNum:[''],
      sooner:[null],
      tenaris:[null],
      drillQuip:[null],
      openOrClosed:[''],
      leadTimeInDays:[null],
      vendorSapnumber:[''],
      uoMid:[]
    });
  }

  initializeDropdowns() {
        this.loadLookupDropdown(LookupKeys.MaterialType, 'materialTypeList');
        this.loadLookupDropdown(LookupKeys.HoleSection, 'holeSelectionList');
        this.loadLookupDropdown(LookupKeys.HSType, 'hsTypeList');
        //this.loadLookupDropdown(LookupKeys.UOM, 'uomList');
        this.loadLookupDropdown(LookupKeys.Group, 'groupList');
        this.loadLookupDropdown(LookupKeys.OD, 'odList');
        this.loadLookupDropdown(LookupKeys.Weight, 'weightList');
        this.loadLookupDropdown(LookupKeys.Grade, 'gradeList');
        this.loadLookupDropdown(LookupKeys.Connection, 'connectionList');
        this.loadLookupDropdown(LookupKeys.Vendor, 'vendorList');
        this.loadLookupDropdown(LookupKeys.sourService, 'sourList');
        this.getMaterialList();
        this.getUoM();
      }
  
  
      loadLookupDropdown(lookupKey: LookupKeys, listName: string) {
        this.masterService.getLookupValues(lookupKey).subscribe({
          next: (response: any) => {
            if (response && response.success) {
              this[listName] = response.data.map((item: any) => ({
                label: item.LOOKUPDISPLAYTEXT || item.LOOKUPTEXT || item.lookupDisplayText || item.lookupText,  // Display text
                value: item.LOOKUPTEXT || item.lookupText                             // Actual value
              }));
            }
          },
          error: () => {
            this[listName] = [];
          }
        });
      }

      /**
       * Get the list of Units of Measure (UoM)
       */
      getUoM() {
        this.configurationValuesService.getAllEntities('configvalue','UoM').subscribe({
        next: (response) => {
          this['uomList'] = response.map((item: any) => ({
                  label: item.value,  // Display text
                  value: item.id                             // Actual value
                }));
          },
          error: (error) => {
            console.error('Error fetching UoM list', error);
          }
        });
      }

      getMaterialList(query: string = ''): void {
        const request = {
          searchTerms: query,
          sortDescending: true,
          rowsPerPage: 25,
          pageNumber: 1,
        };
    
        this.inventoryService.getMaterials(request).subscribe({
          next: (response: any) => this.handleMaterialListResponse(response),
          error: () => this.handleMaterialListError(),
        });
      }

      private handleMaterialListResponse(response: any): void {
        
        this.materialShortDescListFiltered = response?.success && response?.data?.length > 0
          ? response.data.map((item: any) => ({
              label: item.materialShortDesc,  
              value: item.materialId    
            }))
          : [];
      }
  
      private handleMaterialListError(): void {
        this.totalRecords = 0;
        this.materialShortDescListFiltered = [];
      }
  
  // Optional: Example of a number formatter function
  numberFormatter(params) {
    return params.value ? params.value.toFixed(2) : '';
  }


  loadMaterials() {
    this.thorService.getMaterialAttribute().subscribe({
      next: (res: any) => {
        if (res.data.length > 0) {
          this.materialRecords = res.data;
          this.totalRecords = this.materialRecords.length;
          this.initializeDropdowns();
        }
      },
      error: (error) => {
        console.error('Error fetching materials:', error);
      }
    });
  }
  
 
  closeDialog(){
    this.onClose.emit();
  }
  addNewMaterial() {
    const formData = this.addEquipmentForm.value;  
    this.addEquipmentForm.reset();
    this.equipmentDialogData.emit(formData);
  }

 
}
