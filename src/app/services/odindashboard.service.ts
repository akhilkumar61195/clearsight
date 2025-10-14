import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OdinInventoryDrilling } from '../common/model/odin-inventory-drilling';
import { OdinInventoryCompletions } from '../common/model/odin-inventory-completions';
import { OdinWells } from '../common/model/odin-wells';

@Injectable({
  providedIn: 'root'
})
export class OdindashboardService {
  ODINAPI_ENDPOINT = environment.APIEndpoint + '/api/OdinDashboard';
  constructor(private http: HttpClient) { }

  // getOdinInventoryDrilling(): Observable<OdinInventoryDrilling[]> {
  //   let url = `${this.ODINAPI_ENDPOINT}/odininventorydrilling`;
  //   return this.http.get<OdinInventoryDrilling[]>(url);
  // }
  // getOdinInventoryCompletions(): Observable<OdinInventoryCompletions[]> {
  //   let url = `${this.ODINAPI_ENDPOINT}/odininventorycompletions`;
  //   return this.http.get<OdinInventoryCompletions[]>(url);
  // }
  // getOdinWells(functionId: number): Observable<OdinWells[]> {
  //   let url = `${this.ODINAPI_ENDPOINT}/odinwells/${functionId}`;
  //   return this.http.get<OdinWells[]>(url);
  // }
}
