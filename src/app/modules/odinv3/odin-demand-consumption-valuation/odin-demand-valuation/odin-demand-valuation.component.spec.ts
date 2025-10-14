import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinDemandValuationComponent } from './odin-demand-valuation.component';

describe('OdinDemandValuationComponent', () => {
  let component: OdinDemandValuationComponent;
  let fixture: ComponentFixture<OdinDemandValuationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinDemandValuationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinDemandValuationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
