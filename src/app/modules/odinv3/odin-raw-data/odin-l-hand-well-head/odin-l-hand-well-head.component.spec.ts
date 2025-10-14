import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinLHandWellHeadComponent } from './odin-l-hand-well-head.component';

describe('OdinLHandWellHeadComponent', () => {
  let component: OdinLHandWellHeadComponent;
  let fixture: ComponentFixture<OdinLHandWellHeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinLHandWellHeadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdinLHandWellHeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
