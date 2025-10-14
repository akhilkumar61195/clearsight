import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { convertJsonToHttpParams } from '../common/general-methods';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CreatePersona, CreateUser, UpdatePersona, UserInfo, UserPersonaWithPermissionsDto, UserPrimaryRole } from '../common/model/UserInfo';
import { PersonaInfo } from '../common/model/personaInfo';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  USERSAPI_ENDPOINT = environment.APIEndpoint + '/User';

  constructor(private http: HttpClient) { }


  getUsersList(): Observable<UserInfo[]> {
    return this.http.get<UserInfo[]>(`${this.USERSAPI_ENDPOINT}`);
  }
  getUserPersonasList(): Observable<UserInfo[]> {
    return this.http.get<UserInfo[]>(`${this.USERSAPI_ENDPOINT}/userPersona`);
  }
  getPersonasList(): Observable<PersonaInfo[]> {
    return this.http.get<PersonaInfo[]>(`${this.USERSAPI_ENDPOINT}/getAllPersona`);
  }
  getUserPersonasSetting(userId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.USERSAPI_ENDPOINT}/GetUserPersona?userId=${userId}`);
  }
  createOrUpdateUser(user: CreateUser): Observable<CreateUser> {
    return this.http.post<CreateUser>(`${this.USERSAPI_ENDPOINT}/CreateUser`, user);
  }
  getUserPersonasIds(userId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.USERSAPI_ENDPOINT}/GetPersonaId?userId=${userId}`);
  }
  updateUserPersona(user: UpdatePersona): Observable<UpdatePersona> {
    return this.http.post<UpdatePersona>(`${this.USERSAPI_ENDPOINT}/UpdateUserPersona`, user);
  }
  getUserPrimaryRole(primaryRole: string): Observable<UserPrimaryRole[]> {
    return this.http.get<UserPrimaryRole[]>(`${this.USERSAPI_ENDPOINT}/GetUserByPrimaryRole?primaryRole=${primaryRole}`);
  }
  createrPersona(personaDto: CreatePersona): Observable<CreatePersona> {
    return this.http.post<CreatePersona>(`${this.USERSAPI_ENDPOINT}/CreatePersona`, personaDto);
  }
 
  deleteUser(userId:number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.USERSAPI_ENDPOINT}/${userId}`);
  }

    getPersonaWithPermission(userId: number): Observable<UserPersonaWithPermissionsDto> {
    return this.http.get<UserPersonaWithPermissionsDto>(`${this.USERSAPI_ENDPOINT}/GetPersonaWithPermission?userId=${userId}`);
  }
}
