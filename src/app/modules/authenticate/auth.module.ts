import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login/login.component';
import { SharedModule } from '../../shared/shared.module';
import { PrimeModule } from '../../shared/prime.module';

@NgModule({
  declarations: [
    // AccessDeniedComponent,
    // NoRoleComponent,
    LoginComponent
  ],
  imports: [
    PrimeModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModule
  ],
  providers: [
  ]
})
export class AuthModule { }
