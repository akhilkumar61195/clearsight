import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SchematicAssemblyDto } from '../../../common/model/schematic-assembly-dto';
import { WellFeatures } from '../../../common/model/wellfeatures';
import { Sections } from '../../../common/model/sections';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-clone-assembly',
  standalone:true,
  imports:[...PRIME_IMPORTS],
  templateUrl: './clone-assembly.component.html',
  styleUrl: './clone-assembly.component.scss'
})
export class CloneAssemblyComponent {
  @Input() visible: boolean = false;
  @Input() assembly: SchematicAssemblyDto;
  @Input() wellFeatures: WellFeatures[];
  @Input() sections: Array<Sections>;
  @Output() onCancel = new EventEmitter<void>();
  @Output() onClone = new EventEmitter<SchematicAssemblyDto>();
  clonedAssembly: SchematicAssemblyDto;

  public selectedSection: any;
  public selectedZone: any;
  public zoneOptions: any[] = [];

  constructor(private fb: FormBuilder, private messageService: MessageService) {
    // Initialize the cloned assembly
    this.clonedAssembly = {} as SchematicAssemblyDto;
  }

  // on initialization, set up the form and default values
  onShow() {
    // Initialize cloned assembly with the input assembly
    this.clonedAssembly = { ...this.assembly };
    const section = this.sections.find(element => element.sectionId === this.clonedAssembly.sectionID)
    // Set default section based on current section
    this.selectedSection = (section || null);
    this.zoneOptions = this.updateZoneOptions();
    const zone = this.zoneOptions?.find(element => element.value === this.clonedAssembly.zoneId)
    // Set default zone based on current zone
    this.selectedZone = (zone || null);
  }

  // on changes to the section, update the zone
  private updateZoneOptions() {
    if (this.wellFeatures.length === 0 || this.wellFeatures[0].copyZone === undefined) {
      if (this.selectedSection?.sectionId == 1) {
          // When copyzone is true, display zones in ascending order
          return [
            { label: 'Zone 1', value: 1 },
            { label: 'Zone 2 -> ' + 2, value: 2 }
          ];
        }
        if (this.selectedSection?.sectionId == 2) {
          return [
            { label: 'No Zone', value: 0 },
            { label: 'Zone 2 -> ' + 2, value: 2 },
            { label: 'Zone 1', value: 1 }
          ];
        }
    }
    else {
      if (!this.wellFeatures[0].copyZone) {
        // When copyzone is false, display zones in descending order
        const options = [];
        if (this.selectedSection?.sectionId == 2) {
          options.push({ label: 'No Zone', value: 0 });
        }
        for (let i = this.wellFeatures[0].noOfZones; i >= 1; i--) {
          options.push({ label: `Zone ${i}`, value: i });
        }
        return options;
      }
      else {
        if (this.selectedSection?.sectionId == 1) {
          // When copyzone is true, display zones in ascending order
          return [
            { label: 'Zone 1', value: 1 },
            { label: 'Zone 2 -> ' + this.wellFeatures[0].noOfZones, value: 2 }
          ];
        }
        if (this.selectedSection?.sectionId == 2) {
          return [
            { label: 'No Zone', value: 0 },
            { label: 'Zone 2 -> ' + this.wellFeatures[0].noOfZones, value: 2 },
            { label: 'Zone 1', value: 1 }
          ];
        }
      }
    }
  }

  // Add change handler for section dropdown
  onSectionChange() {
    this.zoneOptions = this.updateZoneOptions();
  }

  // on close, emit the cancel event
  close() {
    this.onCancel.emit();
  }

  // on clone, emit the clone event with the cloned assembly
  clone() {
    this.clonedAssembly.section = this.selectedSection;
    this.clonedAssembly.zone = this.selectedZone;
    if (this.selectedSection) {
      if (this.selectedSection?.sectionId != 3 && !this.selectedZone) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please select a zone' });
        return;
      }
      else {
        if (this.selectedSection.sectionId === 3) {
          this.selectedZone = null; // No zone for section 3
          this.clonedAssembly.zone = this.selectedZone; // No zone for section 3
        }
        this.onClone.emit(this.clonedAssembly);

      }
    }
    else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please select a section' });
      return;
    }
  }

}
