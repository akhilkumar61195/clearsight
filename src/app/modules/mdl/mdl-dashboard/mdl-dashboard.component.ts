import { Component, OnInit } from "@angular/core";
import { AccessControls } from "../../../common/constant";
import { AuthService } from "../../../services/auth.service";
import { CommonService } from "../../../services/common.service";
import { PRIME_IMPORTS } from "../../../shared/prime-imports";
import { AddEquipmentDialogComponent } from "../../common/addEquipmentDialog/addEquipmentDialog.component";
import { MdlCompletionComponent } from "./mdl-completion-interactive/mdl-completion.component";
import { ChatComponent } from "../../common/chat/chat.component";

@Component({
  selector: 'app-mdl-dashboard',
  standalone: true,
 imports: [...PRIME_IMPORTS, AddEquipmentDialogComponent, MdlCompletionComponent,ChatComponent],
  templateUrl: './mdl-dashboard.component.html',
  styleUrl: './mdl-dashboard.component.scss'
})
export class MdlDashboardComponent implements OnInit {

selectedView: number = 2;
isPageView :boolean=true;
showEquipmentAddDialog: boolean = true;
isEditableField: boolean = false; // To get the user access for editability
isListEditable: boolean = false; // To get the user access for editability

constructor(
  private commonService: CommonService,
  private authService: AuthService
) {}

viewOptionsButtons = [
  { label: 'Drilling', value: 1 },
  { label: 'Completion', value: 2 }
];
isChatEnabled: boolean = false; // Flag to control chat visibility
/**
 * Joins the chat
 */
joinChat() {
  this.isChatEnabled = true;
}

/**
 * Leaves the chat
 */
onLeaveChat() {
  this.isChatEnabled = false;
}

ngOnInit(): void {
  this.getUserDetails();        
}

    /**
     *  it will get the user details from jwt token
     */

     getUserDetails() {
        let userAccess = this.authService.isAuthorized(
          AccessControls.MDL_DRILLING_ACCESS
        );
        this.commonService.setuserAccess(userAccess);
        this.isEditableField = this.authService.isFieldEditable('isEditAddRecord');
        this.isListEditable = this.authService.isFieldEditable('IsAddDeleteListEditor');
      }

      onViewChange(selectedValue: number): void {
       if(selectedValue==1){
        this.isPageView=true;
        this.showEquipmentAddDialog=true;
       }
      }
}