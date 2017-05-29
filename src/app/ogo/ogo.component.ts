import {Component, OnInit, ViewChild, ElementRef, NgZone} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {GeolocationService} from '../geolocation.service';
import {Position} from '../geolocation-api';
import {SharedDataService} from '../shared-data.service';
import {DialogService} from '../dialog.service';

/////////////////////   Bus Stops  /////////////////
import {TransitService} from '../transit.service';
import {Stop} from '../stop';
import {Utils} from '../utils';

/////////////////////  Search Form ////////////////
import { MapsAPILoader } from '@agm/core';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'app-ogo',
  templateUrl: './ogo.component.html',
  styleUrls: ['./ogo.component.css']
})

export class OgoComponent implements OnInit {

  selectedOption: string;
  geolocation_position: Position;
  watch_subscription: Subscription;
  watch_position: Position;
  watch_msg: string;
  watching = false;
  noLocation = false;

  status = 'Getting Location ...';
  lastDate = '';

  LocationServiceTitle = 'No Location Service Available';

  @ViewChild('search') searchElementRef: ElementRef;
  public searchControl: FormControl;

  constructor(private geolocationService: GeolocationService,
              private sharedDataService: SharedDataService,
              private transitService: TransitService,
              private dialogService: DialogService,
              private mapsAPILoader: MapsAPILoader,
              private ngZone: NgZone) {
  }

  ngOnInit() {

    const w = window.innerWidth;
    const h = window.innerHeight;

    const limit = 60;

    console.log('width: ' + w + ' height: ' + h);

    // TODO added May 19 2017
    this.transitService.getLastDate(this.sharedDataService.getCityCode()).then(lastDate => {

      this.lastDate = 'Schedule good until: ' + Utils.googleDateToDateString(lastDate);

    });

    // create search FormControl
    this.searchControl = new FormControl();

    const source = this.geolocationService.getLocation({enableHighAccuracy: true, maximumAge: 30000, timeout: 120000});
    source.subscribe(position => {

        if (position.coords.accuracy > limit) {

          this.openConfirmWatchDlg();

          this.status = 'Location is inaccurate, watching for better position';
          this.watching = true;
          this.watchForBetterPosition(limit);

        } else {
          this.status = 'Getting Bus Stop Locations ...';
          this.getBusStops(position);
        }

      }, err => {
        console.log(err);
        this.status = err;
        this.watch_msg = '';
        this.noLocation = true;
        this.openLocationOptionsDlg(err);

        this.loadPlacesAutoComplete();

      },
      () => {
        // console.log("DONE DONE DONE");
      }
    );
  }

  loadPlacesAutoComplete() {
    this.mapsAPILoader.load().then(() => {

      const elm = this.searchElementRef.nativeElement;

      const autocomplete = new google.maps.places.Autocomplete(elm); // , {types: ['address','']});


      // Restrict to Canada
      // autocomplete.setComponentRestrictions({'country': 'ca'});
      // restrict to an area around Ottawa bounded by Aprox Luskville to Embrun
      const bounds: google.maps.LatLngBoundsLiteral = { east: -75.289520, north: 45.565478, south: 45.228966, west: -76.245279 };
      autocomplete.setBounds(bounds);

      const stop = 'STOP';

      const test2 = stop + 'Hello';

      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place: google.maps.places.PlaceResult = autocomplete.getPlace();

          // verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }

          // set latitude, longitude and zoom
          // this.latitude = place.geometry.location.lat();
          // this.longitude = place.geometry.location.lng();
          // this.zoom = 12;
          const pos = <Position> {coords: {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            accuracy: 0
          } };
          this.getBusStops(pos);

        });
      });
    });
  }

  openConfirmWatchDlg() {
    this.dialogService
      .confirm('Geographic Location Service', 'Location is inaccurate. Are you sure you want to continue')
      .subscribe(res => {
        if (res) {
          this.watching = false;
          this.continue();
        }
      });
  }

  openLocationOptionsDlg(title) {
    this.dialogService
      .confirm(title, 'Select Okay to search for a location or Cancel to use the default location')
      .subscribe(res => {
        if (res) {
          this.status = 'Enter an Address or Place Name to get the closest bus stops';
        } else {
          this.useDefault();
        }
      });
  }

  watchForBetterPosition(limit: number) {
    const source = this.geolocationService.watchPosition({
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 100000
    });
    this.watch_subscription = source.subscribe(position => {
        this.watch_position = position;
        this.status = 'Watching for better Position.';
        this.watching = true;
        this.watch_msg = 'Current accuracy: ' + position.coords.accuracy + ' meters.';
        if (position.coords.accuracy < limit) {
          this.watching = false;
          this.continue();
        }
      }, err => {
        console.log(err);
      },
      () => {
        console.log('DONE WATCHING ??');
      }
    );
  }

  continue() {

    this.watch_subscription.unsubscribe();
    this.geolocationService.clearWatch();
    this.status = 'Getting Bus Stop Locations ...';
    this.getBusStops(this.watch_position);

  }

  useDefault() {
    this.status = 'Getting Bus Stop Locations ...';
    const pos = <Position> {coords: {
        latitude: 45.424126,
        longitude: -75.701213,
        accuracy: 0
      } };
    this.getBusStops(pos);
  }

  reload() {
    this.ngOnInit();
  }

  getBusStops(position: Position) {

    this.transitService.getStops(position.coords.latitude, position.coords.longitude,
      this.sharedDataService.getCityCode()).then(stops => {

      this.status = 'Sorting Bus Stop Locations ...';
      // let pegManLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

      const temp: Stop[] = [];
      stops.forEach(stop => {
        // Weird backflip needed here see:
        // https://github.com/SebastianM/angular2-google-maps/issues/330
        // Note the problem here is that the JSON fields for stop_lat and stop_lng are strings
        const stop_code = stop.stop_code;
        const lat = stop.stop_lat;
        const lng = stop.stop_lng;

        // determine distance to stop
        // let stopLatLng = new google.maps.LatLng(lat, lng);
        // let dist: number = google.maps.geometry.spherical.computeDistanceBetween(
        //  stopLatLng,
        //  pegManLatLng);

        const dist: number = Utils.computeDistanceBetween(lat, lng, position.coords.latitude, position.coords.longitude);

        temp.push({
          stop_code: Number(stop_code),
          stop_id: stop.stop_id,
          stop_name: stop.stop_name,
          stop_lat: Number(lat),
          stop_lng: Number(lng),
          isOpen: false, // Set all info windows closed
          distance: dist,
          zIndex: 1,
          height: 0,
          width: 0
        });

      });

      // Sort by distance
      temp.sort((a, b) => {
          return a.distance - b.distance;
        }
      );

      this.sharedDataService.setStops(temp);

      this.geolocation_position = position;


    });

  }
}
