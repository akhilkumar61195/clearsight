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
import { masterdatalibraryModel } from '../common/model/masterdatalibraryModel';
import { PaginatedDataModel } from '../common/model/PaginatedDataModel';

@Injectable({
  providedIn: 'root'
})
export class MdlDataService {
  MDLAPI_ENDPOINT = environment.APIEndpoint + '/MasterDataLibrary';

  constructor(private http: HttpClient) { }

  addMaterial(body: any) {
    const url: string = `${this.MDLAPI_ENDPOINT}`;
    return this.http.post<any>(url, body);
  }

  getMasterData(first: number, rows: number, sortField?: string, sortOrder?: number, orgIds?: number[]): Observable<PaginatedDataModel> {
    const url: string = `${this.MDLAPI_ENDPOINT}?first=${first}&rows=${rows}&sortField=${sortField}&sortOrder=${sortOrder}&orgIds=${orgIds}`;
    return this.http.get<PaginatedDataModel>(url);
  }

  searchByMMR(searchTerm: string, first: number, rows: number, sortField?: string, sortOrder?: number): Observable<PaginatedDataModel> {
    const apiUrl = `${this.MDLAPI_ENDPOINT}/${searchTerm}?first=${first}&rows=${rows}&sortField=${sortField}&sortOrder=${sortOrder}`;
    return this.http.get<PaginatedDataModel>(apiUrl);
  }

  searchGlobal(searchVal: string, first: number, rows: number, orgIds?: number[]): Observable<PaginatedDataModel> {
    const body = {
      searchVal: searchVal,
      first: first,
      rows: rows,
      orgIds: orgIds
    };
    const apiUrl = `${this.MDLAPI_ENDPOINT}/Search`;
    return this.http.post<PaginatedDataModel>(apiUrl, body);
  }

  editMaterial(body: any): Observable<any> {
    const url: string = `${this.MDLAPI_ENDPOINT}`;
    return this.http.patch<any>(url, body);
  }

  editMaterials(body: any): Observable<any> {
    const url: string = `${this.MDLAPI_ENDPOINT}/editmaterials`;
    return this.http.patch<any>(url, body);
  }

  bulkUploadMdl(formData: FormData): Observable<any> {
    const url: string = `${this.MDLAPI_ENDPOINT}/upload`;
    return this.http.post<any>(url, formData);
  }

  downloadMdlTemplate() {
    const url: string = `${this.MDLAPI_ENDPOINT}/download-template`;
    return this.http.get(url, { responseType: 'blob' });
  }


  private cachedMaterailData: { [key: string]: masterdatalibraryModel[] } = {};
  private cachedMaterailTotals: number | null = null;

  getMaterials(pageNumber: number, pageSize: number, orgIds: number[] = null, searchTerm?: string): Observable<masterdatalibraryModel[]> {
    const cacheKey = `${pageNumber}-${pageSize}-${searchTerm || ''}`;

    //if (this.cachedMaterailData[cacheKey]) {
    //  return of(this.cachedMaterailData[cacheKey]); // Return cached data if available
    //}
    let url: string;
    if (orgIds == null || orgIds.length == 0) {
      url = `${this.MDLAPI_ENDPOINT}/materials?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    }
    else {
      url = `${this.MDLAPI_ENDPOINT}/materials?pageNumber=${pageNumber}&pageSize=${pageSize}&orgIds=${orgIds}`;
    }
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
    }
    return this.http.get<masterdatalibraryModel[]>(url).pipe(
      tap(data => {
    
        this.cachedMaterailData[cacheKey] = data; // Cache the response
      })
    );
  }

  getMaterialsTotal(orgIds: number[] = null): Observable<number> {
    //if (this.cachedMaterailTotals !== null) {
    //  return of(this.cachedMaterailTotals); // Return cached total if available
    //}
    let url: string;
    if (orgIds == null || orgIds.length == 0) {
      url = `${this.MDLAPI_ENDPOINT}/materialstotal`;
    } else {
      url = `${this.MDLAPI_ENDPOINT}/materialstotal?orgIds=${orgIds}`;
    }
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedMaterailTotals = total; // Cache the total records
      })
    );
  }

  /**
   * Updates the build priority number for drilling materials.
   * @param body The request body containing the updated information.
   * @returns An observable of the HTTP response.
   */
  updateDrillingMaterialsBuildPriorityNumber(body: any): Observable<any> {
    const url: string = `${this.MDLAPI_ENDPOINT}/updatedrillingmaterialsbpn`;
    return this.http.patch<any>(url, body);
  }

  //getMasterDataRecursive(pageNumber: number, pageSize: number, orgIds: number[]): Observable<masterdatalibraryModel[]> {
  //  const fetchPage = (currentPage: number, accumulatedData: masterdatalibraryModel[]): Observable<masterdatalibraryModel[]> => {
  //    return this.getMaterials(currentPage, pageSize, orgIds).pipe(
  //      switchMap(data => {
  //        if (data.length === 0) {
  //          return of(accumulatedData); // Stop recursion if no more data
  //        }
  //        const combinedData = [...accumulatedData, ...data];
  //        return fetchPage(currentPage + 1, combinedData); // Fetch the next page
  //      })
  //    );
  //  };
  //  return this.getMaterialsTotal(orgIds).pipe(
  //    switchMap(() => fetchPage(pageNumber, [])) // Start recursive fetch from the first page
  //  );
  //}
}
