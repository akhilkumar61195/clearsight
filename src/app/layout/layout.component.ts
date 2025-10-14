import { DOCUMENT } from "@angular/common";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { UserRoleEnum, routeLinks } from "../common/enum/common-enum";
import { hasRole } from "../common/general-methods";
import { DropdownNavigatorComponent } from "../modules/dropdown-navigator/dropdown-navigator.component";
import { PRIME_IMPORTS } from "../shared/prime-imports";
import { ContentComponent } from "./layout-components/content/content.component";
import { BreadcrumbComponent } from "../modules/breadcrumb/breadcrumb.component";
import { HeaderComponent } from "./layout-components/header/header.component";
import { CommonService } from "../services/common.service";
import { UserApplicationPermission } from "../common/model/userApplicationPermission";
import StorageService from "../services/storage.service";
@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [...PRIME_IMPORTS,ContentComponent,HeaderComponent],
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
    dialogRefBid: any;
    sessionData: any;
    isInProgress: boolean = false;
    permissionSignal: UserApplicationPermission[];
    constructor(
        private router: Router,
        @Inject(DOCUMENT) readonly document: Document,private commonService:CommonService) {
        this.permissionSignal=StorageService.getUserPermission();;
            if (router.url == "/") {
            if (hasRole(this.permissionSignal,UserRoleEnum.Odin))
                this.router.navigate([routeLinks.odinDashboard]);
            else if (hasRole(this.permissionSignal,UserRoleEnum.Thor))
                this.router.navigate([routeLinks.thorDashboard]);
            // else if (hasRole(UserRoleEnum.Thor2))
            //     this.router.navigate([routeLinks.thor2Dashboard]);
            else if (hasRole(this.permissionSignal,UserRoleEnum.TYR))
                this.router.navigate([routeLinks.tyrDashboard]);
            else if (hasRole(this.permissionSignal,UserRoleEnum.Mdl))
              this.router.navigate([routeLinks.mdlDashboard]);
        }
    }
    ngOnDestroy(): void {

    }
    ngOnInit(): void {
    }

    async logout() {
        this.deleteAllCookies();
        window.location.href = '';
    }

    deleteAllCookies() {
        localStorage.clear();
        var cookies = this.document.cookie.split(";");

        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf("=");
            var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            this.document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    }
}
