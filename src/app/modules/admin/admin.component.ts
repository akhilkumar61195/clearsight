// admin.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { ChatComponent } from '../common/chat/chat.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    // PrimeModule,
    ChatComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent {
  isChatEnabled: boolean = false;

  joinChat() {
    this.isChatEnabled = true;
  }

  onLeaveChat() {
    this.isChatEnabled = false;
  }
}
