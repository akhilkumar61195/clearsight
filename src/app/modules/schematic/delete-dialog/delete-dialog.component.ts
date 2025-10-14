import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SchematicDetailDto } from '../../../common/model/schematic-detail-dto';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-delete-dialog',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.scss'
})
export class DeleteDialogComponent implements OnInit{
  @Input() displayDeleteComponentSchemanticDialog: boolean = false; // Controls dialog visibility
  @Input() message: string;
  // displaydeleteComponents: boolean = true;
  @Output() onClose = new EventEmitter<void>();
  @Output() componentDeleted = new EventEmitter<void>();

  @Input() componentData: SchematicDetailDto;
  deleteConfirmationTitle='Are you Sure You Want to delete';
  ngOnInit(): void {
   // console.log('13',this.componentData)
  }
  close(){
    this.displayDeleteComponentSchemanticDialog = false;
    this.onClose.emit();
  }
  deleteComponents(){
    this.componentData.isDeleted =1;
    this.displayDeleteComponentSchemanticDialog = false;
    this.componentDeleted.emit(); 
    this.onClose.emit();
  }

  cancelComponents(){
    this.onClose.emit();
  }
}
