import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinRigScheduleCompletionsComponent } from './odin-rig-schedule-completions.component';

describe('OdinRigScheduleCompletionsComponent', () => {
  let component: OdinRigScheduleCompletionsComponent;
  let fixture: ComponentFixture<OdinRigScheduleCompletionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinRigScheduleCompletionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinRigScheduleCompletionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
