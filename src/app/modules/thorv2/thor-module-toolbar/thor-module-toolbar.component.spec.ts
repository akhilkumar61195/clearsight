import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThorModuleToolBarComponent } from './thor-module-toolbar.component';

describe('ThorModuleToolBarComponent', () => {
  let component: ThorModuleToolBarComponent;
  let fixture: ComponentFixture<ThorModuleToolBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThorModuleToolBarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThorModuleToolBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
