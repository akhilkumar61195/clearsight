import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinDashboardComponent } from './odin-dashboard.component';

describe('OdinDashboardComponent', () => {
  let component: OdinDashboardComponent;
  let fixture: ComponentFixture<OdinDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
