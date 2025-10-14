import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloneSchematicDialogComponent } from './clone-schematic-dialog.component';

describe('CloneSchematicDialogComponent', () => {
  let component: CloneSchematicDialogComponent;
  let fixture: ComponentFixture<CloneSchematicDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CloneSchematicDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CloneSchematicDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
