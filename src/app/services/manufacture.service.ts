import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ManufacturerModel } from '../common/model/ManufacturerModel';
import { OrganizationModel } from '../common/model/OrganizationModel';


@Injectable({
  providedIn: 'root'
})
export class ManufactureService {
  API_ENDPOINT = environment.APIEndpoint + '/Manufacturer';
  ORGANISATION_API_ENDPOINT = environment.APIEndpoint + '/Organization';

  constructor(private http: HttpClient) { }

  getManufacturerType(): Observable<OrganizationModel[]> {
    return this.http.get<OrganizationModel[]>(`${this.API_ENDPOINT}`);
  }

  addManufacturerType(manufacturerType: OrganizationModel): Observable<OrganizationModel> {
    return this.http.post<OrganizationModel>(`${this.API_ENDPOINT}`, manufacturerType);
  }
  updateManufacturerType(manufacturerType: OrganizationModel): Observable<OrganizationModel> {
    return this.http.put<OrganizationModel>(`${this.ORGANISATION_API_ENDPOINT}/${manufacturerType.organizationId}`, manufacturerType);
  }

  deleteManufacturerType(id: number): Observable<any> {    
    return this.http.delete(`${this.ORGANISATION_API_ENDPOINT}/${id}`);
  }

  deleteMultipleManufacturerTypes(ids: number[]): Observable<any> {
    return this.http.delete(`${this.ORGANISATION_API_ENDPOINT}`, { body: ids });
  }
  
}
