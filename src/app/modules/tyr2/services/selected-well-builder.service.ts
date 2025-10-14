import { Injectable, signal, WritableSignal } from '@angular/core';
import { WellsByRig } from '../../../common/model/wells-by-rig';
import { CommonService } from '../../../services/common.service';
import { LookupsService } from '../../../services/lookups.service';
import { CommonTyrBuilderService } from './common-tyr-builder.service';

@Injectable({
  providedIn: 'root',
})
export class SelectedWellBuilderService {
  projects: WritableSignal<WellsByRig[]> = signal<WellsByRig[]>([]); // Signal to store the projects
  selectedWellId: WritableSignal<number> = signal<number>(null);
  selectedProjectId: WritableSignal<number> = signal<number>(0);
  selectedWellNumber: WritableSignal<number> = signal<number>(0);
  comparisonWellNumber: WritableSignal<number> = signal<number>(null); // Replacing the signal of selected well numbers for the checkboxes with seperate signal for comparator well 
  functionId: WritableSignal<number> = signal<number>(0);
  display: WritableSignal<boolean> = signal<boolean>(true);
  selectedwellName: WritableSignal<string> = signal<string>('');
  isWellSelected: WritableSignal<boolean> = signal<boolean>(false);
  tyrWellsIds: WritableSignal<number[]> = signal<number[]>([]);
  wellSelectButtonClicked: WritableSignal<boolean> = signal<boolean>(false); // Adding the signal to check whether the select well button clicked or not
  searchTerm = signal<string>('');
  appId: number;
    isComparatorView: WritableSignal<boolean> =
    this.commonTyrBuilderService.isComparatorViewSelected;

  constructor(
    private lookupService: LookupsService,
    private commonService: CommonService,
    private commonTyrBuilderService: CommonTyrBuilderService
  ) {}

  // Fetching the projects
  getAllProjects(appId, functionId) {
    this.appId = appId;
    this.functionId.set(functionId);
    this.lookupService.getWellsByRig(appId, functionId).subscribe(
      (data: WellsByRig[]) => {
        this.projects.update(() => [...data]);
        this.tyrWellsIds.set(this.projects().flatMap((proj) => proj.wells.map((well) => well.id))); // Setting Ids of wells which are in tyr
      },
      (error) => {
        console.error('Error fetching wells by project:', error);
        this.projects.update(() => []); // Clear old data
      }
    );
  }

  updateFilter() {
    if (this.selectedWellId && this.selectedProjectId) {
      this.commonService.getSelectedWellNumber(Number(this.selectedWellNumber));
      this.display.set(false);
      const wellDetails = {
        id: this.selectedWellId(), // Added to fix the issue regarding the well name header
        wellNumber: this.selectedWellNumber(),
        wellName: this.selectedwellName().toString(),
        appId: 3, // Tyr
        functionId: Number(this.functionId()), // Drilling/Completions
      };
      // Begin
      const thorSelectedWell = {
        wellId: Number(this.selectedWellId()), // Added to fix the issue regarding the well name header
        wellNumber: Number(this.selectedWellNumber()),
        wellName: this.selectedwellName().toString(),
        appId: 3, // Tyr
        functionId: Number(this.functionId()), // Drilling/Completions
      };

      this.commonService.setThorSelectedWell(thorSelectedWell);
      //End
      if (Number(this.functionId()) === 2) {
        this.commonService.setFunctionIdThor(2);
        this.commonService.setWellDetailsFilterData(wellDetails);
      } else {
        this.commonService.setWellDetailsFilterData(wellDetails);
        this.commonService.setFunctionIdThor(Number(this.functionId()));
        this.getDrillingWells();
      }
      this.isWellSelected.set(true);
    } else {
      console.warn('No Well ID selected for filtering.');
    }
  }

  searchWellFilter() {
    this.commonService.searchTerm$.subscribe((searchTerm) => {
      this.searchTerm.set(searchTerm);
    });
    let filteredWells = [];
    if (this.projects()?.length > 0) {
      this.projects().forEach((project) => {
        if (!project.wells) {
          project.wells = [...project.wells];
        }

        // Adding searchfilter by material coordinator , wellname and rig
        project.wells = filteredWells = project.wells.filter(
          (well) =>
            well.wellName
              .toLowerCase()
              .includes(this.searchTerm().toLowerCase()) ||
            project.rig.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
            well.materialCoordinator.toLowerCase().includes(this.searchTerm().toLowerCase())
        );
      });
      // this.projects.set(
      //   this.projects().filter((project) => project.wells.length > 0)
      // );
      
      if (this.searchTerm().length < 3) {
        this.getAllProjects(this.appId, Number(this.functionId()));
      }
    } else {
      this.projects().forEach((project) => {
        if (project.wells) {
          project.wells = [...project.wells];
        }
      });
      if (this.searchTerm().length <= 3) {
        this.getAllProjects(this.appId, Number(this.functionId()));
      }
    }
  }

  toggleProjectWells(selectedValue: {
    wellId: number;
    projectId: number;
    wellNumber: number;
    wellName: string;
  }) {
    if (selectedValue) {
      this.selectedProjectId.set(selectedValue.projectId);
      this.selectedWellId.set(selectedValue.wellId);
      this.selectedWellNumber.set(selectedValue.wellNumber);
      this.selectedwellName.set(selectedValue.wellName);
    }
  }

  // Method to fetch data from the server and update the grid with setInterval Infinate Scroll //
  getDrillingWells() {
    const wellDetails = this.commonService.getWellDetailsFilterData();
    this.selectedWellId.set(wellDetails.id);
  }
}
