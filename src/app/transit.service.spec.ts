/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TransitService } from './transit.service';

describe('Service: Transit', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransitService]
    });
  });

  it('should ...', inject([TransitService], (service: TransitService) => {
    expect(service).toBeTruthy();
  }));
});
