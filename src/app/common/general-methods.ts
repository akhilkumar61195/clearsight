import { HttpParams } from "@angular/common/http";
import StorageService from "../services/storage.service";
import { UserRoleEnum } from "./enum/common-enum";

export const hasRole = (
  permissionList: { permissionId: number; permissionName: string }[],
  PermissionToCheck: UserRoleEnum
): boolean => {
  if (permissionList && permissionList.length > 0) {
    return permissionList.some(permission =>
      (permission.permissionName ?? '').toLowerCase() === (PermissionToCheck ?? '').toLowerCase()
    );
  }
  return false;
};


export function consoleLogErrorMessage(resp: any) {
  if (resp)
    console.log((resp?.message || resp));
}

//this method can convert any key value object into query string
export function convertJsonToHttpParams(body: any): HttpParams {
  let params = new HttpParams();
  if (body) {
    const keys = Object.keys(body);
    for (let i = 0; i < keys.length; i++) {
      params = params.set(keys[i], body[keys[i]]);
    }
  }
  return params;
}