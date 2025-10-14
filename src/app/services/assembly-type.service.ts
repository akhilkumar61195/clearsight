import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssemblyTypeModel } from '../common/model/AssemblyTypeModel';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssemblyTypeService {
  API_ENDPOINT = environment.APIEndpoint + '/AssemblyType';

  constructor(private http: HttpClient) { }

  getAssemblyType(): Observable<AssemblyTypeModel[]> {
    return this.http.get<AssemblyTypeModel[]>(`${this.API_ENDPOINT}`);
  }

  addAssemblyType(assemblyType: AssemblyTypeModel): Observable<AssemblyTypeModel> {
    return this.http.post<AssemblyTypeModel>(`${this.API_ENDPOINT}`, assemblyType);
  }
  updateAssemblyType(assemblyType: AssemblyTypeModel): Observable<AssemblyTypeModel> {
    return this.http.put<AssemblyTypeModel>(`${this.API_ENDPOINT}/${assemblyType.assemblyTypeId}`, assemblyType);
  }

  deleteAssemblyType(id: number): Observable<any> {    
    return this.http.delete(`${this.API_ENDPOINT}/${id}`);
  }

  deleteMultipleAssemblyTypes(ids: number[]): Observable<any> {
    return this.http.delete(`${this.API_ENDPOINT}`, { body: ids });
  }
  
}
