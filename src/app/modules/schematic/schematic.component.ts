import { Component } from '@angular/core';
import { ChatComponent } from '../common/chat/chat.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-schematic',
  standalone: true,
  imports: [ChatComponent, RouterModule],
  templateUrl: './schematic.component.html',
  styleUrl: './schematic.component.scss'
})
export class SchematicComponent  {
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
