import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { SchematicSelection } from '../common/model/schematic-selection';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';
import { SchematicAssembly } from '../common/model/schematic-assembly';
import { SchematicMasterTable } from '../common/model/schematic-master-table';

@Injectable({
  providedIn: 'root'
})
export class SchematicService {

  SCHEMATICSELECTION_ENDPOINT = environment.APIEndpoint + '/api/Schematic/schematicSelection';
  SCHEMATICSELECTION_BYID_ENDPOINT = environment.APIEndpoint + '/api/Schematic/schematicSelectionById';
  SCHEMATICSELECTION_TOTAL_ENDPOINT = environment.APIEndpoint + '/api/Schematic/schematicSelectionTotal';
  SCHEMATICSELECTION_SAVE_ENDPOINT = environment.APIEndpoint + '/api/Schematic/save';
  SCHEMATICSELECTION_UPDATE_ENDPOINT = environment.APIEndpoint + '/api/Schematic/update';
  SCHEMATICDETAIL_ASSEMBLY_ENDPOINT = environment.APIEndpoint + '/api/Schematic/schematicAssemblies';
  SCHEMATICDETAIL_COMPONENTS_ENDPOINT = environment.APIEndpoint + '/api/Schematic/schematicComponents';
  SCHEMATICDETAIL_SAVE_ENDPOINT = environment.APIEndpoint + '/api/Schematic/saveSchematics';
  SCHEMATICMASTER_ENDPOINT = environment.APIEndpoint + '/api/Schematic/schematicMasterData';

  constructor(private http: HttpClient) { }

  private cachedSchData: { [key: string]: SchematicSelection[] } = {};
  private cachedSchTotals: number | null = null;
  private selectedSchematicSubject = new BehaviorSubject<any>(0);
  selectedSchematic$ = this.selectedSchematicSubject.asObservable();
  getSelectedSchematic(id:number){
    this.selectedSchematicSubject.next(id);
  }
  getSchematicSelections(pageNumber: number, pageSize: number, searchTerm?: string): Observable<SchematicSelection[]> {
    const cacheKey = `${pageNumber}-${pageSize}-${searchTerm || ''}`;

    if (this.cachedSchData[cacheKey]) {
      return of(this.cachedSchData[cacheKey]); // Return cached data if available
    }

    let url: string = `${this.SCHEMATICSELECTION_ENDPOINT}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (searchTerm) {
      url += `&searchTerm=${encodeURIComponent(searchTerm)}`; // Encode the search term
    }
    return this.http.get<SchematicSelection[]>(url).pipe(
      tap(data => {
        this.cachedSchData[cacheKey] = data; // Cache the response
      })
    );
  }

  getSchematicSelectionTotals(): Observable<number> {
    if (this.cachedSchTotals !== null) {
      return of(this.cachedSchTotals); // Return cached total if available
    }

    let url: string = this.SCHEMATICSELECTION_TOTAL_ENDPOINT;
    return this.http.get<number>(url).pipe(
      tap(total => {
        this.cachedSchTotals = total; // Cache the total records
      })
    );
  }

  getAllSchematicSelectionData(pageNumber: number, pageSize: number): Observable<SchematicSelection[]> {
    return this.getSchematicSelectionTotals().pipe(
      switchMap(totalRecords => {
        const totalPages = Math.ceil(totalRecords / pageSize);
        if (pageNumber > totalPages) {
          return of([]); // Return empty if page number exceeds total pages
        }
        return this.getSchematicSelections(pageNumber, pageSize);
      })
    );
  }

  getSchematicSelectionById(id: number): Observable<SchematicSelection> {
    let url: string = `${this.SCHEMATICSELECTION_BYID_ENDPOINT}/${id}`;
    return this.http.get<SchematicSelection>(url);
  }

  saveSchematicSelection(model: SchematicSelection): Observable<SchematicSelection> {
    let url: string = `${this.SCHEMATICSELECTION_SAVE_ENDPOINT}`;
    return this.http.post<SchematicSelection>(url, model);
  }

  updateSchematicSelection(id: number, model: SchematicSelection): Observable<SchematicSelection> {
    let url: string = `${this.SCHEMATICSELECTION_UPDATE_ENDPOINT}/${id}`;
    return this.http.post<SchematicSelection>(url, model);
  }

  getSchematicAssemblies(id: number, sectionid: number = -1): Observable<SchematicAssembly[]> {
    let url: string = `${this.SCHEMATICDETAIL_ASSEMBLY_ENDPOINT}/${id}/${sectionid}`;
    return this.http.get<SchematicAssembly[]>(url);
  }

  getSchematicComponents(schematicId: number, itemNumber: number = -1, sectionid: number = -1): Observable<SchematicAssembly[]> {
    let url: string = `${this.SCHEMATICDETAIL_COMPONENTS_ENDPOINT}/${schematicId}/${itemNumber}/${sectionid}`;
    return this.http.get<SchematicAssembly[]>(url);
  }

  saveSchematics(model: SchematicAssembly[]): Observable<SchematicAssembly[]> {
    let url: string = `${this.SCHEMATICDETAIL_SAVE_ENDPOINT}`;
    return this.http.post<SchematicAssembly[]>(url, model);
  }

  getSchematicMasterTable(schematicId: number, iValue: number = -1): Observable<SchematicMasterTable[]> {
    let url: string = `${this.SCHEMATICMASTER_ENDPOINT}/${schematicId}/${iValue}`;
    return this.http.get<SchematicMasterTable[]>(url);
  }
}
