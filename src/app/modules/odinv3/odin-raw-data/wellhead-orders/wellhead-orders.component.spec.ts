import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WellheadOrdersComponent } from './wellhead-orders.component';

describe('WellheadOrdersComponent', () => {
  let component: WellheadOrdersComponent;
  let fixture: ComponentFixture<WellheadOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WellheadOrdersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WellheadOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
