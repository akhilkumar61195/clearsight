import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Ty2Tasks } from '../common/model/tyr2-task.model';
import { AddWellsRequest } from '../common/model/add-wells-request';
import { Observable, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Tyr2TasksService {

  USERSAPI_ENDPOINT = environment.APIEndpoint + '/api/TyrV2/';

  constructor(private http: HttpClient) { }

  // Fetches all tasks from the API based on wellId
  getTasksByWellId(wellId: number) : Observable<Ty2Tasks[]> {
    return this.http.get<Ty2Tasks[]>(`${this.USERSAPI_ENDPOINT}GetTyrTaskByWellIds?wellIds=${wellId}`)
    .pipe(
        catchError(this.handleError)
      );
  }
 
  // Adds or updates tasks in the Tyr2 tasks
  addorUpdateTyrTasks(tasks: Ty2Tasks[]): Observable<Ty2Tasks[]> {
    return this.http.post<Ty2Tasks[]>(`${this.USERSAPI_ENDPOINT}upsertTyrTasks`, tasks)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Adds wells to Tyr2 system
  includeWells(request: AddWellsRequest): Observable<number> {
    return this.http.post<number>(`${this.USERSAPI_ENDPOINT}includeWells`, request)
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

