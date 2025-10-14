import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Tyr2Invoice } from '../common/model/tyr2-invoice.model';
import { catchError, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Tyr2InvoiceService {

  USERSAPI_ENDPOINT = environment.APIEndpoint + '/api/TyrV2/';

  constructor(private http: HttpClient) { }

  // Fetches all invoices from the API
  getAllInvoices(): Observable<Tyr2Invoice[]> {
    return this.http.get<Tyr2Invoice[]>(`${this.USERSAPI_ENDPOINT}GetTyrInvoices`)
    .pipe(
            catchError(this.handleError)
          );
  }

  // Adds or updates invoices in the Tyr2 invoices
  addorUpdateInvoices(invoices: Tyr2Invoice[]): Observable<Tyr2Invoice[]> {
    return this.http.post<Tyr2Invoice[]>(`${this.USERSAPI_ENDPOINT}upsertTyrTaskInvoices`, invoices)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Deletes an invoice by ID
  deleteInvoice(id: number): Observable<number> {
    return this.http.delete<number>(`${this.USERSAPI_ENDPOINT}deleteTyrTaskInvoices?id=${id}`)
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
