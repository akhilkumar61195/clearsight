import { Component, ElementRef, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MasterService } from '../../../services';
import { MasterObjectKeys } from '../../../common/enum/master-object-keys';
import { DocumentEntityTypes } from '../../../common/enum/document-entity-types';
import { environment } from '../../../../environments/environment';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

// var FileSaver = require('file-saver');

@Component({
  selector: 'document-grid',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './document-grid.component.html',
  styleUrl: './document-grid.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class DocumentGridComponent {

  @Input() entityType: DocumentEntityTypes;

  @Input() entityId: number;

  @Input() documentTypeId: number;

  @Output() onClose = new EventEmitter<void>();

  visible: boolean = true;

  openFileUploder: boolean = false;

  parentDirectory: any = null;

  title: string = 'Loading...';

  loading: boolean = true;

  documentTypes: any[] = [];

  documents: any[] = [];

  selectedDocumentId: string;

  holeSectionEnabled: boolean = false;

  holeSections: Array<any> = [];

  selectedMetadataFilter: string;

  constructor(public element: ElementRef,
    private masterService: MasterService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService) { }

  ngOnInit() {
    this.getDocumentTypes();
  }

  /**
   * @property
   * @returns {number} current document type id
   */
  get currentDocumentTypeId(): number {
    return (this.documentTypeId ?? this.firstDocumentTypeId);
  }

  /**
   * @property
   * @returns {number} get first document type id if documentTypeId is empty
   */
  get firstDocumentTypeId(): number {
    return (this.documentTypes?.[0]?.id ?? 0);
  }

  /**
   * @property
   * @returns {boolean} true if current entity have directory otherwise false
   */
  get hasDirectory(): boolean {
    return (this.documentTypes.find(x => x.id === this.currentDocumentTypeId)?.hasDirectory ?? false);
  }

  getDocumentTypes() {
    let params = { "Entity": this.entityType };
    this.loading = true;
    this.masterService.get(MasterObjectKeys.GetDocumentTypesByEntity, params).subscribe({
      next: (resp: any) => {
        if (resp && resp.success && resp.data) {
          this.documentTypes = resp.data;
          this.setTitle();
          this.getMetadata();
          this.checkMetadata();
        }
        else {
          this.documentTypes = [];
        }
        this.getDocuments();
      },
      error: () => {
        this.documentTypes = [];
        this.loading = false;
      }
    });
  }

  downloadDocument(document: any) {
    let url = `${environment.APIEndpoint}/Document/GetDocumentDetails?DocumentId=${document.id}`;
    window.open(url, "_blank");

    // FileSaver.saveAs(url, document.shortDescription);

    // let a = document.createElement("a");
    // document.body.appendChild(a);
    // a.href = url;
    // a.download = document.shortDescription;
    // a.click();
    // document.body.removeChild(a);
  }

  getDocuments(parentDocument?: any) {
    let params: any = { "DocumentTypeId": this.currentDocumentTypeId };
    if (!this.hasDirectory) { // no need entity id in case of hasDirectory
      params.EntityId = this.entityId;
    }

    if (parentDocument) {
      this.parentDirectory = parentDocument;
      params.ParentId = parentDocument.id;
    }
    else {
      this.parentDirectory = null;
    }

    if (this.selectedMetadataFilter) {
      params.Metadata = this.selectedMetadataFilter;
    }

    this.loading = true;
    this.masterService.get(MasterObjectKeys.GetDocuments, params).subscribe({
      next: (resp: any) => {
        this.loading = false;
        if (resp && resp.success && resp.data) {
          this.documents = resp.data;
        }
        else {
          this.documents = [];
        }
      },
      error: () => {
        this.loading = false;
        this.documents = [];
      }
    });
  }

  getMetadata() {
    let params: any = {
      "DocumentTypeId": this.currentDocumentTypeId,
      "EntityId": this.entityId
    };

    this.masterService.get(MasterObjectKeys.GetDocumentMetadata, params).subscribe({
      next: (resp: any) => {
        if (resp && resp.success && resp.data.length) {
          this.holeSections = resp.data;
        }
        else {
          this.holeSections = [];
        }
      },
      error: () => {
        this.holeSections = [];
      }
    });
  }

  setTitle() {
    this.title = this.documentTypes.find(x => x.id === this.currentDocumentTypeId).shortDescription;
  }

  onSwitchDocumentType(documentType: any) {
    this.documentTypeId = documentType.id;
    this.getDocuments();
    this.setTitle();
    this.getMetadata();
    this.checkMetadata();
  }

  onSwitchMetadata(value: any) {
    if (this.selectedMetadataFilter === value.metadata) {
      this.selectedMetadataFilter = null;
    }
    else {
      this.selectedMetadataFilter = value.metadata;
    }
    this.getDocuments();
    this.setTitle();
  }

  checkMetadata() {
    let documentType = this.documentTypes.find(x => x.id === this.documentTypeId);
    if (documentType && documentType.metadata) {
      let documentTypeMetadata = JSON.parse(documentType.metadata ?? '{}');
      if (documentTypeMetadata && documentTypeMetadata.holeSection) {
        this.holeSectionEnabled = true;
      }
      else {
        this.holeSectionEnabled = false;
      }
    }
    else {
      this.holeSectionEnabled = false;
    }

  }

  public onHide() {
    let existDocuments: any = this.documents;
    this.onClose.emit(existDocuments);
  }

  onCloseDocumentViewer() {
    this.selectedDocumentId = null;
  }

  onSuccessfullFileUpload() {
    this.getDocuments();
    this.setTitle();
    this.getMetadata();
    this.checkMetadata();
  }

  onClickDeleteDocument(event: Event, document: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Do you want to delete this document?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: "p-button-danger p-button-text",
      rejectButtonStyleClass: "p-button-text p-button-text",
      acceptIcon: "none",
      rejectIcon: "none",

      accept: () => {
        this.deleteDocument(document);
      },
      reject: () => {
      }
    });
  }

  deleteDocument(document: any) {
    let body: any = {
      "DocumentId": document.id,
      "LoggedInUserId": 0
    };

    this.masterService.post(MasterObjectKeys.DeleteDocument, body).subscribe({
      next: (resp: any) => {
        if (resp && resp.success) {
          this.getDocuments();
          this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'Document deleted!' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Failed', detail: resp.message });
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Failed to delete document!' });
      }
    });
  }

}