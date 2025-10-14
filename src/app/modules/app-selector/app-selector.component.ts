import { Component, OnInit } from '@angular/core';
import { hasRole } from '../../common/general-methods';
import { UserRoleEnum } from '../../common/enum/common-enum';
import { AdvanceFilterModel } from '../../common/model/AdvanceFilterModel';
import { IOdinFilterPayloadStore, OdinAdvanceFilterAction, OdinAdvanceFilterActionType, READ_ODIN_ADVANCE_FILTER_ACTION_TYPE } from '../../common/ngrx-store';
import { Store } from '@ngrx/store';
import { CommonService } from '../../services/common.service';
import { Subscription } from 'rxjs';
import { PRIME_IMPORTS } from '../../shared/prime-imports';
import { UserApplicationPermission } from '../../common/model/userApplicationPermission';
import StorageService from '../../services/storage.service';

@Component({
  selector: 'app-app-selector',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './app-selector.component.html',
  styleUrl: './app-selector.component.scss'
})
export class AppSelectorComponent implements OnInit {
  hasOdinAccess: boolean = false;
  hasThorAccess: boolean = false;
  hasTYRAccess: boolean = false;
  hasMdlAccess: boolean = false;
  hasSchematicAccess: boolean = false;
  hasAdminAccess: boolean = false;
  wellSubscription: Subscription;
  routeSubscription: Subscription;
  permissionSignal: UserApplicationPermission[];
  

  constructor(
    private commonService:CommonService,
   private odinStore: Store<{ odinAdvanceFilterData: IOdinFilterPayloadStore }>
  ){

  }
  ngOnInit() {
    localStorage.removeItem('breadcrumbs');
    document.querySelector("body").classList.add("as-bg");
    this.permissionSignal= StorageService.getUserPermission();
    this.hasOdinAccess = hasRole(this.permissionSignal, UserRoleEnum.Odin);
    this.hasThorAccess = hasRole(this.permissionSignal, UserRoleEnum.Thor);
    this.hasTYRAccess = hasRole(this.permissionSignal, UserRoleEnum.TYR);
    this.hasMdlAccess = hasRole(this.permissionSignal, UserRoleEnum.Mdl);
    this.hasSchematicAccess = hasRole(this.permissionSignal, UserRoleEnum.Schematic);
    this.hasAdminAccess = hasRole(this.permissionSignal, UserRoleEnum.Admin);
    
  }
  
  resetOdinState() {
    const advanceFilter = new AdvanceFilterModel();
    advanceFilter.projects = [];
    advanceFilter.functions = 1;
    advanceFilter.timeline = "";
    advanceFilter.wells = [];
    let reducerObject: any;
    reducerObject = new OdinAdvanceFilterAction(null);
    reducerObject.payload = JSON.parse(JSON.stringify(advanceFilter));
    reducerObject.type = READ_ODIN_ADVANCE_FILTER_ACTION_TYPE as OdinAdvanceFilterActionType;
    reducerObject.payload['reset'] = true
    this.odinStore.dispatch(reducerObject);
  }
  resetThor2State(){
    this.commonService.clearSelectedWellNumber();
     if (this.wellSubscription) {
      this.wellSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }

  }
  ngOnDestroy() {
    let element = document.querySelector("body");
    if (element && element.classList) {
      document.querySelector("body").classList.remove("as-bg");
    }
  }
}
