import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewWellheadersComponent } from './view-wellheaders.component';

describe('ViewWellheadersComponent', () => {
  let component: ViewWellheadersComponent;
  let fixture: ComponentFixture<ViewWellheadersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewWellheadersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewWellheadersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
