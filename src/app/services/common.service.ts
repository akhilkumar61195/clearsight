import { Injectable, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Completionschematicheader } from '../common/model/completionschematicheader';
import { ThorSelectedWells } from '../common/model/thor-selected-wells';
import { CompletionschematicService } from './completionschematic.service';
import { MessageService } from 'primeng/api';
import { ConfigurationValuesService } from './configuration-values.service';
import { ListEditorBuilderService } from '../modules/common/builders/list-editor-builder.service';
import { UserApplicationPermission } from '../common/model/userApplicationPermission';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  selectedRigAnalysisData: any = [];
  selectedWellNumber: number | null = null;
  private selectedWellNumberSubject = new BehaviorSubject<any>(0);
  selectedWellNumber$ = this.selectedWellNumberSubject.asObservable();
  private selectedSchemanticDataSubject = new BehaviorSubject<Completionschematicheader>(null);
  selectedSchemanticData$ = this.selectedSchemanticDataSubject.asObservable();
  private displaySidebarSubject = new BehaviorSubject<boolean>(true);
  display$ = this.displaySidebarSubject.asObservable();
  private searchTermSubject = new Subject<string>();
  private filterAppliedSubject = new Subject<void>();
  searchTerm$ = this.searchTermSubject.asObservable();
  filterApplied$ = this.filterAppliedSubject.asObservable();
  private functionIdSubject = new BehaviorSubject<number | null>(null);
  functionId$ = this.functionIdSubject.asObservable();
  thorCompetionUpdateData: any = [];
  selectedFunction: number | null = null;
  private wellDetailsFilterDataSubject = new BehaviorSubject<any>(null);
  wellDetailsFilterData$ = this.wellDetailsFilterDataSubject.asObservable();
  private schemanticIdSubject = new BehaviorSubject<number | null>(null);
  private cancelClickedSubject = new BehaviorSubject<boolean>(false);
  private refreshSelectWellSubject = new Subject<void>(); // refreshSelectWellSubject //
  refreshSelectWell$ = this.refreshSelectWellSubject.asObservable(); //refreshSelectWellSubject observable //
  private resetSubject = new Subject<void>();
  private saveSubject = new Subject<void>();
  reset$ = this.resetSubject.asObservable();
  save$ = this.saveSubject.asObservable();
  private thorWellDetails = new BehaviorSubject<ThorSelectedWells>({
    wellId: 0,
    wellNumber: 0,
    wellName: null,
    appId: 0,
    functionId: 0
  });
  thorSelectedWellObject$ = this.thorWellDetails.asObservable();
  addedData: any[] = []; // Store added data
  editedRowsData: any[] = []; // Store edited data
  
  editedRowsSchemanticData: any=''; // Store edited data
  addedRowsSchemanticData: any='';
  landingSchemanticData: any='';
  editedRowsAssemblyData: any[] = [];
  addedRowsAssemblyData:any[] =[];
  wellHeadersData: any;
  userAccessData:any;
  loggedInUserPermissionSignal: WritableSignal<UserApplicationPermission[]> = signal<UserApplicationPermission[]>([]); // defining signal for logged in user application permission
  constructor(private completionschematicService: CompletionschematicService,private messageService: MessageService, private configurationValuesService: ConfigurationValuesService,
    private listEditorBuilderService: ListEditorBuilderService
  ) { }

  setThorSelectedWell(obj: ThorSelectedWells): void {
    const newWell = { ...obj };  
    this.thorWellDetails.next(newWell);
  }
  
  getThorSelectedWell(): ThorSelectedWells | null {
    return this.thorWellDetails.getValue();
  }
  getInitials(value: any) {
    return value.slice(0, 2);
  }

  setRigAnalysisData(data: any) {
    this.selectedRigAnalysisData = data;
  }

  getRigAnalysisData() {
    return this.selectedRigAnalysisData;
  }

  getSelectedWellNumber(id: number) {
    this.selectedWellNumberSubject.next(id);
  }

  setWellDetailsFilterData(data: any) {
    this.thorCompetionUpdateData = data;
    this.wellDetailsFilterDataSubject.next(data);  // Emit new data for subscribers

  }

  getWellDetailsFilterData() {
    // return this.thorCompetionUpdateData;
    return this.wellDetailsFilterDataSubject.getValue();

  }

  clearSelectedWellNumber() {
    this.selectedWellNumberSubject.next(null);
  }

  getSelectedFunction() {
    return this.selectedFunction;
  }

  setSelectedFunction(id: number) {
    return this.selectedFunction = id;
  }

  setSelectedSchemanticData(data: Completionschematicheader) {
    this.selectedSchemanticDataSubject.next(data);
  }

  getSelectedSchemanticData() {
    return this.selectedSchemanticData$;
  }
  openSidebar() {
    this.displaySidebarSubject.next(true);
  }

  closeSidebar() {
    this.displaySidebarSubject.next(false);
  }

  updateSearchTerm(searchTerm: string) {
    this.searchTermSubject.next(searchTerm);
  }

  applyFilter() {
    this.filterAppliedSubject.next();
  }

  setFunctionIdThor(functionId: number) {
    this.functionIdSubject.next(functionId);
  }

  getFunctionIdThor() {
    return this.functionIdSubject.getValue();
  }
  setSchemanticId(id: number): void {
    this.schemanticIdSubject.next(id);
  }

  getSchemanticId(): number | null {
    return this.schemanticIdSubject.getValue();
  }

  hasUnsavedChanges(): boolean {
    return this.addedData.length > 0 || this.editedRowsData.length > 0;
  }
  hasUnsavedChangesSchemantic(): boolean {
    return this.editedRowsSchemanticData || this.addedRowsSchemanticData;
  }
  cancelClicked() {
    this.cancelClickedSubject.next(true);  // Notify that cancel was clicked
  }
  // Reset cancel signal
  resetCancelSignal() {
    this.cancelClickedSubject.next(false);
  }
  getCancelClickedObservable() {
    return this.cancelClickedSubject.asObservable();
  }

  setEditedRowsData(data: any[]) {
    this.editedRowsAssemblyData = data;
  }

  getEditedRowsData() {
    return this.editedRowsAssemblyData;
  }
  setAddedRowsData(data: any[]) {
    this.addedRowsAssemblyData = data;
  }
  
  getAddedRowsData() {
    return this.addedRowsAssemblyData;
  }
  setEditedSchemanticRow(data: any) {
    this.landingSchemanticData = data;
  }

  getEditedSchemanticRow() {
    return this.landingSchemanticData;
  }
  setWellHeadersRowsData(data: any) {
    this.wellHeadersData = data;
  }

  getWellHeadersData() {
    return this.wellHeadersData;
  }
 // update status of schematic as in-progree if there is any changes on perforaton table
 changeStatus(model: Completionschematicheader): void {
  if (model) {
   
    const payload = model; // Prepare the payload
    this.completionschematicService.updateStatusSchematicSelection(payload).subscribe({
      next: (response) => {
      
 
      },
      error: (wellError) => {
        
        this.messageService.add({ severity: 'error', summary: 'Error', detail: wellError });
        
      }
    });

  }
}
// common service to refresh the select well in thor //
  triggerRefreshSelectWell() {
    this.refreshSelectWellSubject.next();
  }
  /**
   * 
   * @returns it will get the useraccess
   */
  getuserAccess() {
    return this.userAccessData;
  }
  setuserAccess(data: any) {
    this.userAccessData = data;
  }
  triggerReset() {
    this.resetSubject.next();
  }
  triggerSave() {
    this.saveSubject.next();
  }
  // Get room name by application ID
  getRoomNameByAppId(appId: number): string {
  const appMap: { [key: number]: string } = {
    1: 'ODIN',
    2: 'THOR',
    3: 'TYR',
    4: 'COMPLETION SCHEMATIC'
  };
  return appMap[appId] || 'Unknown';
}

}
