import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tyr2Component } from './tyr2.component';
import { AuthGuard } from '../authenticate/auth-guard';

const routes: Routes = [
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Tyr2RoutingModule { }
