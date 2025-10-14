import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ColumnService } from '../../../services/columnService/changeLogCoulmnService';
import { AccessControls, viewOptionsButtons } from '../../../common/constant';
import { DocumentEntityTypes } from '../../../common/enum/document-entity-types';
import { MasterService } from '../../../services/master.service';
import { MasterObjectKeys } from '../../../common/enum/master-object-keys';
import { environment } from '../../../../environments/environment';
import { ColDef, GridOptions } from 'ag-grid-enterprise';
import { CustomDeleteButton } from '../../schematic/customDeleteButton.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LookupsService } from '../../../services/lookups.service';
import { LookupKeys } from '../../../common/enum/lookup-keys';
import { masterdatalibraryModelTable } from '../../../common/model/masterdatalibraryModelTable';
import { MdlDataService } from '../../../services/mdl-data.service';
import { AuthService } from '../../../services';
import { NgxSpinnerService } from 'ngx-spinner';
import { TaskTypes } from '../../../common/enum/common-enum';
import { BulkuploadService } from '../../../services/bulkupload.service';
import { BatchFileUpload } from '../../../common/model/batch-file-upload';
import { SchematicClamps } from '../../../common/model/schematic-clamps';
import { ExcelColumnMapService } from '../../../services/excel-column-service/excel-column.service';
import { CommonService } from '../../../services/common.service';
import { S3BucketService } from '../../../services/document-service/s3-bucket.service';
import { DocumentService } from '../../../services/document-service/document.service';
import { DocumentInfo } from '../../../common/model/Document/DocumentInfo';
import { DocumentStoreType } from '../../../common/enum/document-store-type.enum';
import { CvxpoService } from '../../../services/document-service/cvxpo.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';



@Component({
  selector: 'app-file-upload-with-grid',
  standalone: true,
  imports: [...PRIME_IMPORTS,DeleteConfirmationDialogComponent],
  templateUrl: './file-upload-interactive-dialog.component.html',
  styleUrl: './file-upload-interactive-dialog.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class FileUploadWithButtonComponent implements OnInit, OnChanges {
  @ViewChild('fileInput') fileInput: ElementRef;
  @Input() displayfileUploadInteractiveDialog: boolean = false; // Controls dialog visibility
  @Output() onClose = new EventEmitter<void>();
  @Output() uploadedFileType = new EventEmitter<boolean>();
  @Output() documentIdsEmitter = new EventEmitter<number[]>();
  @Input() existingDocuments: any[] = []; // New input for existing documents
  @Input() entityId: number;
  @Input() dialogTitle: string;
  @Input() dialogContent: string;
  @Input() functionId: number;
  @Input() appId: number;
  visible: boolean = false;
  @Input() entityType: string;
  @Input() selectedView: number;
  @Input() wellDocumentTypes: any;
  @Input() mdlRecord;
  @Input() isUpdateEditable:boolean=true;
  @Input() uploadFileName: string = '';
  // @Input() existingDocuments: any[] = []; // New input for existing documents
  isClampAndControlEditable: boolean = false;
  isCVXPOFileUploaded: boolean = false;

  hideMM: boolean;
  newmdlRecord: masterdatalibraryModelTable = new masterdatalibraryModelTable();
  deleteDocumentData: any;
  holeSection: string = "";
  holeSections: Array<any> = [];
  documentTypes: any[] = [];
  parentDirectory: any = null;
  selectedMetadataFilter: string;
  showSpinner: boolean = false;
  documents: any[] = [];
  controlLineAndClap: SchematicClamps[] = []; //define controlline model
  holeSectionDropDown: boolean = false;
  displayDeleteComponentDialog: boolean = false;
  openFileUploder: boolean = false;
  filesList: Array<any> = [];
  uploadFileData = [];
  isFileSelected: boolean = false;
  gridOptions: GridOptions;
  uploadThorDocumentColumnDefs: ColDef[];
  clampDocumentColumnDefs: ColDef[];
  uploadedfileName: string = '';
  userDetail: any;
  gridApi: any;
  gridColumnApi: any;
  isClampandControlLineShowing: boolean = false;
  selectedRowForDelete = []; // this variable will show and hide delete icon in clam control and control line summary.
  isShowDescription: boolean = true;  //if app-excel dialog will not use inside the custom dialog in this case it will be true.
  deletePopupContent: string = ""; // using this will reuse same confirmation box with differetn content.
  isdocumentDelete: boolean = false;// it will detect user trying to delete document or excel data in grid.
  displayUploadConfirmationDialog: boolean = false; // show/hide upload confirmation dialog
  displayPdfPreviewDialog: boolean = false; // show/hide PDF preview dialog
  pdfPreviewUrl: string = ''; // URL for PDF preview
  safePdfUrl: SafeResourceUrl | null = null; // Safe URL for iframe
  pdfLoadError: boolean = false; // Track if PDF failed to load
  documentIds: number[] = [];
  //column mapping with excel sheet
  keyMap: Record<string, string>;
  constructor(private columnService: ColumnService, private masterService: MasterService, private confirmationService: ConfirmationService,
    private messageService: MessageService, private lookupService: LookupsService,
    private renderer: Renderer2, private mdlDataService: MdlDataService, private bulkUploadService: BulkuploadService,
    private authService: AuthService, private spinner: NgxSpinnerService,
    private excelColumnMapService: ExcelColumnMapService,
    private commonService: CommonService,
    private cvxpoService : CvxpoService,
    private s3BucketService:S3BucketService,
    private documentService:DocumentService,
    private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.getUserDetails();
    // console.log('Entity Type:', this.entityType); 
    this.visible = true;
    this.keyMap = this.excelColumnMapService.clampandControlLinekeyMap;
    this.uploadGrid();
    this.userDetail = this.authService.getUserDetail();
    this.getLookupValues(LookupKeys.OD);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.entityType == 'COMPLETION_WELL' || this.entityType == 'WELL') {
      this.hideMM = true;
    }
    if (this.entityType !== 'COMPLETION_WELL' && this.entityType !== 'WELL') {
      this.hideMM = false;
    }
    this.uploadGrid();
  }

  /**
       *  it will get the user details from jwt token
       */
  getUserDetails(){
    let userAccess=  this.authService.isAuthorized(AccessControls.CLAMP_CONTROL);
    this.commonService.setuserAccess(userAccess);
    // Checking the user access for editability
    this.isClampAndControlEditable = this.authService.isFieldEditable('isClampAndControlEditable');
  }

  uploadGrid() {
    //condtionally defining ag grid column
    if (this.isClampandControlLineShowing) {
      this.clampDocumentColumnDefs = [
        {
          headerCheckboxSelection: true,
          checkboxSelection: true,
          headerCheckboxSelectionFilteredOnly: true,
          maxWidth: 50,
          pinned: 'left',
          filter: false,
          suppressMenu: true
        },
        {
          headerName: 'Supplier Part #',
          field: 'manufacturerPart',
          sortable: true,
          filter: true,
          // maxWidth: 200,
          minWidth: 180

        },
        {
          headerName: 'Vendor SAP #',
          field: 'halliburtonPart',
          sortable: true,
          filter: true,
          // maxWidth: 180,
          minWidth: 180
        },
        {
          headerName: 'MM#',
          field: 'materialNumber',
          sortable: true,
          filter: true,
          // maxWidth: 130,
          minWidth: 120
        },
        {
          headerName: 'Min QTY (Primary)',
          field: 'primaryDemand',
          sortable: true,
          filter: true,
          // maxWidth: 180,
          minWidth: 180
        },
        {
          headerName: 'Total QTY Provided',
          field: 'totalQty',
          sortable: true,
          filter: true,
          // maxWidth: 180,
          minWidth: 170
        },
        {
          headerName: 'B/U QTY',
          field: 'contingencyDemand',
          sortable: true,
          filter: true,
          // maxWidth: 120,
          minWidth: 100
        },
        {
          headerName: 'Unit Cost',
          field: 'unitCost',
          sortable: true,
          filter: true,
          // maxWidth: 120,
          minWidth: 80
        },
        {
          headerName: 'As-Built Quantity',
          field: 'asBuiltQuantity',
          sortable: true,
          filter: true,
          // maxWidth: 120,
          minWidth: 150
        },
        {
          headerName: 'Consumption Value',
          field: 'consumptionValue',
          sortable: true,
          filter: true,
          // maxWidth: 120,
          minWidth: 100
        }
      ];

    }
    else {
      this.uploadThorDocumentColumnDefs = [
        {
          headerName: 'Name',
          field: 'shortDescription',
          sortable: true,
          filter: true,
          minWidth: 120,
          cellRenderer: (params) => {
            // Assuming params.value is the short description and can be used as link text
            // You can also use params.data.shortDescription if necessary
            const value = params.value;
            return `<a href="javascript:void(0);" onclick="downloadDocument(${JSON.stringify(params.node.data)})">${value}</a>`;            
          },
          onCellClicked: (event) => {
            // event.node.data will contain the row data
            this.downloadDocument(event.node.data);
          }
        },
        {
          headerName: 'Schematic Name', hide: this.appId == 4 ? false : true, field: 'schematicsName', sortable: true, filter: true, maxWidth: 180, minWidth: 130,
        }, // this header will show only popup open in schematic control line and hidden for other app like mdl , thor , odin
        {
          headerName: 'Date',
          field: 'dateCreated',
          maxWidth: 150,
          minWidth: 110,
          valueFormatter: (params) => {
            const date = new Date(params.value);  // Convert the value into a Date object
            if (!isNaN(date.getTime())) { // Check if the date is valid
              // Extract the day, month, and year
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indesxed
              const year = date.getFullYear();

              // Format the date as MM/DD/YYYY
              return `${month}/${day}/${year}`;
            }
            return params.value; // Return the original value if it's not a valid date
          }
        },
        {
          headerName: 'Po Number', field: 'PoNumber', sortable: true, filter: true, maxWidth: 200, minWidth: 130,
          hide: this.appId == 2 && this.currentDocumentTypeId == 12  ? false : true // this will show only for thor upload hidden for schematic
        },
        {
          headerName: 'Well Name', hide: this.appId == 4 ? true : false, field: 'WellName', sortable: true, filter: true, maxWidth: 180, minWidth: 130,
        }, // this will show only for thor upload hidden for schematic 

        {
          headerName: 'MM', field: 'MaterialId', sortable: true, filter: true, maxWidth: 180, minWidth: 130,
          hide: this.hideMM == true || this.appId == 4 ? true : false
        }, // this will show only for thor upload hidden for schematic 
        { headerName: 'Document Type', field: 'documentType', sortable: true, filter: true, maxWidth: 180, minWidth: 150 },
        { headerName: 'Hole Section', field: 'metaData', sortable: true, filter: true, maxWidth: 180, minWidth: 130, hide: this.holeSectionDropDown ? false : true },
        { headerName: 'Version', field: 'version', sortable: true, filter: true, maxWidth: 120, minWidth: 100 },

        { headerName: 'Uploaded By', field: 'userIdCreatedByName', maxWidth: 180, minWidth: 150, sortable: true, filter: true },
        {
          headerName: 'Actions', cellRenderer: CustomDeleteButton, maxWidth: 100, minWidth: 100, suppressHeaderMenuButton: true, cellRendererParams: {
            onClick: (rowData: any) => { this.onClickDeleteDocument(event, rowData); }, sortable: false
          }
        }

      ];
    }

  }

  deleteDialogOpen(rowData: any) {
    this.displayDeleteComponentDialog = true;  // Show the dialog
  }

  /**
* @property
* @returns {number} current document type id
*/
  get currentDocumentTypeId(): number {
    return (this.selectedView ?? this.firstDocumentTypeId);
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

  getDocuments(parentDocument?: any) {
    // // If existing documents are provided, use them instead of fetching
    // if (this.existingDocuments && this.existingDocuments.length > 0) {
    //   this.documents = this.existingDocuments.map(doc => ({
    //     ...doc,
    //     shortDescription: doc.shortDescription ? doc.shortDescription.split('/').pop() : '',
    //     metaData: '',
    //     Key: doc.shortDescription,
    //     url: doc.url || doc.shortDescription, // Ensure url field exists for downloadDocument method
    //     contentType: doc.contentType || 'application/pdf' // Default content type
    //   }));
    //   return;
    // }
    this.spinner.show();
    let params: any = { "DocumentTypeId": this.currentDocumentTypeId };
    params.AppId = this.appId;
    params.FunctionId = this.functionId;
    params.EntityName = this.entityType;
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
    // this.spinner.show();

    this.masterService.get(MasterObjectKeys.GetCompletionDocuments, params).subscribe({
      next: (resp: any) => {
        this.spinner.hide();
        if (resp && resp.success && resp.data) {
          this.documents = resp.data;
          this.documents.forEach(doc => {
            doc.shortDescription = doc.shortDescription.split('/').pop(); // Extract the file name from the path;
            doc.version =  (typeof doc.version === 'object' && Object.keys(doc.version).length === 0) ? '' : JSON.stringify(doc.version);
            const metadataString = (typeof doc.metadata === 'object' && Object.keys(doc.metadata).length === 0) ? '' : JSON.stringify(doc.metadata);
            doc.entityType = this.entityType === 'WELL' ? this.entityType : 'MATERIAL'
            doc.metaData = metadataString.replace(/^"|"$/g, '');
            doc.Key = doc.ShortDescription;
          });
          this.documentIds = this.documents.map(d => d.id);
        }
        else {
          this.documents = [];
        }
      },
      error: () => {
        this.spinner.hide();
        this.documents = [];
      }
    });
  }

  downloadDocument(event: any) {
    // Check if this is TYR (appId = 3) and show modal popup with PDF preview
    if (this.appId === 3) {
      // For TYR, preview PDF in modal instead of downloading
      const key = event.url.split('/')[event.url.split('/').length - 2] + '/' + event.shortDescription;
      this.previewPdf(key, event.contentType);
      return;
    }
    
    // For other apps, download the document
    const key = event.url.split('/')[event.url.split('/').length - 2] + '/' + event.shortDescription;
    this.getPreSignedUrl(key, event.contentType, false);
  }
  

  onCloseDialog() {
    this.holeSectionDropDown = false;
    this.holeSection = '';
    this.controlLineAndClap = [];
    this.isClampandControlLineShowing = false;
    this.uploadedFileType.emit(this.isCVXPOFileUploaded);
    this.onClose.emit();
    this.documentIdsEmitter.emit(this.documentIds);
    this.uploadedfileName = '';
  }

  onClickDeleteDocument(event: Event, document: any) {
    this.deleteDocumentData = document;
    this.deletePopupContent = 'Are you sure you want to delete this document?';
    this.displayDeleteComponentDialog = true;
    this.isdocumentDelete = true;

  }
  onSuccessfullFileUpload() {
    this.getDocuments();
  }
  onViewSelectionChange() {

    this.dialogTitle = this.wellDocumentTypes.find(x => x.id === this.selectedView)?.name;
    this.isClampandControlLineShowing = ['Clamp Summary', 'Control Line Summary'].includes(this.dialogTitle) ? true : false; //checking clamp summary or contolr line selected or not
    this.isClampandControlLineShowing == false ? this.getDocuments() : this.getschematicClampandControlLine(); // calling method  on the basis of clapm summary or control line selection
    if (this.selectedView == 9) {
      this.holeSectionDropDown = true;

      this.uploadGrid();
    }
    else {
      this.holeSectionDropDown = false;
      this.uploadGrid();
      // this.isClampandControlLineShowing ==false ? this.getDocuments() :"";
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
  // Drag leave event handler
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
  // Drop event handler
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const uploadFile = [];
      uploadFile.push(event.dataTransfer?.files);
      this.uploadFileData = uploadFile[0];
      this.uploadedfileName = file.name;
    }
  }

  onFileSelected(event: any) {
    this.uploadFileData = event.target.files;
    this.uploadedfileName = this.uploadFileData[0].name

  }
  onFileClick() {

    this.renderer.selectRootElement(this.fileInput.nativeElement).click(); // Trigger the file input click

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
  closeDeleteDialog() {
    this.displayDeleteComponentDialog = false;
  }

  previewPdf(key: string, contentType: string) {
    this.spinner.show();
    this.pdfLoadError = false; // Reset error state
    this.s3BucketService.getPresignedUploadUrl({ key: key, isPut: false, contentType: contentType }).subscribe({
      next: (s3Url: any) => {
        if (!s3Url || !s3Url.url) {
          this.spinner.hide();
          this.messageService.add({ severity: 'error', detail: "Failed to get presigned URL for preview!" });
          return;
        }
        
        this.pdfPreviewUrl = s3Url.url;
        this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(s3Url.url);
        this.displayPdfPreviewDialog = true;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
        this.messageService.add({ severity: 'error', detail: "Failed to get presigned URL for preview!" });
      }
    });
  }

  closePdfPreview() {
    this.displayPdfPreviewDialog = false;
    this.pdfPreviewUrl = '';
    this.safePdfUrl = null;
    this.pdfLoadError = false;
  }

  onPdfLoad() {
    // PDF loaded successfully, no action needed
    this.pdfLoadError = false;
  }

  onPdfError() {
    // PDF failed to load, show fallback
    this.pdfLoadError = true;
  }

  deleteDocument() {
    if (this.isdocumentDelete) {
      let documentInfo: DocumentInfo = {
        id: this.deleteDocumentData.id,
        shortDescription: this.deleteDocumentData.url.split('/')[this.deleteDocumentData.url.split('/').length-2]+ '/' + this.deleteDocumentData.shortDescription,
        entityId: '',
        contentType: '',
        url: ''
      }
      this.spinner.show();
      let deleteDocumentPromise = this.documentService.deleteDocument(documentInfo).subscribe({
        next: (response) => {
          if (response) {
            this.spinner.hide();
            if (this.appId == 3) {
              this.editRecord(false);
            }
            this.getDocuments();
            this.deleteDocumentData = null;
            this.closeDeleteDialog();
            this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'Document deleted!' });
          }

        },
        error: (error) => {
          this.spinner.hide();
          this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Failed to delete document!' });
        }
      });
    }
    else {
      this.deleteExcelData();
    }

  }

  /**
* upload documents and refresh data.
*
* @param event file event
*/
  uploadDocuments() {
    let event = this.uploadFileData;
    let obj = {
      documentTypeId: this.wellDocumentTypes.find(x => x.id === this.selectedView)?.id,
      askHoleSection: this.wellDocumentTypes.find(x => x.id === this.selectedView)?.name == 'Bucking Schematic' ? true : false
    };
    if (obj.documentTypeId == 12 ) {
      if(event[0].type != 'application/pdf'){
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Only pdf allow for CVX PO' });
        this.uploadFileData = [];
        this.uploadedfileName = '';
      }
      else
        {
        this.filesList.push(obj);
        this.isCVXPOFileUploaded = true;
        this.uploadCVXPODocument(this.uploadFileData[0]);
      }
    }
    else {
      this.filesList.push(obj);
      let counter = 0;
      const filesLength = this.filesList.length;
      this.spinner.show();
      this.uploadedfileName = '';
      let folderName ='';
      switch (this.appId) {
        case 2:
          folderName = DocumentStoreType.Thor;
          break;
        case 3:
          folderName = DocumentStoreType.Tyr;
          break;
        case 4:
          folderName = DocumentStoreType.Schematic;
          break;
        default:
          throw new Error('Unsupported AppId');
      }
      const key = folderName + '/' + event[counter].name;
      const type = event[counter].type;

      this.s3BucketService.getPresignedUploadUrl({ key: key, isPut: true, contentType: type }).subscribe({
        next: (s3Url: any) => {
          this.s3BucketService.uploadFile(s3Url.url, event[counter]).subscribe({
            next: (uploadResp: any) => {
              counter++; // update counter to trigger next document

              this.messageService.add({ severity: 'success', detail: "Upload files successfully!" });
              const uploadFileData: DocumentInfo = {
                userIdCreatedBy: this.userDetail.uid,
                userIdLastModifiedBy: this.userDetail.uid,
                documentTypeId: this.currentDocumentTypeId,
                entityId: this.entityId.toString(),
                shortDescription: key,
                contentType: type,
                functionId: this.functionId,
                appId: this.appId,
                folderName: folderName,

              };
              this.SaveDocumentInfo(uploadFileData);

            },
            error: (error: any) => {
              this.spinner.hide();
              this.uploadFileData = [];
              this.uploadedfileName = '';
              let msg = (error?.title ?? error.msg ?? error.message ?? "Failed to upload!");
              this.messageService.add({ severity: 'error', summary: 'Failed', detail: msg });

            }
          })
        },
        error: (error: any) => {
          this.spinner.hide();
          this.uploadFileData = [];
          this.uploadedfileName = '';
          this.messageService.add({ severity: 'error', detail: error?.error ?? "Failed to get presigned URL!" });
          return;
        }

      });

    }

  }

  convertFileToBase64(file: any) {
    if (file) {
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
  editRecord(isDelete: boolean) {
    this.newmdlRecord = this.mdlRecord;
    this.newmdlRecord.dateLastModified = new Date();
    this.newmdlRecord.userIdModifiedBy = this.userDetail.uid;
    if (isDelete) {
      this.newmdlRecord.documentCount = this.mdlRecord.documentCount + 1;
    } else {
      if (this.mdlRecord.documentCount > 0) {
        this.newmdlRecord.documentCount = this.mdlRecord.documentCount - 1;
      } else {
        this.newmdlRecord.documentCount = this.mdlRecord.documentCount; // No change if it's 0
      }
    }
    this.newmdlRecord.supplierId = this.mdlRecord.organizationId;

    this.mdlDataService.editMaterial(this.newmdlRecord).subscribe((response) => {



    }, (error) => {

      this.messageService.add({ severity: 'error', summary: 'Error', detail: error["error"]["title"] });
      console.error('Error saving record', error);
    });
  }

  /**
  * Handles the upload event triggered by the custom Excel upload dialog.
  * Constructs the request payload with the uploaded file, parsed data, and user ID,
  * and sends it to the API for processing.
  * Displays success or error messages based on the API response and refreshes the table.
  * 
  * @param event The event object containing the uploaded file and parsed data.
  */

  handleUpload(event: { file: File, data: any[] }) {

    // Construct the request object with userId, file, and data
    const request: BatchFileUpload = {
      file: event.file, // File from the event
      jsonData: JSON.stringify(event.data), // Convert the parsed Excel data to JSON
      userId: this.userDetail.uid, // Add the userId from the current user details
    };

    // Show the spinner while the API call is in progress
    this.spinner.show();

    // Call the API to upload the clamps file
    this.bulkUploadService.uploadFile(request, TaskTypes.CONTROLLINECLAMPS).subscribe({
      next: (res) => {
        // Hide the spinner and show a success message
        this.spinner.hide();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: res.details });

        // Refresh the table or perform any additional actions
        this.getschematicClampandControlLine();

      },
      error: (error) => {
        // Hide the spinner and show an error message
        this.spinner.hide();
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error });

      },
    });
  }

  // this will get record for selected clamp summary or Control Line Summary on the basis of selected schematic id
  getschematicClampandControlLine() {

    let type = this.dialogTitle == 'Clamp Summary' ? 'Clamp' : 'ControlLine';
    // this.spinner.show();
    this.bulkUploadService.getschematicClamps(type, this.entityId).subscribe({
      next: (resp: any) => {

        this.spinner.hide();
        if (resp) {

          this.controlLineAndClap = resp;

        }
        else {
          this.controlLineAndClap = [];
        }
      },
      error: () => {
        this.spinner.hide();
        this.controlLineAndClap = [];
      }
    });
  }
  customValidate = (data: any[]): string[] => {

    const validationErrors: string[] = [];

    if (!data || data.length === 0) {
      validationErrors.push('The uploaded file is empty. Please upload a valid file with data.');
    }

    const manufacturerPartSet = new Set();

    data.forEach((row, rowIndex) => {
      const manufacturerPart = row['manufacturerPart'];
      const minQty = row['primaryDemand'];
      const totalQty = row['totalQty'];
      const type = row['type']; // Assuming 'type' is the column name for the type of clamp //

      // Added validation for 'type' column //
      if (!type || type.toString().trim() === '') {
        validationErrors.push(`Row ${rowIndex + 1}: 'Type' cannot be empty.`);
      }

      if (!manufacturerPart || manufacturerPart.toString().trim() === '') {
        validationErrors.push(`Row ${rowIndex + 1}: 'Manufacturer Part #' cannot be empty.`);
      }

      if (manufacturerPart) {
        if (manufacturerPartSet.has(manufacturerPart)) {
          validationErrors.push(`Duplicate Manufacturer Part # found at Row ${rowIndex + 1}: '${manufacturerPart}'.`);
        } else {
          manufacturerPartSet.add(manufacturerPart);
        }
      }

      if (minQty === null || minQty === undefined || minQty === '') {
        validationErrors.push(`Row ${rowIndex + 1}: 'Min Quantity (Primary)' cannot be empty.`);
      }

      if (totalQty === null || totalQty === undefined || totalQty === '') {
        validationErrors.push(`Row ${rowIndex + 1}: 'Total Quantity Provided' cannot be empty.`);
      }

      if (typeof minQty !== 'number' || isNaN(minQty)) {
        validationErrors.push(`Row ${rowIndex + 1}, Column 'Min Quantity (Primary)': Value '${minQty}' is not a valid numeric value.`);
      }

      if (typeof totalQty !== 'number' || isNaN(totalQty)) {
        validationErrors.push(`Row ${rowIndex + 1}, Column 'Total Quantity Provided': Value '${totalQty}' is not a valid numeric value.`);
      }
    });

    if (validationErrors.length > 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Errors',
        detail: validationErrors.join('\n'),
        life: 10000,
      });
    }

    return validationErrors;
  };

  // this function will detect check and uncheck row from clamp summary and control line grids
  onSelectionChanged() {
    const selectedRows = this.gridApi.getSelectedRows();
    this.selectedRowForDelete = selectedRows;
  }

  // initiliazation of ag grid
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.autoSizeAllColumns();

  }

  /**
   * Automatically adjusts the column widths based on the content.
   */
  autoSizeAllColumns() {
    const allColumnIds: string[] = [];
    this.gridColumnApi.getAllColumns().forEach((column: any) => {
      allColumnIds.push(column.getId());
    });
    this.gridColumnApi.autoSizeColumns(allColumnIds);
  }
  // this function will delete  the selected row from control line and clamp grid
  onDelete() {

    this.deletePopupContent = 'Are you sure you want to delete selected row data?';
    this.displayDeleteComponentDialog = true;
    this.isdocumentDelete = false;
  }
  // this function will delete only clamp and control line summary data.
  deleteExcelData() {
    this.spinner.show();
    this.bulkUploadService.softDeleteSchematicClamps(this.selectedRowForDelete).subscribe({
      next: (resp: any) => {
        if (resp) {
          this.spinner.hide();
          // Refresh the table or perform any additional actions
          this.getschematicClampandControlLine();
          this.closeDeleteDialog();
          this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'records deleted!' });
        }
        else {
          this.spinner.hide();
          this.messageService.add({ severity: 'error', summary: 'Failed', detail: resp.message });
        }
      },
      error: () => {
        this.spinner.hide();
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Failed to delete document!' });
      }
    });
  }

  uploadCVXPODocument(uploadFileData: File) {
    let counter = 0;
    const filesLength = this.filesList.length;

    this.spinner.show();
    this.uploadedfileName = '';
    let folderName=''
    if(this.appId == 2)
       {
      folderName = DocumentStoreType.Thor;
    }
    let key = folderName + '/' + uploadFileData.name;
    const type = uploadFileData.type;

    this.s3BucketService.getPresignedUploadUrl({ key: key, isPut: true, contentType: uploadFileData.type }).subscribe({
      next: (s3Url: any) => {

        if (!s3Url || !s3Url.url) {
          this.spinner.hide();
          this.messageService.add({ severity: 'error', detail: "Failed to get presigned URL!" });
          return;
        }

        this.s3BucketService.uploadFile(s3Url.url, uploadFileData).subscribe({
          next: (uploadResp: any) => {
            if (uploadResp) {
              const uploadFileData: DocumentInfo = {
                userIdCreatedBy: this.userDetail.uid,
                userIdLastModifiedBy: this.userDetail.uid,
                documentTypeId: this.currentDocumentTypeId,
                entityId: this.entityId.toString(),
                shortDescription: key,
                contentType: type,
                functionId: this.functionId,
                appId: this.appId,
                folderName: this.appId == 2 ? DocumentStoreType.Thor: '',

              };
              this.cvxpoService.uploadCVXPODocument(uploadFileData).subscribe({
                next: (resp: DocumentInfo) => {
                  if (resp) {
                    counter++; // update counter to trigger next document
                    this.spinner.hide();
                    this.messageService.add({ severity: 'success', detail: "Upload files successfully!" });
                    this.getDocuments();
                  } else {
                    this.spinner.hide();
                    this.messageService.add({ severity: 'error', detail: "Failed to upload file to API!" });
                  }
                },
                error: () => {
                  this.spinner.hide();
                  this.uploadFileData = [];
                  this.uploadedfileName = '';
                  this.messageService.add({ severity: 'error', detail: "CVXPo file Manipulation failed!" });
                }
              })
            }
          },
          error: (error: any) => {
            this.spinner.hide();
            this.uploadFileData = [];
            this.uploadedfileName = '';
            this.messageService.add({ severity: 'error', detail: "Failed to upload file to S3!" });

          }

        });

      },
      error: (error: any) => {
        this.spinner.hide();
        this.uploadFileData = [];
        this.uploadedfileName = '';
        this.messageService.add({ severity: 'error', detail: error?.error ?? "Failed to get presigned URL!" });
        return;
      }
    });

  }

  SaveDocumentInfo(documentInfo: DocumentInfo) {
    // Prepare payload as per DocumentInfo interface
    this.documentService.SaveDocumentInfo(documentInfo).subscribe({
      next: (resp: DocumentInfo) => {

        this.getDocuments();
      },
      error: (err: any) => {
        this.spinner.hide();
        console.error('Error saving document info', err);
      }
    });
  }

  getPreSignedUrl(key: string, contentType: string, isPut: boolean = true) {
    this.s3BucketService.getPresignedUploadUrl({ key: key, isPut: isPut, contentType: contentType }).subscribe({
      next: (s3Url: any) => {
        if (!s3Url || !s3Url.url) {
          this.spinner.hide();
          this.messageService.add({ severity: 'error', detail: "Failed to get presigned URL!" });
          return;
        }
        this.s3BucketService.downloadFile(s3Url.url).subscribe({
          next: (downloadResp: Blob) => {

            const url = window.URL.createObjectURL(downloadResp);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = key.split('/').pop();
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(url); // Clean up

          }

        });

      },
      error: (error) => {
       this.spinner.hide();
          this.uploadFileData = [];
          this.uploadedfileName = '';
          this.messageService.add({ severity: 'error', detail: error?.error ?? "Failed to get presigned URL!" });
          return;
      }
    });
  }

}


