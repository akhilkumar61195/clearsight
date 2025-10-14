import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, effect } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Tyr2TasksService } from '../../../services/tyr2-tasks.service';
import { Ty2Tasks } from '../../../common/model/tyr2-task.model';
import { AuthService } from '../../../services/auth.service';
import { AccessControls } from '../../../common/constant';
import { CommonService } from '../../../services/common.service';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { ConfigurationValues } from '../../../common/model/configuration-values';
import { LookupsService } from '../../../services/lookups.service';
import { ProjectsDto } from '../../../common/model/wells-dto';
import { DocumentEntityTypes } from '../../../common/enum/document-entity-types';
import { DocumentInfo } from '../../../common/model/Document/DocumentInfo';
import { UserService } from '../../../services/user.service';
import { Personas } from '../../../common/enum/user-persona.enum';
import { UserPrimaryRole } from '../../../common/model/UserInfo';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FileUploadWithButtonComponent } from '../../common/file-upload-interactive-dialog/file-upload-interactive-dialog.component';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { Subscription } from 'rxjs';
import { ListEditorBuilderService } from '../../common/builders/list-editor-builder.service';
import { Tyr2TaskStatus } from '../../../common/enum/common-enum';

@Component({
  selector: 'app-create-task-dialog',
  templateUrl: './create-task-dialog.component.html',
  styleUrl: './create-task-dialog.component.scss',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [PRIME_IMPORTS, RouterModule, FormsModule, ReactiveFormsModule, CommonModule,
  FileUploadWithButtonComponent
 ],
})
export class CreateTaskDialogComponent implements OnInit, OnChanges, OnDestroy {
  @Input() visible: boolean = false; // To receive the visibility flag from the parent
  @Input() wellOptions: any[] = []; // To receive well options from parent
  @Input() selectedWellId: number | null = null; // To receive currently selected well
  @Output() onClose = new EventEmitter<void>(); // To notify the parent to close the dialog
  @Output() onSave = new EventEmitter<any>(); // To emit saved task data
  // Subscription to manage API call subscriptions and prevent memory leaks
  private createTaskSubscription: Subscription = new Subscription();

  createTaskForm!: FormGroup;
  selectedFile: File | null = null;
  isLoading: boolean = false;
  isUpdateEditable: boolean = true;
  userDetails: any;
  supplierList: Array<ConfigurationValues> = [];
  statusList: Array<ConfigurationValues> = [];
  materialCoordinatorsList: UserPrimaryRole[] = [];
  functionId: number = 1;
  projects: ProjectsDto[] = [];

  // File upload related properties
  displayfileUploadInteractiveDialog: boolean = false;
  wellDocumentTypes: any;
  selectedView: number;
  entityType: string;
  entityId: number;
  selectedDocument: string;
  selectedEntity: string = "";
  appId: number;
  documentIds: number[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private tyr2TasksService: Tyr2TasksService,
    private messageService: MessageService,
    private authService: AuthService,
    private commonService: CommonService,
    private configurationValuesService: ConfigurationValuesService,
    private lookupService: LookupsService,
    private userService: UserService,
    private listEditorBuilderService: ListEditorBuilderService
  ) {
    effect(() => {
      this.appId = this.listEditorBuilderService.selectedApplicationId(); //getting Dynamic appId based on Application
    });

   }

  // Unsubscribe from all subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    this.createTaskSubscription.unsubscribe();
  }

  ngOnInit() {
    this.initializeForm();
    this.getUserDetails();
    this.getSupplierList(); // Fetch supplier list on initialization
    this.getStatusList(); // Fetch status list on initialization
    this.getWellsForProjects(); // Fetch wells for projects on initialization
    this.loadMaterialCoordinators(); // Fetch material coordinators list on initialization
  }

  ngOnChanges(changes: SimpleChanges) {
    // Handle changes to input properties
    if (changes['wellOptions'] && this.createTaskForm) {
      this.setDefaultWell();
    }
    if (changes['selectedWellId'] && this.createTaskForm) {
      this.setDefaultWell();
    }
  }

  // Method to get user details and check access permissions
  getUserDetails() {
    this.userDetails = this.authService.getUserDetail(); // Get user details from AuthService
    let userAccess = this.authService.isAuthorized(AccessControls.THOR_DRILLING_ACCESS);
    this.commonService.setuserAccess(userAccess);
  }

  // Method to initialize the form with default values and validators
  initializeForm() {
    this.createTaskForm = this.formBuilder.group({
      well: ['', Validators.required],
      user: ['', Validators.required],
      subDate: [new Date()],
      supplier: ['', Validators.required],
      repNoType: [''],
      batchFrom: [''],
      batchTo: [''],
      wbsFrom: [''],
      wbsTo: [''],
      slocFrom: [''],
      slocTo: [''],
      quantity: [''],
      comments: [''],
      attachDocument: ['']
    });

    // Set default well when form is initialized and well options are available
    this.setDefaultWell();
  }

  setDefaultWell() {
    // Set default to current well if available
    if (this.selectedWellId && this.wellOptions.length > 0) {
      const selectedWell = this.wellOptions.find(well => well.id === this.selectedWellId);
      if (selectedWell) {
        this.createTaskForm.patchValue({
          well: selectedWell.id
        });
      }
    } else if (this.wellOptions.length > 0) {
      this.createTaskForm.patchValue({
        well: this.wellOptions[0].id
      });
    }
  }

  /**
   * Fetches the list of Supplier from the configuration values service.
   */
  getSupplierList() {
    this.createTaskSubscription = this.configurationValuesService.getAllEntities('configvalue', 'Supplier').subscribe({
      next: (response) => {
        this.supplierList = response;
      },
      error: (error) => {
      }
    });
  }
 // Fetching the material coordinators for the dropdown
  loadMaterialCoordinators(): void {
    this.createTaskSubscription = this.userService.getUserPrimaryRole(Personas.MaterialCoordinator).subscribe({
      next: (res: UserPrimaryRole[]) => {
        this.materialCoordinatorsList = res;
      },
      error: (err) => {
        console.error('Error fetching material coordinators:', err);
      }
    });
  }

  /**
   * Fetches the list of Status from the configuration values service.
   */
  getStatusList() {
    this.createTaskSubscription = this.configurationValuesService.getAllEntities('configvalue', 'Status').subscribe({
      next: (response) => {
        this.statusList = response;
      },
      error: (error) => {
      }
    });
  }

  // Method to fetch wells for projects based on the function ID
  getWellsForProjects() {
    this.projects = [];
    const functionId = this.functionId;
    this.createTaskSubscription = this.lookupService.getWellsByProject(this.appId, functionId).subscribe(
      (data: ProjectsDto[]) => {
        this.projects = data;

        // Extract and flatten wells from all projects for dropdown
        this.wellOptions = [];
        data.forEach(project => {
          if (project.wells && project.wells.length > 0) {
            project.wells.forEach(well => {
              this.wellOptions.push({
                id: well.id,
                wellName: well.wellName
              });
            });
          }
        });

        // Set default well after options are loaded
        this.setDefaultWell();
      },
      error => {
        this.projects = []; // Clear old data to avoid stale display
        this.wellOptions = []; // Clear well options on error
      }
    );
  }

  loadWellOptions() {
    if (this.wellOptions.length === 0) {
      // Fallback sample data if no wells provided from parent
      this.wellOptions = [

      ];
    }
    this.setDefaultWell();
  }

  // Method to close the dialog
  closeDialog() {
    this.resetForm();
    this.onClose.emit();
  }

  // Method to handle dialog close
  onHide() {
    // Reset any form data or state when dialog closes
    this.resetForm();
  }

  // Method to reset the form
  resetForm() {
    this.createTaskForm.reset();
    this.selectedFile = null;
    this.isLoading = false;

    // Set default well again
    this.setDefaultWell();
  }

  // Method to handle file selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Helper method to get current user ID
  private getCurrentUserId(): number {
    // Try different possible user ID properties from userDetails
    return this.userDetails?.id || this.userDetails?.uid || this.userDetails?.userId || this.userDetails?.Id || 0;
  }

  // Method to save the task
  // Unified method to save the task, handles both save and save & create another
  saveTaskHandler(createAnother: boolean) {
    if (this.createTaskForm.valid) {
      this.isLoading = true;

      const currentUserId = this.getCurrentUserId();

    // Get the "Submitted" status from the status list  
      const submittedStatus = this.statusList.find(status => status.value === Tyr2TaskStatus.Submitted);
      const defaultStatusId = submittedStatus?.id;
      const defaultStatusName = submittedStatus?.value;
      const documentDtos: DocumentInfo[] = this.documentIds.map(id => ({ id }));
      // Prepare task data according to Ty2Tasks interface as an array
      const taskData: Partial<Ty2Tasks>[] = [{
        wellId: this.createTaskForm.value.well || 0,
        supplierId: this.createTaskForm.value.supplier || 0,
        statusId: defaultStatusId,
        lastStatusChangeDate: null,
        reportNoType: this.createTaskForm.value.repNoType || '',
        batchFrom: this.createTaskForm.value.batchFrom || '',
        batchTo: this.createTaskForm.value.batchTo || '',
        wbsfrom: this.createTaskForm.value.wbsFrom || '',
        wbsto: this.createTaskForm.value.wbsTo || '',
        slocfrom: this.createTaskForm.value.slocFrom || '',
        slocto: this.createTaskForm.value.slocTo || '',
        quantity: this.createTaskForm.value.quantity ? Number(this.createTaskForm.value.quantity) : 0,
        comments: this.createTaskForm.value.comments || '',
        dateCompleted: null,
        md: null,
        projectFrom: null,
        daysinSubmittedStatus: null,
        daysinPendingStatus: null,
        userIdCreatedBy: currentUserId,
        dateCreated: this.createTaskForm.value.subDate ? new Date(this.createTaskForm.value.subDate).toISOString() : new Date().toISOString(),
        userIdLastModifiedBy: null,
        dateLastModified: null,
        assignedTo: this.createTaskForm.value.user || 0,
        supplierName: this.supplierList.find(s => s.id === this.createTaskForm.value.supplier)?.value || '',
        statusName: defaultStatusName,
        documents: documentDtos
      }];

      // Make API call to save the task
      this.createTaskSubscription = this.tyr2TasksService.addorUpdateTyrTasks(taskData as Ty2Tasks[]).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Show success message
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Task created successfully'
          });
          // Emit the saved task data to parent with success flag
          this.onSave.emit({
            success: true,
            data: response[0] || taskData[0],
            createAnother: createAnother
          });
          if (createAnother) {
            // Reset form for new task
            this.createTaskForm.reset();
            Object.keys(this.createTaskForm.controls).forEach(key => {
              this.createTaskForm.get(key)?.setErrors(null);
              this.createTaskForm.get(key)?.markAsPristine();
              this.createTaskForm.get(key)?.markAsUntouched();
            });
          } else {
            // Close the dialog
            this.closeDialog();
          }
        },
        error: (error) => {
          this.isLoading = false;
          // Show error message
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create task. Please try again.'
          });
          // Emit error event to parent
          this.onSave.emit({
            success: false,
            error: error
          });
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.createTaskForm.controls).forEach(key => {
        this.createTaskForm.get(key)?.markAsTouched();
      });
      
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields'
      });
    }
  }

  // File upload related methods
  openUploadDialogBox(documentEntityTypes: any, data?: any, selectedEntity?: any, selectedView?: any) {
    // this.selectedEntity=selectedEntity? selectedEntity:"";
    this.selectedEntity = selectedEntity || "";
    if (this.entityType !== documentEntityTypes) {
      this.selectedView = null; // Reset the selected view
    }
    this.getUserDetails();
    this.getWellDocumentTypes(documentEntityTypes, data, selectedView);
  }

  openUploadDialog() {
    // Get well document types and open the upload dialog
    this.openUploadDialogBox(DocumentEntityTypes.TYR);
  }

  getWellDocumentTypes(entityType: any, data?: any, selectedView?: any) {
    this.createTaskSubscription = this.lookupService
      .getDocumentTypes(entityType)
      .subscribe({
        next: (resp: any) => {
          if (resp) {
            this.isUpdateEditable = this.authService.isFieldEditable('uploadDocument');
            this.displayfileUploadInteractiveDialog = true;
            this.entityType = entityType;
            this.entityId = data ? data.id : (this.createTaskForm.value.well || 0);
            this.wellDocumentTypes = resp;

            if (this.selectedEntity) {
              const documents = this.wellDocumentTypes.filter(x => x.entity === this.selectedEntity)
              // this.selectedView =documents[0].id;

              this.selectedView = selectedView ?? (documents.length > 0 ? documents[0].id : null);

              this.selectedEntity = "";

            }
            else {
              this.selectedView = selectedView ?? (this.wellDocumentTypes.length > 0 ? this.wellDocumentTypes[0].id : null);
            }

            this.selectedDocument = this.wellDocumentTypes.find(x => x.id === this.selectedView)?.name;
          } else {
            this.wellDocumentTypes = [];
          }
        },
        error: () => {
          this.wellDocumentTypes = [];
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load document types'
          });
        }
      });
  }

  uploadedFileType(event: any) {
    // Handle file upload completion
    if (event === true) {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'File uploaded successfully'
      });
    }
  }

  onFileUploadClose() {
    this.selectedDocument = "";
    this.selectedView = 0;
    this.entityId = 0;
    this.entityType = "";
    this.selectedEntity = "";
    this.displayfileUploadInteractiveDialog = false;
  }

  documentIdsEmitter(event: any) {
    if (event && event.length > 0) {
      this.documentIds = event;
    }
  }
}
