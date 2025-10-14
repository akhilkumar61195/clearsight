import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinRigScheduleDrillingComponent } from './odin-rig-schedule-drilling.component';

describe('OdinRigScheduleDrillingComponent', () => {
  let component: OdinRigScheduleDrillingComponent;
  let fixture: ComponentFixture<OdinRigScheduleDrillingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinRigScheduleDrillingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinRigScheduleDrillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
