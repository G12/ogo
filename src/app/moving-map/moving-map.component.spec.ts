/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MovingMapComponent } from './moving-map.component';

describe('MovingMapComponent', () => {
  let component: MovingMapComponent;
  let fixture: ComponentFixture<MovingMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MovingMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MovingMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
