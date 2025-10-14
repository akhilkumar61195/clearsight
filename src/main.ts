import { enableProdMode, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { DatePipe } from '@angular/common';

// Services
import { PwaService } from './app/services/pwa.service';
import { AuthService } from './app/services/auth.service';
import { CommunicationService } from './app/services/communication.service';
import { AuthGuard } from './app/modules/authenticate/auth-guard';
import { TokenInterceptor } from './app/common/interceptor/token-interceptor';

import 'ag-grid-enterprise';
import { routes } from './app/app-routing.module';
import { StoreModule } from '@ngrx/store';
import { odinAdvanceFilterReducer, thorAdvanceFilterReducer } from './app/common/ngrx-store';
import { provideMarkdown } from 'ngx-markdown';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),

    // Import Angular modules
    importProvidersFrom(
      HttpClientModule,
      RouterModule.forRoot(routes), 
      ToastModule,
      StoreModule.forRoot({
        readOdinAdvanceFilterData: odinAdvanceFilterReducer,
        readThorAdvanceFilterData: thorAdvanceFilterReducer
      }),      
      ConfirmDialogModule,
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: environment.production,
        registrationStrategy: 'registerWhenStable:30000'
      })
    ),

    // PrimeNG services
    MessageService,
    ConfirmationService,

    // Angular/common services
    DatePipe,

    // App-specific services
    PwaService,
    AuthService,
    CommunicationService,
    AuthGuard,
    provideMarkdown(),

    // HTTP interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ]
}).catch(err => console.error(err));
