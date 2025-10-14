import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MaterialGroup {
  id: number;
  description: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialGroupService {
  private apiUrl = `${environment.APIEndpoint}/materialgroup`;

  constructor(private http: HttpClient) { }

  getMaterialGroups(): Observable<MaterialGroup[]> {
    return this.http.get<MaterialGroup[]>(this.apiUrl);
  }
}