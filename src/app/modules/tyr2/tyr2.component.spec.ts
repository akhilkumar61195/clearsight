import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tyr2Component } from './tyr2.component';

describe('Tyr2Component', () => {
  let component: Tyr2Component;
  let fixture: ComponentFixture<Tyr2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Tyr2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tyr2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
