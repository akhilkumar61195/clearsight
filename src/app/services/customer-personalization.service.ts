import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, catchError } from 'rxjs';
import { Response } from '../common/model/response'
import { CustomerPersonalization } from '../common/model/customer-personalization';

@Injectable({
  providedIn: 'root'
})
export class CustomerPersonalizationService {

  ENDPOINT = environment.APIEndpoint + '/api/CustomerPersonalizations';

  constructor(private http: HttpClient) { }

  // Retrieves a list of customer personalizations filtered by the specified module.
  getCustomerPersonalizations(module: string): Observable<Response<CustomerPersonalization[]>> {
    const url = `${this.ENDPOINT}/getCustomerPersonalizations/${module}`;
    return this.http.get<Response<CustomerPersonalization[]>>(url)
      .pipe(catchError(this.handleError));
  }

  // Retrieves the latest customer personalization filtered by the specified module and user ID.
  getLatestCustomerPersonalization(module: string, userId: number): Observable<Response<CustomerPersonalization>> {
    const url = `${this.ENDPOINT}/getLatestCustomerPersonalizations/${module}/${userId}`;
    return this.http.get<Response<CustomerPersonalization>>(url)
      .pipe(catchError(this.handleError));
  }

  // Creates a new customer personalization entry.
  createCustomerPersonalization(model: CustomerPersonalization): Observable<Response<CustomerPersonalization>> {
    return this.http.post<Response<CustomerPersonalization>>(`${this.ENDPOINT}/CreatePersonalizations`, model)
      .pipe(catchError(this.handleError));
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
