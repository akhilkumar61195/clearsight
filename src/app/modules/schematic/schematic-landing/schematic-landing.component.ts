import { Component, Input, OnDestroy, OnInit, ViewChild, effect } from '@angular/core';
import { InventoryService } from '../../../services/inventory.service';
import { MessageService } from 'primeng/api';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { Router } from '@angular/router';
import { routeLinks } from '../../../common/enum/common-enum';
import { GridApi } from 'ag-grid-community';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { Completionschematicheader } from '../../../common/model/completionschematicheader';
import { AccessControls, schematicDataChangeLogTable } from '../../../common/constant';
import { CommonService } from '../../../services/common.service';
import StorageService from '../../../services/storage.service';
import { LookupsService } from '../../../services/lookups.service';
import { Reason } from '../../../common/model/reason';
import { StatusType } from '../../../common/model/statusType';
import { CschematicService } from '../../../services/completionschematic/cschematic.service';
import { SchematicAssemblyDto } from '../../../common/model/schematic-assembly-dto';
import { SchematicDetailDto } from '../../../common/model/schematic-detail-dto';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { CreateSchematicComponent } from '../create-schematic/create-schematic.component';
import { EditSchematicComponent } from '../edit-schematic/edit-schematic.component';
import { DeleteConfirmationDialogComponent } from '../../common/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { Subscription } from 'rxjs';
import { ChangeLogComponent } from '../../common/dialog/change-log.component';
@Component({
  selector: 'app-schematic-landing',
    standalone:true,
    imports:[...PRIME_IMPORTS,
      CreateSchematicComponent,
      EditSchematicComponent,
      DeleteConfirmationDialogComponent,
      ChangeLogComponent
      ],
  templateUrl: './schematic-landing.component.html',
  styleUrl: './schematic-landing.component.scss'
})
export class SchematicLandingComponent implements OnInit , OnDestroy {
  completionSchematicForm!: FormGroup;
  loading: boolean = false;
  data: Completionschematicheader[] = [];
  filteredMaterials: Completionschematicheader[] = [];
  pagenumber: number = 1;
  pageSize: number = 500;
  isPopupVisible: boolean = false;
  rowData: any = []
  filteredRowData: any = []
  openCompletionSchematic: boolean = false;
  openChangeLog: boolean = false;
  entityName: string = schematicDataChangeLogTable;
  quickFilterText: string = '';
  parentDirectory: any = null;
  gridConfig: any = {};
  displayCreateSchematicDialog: boolean = false;
  displayEditSchematicDialog:boolean = false;
  displayDeleteComponentDialog:boolean = false;
  UserPersonaName = StorageService.getUserPermission();
  CompletionHaedersColumnDefs=[];
  selectedSchemanticRowData:any ={};
  isEditCreateSchematic: boolean = false; // To get the user access for edit the form
  // Default column configuration
  defaultColDef: ColDef = {
    sortable: true,
    filter: true
  };
  public searchText: string = '';
  private gridApi!: GridApi;
  visible: boolean = false;
  schematicId: number = 0;
  userDetail: any;
  gridOptions: GridOptions;
  reasonTypes: Reason[] = [];
  statusTypes: StatusType[] = [];
  schematicSelection: Completionschematicheader[];
  assemblies: SchematicAssemblyDto[];
  components: SchematicDetailDto[];
  private schematicSubscription : Subscription = new Subscription();
 
  constructor(
    private inventoryService: InventoryService,
    private messageService: MessageService,
    private router: Router,
    private completionSchematicService: CompletionschematicService,
    private fb: FormBuilder,
    private commonService: CommonService,
    private lookupService:LookupsService,
    private authService: AuthService,
    private schematicService:CschematicService
  ) {
    this.userDetail = this.authService.getUserDetail();

    //effect(() => {
    //  this.schematicSelection = this.schematicService.getSchematicSelection()();
    //  this.assemblies = this.schematicService.getAssemblies()();
    //  this.components = this.schematicService.getComponents()();
    //  console.log('78', this.schematicSelection)
    //  //console.log('79', this.assemblies)
    //  //console.log('80', this.components)
    //});
  }

  ngOnInit() {
    this.getUserDetails();
    this.getReasonTypes();
    this.getStatusTypes();
    
    //this.getSchematics();
    //this.getAssemblies();
    //this.getComponents();
  }
 ngOnDestroy() {
    this.schematicSubscription.unsubscribe();
  }
  getSchematics() {
    this.schematicService.setSchematics(1, 10);
  }
  getAssemblies() {
    this.schematicService.setAssemblies(1);
  }
  getComponents() {
    this.schematicService.setComponents(1);
  }

  initializeColumnDefs() {
    const isEditable = this.authService.isFieldEditable('isEditSelectedSchematic');
    
    
  //column declaration for Schematic table 
   this.CompletionHaedersColumnDefs = [
    { headerName: 'Schematic Name', field: 'schematicsName' },
    { headerName: 'Project', field: 'project' },
    { headerName: 'Lease', field: 'lease' },
    { headerName: 'Well Name', field: 'wellName' },
    { headerName: 'Well Location', field: 'wellLocation' },
    { headerName: 'Primary Engineer', field: 'chevronEngineer' },
    { headerName: 'Chevron WBS', field: 'chevronWBS' },
    { headerName: 'Reason Code', field: 'reasonId',
      valueGetter: (params) => {
        if(params.data.reasonId && this.reasonTypes.length){
          const reason = this.reasonTypes.find(status => status.id === params.data.reasonId);
          return reason ? reason.reasonCode : 'Unknown';  
        }

    }
    },
    { headerName: 'Rejection Notes', field: 'rejectionNotes'},
    {
      headerName: 'Status',
      field: 'StatusId',
      valueGetter: (params) => {
          
          const status = this.statusTypes.find(status => status.id === params.data.statusId);
          return status ? status.statusType1 : 'Unknown';  
      },
      cellStyle: (params) => {
       
          const status = this.statusTypes.find(status => status.id === params.data.statusId);
          if (status && status.statusType1 === 'Rejected') {
           
            return { color: 'white', backgroundColor: 'rgb(229, 96, 31)' };  
         
         
          }
          if (status && status.statusType1 === 'Approved') {
           
            return { color: 'black', backgroundColor: 'rgb(146, 228, 146)' };
          }
          if (status && status.statusType1 === 'Pending Approval') {
           
            return { color: 'black', backgroundColor: ' rgb(255, 255, 0)' }; 
          }
          return null;  
      }
  },
  
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: (params: any) => {
      
        return `
          <button class="btn-edit p-ripple p-element chv-light-blue-btnsm p-button p-component mr-2" title="Edit" data-action="edit" ${!isEditable ? 'disabled' : ''}>
          <i class="pi pi-pencil mr-1" data-action="edit"></i></button>
          <button class="btn-edit p-ripple p-element chv-light-blue-btnsm delete-action-icon wd-auto p-button p-component" title="Delete" data-action="delete" ${!isEditable ? 'disabled' : ''}>
          <i class="pi pi-trash" data-action="delete"></i></button>
        `;
      },
      sortable: false,
      filter: false
    },
  ];

  }
  changeLog() {
    this.openChangeLog = true;
  }

  /**
       *  it will get the user details from jwt token
       */
       getUserDetails(){
        let userAccess = this.authService.isAuthorized(AccessControls.SCHEMATIC_LANDING);
        this.commonService.setuserAccess(userAccess);
        this.isEditCreateSchematic = this.authService.isFieldEditable('isEditCreateSchematic');  
                    
      }

  //  Get the schematic table records
  getCompletionSchematicData() {
    this.schematicSubscription = this.completionSchematicService.getSchematicHeaders(this.pagenumber, this.pageSize)
      .subscribe({
        next: (res) => {
          this.getUserDetails();
         /* console.log(res)*/
          this.rowData = res;
          this.rowData.forEach(item => {
            item.personaName = this.UserPersonaName;  // Adding a new property
          });
        
          this.filteredRowData = this.rowData;
          this.initializeColumnDefs();
          this.gridConfig.loading = false;
        },
        error: (err) => {
          console.log(err);
          this.data = [];
          this.filteredMaterials = [];
          this.initializeColumnDefs();
          this.gridConfig.loading = false;
        },
        complete: () => {
          this.initializeColumnDefs();
          this.gridConfig.loading = false;
        }
      });
  }

  onRowClicked(event: any) {
    const targetElement = event.event?.target;
    if (targetElement && targetElement.dataset.action) {
      return; // Stop navigation
    }
  
    // ✅ Ensure event.data exists before accessing ID
    const id = event.data?.schematicsID;
    if (!id) {
      console.error("No schematic ID found in row data:", event.data);
      return;
    }
    this.router.navigateByUrl(`${routeLinks.schematicDetail}/${id}`);
    this.completionSchematicService.getSelectedSchematic(id)
    this.completionSchematicService.setSelectedView(1);
    this.commonService.setSelectedSchemanticData(event.data);
    //console.log(event.data)
  }

  onGridReady(params: any): void {
    this.gridApi = params.api;
    this.gridApi.addEventListener('cellClicked', (event: any) => {
      if (event.column.colId === 'actions' && event.event.target.dataset.action) {
        const action = event.event.target.dataset.action;
        const rowData = event.data;

        if (action === 'edit') {
          this.editSchematic(rowData);
      } 
      else if (action === 'delete') {
        this.deleteAssemblyDialog(rowData)
      } 
    };
    })
  }

  editSchematic(rowData: any) {
    const selectedSchemanticRowData = rowData;
    this.commonService.setEditedSchemanticRow(selectedSchemanticRowData);
    this.displayEditSchematicDialog = true;
  }

  deleteAssemblyDialog(rowData: any){
    this.selectedSchemanticRowData = rowData;
    // console.log(this.selectedSchemanticRowData);
    this.displayDeleteComponentDialog = true;
    }
  
    deleteConfirm() {
      if (!this.selectedSchemanticRowData || !this.selectedSchemanticRowData.schematicsID || !this.userDetail.uid) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid assembly data. Unable to delete.',
        });
        return;
      }
        this.schematicSubscription = this.completionSchematicService.deleteSchematic(
        this.selectedSchemanticRowData.schematicsID,
        this.userDetail.uid
      ).subscribe({
        next: (response) => {
          if (response) {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Deleted successfully.',
            });
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: 'deletion failed.',
            });
          }
          this.displayDeleteComponentDialog = false; // Close dialog after deletion
          this.getCompletionSchematicData();
        },
        error: (err) => {
          console.error('Error deleting assembly:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: 'An error occurred while deleting the assembly.',
          });
        }
      });
    }
  // approveSchematic(rowData:any){
  //   this.displayConfirmationComponentDialog = true;
  // }
  // rejectSchematic(rowData:any){
  //   this.displayDeleteComponentDialog = true;
  // }
  onSchematicUpdated(){
 this.getCompletionSchematicData();
  }
  updateWellDetails(){

  }
  
  //Global Serch for  Schematic Records
  onSearch(event: Event): void {
    const searchedSchematic = (event.target as HTMLInputElement).value.toLowerCase();
    this.quickFilterText = searchedSchematic; // Update the quick filter text
  }

  resetSearch(searchSchematic: HTMLInputElement) {
    this.quickFilterText = '';
    searchSchematic.value = ''; // Clear the input field visually
    this.filteredRowData = this.rowData;
    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      this.gridApi.onFilterChanged();
      this.gridApi.deselectAll();
    }
  }

  //open Model for create Schematic Form
  createSchematic() {
    this.displayCreateSchematicDialog = true;
    // this.visible = true;
  }

  closeCreateSchematicDialog() {
    this.displayCreateSchematicDialog = false;
  }
  closeEditSchemanticDialog() {
    this.displayEditSchematicDialog = false;
  }

  // Method for submitting the Create SchematicForm
  submitCompletionSchematicForm(): void {
    if (this.completionSchematicForm.valid) {
      const payload = this.completionSchematicForm.value; // Prepare the payload
      this.schematicSubscription =this.completionSchematicService.saveSchematicHeaders(payload).subscribe(
        {
          next: (response) => {
            // console.log('Completion schematic created successfully!', response);
            const id = response.schematicsID;
            this.router.navigateByUrl(`${routeLinks.schematicDetail}/${id}`);
          },
          error: (error) => {
            console.error('Error creating completion schematic', error);
          }
        }
      );
    }
  }

  // Method for cancelling the Create completionSchematicForm
  cancelSchematic() {
    this.displayCreateSchematicDialog = false;
  }
  getReasonTypes() {
    // this.getWellHeaderData();
    this.schematicSubscription =this.lookupService.getReasonTypes().subscribe({
      next: (resp: any) => {
        
        if (resp) {
         this.reasonTypes = resp;
          
        }
        else {

        }
      },
      error: () => {
      

      }
    });
  }
  getStatusTypes() {
    this.gridConfig.loading = true;
    this.schematicSubscription =this.lookupService.getStatusTypes().subscribe({
      next: (resp: any) => {
        
        if (resp) {
         this.statusTypes = resp;
         this.getCompletionSchematicData();
        }
        else {
          this.gridConfig.loading = false;
        }
      },
      error: () => {
        this.gridConfig.loading = false;

      }
    });
  }
}
