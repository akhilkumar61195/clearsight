import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletionsInteractiveComponent } from './completions-interactive.component';

describe('CompletionsComponent', () => {
  let component: CompletionsInteractiveComponent;
  let fixture: ComponentFixture<CompletionsInteractiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompletionsInteractiveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompletionsInteractiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
