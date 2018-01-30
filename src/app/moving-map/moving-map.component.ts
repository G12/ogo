import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {GoogleMapsAPIWrapper} from '@agm/core';
import {Subscription} from 'rxjs/Subscription';

import {GeolocationService} from '../geolocation.service';

import {OgoConstants} from '../ogo-constants';

import {} from '@types/googlemaps';

import {TransitService} from '../transit.service';

@Component({
  selector: 'app-moving-map',
  template: ''
})

export class MovingMapComponent implements OnInit {

  map: any;
  circle: any;

  geolocation_position: Position;
  watch_subscription: Subscription;
  watching = false;
  moving_map = true;

  trackingButton: any;

  marker: google.maps.Marker;
  marker_options: google.maps.MarkerOptions;
  infoWindow: google.maps.InfoWindow;

  @Input() lattitude: number;
  @Input() longitude: number;
  @Input() accuracy: number;
  title = 'This is your location.';

  accuracyLimit = OgoConstants.STANDARD_ACCURACY_LEVEL;
  ready = false;

  @Output() mapReady: EventEmitter<any> = new EventEmitter();

  tilesloaded: google.maps.MapsEventListener;

  constructor(private mapApiWrapper: GoogleMapsAPIWrapper,
              private geolocationService: GeolocationService,
              private transitService: TransitService) {

  }

  ngOnInit() {
    this.mapApiWrapper.getNativeMap().then(map => {

      this.map = map;

      const center = new google.maps.LatLng(this.lattitude, this.longitude);

      const options = {
        strokeColor: 'green',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: 'dodgerblue',
        fillOpacity: 0.35,
        center: center,
        radius: this.adjustAccuracy(this.accuracy),
        map: this.map
      };

      this.circle = new google.maps.Circle(options);

      this.setCircleAttributes(this.accuracy);


      const icon: google.maps.Icon = {
        anchor: new google.maps.Point(10, 16),
        // The position at which to anchor an image in correspondance to the location of the marker on the map.
        // By default, the anchor is located along the center point of the bottom of the image.
        origin: new google.maps.Point(0, 0),
        // The position of the image within a sprite, if any. By default, the origin is located
        // at the top left corner of the image (0, 0).
        // 	Size	The size of the entire image after scaling, if any.
        // Use this property to stretch/shrink an image or a sprite.
        size: new google.maps.Size(21, 32),
        // The display size of the sprite or image. When using sprites, you must specify the sprite size.
        // If the size is not provided, it will be set when the image loads.
        url: 'assets/pegman.png'
        // string	The URL of the image or sprite sheet.
      };
      const shape = {
        coord: [0, 0, 0, 40, 40, 40, 40, 0],
        type: 'poly'
      };

      const infoContent = '<h4>' + this.title + '</h4>' +
        '<ul><li>Lattitude:'+ this.toDMS(this.lattitude) + '</li>' +
        '<li>Longitude:'+ this.toDMS(this.longitude) + '</li></ul>';

      this.infoWindow = new google.maps.InfoWindow({content: infoContent});

      this.marker_options = {
        position: {lat: this.lattitude, lng: this.longitude},
        icon: icon,
        shape: shape,
        map: this.map,
        title: this.title,
        draggable: false,
        // infoWindow:this.infoWindow,
        zIndex: 2
        // Infront of Error Elipse
      }

      this.marker = new google.maps.Marker(this.marker_options);

      google.maps.event.addListener(this.marker, 'click', () => {
        // Do nothing if bus clicked - ErrorElipse below for handling visible circle
        this.infoWindow.open(this.map, this.marker);
        const infoContent2 = '<h3>' + this.title + '</h3>' +
          '<ul><li><h4>Lattitude:' + this.toDMS(this.lattitude) + '</h4></li>' +
          '<li><h4>Longitude:' + this.toDMS(this.longitude) + '</h4></li>' +
          '<li><h4>Accuracy: ' + this.accuracy + ' meters</h4></li></ul>';
        this.infoWindow.setContent(infoContent2);
      });

      this.map.addListener('zoom_changed', () => {

        this.setCircleAttributes(this.accuracy);


      });


      this.tilesloaded = google.maps.event.addListener(this.map, 'tilesloaded', () => {
        console.log('Tiles Loaded');
        if (!this.ready) {
          this.ready = true;
          console.log('READY');
          google.maps.event.removeListener(this.tilesloaded);
          this.mapReady.emit(this.map);

          this.addCustomControls();

        }
      });
    });
  }


  /**
   *
   * @param distance
   *
   * update the accuracy limit and redraw the circle
   */
  setAccuracyLimit(distance: number = 0) {
    this.accuracyLimit = distance;
    this.accuracy = this.adjustAccuracy(this.accuracy);
    this.circle.setRadius(this.accuracy);
  }

  private adjustAccuracy(accuracy) {
    if (this.accuracyLimit !== 0) {
      return accuracy > this.accuracyLimit ? this.accuracyLimit : accuracy;
    }
    return accuracy;
  }

  setCircleAttributes(accuracy: number) {
    this.circle.setRadius(this.adjustAccuracy(accuracy));
    // this.circle.strokeColor = OgoConstants.GOOD_GREEN; //TODO does not work - investigate solution
    this.circle.setOptions({strokeColor: OgoConstants.GOOD_GREEN});

    if (accuracy > OgoConstants.STANDARD_ACCURACY_LEVEL) {
      // this.circle.strokeColor = OgoConstants.BAD_RED;
      this.circle.setOptions({strokeColor: OgoConstants.BAD_RED});
    }
    if (this.map) {

      if (accuracy < OgoConstants.DISPLAY_CIRCLE_ACCURACY_LIMIT) {
        this.circle.setRadius(0);
        return;
      }

      const zoomLevel: number = this.map.getZoom();
      if (zoomLevel < OgoConstants.DISPLAY_CIRCLE_ZOOM_LEVEL) {
        // Dont display circle when zoomed out above standard level
        this.circle.setRadius(0);
      }
    }
  }

  getMapApiWrapper() {
    return this.mapApiWrapper;
  }

  // Note this method is now obsolete - using this.infoWindowManager.open(this.parent);
  // to kick off the autoscroll (correctly) see bus-stop-info-window.component
  // This method could be usefull for moving an info window

  centerInfoWindow(pixelHeight: number, lat: number, lng: number) {

    let offset = 0.9;
    const height = window.innerHeight;
    if (height > 1000) {
      offset = 0.5;
    }

    const bounds: google.maps.LatLngBounds = this.map.getBounds();
    const center: google.maps.LatLng = bounds.getCenter();
    const ne: google.maps.LatLng = bounds.getNorthEast();
    const deltaLat = ne.lat() - center.lat();
    const newLat = lat + deltaLat * offset;
    // newLat is about seven eights  three quarters down the page
    this.lattitude = newLat;
    this.longitude = lng;
    this.centerMap();

  }

  centerMap() {
    this.map.panTo({lat: this.lattitude, lng: this.longitude});
  }

  getTitle(): string {
    return this.title;
  }

  toggleMovingMap(): boolean {
    this.moving_map = !this.moving_map;
    const msg: string = this.moving_map ? 'Map is Moving' : 'Map is Static';
    console.log(msg);
    return this.moving_map;
  }

  toggleTracking(): boolean {

    if (!this.watching) {

      const source = this.geolocationService.watchPosition({
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 100000
      });
      this.watch_subscription = source.subscribe(position => {

          this.lattitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.accuracy = this.adjustAccuracy(position.coords.accuracy);

          console.log('Lat: ' + this.lattitude + ' Lng: ' + this.longitude);

          this.circle.setCenter({lat: this.lattitude, lng: this.longitude});
          this.circle.setRadius(this.accuracy);
          this.circle.strokeColor = 'green';
          this.marker.setPosition({lat: this.lattitude, lng: this.longitude});

          if (this.moving_map) {
            console.log('Pan to: ' + this.lattitude + ' ' + this.longitude);
            this.map.panTo({lat: this.lattitude, lng: this.longitude});
          }
          /*
          // Test service for geolocation posting
          this.transitService.storeTestLocation(position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy,
            position.timestamp).then(status => {
              console.log('status: ' + status);
          });
          */

        }, err => {
          console.log(err);
          this.clearWatch();
        },
        () => {
          console.log('DONE WATCHING ??');
        }
      );
      this.watching = true;
    } else {
      this.clearWatch();
    }
    if (this.watching) {
      this.trackingButton.style.backgroundColor = 'chartreuse';
    } else {
      this.trackingButton.style.backgroundColor = 'whitesmoke';
    }
    return this.watching;
  }
  private clearWatch() {
    this.watch_subscription.unsubscribe();
    this.watching = false;
    this.geolocationService.clearWatch();
    console.log('DONE WATCHING');
  }

  /////////////////////////////////   Controls   //////////////////////////////
  addCustomControls() {

    // Create the DIV to hold the control and call the CenterControl()
    // constructor passing in this DIV.
    const centerControlDiv: Element = document.createElement('div');
    // var centerControl = new centerButton(centerControlDiv, this.map);
    this.trackingButton = document.createElement('DIV');
    this.trackingButton.style.cursor = 'pointer';

    // this.trackingButton.style.backgroundImage = "url(https://geopad.ca/ogo/assets/center.png)";
    this.trackingButton.style.backgroundImage = 'url(assets/center.png)';

    this.trackingButton.style.backgroundSize = 'contain';
    this.trackingButton.style.height = '30px';
    this.trackingButton.style.width = '30px';
    this.trackingButton.style.margin = '8px';
    this.trackingButton.style.boxShadow = '0px 2px 2px lightgrey';
    this.trackingButton.style.borderRadius = '8%';
    this.trackingButton.style.border = '1px solid grey';
    this.trackingButton.style.backgroundColor = 'whitesmoke';
    this.trackingButton.title = 'Click to Start Geolocation Tracking.';
    centerControlDiv.appendChild(this.trackingButton);

    this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);

    // Setup the click event listener
    this.trackingButton.addEventListener('click', () => {
      this.toggleTracking();
    });
    this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(centerControlDiv);
  }


  /////////////////////////////////    Utility   ///////////////////////////////
  getLat() {
    if (this.geolocation_position) {
      return this.toDMS(this.geolocation_position.coords.latitude);
    }
    return 'Getting Position ...';
  }

  getLng() {
    if (this.geolocation_position) {
      return this.toDMS(this.geolocation_position.coords.longitude);
    }
    return 'Getting Position ...';
  }

  getAccuracy() {
    if (this.geolocation_position) {
      return this.toPrecission(this.geolocation_position.coords.accuracy, 2);
    }
    return 0;
  }

  getCenterString() {
    return 'accuracy: ' + this.toPrecission(this.geolocation_position.coords.accuracy, 2) + 'm';
  }

  private toDMS = function (decAngle) {
    let deg = Math.floor(Math.abs(decAngle));
    const min = Math.floor(60 * (Math.abs(decAngle) - deg));
    let sec = 3600 * (Math.abs(decAngle) - deg - min / 60);
    // 3600*(Math.abs(dec)-deg-min/60);//toPrecission(3600*(Math.abs(dec)-deg-min/60,1));
    sec = this.toPrecission(sec, 3);
    if (decAngle < 0) {
      deg = -deg;
    }
    return String.fromCharCode(176) + deg + ' \'' + min + ' "' + sec;
  };

  private toPrecission = function (val, precission) {
    const p = Math.pow(10, precission);
    val = val * p;
    const tmp = Math.round(val);
    return tmp / p;
  };
}
