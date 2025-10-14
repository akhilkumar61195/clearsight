import { Injectable, signal, WritableSignal } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';
import { Tyr2InvoiceService } from '../../../../services/tyr2-invoice.service';
import { Tyr2Invoice } from '../../../../common/model/tyr2-invoice.model';
import { UserService } from '../../../../services/user.service';
import { Personas } from '../../../../common/enum/user-persona.enum';
import { UserPrimaryRole } from '../../../../common/model/UserInfo';
import { ConfigurationValuesService } from '../../../../services/configuration-values.service';
import { ConfigurationValues } from '../../../../common/model/configuration-values';
import { Tyr2InvoiceStatus } from '../../../../common/enum/common-enum';
import {  NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceBuilderService {
  invoices: WritableSignal<Tyr2Invoice[]> = signal<Tyr2Invoice[]>([]);
  loading: WritableSignal<boolean> = signal<boolean>(false);
  error: WritableSignal<any> = signal<any>(null);
  showRejectInvoiceModal: boolean = false;

  materialCoordinatorsList: WritableSignal<UserPrimaryRole[]> = signal<UserPrimaryRole[]>([]);
  statusList: WritableSignal<ConfigurationValues[]> = signal<ConfigurationValues[]>([]);
  buCodeList: WritableSignal<ConfigurationValues[]> = signal<ConfigurationValues[]>([]);
  rigList: WritableSignal<ConfigurationValues[]> = signal<ConfigurationValues[]>([]);
  reasonCodeList: WritableSignal<ConfigurationValues[]> = signal<ConfigurationValues[]>([]);
  projectList: WritableSignal<ConfigurationValues[]> = signal<ConfigurationValues[]>([]);
  supplierList: WritableSignal<ConfigurationValues[]> = signal<ConfigurationValues[]>([]);

  private invoiceCreatedSource = new Subject<void>();
  invoiceCreated$ = this.invoiceCreatedSource.asObservable();

  userDetails: any;

  constructor(
    private tyr2InvoiceService: Tyr2InvoiceService,
    private userService: UserService,
    private configurationValuesService: ConfigurationValuesService,
    private messageService: MessageService,
    private spinner: NgxSpinnerService,
    private authService: AuthService
  ) {
    this.getUserDetails();
  }

  getUserDetails() {
    this.userDetails = this.authService.getUserDetail();
  }
  // Method to load all invoices
  loadInvoices() {
    this.loading.set(true);
    this.tyr2InvoiceService.getAllInvoices().subscribe({
      next: (tasks: Tyr2Invoice[]) => {
        this.invoices.set(tasks);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        this.error.set(err);
        this.loading.set(false);
      }
    });
  }

  // Method to load material coordinators
  loadMaterialCoordinators(){
    this.userService.getUserPrimaryRole(Personas.MaterialCoordinator).subscribe({
      next: (res: UserPrimaryRole[]) => {
        this.materialCoordinatorsList.set(res);
      },
      error: (err) => {
        this.materialCoordinatorsList.set([]);
        console.error('Error fetching material coordinators:', err);
      }
    });
  }

  //Method to load all Statuses
  getStatusList() {
    this.configurationValuesService.getAllEntities('configvalue', 'Invoice Status').subscribe({
      next: (response) => {
        this.statusList.set(response);
      },
      error: (error) => {
        this.statusList.set([]);
        console.error('Error fetching status list:', error);
      }
    });
  }
  //Method to load all BU Codes
  getBUCode() {
    this.configurationValuesService.getAllEntities('configvalue', 'Plant Code').subscribe({
      next: (response) => {
        this.buCodeList.set(response);
      },
      error: (error) => {
        this.buCodeList.set([]);
        console.error('Error fetching BU codes:', error);
      }
    });
  }
  //Method to load all Rigs
  getRigList() {
    this.configurationValuesService.getAllEntities('configvalue', 'Rig').subscribe({
      next: (response) => {
        this.rigList.set(response);
      },
      error: (error) => {
        this.rigList.set([]);
        console.error('Error fetching Rig list:', error);
      }
    });
  }
  //Method to load all Reason Codes
  getReasonCode() {
    this.configurationValuesService.getAllEntities('configvalue', 'Invoice_ReasonCodes').subscribe({
      next: (response) => {
        this.reasonCodeList.set(response);
      },
      error: (error) => {
        this.reasonCodeList.set([]);
        console.error('Error fetching reason codes:', error);
      }
    });
  }
  //Method to load all Projects
  getProjectList() {
    this.configurationValuesService.getAllEntities('configvalue', 'Project').subscribe({
      next: (response) => {
        this.projectList.set(response);
      },
      error: (error) => {
        this.projectList.set([]);
        console.error('Error fetching project list:', error);
      }
    });
  }
  //Method to load all Suppliers
  getSupplierList() {
    this.configurationValuesService.getAllEntities('configvalue', 'Supplier').subscribe({
      next: (response) => {
        this.supplierList.set(response);
      },
      error: (error) => {
        this.supplierList.set([]);
        console.error('Error fetching supplier list:', error);
      }
    });
  }

  /**
   * Common method to build invoice payload and submit to API
   */
  submitInvoicePayload(
  rows: Tyr2Invoice[],
    documentIds: number[],
    successMessage?: string,
    onSuccess?: () => any
  ) {
    const documentDtos = documentIds.map(id => ({ id }));
    const payload = rows.map(row => ({
      id: row.id,
      wellId: row.wellId,
      supplierId: row.supplierId,
      statusId: row.statusId,
      assignTo: row.assignTo,
      projectId: row.projectId,
      rigId: row.rigId,
      reasonCodeId: row.reasonCodeId,
      buId: row.buId,
      sender: row.sender,
      invoiceNumber: row.invoiceNumber,
      comments: row.comments || null,
      userIdCreatedBy: row.userIdCreatedBy,
      userIdLastModifiedBy: this.userDetails?.uid,
      lastStatusUpdated: row.lastStatusUpdated,
      dateCreated: row.dateCreated,
      dateLastModified: row.dateLastModified,
      isDeleted: row.isDeleted,
      isThresholdReached: row.isThresholdReached,
      wellName: row.wellName,
      supplierName: row.supplierName,
      statusName: row.statusName,
      rigName: row.rigName,
      reasonCodeValue: row.reasonCodeValue,
      buValue: row.buValue,
      projectValue: row.projectValue,
      documents: documentDtos
    }));
    this.spinner.show();
    this.tyr2InvoiceService.addorUpdateInvoices(payload).subscribe({
      next: (response) => {
        this.spinner.hide();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: successMessage });
        if (onSuccess) {
          onSuccess();
        }
      },
      error: (err) => {
        this.spinner.hide();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error saving invoice(s).' });
        console.error('Error saving invoice(s):', err);
      }
    });
  }

  // Method to save edited invoices
  saveEditedInvoices(gridApi: any, documentIds: number[], onSuccess?: () => any) {
    const editedRowData: Tyr2Invoice[] = [];
    gridApi.forEachNode((node: any) => {
      if (node.data && node.data.isEdited) {
        editedRowData.push(node.data);
      }
    });
    if (editedRowData.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'No changes to save' });
      return;
    }
    this.submitInvoicePayload(
      editedRowData,
      documentIds,
      'Invoice(s) saved successfully.',
      onSuccess
    );
  }

  // Method to reject an invoice
  rejectInvoice(selectedRow: Tyr2Invoice, reasonCodeId: number, comments: string, documentIds: number[], onSuccess?: () => any) {
    const rows = [{ ...selectedRow, reasonCodeId, comments }];
    this.submitInvoicePayload(rows, documentIds, 'Invoice rejected successfully.', onSuccess);
  }

  // Method to handle status change and save invoice while clicking the document upload button
  saveAttachmentTask(
    data: Tyr2Invoice,
    statusList: any[],
    documentIds: number[]
  ) {
    let statusChanged = false;
    // If Status = Submitted THEN change Status to Under Review
    if (data.statusName === Tyr2InvoiceStatus.Submitted) {
      const underReviewStatus = statusList.find(status => status.value === Tyr2InvoiceStatus.UnderReview);
      if (!underReviewStatus) return;
      data.statusName = underReviewStatus.value;
      data.statusId = underReviewStatus.id;
      statusChanged = true;
    }
    // If Status = Ready to Process THEN change Status to Pending
    else if (data.statusName === Tyr2InvoiceStatus.ReadyToProcess) {
      const pendingStatus = statusList.find(status => status.value === Tyr2InvoiceStatus.Pending);
      if (!pendingStatus) return;
      data.statusName = pendingStatus.value;
      data.statusId = pendingStatus.id;
      statusChanged = true;
    }
    if (!statusChanged) return;
    // data.isEdited = true;
    this.submitInvoicePayload([data], documentIds, 'Invoice status updated successfully.');
  }
  
  // Method to delete an invoice by ID
  deleteInvoice(invoiceId: number) {
    this.spinner.show();
    this.tyr2InvoiceService.deleteInvoice(invoiceId).subscribe({
      next: (response) => {
        this.spinner.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Invoice deleted successfully.'
        });
      },
      error: (err) => {
        this.spinner.hide();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error deleting invoice.' });
        console.error('Error deleting invoice:', err);
      }
    });
  }

  emitInvoiceCreated() {
    this.invoiceCreatedSource.next();
  }
}
