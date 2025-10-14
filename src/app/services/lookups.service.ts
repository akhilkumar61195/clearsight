import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssemblyTypes } from '../common/model/assembly-types';
import { Sections } from '../common/model/sections';
import { CompletionDesign } from '../common/model/completion-design';
import { DesignTypes } from '../common/model/design-types';
import { ProjectsDto } from '../common/model/wells-dto';
import { WellInfo } from '../common/model/well-info';
import { Projects } from '../common/model/projects';
import { Applications } from '../common/model/applications';
import { FunctionsInfo } from '../common/model/functions';
import { WellTypesInfo } from '../common/model/wellTypes';
import { DocumentTypes } from '../common/model/document-types';
import { Componenttypes } from '../common/model/componenttypes';
import { Lookupdata } from '../common/model/lookupdata';
import { StatusType } from '../common/model/statusType';
import { Reason } from '../common/model/reason';
import { PlanningEnginner } from '../common/model/planningEngineer';
import { PlantCode } from '../common/model/plantCode';
import { MaterialType } from '../common/model/material-types';
import { ComponentGroups } from '../common/model/component-groups';
import { WellsByRig } from '../common/model/wells-by-rig';

@Injectable({
  providedIn: 'root'
})
export class LookupsService {

  ASSEMBLYTYPES_ENDPOINT = environment.APIEndpoint + '/api/Lookups/assemblyInfo';
  SECTIONS_ENDPOINT = environment.APIEndpoint + '/api/Lookups/sectionInfo';
  CD_ENDPOINT = environment.APIEndpoint + '/api/Lookups/completionDesign';
  DT_ENDPOINT = environment.APIEndpoint + '/api/Lookups/designTypes';
  WELLS_ENDPOINT = environment.APIEndpoint + '/api/Lookups/wellsByProject';
  WELLS_BYID_ENDPOINT = environment.APIEndpoint + '/api/Lookups/wellsById';
  PROJECTS_ENDPOINT = environment.APIEndpoint + '/api/Lookups/projects';
  APPLICATIONS_ENDPOINT = environment.APIEndpoint + '/api/Lookups/applications';
  FUNCTIONS_ENDPOINT = environment.APIEndpoint + '/api/Lookups/functions';
  WELLTYPES_ENDPOINT = environment.APIEndpoint + '/api/Lookups/wellTypes';
  DOC_ENTITIES_ENDPOINT = environment.APIEndpoint + '/api/Lookups/documentEntities';
  DOC_TYPES_ENDPOINT = environment.APIEndpoint + '/api/Lookups/documentTypes';
  COMPONENTS_ENDPOINT = environment.APIEndpoint + '/api/Lookups/components';
  LOOKUPDATAS_ENDPOINT = environment.APIEndpoint + '/api/Lookups/lookupData';
  REASON_ENDPOINT = environment.APIEndpoint + '/api/Lookups/reasons';
  STATUS_TYPE_ENDPOINT = environment.APIEndpoint + '/api/Lookups/statusTypes';
  PLANNINGENGINEER_ENDPOINT = environment.APIEndpoint + '/api/Lookups/planningEngineers';
  PLANTCODE_ENDPOINT = environment.APIEndpoint + '/api/Lookups/plantCode';
  DRILLING_MATERIAL_ENDPOINT = environment.APIEndpoint + '/api/Lookups/drillingMaterial';
  COMPLETION_MATERIAL_ENDPOINT = environment.APIEndpoint + '/api/Lookups/completionMaterial';
  COMPONENTGROUP_ENDPOINT = environment.APIEndpoint + '/api/Lookups/componentGroups';
  COMPONENTGROUP_SUPPLIER_ENDPOINT = environment.APIEndpoint + '/api/Lookups/componentGroupsBySupplier';
  WELLS_BYRIG_ENDPOINT = environment.APIEndpoint + '/api/Lookups/wellsByRig';
  LISTEDITOR_APPL_ENDPOINT = environment.APIEndpoint + '/api/Lookups/listEditorAppls';

  constructor(private http: HttpClient) { }

  getAsssemblyTypes(): Observable<AssemblyTypes[]> {
    let url = `${this.ASSEMBLYTYPES_ENDPOINT}`;
    return this.http.get<AssemblyTypes[]>(url);
  }

  getSections(isAll: boolean = false): Observable<Sections[]> {
    let url = `${this.SECTIONS_ENDPOINT}/${isAll}`;
    return this.http.get<Sections[]>(url);
  }

  getCompletionDesigns(): Observable<CompletionDesign[]> {
    let url = `${this.CD_ENDPOINT}`;
    return this.http.get<CompletionDesign[]>(url);
  }

  getDesignTypes(): Observable<DesignTypes[]> {
    let url = `${this.DT_ENDPOINT}`;
    return this.http.get<DesignTypes[]>(url);
  }

  getWellsByProject(appId: number = -1, functionId: number = -1, whatIf:boolean = false): Observable<ProjectsDto[]> {
    let url = `${this.WELLS_ENDPOINT}/${appId}/${functionId}/${whatIf}`;
    return this.http.get<ProjectsDto[]>(url);
  }

  getWellsById(id: number, appId: number, functionId: number): Observable<WellInfo[]> {
    let url = `${this.WELLS_BYID_ENDPOINT}/${id}/${appId}/${functionId}`;
    return this.http.get<WellInfo[]>(url);
  }

  getProjects(): Observable<Projects[]> {
    let url = `${this.PROJECTS_ENDPOINT}`;
    return this.http.get<Projects[]>(url);
  }

  getApplications(): Observable<Applications[]> {
    let url = `${this.APPLICATIONS_ENDPOINT}`;
    return this.http.get<Applications[]>(url);
  }

  getfunctions(): Observable<FunctionsInfo[]> {
    let url = `${this.FUNCTIONS_ENDPOINT}`;
    return this.http.get<FunctionsInfo[]>(url);
  }

  getWellTypes(): Observable<WellTypesInfo[]> {
    let url = `${this.WELLTYPES_ENDPOINT}`;
    return this.http.get<WellTypesInfo[]>(url);
  }

  getDocumentEntities(): Observable<string[]> {
    return this.http.get<string[]>(this.DOC_ENTITIES_ENDPOINT);
  }

  getDocumentTypes(entities: string): Observable<DocumentTypes[]> {
    return this.http.get<DocumentTypes[]>(`${this.DOC_TYPES_ENDPOINT}/${entities}`);
  }

  getComponentTypes(): Observable<Componenttypes[]> {
    let url = `${this.COMPONENTS_ENDPOINT}`;
    return this.http.get<Componenttypes[]>(url);
  }

  // Retrieves a list of component groups
  getComponentGroups(): Observable<ComponentGroups[]> {
    let url = `${this.COMPONENTGROUP_ENDPOINT}`;
    return this.http.get<ComponentGroups[]>(url);
  }

  //Retrieves a list of component groups based on the specified component type and supplier part number.
  getcomponentGroupsBySupplier(componentType: string = '', supplierPartNumber: string = ''): Observable<ComponentGroups[]> {
    const encodedComponentType = encodeURIComponent(componentType);
    const encodedSupplierPartNumber = encodeURIComponent(supplierPartNumber);

    let url = `${this.COMPONENTGROUP_SUPPLIER_ENDPOINT}/${encodedComponentType}/${encodedSupplierPartNumber}`;
    return this.http.get<ComponentGroups[]>(url);
  }

  getLookupData(lookupType: string): Observable<Lookupdata[]> {
    let url = `${this.LOOKUPDATAS_ENDPOINT}/${lookupType}`;
    return this.http.get<Lookupdata[]>(url);
  }

  getReasonTypes(): Observable<Reason[]> {
    let url = `${this.REASON_ENDPOINT}/SReject`;
  return this.http.get<Reason[]>(url);
  }

  getStatusTypes(): Observable<StatusType[]> {
    let url = `${this.STATUS_TYPE_ENDPOINT}`;
    return this.http.get<StatusType[]>(url);
  }

  getPlanningEngineer(): Observable<PlanningEnginner[]> {
    let url = `${this.PLANNINGENGINEER_ENDPOINT}`;
    return this.http.get<PlanningEnginner[]>(url);
  }

  getPlantCode(): Observable<PlantCode[]> {
    let url = `${this.PLANTCODE_ENDPOINT}`;
    return this.http.get<PlantCode[]>(url);
  }

  //it will get drilling id and material id 
  getDrillingMaterial(): Observable<MaterialType[]> {
    let url = `${this.DRILLING_MATERIAL_ENDPOINT}`;
    return this.http.get<MaterialType[]>(url);
  }

  //it will get completion id and material number
  getCompletionMaterial(): Observable<MaterialType[]> {
    let url = `${this.COMPLETION_MATERIAL_ENDPOINT}`;
    return this.http.get<MaterialType[]>(url);
  }

  // Retrieves wells grouped by rig based on appId and functionId
  getWellsByRig(appId: number = -1, functionId: number = -1): Observable<WellsByRig[]> {
    let url = `${this.WELLS_BYRIG_ENDPOINT}/${appId}/${functionId}`;
    return this.http.get<WellsByRig[]>(url);
  }

  // Retrieves a list of applications filtered by business unit ID.
  getListEditorApplications(buId: number = -1): Observable<Applications[]> {
    let url = `${this.LISTEDITOR_APPL_ENDPOINT}/${buId}`;
    return this.http.get<Applications[]>(url);
  }

}
