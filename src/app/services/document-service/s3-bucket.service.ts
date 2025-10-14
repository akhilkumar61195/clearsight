import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, from, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentInfo } from '../../common/model/Document/DocumentInfo';

@Injectable({
  providedIn: 'root'
})
export class S3BucketService {

  API_ENDPOINT = environment.APIEndpoint + '/api/FilesS3';
  constructor(private http: HttpClient) { }


  // Uploads a file to S3 using a presigned URL.

  uploadFile(presignedUrl: string, file: File): Observable<boolean> {
    // Ensure presignedUrl is an absolute URL
    if (!/^https?:\/\//i.test(presignedUrl)) {
      throw new Error('Invalid presigned URL: must be an absolute URL');
    }

    const uploadPromise = fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    }).then(response => response.ok);

    return from(uploadPromise);
  }

 //Downloads a file from S3 using a presigned URL.
  downloadFile(presignedUrl: string): Observable<Blob> {
    const downloadPromise = fetch(presignedUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to download file');
        }
        return response.blob();
      });

    return from(downloadPromise);
  }
    
  // Fetches a presigned upload URL from the backend API.
  getPresignedUploadUrl(s3BucketModel: { key: string, isPut: boolean, contentType: string }): Observable<any> {
    return this.http.post<{ url: string }>(`${this.API_ENDPOINT}/GetPreSignedUploadUrl`, s3BucketModel);
  }


}
