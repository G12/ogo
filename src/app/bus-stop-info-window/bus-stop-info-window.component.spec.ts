/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BusStopInfoWindowComponent } from './bus-stop-info-window.component';

describe('BusStopInfoWindowComponent', () => {
  let component: BusStopInfoWindowComponent;
  let fixture: ComponentFixture<BusStopInfoWindowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BusStopInfoWindowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusStopInfoWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
