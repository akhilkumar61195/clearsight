import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { MoveToTasksDialogComponent } from '../move-to-tasks-dialog/move-to-tasks-dialog.component';
import { CommonDisplayMessages } from '../../../common/enum/common-enum';

@Component({
  selector: 'app-move-email',
  standalone: true,
  imports: [...PRIME_IMPORTS, MoveToTasksDialogComponent],
  templateUrl: './move-email.component.html',
  styleUrl: './move-email.component.scss',
})
export class MoveEmailComponent {
  @Input() displayDeleteComponentDialog: boolean = false; // Controls dialog visibility
  @Output() onClose = new EventEmitter<void>();
  @Input() dialogTitle: string;
  @Input() dialogContent: string;
  showTasksDialog: boolean;
  moveToTaskContent = CommonDisplayMessages.moveToTaskConfirmation;

  // Closes the popup
  onCancel() {
    this.onClose.emit();
  }

  moveToTasks() {
    this.showTasksDialog = true;
  }
}
