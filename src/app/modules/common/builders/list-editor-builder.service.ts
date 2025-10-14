import { effect, Injectable, signal, WritableSignal } from '@angular/core';
import { ConfigurationValuesService } from '../../../services/configuration-values.service';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { addUpdateDeleteData, configType, ConfigurationValues, listBuilder } from '../../../common/model/configuration-values';
import { ConfigEditorConstants } from '../../../common/enum/list-editor-enum'
import { MessageService } from 'primeng/api';
import { ColumnDefBuilder } from './list-editor-columnconfig';
import { DropDownOptions } from '../../../common/model/taskManagementModel';

@Injectable({
  providedIn: 'root'
})
export class ListEditorBuilderService {

  // Signal storage for wellhead kits and components
  listEditor: WritableSignal<listBuilder[]> = signal<listBuilder[]>([]);
  selectedApplicationId: WritableSignal<number> = signal<number>(0); // Sets the appId , default 0
  selectedBuId: WritableSignal<number> = signal<number>(1); // Sets buid
  selectedView: WritableSignal<number> = signal<number>(1); // Sets the id for tyr dropdown list options
  selectedFunctionId: WritableSignal<number> = signal<number>(-1); // Sets functionId
  configTypes: listBuilder[] = []; // Store configuration types
   // Adding list editor selection for tyr
  selectedListOption: WritableSignal<number> = signal<number>(-1); // Added the selectedList option for tyr dropdown
  listEditorOptionsButtons: WritableSignal<DropDownOptions[]> = signal<DropDownOptions[]>([]); // Sets the tyr options for the dropdown
  // Removed property to avoid shadowing the imported function
  constructor(
    private configService: ConfigurationValuesService,
    private messageService: MessageService
  ) {}

  // Fetch configuration types from API and prepare them
  getConfiguartions(functionId?: number): void {
    // Fetch configuration types based on selected application and function
    this.configService.getConfigurationTypes(this.selectedApplicationId(), functionId != null ? functionId : this.selectedFunctionId(), this.selectedListOption()).subscribe({
      next: data => {
        // Adding this condiotion as admin and system modules are not based on any functionId
        if (functionId === -1) {
        this.configTypes = data.map((element: configType) => { // Removing the check as we are implementing it for completions as well
          return {
            ...element,
            columnDefs: [],
            agApi: null,
            data: []
          } as listBuilder; // Ensure the type is correct
        });
        } else {
          this.configTypes = data.filter(element => element.functionId === this.selectedFunctionId()).map((element: configType) => { // Removing the check as we are implementing it for completions as well
            return {
              ...element,
              columnDefs: [],
              agApi: null,
              data: []
            } as listBuilder; // Ensure the type is correct
          });
        }
        this.listEditor.update(() => this.configTypes) // Store the configuration types in the component
        new ColumnDefBuilder().readerColumns(this.configTypes).subscribe(() => {
          //console.log("Column", this.configTypes);
          this.getConfigData(this.configTypes);
        });

      },
      error: err => console.error('Error loading configuration types', err)
    });
  }

  // Public method to get data (used to separate concerns)
  getConfigData(configTypes): void {
    this.getEntities(configTypes);
  }

  // Load all entity data for each config type
  getEntities(configTypes): void {
    const observables = configTypes.map(type => {
      return this.configService.getAllEntities(ConfigEditorConstants.CONFIG_VALUE, type.configName, this.selectedBuId()).pipe(
        catchError(error => {
          console.error(`Error loading ${type.configName}`, error);
          return of([]);
        }),
        map(data => ({ key: type.configName, data }))
      );
    });

    // Execute all observables in parallel
    forkJoin(observables).subscribe((results: { key: string, data: any }[]) => {
      results.forEach(result => {
        const configType = configTypes.find(type => type.configName === result.key);
        if (configType) {
          configType[ConfigEditorConstants.AG_API] = configType[ConfigEditorConstants.AG_API] || '';
          configType[ConfigEditorConstants.DATA] = result.data;
        }
      });
    });
    //console.log("data", this.configTypes);
  }



  // Add a new record to the configuration
  addRecord(request: ConfigurationValues, type: addUpdateDeleteData): void {
    this.configService.createEntity(request).subscribe({
      next: (data) => {
        const types = this.getConfigTypesRow(type.configName); // Refresh the configurations after adding
        this.getConfigData(types); // Refresh the configurations after adding
        this.messageService.add({ severity: 'success', summary: 'Success', detail: ' Record added Successfully' });
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable Add Record' });
        console.error('Error adding record', error);
      }
    })
  }

  // Update an existing configuration record
  updates(request: ConfigurationValues, type: ConfigurationValues): void {
    this.configService.updateEntity(request).subscribe({
      next: (data) => {
        const types = this.getConfigTypesRow(type.configName); // Refresh the configurations after adding
        this.getConfigData(types); // Refresh the configurations after adding
        this.messageService.add({ severity: 'success', summary: 'Success', detail: ' Record Updated Successfully' });
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable updated Record' });
        // console.error('Error adding record', error);
      }
    })
  }

  // Get matching config types from local cache by name
  getConfigTypesRow(type) {
    return this.configTypes.filter(element => element.configName === type); // Return the stored configuration types
  }

  // Soft delete a records and refresh data
  deleteRecords(request: any, useId: string, type: addUpdateDeleteData): void {
    this.configService.softDeleteMultiple(request, useId).subscribe({
      next: (data) => {
        const types = this.getConfigTypesRow(type.configName); // Refresh the configurations after adding
        this.getConfigData(types); // Refresh the configurations after adding
      },
      error: (error) => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error });
        //console.error('Error deleting record', error);
      }
    })
  }

    // Get the list of options for tyr
  getListEditorOptions() {
    this.configService.getTaskManagementList().subscribe({
      next: (response) => {
        this.listEditorOptionsButtons.set(response.map((item) => ({
          label: item.name,
          value: item.id,
        })));

        if (this.listEditorOptionsButtons.length > 0) {
          this.selectedView.set(this.listEditorOptionsButtons[0].value);
          // Calling the default selection for option
          this.selectedListOption.set(1);
          this.getConfiguartions();
        }
      },
      error: (error) => {
        console.error('Error fetching record', error);
      },
    });
  }
}
