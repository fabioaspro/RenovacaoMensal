import { TestBed } from '@angular/core/testing';

import { ServerTotvsService } from './server-totvs.service';

describe('ServerTotvsService', () => {
  let service: ServerTotvsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerTotvsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
