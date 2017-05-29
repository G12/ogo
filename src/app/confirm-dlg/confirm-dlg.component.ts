import { Component } from '@angular/core';
import { MdDialogRef } from '@angular/material';

@Component({
  selector: 'app-confirm-dlg',
  templateUrl: './confirm-dlg.component.html',
  styleUrls: ['./confirm-dlg.component.css']
})
export class ConfirmDlgComponent {

  title: string;
  message: string;

  constructor(public dialogRef: MdDialogRef <ConfirmDlgComponent>) { }

}
