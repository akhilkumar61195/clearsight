import { Injectable } from '@angular/core';
import { SchematicAssemblyDto } from '../../../common/model/schematic-assembly-dto';
import { SchematicDetailDto } from '../../../common/model/schematic-detail-dto';
import { SchematicsRequest } from '../../../common/model/schematic-detail-dto';
import { AuthService } from '../../../services/auth.service';
import { CompletionschematicService } from '../../../services/completionschematic.service';
import { MessageService } from 'primeng/api';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssemblyBuilderService {
  constructor(
    private authService: AuthService,
    private completionschematicService: CompletionschematicService,
    private messageService: MessageService
  ) { }

  generateUniqueId(): number {
    return Math.floor(Math.random() * 1_000_000_000);
  }

  /**
   * Creates a new assembly row.
   * @param schematicId The ID of the schematic.
   * @param zoneId The ID of the zone.
   * @param copyAssemblyId The ID of the assembly to copy.
   * @param sectionID The ID of the section.
   * @param itemNumber The item number.
   * @param stringType The type of string (e.g., 'Outer', 'Inner').
   * @param userDetail The details of the user.
   * @param isSecondary Whether the assembly is secondary.
   * @param assemblyTypeId The ID of the assembly type.
   * @returns The newly created assembly row.
   */
  createNewAssemblyRow(
    schematicId: number,
    zoneId: number = null,
    copyAssemblyId: number = null,
    sectionID: number = null,
    itemNumber: number = 0,
    stringType: string = 'Outer',
    userDetail: any,
    isSecondary: boolean = false,
    assemblyTypeId: number = 0 // Default assembly type ID
  ): SchematicAssemblyDto {
    return {
      schematicAssemblyID: 0,
      uniqueId: this.generateUniqueId(),
      schematicsID: schematicId,
      sectionID: sectionID,
      zoneId: zoneId,
      itemNumber: itemNumber,
      stringType: stringType, // 'Outer' or 'Inner'
      schematicsTradeName: null,
      assemblyTypeID: assemblyTypeId, // Default assembly type ID
      assemblyName: null,
      userId: userDetail.uid,
      designTypeID: isSecondary ? 2 : 1, // Secondary if conditions met, otherwise Primary
      designType: isSecondary ? 'Secondary' : 'Primary',
      isDeleted: 0,
      copyAssemblyId: copyAssemblyId,
      zone:null
    };
  }

  copyAndUpdateAssemblies(
    allAssemblyDetails: SchematicAssemblyDto[],
    allComponentDetails: SchematicDetailDto[],
    zoneCount: number,
    schematicId: number,
    userDetail: any,
    copyZone: boolean = true
  ): { assemblies: SchematicAssemblyDto[], components: SchematicDetailDto[] } {
    if (!copyZone) {
      return { assemblies: allAssemblyDetails, components: allComponentDetails };
    }

    //First Delete Existing components of target assembly    
    allComponentDetails.forEach(
      (component) => {
        if (component.zoneID > 2) {
          component.isDeleted = 1;
        }
      }
    );

    const zone2Assemblies = allAssemblyDetails.filter(assembly => assembly.zoneId == 2);
    zone2Assemblies.forEach(zone2Assembly => {
      for (let targetZone = zoneCount; targetZone > 2; targetZone--) {
        let assembly = allAssemblyDetails.filter(assembly => assembly.copyAssemblyId == zone2Assembly.copyAssemblyId && assembly.zoneId == targetZone)[0];
        if (assembly == null) {
          // Copy zone 2 assemblies to higher zones if it is not already copied
          let newRow = this.createNewAssemblyRow(schematicId, targetZone, zone2Assembly.copyAssemblyId, zone2Assembly.sectionID, zone2Assembly.itemNumber,zone2Assembly.stringType, userDetail);
          newRow.schematicsTradeName = zone2Assembly.schematicsTradeName;
          newRow.assemblyTypeID = zone2Assembly.assemblyTypeID;
          newRow.designTypeID = zone2Assembly.designTypeID;
          allAssemblyDetails.push(newRow);
          this.addComponentsInCopiedAssembly(zone2Assembly, newRow, allComponentDetails);
        } else {
          // Update existing assemblies if there is any change
          assembly.assemblyTypeID = zone2Assembly.assemblyTypeID;
          assembly.schematicsTradeName = zone2Assembly.schematicsTradeName;
          assembly.itemNumber = zone2Assembly.itemNumber;
          assembly.designTypeID = zone2Assembly.designTypeID;
          assembly.isDeleted = zone2Assembly.isDeleted;
          assembly.stringType = zone2Assembly.stringType;
          this.updateComponentsForExistingAssembly(zone2Assembly, assembly, allComponentDetails, userDetail);
        }
      }
    });

    // Delete assemblies not in the zone count
    const assembliesToDelete = allAssemblyDetails.filter(assembly => assembly.zoneId > zoneCount);
    assembliesToDelete.forEach(assembly => {
      assembly.isDeleted = 1;
      assembly.itemNumber = 0;
      this.deleteComponentsOfDeletedAssembly(assembly, allComponentDetails);
    });

    this.updateAssembliesItemNumbers(allAssemblyDetails);
    this.updateComponentsItemNumber(allAssemblyDetails, allComponentDetails);
    this.updateCopyComponentsSubItemNumbers(allAssemblyDetails, allComponentDetails);

    return { assemblies: allAssemblyDetails, components: allComponentDetails };
  }

  addComponentsInCopiedAssembly(
    sourceschematicAssembly: SchematicAssemblyDto,
    targetSchematicAssembly: SchematicAssemblyDto,
    allComponentDetails: SchematicDetailDto[]
  ) {
    let sourceComponents = allComponentDetails.filter(c => c.schematicAssemblyID === sourceschematicAssembly.schematicAssemblyID);
    if (sourceComponents == null || sourceComponents.length == 0) {
      sourceComponents = allComponentDetails.filter(c => c.schematicAssemblyID === sourceschematicAssembly.uniqueId);
    }
    sourceComponents.forEach(sourceComponent => {
      allComponentDetails.push({
        ...sourceComponent,
        schematicsDetailID: 0,
        schematicAssemblyID: targetSchematicAssembly.uniqueId,
        zoneID: targetSchematicAssembly.zoneId,
        designTypeID: targetSchematicAssembly.designTypeID,
        designType: targetSchematicAssembly.designType
      });
    });
  }

  updateComponentsForExistingAssembly(
    sourceschematic: SchematicAssemblyDto,
    targetAssembly: SchematicAssemblyDto,
    allComponentDetails: SchematicDetailDto[],
    userDetail: any
  ) {
    let sourceComponents = allComponentDetails.filter(c => c.schematicAssemblyID === sourceschematic.schematicAssemblyID);
    sourceComponents = [...sourceComponents, ...allComponentDetails.filter(c => c.schematicAssemblyID === sourceschematic.uniqueId)];
    sourceComponents.forEach(sourceComponent => {
      let targetComponent = allComponentDetails.filter(c => c.schematicAssemblyID === targetAssembly.schematicAssemblyID && c.copyComponentId == sourceComponent.copyComponentId)[0];
      if (!targetComponent) {
        // Add component if it doesn't exist in target assembly
        allComponentDetails.push({
          schematicsDetailID: 0,
          schematicAssemblyID: targetAssembly.schematicAssemblyID,
          schematicsID: sourceComponent.schematicsID,
          cvX_CRW_ID: sourceComponent.cvX_CRW_ID,
          componentTypeName: sourceComponent.componentTypeName,
          materialNumber: sourceComponent.materialNumber,
          assemblyLengthinft: sourceComponent.assemblyLengthinft,
          schematicsNotes: sourceComponent.schematicsNotes,
          schematicsDetailDescription: sourceComponent.schematicsDetailDescription,
          itemNumber: targetAssembly.itemNumber,
          subItemNumber: sourceComponent.subItemNumber.toString(),
          userId: userDetail.uid,
          sectionID: sourceComponent.sectionID,
          isDeleted: sourceComponent.isDeleted,
          zoneID: targetAssembly.zoneId,
          copyComponentId: sourceComponent.copyComponentId,
          supplierPartNumber: sourceComponent.supplierPartNumber,
          legacyRefNumber: sourceComponent.legacyRefNumber,
          serialNumber: sourceComponent.serialNumber,
          designTypeID: targetAssembly.designTypeID,
          designType: targetAssembly.designType
        });
      } else {
        // Update existing component
        targetComponent.assemblyLengthinft = sourceComponent.assemblyLengthinft;
        targetComponent.schematicsNotes = sourceComponent.schematicsNotes;
        targetComponent.serialNumber = sourceComponent.serialNumber;
        targetComponent.isDeleted = sourceComponent.isDeleted;
        targetComponent.designTypeID = targetAssembly.designTypeID;
        targetComponent.designType = targetAssembly.designType;
      }
    });
  }

  deleteComponentsOfDeletedAssembly(assembly: SchematicAssemblyDto, allComponentDetails: SchematicDetailDto[]) {
    allComponentDetails.forEach(component => {
      if (component.schematicAssemblyID == assembly.schematicAssemblyID) {
        component.isDeleted = 1;
        component.itemNumber = assembly.itemNumber;
      }
    });
  }

  updateSchematicsForZone1(
    allAssemblyDetails: SchematicAssemblyDto[],
    allComponentDetails: SchematicDetailDto[]
  ): { assemblies: SchematicAssemblyDto[], components: SchematicDetailDto[] } {
    // Mark assemblies in zone 2 and above for deletion
    allAssemblyDetails.forEach(assembly => {
      if (assembly.zoneId >= 2) {
        assembly.isDeleted = 1;
        assembly.itemNumber = 0;
      }
    });

    // Mark components in zone 2 and above for deletion
    allComponentDetails.forEach(component => {
      if (component.zoneID >= 2) {
        component.isDeleted = 1;
        component.itemNumber = 0;
      }
    });

    this.updateAssembliesItemNumbers(allAssemblyDetails);
    this.updateComponentsItemNumber(allAssemblyDetails, allComponentDetails);

    return { assemblies: allAssemblyDetails, components: allComponentDetails };
  }

  updateAssembliesItemNumbers(allAssemblyDetails: SchematicAssemblyDto[]) {
    const sectionsOrder = [3, 2, 1]; // 3: Upper, 2: Intermediate, 1: Lower
    allAssemblyDetails = allAssemblyDetails.sort((a, b) => {
      //First sort by itemNumber
      if (a.sectionID === b.sectionID && a.zoneId == b.zoneId) {
        const itemNumberComparison = a.itemNumber - b.itemNumber;
        if (itemNumberComparison !== 0) return itemNumberComparison;
      }

      // Sort by Section (Upper -> Intermediate -> Lower)
      const sectionComparison = sectionsOrder.indexOf(a.sectionID) - sectionsOrder.indexOf(b.sectionID);
      if (sectionComparison !== 0) return sectionComparison;

      // Handle Intermediate section specifically
      if (a.sectionID === 2 && b.sectionID === 2) {
        // Treat null zone as higher priority than numbered zones
        if ((a.zoneId === null || a.zoneId === undefined) && b.zoneId !== null && b.zoneId !== undefined) return -1;
        if ((b.zoneId === null || b.zoneId === undefined) && a.zoneId !== null && a.zoneId !== undefined) return 1;

        // Sort by Zone (Descending for zones, null zones already handled)
        const zoneComparison = (b.zoneId ?? -1) - (a.zoneId ?? -1);
        if (zoneComparison !== 0) return zoneComparison;
      }

      const zoneComparison = b.zoneId - a.zoneId;
      if (zoneComparison !== 0) return zoneComparison;

      if (a.sectionID === 2 && b.sectionID === 2) {
        // Extract Zone 2 assemblies and maintain their order
        const zone2Assemblies = allAssemblyDetails.filter(assembly => assembly.zoneId === 2 && assembly.sectionID === 2);
        // Create a mapping of Zone 2 assembly orders based on item numbers
        const zone2OrderMap = new Map<number, number>();
        zone2Assemblies.forEach(assembly => {
          zone2OrderMap.set(assembly.copyAssemblyId, assembly.itemNumber);
        });

        // For assemblies in higher zones, align them with the Zone 2 order
        if (a.zoneId >= 2 && b.zoneId >= 2) {
          const aZone2Index = zone2OrderMap.get(a.copyAssemblyId) ?? Number.MAX_SAFE_INTEGER;
          const bZone2Index = zone2OrderMap.get(b.copyAssemblyId) ?? Number.MAX_SAFE_INTEGER;
          return aZone2Index - bZone2Index;
        }
      }

      if (a.sectionID === 1 && b.sectionID === 1) {
        // Extract Zone 2 assemblies and maintain their order
        const zone2Assemblies = allAssemblyDetails.filter(assembly => assembly.zoneId === 2 && assembly.sectionID === 1);

        // Create a mapping of Zone 2 assembly orders based on item numbers
        const zone2OrderMap = new Map<number, number>();
        zone2Assemblies.forEach(assembly => {
          zone2OrderMap.set(assembly.copyAssemblyId, assembly.itemNumber);
        });

        // For assemblies in higher zones, align them with the Zone 2 order
        if (a.zoneId >= 2 && b.zoneId >= 2) {
          const aZone2Index = zone2OrderMap.get(a.copyAssemblyId) ?? Number.MAX_SAFE_INTEGER;
          const bZone2Index = zone2OrderMap.get(b.copyAssemblyId) ?? Number.MAX_SAFE_INTEGER;
          return aZone2Index - bZone2Index;
        }
      }
    });

    // Find the last item number from upper and intermediate sections
    //const nonLowerSectionItems = this.allAssemblyDetails.filter(a => a.isDeleted != 1 && a.sectionID !== 1).map(a => a.itemNumber);    
    let minItemNumber2 = 0;
    // Assign item numbers sequentially
    let minItemNumber = 0;
    allAssemblyDetails.filter(assembly => assembly.isDeleted != 1).forEach((assembly, index) => {
      if (assembly.sectionID !== 1) {
        // For Upper and Intermediate sections
        if (assembly.designTypeID == 1 || assembly.designTypeID == 2) {  //Primary and Secondary
          minItemNumber = Number.isInteger(minItemNumber) ? minItemNumber + 1 : Math.ceil(minItemNumber);
          minItemNumber2 = Number.isInteger(minItemNumber2) ? minItemNumber2 + 1 : Math.ceil(minItemNumber2);
          assembly.itemNumber = parseFloat((minItemNumber).toFixed(1));
        }
        else if (assembly.designTypeID == 3) {  //Contigency
          minItemNumber += 0.1;
          minItemNumber2 += 0.1;
          assembly.itemNumber = parseFloat(minItemNumber.toFixed(1));
        }
      }
      else {
        // For Lower section - continue from last number of intermediate section
        if (assembly.designTypeID == 1) {
          minItemNumber = Number.isInteger(minItemNumber) ? minItemNumber + 1 : Math.ceil(minItemNumber);
          assembly.itemNumber = parseFloat((minItemNumber).toFixed(1));
        }
        else if (assembly.designTypeID == 2) {
          minItemNumber2 = Number.isInteger(minItemNumber2) ? minItemNumber2 + 1 : Math.ceil(minItemNumber2);
          assembly.itemNumber = parseFloat((minItemNumber2).toFixed(1));
        }
      }
    });
    allAssemblyDetails.filter(assembly => assembly.isDeleted == 1).forEach((assembly, index) => {
      assembly.itemNumber = 0;
    });
  }

  updateComponentsItemNumber(allAssemblyDetails: SchematicAssemblyDto[], allComponentDetails: SchematicDetailDto[]) {
    allComponentDetails.forEach(component => {
      let itemNumber: number = allAssemblyDetails.find(assembly =>
        assembly.schematicAssemblyID == component.schematicAssemblyID)?.itemNumber;

      if (itemNumber == undefined) {
        itemNumber = allAssemblyDetails.find(assembly =>
          assembly.uniqueId == component.schematicAssemblyID)?.itemNumber;
      }
      component.itemNumber = itemNumber;
    });
  }

  updateCopyComponentsSubItemNumbers(allAssemblyDetails: SchematicAssemblyDto[], allComponentDetails: SchematicDetailDto[]) {
    // Extract Zone 2 components and maintain their order
    const zone2Components = allComponentDetails.filter(component => component.zoneID == 2 && component.isDeleted != 1);
    // Create a mapping of Zone 2 components orders based on item numbers
    const zone2OrderMap = new Map<number, string>();
    zone2Components.forEach(component => {
      zone2OrderMap.set(component.copyComponentId, component.subItemNumber);
    });

    allAssemblyDetails.forEach(assembly => {
      if (assembly.zoneId != null && assembly.zoneId > 2) {
        let assemblyComponents = allComponentDetails.filter(component =>
          component.schematicAssemblyID == assembly.schematicAssemblyID && component.isDeleted != 1);
        assemblyComponents.forEach(component => {
          component.subItemNumber = zone2OrderMap.get(component.copyComponentId);
        });
      }
    });
  }

  updateAssembliesForZoneChange(schematicId: number, newZoneCount: number, userDetail: any, copyZone: boolean): Observable<void | SchematicsRequest> {
    let allAssemblyDetails: SchematicAssemblyDto[] = [];
    let allComponentDetails: SchematicDetailDto[] = [];

    // Using switchMap to chain the HTTP requests
    return this.completionschematicService.getSchematicAssemblies(schematicId, -1).pipe(
      switchMap(assemblies => {
        allAssemblyDetails = assemblies;
        allAssemblyDetails.forEach(assembly => assembly.uniqueId = this.generateUniqueId());
        return this.completionschematicService.getSchematicComponents(schematicId, -1, -1);
      }),
      map(components => {
        allComponentDetails = components;
        let result;
        if (allAssemblyDetails.length > 0) {
          if (newZoneCount == 1) {
            result = this.updateSchematicsForZone1(allAssemblyDetails, allComponentDetails);
          }
          else if (newZoneCount > 1) {
            result = this.copyAndUpdateAssemblies(
              allAssemblyDetails,
              allComponentDetails,
              newZoneCount,
              schematicId,
              userDetail,
              copyZone
            );
          }


          return {
            AssemblyDtos: result.assemblies,
            DetailDtos: result.components
          };
        }
      }),
      switchMap(schematicRequest => {
        if (schematicRequest?.AssemblyDtos?.length > 0) {
          return this.completionschematicService.upsertSchematics(schematicRequest);
        }
        return of(schematicRequest);
      }),
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Assemblies and Components have been successfully updated as per updated number of zones.'
        });
      }),
      catchError(error => {
        console.error('Error updating schematic or components', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred while updating schematic and components.'
        });
        return throwError(() => error);
      })
    );
  }

  /** Function to clone an assembly
   * It takes the source assembly ID, target section ID, target zone, and user details as parameters
   */
  cloneAssembly(allAssemblyDetails: SchematicAssemblyDto[], allComponentDetails: SchematicDetailDto[], sourceAssemblyId: number, targetSectionID: number, targetZone: number, stringType: string, userDetail: any) {
    let assembly = allAssemblyDetails.find(a => a.schematicAssemblyID === sourceAssemblyId);
    if( !assembly) {
      // If assembly is not found by schematicAssemblyID, try finding it by uniqueId
      assembly = allAssemblyDetails.find(a => a.uniqueId === sourceAssemblyId);
    }
    if (!assembly) return;
    const targetSectionAssemblies = allAssemblyDetails.filter(a => a.sectionID === targetSectionID && a.zoneId === targetZone);
    //Find minimum item number in target section
    const targetSectionItemNumbers = targetSectionAssemblies.map(a => a.itemNumber);
    const newItemNumber = targetSectionItemNumbers.length > 0 ? Math.min(...targetSectionItemNumbers) - 1 : 0;
// Create a new assembly row with the same properties as the source assembly
    if(targetZone === 0) {
      // If target zone is 0, set it to null
      targetZone = null;
    }
    // If targetSectionID is 1 or 2, generate a unique ID for CopyAssemblyId
    let CopyAssemblyId = null;
    if ((targetSectionID === 1 || targetSectionID === 2) && targetZone == 2) {
      CopyAssemblyId = this.generateUniqueId();
    }
    let newRow = this.createNewAssemblyRow(assembly.schematicsID, targetZone, CopyAssemblyId, targetSectionID, newItemNumber, stringType, userDetail);
    newRow.schematicsTradeName = assembly.schematicsTradeName;
    newRow.assemblyTypeID = assembly.assemblyTypeID;
    newRow.designTypeID = assembly.designTypeID;
    allAssemblyDetails.push(newRow);
    this.addComponentsInClonedAssembly(assembly, newRow, allComponentDetails);
  }

  // Function to add components from the source assembly to the target assembly
  // It takes the source assembly, target assembly, and all component details as parameters
  addComponentsInClonedAssembly(
    sourceschematicAssembly: SchematicAssemblyDto,
    targetSchematicAssembly: SchematicAssemblyDto,
    allComponentDetails: SchematicDetailDto[]
  ) {
    let sourceComponents = allComponentDetails.filter(c => c.schematicAssemblyID === sourceschematicAssembly.schematicAssemblyID);
    if (sourceComponents == null || sourceComponents.length == 0) {
      sourceComponents = allComponentDetails.filter(c => c.schematicAssemblyID === sourceschematicAssembly.uniqueId);
    }
    sourceComponents.forEach(sourceComponent => {
      allComponentDetails.push({
        ...sourceComponent,
        schematicsDetailID: 0,
        itemNumber: targetSchematicAssembly.itemNumber,
        sectionID: targetSchematicAssembly.sectionID,
        schematicAssemblyID: targetSchematicAssembly.uniqueId,
        zoneID: targetSchematicAssembly.zoneId,
        designTypeID: targetSchematicAssembly.designTypeID,
        designType: targetSchematicAssembly.designType,
        uniqueId: this.generateUniqueId()
      });
    });
  }
}
