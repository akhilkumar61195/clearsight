import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonService } from '../../../services/common.service';
import { Router } from '@angular/router';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-select-well-thor',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './select-well-thor.component.html',
  styleUrl: './select-well-thor.component.scss'
})
export class SelectWellThorComponent {
  @Input() display: boolean = true;
  @Input() isFilterBTNDisabled: boolean = false;
  @Input() functionId: number | null = null;
  @Input() viewOptions: any[] = [];
  @Input() projects: any[] = [];
  @Input() isFilter: boolean = false;
  @Input() selectedWellId: any;
  @Input() selectedWellNumber: any;
  @Input() searchTerm: string = '';
  @Output() displayChange = new EventEmitter<boolean>();
  @Output() updateFilter = new EventEmitter<void>();
  @Output() searchWellFilter = new EventEmitter<void>();
  @Output() toggleProjectWells = new EventEmitter<any>();
  @Output() onViewSelectionChange = new EventEmitter<void>();
  continueClicked: boolean = false;


  constructor(private commonService: CommonService, private router:Router) {}

  ngOnInit() {
    this.commonService.searchTerm$.subscribe(searchTerm => {
      this.searchTerm = searchTerm;
    });
  }
  handleViewSelectionChange(event: any) {
    const selectedOption = event.value;  
    this.onViewSelectionChange.emit(selectedOption);
  }
  onSearchTermChange() {
    this.commonService.updateSearchTerm(this.searchTerm);
  }
  onContinue(){
    this.continueClicked = true;
    this.updateFilter.emit();  // Emit filter update
  }

  closeSidebar() {
    if(this.continueClicked && this.selectedWellId){
      this.display = false;
      this.displayChange.emit(this.display);
    } else {
      this.router.navigate(['app-selector']);
    }
    
  }
  
}
