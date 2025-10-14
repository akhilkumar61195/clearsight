import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChatComponent } from '../common/chat/chat.component';

@Component({
  selector: 'app-odin',
  standalone:true,
  imports:[RouterModule,ChatComponent],
  templateUrl: './odin.component.html',
  styleUrl: './odin.component.scss'
})
export class OdinV3Component {
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
}
