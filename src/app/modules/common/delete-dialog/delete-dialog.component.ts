import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-delete-dialog-common',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.scss'
})
export class DeleteDialogComponent {
  @Input() displayDeleteComponentDialog: boolean = false; // Controls dialog visibility
  // displaydeleteComponents: boolean = true;
  @Output() onClose = new EventEmitter<void>();
  @Input() visible: boolean = false;  // Controls the visibility of the dialog
  @Input() message: string = 'Are you sure you want to delete?';  // Message to show in the dialog
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onDelete: EventEmitter<void> = new EventEmitter<void>();
  cancelComponents() {
    this.onClose.emit();
  }

  deleteComponents() {
    this.onClose.emit();
  }
}
