import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { LookupKeys } from '../common/enum/lookup-keys';
import { MasterObjectKeys } from '../common/enum/master-object-keys';

@Injectable({
  providedIn: 'root'
})
export class MasterService {

  API_ENDPOINT = environment.APIEndpoint + '/api/Master';
  THORAPI_ENDPOINT = environment.APIEndpoint + '/ThorApi';

  constructor(private http: HttpClient) { }

  getLookupValues(lookupType: LookupKeys): Observable<any> {
    const url: string = `${this.API_ENDPOINT}/Lookup?LookupType=` + lookupType;
    return this.http.get(url);
  }

  get(masterObjectKey: MasterObjectKeys, body: any = null): Observable<any> {
    let params = this.convertJsonToHttpParams(body);
    return this.http.get(`${this.API_ENDPOINT}/${masterObjectKey}`, { params });
  }

  getThorWells() {
    const url: string = `${this.THORAPI_ENDPOINT}/GetThorWells`;
    return this.http.get<any>(url);
  }

  getDetails(masterObjectKey: MasterObjectKeys, body: any = null): Observable<any> {
    let params = this.convertJsonToHttpParams(body);
    return this.http.get(`${this.API_ENDPOINT}/GetDetails/${masterObjectKey}`, { params });
  }

  post(masterObjectKey: MasterObjectKeys, body: any = null): Observable<any> {
    return this.http.post(`${this.API_ENDPOINT}/${masterObjectKey}`, body);
  }

  saveEntity(masterObjectKey: MasterObjectKeys, body: any = null): Observable<any> {
    return this.http.post(`${this.API_ENDPOINT}/SaveEntity/${masterObjectKey}`, body);
  }

  //this method can convert any key value object into query string
  private convertJsonToHttpParams(body: any): HttpParams {
    let params = new HttpParams();
    if (body) {
      const keys = Object.keys(body);
      for (let i = 0; i < keys.length; i++) {
        params = params.set(keys[i], body[keys[i]]);
      }
    }
    return params;
  }

}