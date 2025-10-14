import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../../environments/environment';
import { DocumentInfo } from '../../common/model/Document/DocumentInfo';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  API_ENDPOINT = environment.APIEndpoint + '/Document';
  constructor(private http: HttpClient) { }

  //Save the Data to Documents table
  SaveDocumentInfo(documentInfo: DocumentInfo): Observable<DocumentInfo> {
    return this.http.post<DocumentInfo>(`${this.API_ENDPOINT}/SaveDocumentInfo`, documentInfo);
  }

  // Deletes a file from the document folder using the specified key.
  deleteDocument(documentInfo: DocumentInfo): Observable<string> {
    return this.http.delete(`${this.API_ENDPOINT}/DeleteDocument`, { body: documentInfo, responseType: 'text' })
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
