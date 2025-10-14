import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { DocumentStore, S3Files } from '../common/model/document-store';

@Injectable({
  providedIn: 'root'
})
export class DocumentStoreService {

  apiUrl = environment.APIEndpoint + '/api/FilesS3';
  constructor(private http: HttpClient) { }

  // Retrieves document folder by name (optional)
  getDocumentStore(name: string = ''): Observable<DocumentStore[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<DocumentStore[]>(`${this.apiUrl}/documentStore`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Lists files from the document folder based on the provided name.
  listFiles(name: string): Observable<S3Files[]> {
    return this.http.get<S3Files[]>(`${this.apiUrl}/listFiles/${encodeURIComponent(name)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Downloads a file from the document folder using the specified key.
  downloadFile(key: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${encodeURIComponent(key)}`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Uploads a file to the document folder.
  uploadFile(file: File): Observable<S3Files> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<S3Files>(`${this.apiUrl}/upload`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Deletes a file from the document folder using the specified key.
  deleteFile(key: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/delete/${encodeURIComponent(key)}`, { responseType: 'text' })
      .pipe(
        catchError(this.handleError)
      );
  }

  //Get file info from s3 bucket meta data.
  getFile(key: string): Observable<S3Files> {
    return this.http.get<S3Files>(`${this.apiUrl}/getFile/${encodeURIComponent(key)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Checks whether a file with the specified key exists in the S3 bucket.
  fileExists(key: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/fileExists/${encodeURIComponent(key)}`)
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
