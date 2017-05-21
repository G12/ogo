import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDlgComponent } from './confirm-dlg.component';

describe('ConfirmDlgComponent', () => {
  let component: ConfirmDlgComponent;
  let fixture: ComponentFixture<ConfirmDlgComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmDlgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
