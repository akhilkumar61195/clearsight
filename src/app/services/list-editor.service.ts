import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListEditorService {

   LISTEDITOR_ENDPOINT = environment.APIEndpoint + '/ListEditor';
  

  constructor(private http: HttpClient) { }

  // list-editor service call
  deleteMultipleListEditorItems(entityType: string, ids: number[]): Observable<any> {
    return this.http.delete(`${this.LISTEDITOR_ENDPOINT}/${entityType}`,{body:ids});
  }
}
