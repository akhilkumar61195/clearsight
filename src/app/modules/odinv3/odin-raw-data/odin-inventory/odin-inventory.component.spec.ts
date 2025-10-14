import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinInventoryComponent } from './odin-inventory.component';

describe('OdinInventoryComponent', () => {
  let component: OdinInventoryComponent;
  let fixture: ComponentFixture<OdinInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinInventoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
