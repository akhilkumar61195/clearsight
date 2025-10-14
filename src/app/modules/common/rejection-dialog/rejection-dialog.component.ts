import { Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { MessageService } from 'primeng/api';
import { LookupsService } from '../../../services/lookups.service';
import { Reason } from '../../../common/model/reason';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';


@Component({
  selector: 'app-reject-schematic',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './rejection-dialog.component.html',
  styleUrl: './rejection-dialog.component.scss'
})
export class RejectSchematicComponent implements OnInit {

 @Input() displayRejectSchematicDialog: boolean = false; // Controls dialog visibility
 @Output() onClose = new EventEmitter<number>();
 @Input()schematicDetailId:number;
 rejectSchematicForm!: FormGroup;
 reasonTypes: Reason[] = [];
 userDetail: any;
  constructor(private fb: FormBuilder, private authService: AuthService,
    private messageService: MessageService,
    private completionSchematicService: CompletionschematicService,
    private lookupService:LookupsService) {
    this.userDetail = this.authService.getUserDetail();
  }

  ngOnInit() {
     
       this.rejectSchematicForm = this.fb.group({
         reasonId: ['', Validators.required],
         rejectionNotes: [''],
         userIdModifiedBy: this.userDetail.uid,
         statusId: [3],
         schematicsID:this.schematicDetailId
       } );
  }
  // Method for submitting the Create SchematicForm
    submitRejectSchematicForm(): void {
      if (this.rejectSchematicForm.valid) {
       
        const payload = this.rejectSchematicForm.value; // Prepare the payload
        this.completionSchematicService.updateStatusSchematicSelection(payload).subscribe({
          next: (response) => {
            this.cancelSchematic(payload.statusId);
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Schematic has been rejected' });
     
          },
          error: (wellError) => {
            this.cancelSchematic();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: wellError });
            
          }
        });

      }
    
    }
  getReasonTypes() {
    // this.getWellHeaderData();
    this.lookupService.getReasonTypes().subscribe({
      next: (resp: any) => {
        
        if (resp) {
         this.reasonTypes = resp;
          
        }
        else {

        }
      },
      error: () => {
      

      }
    });
  }
  cancelSchematic(statusId?:number) {
    this.onClose.emit(statusId);
    this.rejectSchematicForm.reset();
  }
}
