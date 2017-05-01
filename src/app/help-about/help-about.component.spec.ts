/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HelpAboutComponent } from './help-about.component';

describe('HelpAboutComponent', () => {
  let component: HelpAboutComponent;
  let fixture: ComponentFixture<HelpAboutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelpAboutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpAboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
