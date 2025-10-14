import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import type { ITooltipAngularComp } from 'ag-grid-angular';
import type { ITooltipParams } from 'ag-grid-community';

@Component({
  standalone: true,
  imports: [CommonModule, NgFor],
  template: ` <div class="custom-tooltip">
    <tbody>
      <tr>
        <th>MM/MMR #:</th> <th>{{ materialId }}</th>
      </tr>
      <td>WellName</td>
      <td>Demand</td>
      <tr *ngFor="let item of demandDetails">
        <td>{{ item.wellName }}</td>
        <td>{{ item.demand | number:'1.0-0' }}</td>
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
        color: #fefeff;

        border-radius: 5px;
        padding: 5px;
        border-width: 1px;
        border-style: solid;
        border-color: #166568;
        flex-wrap: wrap;
        td {
          border: 1px solid white;
        }
      }

      th:nth-child(odd) {
        float: left;
        margin-right: 25px;
      }
      th:nth-child(even) {
        float: right;
      }

      .custom-tooltip p {
        margin: 5px;
        white-space: nowrap;
      }

      .custom-tooltip p:first-of-type {
        font-weight: bold;
      }
    `,
  ],
})
export class odinDemandTooltip implements ITooltipAngularComp {
  // Adding materialId to show the MM details on tooltip
  public params!: {
    demandDetails: { wellName: string; demand: number }[];
    materialId: number;
  } & ITooltipParams;
  public demandDetails: { wellName: string; demand: number }[] = [];
  public materialId: number;
  agInit(
    params: {
      demandDetails: { wellName: string; demand: number }[];
      materialId: number;
    } & ITooltipParams
  ): void {
    this.params = params;
    this.demandDetails = this.params.demandDetails;
    this.materialId = this.params.materialId;
  }
}