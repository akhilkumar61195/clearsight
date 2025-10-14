import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Thorv2Component } from './thorv2.component';

describe('Thorv2Component', () => {
  let component: Thorv2Component;
  let fixture: ComponentFixture<Thorv2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Thorv2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Thorv2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
