import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { WellheadKits, WellheadKitComponents } from '../common/model/wellhead-kits';
import { Response } from '../common/model/response'
import { Observable, catchError } from 'rxjs';
import { UpdateMaterialDemandRequest } from '../common/model/update-material-demand-request';

@Injectable({
  providedIn: 'root'
})
export class WellheadkitService {

  WELLHEADKIT_ENDPOINT = environment.APIEndpoint + '/api/Wellheadkit';

  constructor(private http: HttpClient) { }

  // Fetches all wellhead kits from the API
  getKits(): Observable<Response<WellheadKits[]>> {

    return this.http.get<Response<WellheadKits[]>>(this.WELLHEADKIT_ENDPOINT + '/kits')
      .pipe(
        catchError(this.handleError)
      );
  }

  // Fetches wellhead kit components based on the optional kitTypeId from the API
  getComponents(kitTypeId: number = -1): Observable<Response<WellheadKitComponents[]>> {
    const url = `${this.WELLHEADKIT_ENDPOINT}/kitcomponents/${kitTypeId}`;
    return this.http.get<Response<WellheadKitComponents[]>>(url);
  }

  // Creates a new Wellhead Kit.
  createKit(model: WellheadKits): Observable<Response<WellheadKits>> {
    return this.http.post<Response<WellheadKits>>(`${this.WELLHEADKIT_ENDPOINT}/createKit`, model)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Bulk inserts or updates Wellhead Kits based on their ID.
  upsertKits(dtoList: WellheadKits[]): Observable<Response<WellheadKits[]>> {
    return this.http.post<Response<WellheadKits[]>>(`${this.WELLHEADKIT_ENDPOINT}/upsertKits`, dtoList)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Soft deletes Wellhead Kits by list of wellheadKitIds
  softDeleteKits(wellheadKitIds: number[], userId: number): Observable<Response<WellheadKits[]>> {

    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post<Response<WellheadKits[]>>(`${this.WELLHEADKIT_ENDPOINT}/softDeleteKits`, wellheadKitIds, { params })
      .pipe(
        catchError(this.handleError)
    );

  }

  // Bulk inserts or updates Wellhead Components based on their ID.
  upsertComponents(dtoList: WellheadKitComponents[]): Observable<Response<WellheadKitComponents[]>> {
    return this.http.post<Response<WellheadKitComponents[]>>(`${this.WELLHEADKIT_ENDPOINT}/upsertComponents`, dtoList)
      .pipe(
        catchError(this.handleError)
      );
  }

  //Soft deletes Wellhead Components by list of wellheadComponentIds
  softDeleteComponents(wellheadComponentsIds: number[], userId: number): Observable<Response<WellheadKitComponents[]>> {

    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post<Response<WellheadKitComponents[]>>(`${this.WELLHEADKIT_ENDPOINT}/softDeleteComponents`, wellheadComponentsIds, { params })
      .pipe(
        catchError(this.handleError)
      );

  }

  // Retrieves a Wellhead Kit by its kit name (case-insensitive)
  getIdByKitName(kitName: string): Observable<Response<WellheadKits>> {
    const url = `${this.WELLHEADKIT_ENDPOINT}/kitIdByName/${kitName}`;
    return this.http.get<Response<WellheadKits>>(url);
  }

  // Updates the material demand for a given well using the selected wellhead kits.
  updateMaterialDemandForKit(request: UpdateMaterialDemandRequest[]): Observable<Response<number>> {
    return this.http.post<Response<number>>(`${this.WELLHEADKIT_ENDPOINT}/updateKitDemand`, request)
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
}
