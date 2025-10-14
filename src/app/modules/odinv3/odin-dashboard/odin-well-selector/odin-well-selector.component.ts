import { Component, EventEmitter, OnDestroy, Output, ViewEncapsulation } from '@angular/core';
import { LookupKeys } from '../../../../common/enum/lookup-keys';
import { AdvanceFilterModel } from '../../../../common/model/AdvanceFilterModel';
import { LookupsService } from '../../../../services/lookups.service';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import _ from 'lodash';
import { OdinCommonService } from '../../services/odin-common.service';
import { WellService } from '../../../../services/well.service';
import { PRIME_IMPORTS } from '../../../../shared/prime-imports';

@Component({
  selector: 'app-odin-well-selector',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './odin-well-selector.component.html',
  styleUrl: './odin-well-selector.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class OdinWellSelectorComponent implements OnDestroy {

  @Output() setFilterValues = new EventEmitter<any>();
  // noSpecial: RegExp = /^[^<>*!]+$/
  advanceFilter: any;
  lookUpType = LookupKeys;
  selectedMonthSummary: any = 'All';
  selectedPType: string = "P10";
  allLookUpData: any[] | undefined;
  filteredLookUpData: any[] | undefined;

  projects: any[] | undefined;
  selectedProject: string[] | undefined;
  futureDate: any;
  functions: any[] = [
    { FUNCTIONDESCRIPTION: 'Drilling', FUNCTIONID: 1 },
    { FUNCTIONDESCRIPTION: 'Completions', FUNCTIONID: 2 }
  ];

  selectedFunction: number;
  wells: any[] = [];
  filteredWells: any[] = [];
  selectedWell: any | undefined;
  searchWell: string;

  timeline: any[] | undefined;
  selectedTimeLine: string | undefined;

  subscription: Subscription;

  odinFilter: AdvanceFilterModel = new AdvanceFilterModel();

  selectAllLabel: string = "Select All Wells";
  private odinCommonServicesubscription: Subscription;
  // Subscription to manage multiple subscriptions and avoid memory leaks
  private OdinWellSelectorComponentsubscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private lookupService: LookupsService,
    private odinCommonService: OdinCommonService,
    private wellService: WellService
  ) {

  }

  // Destroy subscription when component is destroyed
  ngDestroy() {
    this.OdinWellSelectorComponentsubscription?.unsubscribe();
  }

  ngOnInit() {
    this.getProjects();
    this.futureSelectedDate();
  }

  onPChange(event: any) {
    this.selectedPType = event.value;
    this.filterWells();
  }

  onMonthChange(event: any) {
    this.selectedMonthSummary = event.value;
    this.futureSelectedDate();
    this.filterWells();
  }

  futureSelectedDate() {
    if (this.selectedMonthSummary === 'All') {
      this.futureDate = null; // No future date filtering
    } else {
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + parseInt(this.selectedMonthSummary));
      const day = String(currentDate.getDate()).padStart(2, '0'); // Pad single digits with leading zero
      const month = String(((currentDate.getMonth() == 6 || currentDate.getMonth() == 12) ? currentDate.getMonth() + 0 : currentDate.getMonth() + 1)).padStart(2, '0'); // Months are 0-indexed, pad with leading zero
      const year = currentDate.getFullYear();
      this.futureDate = `${month}/${day}/${year}`;
    }
  }

  filterWells() {
    if (this.selectedMonthSummary === 'All') {
      this.filteredWells = this.wells.filter(well => well.FUNCTIONID === this.selectedFunction);// filter total wells //
    } else {
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + parseInt(this.selectedMonthSummary));
      this.filteredWells = this.wells.filter(well => {
        const wellDate = new Date(well[`${this.selectedPType.toLowerCase()}startDate`]); // Dynamically filter based on selectedPType
        return wellDate <= currentDate && well.FUNCTIONID === this.selectedFunction;
      });
    }
    
  }

  getProjects() {
    this.OdinWellSelectorComponentsubscription = this.lookupService.getProjects().subscribe(data => {
      this.projects = data;
      const urlView = this.router.url.includes("completion") ? 2 : 1;

      this.projects.map((resp) => {
        resp.ISHIDDEN = false;
        resp.PROJECTID = resp.id;
        resp.PROJECTDESC = resp.projectDesc;
        resp.FUNCTIONID = urlView;
      });

      this.getWells();
    })
  }

  //getWells() {
  //  this.lookupService.getWellsByProject(1, -1).subscribe(data => {
  //    data.map((resp) => {
  //      //add resp.wells to this.wells
  //      resp?.wells?.map((well) => {
  //        well.WELLID = well.id;
  //        well.ISHIDDEN = false;
  //        well.FUNCTIONID = resp.functionId;
  //        well.PROJECTID = resp.projectId;
  //        well.WELLNAME = well.wellName;
  //      });
  //      if (resp.wells) { this.wells.push(...resp.wells); }
  //    });
  //    this.setSelectedValue();
  //  });
  //}

  getWells() {
    this.OdinWellSelectorComponentsubscription = forkJoin({
      wells1: this.wellService.getAllWells(1, 1),
      wells2: this.wellService.getAllWells(1, 2)
    }).subscribe(({ wells1, wells2 }) => {
      let combinedData: any[] = [...wells1, ...wells2];

      combinedData.map((well) => {
        well.WELLID = well.id;
        well.ISHIDDEN = false;
        well.FUNCTIONID = well.functionId;
        well.PROJECTID = well.projectId;
        well.WELLNAME = well.wellName;
      });

      this.wells.push(...combinedData);
      this.setSelectedValue();
    });
  }

  setSelectedValue() {
    const urlView = this.router.url.includes("completion") ? 2 : 1;
    this.selectedFunction = urlView;
    this.selectedProject = this.odinCommonService.getOuterRibbonDto().payload.SelectedProjects;
    this.selectedWell = this.odinCommonService.getOuterRibbonDto().payload.SelectedWells;

    this.filteredWells = this.wells.filter((well) => well.FUNCTIONID == this.selectedFunction);

    if (this.selectedWell && this.selectedWell.length == this.wells.filter((well) => well.FUNCTIONID == this.selectedFunction).length) {
      this.selectAllLabel = "Deselect All Wells";
    }
    else {
      this.selectAllLabel = "Select All Wells";
    }
  }

  searchWellFIlter() {
    const normalizedSearchTerm = this.searchWell.trim().toLowerCase();

    if (normalizedSearchTerm) {
      // Filter based on both search text and selected function
      this.filteredWells = this.wells.filter(well =>
        well.WELLNAME.toLowerCase().includes(normalizedSearchTerm) &&
        well.FUNCTIONID === this.selectedFunction
      );
    } else {
      // Filter based on selected function if no search text
      this.filteredWells = this.wells.filter(well =>
        well.FUNCTIONID === this.selectedFunction
      );
    }
  }


  // selectAllWell() {
  //   const isAllChecked = this.filteredWells.every((well) => this.selectedWell.includes(well.WELLID) && well.FUNCTIONID == this.selectedFunction);
  //   if (!isAllChecked) {
  //     this.selectedWell = [];
  //     this.selectedProject = [];
  //     this.filteredWells.map((resp) => {
  //       if (resp.FUNCTIONID == this.selectedFunction)
  //         this.selectedWell.push(resp.WELLID);
  //       this.toggleProjectWells('well', resp.PROJECTID);
  //     });
  //     this.selectAllLabel = "Deselect All Wells";
  //   } else {
  //     this.wells.map((resp) => {
  //       if (resp.FUNCTIONID == this.selectedFunction) {
  //         resp.ISHIDDEN = !resp.ISHIDDEN
  //       }

  //     });
  //     this.selectedWell = [];
  //     this.selectedProject = [];
  //     this.selectAllLabel = "Select All Wells";
  //   }
  //   this.sendFiltersToLandingPage();
  // }

  selectAllWell() {
    const isAllChecked = this.filteredWells.every((well) =>
      this.selectedWell?.includes(well.WELLID) && well.FUNCTIONID === this.selectedFunction
    );

    if (!isAllChecked) {
      this.selectedWell = [];
      this.selectedProject = [];

      this.filteredWells.forEach((resp) => {
        if (resp.FUNCTIONID === this.selectedFunction) {
          this.selectedWell.push(resp.WELLID);
          this.toggleProjectWells('well', resp.PROJECTID);
        }
      });

      this.selectAllLabel = "Deselect All Wells";
    } else {
      this.filteredWells.forEach((resp) => {
        if (resp.FUNCTIONID === this.selectedFunction) {
          resp.ISHIDDEN = !resp.ISHIDDEN;
        }
      });

      this.selectedWell = [];
      this.selectedProject = [];
      this.selectAllLabel = "Select All Wells";
    }

    this.sendFiltersToLandingPage();
  }

  onSelectedViewChange(event: any) {

    this.selectedFunction = event.value;
    this.odinCommonService.setSelectedFunction(event.value);
    this.filteredWells = this.wells.filter((well) => well.FUNCTIONID == event.value);
    this.selectedWell = Array.isArray(this.selectedWell) ? this.selectedWell : [];
    this.selectedProject = Array.isArray(this.selectedProject) ? this.selectedProject : [];
    this.filteredWells.forEach((well) => {

      if (well.ISHIDDEN && well.FUNCTIONID == this.selectedFunction) {
        this.selectedWell = [...this.selectedWell, well.WELLID];
        this.selectedProject = [...this.selectedProject, well.PROJECTID];
      }
      else {
        const changedWells = this.selectedWell.filter(item => item !== well.WELLID);
        const changedProjects = this.selectedProject.filter(item => item !== well.PROJECTID);
        this.selectedWell = changedWells;
        this.selectedProject = changedProjects;
      }

    });
    if (this.filteredWells.length == this.wells.filter((well) => well.FUNCTIONID == this.selectedFunction && well.ISHIDDEN == true).length) {
      this.selectAllLabel = "Deselect All Wells";
    }
    else {
      this.selectAllLabel = "Select All Wells";
    }
    this.updateSelectedProjectFunctionType();
    this.sendFiltersToLandingPage();
  }

  toggleProjectWells(type: 'project' | 'well', projectId: any, wellid?: number, event?: any) {

    if (type == 'project') {
      if (!this.selectedWell || this.selectedWell.length == 0) {
        this.selectedWell = [];
      }
      const projectWells = this.filteredWells.filter((well) => well.PROJECTID == projectId);
      if (this.selectedProject.includes(projectId)) {
        projectWells.forEach((well) => {
          if (!this.selectedWell.includes(well.WELLID)) {
            well.ISHIDDEN = this.selectedFunction === well.FUNCTIONID ? true : false;
            this.selectedWell = [...this.selectedWell, well.WELLID];
          }
        });
      }
      else {
        projectWells.forEach((well) => {
          if (this.selectedWell.includes(well.WELLID)) {
            well.ISHIDDEN = false;
            this.selectedWell = this.selectedWell.filter((id) => id !== well.WELLID);
          }
        });
      }
    }
    else {
      if (!this.selectedProject || this.selectedProject.length == 0) {
        this.selectedProject = [];
      }
      // Check if a project is fully selected
      const projectWells = this.filteredWells.filter((well) => well.PROJECTID == projectId && well.FUNCTIONID == this.selectedFunction);
      const isAllChecked = projectWells.every((well) => this.selectedWell.includes(well.WELLID) && well.FUNCTIONID == this.selectedFunction);
      if (wellid == null) {
        if (isAllChecked && !this.selectedProject.includes(projectId)) {

          this.selectedProject = [...this.selectedProject, projectId];
          this.filteredWells.forEach((well) => {
            if (well.FUNCTIONID == this.selectedFunction) {
              well.ISHIDDEN = true;
            }

            else {
              well.ISHIDDEN = well.ISHIDDEN;
            }

          });
        }
        else if (!isAllChecked && this.selectedProject.includes(projectId)) {

          this.selectedProject = this.selectedProject.filter((id) => id !== projectId);
        }
        else {

        }
      }
      else {

        if (isAllChecked && !this.selectedProject.includes(projectId)) {
          this.filteredWells.forEach((well) => {
            if (well.WELLID == wellid && well.FUNCTIONID == this.selectedFunction) {
              well.ISHIDDEN = true;
            }

            else {
              well.ISHIDDEN = well.ISHIDDEN;
            }

          });
          this.selectedProject = [...this.selectedProject, projectId];
        }
        else if (!isAllChecked && this.selectedProject.includes(projectId)) {
          this.filteredWells.forEach((well) => {
            if (well.WELLID == wellid && well.FUNCTIONID == this.selectedFunction) {
              well.ISHIDDEN = true;
            }

            else {
              well.ISHIDDEN = well.ISHIDDEN;
            }

          });
          this.selectedProject = this.selectedProject.filter((id) => id !== projectId);
        }
        else {

          this.filteredWells.forEach((well) => {

            if (event.checked.includes(wellid) && well.WELLID == wellid && well.FUNCTIONID == this.selectedFunction) {
              well.ISHIDDEN = true;
            }
            else if (!event.checked.includes(wellid) && well.WELLID == wellid && well.FUNCTIONID == this.selectedFunction) {
              well.ISHIDDEN = false;
            }

            else {
              well.ISHIDDEN = well.ISHIDDEN;
            }

          });
        }
      }

    }

    if (this.selectedWell && this.selectedWell.length == this.filteredWells.filter((well) => well.FUNCTIONID == this.selectedFunction).length) {

      this.selectAllLabel = "Deselect All Wells";
    }
    else {
      this.selectAllLabel = "Select All Wells";
    }
    this.sendFiltersToLandingPage();
  }

  

  sendFiltersToLandingPage(env?: any) {
    const areSelectedWellInList = this.wells.filter((well: any) => this.selectedWell?.includes(well.WELLID) ? true : false);
    if (!areSelectedWellInList || (areSelectedWellInList && areSelectedWellInList.length == 0))
      this.selectedWell = [];
    this.advanceFilter = new AdvanceFilterModel();
    this.advanceFilter.projects = this.selectedProject ?? [];
    this.advanceFilter.functions = this.selectedFunction ?? 1;
    this.advanceFilter.wells = this.selectedWell ?? [];
    this.setFilterValues.emit(this.advanceFilter);
  }

  hasVisibleWells(projectId: number): boolean {

    //return this.filteredWells.some(well => well.PROJECTID === projectId && !well.ISHIDDEN);
    return this.filteredWells.some(well => well.PROJECTID === projectId);
  }
  updateSelectedProjectFunctionType() {

    const updateprojects = this.projects.map(project => {

      if (this.selectedProject.includes(project.id)) {

        return { ...project, FUNCTIONID: this.odinCommonService.getSelectedFunction() };  // Set the new functionID here
      }
      else
        return { ...project, FUNCTIONID: this.odinCommonService.getSelectedFunction() };  // Return the project unchanged if id doesn't match
    });

    this.projects = updateprojects;


  }



  ngOnDestroy() {
    let element = document.querySelector(".menuwithdd .menuicon");
    if (element && element.classList) {
      document.querySelector(".menuwithdd .menuicon").classList.remove("d-none");
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.odinCommonServicesubscription) {
      this.odinCommonServicesubscription.unsubscribe();
    }
  }
}

