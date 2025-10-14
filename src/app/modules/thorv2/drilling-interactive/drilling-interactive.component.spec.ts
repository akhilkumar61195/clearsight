import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrillingInteractiveComponent } from './drilling-interactive.component';

describe('DrillingInteractiveComponent', () => {
  let component: DrillingInteractiveComponent;
  let fixture: ComponentFixture<DrillingInteractiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DrillingInteractiveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DrillingInteractiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
