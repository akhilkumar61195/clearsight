// grid-state-persistence.service.ts
import { Injectable } from '@angular/core';
import { GridApi } from 'ag-grid-community';
import { CustomerPersonalizationService } from '../../services/customer-personalization.service';
import { CustomerPersonalization } from '../model/customer-personalization';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })

export class GridStatePersistenceService {
  private gridApi!: GridApi;
  // private columnApi!: ColumnApi;
  private cachedState: any = null;
  private cachedContext: any = null;
  private userId: number = 0;
  private hasRestored = false;

  constructor(private personalizationService: CustomerPersonalizationService , private messageService: MessageService) {}

  initialize(gridApi: GridApi, userId: number) {
    this.gridApi = gridApi;
    // this.columnApi = columnApi;
    this.userId = userId;

    // Listen for grid changes
    gridApi.addEventListener('columnMoved', () => this.cacheState());
    gridApi.addEventListener('columnVisible', () => this.cacheState());
    gridApi.addEventListener('sortChanged', () => this.cacheState());
    gridApi.addEventListener('filterChanged', () => this.cacheState());
  }

 
  // Cache the current state of the grid
  private cacheState() {
    if (!this.gridApi) return;
    const sortModel = (this.gridApi as any).getSortModel?.();

    this.cachedState = {
      columnState: this.gridApi.getColumnState(),
      filterModel: this.gridApi.getFilterModel(),
      sortModel: sortModel || [],
    };

// Optional: add contextual filter state here
  }

  // ✳️ New method to update custom context
  setContextData(context: any) {
    this.cachedContext = context;
  }

  // Restore the grid state from the server
  // restoreState(stateKey: string , userId: number) {
  //   if (!this.gridApi || this.hasRestored) return;

  //   this.personalizationService.getLatestCustomerPersonalization(stateKey, userId).subscribe({
  //     next: (res) => {
  //       const state = res?.result?.appState ? JSON.parse(res.result.appState) : null;

  //       if (state?.columnState) {
  //         this.gridApi?.applyColumnState({ state: state.columnState, applyOrder: true });
  //       }

  //       setTimeout(() => {
  //         if (state?.filterModel) this.gridApi?.setFilterModel(state.filterModel);
  //         if (state?.sortModel) this.gridApi?.applyColumnState({ state: state.columnState, applyOrder: true, defaultState: { sort: undefined } });
  //         this.gridApi?.refreshHeader();
  //         this.gridApi?.redrawRows();
  //       }, 50);

  //       this.hasRestored = true;
  //     },
  //     error: (err) => {
  //       console.warn('Failed to restore grid state', err);
  //     },
  //   });
  // }

  // Save the current state of the grid to the server
  saveStateOnDestroy(stateKey: string) {
    if (!this.cachedState || !this.userId) return;

    const model: CustomerPersonalization = {
      id: 0,
      module: stateKey,
      appState: JSON.stringify(this.cachedState),
      contextData: JSON.stringify(this.cachedContext),
      userIdCreatedBy: this.userId,
    };

    this.personalizationService.createCustomerPersonalization(model).subscribe({
      next: () => {
        this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Grid state saved successfully'
      });

      },
      error: (err) => console.error('❌ Failed to save grid state', err),
    });
  }

  resetState() {
  if (!this.gridApi) return;

  // Reset column state to default
  this.gridApi.resetColumnState();

  // Clear filters
  this.gridApi.setFilterModel(null);

  // Clear sort
  (this.gridApi as any).getSortModel?.(null);

  // Reset cachedState and cachedContext
  this.cachedState = null;
  this.cachedContext = null;

  // Refresh grid
  this.gridApi.refreshHeader();
  this.gridApi.redrawRows();

}

}
