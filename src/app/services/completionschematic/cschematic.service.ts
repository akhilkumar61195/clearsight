import { Injectable, Signal, signal } from '@angular/core';
import { CompletionschematicService } from '../completionschematic.service';
import { Completionschematicheader } from '../../common/model/completionschematicheader';
import { SchematicAssemblyDto } from '../../common/model/schematic-assembly-dto';
import { SchematicDetailDto } from '../../common/model/schematic-detail-dto';

@Injectable({
  providedIn: 'root'
})
//builder
export class CschematicService {

  private schematicSelection = signal<Completionschematicheader[]>([]);
  private assemblies = signal<SchematicAssemblyDto[]>([]);
  private components = signal<SchematicDetailDto[]>([]);
  constructor(private CompletionschematicService: CompletionschematicService) { }

  //Schematic Selection
  setSchematics(pageNumber: number, pageSize: number) {
    this.CompletionschematicService.getSchematicHeaders(pageNumber, pageSize)
      .subscribe({

        next: (data: Completionschematicheader[]) => {
          this.schematicSelection.update(() => data);
        },
        error: (error) => { console.log(error) }

      });
  }

  getSchematicSelection(): Signal<Completionschematicheader[]> {
    return this.schematicSelection.asReadonly();
  }

  //AssemblyBuilder
  //Assemblies

  setAssemblies(schematicsID: number, sectionID: number = -1) {
    this.CompletionschematicService.getSchematicAssemblies(schematicsID, sectionID)
      .subscribe({

        next: (data: SchematicAssemblyDto[]) => {
          this.assemblies.update(() => data);
        },
        error: (error) => { console.log(error) }

      });
  } 

  getAssemblies(): Signal<SchematicAssemblyDto[]> {
    return this.assemblies.asReadonly();
  }

  // Add a new assembly
  addAssembly(newAssembly: SchematicAssemblyDto): void {
    this.assemblies.update(existing => [...existing, newAssembly]);
  }

  //Components

  setComponents(schematicsID: number, sectionID: number = -1, itemNumber: number = -1) {
    this.CompletionschematicService.getSchematicComponents(schematicsID, sectionID, itemNumber)
      .subscribe({

        next: (data: SchematicDetailDto[]) => {
          this.components.update(() => data);
        },
        error: (error) => { console.log(error) }

      });
  }

  getComponents(): Signal<SchematicDetailDto[]> {
    return this.components.asReadonly();
  }

  // Add a new component
  addComponent(newComponent: SchematicDetailDto): void {
    this.components.update(existing => [...existing, newComponent]);
  }

}
