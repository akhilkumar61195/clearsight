/**
 * Service for handling RBW (Running/Backing/Waiting) operations
 * Provides CRUD operations for RBW data through HTTP requests
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RbwModel } from '../common/model/rbw.model';

@Injectable({
  providedIn: 'root'
})
export class RbwService {
  /** Base URL for RBW API endpoints */
  private baseUrl = environment.APIEndpoint + '/RBW';

  /**
   * Creates an instance of RbwService
   * @param http - Angular's HttpClient for making HTTP requests
   */
  constructor(private http: HttpClient) { }

  /**
   * Retrieves all RBW records
   * @returns An Observable of RbwModel array containing all RBW records
   */
  getRbw() {
    return this.http.get<Array<RbwModel>>(`${this.baseUrl}`);
  }

  /**
   * Creates a new RBW record
   * @param rbw - The RBW data to be created
   * @returns An Observable of the creation response
   */
  addRbw(rbw: RbwModel) {
    return this.http.post(`${this.baseUrl}`, rbw);
  }

  /**
   * Updates an existing RBW record
   * @param rbw - The RBW data to be updated, must include an id
   * @returns An Observable of the update response
   */
  updateRbw(rbw: RbwModel) {
    return this.http.put(`${this.baseUrl}/${rbw.id}`, rbw);
  }

  /**
   * Deletes an RBW record
   * @param rbwId - The ID of the RBW record to be deleted
   * @returns An Observable of the deletion response
   */
  deleteRbw(rbwId: number) {
    return this.http.delete(`${this.baseUrl}/${rbwId}`);
  }
}
