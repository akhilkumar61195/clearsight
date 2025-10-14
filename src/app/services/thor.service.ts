import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { WellInfo } from '../common/model/well-info';
import { Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ResponseListResult } from '../common/model/response-list-result';
import { ThorDrillingMaterials } from '../common/model/thor-drilling-materials';
import { MaterialAttribute } from '../common/model/MaterialAttribute';
import { ThorCompletionsMaterials } from '../common/model/thor-completions-materials';
import { Response, PagedResponse } from '../common/model/response';
import { CloneThorDrillingWell_Other, ThorDrillingWellCloneRequest } from '../common/model/ThorDrillingWellCloneRequest';

@Injectable({
  providedIn: 'root'
})
export class ThorService {
  THOR_ENDPOINT = environment.APIEndpoint + '/api/ThorV2';
  THOR_WD_GET_ENDPOINT = environment.APIEndpoint + '/api/ThorV2/updateWellDetails';
  THOR_DASHBOARD_DRILLING_GET_ENDPOINT = environment.APIEndpoint + '/api/ThorV2/thorDrillingMaterials';
  THOR_DASHBOARD_COMPLETIONS_GET_ENDPOINT = environment.APIEndpoint + '/api/ThorV2/thorCompletionsMaterials';
  MATERIAL_ATTRIBUTES_GET_ENDPOINT = environment.APIEndpoint + '/api/ThorV2/MaterialsByAttributes';
  MATERIAL_ATTRIBUTES_POST_ENDPOINT = environment.APIEndpoint + '/api/ThorV2/saveMaterialAttributes';
  THOR_DASHBOARD_SAVE_ENDPOINT = environment.APIEndpoint + '/api/ThorV2/upsertThorMaterials';
  THOR_HOLESECTION_ENDPOINT = environment.APIEndpoint + '/api/ThorV2/ItemByHoleSection';

  constructor(private http: HttpClient) { }

  updateWellDetails(request: WellInfo): Observable<WellInfo> {

    let url: string = `${this.THOR_WD_GET_ENDPOINT}`;
    return this.http.post<WellInfo>(url, request)
      .pipe(
        catchError(this.handleError)
      );;
  }

  getThorDrillingMaterials(wellId: number): Observable<ResponseListResult<ThorDrillingMaterials[]>> {
    const url = `${this.THOR_DASHBOARD_DRILLING_GET_ENDPOINT}/${wellId}`;
    return this.http.get<ResponseListResult<ThorDrillingMaterials[]>>(url).pipe(
      catchError(this.handleResponseError<ResponseListResult<ThorDrillingMaterials[]>>('getThorDrillingMaterials'))
    );
  }

  getMaterialAttribute(): Observable<ResponseListResult<MaterialAttribute[]>> {
    const url = `${this.MATERIAL_ATTRIBUTES_GET_ENDPOINT}`;
    return this.http.get<ResponseListResult<MaterialAttribute[]>>(url).pipe(
      catchError(this.handleResponseError<ResponseListResult<MaterialAttribute[]>>('getMaterialAttribute'))
    );
  }

  saveMaterailAttribute(request: MaterialAttribute): Observable<MaterialAttribute> {

    let url: string = `${this.MATERIAL_ATTRIBUTES_POST_ENDPOINT}`;
    return this.http.post<MaterialAttribute>(url, request)
      .pipe(
        catchError(this.handleError)
      );;
  }

  upsertThorMaterials(request: ThorDrillingMaterials[]): Observable<number> {
    let url: string = `${this.THOR_DASHBOARD_SAVE_ENDPOINT}`;
    return this.http.post<number>(url, request)
      .pipe(
        catchError(this.handleError)
      );;
  }

  upsertThorCompletionMaterials(request: ThorCompletionsMaterials[]): Observable<number> {
    let url: string = `${this.THOR_DASHBOARD_SAVE_ENDPOINT}`;
    return this.http.post<number>(url, request)
      .pipe(
        catchError(this.handleError)
      );;
  }

  getThorCompletionsMaterials(wellId: number): Observable<ResponseListResult<ThorCompletionsMaterials[]>> {
    const url = `${this.THOR_DASHBOARD_COMPLETIONS_GET_ENDPOINT}/${wellId}`;
    return this.http.get<ResponseListResult<ThorCompletionsMaterials[]>>(url).pipe(
      catchError(this.handleResponseError<ResponseListResult<ThorCompletionsMaterials[]>>('getThorCompletionsMaterials'))
    );
  }

  getItemForHoleSection(wellNumber: number, holeSection: string): Observable<string> {
    const url = `${this.THOR_HOLESECTION_ENDPOINT}/${wellNumber}/${holeSection}`;
    return this.http.get<string>(url)
    // .pipe(
    //   catchError(this.handleError)
    // );
  }

  //The below 2methods are used for getting list of materials data in pagination format
  public cachedDrillingMaterialsData: { [key: string]: Response<PagedResponse<ThorDrillingMaterials[]>> } = {};
  
  getthorDrillingMaterialsPaged(wellId: number, pageNumber = 1, pageSize = 100): Observable<Response<PagedResponse<ThorDrillingMaterials[]>>> {

    // Generate a unique cache key based on the wellId, pageNumber, and pageSize
    const cacheKey = `${wellId}-${pageNumber}-${pageSize}`;

    // Check if data is already cached for the given parameters
    if (this.cachedDrillingMaterialsData[cacheKey]) {
      return of(this.cachedDrillingMaterialsData[cacheKey]); // Return cached data if available
    }

    const url = `${this.THOR_ENDPOINT}/thorDrillingMaterialsPaged/${wellId}`;
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    // Make the HTTP GET request and cache the result
    return this.http.get<Response<PagedResponse<ThorDrillingMaterials[]>>>(url, { params })
      .pipe(
        tap((data) => {
          this.cachedDrillingMaterialsData[cacheKey] = data;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  // Cache for holding fetched completions materials data
  public cachedCompletionsMaterialsData: { [key: string]: Response<PagedResponse<ThorCompletionsMaterials[]>> } = {};
  getCompletionsMaterialsPaged(wellId: number, pageNumber = 1, pageSize = 100): Observable<Response<PagedResponse<ThorCompletionsMaterials[]>>> {

    // Generate a unique cache key based on the wellId, pageNumber, and pageSize
    const cacheKey = `${wellId}-${pageNumber}-${pageSize}`;

    // Check if data is already cached for the given parameters
    if (this.cachedCompletionsMaterialsData[cacheKey]) {
      return of(this.cachedCompletionsMaterialsData[cacheKey]); // Return cached data if available
    }

    const url = `${this.THOR_ENDPOINT}/thorCompletionsMaterialsPaged/${wellId}`;
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    // Make the HTTP GET request and cache the result
    return this.http.get<Response<PagedResponse<ThorCompletionsMaterials[]>>>(url, { params })
      .pipe(
        tap((data) => {
          this.cachedCompletionsMaterialsData[cacheKey] = data;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  // Clone a Thor drilling well for the "Others" scenario
  cloneThorDrillingWell_Others(request: CloneThorDrillingWell_Other): Observable<Response<number>> {

    const url = `${this.THOR_ENDPOINT}/CloneOthersWell`;
    return this.http.post<Response<number>>(url, request)
      .pipe(
        catchError(this.handleError)
      );

  }

  // Clone a Thor drilling well by bypassing scenario
  cloneThorDrillingWell_ByPassWell(request: ThorDrillingWellCloneRequest): Observable<Response<number>> {

    const url = `${this.THOR_ENDPOINT}/CloneByPassWell`;
    return this.http.post<Response<number>>(url, request)
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

  private handleResponseError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return new Observable<T>();
    };
  }
}
