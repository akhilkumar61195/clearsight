import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tyr2DrillingComponent } from './tyr2-drilling.component';

describe('Tyr2DrillingComponent', () => {
  let component: Tyr2DrillingComponent;
  let fixture: ComponentFixture<Tyr2DrillingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Tyr2DrillingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tyr2DrillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
