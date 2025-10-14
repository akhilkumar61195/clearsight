import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged } from 'rxjs';
import { RawDataVisualizations } from '../../../common/enum/common-enum';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { OdinTabComponent } from '../odin-tab/odin-tab.component';
import { OdinCompletionDdlComponent } from './odin-completion-ddl/odin-completion-ddl.component';
import { OdinCompletionMitiComponent } from './odin-completion-miti/odin-completion-miti.component';
import { OdinInventoryComponent } from '../odin-raw-data/odin-inventory/odin-inventory.component';

/**
 * Component for displaying raw data visualizations in the Odin Completion module.
 * It allows users to select different views of raw data and updates the view based on user selection.
 */
@Component({
  selector: 'app-odin-completion-raw-data',
  standalone:true,
  imports:[...PRIME_IMPORTS, OdinTabComponent, OdinCompletionDdlComponent,OdinCompletionMitiComponent,OdinInventoryComponent],
  templateUrl: './odin-completion-raw-data.component.html',
  styleUrl: './odin-completion-raw-data.component.scss'
})
/**
 * Class representing the OdinCompletionRawDataComponent.
 * Implements OnInit and OnDestroy lifecycle hooks to manage component initialization and cleanup.
 */
export class OdinCompletionRawDataComponent implements OnInit, OnDestroy {
  selectedView: string = RawDataVisualizations.Miti;
  textValue: string = '';
  dropdownValue: string = '';
  Breakpoints = Breakpoints;
  currentBreakpoint: string = '';
  selectedRawView: number = 2;
  readonly breakpoint$ = this.breakpointObserver
    .observe([
      Breakpoints.Large,
      Breakpoints.Medium,
      Breakpoints.Small,
      '(min-width: 500px)',
    ])
    .pipe(distinctUntilChanged());

  /**
   * Constructor for OdinCompletionRawDataComponent.
   * @param breakpointObserver - The BreakpointObserver instance for handling responsive layouts.
   */
  constructor(
    private breakpointObserver: BreakpointObserver
  ) {

  }

  /**
   * Lifecycle hook that is called after the component has been initialized.
   * It retrieves the selected visualization from local storage and sets the dropdown value accordingly.
   */
  ngOnInit(): void {

    this.selectedView = localStorage.getItem('selectedVisualization');
    this.dropdownValue = this.selectedView;
  }

  /**
   * 
   * @param values - An object containing text and option values to update the component's state.
   * This method updates the text and dropdown values based on the provided values.
   */
  updateValues(values: { text: string; option: string }) {
    this.textValue = values.text;
    this.dropdownValue = values.option;
  }

  /**
   * Getter for the selected visualization.
   * It retrieves the selected visualization from local storage.
   */
  get selectedVisualization() {
    this.selectedView = localStorage.getItem('selectedVisualization');
    return localStorage.getItem('selectedVisualization');
  }

  /**
   * Lifecycle hook that is called when the component is about to be destroyed.
   * It saves the currently selected visualization to local storage.
   */
  ngOnDestroy() {
    localStorage.setItem('selectedVisualization', RawDataVisualizations.UnitCost);
  }
}
