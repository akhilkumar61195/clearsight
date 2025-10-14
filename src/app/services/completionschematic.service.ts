import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, timer, Observable, catchError, of, tap, switchMap, map } from 'rxjs';
import { Completionschematicheader } from '../common/model/completionschematicheader';
import { WellFeatures } from '../common/model/wellfeatures';
import { SchematicDetailDto, SchematicsRequest } from '../common/model/schematic-detail-dto';
import { SchematicAssemblyDto } from '../common/model/schematic-assembly-dto';
import { DepthTable, SchematicMasterTable } from '../common/model/schematic-master-table';
import { SchematicPerforations } from '../common/model/schematic-perforations';
import { Wells } from '../common/model/wells';
import { BatchFileUpload } from '../common/model/batch-file-upload';
import { BatchJobWithLogs } from '../common/model/batch-job-with-logs';
import { WellApplications } from '../common/model/well-applications';

@Injectable({
  providedIn: 'root'
})
export class CompletionschematicService {
  CSH_GET_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/CompletionSchematicHeaders';
  CSH_GETBYID_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/completionSchematicHeaderById';
  CSH_SAVE_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/saveSchematicHeaders';
  WF_GET_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/wellFeatures';
  WF_UPSERT_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/saveOrUpdateWellFeature';
  CSD_GET_ASSEMBLY_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/getAssemblies';
  CSD_GET_COMPONENTS_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/getComponents';
  CSD_SAVE_ASSEMBLY_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/saveOrUpdateAssemblies';
  CSD_SAVE_COMPONENTS_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/saveOrUpdateComponents';
  SMT_GET_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/getSchematicsMaster';
  SMDT_GET_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/getSchematicsMasterByDesignType';
  PT_GET_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/getPerforations';
  PT_SAVE_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/saveOrUpdateSchematicPerforations';
  CLONE_SCHEMATIC_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/cloneSchematic';
  CSD_SAVE_SCHEMATIC_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/saveSchematics';
  CSD_UPSERT_WELLS_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/saveOrUpdateWells';
  CSD_UPDATE_WELL_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/updateWellId';
  MD_EXPORT_TO_ODIN_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/exportToOdin';
  MD_UPLOAD_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/upload';
  MD_LOGS_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/batchLogs';
  CSH_CREATEWELL_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/insertWellApplications';
  CSH_UPDATE_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/updateSchematicSelection';
  AB_DELETE_ASSEMBLIES = environment.APIEndpoint + '/api/CompletionSchematics/deleteAssembly';
  CSH_STATUS_UPDATE_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/approveOrRejectSchematicSelection';
  CSH_DELETE_ENDPOINT = environment.APIEndpoint + '/api/CompletionSchematics/deleteSchematic';

  constructor(private http: HttpClient) { }
  private selectedSchematicSubject = new BehaviorSubject<any>(0);
  selectedSchematic$ = this.selectedSchematicSubject.asObservable();
  private selectView = new BehaviorSubject<any>(null);
  view$ = this.selectView.asObservable();
  getSelectedSchematic(id: number) {
    this.selectedSchematicSubject.next(id);
  }
  setSelectedView(view: any) {
    this.selectView.next(view);
  }

  getSchematicHeaders(pageNumber: number, pageSize: number): Observable<Completionschematicheader[]> {

    let url: string = `${this.CSH_GET_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    return this.http.get<Completionschematicheader[]>(url).pipe(
      map((data) => {

        return data.sort((a, b) => {
          if (a.schematicsName < b.schematicsName) {
            return -1;
          }
          if (a.schematicsName > b.schematicsName) {
            return 1;
          }
          return 0;
        });

      })
    );

  }

  getSchematicHeaderById(schematicsID: number): Observable<Completionschematicheader> {

    let url: string = `${this.CSH_GETBYID_ENDPOINT}/${schematicsID}`;
    return this.http.get<Completionschematicheader>(url);

  }

  saveSchematicHeaders(model: Completionschematicheader): Observable<Completionschematicheader> {

    let url: string = `${this.CSH_SAVE_ENDPOINT}`;
    return this.http.post<Completionschematicheader>(url, model);

  }

  getWellFeaturesBySchematicId(schematicsId: number): Observable<WellFeatures[]> {

    let url: string = `${this.WF_GET_ENDPOINT}/${schematicsId}`;
    return this.http.get<WellFeatures[]>(url);

  }

  saveOrUpdateWellFeatures(model: WellFeatures): Observable<WellFeatures> {

    let url: string = `${this.WF_UPSERT_ENDPOINT}`;
    return this.http.post<WellFeatures>(url, model);

  }

  getSchematicAssemblies(schematicsID: number, sectionID: number = -1): Observable<SchematicAssemblyDto[]> {

    let url: string = `${this.CSD_GET_ASSEMBLY_ENDPOINT}/${schematicsID}/${sectionID}`;
    return this.http.get<SchematicAssemblyDto[]>(url);

  }

  getSchematicComponents(schematicsID: number, sectionID: number = -1, itemNumber: number = -1): Observable<SchematicDetailDto[]> {

    let url: string = `${this.CSD_GET_COMPONENTS_ENDPOINT}/${schematicsID}/${sectionID}/${itemNumber}`;
    return this.http.get<SchematicDetailDto[]>(url);

  }

  saveOrUpdateAssemblies(assemblyDtos: SchematicAssemblyDto[]): Observable<SchematicAssemblyDto[]> {

    return this.http.post<SchematicAssemblyDto[]>(this.CSD_SAVE_ASSEMBLY_ENDPOINT, assemblyDtos)
      .pipe(
        catchError(this.handleError)
      );

  }

  saveOrUpdateComponents(detailDtos: SchematicDetailDto[]): Observable<SchematicDetailDto[]> {
    return timer(500).pipe(
      switchMap(() =>
        this.http.post<SchematicDetailDto[]>(this.CSD_SAVE_COMPONENTS_ENDPOINT, detailDtos).pipe(
          catchError(this.handleError)
        )
      )
    );
  }

  getMasterTableView(schematicId: number, ivalue: number = -1): Observable<SchematicMasterTable[]> {

    let url: string = `${this.SMT_GET_ENDPOINT}/${schematicId}/${ivalue}`;
    return this.http.get<SchematicMasterTable[]>(url);

  }

  getMasterTableByDesignType(schematicId: number, id: number = -1, designTypeID: number = -1): Observable<SchematicMasterTable[]> {

    let url: string = `${this.SMDT_GET_ENDPOINT}/${schematicId}/${id}/${designTypeID}`;
    return this.http.get<SchematicMasterTable[]>(url);

  }

  //getMasterTableView(schematicId: number, ivalue: number = -1): Observable<SchematicMasterTable[]> {
  //  let url: string = `${this.SMT_GET_ENDPOINT}/${schematicId}/${ivalue}`;

  //  return this.http.get<SchematicMasterTable[]>(url).pipe(
  //    map((data) => {
  //      // Process and convert subItemNumber to a valid number, then convert it back to string if needed
  //      return data.map(item => {

  //        if (item.subItemNumber === '' || item.subItemNumber === null || item.subItemNumber === undefined) {
  //          item.subItemNumber = null;
  //        } else if (typeof item.subItemNumber === 'string') {            
  //          item.subItemNumber = String(Number(item.subItemNumber));
  //        }
  //        return item;
  //      }).sort((a, b) => {

  //        if (a.sectionID !== b.sectionID) {
  //          return a.sectionID - b.sectionID;
  //        }

  //        if (a.schematicID !== b.schematicID) {
  //          return a.schematicID - b.schematicID;
  //        }

  //        if (a.itemNumber !== b.itemNumber) {
  //          return a.itemNumber - b.itemNumber;
  //        }


  //        if (a.subItemNumber === null) return 1;  
  //        if (b.subItemNumber === null) return -1; 
  //        return Number(a.subItemNumber) - Number(b.subItemNumber);  
  //      });
  //    })
  //  );
  //}

  getDepthTableView(schematicId: number, ivalue: number = -1): Observable<DepthTable[]> {

    let url: string = `${this.SMT_GET_ENDPOINT}/${schematicId}/${ivalue}`;
    return this.http.get<DepthTable[]>(url);

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

  getSchematicPerforations(schematicsId: number = 7, count: number = 2): Observable<SchematicPerforations[]> {

    let url: string = `${this.PT_GET_ENDPOINT}/${schematicsId}/${count}`;
    return this.http.get<SchematicPerforations[]>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  upsertSchematicPerforations(dtoList: SchematicPerforations[]): Observable<SchematicPerforations[]> {

    let url: string = `${this.PT_SAVE_ENDPOINT}`;

    return this.http.post<SchematicPerforations[]>(url, dtoList)
      .pipe(
        catchError(this.handleError)
      );
  }

  cloneSchematicData(model: Completionschematicheader, cloneFromSchematicsId: number): Observable<number> {
    const url = `${this.CLONE_SCHEMATIC_ENDPOINT}/${cloneFromSchematicsId}`;

    return this.http.post<number>(url, model).pipe(
      catchError(this.handleError)
    );
  }

  upsertSchematics(request: SchematicsRequest): Observable<SchematicsRequest> {
    let url: string = `${this.CSD_SAVE_SCHEMATIC_ENDPOINT}`;

    return this.http.post<SchematicsRequest>(url, request)
      .pipe(
        catchError(this.handleError)
      );

  }

  upsertWells(request: Wells): Observable<Wells> {
    let url: string = `${this.CSD_UPSERT_WELLS_ENDPOINT}`;

    return this.http.post<Wells>(url, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateWellId(schematicId: number, wellId: number): Observable<string> {
    let url: string = `${this.CSD_UPDATE_WELL_ENDPOINT}/${schematicId}/${wellId}`;

    return this.http.post<string>(url, null)
      .pipe(
        catchError(this.handleError)
      );
  }

  exportToOdin(schematicsId: number = -1, userId: number): Observable<string> {
    let url: string = `${this.MD_EXPORT_TO_ODIN_ENDPOINT}/${schematicsId}/${userId}`;

    return this.http.post<string>(url, {}, { responseType: 'text' as 'json' }).pipe(
      catchError(this.handleError)
    );
  }

  uploadFile(request: BatchFileUpload): Observable<any> {
    const formData = new FormData();
    formData.append('file', request.file, request.file.name);
    formData.append('jsonData', request.jsonData);
    formData.append('userId', request.userId.toString());

    return this.http.post<any>(this.MD_UPLOAD_ENDPOINT, formData);
  }

  getBatchLogs(taskType: string = 'schematic', schematicId: number): Observable<BatchJobWithLogs[]> {
    let url: string = `${this.MD_LOGS_ENDPOINT}/${taskType}/${schematicId}`;
    return this.http.get<BatchJobWithLogs[]>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  createWellApplications(request: WellApplications): Observable<WellApplications> {
    let url: string = `${this.CSH_CREATEWELL_ENDPOINT}`;

    return this.http.post<WellApplications>(url, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateSchematicSelection(model: Completionschematicheader): Observable<Completionschematicheader> {

    let url: string = `${this.CSH_UPDATE_ENDPOINT}`;
    return this.http.post<Completionschematicheader>(url, model);

  }

  deleteAssembliesAndComponents(schematicAssemblyId: number, userId: number): Observable<boolean> {

    let url: string = `${this.AB_DELETE_ASSEMBLIES}/${schematicAssemblyId}/${userId}`;
    return this.http.post<boolean>(url, null);

  }

  updateStatusSchematicSelection(model: Completionschematicheader): Observable<Completionschematicheader> {

    let url: string = `${this.CSH_STATUS_UPDATE_ENDPOINT}`;
    return this.http.post<Completionschematicheader>(url, model);

  }

  deleteSchematic(schematicId: number, userId: number): Observable<number> {

    let url: string = `${this.CSH_DELETE_ENDPOINT}/${schematicId}/${userId}`;
    return this.http.post<number>(url, null);

  }
}
