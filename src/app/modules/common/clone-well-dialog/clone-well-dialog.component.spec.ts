import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloneWellDialogComponent } from './clone-well-dialog.component';

describe('CloneWellDialogComponent', () => {
  let component: CloneWellDialogComponent;
  let fixture: ComponentFixture<CloneWellDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CloneWellDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CloneWellDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
