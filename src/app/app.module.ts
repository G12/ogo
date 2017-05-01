import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AgmCoreModule, GoogleMapsAPIWrapper, InfoWindowManager } from '@agm/core';

import {TimerService} from './timer.service';
import { GeolocationService } from './geolocation.service';
import {TransitService} from './transit.service';
import {SharedDataService} from './shared-data.service';


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

@NgModule({
  declarations: [
    AppComponent,
    OgoComponent,
    GoogleMapComponent,
    MovingMapComponent,
    BusStopsComponent,
    BusStopInfoWindowComponent,
    HelpAboutComponent,
    DashboardComponent,
    NavBarComponent,
    BusRoutesComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyA1InXxmyZWGfqX28lKs_FFlLziBNSGE0s',
      libraries: ["geometry"]
    })
  ],
  providers: [GeolocationService, GoogleMapsAPIWrapper, TransitService, TimerService, InfoWindowManager, SharedDataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
