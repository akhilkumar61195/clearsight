import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tyr2ToolbarComponent } from './tyr2-toolbar.component';

describe('Tyr2ToolbarComponent', () => {
  let component: Tyr2ToolbarComponent;
  let fixture: ComponentFixture<Tyr2ToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Tyr2ToolbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tyr2ToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
