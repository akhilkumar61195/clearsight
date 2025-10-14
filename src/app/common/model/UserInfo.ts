export interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  personaId?:number;
  isInternalUser:boolean;
  primaryRole:number;
  applications:string[];
  applicationId:number[];

}

export interface CreateUser{
  id: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  password:string;
  userId:number;
//  personaId:number;
  //applicationId:number[];

}
export interface UpdatePersona{
  userId: number;
  personaId: number[];
  applicationIds:number[]; 
  loggedInUserId:number;
 
}
export interface UserPrimaryRole{
  userId: number;
  personaId: number; 
  fullName:String;
  personaDesc:String;
}
export interface CreatePersona{
  personaName: string;
  createdByUserId: number; 

}

export interface UserPersonaWithPermissionsDto{
  personaIds: number[];
  applicationIds: number[]; 

}