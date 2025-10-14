import StorageService from "../services/storage.service";
import { MediaTypes, PersonaEnum } from "./enum/common-enum";
import fs from 'file-saver';

export const hasRole = (PermissionToCheck: PersonaEnum): boolean => {
  var permission = StorageService.getUserPermission();
  var hasPermission: boolean = false;
  if (permission) {
    hasPermission = (permission == PermissionToCheck);
    return hasPermission;
  } else {
    return false;
  }
}

export function currencyFormatter(amount: any) {
  var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  let formatText = formatter.format(amount);
  return formatText;
}

export function toPascalCase(o: any): any {
  var newO: any, origKey: any, newKey: any, value: any
  if (o instanceof Array) {
    return o.map(function (value) {
      if (typeof value === "object") {
        value = toPascalCase(value)
      }
      return value
    })
  } else {
    newO = {}
    for (origKey in o) {
      if (o.hasOwnProperty(origKey)) {
        newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString()
        value = o[origKey]
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toPascalCase(value)
        }
        newO[newKey] = value
      }
    }
  }
  return newO
}

export function downloadBase64File(base64: string, type: MediaTypes, fileName: string) {
  const byteStr = atob(base64);
  const arrayBuffer = new ArrayBuffer(byteStr.length);
  const int8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteStr.length; i++) {
    int8Array[i] = byteStr.charCodeAt(i);
  }
  const blob = new Blob([arrayBuffer], { type: type });
  fs.saveAs(blob, fileName);
  return blob;
}