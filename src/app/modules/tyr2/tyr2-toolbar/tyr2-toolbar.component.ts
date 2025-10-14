import {
  Component,
  effect,
  OnDestroy,
  OnInit,
  WritableSignal,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ListEditorBuilderService } from '../../common/builders/list-editor-builder.service';
import { WellsDetailsTYRDialogComponent } from '../Well-details-interactive-dialog/Well-details-interactive-dialog.component';
import { ChangeLogComponent } from '../../common/dialog/change-log.component';
import { CreateInvoiceDialogComponent } from '../create-invoice-dialog/create-invoice-dialog.component';
import { DropDownOptions } from '../../../common/model/taskManagementModel';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { CommonTyrBuilderService } from '../services/common-tyr-builder.service';
import { SelectedWellBuilderService } from '../services/selected-well-builder.service';
import { InvoiceBuilderService } from '../invoice-management/Service/invoice-builder.service';

@Component({
  selector: 'app-tyr2-toolbar',
  templateUrl: './tyr2-toolbar.component.html',
  styleUrl: './tyr2-toolbar.component.scss',
  standalone: true,
  imports: [
    ...PRIME_IMPORTS,
    WellsDetailsTYRDialogComponent,
    ChangeLogComponent,
    CreateInvoiceDialogComponent,
    RouterModule
  ],

})
export class Tyr2ToolbarComponent implements OnDestroy, OnInit {
  isInvoiceManagementActive(): boolean {
    // Checks if the current route contains 'invoice'
    return this.router.url.includes('invoice');
  }

  isInvoiceListEditorActive(): boolean {
    // Checks if the current route contains 'list-editor'
    return this.router.url.includes('tyr-list-editor');
  }

  isInboxActive(): boolean {
    // Checks if the current route contains 'inbox'
    return this.router.url.includes('inbox');
  }

  isTaskActive(): boolean {
    // Checks if the current route contains 'tyr2Dashboard'
    return this.router.url.includes('tyr2Dashboard');
  }
  // Adding the sigbnal to check whether the select well button clicked or not to fix pop up issue
  storeWellSelectButtonClicked: WritableSignal<boolean> =
    this.selectedWellBuilderService.wellSelectButtonClicked;
  wellSelectButtonClicked: boolean = false;
  displayWellDetailsDialog: boolean = false;
  openChangeLog: boolean = false; //show/hide change log component
    selectedView: number = 1; // to check which view selected(drilling/completion)
    displayCreateInvoiceDialog: boolean = false; // show/hide create invoice dialog
  // Grid expansion state - access from service
  isRightGridExpanded: WritableSignal<boolean> =
    this.commonTyrBuilderService.isRightGridExpanded;
  comparatorMode: WritableSignal<boolean> =
    this.commonTyrBuilderService.isComparatorViewSelected; // Well comparator view signal
  selectedWells: WritableSignal<number> =
    this.selectedWellBuilderService.comparisonWellNumber; // Selected wells array signal via well selector
  currentMenuPage: string = '';
  viewOptionsButtons: DropDownOptions[];
  constructor(
    private selectedWellBuilderService: SelectedWellBuilderService,
    private commonTyrBuilderService: CommonTyrBuilderService,
    private router: Router,
    private listEditorBuilderService: ListEditorBuilderService,
    private invoiceEvents: InvoiceBuilderService
  ) {
    router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((data: NavigationEnd) => {
        this.currentMenuPage = data.url.split('/')[2];
      });
    effect(() => {
      this.wellSelectButtonClicked = this.storeWellSelectButtonClicked();
      this.viewOptionsButtons = this.listEditorBuilderService.listEditorOptionsButtons(); // Gets all the options from the api for tyr dropdown
      this.selectedView = this.listEditorBuilderService.selectedView();
    });
  }
  ngOnInit(): void {
    this.listEditorBuilderService.selectedListOption.set(1); // By default tyr module option selected
    // Calling the listeditor api to get the options
    this.getListEditorOptions();
  }

  // Get the list of options
  getListEditorOptions() {
    this.listEditorBuilderService.getListEditorOptions(); // Calling the function from builder service
  }

  ngOnDestroy(): void {
     this.listEditorBuilderService.selectedListOption.set(-1);
  }

  // Function to open the sidebar on selectwell click
  openSidebar() {
    this.storeWellSelectButtonClicked.set(true);
    this.selectedWellBuilderService.display.set(true);
  }
    showCreateInvoiceDialog() {
      this.displayCreateInvoiceDialog = true;
    }
    closeCreateInvoiceDialog() {
      this.displayCreateInvoiceDialog = false;
    }
  showWellFeaturesDialog() {
    this.displayWellDetailsDialog = true;
  }
  closeWellDetailsDialog() {
    this.displayWellDetailsDialog = false;
    // this.selectedWellBuilderService.display.set(false);
  }

  // Dropdown selection method
  onViewChange(selectedValue: number): void {
    this.listEditorBuilderService.selectedListOption.set(selectedValue);
    this.listEditorBuilderService.getConfiguartions();
  }

  // Well comparator button click toggle function
  toggleComparatorView() {
    if (!this.commonTyrBuilderService.isComparatorViewSelected()) {
      this.selectedWellBuilderService.selectedWellId.set(
        this.selectedWellBuilderService.selectedWellId()
      );
      this.storeWellSelectButtonClicked.set(true);
      this.selectedWellBuilderService.display.set(true);
    } else {
      this.commonTyrBuilderService.isComparatorViewSelected.set(false);
    }
  }

  // Search function added
  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.commonTyrBuilderService.selectedFilterText.set(searchTerm); // Update the quick filter text
  }

  // Toggle grid expansion method moved from drilling component
  toggleRightGridExpansion() {
    // Toggle between single grid view (left only) and split view (both grids at 50%)
    this.commonTyrBuilderService.isRightGridExpanded.set(
      !this.commonTyrBuilderService.isRightGridExpanded()
    );
  }

  onInvoiceCreated() {
    this.invoiceEvents.emitInvoiceCreated();
  }
}
