import { Component, OnInit } from '@angular/core';
import { PRIME_IMPORTS } from '../../../shared/prime-imports';

@Component({
  selector: 'app-admin-tab',
  standalone: true,
  imports: [...PRIME_IMPORTS],
  templateUrl: './admin-tab.component.html',
  styleUrls: ['./admin-tab.component.scss']
})
export class AdminTabComponent implements OnInit {
  adminMenu = [
    { label: 'User Admin', disabled: false, routerLink: '/admin/admin-module', target: '_self' },
    { label: 'Configuration', disabled: false, routerLink: '/admin/admin-list-editor', target: '_self' }
  ];
  activeItem: any = this.adminMenu[0];

  ngOnInit(): void {
    this.activeItem = this.adminMenu[0];
  }
}
