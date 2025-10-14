import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OdinOuterRibbonDto } from '../../../common/model/OdinOuterRibbonDto';

@Injectable({
  providedIn: 'root',
})
export class OdinCommonService {
  // Initialize the payload with default values
  private outerRibbonDto: BehaviorSubject<{ payload: OdinOuterRibbonDto, key: string }> = new BehaviorSubject<{ payload: OdinOuterRibbonDto, key: string }>({
    payload: {
      month: 12,
      pType: 'p10',
      showContingency: false, // Default to false
      whatIf: false,
      SelectedProjects: [],
      SelectedWells: [],
      SelectedScenario:0,
      SelectedInventory: 1 // Default to SAP Inventory
    },
    key: '', // Initial key value
  });

  outerRibbonDto$ = this.outerRibbonDto.asObservable();
  selectedFunction: number | null = null;
  private functionSource = new BehaviorSubject<number>(1);  
  currentRecord = this.functionSource.asObservable();
  constructor() {}

  // Set the outerRibbonDto and key separately
  setOuterRibbonDto(payload: OdinOuterRibbonDto, key: string): void {
    const current = this.outerRibbonDto.getValue();

    // Create key-value pairs from the payload
    const updatedPayload = {
      month: payload.month,
      pType: payload.pType,
      showContingency: payload.showContingency,
      whatIf: payload.whatIf,
      SelectedProjects: payload.SelectedProjects,
      SelectedWells: payload.SelectedWells,
      SelectedScenario:payload.SelectedScenario,
      SelectedInventory: payload.SelectedInventory || 1 // Default to SAP Inventory if not provided
    };

    // Check if the payload has changed or if the key has changed
    if (
      current.payload.month !== updatedPayload.month ||
      current.payload.pType !== updatedPayload.pType ||
      current.payload.showContingency !== updatedPayload.showContingency ||
      current.payload.whatIf !== updatedPayload.whatIf ||
      current.payload.SelectedProjects !== updatedPayload.SelectedProjects ||
      current.payload.SelectedWells !== updatedPayload.SelectedWells ||
      current.payload.SelectedInventory !== updatedPayload.SelectedInventory ||
      key == "EditWellHeaders"
    ) {
      // Emit the updated payload with the key
      this.outerRibbonDto.next({ payload: updatedPayload, key });
    }
  }

  // Get the outerRibbonDto with the key
  getOuterRibbonDto(): { payload: OdinOuterRibbonDto, key: string } {
    return this.outerRibbonDto.getValue();
  }

  getSelectedFunction() {
    return this.selectedFunction;
  }

  setSelectedFunction(id: number) {
    return this.selectedFunction = id;
  }


  emitFunction(functionId: number) {
    this.functionSource.next(functionId);  // Emit a new function id
  }
  clearOuterRibbonDto(): void {
  this.outerRibbonDto.next({
    payload: {
      month: 12,
      pType: 'p10',
      showContingency: false,
      whatIf: false,
      SelectedProjects: [],
      SelectedWells: [],
      SelectedScenario:0,
      SelectedInventory: 1 // Default to SAP Inventory
    },
    key: ''
  });
}

}
