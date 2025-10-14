import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged } from 'rxjs';
import { RawDataVisualizations } from '../../../common/enum/common-enum';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { OdinTabComponent } from '../odin-tab/odin-tab.component';
import { OdinDdlComponent } from './odin-ddl/odin-ddl.component';
import { OdinSapUnitCostComponent } from './odin-sap-unit-cost/odin-sap-unit-cost.component';
import { OdinValluorecComponent } from './odin-valluorec/odin-valluorec.component';
import { OdinGroupedInventoryComponent } from './odin-grouped-inventory/odin-grouped-inventory.component';
import { OdinInventoryComponent } from './odin-inventory/odin-inventory.component';
import { OdinTenarisComponent } from './odin-tenaris/odin-tenaris.component';
import { OdinLHandWellHeadComponent } from './odin-l-hand-well-head/odin-l-hand-well-head.component';
import { WellheadOrdersComponent } from './wellhead-orders/wellhead-orders.component';
import { OdinYardInventoryComponent } from './odin-yard-inventory/odin-yard-inventory.component';

@Component({
  selector: 'app-odin-raw-data',
  standalone:true,
  imports:[PRIME_IMPORTS,
    OdinTabComponent,
    OdinDdlComponent,
    OdinSapUnitCostComponent,
    OdinValluorecComponent,
    OdinGroupedInventoryComponent,
    OdinInventoryComponent,
    OdinTenarisComponent,
    OdinLHandWellHeadComponent,
    WellheadOrdersComponent,
    OdinYardInventoryComponent

  ],
  templateUrl: './odin-raw-data.component.html',
  styleUrl: './odin-raw-data.component.scss'
})
export class OdinRawDataComponent implements OnInit, OnDestroy {
    selectedView: string = RawDataVisualizations.UnitCost;
    textValue: string = '';
    dropdownValue: string = '';
    Breakpoints = Breakpoints;
    currentBreakpoint: string = '';
    selectedRawView:number=1;
    resetFlag: number = 0; // Flag to trigger reset in child component
    readonly breakpoint$ = this.breakpointObserver
      .observe([
        Breakpoints.Large,
        Breakpoints.Medium,
        Breakpoints.Small,
        '(min-width: 500px)',
      ])
      .pipe(distinctUntilChanged());
      constructor(
        private breakpointObserver: BreakpointObserver
      ) {
        
      }

        ngOnInit(): void {
          
          this.selectedView = localStorage.getItem('selectedVisualization');
          this.dropdownValue = this.selectedView;
      
      
        }
      
        updateValues(values: { text: string; option: string }) {
          this.textValue = values.text;
          this.dropdownValue = values.option;
        }
      
        get selectedVisualization() {
          this.selectedView = localStorage.getItem('selectedVisualization');
          return localStorage.getItem('selectedVisualization');
        }
      
        ngOnDestroy() {
          localStorage.setItem('selectedVisualization', RawDataVisualizations.UnitCost);
        }
 
}
