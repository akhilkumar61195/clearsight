import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BatchFileUpload } from '../common/model/batch-file-upload';
import { Observable, bufferCount, catchError, concatMap, finalize, from, lastValueFrom, map, throwError, toArray } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BatchJobWithLogs } from '../common/model/batch-job-with-logs';
import { TaskTypes } from '../common/enum/common-enum';
import { SchematicClamps } from '../common/model/schematic-clamps';
import { inventoryScreen, LhScreen, mitiScreen, tenarisScreen, vallorecScreen, wellHeadScreen, yardInventoryScreen } from '../common/constant';

@Injectable({
  providedIn: 'root'
})
export class BulkuploadService {

  BULKUPLOAD_ENDPOINT = environment.APIEndpoint + '/api/BulkUpload';
  BULKUPLOAD_DEPTHTABLE_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics';
  constructor(private http: HttpClient) { }

  uploadClampsFile(request: BatchFileUpload): Observable<any> {
    const formData = new FormData();
    formData.append('file', request.file, request.file.name);
    formData.append('jsonData', request.jsonData);
    formData.append('userId', request.userId.toString());

    const url: string = `${this.BULKUPLOAD_ENDPOINT}/uploadClamps`;
    return this.http.post<any>(url, formData);
  }

  uploadFile(request: BatchFileUpload, taskType: string, selectedView?: string, includeFile: boolean = true): Observable<any> {
    const formData = new FormData();


    formData.append('file', request.file, request.file.name);
    formData.append('jsonData', request.jsonData);
    formData.append('userId', request.userId.toString());

    let url: string;
    if (taskType === TaskTypes.CONTROLLINECLAMPS) {
      url = `${this.BULKUPLOAD_ENDPOINT}/uploadClamps`;
    } else if (taskType === TaskTypes.DRILLINGRAWDATA && selectedView === vallorecScreen) {
      url = `${this.BULKUPLOAD_ENDPOINT}/uploadVallorecRawData?taskType=${selectedView}`;
    } else if (taskType === TaskTypes.DRILLINGRAWDATA && selectedView === tenarisScreen) {
      url = `${this.BULKUPLOAD_ENDPOINT}/uploadTenarisRawData?taskType=${selectedView}`;
    } else if (taskType === TaskTypes.DRILLINGRAWDATA && (selectedView === LhScreen)) {
      url = `${this.BULKUPLOAD_ENDPOINT}/uploadLhAndWellHeadRawData?taskType=${selectedView}`;
    } else if (taskType === TaskTypes.DRILLINGRAWDATA && (selectedView === wellHeadScreen)) {
      url = `${this.BULKUPLOAD_ENDPOINT}/uploadWellHeaderRawData?taskType=${selectedView}`;
    }
    else if (taskType === TaskTypes.DRILLINGRAWDATA && (selectedView === yardInventoryScreen)) {
      url = `${this.BULKUPLOAD_ENDPOINT}/uploadYardInventoryRawData?taskType=${selectedView}&IsChunk=${includeFile}`;
    }
    else if ((taskType === TaskTypes.DRILLINGRAWDATA || taskType === TaskTypes.COMPLETIONRAWDATA) && selectedView === inventoryScreen) {
      url = `${this.BULKUPLOAD_ENDPOINT}/uploadInventoryRawData?taskType=${selectedView}&IsChunk=${includeFile}`;
    } else if (taskType === TaskTypes.DRILLINGRAWDATA && selectedView === mitiScreen) {
      url = `${this.BULKUPLOAD_ENDPOINT}/uploadMitiData?taskType=${selectedView}`;
    }
    else {
      url = `${this.BULKUPLOAD_DEPTHTABLE_ENDPOINT}/upload`;
    }

    return this.http.post<any>(url, formData);
  }


  getBatchLogs(taskType: string, schematicId: number): Observable<BatchJobWithLogs[]> {
    let url: string = `${this.BULKUPLOAD_ENDPOINT}/batchLogs/${taskType}/${schematicId}`;
    return this.http.get<BatchJobWithLogs[]>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  getComponentMaterials(clampsList: SchematicClamps[], schematicId: number): Observable<SchematicClamps[]> {
    let url: string = `${this.BULKUPLOAD_ENDPOINT}/getClampsListFromComponents/${schematicId}`;
    return this.http.post<SchematicClamps[]>(url, clampsList)
      .pipe(
        catchError(this.handleError)
      );
  }

  getschematicClamps(type: string, schematicId: number): Observable<SchematicClamps[]> {
    let url: string = `${this.BULKUPLOAD_ENDPOINT}/getClamps/${type}/${schematicId}`;
    return this.http.get<SchematicClamps[]>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  softDeleteSchematicClamps(clampsList: SchematicClamps[]): Observable<boolean> {
    let url: string = `${this.BULKUPLOAD_ENDPOINT}/softDeleteClamps`;
    return this.http.post<boolean>(url, clampsList)
      .pipe(
        catchError(this.handleError)
      );
  }

  refreshInventoryData() {
    let url: string = `${this.BULKUPLOAD_ENDPOINT}/refreshInventoryRawData`;
    return this.http.post<boolean>(url, null)
      .pipe(
        catchError(this.handleError)
      );
  }
  refreshYardInventoryData() {
    let url: string = `${this.BULKUPLOAD_ENDPOINT}/refreshYardInventoryRawData`;
    return this.http.post<boolean>(url, null)
      .pipe(
        catchError(this.handleError)
      );
  }


  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred.';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      errorMessage = `Server-side error: ${error.status} - ${error.message}`;
    }

    // Log to console or handle accordingly
    console.error(errorMessage);

    // Throw the error to the caller
    throw new Error(errorMessage);
  }

  // Upload MDL Completions
  uploadMdlCompletions(request: BatchFileUpload, taskType: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', request.file, request.file.name);
    formData.append('jsonData', request.jsonData);
    formData.append('userId', request.userId.toString());
    formData.append('organizationId', request.organizationId.toString() || '0');
    formData.append('isOverride', request.isOverride);
    let url: string;
    url = `${this.BULKUPLOAD_ENDPOINT}/uploadMdlCompletions`;
    return this.http.post<any>(url, formData);
  }

  generateFileHash(excelData: any[]): string {
    // Convert the excelData to a string representation
    const dataString = JSON.stringify(excelData);

    // Create a hash of the data string using a simple hash function
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char; // Bitwise operation to create a hash
      hash |= 0; // Convert to 32-bit integer
    }
    return hash.toString(); // Return the hash as a string
  }

  /**
 * Vinay's generic service to upload excel data for bulkupload with chunks
 */
  handleUpload(request: BatchFileUpload, excelData: any[]): Observable<any> {
    let url: string;
    url = `${this.BULKUPLOAD_ENDPOINT}`; // Base URL for the upload endpoint
    const chunkSize = 4999; // Define the size of each chunk to be uploaded
    const totalChunks = Math.ceil(excelData.length / chunkSize); // Calculate the total number of chunks
    const clientId = Math.floor(Math.random() * 1_000_000_000).toString(); // Generate a unique client ID for the upload session
    const fileHash = this.generateFileHash(excelData); // Generate a hash for the uploaded file
    // Function to upload a single chunk
    const uploadChunk = (formData: FormData): Observable<any> => {
      return this.http.post<any>(url, formData);
    };

    // Function to upload all chunks sequentially
    const uploadAllChunks = async () => {
      // Loop through the excelData array in chunks
      for (let i = 0; i < excelData.length; i += chunkSize) {
        const chunkIndex = i / chunkSize + 1; // Calculate the current chunk index
        const chunk: any[] = excelData.slice(i, i + chunkSize); // Get the current chunk of data
        const formData = new FormData(); // Create a new FormData object for the current chunk     
        //formData.set('file', request.file, request.file.name);
        formData.set('userId', request.userId.toString());
        formData.set('organizationId', request.organizationId.toString() || '0');
        formData.set('isOverride', request.isOverride);
        formData.set('clientId', clientId); // Add clientId to FormData
        formData.set('jsonData', JSON.stringify(chunk)); // Update the chunk data in FormData
        formData.set('isFirstChunk', chunkIndex === 1 ? 'true' : 'false');
        formData.set('isEndOfFile', chunkIndex === totalChunks ? 'true' : 'false');
        formData.set('uploadType', request.uploadType || ''); // Add uploadType if provided
        formData.set('schematicId', request.schematicId ? request.schematicId.toString() : '0'); // Add schematicId if provided
        formData.set('invalidThreshold', request.invalidThreshold ? request.invalidThreshold.toString() : '0'); // Add invalidThreshold if provided
        formData.set('fileName', request.fileName || ''); // Add fileName if provided
        formData.set('fileHash', fileHash); // Add fileHash to FormData
        await lastValueFrom(uploadChunk(formData)); // Upload the current chunk
      }
    };

    return from(uploadAllChunks()); // Convert the async function to an Observable
  }


  /**
   * generic service to upload excel data manily for bulkupload with chunks
   */

  bulkUpload(
    file: File,
    data: any[],
    userId: number,
    selectedTabView: string
  ): Observable<void> {
    const chunkSize = 5000;
    const chunks = this.chunkData(data, chunkSize); // Get array of chunks

    const uploadChunk = (chunkData: any[], chunkIndex: number): Observable<any> => {
      const request: BatchFileUpload = {
        file,
        jsonData: JSON.stringify(chunkData),
        userId,
      };
      const includeFile = chunkIndex === 1;
      return this.uploadFile(request, TaskTypes.DRILLINGRAWDATA, selectedTabView, includeFile);
    };

    return from(chunks).pipe(
      concatMap((chunk, index) => uploadChunk(chunk, index + 1)),
      toArray(),
      map(() => void 0)
    );
  }

  /**
   * converting chunk into array
   * @param data 
   * @param chunkSize 
   * @returns 
   */
  private chunkData(data: any[], chunkSize: number): any[][] {
    const chunks: any[][] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
  }


}
