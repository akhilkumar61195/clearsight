import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinConsumptionValuationComponent } from './odin-consumption-valuation.component';

describe('OdinConsumptionValuationComponent', () => {
  let component: OdinConsumptionValuationComponent;
  let fixture: ComponentFixture<OdinConsumptionValuationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinConsumptionValuationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinConsumptionValuationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
