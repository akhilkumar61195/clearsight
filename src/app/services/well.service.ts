import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { IChangeLog } from '../common/model/IchangeLog';
import { ChangeLogLibrary } from '../common/model/ChangeLogModel';
import { WellDetails } from '../common/model/WellDetails';
import { CreateWell } from '../common/model/create-well';
import { ResponseResult } from '../common/model/response-result.model';

@Injectable({
  providedIn: 'root'
})

export class WellService {


  Well_GET_ENDPOINT = environment.APIEndpoint + '/Well';
  Well_UPDATE_ENDPOINT = environment.APIEndpoint + '/Well';
  Well_SAVE_ENDPOINT = environment.APIEndpoint + '/Well';
  constructor(private http: HttpClient) {

  }

  getAllWells(appId: number, functionId: number) {

    const url: string = `${this.Well_GET_ENDPOINT}/GetAllWell?appId=${appId}&functionId=${functionId}`;
    return this.http.get<WellDetails[]>(url);

  }

  updateAllWells(wellDetails: WellDetails[]) {

    const url: string = `${this.Well_UPDATE_ENDPOINT}/UpdateWellHeader`;
    return this.http.put<WellDetails>(url, wellDetails);

  }

  GetAllWellsMaterial(appId: number, functionId: number, whatIf: boolean = false) {
    const url: string = `${this.Well_GET_ENDPOINT}/GetAllWellsMaterial?appId=${appId}&functionId=${functionId}&whatIf=${whatIf}`;
    return this.http.get<WellDetails>(url);
  }

  GetOdinWellHeaders(functionId: number) {
    const url: string = `${this.Well_GET_ENDPOINT}/GetOdinWellHeaders?functionId=${functionId}`;
    return this.http.get<WellDetails[]>(url);
  }

  GetAllOdinWellMaterialDemand(functionId: number) {
    const url: string = `${this.Well_GET_ENDPOINT}/GetAllOdinWellMaterialDemand?functionId=${functionId}`;
    return this.http.get<ResponseResult<WellDetails[]>>(url);
  }
  createWells(createWell: CreateWell) {

    const url: string = `${this.Well_SAVE_ENDPOINT}/createWell`;
    return this.http.post<CreateWell>(url, createWell);

  }
  getWells(appId: number, functionId: number) {
 
    const url: string = `${this.Well_GET_ENDPOINT}/GetWells?appId=${appId}&functionId=${functionId}`;
    return this.http.get<WellDetails[]>(url);
 
  }
}
