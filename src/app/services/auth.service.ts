import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { firstValueFrom, Observable } from 'rxjs';
import StorageService from './storage.service';
import { AuthorizedResult } from '../common/accessType';
import { AccessControls } from '../common/constant';
import { CommonService } from './common.service';
import { UserService } from './user.service';
import { UserApplicationPermission } from '../common/model/userApplicationPermission';



@Injectable({
  providedIn: 'root',
})
export class AuthService {
  setFeedbackIconAsVisible = new EventEmitter<boolean>();

  API_ENDPOINT = environment.APIEndpoint + '/api/Auth';
  constructor(private http: HttpClient, private commonService: CommonService,private userService:UserService) { }

  login(body: any): Observable<any> {
    const url: string = `${this.API_ENDPOINT}/LoginBiforst`;
    return this.http.post<any>(url, body);
  }

  isAuthenticated() {
    let token = StorageService.getAccessToken();
    if (token == null) return false;
    else {
      let tokenValues = StorageService.getDecodedTokenValues();
      const expTime: any = new Date(tokenValues.exp * 1000);
      const currentTime: any = new Date();
      let timeLeft = expTime - currentTime;
      return timeLeft > 0;
    }
  }

  getUserDetail() {
    return StorageService.getDecodedTokenValues();
  }

  isAuthorized(authType?: string, authAction?: string): AuthorizedResult[] {
  try {
    const personas = StorageService.getUserPersonaSettings();
    const personaArray = Array.isArray(personas) ? personas : [personas];
    const aCLPermissionTypes = personaArray.length > 0 ? JSON.parse(personaArray[0]) : null;

    if (aCLPermissionTypes) {
      return aCLPermissionTypes
        .map(app => {
          return app.accessControl
            .map(acl => {
              if (acl.accessType === authType) {
                return {
                  IsAuthorized: true,
                  RestrictedValue: "*",
                  filterValue: acl.filterValue,
                  accessFields: acl.accessFields,
                  accessAction: acl.accessAction
                };
              } else {
                return {
                  IsAuthorized: false,
                  RestrictedValue: "*",
                  filterValue: "",
                  accessFields: "",
                  accessAction: ""
                };
              }
            })
            .filter(result => result.IsAuthorized);
        })
        .flat();
    }
  } catch (error) {
    console.error('Authorization processing failed:', error);
  }

  return [];
}



  /**
   *  this method will make access field editable
   * @param fieldName 
   * @returns 
   */
  isFieldEditable(fieldName: string): boolean {

    let userDetail = this.commonService.getuserAccess();
    if (userDetail) {
      const hasAccess = userDetail.some(user => user.accessFields.includes(fieldName));
      
      return hasAccess;
    }

  }
  /**
   * getting filter value accroding to passed key and value
   * @param key 
   * @param value 
   * @returns 
   */
  checkFilterValue(key: string, value: string): boolean {
    const userDetail = this.commonService.getuserAccess();
    const normalizedValue = value?.trim().toLowerCase();
    if (userDetail) {
      return userDetail?.some(user => {
        const values = user.filterValue?.[key];
        return Array.isArray(values) && values.some(v => v.trim().toLowerCase() === normalizedValue);
      }) ?? false;
    }

  }

getApplicationPermissions(): UserApplicationPermission[]  {
  const decodedToken = StorageService.getDecodedTokenValues();
  return decodedToken?.permissions?.map((perm: string) => perm.toUpperCase()) ?? [];
}

getUserPermissions(userId: number): Observable<UserApplicationPermission[]>{
    let url = `${this.API_ENDPOINT}/GetUserPermissions?userId=${userId}`;
    return this.http.get<UserApplicationPermission[]>(url);
}
 
}

