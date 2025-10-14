import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { convertJsonToHttpParams } from '../common/general-methods';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Groupedinventory } from '../common/model/groupedinventory';
import { Inventory } from '../common/model/inventory';
import { Sapunitcost } from '../common/model/sapunitcost';
import { Tenaris } from '../common/model/tenaris';
import { Valluorec } from '../common/model/valluorec';
import { Lhandwellhead } from '../common/model/lhandwellhead';
import { PublishWellRequest } from '../common/model/publish-well-request';
import { Clonewells } from '../common/model/clonewells';
import { OdinAssemblyModel } from '../common/model/OdinAssemblyModel';
import { ResponseResult } from '../common/model/response-result.model';
import { MaterialDemandModel } from '../common/model/material-demand-model';
import { CloneWhatIfWell } from '../common/model/WellDetails';

@Injectable({
  providedIn: 'root'
})
export class OdinV2Service {
  ODINV2API_ENDPOINT = environment.APIEndpoint + '/OdinV2';
  constructor(private http: HttpClient) { }

  // GetOdinDrillingDashboard(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINV2API_ENDPOINT}/GetOdinDrillingDashboard`;
  //   return this.http.post<any>(url, body, { params });
  // }

  // GetOdinCompletionDashboard(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINV2API_ENDPOINT}/GetOdinCompletionDashboard`;
  //   return this.http.post<any>(url, body, { params });
  // }

  GetOdin3DrillingDashboard(pageNumber: number, pageSize: number, searchTerm: string = "", orgIds: number[] = null) {
    const url: string = `${this.ODINV2API_ENDPOINT}/GetOdin3DrillingDashboard?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    return this.http.get<any>(url);
  }

  GetOdin3CompletionDashboard(pageNumber: number, pageSize: number, searchTerm: string = "", orgIds: number[] = null) {
    const url: string = `${this.ODINV2API_ENDPOINT}/GetOdin3CompletionDashboard?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    return this.http.get<any>(url);
  }

  //Marked for Deletion
  // getTimelineViewData(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINV2API_ENDPOINT}/GetOdinCompletionTimelineAnalysisWithTotals`;
  //   return this.http.post<any>(url, body, { params });
  // }

  // getTimelineWhatIfViewData(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINV2API_ENDPOINT}/GetOdinWhatIfAnalysisWithTotals`;
  //   return this.http.post<any>(url, body, { params });
  // }

  getCompletionRigScheduleData(body: any, queryParams: any) {
    let params = convertJsonToHttpParams(queryParams);
    const url: string = `${this.ODINV2API_ENDPOINT}/GetOdinCompletionRigScheduleAnalysis`;
    return this.http.post<any>(url, body, { params });
  }

  // getWhatIfData(body: any, queryParams: any) {
  //   // let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINV2API_ENDPOINT}/GetWhatIfWells`;
  //   return this.http.get<any>(url);//, body, { params });
  // }

  // getWhatIfDataSearch(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINV2API_ENDPOINT}/SearchWhatIfWells`;
  //   return this.http.post<any>(url, body, { params });
  // }

  // editWhatIfWells(body: any) {
  //   const url: string = `${this.ODINV2API_ENDPOINT}/EditWhatIfWells`;
  //   return this.http.post<any>(url, body);
  // }

  // resetWhatIfWells() {
  //   const url: string = `${this.ODINV2API_ENDPOINT}/ResetWhatIfWells`;
  //   return this.http.get<any>(url);
  // }

  addOdinGrid(body: any, queryParams: any) {
    let params = convertJsonToHttpParams(queryParams);
    const url: string = `${this.ODINV2API_ENDPOINT}/InsertEquipmentInMaterrial`;
    return this.http.post<any>(url, body, { params });
  }

  saveOdinGrid(body: any) {
    const url: string = `${this.ODINV2API_ENDPOINT}/EditEquipmentForWells`;
    return this.http.post<any>(url, body);
  }

  publishOdinToThor(request: PublishWellRequest): Observable<number> {
    const url: string = `${this.ODINV2API_ENDPOINT}/publishOdin2Thor`;
    return this.http.post<number>(url, request);
  }

  cloneWells(request: Clonewells): Observable<number> {
    const url: string = `${this.ODINV2API_ENDPOINT}/cloneDrillingWells`;
    return this.http.post<number>(url, request);
  }

  private cachedAssembliesData: { [key: string]: OdinAssemblyModel[] } = {};
  private cachedAssembliesTotals: number | null = null;

  getAssemblies(pageNumber: number, pageSize: number, orgIds: number[] = null, searchTerm?: string): Observable<ResponseResult<OdinAssemblyModel[]>> {
    const cacheKey = `${pageNumber}-${pageSize}-${searchTerm || ''}`;

    let url: string;
    if (orgIds == null || orgIds.length == 0) {
      url = `${this.ODINV2API_ENDPOINT}/assembly?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    }
    else {
      url = `${this.ODINV2API_ENDPOINT}/assembly?pageNumber=${pageNumber}&pageSize=${pageSize}&orgIds=${orgIds}`;
    }
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
    }
    return this.http.get<ResponseResult<OdinAssemblyModel[]>>(url).pipe(
      tap(data => {

        this.cachedAssembliesData[cacheKey] = data.data; // Cache the response
      })
    );
  }

  getAssembliesTotal(orgIds: number[] = null): Observable<ResponseResult<number>> {
    //if (this.cachedMaterailTotals !== null) {
    //  return of(this.cachedMaterailTotals); // Return cached total if available
    //}
    let url: string;
    if (orgIds == null || orgIds.length == 0) {
      url = `${this.ODINV2API_ENDPOINT}/assemblytotal`;
    } else {
      url = `${this.ODINV2API_ENDPOINT}/assemblytotal?orgIds=${orgIds}`;
    }
    return this.http.get<ResponseResult<number>>(url).pipe(
      tap(data => {
        this.cachedAssembliesTotals = data.data; // Cache the total records
      })
    );
  }

  getDrillingRigScheduleData(body: any, queryParams: any) {
    let params = convertJsonToHttpParams(queryParams);
    const url: string = `${this.ODINV2API_ENDPOINT}/GetOdinDrillingRigScheduleAnalysis`;
    return this.http.post<any>(url, body, { params });
  }

  rigAnalysisUpsertMaterialDemand(request: MaterialDemandModel[]): Observable<number> {
    const url: string = `${this.ODINV2API_ENDPOINT}/rigAnalysisUpsertMaterialDemand`;
    return this.http.post<number>(url, request);
  }

  getDemandConsumptionAndValuation(body: any, wellNumber: any) {
    const url: string = `${this.ODINV2API_ENDPOINT}/GetDemandConsumptionAndValuation?wellNumber=` + wellNumber;
    return this.http.post<any>(url, body);
  }

  getDemandConsumption(body: any) {
    const url: string = `${this.ODINV2API_ENDPOINT}/GetDemandConsumption`;
    return this.http.post<any>(url, body);
  }

  deleteOdinWell(request: PublishWellRequest): Observable<number> {
    const url: string = `${this.ODINV2API_ENDPOINT}/softDeleteOdinWell`;
    return this.http.post<number>(url, request);
  }

  publishOdinCompletionToThor(request: PublishWellRequest): Observable<number> {
    const url: string = `${this.ODINV2API_ENDPOINT}/publishOdin2ThorCompletions`;
    return this.http.post<number>(url, request);
  }
  getOdinWhatIfDataSearch(body: any, queryParams: any, functionId: number, scenarioSelected: number) {
    let params = convertJsonToHttpParams(queryParams);
    const url: string = `${this.ODINV2API_ENDPOINT}/SearchOdinWhatIfWells/${functionId}/${scenarioSelected}`;
    return this.http.post<any>(url, body, { params });
  }
  resetOdinWhatIfWells(functionId: number, scenarioSelected: number) {
    const url: string = `${this.ODINV2API_ENDPOINT}/ResetOdinWhatIfWells/${functionId}/${scenarioSelected}`;
    return this.http.get<any>(url);
  }
  editOdinWhatIfWells(body: any, functionId: number, scenarioSelected: number) {
    const url: string = `${this.ODINV2API_ENDPOINT}/EditOdinWhatIfWells/${functionId}/${scenarioSelected}`;
    return this.http.post<any>(url, body);
  }
  cloneOdinWhatIfWells(body: any) {
    const url: string = `${this.ODINV2API_ENDPOINT}/CloneWhatIfWell`;
    return this.http.post<any>(url, body);
  }
  getOdinDemandConsumption(body: any, functionId?: number) {
    const url: string = `${this.ODINV2API_ENDPOINT}/GetDemandConsumption/${functionId}`;
    return this.http.post<any>(url, body);
  }
  getOdinDemandConsumptionAndValuation(body: any, wellNumber: any, functionId: number) {
    const url: string = `${this.ODINV2API_ENDPOINT}/GetDemandConsumptionAndValuation/${functionId}?wellNumber=` + wellNumber;
    return this.http.post<any>(url, body);
  }
  getDemandValuationSummary(appId: number, functionId: number){
    const url = `${this.ODINV2API_ENDPOINT}/GetDemandValuationSummary?appId=${appId}&functionId=${functionId}`;
    return this.http.get<any>(url);
  }
  getDemandValuationDetails(appId: number, functionId: number, wellId: any) {
      const url = `${this.ODINV2API_ENDPOINT}/GetDemandValuationDetails?appId=${appId}&functionId=${functionId}&wellId=${wellId}`;
      return this.http.get<any>(url);
    }

}
