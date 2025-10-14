import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractiveToolbarComponent } from './interactive-toolbar.component';

describe('InteractiveToolbarComponent', () => {
  let component: InteractiveToolbarComponent;
  let fixture: ComponentFixture<InteractiveToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InteractiveToolbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteractiveToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
