import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinSapUnitCostComponent } from './odin-sap-unit-cost.component';

describe('OdinSapUnitCostComponent', () => {
  let component: OdinSapUnitCostComponent;
  let fixture: ComponentFixture<OdinSapUnitCostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinSapUnitCostComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinSapUnitCostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
