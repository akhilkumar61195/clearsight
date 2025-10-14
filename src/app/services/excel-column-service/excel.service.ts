import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { S3BucketService } from '../document-service/s3-bucket.service';
import { switchMap, throwError } from 'rxjs';
import * as XLSX from 'xlsx';
@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  constructor(
    private s3BucketService: S3BucketService,
    private messageService: MessageService
  ) {}

  /**
   * @param key S3 key of the template file to download
   * Downloads an Excel template file from S3 using a presigned URL.
   */
  downloadTemplate(key: string): void {
    this.s3BucketService
      .getPresignedUploadUrl({
        key,
        isPut: false,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      .pipe(
        switchMap((s3Url: any) => {
          if (!s3Url || !s3Url.url) {
            this.messageService.add({ severity: 'error', detail: 'Failed to get presigned URL!' });
            return throwError(() => new Error('Invalid presigned URL'));
          }
          return this.s3BucketService.downloadFile(s3Url.url);
        })
      )
      .subscribe({
        next: (downloadResp: Blob) => {
          const url = window.URL.createObjectURL(downloadResp);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = key.split('/').pop();
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.messageService.add({ severity: 'error', detail: 'Failed to download file!' });
        }
      });
  }

  /**
   * Validates the headers of an Excel sheet against expected headers.
   * @param headers The headers found in the Excel sheet.
   * @param expectedHeaders The headers expected in the Excel sheet.
   * @param strictOrder Whether to enforce strict order of headers.
   * @returns True if headers are valid, false otherwise.
   */
  validateHeaders(headers: string[], expectedHeaders: string[], strictOrder: boolean = false): boolean {
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    const normalizedExpected = expectedHeaders.map(h => h.trim().toLowerCase());

    if (strictOrder) {
      // Same length required
      if (normalizedHeaders.length !== normalizedExpected.length) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'The file is not valid. Make sure you are using the correct template.'
        });
        return false;
      }

      // Check exact order
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (normalizedHeaders[i] !== normalizedExpected[i]) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Column Header Not Valid - Expected: ${expectedHeaders[i]}, Found: ${headers[i]}`
          });
          return false;
        }
      }
    } else {
      // Order not strict for check only missing
      const missing = normalizedExpected.filter(h => !normalizedHeaders.includes(h));
      if (missing.length > 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Missing Column(s): ' + missing.join(', ')
        });
        return false;
      }
    }
    return true;
  }

  /**
   * 
   * @param worksheet The worksheet to analyze
   * Finds the index of the header row in the given worksheet by looking for the first non-empty row.
   * @returns The index of the header row, or 0 if not found.
   */
  findHeaderRowIndex(worksheet: XLSX.WorkSheet): number {
    const range = XLSX.utils.decode_range(worksheet['!ref']!);

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell && cell.v && cell.v.toString().trim() !== '') {
          return row; // First non-empty row is header row
        }
      }
    }

    return range.s.r; // fallback: top row
  }

  /**
   * Replaces the headers in an Excel worksheet based on a mapping.
   * @param worksheet The worksheet to modify.
   * @param headerMapping A mapping of old header names to new header names.
   * @param headerRowIndex The row index of the headers (default is 0).
   */
  replaceExcelHeaders(worksheet: XLSX.WorkSheet, headerMapping: Record<string, string>, headerRowIndex = 0): void {
    const range = XLSX.utils.decode_range(worksheet['!ref']!);

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
      const cell = worksheet[cellAddress];

      if (cell && cell.v && headerMapping[cell.v]) {
        cell.v = headerMapping[cell.v]; // Replace header
        cell.w = headerMapping[cell.v]; // Ensure display value is updated
      }
    }
  }

  /**
   * Extracts the headers from an Excel worksheet.
   * @param worksheet The worksheet to extract headers from
   * @param headerRowIndex The row index of the headers (default is 0)
   * @returns An array of header names
   */
  getExcelHeaders(worksheet: XLSX.WorkSheet, headerRowIndex?: number): string[] {
    const headers: string[] = [];
    const range = XLSX.utils.decode_range(worksheet['!ref']!);

    // Auto-detect header row if not passed
    const rowIndex = headerRowIndex !== undefined ? headerRowIndex : this.findHeaderRowIndex(worksheet);

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
      const cell = worksheet[cellAddress];
      headers.push(cell ? cell.v.toString().trim() : '');
    }
    
    return headers;
  }
}
