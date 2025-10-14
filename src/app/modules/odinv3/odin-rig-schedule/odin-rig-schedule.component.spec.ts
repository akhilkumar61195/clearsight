import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinRigScheduleComponent } from './odin-rig-schedule.component';

describe('OdinRigScheduleComponent', () => {
  let component: OdinRigScheduleComponent;
  let fixture: ComponentFixture<OdinRigScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinRigScheduleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinRigScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
