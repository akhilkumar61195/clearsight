import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';


@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onContinue = new EventEmitter<void>();
  @Input() countinueButtonName = 'Continue';
  @Input() cancelButtonName = 'Cancel';
  @Input() continueButtonClass: string = 'continueBtnColor';
  @Input() iconColor: string = 'iconSize';
  @Input() cancelButtonVisibile: boolean = false;
  @Input() dialogTitle: string = 'Confirm';
  @Input() dialogContent: string = 'Are you Sure You Want to Continue';

  cancel() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.onCancel.emit();
  }

  continue() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.onContinue.emit();
  }
}
