import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSelectorComponent } from './app-selector.component';

describe('AppSelectorComponent', () => {
  let component: AppSelectorComponent;
  let fixture: ComponentFixture<AppSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AppSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
