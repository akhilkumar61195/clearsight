import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { IChangeLog } from '../common/model/IchangeLog';
import { ChangeLogLibrary } from '../common/model/ChangeLogModel';

@Injectable({
  providedIn: 'root'
})

export class ChangeLogService {


  CHANGELOGAPI_ENDPOINT = environment.APIEndpoint + '/ChangeLog';
  constructor(private http: HttpClient) {

  }

  getChangeLogs(pageIndex: number, pageSize: number, entityName: string) {

    const url: string = `${this.CHANGELOGAPI_ENDPOINT}/GetChangeLogs?pageIndex=${pageIndex}&pageSize=${pageSize}&entityType=${entityName}`;
    return this.http.get<IChangeLog>(url);

  }
  getSchematicsChangeLogById(pageIndex: number, pageSize: number, schematicsId: number) {

    const url: string = `${this.CHANGELOGAPI_ENDPOINT}/GetSchematicsChangeLogById/${schematicsId}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
    return this.http.get<IChangeLog>(url);

  }
  getThorChangeLog(pageIndex: number, pageSize: number, wellNumber: number) {

    const url: string = `${this.CHANGELOGAPI_ENDPOINT}/GetThorChangeLogById/${wellNumber}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
    return this.http.get<IChangeLog>(url);

  }
  getOdinChangeLog(pageIndex: number, pageSize: number, functionId: number) {

    const url: string = `${this.CHANGELOGAPI_ENDPOINT}/GetOdinChangeLog/${functionId}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
    return this.http.get<IChangeLog>(url);

  }
  getTyrChangeLog(pageIndex: number, pageSize: number, functionId: number) {

    const url: string = `${this.CHANGELOGAPI_ENDPOINT}/GetTyrChangeLog/${functionId}?pageIndex=${pageIndex}&pageSize=${pageSize}`;
    return this.http.get<IChangeLog>(url);

  }
}
