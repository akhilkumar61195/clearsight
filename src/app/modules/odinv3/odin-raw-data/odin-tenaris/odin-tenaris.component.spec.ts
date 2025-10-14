import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinTenarisComponent } from './odin-tenaris.component';

describe('OdinTenarisComponent', () => {
  let component: OdinTenarisComponent;
  let fixture: ComponentFixture<OdinTenarisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinTenarisComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinTenarisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
