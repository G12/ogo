/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { OgoComponent } from './ogo.component';

describe('OgoComponent', () => {
  let component: OgoComponent;
  let fixture: ComponentFixture<OgoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OgoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OgoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
