import {Component, OnInit, AfterViewInit, ViewChild, Input} from '@angular/core';

import {GeolocationService} from '../geolocation.service';
import {Position} from '../geolocation-api'
import {MovingMapComponent} from '../moving-map/moving-map.component';

import {SharedDataService} from '../shared-data.service';
import {TransitService} from '../transit.service';

import {Utils} from '../utils';
import {OgoConstants} from '../ogo-constants';

import {} from '@types/googlemaps';

//TODO bus routes
//use: https://geopad.ca/js/get_json_triplist.php?trips_x=AE540b86_42&city_code=oc&count=3


/////////////////////   Bus Stops  /////////////////
//import {TransitService} from '../transit.service';
import {Stop} from '../stop';


@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  styleUrls: ['./google-map.component.css']
})

export class GoogleMapComponent implements OnInit, AfterViewInit {

  fake_header_height: number = 80;
  container_height: number = window.innerHeight - this.fake_header_height;

  @ViewChild(MovingMapComponent)
  private movingMapComponent: MovingMapComponent;

  map: google.maps.Map;

  lat: number = 45.406265;
  lng: number = -75.654886;
  marker_lat: number = this.lat;
  marker_lng: number = this.lng;

  accuracy: number = this.accuracy;

  mapOptions: google.maps.MapOptions;

  markers: any[];

  current_marker;

  _geolocation_position: Position;
  @Input()
  set geolocation_position(geolocation_position: Position) {

    this._geolocation_position = geolocation_position;

    if(this._geolocation_position)
    {
      this.lat = this._geolocation_position.coords.latitude;
      this.lng = this._geolocation_position.coords.longitude;
      this.accuracy = this._geolocation_position.coords.accuracy;
      this.marker_lat = this.lat;
      this.marker_lng = this.lng;
    }

  }
  get geolocation_position(): Position { return this._geolocation_position; }

  watching: boolean = false;
  waiting: boolean = false;

  moving_map: boolean = true;

  //TODO breakout into a component
  //stops: Stop[];
  //selected_stop;//:Stop;
  bus_stop_gb = 'assets/bus_stop_gb.png';

  constructor(private geolocationService: GeolocationService,
              private sharedDataService: SharedDataService,
              private transitService: TransitService) {
    //TODO configurable options module
    this.mapOptions = {zoom: 16, mapTypeControl: true};

  }


  ngAfterViewInit() {
    //TODO use this for ??
  }

  ngOnInit() {

    /*
    let source = this.geolocationService.getLocation({enableHighAccuracy: true, maximumAge: 30000, timeout: 120000});
    source.subscribe(position => {
        this.geolocation_position = position;

        this.lat = this.geolocation_position.coords.latitude;
        this.lng = this.geolocation_position.coords.longitude;
        this.accuracy = this.geolocation_position.coords.accuracy;
        this.marker_lat = this.lat;
        this.marker_lng = this.lng;

      }, err => {
        console.log(err);
      },
      () => {
        //console.log("DONE DONE DONE");
      }
    );
    */

  }

  ////////////////////////////  Traking functions  ///////////////////////////
  trackCaption() {
    if (this.waiting) return " ... ";
    return this.watching ? "Stop" : "Start";
  }

  getTrakColor() {
    return this.watching ? "red" : "chartreuse";
  }

  toggleTraking() {
    if (this.movingMapComponent) {
      this.watching = this.movingMapComponent.toggleTracking();
    } else {
      alert("Component not available");
    }
  }

  ///////////////////////////////////  Moving Map functions   ////////////////////////
  toggleMovingMap() {
    if (this.movingMapComponent) {
      this.moving_map = this.movingMapComponent.toggleMovingMap();
    }
  }

  movingColor() {
    return this.moving_map ? "red" : "chartreuse";
  }

  movingCaption() {
    return this.moving_map ? "Static" : "Moving";
  }

  centerMap() {
    if (this.movingMapComponent) {
      this.movingMapComponent.centerMap();
    }
  }

  centerChanged() {
    //console.log("Center Changed");
  }

  boundsChanged() {
    var zoomLevel: number;
   }

  onMapDblClick(){
    alert("You Double Clicked");
  }

  mapReady(e) {

    this.map = e.data.map;
    console.log("Map Ready, lat() = " + this.map.getCenter().lat());

    this.movingMapComponent.setAccuracyLimit(OgoConstants.STANDARD_ACCURACY_LEVEL);

    let stops:Stop[] = this.sharedDataService.getStops();

    console.log("mapReady");

    if(stops && stops.length > 0)
    {
      //get closest stop
      let closest:Stop = stops[0];
      let stopLatLng = new google.maps.LatLng(closest.stop_lat, closest.stop_lng);
      let pegManLatLng = new google.maps.LatLng(this.marker_lat, this.marker_lng);

      let bounds = new google.maps.LatLngBounds();

      bounds.extend(pegManLatLng);
      bounds.extend(stopLatLng);
      this.map.fitBounds(bounds);

      console.log("zoom1: " + this.map.getZoom());

      let zoom: number = this.map.getZoom();
      if(zoom > OgoConstants.STANDARD_ZOOM_LEVEL){
        this.map.setZoom(OgoConstants.STANDARD_ZOOM_LEVEL);
      }

      this.movingMapComponent.setCircleAttributes(this.accuracy);

      console.log("zoom2: " + this.map.getZoom());

    }

    //dblclick
    google.maps.event.addListener(this.map, "dblclick", (e) => {

      this.performDblClick(e.latLng);

    });

  }

  performDblClick(latLng:google.maps.LatLng){

    this.transitService.getStops(latLng.lat(), latLng.lng(),
      this.sharedDataService.getCityCode()).then(stops => {

      let temp:Stop[] = [];
      stops.forEach(stop => {

        //TODO ignore existing stops

        var stop_code = stop.stop_code;
        var lat = stop.stop_lat;
        var lng = stop.stop_lng;

        //determine distance to stop
        //let stopLatLng = new google.maps.LatLng(lat, lng);
        //let dist: number = google.maps.geometry.spherical.computeDistanceBetween(
        //  stopLatLng,
        //  pegManLatLng);

        let dist:number = Utils.computeDistanceBetween(lat, lng, latLng.lat(), latLng.lng());

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
      //temp.sort((a, b) => {
      //    return a.distance - b.distance;
      //  }
      //);

      this.sharedDataService.addStops(temp);

      this.map.panTo(latLng);
      this.map.setZoom(OgoConstants.STANDARD_ZOOM_LEVEL);

    });

    //




  }

}
