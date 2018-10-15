import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MdButtonModule, MdDialogModule} from '@angular/material';

import { AgmCoreModule, GoogleMapsAPIWrapper, InfoWindowManager } from '@agm/core';

import {TimerService} from './timer.service';
import { GeolocationService } from './geolocation.service';
import {TransitService} from './transit.service';
import {SharedDataService} from './shared-data.service';
import {DialogService} from './dialog.service';


import { AppComponent } from './app.component';
import { OgoComponent } from './ogo/ogo.component';
import { GoogleMapComponent } from './google-map/google-map.component';
import { MovingMapComponent } from './moving-map/moving-map.component';
import { BusStopsComponent } from './bus-stops/bus-stops.component';
import { BusStopInfoWindowComponent } from './bus-stop-info-window/bus-stop-info-window.component';
import { HelpAboutComponent } from './help-about/help-about.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { BusRoutesComponent } from './bus-routes/bus-routes.component';
import { ConfirmDlgComponent } from './confirm-dlg/confirm-dlg.component';
import { ToggleComponent } from './toggle/toggle.component';

@NgModule({
  declarations: [
    ToggleComponent,
    AppComponent,
    OgoComponent,
    GoogleMapComponent,
    MovingMapComponent,
    BusStopsComponent,
    BusStopInfoWindowComponent,
    HelpAboutComponent,
    DashboardComponent,
    NavBarComponent,
    BusRoutesComponent,
    ConfirmDlgComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    AgmCoreModule.forRoot({
      // apiKey: 'AIzaSyCTqwynVkRuqfg7OS2KJhDASYJ5Yc-YYtU',
      apiKey: 'AIzaSyA1InXxmyZWGfqX28lKs_FFlLziBNSGE0s',
      libraries: ['geometry', 'places']
    }),
    BrowserAnimationsModule,
    MdButtonModule,
    MdDialogModule
  ],
  entryComponents: [
    ConfirmDlgComponent
  ],
  providers: [GeolocationService, GoogleMapsAPIWrapper, TransitService, TimerService, InfoWindowManager, SharedDataService, DialogService],
  bootstrap: [AppComponent]
})
export class AppModule { }
