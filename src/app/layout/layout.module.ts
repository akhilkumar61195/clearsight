// import { CUSTOM_ELEMENTS_SCHEMA, NgModule, OnInit } from '@angular/core';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// // import { LayoutComponent } from './layout.component';
// import { ContentComponent, FooterComponent, HeaderComponent } from './layout-components';
// import { CommunicationService } from '../services/communication.service';
// import { BrowserModule } from '@angular/platform-browser';
// import { RouterModule } from '@angular/router';
// // import { SharedModule } from '../shared/shared.module';
// import { PrimeModule } from '../shared/prime.module';
// import { Actions } from '../common/constant';
// import { BreadcrumbComponent } from '../modules/breadcrumb/breadcrumb.component';
// import { TimeDifferencePipe } from './layout-components/header/time-difference.pipe';

// @NgModule({
//     declarations: [
//         // LayoutComponent,
//         FooterComponent,
//         TimeDifferencePipe,
        
//     ],
//     imports: [
//         // PrimeModule,
//         // SharedModule,
//         BrowserModule,
//         RouterModule,
//         FormsModule,
//         ReactiveFormsModule,
//         CommonModule
//     ],
//     schemas: [
//         CUSTOM_ELEMENTS_SCHEMA
//     ],
//     bootstrap: [LayoutModule],
//     providers: [LayoutModule]
// })
// export class LayoutModule implements OnInit {
//     subscription: any;
//     constructor(private commService: CommunicationService) { }

//     ngOnInit(): void {
//         this.subscription = this.commService.on(Actions.BREADCRUMB_CHANGE_PARENT).subscribe((data) => this.changeBreadcrumb(data));
//     }
//     changeBreadcrumb(data: any): void {
//         this.commService.publish(Actions.BREADCRUMB_CHANGE_CHILD, data);
//     }
// }
