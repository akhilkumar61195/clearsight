import { Injectable, signal, WritableSignal, effect, computed } from '@angular/core';
import { masterdatalibraryModel } from '../../../../common/model/masterdatalibraryModel';
import { MdlDataService } from '../../../../services/mdl-data.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

/**
 * MDL Store Service
 * Manages state for Master Data Library (MDL) records using Angular signals
 * 
 * Features:
 * - Reactive state management with signals
 * - Material data loading and searching
 * - Loading state management
 * - Error handling with user feedback
 */
@Injectable({
  providedIn: 'root'
})
export class MdlBuilderService {
  private readonly PAGE_SIZE = 200;  /** All MDL records from the API */
  private totalRecords = signal<number>(0); // Total number of available records
  private pageNumber = 0; // Current page number for pagination
  // mdlRecords = signal<masterdatalibraryModel[]>([]);
  mdlRecords: WritableSignal<masterdatalibraryModel[]> = signal([]);
    
  // Filtered records: groupName is null, empty, or 'Group 1'
  // filteredMdlRecords = computed(() =>
  //   this.mdlRecords().filter(
  //     item =>
  //       !item.groupName || item.groupName.trim() === '' || item.groupName.trim() === 'Group 1'
  //   )
  // );
  filteredMdlRecords = computed(() => this.mdlRecords());

  constructor(
    private mdlDataService: MdlDataService,
    private spinner: NgxSpinnerService,
    private messageService: MessageService
  ) {
    // Effect: Keep filtered materials in sync with mdlRecords
    effect(() => {
      const current = this.mdlRecords();
    });
  }
  /**
   * Load all materials from the MDL API in chunks
   */
     /**
   * Load all materials from the MDL API in paginated chunks
   */
  loadMaterials(): void {
    this.mdlRecords.set([]); // Clear before reload
    this.spinner.show();

    this.mdlDataService.getMaterialsTotal().subscribe({
      next: (totalMaterials) => {
        const fetchPage = (page: number): void => {
          this.mdlDataService.getMaterials(page, this.PAGE_SIZE).subscribe({
            next: (data) => {
              if (data && data.length > 0) {
                const updated = [...this.mdlRecords(), ...data];
                this.mdlRecords.set(updated);
                this.totalRecords.set(updated.length);

                if (updated.length < totalMaterials) {
                  fetchPage(page + 1);
                } else {
                  this.spinner.hide();
                }
              } else {
                this.spinner.hide();
              }
            },
            error: (err) => {
              this.spinner.hide();
              this.messageService.add({
                severity: 'error',
                summary: 'Fetch Error',
                detail: 'Failed to load materials'
              });
            }
          });
        };

        // Start with first page
        fetchPage(this.pageNumber);
      },
      error: (err) => {
        this.spinner.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Count Error',
          detail: 'Failed to load material count'
        });
      }
    });
  }
}