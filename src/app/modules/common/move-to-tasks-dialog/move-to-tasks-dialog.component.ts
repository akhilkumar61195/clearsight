import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { CreateTaskDialogComponent } from '../../tyr2/create-task-dialog/create-task-dialog.component';
import { CommonDisplayMessages } from '../../../common/enum/common-enum';

@Component({
  selector: 'app-move-to-tasks-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS, CreateTaskDialogComponent],
  templateUrl: './move-to-tasks-dialog.component.html',
  styleUrl: './move-to-tasks-dialog.component.scss',
})
export class MoveToTasksDialogComponent {
  @Input() showTasksDialog: boolean;
  dialogTitle = CommonDisplayMessages.moveToTasksHeader;
  showExistingTasksDialog: boolean;
  wellsList = [];
  @Output() onCancel = new EventEmitter<void>();
  @Input() dialogContent: string;

  displayTaskModal() {
    this.showExistingTasksDialog = true;
  }

  onClose() {
    this.onCancel.emit();
  }

  closeCreateTaskDialog() {
    this.showTasksDialog = false;
  }
}
