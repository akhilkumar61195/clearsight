import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinDdlComponent } from './odin-ddl.component';

describe('OdinDdlComponent', () => {
  let component: OdinDdlComponent;
  let fixture: ComponentFixture<OdinDdlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinDdlComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinDdlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
