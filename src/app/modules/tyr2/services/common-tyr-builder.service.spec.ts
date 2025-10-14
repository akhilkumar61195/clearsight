import { TestBed } from '@angular/core/testing';

import { CommonTyrBuilderService } from './common-tyr-builder.service';

describe('CommonTyrBuilderService', () => {
  let service: CommonTyrBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonTyrBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
