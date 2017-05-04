import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";

import {GeolocationService} from '../geolocation.service';
import {Position} from '../geolocation-api'
import {SharedDataService} from '../shared-data.service';

/////////////////////   Bus Stops  /////////////////
import {TransitService} from '../transit.service';
import {Stop} from '../stop';
import {Utils} from "../utils";


@Component({
  selector: 'ogo',
  templateUrl: './ogo.component.html',
  styleUrls: ['./ogo.component.css']
})

export class OgoComponent implements OnInit {

  geolocation_position: Position;
  watch_subscription: Subscription;
  watch_position: Position;
  watch_msg: string;
  watching: boolean = false;

  status: string = "Getting Location ...";

  constructor(private geolocationService: GeolocationService,
              private sharedDataService: SharedDataService,
              private transitService: TransitService) {
  }

  ngOnInit() {

    var w = window.innerWidth;
    var h = window.innerHeight;

    let limit: number = 60;

    console.log("width: " + w + " height: " + h);

    let source = this.geolocationService.getLocation({enableHighAccuracy: true, maximumAge: 30000, timeout: 120000});
    source.subscribe(position => {

        if (position.coords.accuracy > limit) {
          this.status = "Location is inaccurate, watching for better position";
          this.watching = true;
          this.watchForBetterPosition(limit);
        }
        else {
          this.status = "Getting Bus Stop Locations ...";
          this.getBusStops(position);
        }

      }, err => {
        console.log(err);
        this.status = err;
      },
      () => {
        //console.log("DONE DONE DONE");
      }
    );
  }

  watchForBetterPosition(limit: number){
    let source = this.geolocationService.watchPosition({
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 100000
    });
    this.watch_subscription = source.subscribe(position => {
        this.watch_position = position;
        this.status = "Watching for better Position.";
        this.watching = true;
        this.watch_msg = "Current accuracy: " + position.coords.accuracy + " meters.";
        if(position.coords.accuracy < limit)
        {
          this.watching = false;
          this.continue();
        }
      }, err => {
        console.log(err);
      },
      () => {
        console.log("DONE WATCHING ??");
      }
    );
  }

  continue(){

    this.watch_subscription.unsubscribe();
    this.geolocationService.clearWatch();
    this.status = "Getting Bus Stop Locations ...";
    this.getBusStops(this.watch_position);

  }

  getBusStops(position: Position) {

    this.transitService.getStops(position.coords.latitude, position.coords.longitude,
      this.sharedDataService.getCityCode()).then(stops => {

      this.status = "Sorting Bus Stop Locations ...";
      //let pegManLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

      let temp: Stop[] = [];
      stops.forEach(stop => {
        //Weird backflip needed here see:
        //https://github.com/SebastianM/angular2-google-maps/issues/330
        //Note the problem here is that the JSON fields for stop_lat and stop_lng are strings
        var stop_code = stop.stop_code;
        var lat = stop.stop_lat;
        var lng = stop.stop_lng;

        //determine distance to stop
        //let stopLatLng = new google.maps.LatLng(lat, lng);
        //let dist: number = google.maps.geometry.spherical.computeDistanceBetween(
        //  stopLatLng,
        //  pegManLatLng);

        let dist: number = Utils.computeDistanceBetween(lat, lng, position.coords.latitude, position.coords.longitude);

        temp.push({
          stop_code: Number(stop_code),
          stop_id: stop.stop_id,
          stop_name: stop.stop_name,
          stop_lat: Number(lat),
          stop_lng: Number(lng),
          isOpen: false, //Set all info windows closed
          distance: dist
        });

      });

      //Sort by distance
      temp.sort((a, b) => {
          return a.distance - b.distance;
        }
      );

      this.sharedDataService.setStops(temp);

      this.geolocation_position = position;

    });

  }
}
