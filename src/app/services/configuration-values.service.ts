import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ConfigurationType } from '../common/model/configuration-type';
import { Observable, catchError } from 'rxjs';
import { ConfigurationValues } from '../common/model/configuration-values';
import { ApplicationPermission } from '../common/model/applicationPersmissionModel';
import { BusinessUnit } from '../common/model/buModel';
import { TaskManagement } from '../common/model/taskManagementModel';


@Injectable({
  providedIn: 'root'
})
export class ConfigurationValuesService {

  baseUrl = environment.APIEndpoint + '/api/ConfigValues';

  constructor(private http: HttpClient) { }


  // Gets configuration types filtered by appId and functionId (default -1 returns all)
  getConfigurationTypes(appId: number = -1, functionId: number = -1,taskMgmtId = -1): Observable<ConfigurationType[]> {

    return this.http.get<ConfigurationType[]>(`${this.baseUrl}/configurationTypes/${appId}/${functionId}/${taskMgmtId}`)
      .pipe(catchError(this.handleError));
  }

  // Retrieves all entities of a given type, optionally filtered by configName and buId
  getAllEntities(entity: string = 'configvalue', configName?: string, buId: number = -1): Observable<ConfigurationValues[]> {
    let url = `${this.baseUrl}/getAll/${entity}`;
    if (configName) {
      url += `?configName=${encodeURIComponent(configName)}&buId=${encodeURIComponent(buId)}`;
    }
    return this.http.get<ConfigurationValues[]>(url)
      .pipe(catchError(this.handleError));
  }

  // Creates a new entity record on the server
  createEntity(request: ConfigurationValues, entity: string = 'configvalue'): Observable<ConfigurationValues> {
    return this.http.post<ConfigurationValues>(`${this.baseUrl}/create/${entity}`, request)
      .pipe(catchError(this.handleError));
  }

  // Updates an existing entity record by ID
  updateEntity(request: ConfigurationValues, entity: string = 'configvalue'): Observable<ConfigurationValues> {
    return this.http.put<ConfigurationValues>(`${this.baseUrl}/update/${entity}`, request)
      .pipe(catchError(this.handleError));
  }

  // Performs a soft delete on multiple entities and returns a boolean success response
  softDeleteMultiple(ids: number[], userIdModifiedBy: string, entity: string = 'configvalue'): Observable<boolean> {
    const url = `${this.baseUrl}/softDeleteMultiple/${entity}/${userIdModifiedBy}`;
    return this.http.request<boolean>('delete', url, { body: ids })
      .pipe(catchError(this.handleError));
  }

  // getting all application and permission of app
  getApplicationPermissionList(): Observable<ApplicationPermission[]> {
    return this.http.get<ApplicationPermission[]>(`${this.baseUrl}/getAllApplication`);
  }
  // getting all business unit
  getBusineedUnitList(): Observable<BusinessUnit[]> {
    return this.http.get<BusinessUnit[]>(`${this.baseUrl}/getAllBusinessUnits`);
  }
    // getting all TaskManagemen
  getTaskManagementList(): Observable<TaskManagement[]> {
    return this.http.get<TaskManagement[]>(`${this.baseUrl}/getAllTaskManagement`);
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
