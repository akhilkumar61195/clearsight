import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConnectionTypeModel } from '../common/model/ConnectionTypeModel';

@Injectable({
  providedIn: 'root'
})
export class ConnectionTypeService {
  private readonly CONNECTIONTYPE_API_ENDPOINT = environment.APIEndpoint + '/api/ConnectionType';

  constructor(private http: HttpClient) { }

  getConnectionType(): Observable<ConnectionTypeModel[]> {
    const url: string = this.CONNECTIONTYPE_API_ENDPOINT;
    return this.http.get<ConnectionTypeModel[]>(url);
  }

  addConnectionType(connectionType: ConnectionTypeModel): Observable<any> {
    const url: string = this.CONNECTIONTYPE_API_ENDPOINT;
    return this.http.post<any>(url, connectionType);
  }

  updateConnectionType(connectionType: ConnectionTypeModel): Observable<any> {    
    const url: string = `${this.CONNECTIONTYPE_API_ENDPOINT}/${connectionType.id}`;
    return this.http.put<any>(url, connectionType);
  }

  deleteConnectionType(id: string) {
    const url: string = `${this.CONNECTIONTYPE_API_ENDPOINT}/${id}`;
    return this.http.delete<any>(url);
  }
}