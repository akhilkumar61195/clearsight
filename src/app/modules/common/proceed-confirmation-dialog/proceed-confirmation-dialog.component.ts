import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-proceed-confirmation-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './proceed-confirmation-dialog.component.html',
  styleUrl: './proceed-confirmation-dialog.component.scss'
})
export class ProceedConfirmationDialogComponent {
  @Input() displayProceedComponentDialog: boolean = false; // Controls dialog visibility
  @Output() onClose = new EventEmitter<void>();
  @Output() onProceed = new EventEmitter<void>();

  deleteConfirmationTitle=`The associated well demand will be deleted. Are you sure you want to proceed?`;
  onCancel(){
    this.onClose.emit();
  }
  proceedData(){
    this.onProceed.emit();
  }
}
