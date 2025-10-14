import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { InventoryService } from '../../../services/inventory.service';
import { SortOrder } from '../../../common/enum/common-enum';
import { defaultRowNumber, paginationRowDD } from '../../../common/constant';
import { ChangeLogService } from '../../../services/changeLog.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'mdl-change-log',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './mdl-change-log.component.html',
  styleUrl: './mdl-change-log.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MdlChangeLogComponent implements OnInit {
  
  @Output() onClose = new EventEmitter<void>();
  visible: boolean = true;
  loading: boolean = true;
  rowOffset: number = 1;
  fetchNextRows: number = 10;
  totalRecords: number = 0;
  rows: number = defaultRowNumber;
  first: any;
  sortBy: string = 'auditId';
  sortDirection: string = SortOrder.DESC;
  changeLogList: Array<any> = [];
  paginationRowDD: any = paginationRowDD;
  changeLogData:any=[];
 

  constructor(
  
    private changelogService: ChangeLogService
  ) {}

  ngOnInit() {
    this.getChangeLogList();
  }

  getChangeLogList() {
    this.loading = true;
  
      this.changelogService.getChangeLogs(this.rowOffset, this.fetchNextRows,'p2_masterDataLibraryTable').subscribe({
        next: (response: any) => {
          this.loading = false;
          this.changeLogData=[];
         // this.changeLogData=response.flatMap(record => record.diffData);
         // this.totalRecords=this.changeLogData.length;
          this.changeLogData=response.items;
          this.totalRecords=response.totalPages;
        },
        error: () => {
          this.loading = false;
          this.changeLogList = [];
          this.totalRecords = 0;
        
        },
      });
 
   
  }
}
