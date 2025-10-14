import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerforationsTableDialogComponent } from './perforations-table-dialog.component';

describe('PerforationsTableDialogComponent', () => {
  let component: PerforationsTableDialogComponent;
  let fixture: ComponentFixture<PerforationsTableDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PerforationsTableDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PerforationsTableDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
