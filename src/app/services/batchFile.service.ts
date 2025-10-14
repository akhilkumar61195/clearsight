import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BatchFileService {

  BATCHSFILEAPI_ENDPOINT = environment.APIEndpoint + '/BatchFile';

  constructor(private http: HttpClient) { }

  getBatchFiles(): Observable<any> {
    return this.http.get(`${this.BATCHSFILEAPI_ENDPOINT}`);
  }

}
