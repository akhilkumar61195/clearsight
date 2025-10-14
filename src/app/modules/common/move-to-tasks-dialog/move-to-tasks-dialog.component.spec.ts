import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveToTasksDialogComponent } from './move-to-tasks-dialog.component';

describe('MoveToTasksDialogComponent', () => {
  let component: MoveToTasksDialogComponent;
  let fixture: ComponentFixture<MoveToTasksDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveToTasksDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoveToTasksDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
