import { ComponentFixture, TestBed } from '@angular/core/testing';

import {MdlDashboardComponent} from './mdl-dashboard.component'

describe('MdlDashboardComponent', () => {
  let component: MdlDashboardComponent;
  let fixture: ComponentFixture<MdlDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MdlDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MdlDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
