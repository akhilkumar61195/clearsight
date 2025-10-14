import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinWellSelectorComponent } from './odin-well-selector.component';

describe('OdinWellSelectorComponent', () => {
  let component: OdinWellSelectorComponent;
  let fixture: ComponentFixture<OdinWellSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinWellSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinWellSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
