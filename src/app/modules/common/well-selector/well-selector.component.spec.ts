import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WellSelectorComponent } from './well-selector.component';

describe('WellSelectorComponent', () => {
  let component: WellSelectorComponent;
  let fixture: ComponentFixture<WellSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WellSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WellSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
