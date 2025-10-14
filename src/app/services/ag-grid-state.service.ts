import { Injectable } from '@angular/core';
import { GridApi } from 'ag-grid-community';

@Injectable({ providedIn: 'root' })

export class AgGridStateService {

 saveState(gridApi: GridApi, key: string): void {
        const sortModel = (gridApi as any).getSortModel?.(); // 👈 cast to any if TypeScript complains
        const state = {
            columnState: gridApi.getColumnState(),
            filterModel: gridApi.getFilterModel(),
            sortModel: sortModel || []
        };
        localStorage.setItem(key, JSON.stringify(state));
        localStorage.setItem(`${key}__saved`, 'true'); // ✅ set flag indicating save happened
    }


restoreState(gridApi: GridApi, key: string): void {
        const savedFlag = localStorage.getItem(`${key}__saved`); // ✅ check flag first
        if (!savedFlag) return;
        const stateStr = localStorage.getItem(key);
        if (!stateStr) return;
        const state = JSON.parse(stateStr);

        if (state.columnState) {
            gridApi.applyColumnState({
                state: state.columnState,
                applyOrder: true
            });
        }

        setTimeout(() => {
            if (state.filterModel) {
                gridApi.setFilterModel(state.filterModel);
            }
            if (state.sortModel && (gridApi as any).setSortModel) {
                (gridApi as any).setSortModel(state.sortModel);
            }
        });
    }

    clearState(key: string): void {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}__saved`);
  }

  captureState(gridApi: GridApi): any {
  const sortModel = (gridApi as any).getSortModel?.();
  return {
    columnState: gridApi.getColumnState(),
    filterModel: gridApi.getFilterModel(),
    sortModel: sortModel || []
  };
}
}
