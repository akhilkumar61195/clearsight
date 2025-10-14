import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WellheadComponent } from './wellhead.component';

describe('WellheadComponent', () => {
  let component: WellheadComponent;
  let fixture: ComponentFixture<WellheadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WellheadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WellheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
