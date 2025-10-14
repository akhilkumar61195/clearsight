import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinYardInventoryComponent } from './odin-yard-inventory.component';

describe('OdinYardInventoryComponent', () => {
  let component: OdinYardInventoryComponent;
  let fixture: ComponentFixture<OdinYardInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinYardInventoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OdinYardInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
