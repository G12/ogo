/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BusStopsComponent } from './bus-stops.component';

describe('BusStopsComponent', () => {
  let component: BusStopsComponent;
  let fixture: ComponentFixture<BusStopsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BusStopsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusStopsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
