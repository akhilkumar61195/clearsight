// auth.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { routeLinks } from '../../common/enum/common-enum';
import { CommonService } from '../../services/common.service';
import StorageService from '../../services/storage.service';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {

    constructor(
        private authService: AuthService,
        private commonService:CommonService,
        private router: Router) { }

canActivate(
  next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

  // 1. Check if the user is authenticated
  if (!this.authService.isAuthenticated()) {
    return this.router.createUrlTree([routeLinks.login]);
  }

  // 2. Get user's allowed apps
  const userApps = StorageService.getUserPermission(); 

  // 3. Get the app name associated with the current route
  const routeApp = next.data['appName']; // e.g. 'SCHEMATIC'

  // 4. Check if the user has access to the current app
  if (routeApp && !userApps.some(app => app.permissionName.toLowerCase() === routeApp.toLowerCase())) {
    // User is authenticated but not authorized for this app
    return this.router.createUrlTree([routeLinks.appSelector]);
  }

  // 5. All checks passed
  return true;
}

}
