import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
    imports: [...PRIME_IMPORTS],
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrls: ['./delete-confirmation-dialog.component.scss']
})
export class DeleteConfirmationDialogComponent {
 @Input() displayDeleteComponentDialog: boolean = false; // Controls dialog visibility
  // displaydeleteComponents: boolean = true;
  @Output() onClose = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
  @Input() buttonName = new EventEmitter<void>();
  @Input() dialogTitle:string;
  @Input() dialogContent:string;
  deleteConfirmationTitle='Are you Sure You Want to delete';
  onCancel(){
    this.onClose.emit();
  }
  deleteDocument(){
    this.onDelete.emit();
  }
}
