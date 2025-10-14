import { CommonModule, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { ITooltipAngularComp } from 'ag-grid-angular';
import { ITooltipParams } from 'ag-grid-community';

@Component({
  selector: 'app-odin-balance-tooltip',
  standalone: true,
  imports: [CommonModule, NgFor],
    template: ` <div class="custom-tooltip">
    <tbody>
      <tr class="details" [ngClass]="{'green-row': item.value.unit === '+', 'yellow-row': item.value.unit === '-'}" *ngFor="let item of consolidatedValues | keyvalue">
        <td>{{ item.value.header }}</td>
        <td>{{ item.value.unit }}{{ item.value.value | number:'1.0-0' }}</td>
      </tr>
      <tr class="total">
      <td> Total </td>
      <td> {{totalBalance | number:'1.0-0'}} </td>
      </tr>
    </tbody>
  </div>`,
  styles: [
    `
      :hostx {
        position: absolute;
        pointer-events: none;
        transition: opacity 1s;
      }

      :hostx.Xag-tooltip-hiding {
        opacity: 0;
      }
      .custom-tooltip {
        background-color: #166568;
        color: #166568;

        border-radius: 5px;
        padding: 5px;
        border-width: 1px;
        border-style: solid;
        border-color: #166568;
        flex-wrap: wrap;
      }

      .green-row {
        background-color: var(--theme-green-medium-color);
      }
      .yellow-row {
        background-color: #ffc65c;
      }

      tr td:nth-child(odd) {
        float: left;
        margin-right: 25px;
      }
      tr td:nth-child(even) {
        float: right;
      }

      .custom-tooltip p:first-of-type {
        font-weight: bold;
      }

      .custom-tooltip .total {
        color: #fff;
        font-weight: 700;
      }

      tr {
          border: 1px solid white;
      }
    `,
  ],
})
export class OdinBalanceTooltipComponent implements ITooltipAngularComp {
  public params!: {
    demandDetails: {
      calculatedCvxOwnedInventory?: {header: string, value: number};
      consignmentInventory?: {header: string, value: number};
      drillQuip?: {header: string, value: number};
      openOrders?: {header: string, value: number};
      requiredBackup: {header: string, value: number};
      totalPrimaryDemand: {header: string, value: number};
      totalContingentDemand: {header: string, value: number};
    };
    isContingent: boolean;
  } & ITooltipParams;
  public demandDetails: {
    calculatedCvxOwnedInventory?: {header: string, value: number};
    consignmentInventory: {header: string, value: number};
    drillQuip: {header: string, value: number};
    openOrders: {header: string, value: number};
    requiredBackup: {header: string, value: number};
    totalPrimaryDemand: {header: string, value: number};
    totalContingentDemand: {header: string, value: number};
  };
  public totalBalance: number;
  public isContingent: boolean;
  public consolidatedValues = [];

  agInit(
    params: {
      demandDetails: {
        calculatedCvxOwnedInventory: {header: string, value: number};
        consignmentInventory: {header: string, value: number};
        drillQuip: {header: string, value: number};
        openOrders: {header: string, value: number};
        requiredBackup: {header: string, value: number};
        totalPrimaryDemand: {header: string, value: number};
        totalContingentDemand: {header: string, value: number};
      };
      isContingent: boolean;
    } & ITooltipParams
  ): void {
    this.params = params;
    this.demandDetails = params.demandDetails;
    this.isContingent = this.params.isContingent;
    const filteredValues = !this.isContingent ? Object.values(this.demandDetails).filter((demand) => demand.header !== 'Contingency Demand') : Object.values(this.demandDetails);
    this.consolidatedValues = filteredValues;
    const contingentFactor = this.isContingent ? this.demandDetails?.totalContingentDemand?.value : 0;
    this.totalBalance = Math.round(
      (this.demandDetails?.openOrders?.value || 0) +
        (this.demandDetails?.calculatedCvxOwnedInventory?.value || 0) +
        (this.demandDetails?.consignmentInventory?.value || 0) +
        (this.demandDetails?.drillQuip?.value || 0) -
        (this.demandDetails?.requiredBackup?.value || 0) -
        (this.demandDetails?.totalPrimaryDemand?.value || 0) - 
        (contingentFactor || 0)
    );
  }
}
