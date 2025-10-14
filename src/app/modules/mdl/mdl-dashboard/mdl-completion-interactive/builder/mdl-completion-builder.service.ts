import { Injectable, signal, WritableSignal, effect } from '@angular/core';
import { masterdatalibraryModel } from '../../../../../common/model/masterdatalibraryModel';
import { MdlDataService } from '../../../../../services/mdl-data.service';
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
export class MdlCompletionBuilderService {
  private readonly PAGE_SIZE = 200;  /** All MDL records from the API */
  totalRecords = signal<number>(0); // Total number of available records
  private pageNumber = 0; // Current page number for pagination
  mdlRecords = signal<masterdatalibraryModel[]>([]);
  constructor(
    private mdlDataService: MdlDataService,
    private spinner: NgxSpinnerService,
    private messageService: MessageService
  ) {

  }
  /**
   * Load all materials from the MDL API in chunks
   */
  loadMaterials(supplierIds: number[], callBackFuntion?: any) {
    // this.spinner.show()
    this.mdlRecords.set([]); // Clear existing records
    this.mdlDataService.getMaterialsTotal(supplierIds).subscribe({
      next: (totalMaterials) => {
        const fetchPage = (pageNumber: number): void => {
          this.mdlDataService.getMaterials(pageNumber, this.PAGE_SIZE, supplierIds).subscribe({
            next: (data) => {
              if (data.length > 0) {

                this.mdlRecords.set([...this.mdlRecords(), ...data]);
                if (callBackFuntion !== "" && typeof callBackFuntion !== 'string') {
                  callBackFuntion();
                }
                // Append new chunk of data
                this.totalRecords.set(this.mdlRecords().length); // Update total records count
                // Fetch the next chunk if we haven't fetched all records
                if (this.totalRecords() < totalMaterials) {
                  fetchPage(pageNumber + 1);
                }
                else {
                  // this.spinner.hide();
                }
              }
              else {
                console.warn('No materials found for the given criteria');
                this.messageService.add({
                  severity: 'warn',
                  summary: 'No Materials Found',
                  detail: 'No materials found for the given criteria'
                });
                // this.spinner.hide();
              }
            },
            error: (err) => {
              console.error('Error fetching materials data', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load materials data'
              });
              // this.spinner.hide();
            }
          });
        };
        // Start fetching from the first page
        fetchPage(this.pageNumber);
      },
      error: (err) => {
        console.error('Error fetching total materials count', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load total materials count'
        });
        // this.spinner.hide();
      }
    });
  }
}