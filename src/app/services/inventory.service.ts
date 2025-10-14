import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { convertJsonToHttpParams } from '../common/general-methods';
import { Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Groupedinventory } from '../common/model/groupedinventory';
import { Inventory } from '../common/model/inventory';
import { Sapunitcost } from '../common/model/sapunitcost';
import { Tenaris } from '../common/model/tenaris';
import { Valluorec } from '../common/model/valluorec';
import { Lhandwellhead } from '../common/model/lhandwellhead';
import { LhAndWellHeadOrders } from '../common/model/lh-and-well-head-orders';
import { Response, PagedResponse } from '../common/model/response';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  ODINAPI_ENDPOINT = environment.APIEndpoint + '/OdinApi';
  TYRAPI_ENDPOINT = environment.APIEndpoint + '/TyrApi';
  CHATAPI_ENDPOINT = environment.APIEndpoint + '/ChatApi';
  THORAPI_ENDPOINT = environment.APIEndpoint + '/ThorApi';  
  BATCHLOGAPI_ENDPOINT = environment.APIEndpoint + '/BatchLog';
  MDLERRORLOGAPI_ENDPOINT = environment.APIEndpoint + '/MDLErrorLog';
  COMPONENTTYPEAPI_ENDPOINT = environment.APIEndpoint + '/P2ComponentType';
  CONNECTIONCONFIGAPI_ENDPOINT = environment.APIEndpoint + '/P2ConnectionConfig';
  ENDCONNECTIONSAPI_ENDPOINT = environment.APIEndpoint + '/P2EndConnections';
  MATERIALGRADEAPI_ENDPOINT = environment.APIEndpoint + '/P2MaterialGrade';
  RANGEAPI_ENDPOINT = environment.APIEndpoint + '/P2Range';
  SUPPLIERAPI_ENDPOINT = environment.APIEndpoint + '/Supplier';
  ORGANIZATIONAPI_ENDPOINT = environment.APIEndpoint + '/Organization';
  MANUFACTURERAPI_ENDPOINT = environment.APIEndpoint + '/Manufacturer';
  NOTIFICATIONAPI_ENDPOINT = environment.APIEndpoint + '/NotificationAPI';
  GROUPEDINVENTORY_ENDPOINT = environment.APIEndpoint + '/api/RawData/groupedInventory';
  GROUPEDINVENTORYTOTAL_ENDPOINT = environment.APIEndpoint + '/api/RawData/giTotal';
  INVENTORY_ENDPOINT = environment.APIEndpoint + '/api/RawData/inventory';
  INVENTORYTOTAL_ENDPOINT = environment.APIEndpoint + '/api/RawData/riTotal';
  UNITCOST_ENDPOINT = environment.APIEndpoint + '/api/RawData/unitCost';
  UNITCOSTTOTAL_ENDPOINT = environment.APIEndpoint + '/api/RawData/unitCostTotal';
  TENARIS_ENDPOINT = environment.APIEndpoint + '/api/RawData/tenarisOrders';
  TENARISTOTAL_ENDPOINT = environment.APIEndpoint + '/api/RawData/tenarisTotal';
  VALLUOREC_ENDPOINT = environment.APIEndpoint + '/api/RawData/valluorecOrders';
  VALLUORECTOTAL_ENDPOINT = environment.APIEndpoint + '/api/RawData/valluorecTotal';
  LHANDWELLHEAD_ENDPOINT = environment.APIEndpoint + '/api/RawData/lHAndWellheadOrders';
  LHANDWELLHEADTOTAL_ENDPOINT = environment.APIEndpoint + '/api/RawData/lHAndWellheadTotal';
  CHANGELOGAPI_ENDPOINT = environment.APIEndpoint + '/ChangeLog';
  constructor(private http: HttpClient) { }

  sortData<T>(data: T[], field: keyof T, order: number): T[] {
    return data.sort((a: T, b: T) => {
      const valueA = a[field];
      const valueB = b[field];

      if (valueA < valueB) return order === 1 ? -1 : 1; // Ascending or Descending order
      if (valueA > valueB) return order === 1 ? 1 : -1;
      return 0; // Equal values
    });
  }

  // private cachedGiData: { [key: string]: Groupedinventory[] } = {};
  // private cachedGiTotals: number | null = null;

  // getGroupedInventories(pageNumber: number, pageSize: number, searchTerm?: string): Observable<Groupedinventory[]> {
  //   const cacheKey = `${pageNumber}-${pageSize}-${searchTerm || ''}`;

  //   if (this.cachedGiData[cacheKey]) {
  //     return of(this.cachedGiData[cacheKey]); // Return cached data if available
  //   }

  //   let url: string = `${this.GROUPEDINVENTORY_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  //   if (searchTerm) {
  //     url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
  //   }
  //   return this.http.get<Groupedinventory[]>(url).pipe(
  //     tap(data => {
  //       this.cachedGiData[cacheKey] = data; // Cache the response
  //     })
  //   );
  // }

  // getGroupedInventoryTotals(): Observable<number> {
  //   if (this.cachedGiTotals !== null) {
  //     return of(this.cachedGiTotals); // Return cached total if available
  //   }

  //   let url: string = this.GROUPEDINVENTORYTOTAL_ENDPOINT;
  //   return this.http.get<number>(url).pipe(
  //     tap(total => {
  //       this.cachedGiTotals = total; // Cache the total records
  //     })
  //   );
  // }

  // getAllGroupedInventoryData(pageNumber: number, pageSize: number): Observable<Groupedinventory[]> {
  //   return this.getGroupedInventoryTotals().pipe(
  //     switchMap(totalRecords => {
  //       const totalPages = Math.ceil(totalRecords / pageSize);
  //       if (pageNumber > totalPages) {
  //         return of([]); // Return empty if page number exceeds total pages
  //       }
  //       return this.getGroupedInventories(pageNumber, pageSize);
  //     })
  //   );
  // }

  // private cachedRiData: { [key: string]: Inventory[] } = {};
  // private cachedRiTotals: number | null = null;
  // getInventories(pageNumber: number, pageSize: number, searchTerm?: string): Observable<Inventory[]> {   
  //   const cacheKey = `${pageNumber}-${pageSize}-${searchTerm || ''}`;

  //   if (this.cachedRiData[cacheKey]) {
  //     return of(this.cachedRiData[cacheKey]); // Return cached data if available
  //   }

  //   let url: string = `${this.INVENTORY_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  //   if (searchTerm) {
  //     url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
  //   }
  //   return this.http.get<Inventory[]>(url).pipe(
  //     tap(data => {
  //       this.cachedRiData[cacheKey] = data; // Cache the response
  //     })
  //   );
  // }

  // getReadInventoryTotals(): Observable<number> {
  //   if (this.cachedRiTotals !== null) {
  //     return of(this.cachedRiTotals); // Return cached total if available
  //   }

  //   let url: string = this.INVENTORYTOTAL_ENDPOINT;
  //   return this.http.get<number>(url).pipe(
  //     tap(total => {
  //       this.cachedRiTotals = total; // Cache the total records
  //     })
  //   );
  // }

  // getAllReadInventoryData(pageNumber: number, pageSize: number): Observable<Inventory[]> {
  //   return this.getReadInventoryTotals().pipe(
  //     switchMap(totalRecords => {
  //       const totalPages = Math.ceil(totalRecords / pageSize);
  //       if (pageNumber > totalPages) {
  //         return of([]); // Return empty if page number exceeds total pages
  //       }
  //       return this.getInventories(pageNumber, pageSize);
  //     })
  //   );
  // }

  // private cachedUcData: { [key: string]: Sapunitcost[] } = {};
  // private cachedUcTotals: number | null = null;
  // getUnitCosts(pageNumber: number, pageSize: number, searchTerm?: string): Observable<Sapunitcost[]> {
  //   //let url: string = `${this.UNITCOST_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  //   //if (searchTerm) {
  //   //  url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
  //   //}
  //   //return this.http.get<Sapunitcost[]>(url);
  //   const cacheKey = `${pageNumber}-${pageSize}-${searchTerm || ''}`;

  //   if (this.cachedUcData[cacheKey]) {
  //     return of(this.cachedUcData[cacheKey]); // Return cached data if available
  //   }

  //   let url: string = `${this.UNITCOST_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  //   if (searchTerm) {
  //     url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
  //   }
  //   return this.http.get<Sapunitcost[]>(url).pipe(
  //     tap(data => {
  //       this.cachedUcData[cacheKey] = data; // Cache the response
  //     })
  //   );
  // }

  // getUnitCostsTotals(): Observable<number> {
  //   if (this.cachedUcTotals !== null) {
  //     return of(this.cachedUcTotals); // Return cached total if available
  //   }

  //   let url: string = this.UNITCOSTTOTAL_ENDPOINT;
  //   return this.http.get<number>(url).pipe(
  //     tap(total => {
  //       this.cachedUcTotals = total; // Cache the total records
  //     })
  //   );
  // }

  // getAllUnitCostData(pageNumber: number, pageSize: number): Observable<Sapunitcost[]> {
  //   return this.getUnitCostsTotals().pipe(
  //     switchMap(totalRecords => {
  //      /* console.log(totalRecords)*/
  //       const totalPages = Math.ceil(totalRecords / pageSize);
  //       if (pageNumber > totalPages) {
  //         return of([]); // Return empty if page number exceeds total pages
  //       }
  //       return this.getUnitCosts(pageNumber, pageSize);
  //     })
  //   );
  // }

  // private cachedToData: { [key: string]: Tenaris[] } = {};
  // private cachedToTotals: number | null = null;
  // getTenarisOrders(pageNumber: number, pageSize: number): Observable<Tenaris[]> {
  //   //let url: string = `${this.TENARIS_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  //   //return this.http.get<Tenaris[]>(url);

  //   const cacheKey = `${pageNumber}-${pageSize}`;
  //   if (this.cachedToData[cacheKey]) {
  //     return of(this.cachedToData[cacheKey]); // Return cached data if available
  //   }

  //   let url: string = `${this.TENARIS_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;    
  //   return this.http.get<Tenaris[]>(url).pipe(
  //     tap(data => {
  //       this.cachedToData[cacheKey] = data; // Cache the response
  //     })
  //   );
  // }

  // getTenarisTotals(): Observable<number> {
  //   if (this.cachedToTotals !== null) {
  //     return of(this.cachedToTotals); // Return cached total if available
  //   }

  //   let url: string = this.TENARISTOTAL_ENDPOINT;
  //   return this.http.get<number>(url).pipe(
  //     tap(total => {
  //       this.cachedToTotals = total; // Cache the total records
  //     })
  //   );
  // }

  // getAllTenarisData(pageNumber: number, pageSize: number): Observable<Tenaris[]> {
  //   return this.getTenarisTotals().pipe(
  //     switchMap(totalRecords => {        
  //       const totalPages = Math.ceil(totalRecords / pageSize);
  //       if (pageNumber > totalPages) {
  //         return of([]); // Return empty if page number exceeds total pages
  //       }
  //       return this.getTenarisOrders(pageNumber, pageSize);
  //     })
  //   );
  // }

  // private cachedVoData: { [key: string]: Valluorec[] } = {};
  // private cachedVoTotals: number | null = null;
  // getValluorecOrders(pageNumber: number, pageSize: number): Observable<Valluorec[]> {
  //   //let url: string = `${this.VALLUOREC_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  //   //return this.http.get<Valluorec[]>(url);

  //   const cacheKey = `${pageNumber}-${pageSize}`;
  //   if (this.cachedVoData[cacheKey]) {
  //     return of(this.cachedVoData[cacheKey]); // Return cached data if available
  //   }

  //   let url: string = `${this.VALLUOREC_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  //   return this.http.get<Valluorec[]>(url).pipe(
  //     tap(data => {
  //       this.cachedVoData[cacheKey] = data; // Cache the response
  //     })
  //   );
  // }

  // getValluorecTotals(): Observable<number> {
  //   if (this.cachedVoTotals !== null) {
  //     return of(this.cachedVoTotals); // Return cached total if available
  //   }

  //   let url: string = this.VALLUORECTOTAL_ENDPOINT;
  //   return this.http.get<number>(url).pipe(
  //     tap(total => {
  //       this.cachedVoTotals = total; // Cache the total records
  //     })
  //   );
  // }

  // getAllValluorecData(pageNumber: number, pageSize: number): Observable<Valluorec[]> {
  //   return this.getValluorecTotals().pipe(
  //     switchMap(totalRecords => {
  //       const totalPages = Math.ceil(totalRecords / pageSize);
  //       if (pageNumber > totalPages) {
  //         return of([]); // Return empty if page number exceeds total pages
  //       }
  //       return this.getValluorecOrders(pageNumber, pageSize);
  //     })
  //   );
  // }

  // private cachedLhData: { [key: string]: Lhandwellhead[] } = {};
  // private cachedLhTotals: number | null = null;
  // getlHAndWellheadOrders(pageNumber: number, pageSize: number): Observable<Lhandwellhead[]> {
  //   //let url: string = `${this.LHANDWELLHEAD_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  //   //return this.http.get<Lhandwellhead[]>(url);

  //   const cacheKey = `${pageNumber}-${pageSize}`;
  //   if (this.cachedLhData[cacheKey]) {
  //     return of(this.cachedLhData[cacheKey]); // Return cached data if available
  //   }

  //   let url: string = `${this.LHANDWELLHEAD_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  //   return this.http.get<Lhandwellhead[]>(url).pipe(
  //     tap(data => {
  //       this.cachedLhData[cacheKey] = data; // Cache the response
  //     })
  //   );
  // }

  // getlHAndWellheadTotals(): Observable<number> {
  //   if (this.cachedLhTotals !== null) {
  //     return of(this.cachedLhTotals); // Return cached total if available
  //   }

  //   let url: string = this.LHANDWELLHEADTOTAL_ENDPOINT;
  //   return this.http.get<number>(url).pipe(
  //     tap(total => {
  //       this.cachedLhTotals = total; // Cache the total records
  //     })
  //   );
  // }

  // getAlLHAndWellheadData(pageNumber: number, pageSize: number): Observable<Lhandwellhead[]> {
  //   return this.getlHAndWellheadTotals().pipe(
  //     switchMap(totalRecords => {
  //       const totalPages = Math.ceil(totalRecords / pageSize);
  //       if (pageNumber > totalPages) {
  //         return of([]); // Return empty if page number exceeds total pages
  //       }
  //       return this.getlHAndWellheadOrders(pageNumber, pageSize);
  //     })
  //   );
  // }


  // private cachedLh1Data: { [key: string]: LhAndWellHeadOrders[] } = {};
  // private cachedLh1Totals: number | null = null;
  // getlHAndWellheadOrders1(pageNumber: number, pageSize: number): Observable<LhAndWellHeadOrders[]> {
   
  //   const cacheKey = `${pageNumber}-${pageSize}`;
  //   if (this.cachedLh1Data[cacheKey]) {
  //     return of(this.cachedLh1Data[cacheKey]); // Return cached data if available
  //   }

  //   let url: string = `${this.LHANDWELLHEAD_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  //   return this.http.get<LhAndWellHeadOrders[]>(url).pipe(
  //     tap(data => {
  //       this.cachedLh1Data[cacheKey] = data; // Cache the response
  //     })
  //   );
  // }

  // getlHAndWellheadTotals1(): Observable<number> {
  //   if (this.cachedLh1Totals !== null) {
  //     return of(this.cachedLh1Totals); // Return cached total if available
  //   }

  //   let url: string = this.LHANDWELLHEADTOTAL_ENDPOINT;
  //   return this.http.get<number>(url).pipe(
  //     tap(total => {
  //       this.cachedLh1Totals = total; // Cache the total records
  //     })
  //   );
  // }

  // getAlLHAndWellheadData1(pageNumber: number, pageSize: number): Observable<LhAndWellHeadOrders[]> {
  //   return this.getlHAndWellheadTotals1().pipe(
  //     switchMap(totalRecords => {
  //       const totalPages = Math.ceil(totalRecords / pageSize);
  //       if (pageNumber > totalPages) {
  //         return of([]); // Return empty if page number exceeds total pages
  //       }
  //       return this.getlHAndWellheadOrders1(pageNumber, pageSize);
  //     })
  //   );
  // }

  // getOdinInventoryData(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/GetOdinDashboard`;
  //   return this.http.post<any>(url, body, { params });
  // }

  // getOdinWellsHeaderData(body: any = null): Observable<any> {
  //   let params = convertJsonToHttpParams(body);
  //   return this.http.get(`${this.ODINAPI_ENDPOINT}/GetWells`, { params });
  // }

  // updateOdinWellData(body: any) {
  //   const url: string = `${this.ODINAPI_ENDPOINT}/EditOdinWell`;
  //   return this.http.post<any>(url, body);
  // }

  // addOdinGrid(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/InsertEquipmentInWell`;
  //   return this.http.post<any>(url, body, { params });
  // }

  // saveOdinGrid(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/EditEquipmentForWells`;
  //   return this.http.post<any>(url, body, { params });
  // }

  // preViewEditForWells(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/PreviewEditEquipmentForWells`;
  //   return this.http.post<any>(url, body, { params });
  // }

  // getChangeLogData(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/GetWellInformationAuditData`;
  //   return this.http.post<any>(url, body, { params });
  // }

  // getWhatIfData(body: any, queryParams: any) {
  //   // let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/GetWhatIfWells`;
  //   return this.http.get<any>(url);//, body, { params });
  // }

  // getWhatIfDataSearch(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/SearchWhatIfWells`;
  //   return this.http.post<any>(url, body, { params });
  // }

  // editWhatIfWells(body: any) {
  //   const url: string = `${this.ODINAPI_ENDPOINT}/EditWhatIfWells`;
  //   return this.http.post<any>(url, body);
  // }

  // resetWhatIfWells() {
  //   const url: string = `${this.ODINAPI_ENDPOINT}/ResetWhatIfWells`;
  //   return this.http.get<any>(url);
  // }

  // saveThorGrid(body: any) {
  //   const url: string = `${this.ODINAPI_ENDPOINT}/EditWellInformation`;
  //   return this.http.post<any>(url, body);
  // }

  insertThorGrid(body: any) {
    const url: string = `${this.THORAPI_ENDPOINT}/InsertWell`;
    return this.http.post<any>(url, body);
  }

  getThorInventoryData(body: any) {
    const url: string = `${this.THORAPI_ENDPOINT}/GetThorDashboard`;
    return this.http.post<any>(url, body);
  }

  // getDemandConsumptionAndValuation(body: any, wellNumber: any) {
  //   const url: string = `${this.ODINAPI_ENDPOINT}/GetDemandConsumptionAndValuation?wellNumber=` + wellNumber;
  //   return this.http.post<any>(url, body);
  // }

  // getDemandConsumption(body: any) {
  //   const url: string = `${this.ODINAPI_ENDPOINT}/GetDemandConsumption`;
  //   return this.http.post<any>(url, body);
  // }

  getTyrInventoryData(body: any) {
    const url: string = `${this.TYRAPI_ENDPOINT}/GetTyrDashboard`;
    return this.http.post<any>(url, body);
  }

  getTyrInventoryDetails(id: string): Observable<any> {
    const url: string = `${this.TYRAPI_ENDPOINT}/GetTyrCase?tyrCaseId=` + id;
    return this.http.get(url);
  }

  insertTyrTag(id: string, tagText: string): Observable<any> {
    const url: string = `${this.TYRAPI_ENDPOINT}/AddTagToTyrCase?tyrCaseId=` + id + '&newTag=' + tagText;
    return this.http.get(url);
  }

  removeTyrTag(id: string, tagText: string): Observable<any> {
    const url: string = `${this.TYRAPI_ENDPOINT}/RemoveTagFromTyrCase?tyrCaseId=` + id + '&tagToRemove=' + tagText;
    return this.http.get(url);
  }

  resolveTyrCase(id: string, slocDocId: string): Observable<any> {
    const url: string = `${this.TYRAPI_ENDPOINT}/ResolveTyrCase?tyrCaseId=` + id + '&slocDocId=' + slocDocId;
    return this.http.get(url);
  }

  getTyrStakeholders(id: string): Observable<any> {
    const url: string = `${this.TYRAPI_ENDPOINT}/GetTyrStakeholders?tyrCaseId=` + id;
    return this.http.get(url);
  }

  getTyrInventoryStatusCount(): Observable<any> {
    const url: string = `${this.TYRAPI_ENDPOINT}/GetTyrStatusCounts`;
    return this.http.get<any>(url);
  }

  updateTyrCaseExceptionDetails(body: any) {
    const url: string = `${this.TYRAPI_ENDPOINT}/UpdateTyrCaseExceptionDetails`;
    return this.http.post<any>(url, body);
  }

  // getTimelineViewData(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/GetOdinTimelineAnalysisWithTotals`;
  //   return this.http.post<any>(url, body, { params });
  // }

  // getTimelineWhatIfViewData(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/GetOdinWhatIfAnalysisWithTotals`;
  //   return this.http.post<any>(url, body, { params });
  // }

  getMaterials(body: any) {
    const url: string = `${this.ODINAPI_ENDPOINT}/GetMaterials`;
    return this.http.post<any>(url, body);
  }

  saveChatData(body: any) {
    const url: string = `${this.CHATAPI_ENDPOINT}/AddChatData`;
    return this.http.post<any>(url, body);
  }

  getChatData(body: any) {
    const url: string = `${this.CHATAPI_ENDPOINT}/GetAllChat`;
    return this.http.post<any>(url, body);
  }

  getAllUser() {
    const url: string = `${this.CHATAPI_ENDPOINT}/GetUsersList`;
    return this.http.get<any>(url);
  }

  saveWellDetais(body: any) {
    const url: string = `${this.THORAPI_ENDPOINT}/EditWell`;
    
    return this.http.post<any>(url, body);
  }

  // getRigScheduleData(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/GetOdinRigScheduleAnalysis`;
  //   return this.http.post<any>(url, body, { params });
  // }

  /**
   * 
   * @param wellNumber selected well number
   * @returns {promise}
   */
  // cloneWell(wellNumber: number) {
  //   const url: string = `${this.ODINAPI_ENDPOINT}/CloneWell?wellNumber=${wellNumber}`;
  //   return this.http.get<any>(url);
  // }

  /**
   * 
   * @param wellNumber selected well number
   * @returns {promise}
   */
  // exportOdinWellToThor(wellNumber: number) {
  //   const url: string = `${this.ODINAPI_ENDPOINT}/ExportOdinWellToThor?wellNumber=${wellNumber}`;
  //   return this.http.get<any>(url);
  // }

  //Marked for deletion. Also no API as such
  /**
   * 
   * @param body body params
   * @param queryParams query params
   * @returns {promise}
   */
  downloadOdinWellInformation(body: any, queryParams: any) {
    let params = convertJsonToHttpParams(queryParams);
    const url: string = `${this.ODINAPI_ENDPOINT}/odinDashboardDownload`;
    return this.http.post<any>(url, body, { params, observe: 'response', responseType: 'blob' as 'json' });
  }

  /**
   * 
   * @param materialId equipment material Id
   * @returns {promise}
   */
  deleteEquipment(materialId: string) {
    const url: string = `${this.ODINAPI_ENDPOINT}/DeleteEquipment?materialId=${materialId}`;
    return this.http.get<any>(url);
  }
  /**
   * 
   * @param materialId equipment material Id
   * @returns {promise}
   */
  // getWellDemandForMaterial(materialId: string) {
  //   const url: string = `${this.ODINAPI_ENDPOINT}/GetWellDemandForMaterial?materialId=${materialId}`;
  //   return this.http.get<any>(url);
  // }

  // odinExportToExcel(body: any, queryParams: any) {
  //   let params = convertJsonToHttpParams(queryParams);
  //   const url: string = `${this.ODINAPI_ENDPOINT}/ExportOdinDashboardToExcel`;
  //   return this.http.post<any>(url, body, { params });
  // }

  getNotifications(body: any,additionalWhereClause:string) {
    const url: string = `${this.NOTIFICATIONAPI_ENDPOINT}/GetNotifications?additionalWhereClause=${additionalWhereClause}`;
    return this.http.post<any>(url, body);
  }

  getNotificationTransaction(transactionId: any) {
    const url: string = `${this.NOTIFICATIONAPI_ENDPOINT}/GetNotificationTransaction?notificationTransactionId=${transactionId}`;
    return this.http.get<any>(url);
  }

  dismissNotification(transactionId: any) {
    const url: string = `${this.NOTIFICATIONAPI_ENDPOINT}/DismissNotification?notificationTransactionId=${transactionId}`;
    return this.http.get<any>(url);
  }

  getNotificationAuditData(body: any, transactionId: any) {
    const url: string = `${this.NOTIFICATIONAPI_ENDPOINT}/GetNotificationAuditData?notificationTransactionId=${transactionId}`;
    return this.http.post<any>(url, body);
  }

  getReportReceptionMetrics(body: any) {
    const url: string = `${this.TYRAPI_ENDPOINT}/GetReportReceptionMetrics`;
    return this.http.post<any>(url, body);
  }

  getStatusMetrics(body: any) {
    const url: string = `${this.TYRAPI_ENDPOINT}/GetStatusMetrics`;
    return this.http.post<any>(url, body);
  }

  getExceptionMetrics(body: any) {
    const url: string = `${this.TYRAPI_ENDPOINT}/GetExceptionMetrics`;
    return this.http.post<any>(url, body);
  }

  getAssigneeMetrics(body: any) {
    const url: string = `${this.TYRAPI_ENDPOINT}/GetAssigneeMetrics`;
    return this.http.post<any>(url, body);
  }

  

  getComponentType() {
    const url: string = `${this.COMPONENTTYPEAPI_ENDPOINT}`;
    return this.http.get<any>(url);
  }
  addComponentType(body:any) {
    const url: string = `${this.COMPONENTTYPEAPI_ENDPOINT}`;
    return this.http.post<any>(url, body);
  }

  getConnectionConfig() {
    const url: string = `${this.CONNECTIONCONFIGAPI_ENDPOINT}`;
    return this.http.get<any>(url);
  }
  addConnectionConfig(body:any) {
    const url: string = `${this.CONNECTIONCONFIGAPI_ENDPOINT}`;
    return this.http.post<any>(url,body);
  }

  getEndConnections() {
    const url: string = `${this.ENDCONNECTIONSAPI_ENDPOINT}`;
    return this.http.get<any>(url);
  }
  addEndConnection(body:any) {
    const url: string = `${this.ENDCONNECTIONSAPI_ENDPOINT}`;
    return this.http.post<any>(url,body);
  }

  getMaterialGrade() {
    const url: string = `${this.MATERIALGRADEAPI_ENDPOINT}`;
    return this.http.get<any>(url);
  }
  addMaterialGrade(body: any) {
    const url: string = `${this.MATERIALGRADEAPI_ENDPOINT}`;
    return this.http.post<any>(url, body);
  }

  getRange() {
    const url: string = `${this.RANGEAPI_ENDPOINT}`;
    return this.http.get<any>(url);
  }
  addRange(body: any) {
    const url: string = `${this.RANGEAPI_ENDPOINT}`;
    return this.http.post<any>(url, body);
  }

  getSupplier() {
    const url: string = `${this.SUPPLIERAPI_ENDPOINT}`;
    return this.http.get<any>(url);
  }
  addSupplier(body: any) {
    const url: string = `${this.SUPPLIERAPI_ENDPOINT}`;
    return this.http.post<any>(url, body);
  }

  getOrganization() {
    const url: string = `${this.ORGANIZATIONAPI_ENDPOINT}`;
    return this.http.get<any>(url);
  }
  addOrganization(body: any) {
    const url: string = `${this.ORGANIZATIONAPI_ENDPOINT}`;
    return this.http.post<any>(url, body);
  }

  getManufacturer() {
    const url: string = `${this.MANUFACTURERAPI_ENDPOINT}`;
    return this.http.get<any>(url);
  }
  addManufacturer(body: any) {
    const url: string = `${this.MANUFACTURERAPI_ENDPOINT}`;
    return this.http.post<any>(url, body);
  }


  getChangeLogs(pageIndex:number,pageSize:number,entityName:any) {
    const url: string = `${this.CHANGELOGAPI_ENDPOINT}/GetChangeLogs?pageIndex=${pageIndex}&pageSize=${pageSize}&entityType=${entityName}`;
    return this.http.get<any>(url);
    
  }

  getBatchLogs(batchId: number): Observable<any> {
    return this.http.get(`${this.BATCHLOGAPI_ENDPOINT}/GetBatchLogByBatchId/${batchId}`);
  }

  getErrorDetails(batchId: number): Observable<any> {
    return this.http.get(`${this.MDLERRORLOGAPI_ENDPOINT}/${batchId}`);
  }

  updateComponentType(body: any) {
    const url: string = `${this.COMPONENTTYPEAPI_ENDPOINT}/${body.componentTypeId}`;
    return this.http.put<any>(url, body);
  }

  updateConnectionConfig(body: any) {
    const url: string = `${this.CONNECTIONCONFIGAPI_ENDPOINT}/${body.connectionConfigId}`;
    return this.http.put<any>(url, body);
  }

  updateEndConnection(body: any) {
    const url: string = `${this.ENDCONNECTIONSAPI_ENDPOINT}/${body.endConnectionId}`;
    return this.http.put<any>(url, body);
  }

  updateMaterialGrade(body: any) {
    const url: string = `${this.MATERIALGRADEAPI_ENDPOINT}/${body.materialGradeId}`;
    return this.http.put<any>(url, body);
  }

  updateRange(body: any) {
    const url: string = `${this.RANGEAPI_ENDPOINT}/${body.rangeId}`;
    return this.http.put<any>(url, body);
  }

  updateOrganization(body: any) {
    const url: string = `${this.ORGANIZATIONAPI_ENDPOINT}/${body.organizationId}`;
    return this.http.put<any>(url, body);
  }

  deleteComponentType(id: string) {
    const url: string = `${this.COMPONENTTYPEAPI_ENDPOINT}/${id}`;
    return this.http.delete<any>(url);
  }

  deleteConnectionConfig(id: string) {
    const url: string = `${this.CONNECTIONCONFIGAPI_ENDPOINT}/${id}`;
    return this.http.delete<any>(url);
  }

  deleteEndConnection(id: string) {
    const url: string = `${this.ENDCONNECTIONSAPI_ENDPOINT}/${id}`;
    return this.http.delete<any>(url);
  }

  deleteMaterialGrade(id: string) {
    const url: string = `${this.MATERIALGRADEAPI_ENDPOINT}/${id}`;
    return this.http.delete<any>(url);
  }

  deleteRange(id: string) {
    const url: string = `${this.RANGEAPI_ENDPOINT}/${id}`;
    return this.http.delete<any>(url);
  }

  deleteOrganization(id: string) {
    const url: string = `${this.ORGANIZATIONAPI_ENDPOINT}/${id}`;
    return this.http.delete<any>(url);
  }
  /**
   * service for virtual scrolling
   * @param pageNumber 
   * @param pageSize 
   * @param searchTerm 
   * @returns 
   */
  getAutomaticReadInventoryPaged(pageNumber = 1, pageSize = 100, searchTerm?: string): Observable<Response<PagedResponse<Inventory[]>>> {
  
    let url: string = `${this.INVENTORY_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
    }
      const params = new HttpParams()
        .set('pageNumber', pageNumber.toString())
        .set('pageSize', pageSize.toString());
  
      return this.http.get<Response<PagedResponse<Inventory[]>>>(url, { params })
        .pipe(
          catchError((error) => this.handleError(error))
        );
    }
  
    private handleError(error: HttpErrorResponse): Observable<never> {
      let errorMessage = 'An unknown error occurred.';
  
      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Client-side error: ${error.error.message}`;
      } else {
        // Backend returned an unsuccessful response code
        errorMessage = `Server-side error: ${error.status} - ${error.message}`;
      }
  
      // Log to console or handle accordingly
      console.error(errorMessage);
  
      // Throw the error to the caller
      throw new Error(errorMessage);
    }
}
