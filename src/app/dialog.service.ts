import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import {MdDialog, MdDialogRef} from '@angular/material';
import {ConfirmDlgComponent} from './confirm-dlg/confirm-dlg.component';


@Injectable()
export class DialogService {

  constructor(public dialog: MdDialog) { }

  public confirm(title: string, message: string): Observable<boolean> {

    let dialogRef: MdDialogRef<ConfirmDlgComponent>;

    dialogRef = this.dialog.open(ConfirmDlgComponent);
    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;

    return dialogRef.afterClosed();
  }

}
