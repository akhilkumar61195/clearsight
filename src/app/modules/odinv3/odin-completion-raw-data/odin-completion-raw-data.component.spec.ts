import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdinCompletionRawDataComponent } from './odin-completion-raw-data.component';

describe('OdinCompletionRawDataComponent', () => {
  let component: OdinCompletionRawDataComponent;
  let fixture: ComponentFixture<OdinCompletionRawDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OdinCompletionRawDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OdinCompletionRawDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
