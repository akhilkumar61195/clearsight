import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  API_ENDPOINT = environment.APIEndpoint + '/Supplier';

  constructor(private http: HttpClient) { }

  getSupplier() {
    const url: string = `${this.API_ENDPOINT}`;
    return this.http.get<any>(url);
  }
  addSupplier(body: any) {
    const url: string = `${this.API_ENDPOINT}`;
    return this.http.post<any>(url, body);
  }
}
