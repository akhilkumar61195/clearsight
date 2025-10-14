import { Component } from '@angular/core';
import { IHeaderGroupAngularComp, AgGridAngular } from 'ag-grid-angular';
import { ColDef, IHeaderGroupParams } from 'ag-grid-community';
import { NgClass } from '@angular/common';
import { ColumnService } from '../../../services/columnService/changeLogCoulmnService';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-custom-header-group',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  template: `
    <div class="ag-header-group-cell-label" >
      <div class="customHeaderLabel">
        <span>{{ params.displayName }}</span>
        <span *ngIf="!isDataShow && SelectedDateType=='P10'">P10 Start Date: {{WellDetails.p10StartDate | date: 'MM/dd/yyyy'}}</span>
        <span *ngIf="!isDataShow && SelectedDateType=='P50'">P50 Start Date: {{WellDetails.p50StartDate | date: 'MM/dd/yyyy'}}</span>
        <div *ngIf="isDataShow">
          <table >
          <tr>
              <th style="text-align: right;">Plant Code :</th>
              <td>{{WellDetails.plantCode}}</td>
          </tr>
          <tr>
              <th style="text-align: right;">WBS :</th>
              <td>{{WellDetails.wbs}}</td>
          </tr>
          <tr>
              <th style="text-align: right;">Well Type :</th>
              <td>{{WellDetails.wellType}}</td>
          </tr>
           <tr *ngIf="showWellKit">
              <th style="text-align: right;">Well Head Kit :</th>
              <td>{{WellDetails.wellHeadKitName}}</td>
          </tr>
          <tr>
              <th style="text-align: right;">Planning Eng :</th>
              <td>{{WellDetails.planningEngineer}}</td>
          </tr>
          <tr>
              <th style="text-align: right;">RIG :</th>
              <td>{{WellDetails.rig}}</td>
          </tr>
          <tr>
              <th style="text-align: right;">P10 Start Date :</th>
              <td>{{WellDetails.p10StartDate | date: 'MM/dd/yyyy'}}</td>
          </tr>
           <tr>
              <th style="text-align: right;">P50 Start Date :</th>
              <td>{{WellDetails.p50StartDate | date: 'MM/dd/yyyy'}}</td>
          </tr>
      </table>
      
        </div>
      </div>
      <div class="customExpandButton" [ngClass]="expandState" (click)="expandOrCollapse()" [id]="getUniqueId()">
       <i class="pi pi-angle-down"></i>
      </div>
    </div>
  `,
  styles: [`
    :host {
  overflow: hidden;
}
.customExpandButton {
  float: right;
  margin-top: 2px;
  margin-left: 3px;
}
 
.expanded {
  animation-name: toExpanded;
  animation-duration: 1s;
  transform: rotate(180deg);
}
 
.collapsed {
  animation-name: toCollapsed;
  animation-duration: 1s;
  transform: rotate(0deg);
}
 
.ag-header-group-cell-label {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  overflow: hidden;
  font-size: 12px;
}
 
.customHeaderLabel {
  overflow: hidden;
  justify-content: center;
  align-items: center;
  text-overflow: ellipsis;
  display: flex;
  flex-direction: column;
  font-size: 12px;
}
 
/* Styling for the table */
table th {
  background-color: #f8f9fa;  /* Light gray background for headers #f4f4f4; */
  font-weight: bold;  /* Make header text bold */
  font-size: 12px;  /* Optional: Adjust font size */
  padding: 2px 5px;   /* Padding for better spacing */
  text-align: left;  /* Align header text to the left */
  vertical-align: middle;  /* Center align text vertically */
  color: #333;  /* Dark color for readability */
}
 
table td {
  font-weight: normal;  /* Ensure data cells have normal font weight */
  padding: 2px 5px;  /* Padding for better spacing */
  text-align: left;  /* Align text to the left */
  vertical-align: middle;  /* Center align text vertically */
  word-wrap: break-word;  /* Ensure text wraps inside cells */
  max-width: 200px;  /* Optional: Limit cell width */
  background-color: #f8f9fa;  /* Light gray background for headers */
}
 
table {
  width: 100%;
  margin-top: 10px;
  border-collapse: collapse; /* Collapses borders */
  background-color: #fff;
}
table tr{
  height: "5px"
}

table th:last-child, table td:last-child {
  border-right: none; /* Remove border on the last column */
}
 
table tr:last-child td {
  border-bottom: none; /* Remove border on the last row */
}
 
 
@keyframes toExpanded {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
}
 
@keyframes toCollapsed {
  from {
    transform: rotate(180deg);
  }
  to {
    transform: rotate(0deg);
  }
}
 
  `]
})
export class CustomHeaderGroup implements IHeaderGroupAngularComp {
  public params!: any;
  WellDetails: any;
  SelectedDateType: string;
  public expandState: string = 'collapsed';
  isDataShow: boolean = false;
  showWellKit: boolean = true;


  constructor(private columnService: ColumnService) {

  }
  agInit(params: IHeaderGroupParams & { WellDetails: any } & { SelectedDateType: any } & { hideWellKit: boolean }): void {

    this.params = params;
    this.WellDetails = params.WellDetails;
    this.showWellKit = !params.hideWellKit;
    this.SelectedDateType = (params.SelectedDateType === 'p10' ? "P10" : (params.SelectedDateType === 'p50' || params.SelectedDateType === 'P50') ? "P50" : "P10");
    this.params.columnGroup.getProvidedColumnGroup().addEventListener('expandedChanged', this.syncExpandButtons.bind(this));
    this.syncExpandButtons();
  }

  expandOrCollapse(): void {
    const rowData = this.params;
    const currentState = this.params.columnGroup.getProvidedColumnGroup().isExpanded();
    this.params.setExpanded(!currentState);
    this.params.onClick({ action: rowData, type: currentState })
  }
  onGridReady(params: any) {
    //this.gridApi = params.api;
  }

  syncExpandButtons(): void {
    if (this.params.columnGroup.getProvidedColumnGroup().isExpanded()) {
      this.expandState = 'expanded';
      this.isDataShow = true;
    } else {
      this.expandState = 'collapsed';
      this.isDataShow = false;
    }
  }
  getUniqueId(): string {
    return this.params.uniqueId
  }
}