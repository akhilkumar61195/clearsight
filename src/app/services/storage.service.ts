import Cookies, { CookieSetOptions } from 'universal-cookie';
import { jwtDecode } from 'jwt-decode';
import { AuthenticationSession } from '../common/enum/common-enum';
import { toPascalCase } from '../common/common-methods';

class StorageService {
  /* istanbul ignore next */
  public static getAccessToken(): string {
    const token = localStorage.getItem(AuthenticationSession.TOKEN);
    return token || null;
  }

  /* istanbul ignore next */
  public static get(key: string): any {
    return localStorage.getItem(key);
  }

  /* istanbul ignore next */
  public static set(key: string, value: any, options?: CookieSetOptions) {
    if (key === AuthenticationSession.TOKEN) {
      const cookieChangeChannel = new BroadcastChannel("COOKIE_CHANGED");
      cookieChangeChannel.onmessage = (event) => {
        document.location.reload();
      };
      cookieChangeChannel.postMessage("Send cookie update event");
    }
    localStorage.setItem(key, value);
  }

  /* istanbul ignore next */
  public static remove(key: string) {
    return localStorage.removeItem(key);
  }

  public static removeLocalStorage(key: string) {
    localStorage.removeItem(key);
  }

  private static cookie: Cookies = new Cookies();

  public static getDecodedTokenValues() {
    const token = this.getAccessToken();

    if (!token) {
      return [];
    }
    const decodedToken = jwtDecode(token);

    const sessionData = toPascalCase(decodedToken);

    if (sessionData.applicationPermission) {
      sessionData.permissions = JSON.parse(sessionData.applicationPermission).map((data: any) => data.PERMISSIONNAME);
    }
    if (sessionData.aCLPermissionTypes) {
      sessionData.aCLPermissionTypes = JSON.parse(sessionData.aCLPermissionTypes);

    }
 
    return sessionData;
  }


  public static getUserPermission() {
    const userPermissions = localStorage.getItem(AuthenticationSession.LOGGEDINUSER_APPLICATION_PERSMISSION ?? '[]');
    
     return userPermissions ? JSON.parse(userPermissions) : [];
    
  }
  public static getUserPersonaSettings() {
    const userPerosnaSettings = localStorage.getItem(AuthenticationSession.PERSONA_SETTING ?? '[]');

    if (!userPerosnaSettings) {
      return [];
    }
    
    return userPerosnaSettings;
  }
}

export default StorageService;
