import {
  Component,
  effect,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  WritableSignal
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonDisplayMessages } from '../../../common/enum/common-enum';
import { WellsByRig } from '../../../common/model/wells-by-rig';
import { CommonService } from '../../../services/common.service';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';
import { ListEditorBuilderService } from '../../common/builders/list-editor-builder.service';
import { WellHeadersDialogComponent } from '../../common/well-headers/well-headers.component';
import { CommonTyrBuilderService } from '../services/common-tyr-builder.service';
import { SelectedWellBuilderService } from '../services/selected-well-builder.service';

@Component({
  selector: 'app-well-selector',
  templateUrl: './well-selector.component.html',
  styleUrl: './well-selector.component.scss',
  standalone: true,
  imports: [...PRIME_IMPORTS, WellHeadersDialogComponent],
})
export class WellSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() visible: boolean = true;
  @Input() viewOptionsFunctionId: number | null = null;
  @Input() viewOptions: any[] = [];
  @Input() projects: any[] = [];
  @Input() isFilter: boolean = false;
  @Input() selectedWellId: number;
  @Input() selectedWellNumber: number;
  @Input() searchTerm: string = '';
  @Output() displayChange = new EventEmitter<boolean>();
  @Output() updateFilter = new EventEmitter<void>();
  @Output() searchWellFilter = new EventEmitter<void>();
  @Output() toggleProjectWells = new EventEmitter<any>();
  @Output() onViewSelectionChange = new EventEmitter<void>();
  selectedWellNumbers: number[] = [];
  continueClicked: boolean = false;
  allWells = [];
  currentWellName: string = '';
  comparatorWellName: string = '';
  wellSelectButtonClicked: WritableSignal<boolean> =
    this.store.wellSelectButtonClicked; // Adding the signal to check whether the select well button clicked or not
  isVisible: WritableSignal<boolean> = this.store.display; // Adding the signal to check whether the select well button clicked or not
  isComparatorView: WritableSignal<boolean> =
    this.commonTyrBuilderService.isComparatorViewSelected;
  showDraftedWells: boolean;
  draftWellLabel: string = CommonDisplayMessages.draftWells;
  storeProjects: WritableSignal<WellsByRig[]> = this.store.projects;

  // Subscription to manage API call subscriptions and prevent memory leaks
  private wellSelectorSubscription: Subscription = new Subscription();

  constructor(
    private commonService: CommonService,
    private router: Router,
    private store: SelectedWellBuilderService,
    private listEditorBuilderService: ListEditorBuilderService,
    private commonTyrBuilderService: CommonTyrBuilderService
  ) {
    effect(() => {
      this.visible = this.isVisible() || this.wellSelectButtonClicked();
      this.selectedWellNumber = this.store.selectedWellId();
    });
  }

  // Unsubscribe from all subscriptions to prevent memory leaks
  ngOnDestroy(): void {
    this.wellSelectorSubscription.unsubscribe();
  }

  // Added to get the project values and set for the selected well names
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projects']?.currentValue) {
      const wells = this.projects.map((p) => p.wells);
      this.allWells = wells[0]?.map((w) => {
        return { id: w.id, name: w.wellName };
      });
    }
  }

  ngOnInit() {
    this.wellSelectorSubscription = this.commonService.searchTerm$.subscribe((searchTerm) => {
      this.searchTerm = searchTerm;
    });
    this.store.display.set(true);
    this.store.wellSelectButtonClicked.set(true);
  }

  // Dialog close function for draft wells
  createDraftOnClose() {
    this.showDraftedWells = false;
  }

  // Refreshing the sidebar list after saving the draft well
  refreshTyrSideBar() {
    this.store.getAllProjects(
      this.listEditorBuilderService.selectedApplicationId(),
      1
    );
    this.projects = this.storeProjects();
    const wells = this.projects.map((p) => p.wells);
    this.allWells = wells[0]?.map((w) => {
      return { id: w.id, name: w.wellName };
    });
  }

  // Dialog save function for draft wells
  onDraftSave() {
    this.refreshTyrSideBar();
    this.showDraftedWells = false;
  }

  handleViewSelectionChange(event: any) {
    const selectedOption = event.value;
    this.onViewSelectionChange.emit(selectedOption);
  }

  onSearchTermChange() {
    this.commonService.updateSearchTerm(this.searchTerm);
    this.searchWellFilter.emit();
  }

  onContinue() {
    this.continueClicked = true;
    // Setting visiblility of sidebar as false
    if (this.selectedWellId) {
      this.visible = false;
      this.updateFilter.emit(); // Emit filter update
    }

    // Check added to set the WTR toggle off
    if (this.isComparatorView()) {
      this.commonTyrBuilderService.isRightGridExpanded.set(false);
    }
  }

  // Show draft dialog
  showDraftWells() {
    this.showDraftedWells = true;
  }

  // Function for radiobutton selection change
  onWellSelectionChange(well: any, project: any): void {
    this.toggleProjectWells.emit({
      wellId: well.id,
      projectId: project.projectId,
      wellNumber: well.wellNumber,
      wellName: well.wellName,
    });
    this.store.selectedWellId.set(well.id);
    this.setWellNames();
    // Fixed the issue where after clicking on well the sidebar was getting closed
    this.store.display.set(true);
    this.visible = true;
  }

  // Sets the well names
  setWellNames() {
    if (!this.isComparatorView()) {
      const firstWell = this.allWells.find(
        (well) => well.id === this.store.selectedWellId()
      );
      this.currentWellName = firstWell ? firstWell.name : '';
      this.comparatorWellName = '';
    } else {
      const firstWell = this.allWells.find(
        (well) => well.id === this.store.selectedWellId()
      );
      this.currentWellName = firstWell ? firstWell.name : '';
      const secondWell = this.allWells.find(
        (well) => well.id === this.store.comparisonWellNumber()
      );
      this.comparatorWellName = secondWell ? secondWell.name : '';
    }
  }

  // Function call on checkboxes
  onWellCheckboxChange(event: any, well: any, project: any): void {
    if (event.checked) {

      const selected = this.selectedWellNumbers;
      const count = selected.length;

      // Added logic based on the checkbox selection and setting the values for the current and comparator well
      if (count === 0) {
        this.store.selectedWellId.set(null);
        this.store.comparisonWellNumber.set(null);
      } else if (count === 2) {
        this.store.selectedWellId.set(selected[0]);
        this.store.comparisonWellNumber.set(selected[1]);
      } else if (count % 2 !== 0 && this.store.selectedWellId()) {
        this.store.comparisonWellNumber.set(well.id);
      }
      this.setWellNames();
    }
  }

  // Toggle the well comparator view function
  toggleComparatorView(): void {
    const wasComparatorView =
      this.commonTyrBuilderService.isComparatorViewSelected();

    // Toggle the comparator view
    const isNowComparatorView = !wasComparatorView;
    this.commonTyrBuilderService.isComparatorViewSelected.set(
      isNowComparatorView
    );

    // If switching to comparator (comparator) view
    const singleSelected = this.store.selectedWellId();
    if (isNowComparatorView) {
      this.selectedWellNumbers[0] = singleSelected;
    }

  }

  closeSidebar() {
    if (this.continueClicked && this.selectedWellId) {
      this.visible = false;
      // Setting visiblility of sidebar as false
      this.store.wellSelectButtonClicked.set(false);
      this.store.display.set(false);
      this.displayChange.emit(this.visible);
    } else {
      this.router.navigate(['app-selector']);
    }
  }
}
