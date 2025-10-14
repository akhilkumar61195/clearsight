export interface AccessControl {
  accessType: string;
  accessFields: string;
  filterValue: object;
  accessAction: string;
}

export interface Application {
  APPLICATIONNAME: string;
  accessControl: AccessControl[];
}

export interface AuthorizedResult {
  IsAuthorized: boolean;
  RestrictedValue: string;
  filterValue: string;
  accessFields: string;
  accessAction:string;
}
