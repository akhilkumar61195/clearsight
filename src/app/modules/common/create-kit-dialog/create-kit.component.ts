import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Form, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WellheadkitstoreService } from '../../odinv3/wellhead/builder/wellheadkitbuilder.service';
import { AuthService } from '../../../services/auth.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { CustomDialogComponent } from '../custom-dialog/custom-dialog.component';

@Component({
    selector: 'app-create-kit',
    standalone: true,
    imports: [...PRIME_IMPORTS , CustomDialogComponent],
    templateUrl: './create-kit.component.html'
})
export class CreateKitComponent implements OnInit {
    @Input() visible: boolean = false; // Input to control dialog visibility
    @Output() onClose = new EventEmitter<void>(); // Event emitter for dialog close
    kitName: string = ''; // Holds the entered kit name
    kitForm: FormGroup; // Form group for the kit form
    userDetail: any; // Holds user details
    showConfirmationDialog: boolean = false; // Flag to show confirmation dialog

    constructor(private fb: FormBuilder, private store: WellheadkitstoreService,
        private authService: AuthService) {
        this.userDetail = this.authService.getUserDetail();
    }

    ngOnInit() {
        this.initializeForm(); // Initialize the form on component initialization
    }

    initializeForm(): void {
        this.kitForm = this.fb.group({
            kitName: ['',Validators.required] // Form control for kit name with required validation,
        });
    }

    // Method to close the dialog
    closeDialog() {
        this.visible = false;
        this.onClose.emit(); // Emit the close event
    }

    onOpenConfirmationDialog() {
        this.showConfirmationDialog = true;
    }
    // Method to handle the creation of the kit
    handleCreate() {
        if (this.kitForm.valid) { // Check if the form is valid
            // payload to be sent to the store
            const payload = {
                id: 0,
                kitType: this.kitForm.value.kitName,
                userId: this.userDetail.uid,
                isDeleted: 0,
            };
            this.store.createKit(payload); // Call the store to create a kit
            this.closeDialog();
            this.closeConfirmationDialog(); // Close the confirmation dialog
        }
    }

    closeConfirmationDialog() {
     this.showConfirmationDialog = false; // Close the confirmation dialog
    }
}