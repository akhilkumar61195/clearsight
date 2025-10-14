import { Component } from '@angular/core';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { OdinConsumptionValuationComponent } from './odin-consumption-valuation/odin-consumption-valuation.component';

@Component({
  selector: 'app-odin-demand-consumption-valuation',
  standalone:true,
  imports:[...PRIME_IMPORTS, OdinConsumptionValuationComponent],
  templateUrl: './odin-demand-consumption-valuation.component.html',
  styleUrl: './odin-demand-consumption-valuation.component.scss'
})
export class OdinDemandConsumptionValuationComponent3 {
  selectedView: number = 1;
  viewOptions = [{ label: 'Consumption Summary', value: 1 },
  // { label: 'Select Well', value: 2 }
];

  selectedFunction: number = 1;
  functionOptions = [{ label: 'Drilling', value: 1 },
  { label: 'Completion', value: 2 }];

  onViewSelectionChange(event: any) {
    this.selectedView = event.value;
  }
  
  // it will detect which toggle is selected drilling or completion
  onFunctionSelectionChange(event: any) {
    this.selectedFunction = event.value;
  }
}
