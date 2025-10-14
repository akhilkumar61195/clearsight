import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinCompletionDdlComponent } from './odin-completion-ddl.component';

describe('OdinCompletionDdlComponent', () => {
  let component: OdinCompletionDdlComponent;
  let fixture: ComponentFixture<OdinCompletionDdlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinCompletionDdlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OdinCompletionDdlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
