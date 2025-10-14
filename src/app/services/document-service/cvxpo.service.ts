import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentInfo } from '../../common/model/Document/DocumentInfo';

@Injectable({
  providedIn: 'root'
})
export class CvxpoService {

  private APIUploadUrl = environment.APIEndpoint + '/Document/UploadCvxPoDocument';



  constructor(private http: HttpClient) { }
   //Upload CVXPO Document to s3 bucket and database
   uploadCVXPODocument(documentInfo: DocumentInfo): Observable<DocumentInfo> {
    return this.http.post<DocumentInfo>( this.APIUploadUrl, documentInfo);
  }


}
