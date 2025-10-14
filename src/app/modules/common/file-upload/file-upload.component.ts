import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { MessageService } from 'primeng/api';
import { MasterObjectKeys } from '../../../common/enum/master-object-keys';
import { MasterService } from '../../../services';
import { LookupKeys } from '../../../common/enum/lookup-keys';
import { DocumentEntityTypes } from '../../../common/enum/document-entity-types';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'file-upload',
  standalone: true,
    imports: [...PRIME_IMPORTS],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class FileUploadComponent implements OnInit {

  @Output() onClose = new EventEmitter<void>();
  @Output() refreshData = new EventEmitter<void>();

  @Input() entityId: number;
  @Input() entityType: string;
  @Input() documentTypeId: number;
  @Input() parentDirectory: any;
  @Input() uploadFileLabel: string = 'Upload File';
  @Input() uploadFileLabels: string = 'Upload Files';

  visible: boolean = false;
  showSpinner: boolean = false;
  filesList: Array<any> = [];
  acceptFileType = ".pdf,.doc,.docx";
  holeSections: Array<any> = [];
  documentTypes: Array<any> = [];

  constructor(private masterService: MasterService, private messageService: MessageService) { }

  ngOnInit(): void {
    
    this.visible = true;
    this.getLookupValues(LookupKeys.OD);
    this.getDocumentTypes();
  }

  /**
   * get document types list
   *
   */
  getDocumentTypes() {
    
    let params = { "Entity": this.entityType };
    this.masterService.get(MasterObjectKeys.GetDocumentTypesByEntity, params).subscribe({
      next: (resp: any) => {
        if (resp && resp.success && resp.data.length) {
          this.documentTypes = resp.data;
        }
        else {
          this.documentTypes = [];
        }
      },
      error: () => {
        this.documentTypes = [];
      }
    });
  }

  getLookupValues(lookupType: LookupKeys) {
    this.masterService.getLookupValues(lookupType).subscribe({
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

  /**
   * 
   * @param event File event
   */
  selectedFiles(event: any) {
    let cloneList = structuredClone(this.filesList);
    this.filesList = []; // reset

    // store new changes
    event.currentFiles?.forEach((file: File, index: number) => {
      let documentTypeId = (cloneList[index]?.documentTypeId ?? this.getDocumentTypeId);
      let obj = {
        documentTypeId: documentTypeId,
        askHoleSection: this.checkMetadata(documentTypeId)
      };
      this.filesList.push(obj);
    });

    if (this.documentTypes.length == 1) {
      this.filesList?.forEach(res => {
        res.documentTypeId = this.documentTypes[0].id;
      });
    }
  }

  onChangeDocumentType(event: any, index: number) {
    this.filesList[index].documentTypeId = event.value;
    this.documentTypeId = event.value;
    this.filesList[index].askHoleSection = this.checkMetadata(event.value);
  }

  checkMetadata(documentTypeId: number) {
    let documentType = this.documentTypes.find(x => x.id === documentTypeId);
    if (documentType && documentType.metadata) {
      let documentTypeMetadata = JSON.parse(documentType.metadata ?? '{}');
      if (documentTypeMetadata && documentTypeMetadata.holeSection) {
        return true;
      }
    }
    return false;
  }

  /**
   * remove document from files and filesList based on selected index.
   * 
   * @param files list of selected files
   * @param index position of file 
   */
  removeDocument(files: Array<any>, index: number) {
    files.splice(index, 1);
    this.filesList.splice(index, 1);
  }

  /**
   *
   * @property
   * @returns {string} current document type id
   */
  get getDocumentTypeId(): string {
    return (this.documentTypes.find((document) => document.id === this.documentTypeId)?.id ?? "");
  }

  /**
   * upload documents and refresh data.
   *
   * @param event file event
   */
  uploadDocuments(event: any) {

    // essential info
    let counter = 0;
    const filesLength = this.filesList.length;

    this.showSpinner = true;
    const successCallback = () => {
      counter++; // update counter to trigger next document

      if (counter >= filesLength) {
        this.showSpinner = false;
        this.messageService.add({ severity: 'success', detail: "Upload files successfully!" });
        this.refreshData.emit();
        this.onCloseDialog(false);
      } else {
        sendDocument();
      }
    };

    const errorCallback = (error: any) => {
      this.showSpinner = false;
      let msg = (error?.title ?? error.msg ?? error.message ?? "Failed to upload!");
      this.messageService.add({ severity: 'error', summary: 'Failed', detail: msg });
    };

    const sendDocument = async () => {
      let body = {
        'EntityId': this.entityId,
        'DocumentTypeId': this.filesList[counter].documentTypeId,
        'Base64Content': await this.convertFileToBase64(event.files[counter]),
        'ShortDescription': event.files[counter].name,
        'ContentType': event.files[counter].type,
        'Metadata': this.filesList[counter].holeSection,
        'LoggedInUserId': 0
      };

      if (this.parentDirectory && this.parentDirectory.id) {
        body['ParentId'] = this.parentDirectory.id;
      }

      // call API to send form data
      this.masterService.post(MasterObjectKeys.SaveDocument, body).subscribe({
        next: (resp: any) => {
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

    // send request to server
    event.files.forEach(file => {
      sendDocument();
    });
  }

  convertFileToBase64(file: any) {
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

  /**
   * close dialog
   *
   * @param visible visible
   */
  onCloseDialog(visible: boolean) {
    this.visible = visible;
    this.onClose.emit();
  }

}
