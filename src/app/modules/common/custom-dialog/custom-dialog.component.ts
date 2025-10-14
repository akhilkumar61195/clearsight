import { Component, EventEmitter, Input, Output } from '@angular/core';
import { S3BucketService } from '../../../services/document-service/s3-bucket.service';
import { MessageService } from 'primeng/api';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ExcelService } from '../../../services/excel-column-service/excel.service';
@Component({
  selector: 'app-custom-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './custom-dialog.component.html',
})
export class CustomDialogComponent {
  @Input() visible: boolean = false; // Controls the visibility of the dialog
  @Input() title: string; // Title of the dialog
  @Input() description: string; // Description displayed in the dialog
  @Input() downloadTemplateLink: string; // Link to download the template file
  @Input() buttonName: string; // Name of the button (e.g., "Create", "Save", etc.)
  @Output() onClose = new EventEmitter<void>(); // Event emitted when the dialog is closed
  @Output() onCreateEvent = new EventEmitter<void>(); // Event emitted when the button is clicked
  @Output() onOtherEvent = new EventEmitter<void>(); // Event emitted when the button is clicked
  @Input() dialogTitle: string;
  @Input() selectedView: number;
  @Input() maximizable: boolean = true; // Whether the dialog can be maximized
  @Input() wellDocumentTypes: any;
  @Input() savebuttonName: string;
  @Input() otherbuttonName: string;
  @Input() dialogWidth: string = '100vh';
  @Input() savebuttonDisabled: boolean = false;


  @Input() showingSelectedView: boolean = false; // it will show or hide secleted button view on the basis of requiement
  @Output() onSelectedView = new EventEmitter<string>(); // Event emitted when the button is clicked
  constructor( private messageService: MessageService,private s3BucketService: S3BucketService, private excelService: ExcelService) {
  }
  closeDialog() {
    this.onClose.emit();
  }

  onCreate() {
    this.onCreateEvent.emit(); // Emit the event when the button is clicked
  }

  /**
 * It will detected other button click event
 */
  onOtherClick() {
    this.onOtherEvent.emit();
  }

  /**
 * It will detected selected button change event
 */

  onViewSelectionChange() {

    this.dialogTitle = this.wellDocumentTypes.find(x => x.id === this.selectedView)?.name;
    this.onSelectedView.emit(this.dialogTitle);
  }

  downloadTemplate() {
    const key = this.downloadTemplateLink;
    this.excelService.downloadTemplate(key);
  }
}