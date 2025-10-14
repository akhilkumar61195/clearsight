import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinWhatIfDrillingComponent } from './odin-what-if-drilling.component';

describe('OdinWhatIfDrillingComponent', () => {
  let component: OdinWhatIfDrillingComponent;
  let fixture: ComponentFixture<OdinWhatIfDrillingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinWhatIfDrillingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinWhatIfDrillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
