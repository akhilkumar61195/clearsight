import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { OdinTabComponent } from '../odin-tab/odin-tab.component';
import { OdinCommonService } from '../services/odin-common.service';

@Component({
  selector: 'app-odin-rig-schedule',
  standalone:true,
  imports:[OdinTabComponent,
    RouterModule
  ],
  templateUrl: './odin-rig-schedule.component.html',
  styleUrl: './odin-rig-schedule.component.scss'
})
export class OdinRigScheduleComponent implements OnInit, OnDestroy{

  selectedView: number = 1;
  currentBreakpoint: string = '';
  Breakpoints = Breakpoints;
readonly breakpoint$ = this.breakpointObserver
    .observe([
      Breakpoints.Large,
      Breakpoints.Medium,
      Breakpoints.Small,
      '(min-width: 500px)',
    ])
    .pipe(distinctUntilChanged());

    // Subscription to manage API call subscriptions and prevent memory leaks
    private odinSubscription: Subscription = new Subscription();


constructor(private breakpointObserver: BreakpointObserver,private odinCommonService:OdinCommonService){
  
}

  // Unsubscribe from all subscriptions to prevent memory leaks
  ngOnDestroy(): void {
   this.odinSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.odinSubscription = this.odinCommonService.currentRecord.subscribe((functionId) => {
      if (functionId) {
       this.selectedView=functionId;
      }
      
    });
  }
}
