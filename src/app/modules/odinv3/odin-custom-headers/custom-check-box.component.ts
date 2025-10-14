import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-include-exclude-checkbox-renderer',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  template: `
    <input type="checkbox"
           [checked]="params.value === 'Include'"
           (change)="onCheckboxChanged($event)" />
  `,
  styles: [`
    input {
      transform: scale(1.2);
    }
  `]
})
export class IncludeExcludeCheckboxRendererComponent implements ICellRendererAngularComp {
  params: any;

  agInit(params: any): void {
    this.params = params;
  }

  refresh(params: any): boolean {
    this.params = params;
    return true;
  }

  onCheckboxChanged(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const newValue = isChecked ? 'Include' : 'Exclude';
    this.params.node.setDataValue(this.params.colDef.field, newValue);
  }
}
