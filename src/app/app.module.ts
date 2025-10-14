// import { NgModule, isDevMode } from '@angular/core';
// import { BrowserModule } from '@angular/platform-browser';
// import { AppRoutingModule } from './app-routing.module';
// import { AppComponent } from './app.component';
// import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
// import { ServiceWorkerModule } from '@angular/service-worker';
// import { StoreModule } from '@ngrx/store';
// import { AgGridModule } from 'ag-grid-angular';
// import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
// import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
// import { MasterDetailModule } from '@ag-grid-enterprise/master-detail';
// import { MultiFilterModule } from '@ag-grid-enterprise/multi-filter';
// import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
// import { ModuleRegistry } from '@ag-grid-community/core';

// import { PwaService } from './services/pwa.service';
// import { AuthService } from './services/auth.service';
// import { CommunicationService } from './services/communication.service';
// import { TokenInterceptor } from './common/interceptor/token-interceptor';
// import { AuthGuard } from './modules/authenticate/auth-guard';
// import { DatePipe } from '@angular/common';
// import { odinAdvanceFilterReducer, thorAdvanceFilterReducer } from './common/ngrx-store';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// // ✅ Register ag-grid modules globally
// ModuleRegistry.registerModules([
//   ClientSideRowModelModule,
//   ExcelExportModule,
//   MasterDetailModule,
//   MultiFilterModule,
//   SetFilterModule,
// ]);

// @NgModule({
//   declarations: [], // only root component
//   imports: [
//     BrowserModule,
//     BrowserAnimationsModule,
//     HttpClientModule,
//     AppRoutingModule,
//     AgGridModule,
//     StoreModule.forRoot({
//       readOdinAdvanceFilterData: odinAdvanceFilterReducer,
//       readThorAdvanceFilterData: thorAdvanceFilterReducer
//     }),
//     ServiceWorkerModule.register('ngsw-worker.js', {
//       enabled: !isDevMode(),
//       registrationStrategy: 'registerWhenStable:30000'
//     }),
//   ],
//   providers: [
//     PwaService,
//     AuthService,
//     CommunicationService,
//     DatePipe,
//     AuthGuard,
//     {
//       provide: HTTP_INTERCEPTORS,
//       useClass: TokenInterceptor,
//       multi: true
//     },
//   ],
//   bootstrap: [],
// })
// export class AppModule {}
