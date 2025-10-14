import { Injectable, signal, WritableSignal } from '@angular/core';
import { WellheadKits, WellheadKitComponents } from '../../../../common/model/wellhead-kits';
import { Response } from '../../../../common/model/response';
import { WellheadkitService } from '../../../../services/wellheadkit.service';
import { ThorDrillingMaterials } from '../../../../common/model/thor-drilling-materials';
import { MessageService } from 'primeng/api';
import { NgxSpinnerService } from 'ngx-spinner';
import { v4 as uuidv4 } from 'uuid';

/**
 * Wellhead kit store service, responsible for managing wellhead kit data.
 */

@Injectable({
  providedIn: 'root'
})
export class WellheadkitstoreService {

  // Signal storage for wellhead kits and components
  kits: WritableSignal<WellheadKits[]> = signal<WellheadKits[]>([]);
  components: WritableSignal<WellheadKitComponents[]> = signal<WellheadKitComponents[]>([]);
  gridState = signal<any>({}); // Signal to store grid state, can be used for pagination, sorting, etc.
  activatedKitTypeId = signal<number>(0); // Signal to store the currently activated kit type ID

  constructor(private api: WellheadkitService, private messageService: MessageService,
    private spinner: NgxSpinnerService,
  ) { }

  /****************************Kits[Start]*********************************************/

  // Loads wellhead kits from the API and updates the kits signal.
  loadKits(): void {

    this.api.getKits().subscribe({

      next: (res: Response<WellheadKits[]>) => {

        //var data = res.result;
        //this.kits.update(() => [...data]);

        const data = res.result?.filter(kit => kit.kitType?.toLowerCase() !== 'not assigned') || [];
        this.kits.update(() => [...data]);
        //console.log('store service- loadWellheadKits', this.kits());

      },
      error: (err) => {
        console.error('Error fetching wellhead kit components', err);
        this.kits.update(() => []);
      }

    });

  }

  // Create a new Wellhead Kit
  createKit(kit: WellheadKits): void {

    this.api.createKit(kit).subscribe({

      //next: (res: Response<WellheadKits>) => {
      //  const created = res.result;
      //  if (created) {
      //    this.kits.update(current => [...current, created]);
      //  }
      //},
      next: () => {
        this.spinner.show()
        this.loadKits();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Kit Created successfully.',
          life: 3000, // Message will disappear after 3 seconds
        });
        this.spinner.hide()
      },
      error: (err) => {
        console.error('Error creating Wellhead Kit', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err,
          life: 3000, // Message will disappear after 3 seconds
        });
        this.spinner.hide()
      }

    });
  }

  // Bulk Insert or Update Wellhead Kits
  upsertKits(kitsToUpsert: WellheadKits[]): void {

    this.api.upsertKits(kitsToUpsert).subscribe({

      //next: (res: Response<WellheadKits[]>) => {
      //  const updatedKits = res.result;
      //  this.kits.update(() => [...updatedKits]); // Replaces the entire list
      //},
      next: () => {
        this.spinner.show();
        this.loadKits();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Kit Updated successfully.',
          life: 3000, // Message will disappear after 3 seconds
        });
        this.spinner.hide()
      },
      error: (err) => {
        console.error('Error upserting Wellhead Kits', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err,
          life: 3000, // Message will disappear after 3 seconds
        });
        this.spinner.hide()
      }

    });

  }

  // Soft Delete Kits and its Components by IDs
  softDeleteKits(ids: number[], userId: number): void {
    const validIds = ids.filter(id => id > 0);

    if (validIds.length === 0) {
      console.warn('No valid IDs to delete.');
      return;
    }

    this.api.softDeleteKits(validIds, userId).subscribe({

      //next: (res: Response<WellheadKits[]>) => {
      //  const updatedList = res.result;
      //  this.kits.update(() => [...updatedList]);
      //},
      next: () => {
        this.loadKits();
        this.loadComponents();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Kits deleted successfully.',
          life: 3000, // Message will disappear after 3 seconds
        });
      },
      error: (err) => {
        console.error('Error soft deleting Wellhead Kits', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err,
          life: 3000, // Message will disappear after 3 seconds
        });
      }

    });
  }

  // Returns the total number of kits available
  getKitsCount(): number {
    return this.kits().length;
  }


  /****************************Kits[End]*********************************************/

  /****************************Components[Start]*********************************************/

  // Loads wellhead kit components for a specific kit type from the API and updates the components signal.
  loadComponents(kitTypeId: number = -1): void {
  const loadKitId = (kitTypeId !== -1) ? kitTypeId : this.activatedKitTypeId();
  this.api.getComponents(loadKitId).subscribe({

      next: (res: Response<WellheadKitComponents[]>) => {

        var data = res.result.map(item => (
          {
            ...item,
            isUpdated: false,
            uniqueIdentifier: uuidv4()
            /*uniqueIdentifier: generateUUID()*/
          }));
        this.components.update(() => [...data]);
        //console.log('store service- loadWellheadComponents', this.components());

      },
      error: (err) => {
        console.error('Error fetching wellhead kit components', err);
        this.components.update(() => []);
      }

    });

  }

  // Bulk Insert or Update Wellhead Components
  upsertComponents(componentsToUpsert: WellheadKitComponents[]): void {

    this.api.upsertComponents(componentsToUpsert).subscribe({

      //next: (res: Response<WellheadKitComponents[]>) => {
      //  const updatedComponents = res.result;
      //  this.components.update(() => [...updatedComponents]); // Replaces the entire list
      //},
      next: () => {
        this.loadComponents();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Selected components have been updated successfully.',
          life: 3000, // Message will disappear after 5 seconds
        });
      },
      error: (err) => {
        console.error('Error upserting Wellhead Components', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err,
          life: 3000, // Message will disappear after 5 seconds
        });
      }

    });

  }

  // Soft Delete Components by IDs
  softDeleteComponents(ids: number[], userId: number): void {
    const validIds = ids.filter(id => id > 0);

    if (validIds.length === 0) {
      console.warn('No valid IDs to delete.');
      return;
    }

    this.api.softDeleteComponents(validIds, userId).subscribe({

      //next: (res: Response<WellheadKitComponents[]>) => {
      //  const updatedList = res.result;
      //  this.components.update(() => [...updatedList]);
      //},
      next: () => {
        this.loadComponents(),
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Selected components have been deleted successfully.',
            life: 3000, // Message will disappear after 5 seconds
          });
      },
      error: (err) => {
        console.error('Error soft deleting Wellhead Components', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err,
          life: 3000, // Message will disappear after 5 seconds
        });
      }

    });
  }

  // Returns the total number of components available
  getComponentsCount(): number {
    return this.components().length;
  }

  //Validates whether any of the new components materialKeys already exist in the existing components.

  validateComponents(
    newComponents: WellheadKitComponents[],
    existingComponents: WellheadKitComponents[]
  ): boolean {
    // Create a Set of existing materialKeys for fast lookup
    const existingKeys = new Set(existingComponents.map(c => c.materialKey));

    // Check if any of the new materialKeys already exist
    return newComponents.some(c => existingKeys.has(c.materialKey));
  }

  // Maps an array of ThorDrillingMaterials to WellheadKitComponents
  mapToWellheadKitComponents(
    materials: ThorDrillingMaterials[],
    kitTypeId: number,
    kitType: string,
    userId: number
  ): WellheadKitComponents[] {

    var data = materials.map((item: ThorDrillingMaterials) => ({
      id: 0,
      kitTypeId: kitTypeId,                         // id from kit(Left Grid)
      kitType: kitType,                             // kitType from kit(Left Grid)
      materialKey: item.eid,                        // Id value from popup
      materialId: item.materialId,                  // Materialid from popup
      materialShortDesc: item.materialShortDesc,    // Short Description from popup
      manufacturerNum: item.manufacturerPart,       // Manufacturer from popup
      userId: userId,                               // Active user
      qty: 0,                                       // Default value
      isUpdated: true,                              // Active Entry
      uniqueIdentifier: uuidv4()                    //Generates UUID
    }));

    return data;

  }

  /****************************Components[End]*********************************************/

}

//function to generate UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
