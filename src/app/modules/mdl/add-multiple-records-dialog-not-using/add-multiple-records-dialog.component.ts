import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { InventoryService } from '../../../services/inventory.service';
import { masterdatalibraryModelTable } from '../../../common/model/masterdatalibraryModelTable';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';


@Component({
  selector: 'app-add-multiple-records-dialog',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './add-multiple-records-dialog.component.html',
  styleUrl: './add-multiple-records-dialog.component.scss',
  providers: [ConfirmationService],
})
export class AddMultipleRecordsDialogComponent {
  @Input() visible: boolean = false; // To receive the visibility flag from the parent
  @Output() onClose = new EventEmitter<void>(); // To notify the parent to close the dialog
  @Output() onSave = new EventEmitter<masterdatalibraryModelTable[]>();  // To notify the parent to save the record
  @Output() onSaveAndClose = new EventEmitter<masterdatalibraryModelTable[]>();  // To notify the parent to save the record
  addRecordForm: FormGroup;
  newmdlRecord: masterdatalibraryModelTable = new masterdatalibraryModelTable();
  newmdlRecords: masterdatalibraryModelTable[];
  originalRecord: masterdatalibraryModelTable = new masterdatalibraryModelTable();  // To store the original state
  cancelVisible: boolean = false;

  // Initialize newRecord and originalRecord
  initNewRecord(initValues: Partial<masterdatalibraryModelTable> = {}) {
    this.newmdlRecord = new masterdatalibraryModelTable(initValues);
    this.originalRecord = new masterdatalibraryModelTable(initValues); // Store the initial state
  }
  // Check if any changes have been made
  hasUnsavedChanges(): boolean {
    return JSON.stringify(this.newmdlRecord) !== JSON.stringify(this.originalRecord);
  }


  constructor(private fb: FormBuilder, private confirmationService: ConfirmationService, private inventoryService: InventoryService) {
    //this.addRecordForm = this.fb.group(this.newmdlRecord);
  
    this.addRecordForm = this.fb.group({records: this.fb.array([this.newmdlRecord])});
  }

  // Method to close the dialog
  closeDialog() {
    if (this.hasUnsavedChanges()) {
      this.cancelVisible = true;
      //if (confirm('You have unsaved changes. Do you really want to close?')) {
      //  this.onClose.emit();
      //}
    } else {
      this.onClose.emit();
    }
  }
  cancel() {
    this.cancelVisible = false;
  }

  saveRecordAndClose() {
    this.onSaveAndClose.emit(this.newmdlRecords);
  }

  // Method to save the record
  saveRecord() {
    this.onSave.emit(this.newmdlRecords);
    this.newmdlRecord = new masterdatalibraryModelTable();
  }
  okClick() {
    this.cancelVisible = false;
    this.onClose.emit();
  }

  // Method to handle dialog close
  onHide() {
    this.newmdlRecord = new masterdatalibraryModelTable();
  }

  resetDialog() {
    this.newmdlRecord = new masterdatalibraryModelTable();
  }


  

  get records(): FormArray {
    return this.addRecordForm.get('records') as FormArray;
  }

  createRecord(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(1)]],
      address: ['', Validators.required]
    });
  }

  addRecord(): void {
    this.records.push(this.createRecord());
  }

  removeRecord(index: number): void {
    this.records.removeAt(index);
  }

  onSubmit(): void {
    if (this.addRecordForm.valid) {
      // Here you would handle form submission, such as sending to a backend API
      this.resetForm();
      //this.displayAddRecordDialog = false; // Close dialog after saving
    }
  }

  resetForm(): void {
    this.addRecordForm.reset();
    this.records.clear();
    this.addRecord();  // Add back an empty record
  }
}
