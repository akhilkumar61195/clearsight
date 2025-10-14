import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinGroupedInventoryComponent } from './odin-grouped-inventory.component';

describe('OdinGroupedInventoryComponent', () => {
  let component: OdinGroupedInventoryComponent;
  let fixture: ComponentFixture<OdinGroupedInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinGroupedInventoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinGroupedInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
