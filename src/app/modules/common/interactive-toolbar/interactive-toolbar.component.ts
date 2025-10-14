import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { ConfigurationValues } from '../../../common/model/configuration-values';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-interactive-toolbar',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './interactive-toolbar.component.html',
  styleUrls: ['./interactive-toolbar.component.scss']
})
export class InteractiveToolbarComponent implements OnInit {
  @Output() search = new EventEmitter<Event>();
  @Output() saveClick = new EventEmitter<void>();
  @Output() cancelClick = new EventEmitter<void>();
  @Output() createPersonaClick = new EventEmitter<void>();
  @Output() createUserClick = new EventEmitter<void>();
  @Output() supplierSelected = new EventEmitter<any>();
  @Output() statusSelected = new EventEmitter<any>();
  @Input() showSave: boolean = true;
  @Input() showCancel: boolean = true;
  @Input() showSupplierFilter: boolean = false;
  @Input() showStatusFilter: boolean = false;
  @Input() showCompletedCheckBox: boolean = false;
  @Input() showSearchBar: boolean = false;
  supplierList: Array<ConfigurationValues> = [];
  statusList: Array<ConfigurationValues> = [];
  statusSelectedValues: any[] = [];
  supplierSelectedValues: any[] = [];
  @Output() completedChanged = new EventEmitter<any>();
  includeCompleted: boolean = false;

  constructor(private configurationValuesService: ConfigurationValuesService) { }

  ngOnInit() {
    this.getSupplierList();
    this.getStatusList();
  }

  onSupplierChange(event: any) {
    // event.value is array of selected supplier ids
    const selectedSuppliers = this.supplierList.filter(supplier =>
      event.value.includes(supplier.id)
    );
    this.supplierSelected.emit(selectedSuppliers);
  }

  clearSupplierSelection() {
    this.supplierSelectedValues = [];
    this.supplierSelected.emit([]);
  }
  //Called when completed checkbox is changed
  onCompletedCheckboxChange(event: any) {
    this.includeCompleted = event.checked;
    this.completedChanged.emit({ checked: event.checked });
  }

  onStatusChange(event: any) {
    const selectedStatuses = this.statusList.filter(status =>
      event.value.includes(status.id)
    );
    this.statusSelected.emit(selectedStatuses);
  }

  clearStatusSelection() {
    this.statusSelectedValues = [];
    this.statusSelected.emit([]);

  }
  /**
   * Fetches the list of Supplier from the configuration values service.
   */
  getSupplierList() {
    this.configurationValuesService.getAllEntities('configvalue', 'Supplier').subscribe({
      next: (response) => {
        this.supplierList = response;
      },
      error: (error) => {
      }
    });
  }

  /**
   * Fetches the list of Supplier from the configuration values service.
   */
  getStatusList() {
    this.configurationValuesService.getAllEntities('configvalue', 'Invoice Status').subscribe({
      next: (response) => {
        this.statusList = response;
      },
      error: (error) => {
      }
    });
  }

  onSearch(event: Event) {
    this.search.emit(event);
  }

  onSave() {
    this.saveClick.emit();
  }

  onCancel() {
    this.cancelClick.emit();
  }

  onCreatePersona() {
    this.createPersonaClick.emit();
  }

  onCreateUser() {
    this.createUserClick.emit();
  }
}
