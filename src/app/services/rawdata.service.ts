import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { MitiUpload, WellHeadUpload } from '../common/model/rawDataBulkUploadModel';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { Response, PagedResponse } from '../common/model/response';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { UpdateTenaris } from '../common/model/rawData-tenaris-update';
import { UpdateVallourec } from '../common/model/rawData-vallourec-update';
import { LHAndWellHeadUpdate } from '../common/model/rawData-LhAndWellHeadeUpdate';
import { MitiUpdate } from '../common/model/rawdata-miti-update';
import { Sapunitcost } from '../common/model/sapunitcost';
import { Groupedinventory } from '../common/model/groupedinventory';
import { Inventory } from '../common/model/inventory';
import { Tenaris } from '../common/model/tenaris';
import { Valluorec } from '../common/model/valluorec';
import { Lhandwellhead } from '../common/model/lhandwellhead';
import { LhAndWellHeadOrders } from '../common/model/lh-and-well-head-orders';
import { WellHeadUpdate } from '../common/model/rawdata-wellHead-update';
import { YardInventory } from '../common/model/yardinventory';

@Injectable({
  providedIn: 'root'
})
export class RawdataService {
  RD_ENDPOINT = environment.APIEndpoint + '/api/RawData';
 
  constructor(private http: HttpClient) { }

  getMitiPaged(pageNumber = 1, pageSize = 100): Observable<Response<PagedResponse<MitiUpload[]>>> {

    const url = `${this.RD_ENDPOINT}/getMiti`;
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<Response<PagedResponse<MitiUpload[]>>>(url, { params })
      .pipe(
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * to  bulk update for tenaris
   
   * @param model 
   * @returns 
   */
  updateTenaris(model: UpdateTenaris[]): Observable<UpdateTenaris[]> {
    let url: string = `${this.RD_ENDPOINT}/tenarisBulkUpdate`;
    return this.http.put<UpdateTenaris[]>(url, model);
  }

    /**
   * to  bulk update for valloure
   
   * @param model 
   * @returns 
   */
  updateVallourec(model: UpdateVallourec[]): Observable<UpdateVallourec[]> {
    let url: string = `${this.RD_ENDPOINT}/vallorecBulkUpdate`;
    return this.http.put<UpdateVallourec[]>(url, model);
  }
      /**
   * to  bulk update for  LHAndWellHead
   
   * @param model 
   * @returns 
   */
  // updateLhAndWellHead service //
  updateLhAndWellHead(model: LHAndWellHeadUpdate[]): Observable<LHAndWellHeadUpdate[]> {
    let url: string = `${this.RD_ENDPOINT}/lhAndWellHeadBulkUpdate`;
    return this.http.put<LHAndWellHeadUpdate[]>(url, model);
  }
/**
 * update miti records
 * @param model 
 * @returns 
 */
  updateMiti(model: MitiUpdate[]): Observable<MitiUpdate[]> {
    let url: string = `${this.RD_ENDPOINT}/mitiUpdate`;
    return this.http.put<MitiUpdate[]>(url, model);
  }

/**
 * update well head records
 * @param model 
 * @returns 
 */
  updateWellHead(model: WellHeadUpdate[]): Observable<WellHeadUpdate[]> {
    let url: string = `${this.RD_ENDPOINT}/wellHeadBulkUpdate`;
    return this.http.put<WellHeadUpdate[]>(url, model);
  }
  private cachedUcData: { [key: string]: Sapunitcost[] } = {};
  private cachedUcTotals: number | null = null;
  /**
   * getting unit cost and caching it
   * @param pageNumber 
   * @param pageSize 
   * @param searchTerm 
   * @returns 
   */
  getUnitCosts(pageNumber: number, pageSize: number, searchTerm?: string): Observable<Sapunitcost[]> {
    //let url: string = `${this.UNITCOST_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    //if (searchTerm) {
    //  url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
    //}
    //return this.http.get<Sapunitcost[]>(url);
    const cacheKey = `${pageNumber}-${pageSize}-${searchTerm || ''}`;

    if (this.cachedUcData[cacheKey]) {
      return of(this.cachedUcData[cacheKey]); // Return cached data if available
    }

    let url: string = `${this.RD_ENDPOINT}/unitCost?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
    }
    return this.http.get<Sapunitcost[]>(url).pipe(
      tap(data => {
        this.cachedUcData[cacheKey] = data; // Cache the response
      })
    );
  }
/**
 * unit cost total
 * @returns 
 */
  getUnitCostsTotals(): Observable<number> {
    if (this.cachedUcTotals !== null) {
      return of(this.cachedUcTotals); // Return cached total if available
    }

    let url: string = `${this.RD_ENDPOINT}/unitCostTotal`;
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedUcTotals = total; // Cache the total records
      })
    );
  }
/**
 * merging total number of reord adnd records
 * @param pageNumber 
 * @param pageSize 
 * @returns 
 */
  getAllUnitCostData(pageNumber: number, pageSize: number): Observable<Sapunitcost[]> {
    return this.getUnitCostsTotals().pipe(
      switchMap(totalRecords => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (pageNumber > totalPages) {
          return of([]); // Return empty if page number exceeds total pages
        }
        return this.getUnitCosts(pageNumber, pageSize);
      })
    );
  }

  private cachedGiData: { [key: string]: Groupedinventory[] } = {};
  private cachedGiTotals: number | null = null;

  getGroupedInventories(pageNumber: number, pageSize: number, searchTerm?: string): Observable<Groupedinventory[]> {
    const cacheKey = `${pageNumber}-${pageSize}-${searchTerm || ''}`;

    if (this.cachedGiData[cacheKey]) {
      return of(this.cachedGiData[cacheKey]); // Return cached data if available
    }

    let url: string = `${this.RD_ENDPOINT}/groupedInventory?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
    }
    return this.http.get<Groupedinventory[]>(url).pipe(
      tap(data => {
        this.cachedGiData[cacheKey] = data; // Cache the response
      })
    );
  }

  getGroupedInventoryTotals(): Observable<number> {
    if (this.cachedGiTotals !== null) {
      return of(this.cachedGiTotals); // Return cached total if available
    }

    let url: string = `${this.RD_ENDPOINT}/giTotal`;
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedGiTotals = total; // Cache the total records
      })
    );
  }

  getAllGroupedInventoryData(pageNumber: number, pageSize: number): Observable<Groupedinventory[]> {
    return this.getGroupedInventoryTotals().pipe(
      switchMap(totalRecords => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (pageNumber > totalPages) {
          return of([]); // Return empty if page number exceeds total pages
        }
        return this.getGroupedInventories(pageNumber, pageSize);
      })
    );
  }
  
  private cachedRiData: { [key: string]: Inventory[] } = {};
  private cachedRiTotals: number | null = null;

  private cachedYardInventoryData: { [key: string]: YardInventory[] } = {};
  private cachedYardInventoryTotals: number | null = null;

  getInventories(pageNumber: number, pageSize: number, searchTerm?: string): Observable<Inventory[]> {   
    const cacheKey = `${pageNumber}-${pageSize}-${searchTerm || ''}`;

    if (this.cachedRiData[cacheKey]) {
      return of(this.cachedRiData[cacheKey]); // Return cached data if available
    }

    let url: string = `${this.RD_ENDPOINT}/inventory?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
    }
    return this.http.get<Inventory[]>(url).pipe(
      tap(data => {
        this.cachedRiData[cacheKey] = data; // Cache the response
      })
    );
  }
 getYardInventories(pageNumber: number, pageSize: number, searchTerm?: string): Observable<YardInventory[]> {   
    const cacheKey = `${pageNumber}-${pageSize}-${searchTerm || ''}`;

    if (this.cachedYardInventoryData[cacheKey]) {
      return of(this.cachedYardInventoryData[cacheKey]); // Return cached data if available
    }

    let url: string = `${this.RD_ENDPOINT}/yardInventory?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
    }
    return this.http.get<YardInventory[]>(url).pipe(
      tap(data => {
        this.cachedYardInventoryData[cacheKey] = data; // Cache the response
      })
    );
  }
  getReadInventoryTotals(): Observable<number> {
    if (this.cachedRiTotals !== null) {
      return of(this.cachedRiTotals); // Return cached total if available
    }

    let url: string = `${this.RD_ENDPOINT}/riTotal`;
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedRiTotals = total; // Cache the total records
      })
    );
  }

    getYardInventoryTotals(): Observable<number> {
    if (this.cachedYardInventoryTotals !== null) {
      return of(this.cachedYardInventoryTotals); // Return cached total if available
    }

    let url: string = `${this.RD_ENDPOINT}/yardInventoryTotal`;
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedYardInventoryTotals = total; // Cache the total records
      })
    );
  }

  getAllReadInventoryData(pageNumber: number, pageSize: number): Observable<Inventory[]> {
    return this.getReadInventoryTotals().pipe(
      switchMap(totalRecords => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (pageNumber > totalPages) {
          return of([]); // Return empty if page number exceeds total pages
        }
        return this.getInventories(pageNumber, pageSize);
      })
    );
  }

    getAllYardInventoryData(pageNumber: number, pageSize: number): Observable<YardInventory[]> {
    return this.getYardInventoryTotals().pipe(
      switchMap(totalRecords => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (pageNumber > totalPages) {
          return of([]); // Return empty if page number exceeds total pages
        }
        return this.getYardInventories(pageNumber, pageSize);
      })
    );
  }
  private cachedToData: { [key: string]: Tenaris[] } = {};
  private cachedToTotals: number | null = null;
  getTenarisOrders(pageNumber: number, pageSize: number): Observable<Tenaris[]> {
    //let url: string = `${this.TENARIS_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    //return this.http.get<Tenaris[]>(url);

    const cacheKey = `${pageNumber}-${pageSize}`;
    if (this.cachedToData[cacheKey]) {
      return of(this.cachedToData[cacheKey]); // Return cached data if available
    }

    let url: string = `${this.RD_ENDPOINT}/tenarisOrders?pageNumber=${pageNumber}&pageSize=${pageSize}`;    
    return this.http.get<Tenaris[]>(url).pipe(
      tap(data => {
        this.cachedToData[cacheKey] = data; // Cache the response
      })
    );
  }

  getTenarisTotals(): Observable<number> {
    if (this.cachedToTotals !== null) {
      return of(this.cachedToTotals); // Return cached total if available
    }

    let url: string = `${this.RD_ENDPOINT}/tenarisTotal`;
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedToTotals = total; // Cache the total records
      })
    );
  }

  getAllTenarisData(pageNumber: number, pageSize: number): Observable<Tenaris[]> {
    return this.getTenarisTotals().pipe(
      switchMap(totalRecords => {        
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (pageNumber > totalPages) {
          return of([]); // Return empty if page number exceeds total pages
        }
        return this.getTenarisOrders(pageNumber, pageSize);
      })
    );
  }

 clearTenarisCachePage(pageNumber: number, pageSize: number) {
  const cacheKey = `${pageNumber}-${pageSize}`;
  delete this.cachedToData[cacheKey];
  }

  private cachedVoData: { [key: string]: Valluorec[] } = {};
  private cachedVoTotals: number | null = null;
  getValluorecOrders(pageNumber: number, pageSize: number): Observable<Valluorec[]> {
    //let url: string = `${this.VALLUOREC_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    //return this.http.get<Valluorec[]>(url);

    const cacheKey = `${pageNumber}-${pageSize}`;
    if (this.cachedVoData[cacheKey]) {
      return of(this.cachedVoData[cacheKey]); // Return cached data if available
    }

    let url: string = `${this.RD_ENDPOINT}/valluorecOrders?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    return this.http.get<Valluorec[]>(url).pipe(
      tap(data => {
        this.cachedVoData[cacheKey] = data; // Cache the response
      })
    );
  }

  getValluorecTotals(): Observable<number> {
    if (this.cachedVoTotals !== null) {
      return of(this.cachedVoTotals); // Return cached total if available
    }

    let url: string = `${this.RD_ENDPOINT}/valluorecTotal`;
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedVoTotals = total; // Cache the total records
      })
    );
  }

  getAllValluorecData(pageNumber: number, pageSize: number): Observable<Valluorec[]> {
    return this.getValluorecTotals().pipe(
      switchMap(totalRecords => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (pageNumber > totalPages) {
          return of([]); // Return empty if page number exceeds total pages
        }
        return this.getValluorecOrders(pageNumber, pageSize);
      })
    );
  }

  private cachedLhData: { [key: string]: Lhandwellhead[] } = {};
  private cachedLhTotals: number | null = null;
  getlHAndWellheadOrders(pageNumber: number, pageSize: number): Observable<Lhandwellhead[]> {
    //let url: string = `${this.LHANDWELLHEAD_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    //return this.http.get<Lhandwellhead[]>(url);

    const cacheKey = `${pageNumber}-${pageSize}`;
    if (this.cachedLhData[cacheKey]) {
      return of(this.cachedLhData[cacheKey]); // Return cached data if available
    }

    let url: string = `${this.RD_ENDPOINT}/lHAndWellheadOrders?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    return this.http.get<Lhandwellhead[]>(url).pipe(
      tap(data => {
        this.cachedLhData[cacheKey] = data; // Cache the response
      })
    );
  }

  getlHAndWellheadTotals(): Observable<number> {
    if (this.cachedLhTotals !== null) {
      return of(this.cachedLhTotals); // Return cached total if available
    }

    let url: string = `${this.RD_ENDPOINT}/lHAndWellheadTotal`;
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedLhTotals = total; // Cache the total records
      })
    );
  }

  getAlLHAndWellheadData(pageNumber: number, pageSize: number): Observable<Lhandwellhead[]> {
    return this.getlHAndWellheadTotals().pipe(
      switchMap(totalRecords => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (pageNumber > totalPages) {
          return of([]); // Return empty if page number exceeds total pages
        }
        return this.getlHAndWellheadOrders(pageNumber, pageSize);
      })
    );
  }
  private cachedLh1Data: { [key: string]: LhAndWellHeadOrders[] } = {};
  private cachedLh1Totals: number | null = null;
  private cachedWellHeadData: { [key: string]: WellHeadUpload[] } = {};
  private cachedWellHeadTotals: number | null = null;
  getlHAndWellheadOrders1(pageNumber: number, pageSize: number): Observable<LhAndWellHeadOrders[]> {
   
    const cacheKey = `${pageNumber}-${pageSize}`;
    if (this.cachedLh1Data[cacheKey]) {
      return of(this.cachedLh1Data[cacheKey]); // Return cached data if available
    }

    let url: string = `${this.RD_ENDPOINT}/lHAndWellheadOrders?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    return this.http.get<LhAndWellHeadOrders[]>(url).pipe(
      tap(data => {
        this.cachedLh1Data[cacheKey] = data; // Cache the response
      })
    );
  }
  getWellheadOrders1(pageNumber: number, pageSize: number): Observable<WellHeadUpload[]> {
   
    const cacheKey = `${pageNumber}-${pageSize}`;
    if (this.cachedWellHeadData[cacheKey]) {
      return of(this.cachedWellHeadData[cacheKey]); // Return cached data if available
    }

    let url: string = `${this.RD_ENDPOINT}/wellheadOrders?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    return this.http.get<WellHeadUpload[]>(url).pipe(
      tap(data => {
        this.cachedWellHeadData[cacheKey] = data; // Cache the response
      })
    );
  }
  getlHAndWellheadTotals1(): Observable<number> {
    if (this.cachedLh1Totals !== null) {
      return of(this.cachedLh1Totals); // Return cached total if available
    }

    let url: string = `${this.RD_ENDPOINT}/lHAndWellheadTotal`;
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedLh1Totals = total; // Cache the total records
      })
    );
  }
  getWellheadTotals1(): Observable<number> {
    if (this.cachedWellHeadTotals !== null) {
      return of(this.cachedWellHeadTotals); // Return cached total if available
    }

    let url: string = `${this.RD_ENDPOINT}/wellheadTotal`;
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedWellHeadTotals = total; // Cache the total records
      })
    );
  }

  getAlLHAndWellheadData1(pageNumber: number, pageSize: number): Observable<LhAndWellHeadOrders[]> {
    return this.getlHAndWellheadTotals1().pipe(
      switchMap(totalRecords => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (pageNumber > totalPages) {
          return of([]); // Return empty if page number exceeds total pages
        }
        return this.getlHAndWellheadOrders1(pageNumber, pageSize);
      })
    );
  }
  getAllWellheadData1(pageNumber: number, pageSize: number): Observable<WellHeadUpload[]> {
    return this.getWellheadTotals1().pipe(
      switchMap(totalRecords => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (pageNumber > totalPages) {
          return of([]); // Return empty if page number exceeds total pages
        }
        return this.getWellheadOrders1(pageNumber, pageSize);
      })
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
  sortData<T>(data: T[], field: keyof T, order: number): T[] {
    return data.sort((a: T, b: T) => {
      const valueA = a[field];
      const valueB = b[field];

      if (valueA < valueB) return order === 1 ? -1 : 1; // Ascending or Descending order
      if (valueA > valueB) return order === 1 ? 1 : -1;
      return 0; // Equal values
    });
  }
}
