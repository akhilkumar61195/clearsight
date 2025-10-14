import { TestBed } from '@angular/core/testing';

import { SelectedWellBuilderService } from './selected-well-builder.service';

describe('SelectedWellBuilderService', () => {
  let service: SelectedWellBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectedWellBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
