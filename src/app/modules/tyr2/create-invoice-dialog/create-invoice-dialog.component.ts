import { Component, OnInit, Output, EventEmitter, Input, CUSTOM_ELEMENTS_SCHEMA, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FileUploadWithButtonComponent } from '../../common/file-upload-interactive-dialog/file-upload-interactive-dialog.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WellDetails } from '../../../common/model/WellDetails';
import { ConfigurationValues } from '../../../common/model/configuration-values';
import { Tyr2InvoiceService } from '../../../services/tyr2-invoice.service';
import { Tyr2Invoice } from '../../../common/model/tyr2-invoice.model';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth.service';
import { CommonService } from '../../../services/common.service';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { LookupsService } from '../../../services/lookups.service';
import { UserService } from '../../../services/user.service';
import { WellService } from '../../../services/well.service';
import { ListEditorBuilderService } from '../../common/builders/list-editor-builder.service';
import { DocumentEntityTypes } from '../../../common/enum/document-entity-types';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ConfigValuesDropdownEnum, ConfigValuesEnum, DocumentTypeEnum } from '../../../common/enum/common-enum';
import { DocumentInfo } from '../../../common/model/Document/DocumentInfo';
import { CustomDialogComponent } from '../../common/custom-dialog/custom-dialog.component';
import { UserPrimaryRole } from '../../../common/model/UserInfo';
import { Personas } from '../../../common/enum/user-persona.enum';

@Component({
  selector: 'app-create-invoice-dialog',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [PRIME_IMPORTS, RouterModule, FormsModule, ReactiveFormsModule, CommonModule,
  FileUploadWithButtonComponent,
  CustomDialogComponent
   ],
  templateUrl: './create-invoice-dialog.component.html',
  styleUrl: './create-invoice-dialog.component.scss'
})
export class CreateInvoiceDialogComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() invoiceSaved = new EventEmitter<void>();
  @Output() invoiceCreated = new EventEmitter<void>();
  wellOptions: Array<WellDetails> = [];
  statusOptions: Array<ConfigurationValues> = [];
  supplierOptions: Array<ConfigurationValues> = [];
  projectOptions: Array<ConfigurationValues> = [];
  materialCoordinatorsList: UserPrimaryRole[] = [];
  rigOptions: Array<ConfigurationValues> = [];
  createInvoiceForm!: FormGroup;
  isLoading: boolean = false;
  functionId: number = 1;
  appId: number;
  userDetails: any;

  // File upload related properties
  displayfileUploadInteractiveDialog: boolean = false;
  wellDocumentTypes: any;
  selectedView: number;
  entityType: string;
  entityId: number;
  selectedDocument: string;
  selectedEntity: string = "";
  isUpdateEditable: boolean = true;
  documentIds: number[] = [];

  // Confirmation dialog visibility
  showCreateInvoiceConfirmDialog: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private wellService: WellService,
    private configurationValuesService: ConfigurationValuesService,
    private listEditorBuilderService: ListEditorBuilderService,
    private lookupService: LookupsService,
    private authService: AuthService,
    private messageService: MessageService,
    private tyr2InvoiceService: Tyr2InvoiceService,
    private userService: UserService
  ) {
    effect(() => {
      this.appId = this.listEditorBuilderService.selectedApplicationId();
        this.loadWellOptions();
    });
  }

  ngOnInit() {
    this.initializeForm();
    this.getStatusList();
    this.getSupplierList();
    this.getProjectList();
    this.getRigList();
    this.setDefaultWell();
    this.loadMaterialCoordinators();
  }

  // Method to get user details and check access permissions
    getUserDetails() {
      this.userDetails = this.authService.getUserDetail(); // Get user details from AuthService
    }

  initializeForm() {
    this.createInvoiceForm = this.formBuilder.group({
      sender: ['', Validators.required],
      invoiceNumber: ['', Validators.required],
      wellName: ['', Validators.required],
      status: ['', Validators.required],
      user: ['', Validators.required],
      supplier: ['', Validators.required],
      project: ['', Validators.required],
      rig: ['', Validators.required],
      comments: ['']
    });
    this.setDefaultWell();
  }

  setDefaultWell() {
    // Set default to current well if available
    if (this.wellOptions && this.wellOptions.length > 0) {
      this.createInvoiceForm.patchValue({
        wellName: this.wellOptions[0].id
      });
    }
  }
  closeDialog() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  onHide() {
    this.closeDialog();
  }

  resetForm() {
    this.createInvoiceForm.reset();
  }

  // Load well options from the service
  loadWellOptions() {
    this.wellService.getAllWells(this.appId, this.functionId).subscribe({
      next: (data: WellDetails[]) => {
        this.wellOptions = data;
        this.setDefaultWell();
      },
      error: (err) => {
        console.error('Failed to load wells:', err);
      }
    });
  }

  // Fetching the material coordinators for the dropdown
    loadMaterialCoordinators(): void {
      this.userService.getUserPrimaryRole(Personas.MaterialCoordinator).subscribe({
        next: (res: UserPrimaryRole[]) => {
          this.materialCoordinatorsList = res;
        },
        error: (err) => {
          console.error('Error fetching material coordinators:', err);
        }
      });
    }
  // Load status options from the service
  getStatusList() {
    this.configurationValuesService.getAllEntities(ConfigValuesEnum.ConfigValue, ConfigValuesDropdownEnum.Status).subscribe({
      next: (response) => {
        this.statusOptions = response;
      },
      error: (error) => {
        console.error('Error fetching status list:', error);
      }
    });
  }
  // Load supplier options from the service
  getSupplierList() {
    this.configurationValuesService.getAllEntities(ConfigValuesEnum.ConfigValue, ConfigValuesDropdownEnum.Supplier).subscribe({
      next: (response) => {
        this.supplierOptions = response;
      },
      error: (error) => {
        console.error('Error fetching supplier list:', error);
      }
    });
  }
  // Load project options from the service
  getProjectList() {
    this.configurationValuesService.getAllEntities(ConfigValuesEnum.ConfigValue, ConfigValuesDropdownEnum.Project).subscribe({
      next: (response) => {
        this.projectOptions = response;
      },
      error: (error) => {
        console.error('Error fetching project list:', error);
      }
    });
  }
  // Load rig options from the service
  getRigList() {
    this.configurationValuesService.getAllEntities(ConfigValuesEnum.ConfigValue, ConfigValuesDropdownEnum.Rig).subscribe({
      next: (response) => {
        this.rigOptions = response;
      },
      error: (error) => {
        console.error('Error fetching Rig list:', error);
      }
    });
  }

  // Helper method to get current user ID
  private getCurrentUserId(): number {
    // Try different possible user ID properties from userDetails
    return this.userDetails?.id || this.userDetails?.uid || this.userDetails?.userId || this.userDetails?.Id || 0;
  }

  saveInvoice() {
    this.showCreateInvoiceConfirmDialog = true;
  }

  onConfirmSaveInvoice() {
    this.showCreateInvoiceConfirmDialog = false;
    if (this.createInvoiceForm.valid) {
      this.isLoading = true;
      this.getUserDetails();
      const current = new Date().toISOString();
      const documentDtos: DocumentInfo[] = this.documentIds.map(id => ({ id }));
      const currentUserId = this.getCurrentUserId();
      const invoicePayload: Tyr2Invoice[] = [{
        id: 0,
        sender: this.createInvoiceForm.value.sender,
        invoiceNumber: this.createInvoiceForm.value.invoiceNumber,
        wellId: this.createInvoiceForm.value.wellName || 0,
        supplierId: this.createInvoiceForm.value.supplier || 0,
        statusId: this.createInvoiceForm.value.status || 0,
        assignTo: this.createInvoiceForm.value.user || 0,
        projectId: this.createInvoiceForm.value.project || 0,
        rigId: this.createInvoiceForm.value.rig || 0,
        reasonCodeId: null,
        buId: null,
        comments: this.createInvoiceForm.value.comments || '',
        userIdCreatedBy: currentUserId,
        userIdLastModifiedBy: null,
        lastStatusUpdated: null,
        dateCreated: current,
        dateLastModified: null,
        isDeleted: 0,
        isThresholdReached: false,
        wellName: this.wellOptions.find(w => w.id === this.createInvoiceForm.value.wellName)?.wellName || '',
        supplierName: this.supplierOptions.find(s => s.id === this.createInvoiceForm.value.supplier)?.value || '',
        statusName: this.statusOptions.find(s => s.id === this.createInvoiceForm.value.status)?.value || '',
        rigName: this.rigOptions.find(r => r.id === this.createInvoiceForm.value.rig)?.value || '',
        reasonCodeValue: null,
        buValue: null,
        projectValue: this.projectOptions.find(p => p.id === this.createInvoiceForm.value.project)?.value || '',
        documents: documentDtos
      }];
      this.tyr2InvoiceService.addorUpdateInvoices(invoicePayload).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Invoice created successfully'
          });
          this.invoiceCreated.emit(); // <-- Add this line
          this.closeDialog();
        },
        error: (error) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create invoice. Please try again.'
          });
        }
      });
    } else {
      Object.keys(this.createInvoiceForm.controls).forEach(key => {
        this.createInvoiceForm.get(key)?.markAsTouched();
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields'
      });
    }
  }

  onCancelSaveInvoice() {
    this.showCreateInvoiceConfirmDialog = false;
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
      this.lookupService
        .getDocumentTypes(entityType)
        .subscribe({
          next: (resp: any) => {
            if (resp) {
              this.isUpdateEditable = true;
              this.displayfileUploadInteractiveDialog = true;
              this.entityType = entityType;
              this.entityId = data ? data.id : (this.createInvoiceForm.value.wellName || 0);
              this.wellDocumentTypes = resp;
              if (this.selectedEntity) {
                const documents = this.wellDocumentTypes.filter(x => x.entity === this.selectedEntity)
                // this.selectedView =documents[0].id;
  
                this.selectedView = selectedView ?? (documents.length > 0 ? documents[0].id : null);
  
                this.selectedEntity = "";
  
              }
              else {
                const invoiceDoc = this.wellDocumentTypes.find(x => x.name === DocumentTypeEnum.Invoice);
              this.selectedView = selectedView ?? (invoiceDoc ? invoiceDoc.id : (this.wellDocumentTypes.length > 0 ? this.wellDocumentTypes[0].id : null));
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
