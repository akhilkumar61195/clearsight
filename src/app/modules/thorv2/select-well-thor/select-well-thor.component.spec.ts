import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectWellThorComponent } from './select-well-thor.component';

describe('SelectWellThorComponent', () => {
  let component: SelectWellThorComponent;
  let fixture: ComponentFixture<SelectWellThorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectWellThorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectWellThorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
