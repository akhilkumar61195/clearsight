import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinRawDataComponent } from './odin-raw-data.component';

describe('OdinRawDataComponent', () => {
  let component: OdinRawDataComponent;
  let fixture: ComponentFixture<OdinRawDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinRawDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinRawDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
