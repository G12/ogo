import {Injectable} from '@angular/core';
import {Headers, Http} from '@angular/http';

import 'rxjs/add/operator/toPromise';

import {Stop} from './stop';
import {Route} from './route';
import {BusArrivals, BusRoute, Trip, TripForStop} from './busArrivals';
import {TripList} from './trip-list';

import {Utils, MapExtents} from './utils';

@Injectable()
export class TransitService {

  constructor(private http: Http) {
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  private stopsURL: string = 'https://geopad.ca/js/get_json_for.php';
  //'?lat_low=45.3985574&lat_high=45.4185574&lon_low=-75.66252039999997&lon_high=-75.65252039999996&city_code=oc';     // URL to web api

  getStops(lat: number, lng: number, city_code: string): Promise<Stop[]> {

    var stopsURL:string;
    let DEBUG = false;
    if (DEBUG) {

      let offset: number = 0.05; //0.024;
      let fudge: number = 0.6;
      let lat_low: number = lat - offset * fudge;
      let lat_high: number = lat + offset * fudge;
      let lon_low: number = lng - offset;
      let lon_high: number = lng + offset;

      stopsURL = this.stopsURL + '?lat_low=' + lat_low + '&lat_high=' + lat_high +
        '&lon_low=' + lon_low + '&lon_high=' + lon_high + '&city_code=' + city_code;

    } else {

      let extents: MapExtents = Utils.pixToMapExtents(window.innerWidth, window.innerHeight, lat, lng);
      console.log(JSON.stringify(extents));

      stopsURL = this.stopsURL + '?lat_low=' + extents.lat_low + '&lat_high=' + extents.lat_high +
        '&lon_low=' + extents.lon_low + '&lon_high=' + extents.lon_high + '&city_code=' + city_code;
    }

    return this.http.get(stopsURL)
      .toPromise()
      .then(response => response.json().stops as Stop[])
      .catch(this.handleError);
  }

  private routesURL: string = 'https://geopad.ca/js/get_json_bus_list.php';
  //https://geopad.ca/js/get_json_bus_list.php?stop_id=AE540&city_code=oc
  //Returns this JSON {"routes":[{"route_number":"86","trip_headsign":"86_Baseline  Colonnade","headsign_id":"369"}]}

  getRoutes(stop_id: string, city_code: string) {

    let routesURL = this.routesURL + '?stop_id=' + stop_id + '&city_code=' + city_code;

    return this.http.get(routesURL)
      .toPromise()
      .then(response => response.json().routes as Route[])
      .catch(this.handleError);
  }

  private tripsURL: string = 'https://geopad.ca/js/oc_bus_json.php';
  //https://geopad.ca/js/oc_bus_json.php?trips=3017b111_729b86_371

  getTrips(trips: string) {
    let tripsURL = this.tripsURL + '?trips=' + trips;
    //BusArrivals
    return this.http.get(tripsURL)
      .toPromise()
      .then(response => response.json().stops as BusArrivals[])
      .catch(this.handleError);
  }

  //GetNextTripsForStopAllRoutes
  private GetNextTripsForStopAllRoutesURL = 'https://geopad.ca/js/GetNextTripsForStopAllRoutes.php';

  getNextTripsForStopAllRoutes(stopNo: number) {
    let getNextTripsForStopAllRoutesURL = this.GetNextTripsForStopAllRoutesURL + '?stopNo=' + stopNo;
    return this.http.get(getNextTripsForStopAllRoutesURL)
      .toPromise()
      .then(response => response.json().GetRouteSummaryForStopResult)
      .catch(this.handleError);
  }

  //GetNextTripsForStopResult
  private GetNextTripsForStopURL = 'https://geopad.ca/js/GetNextTripsForStop.php';

  getNextTripsForStop(stopNo: number, routeNo: string) {
    let getNextTripsForStopURL = this.GetNextTripsForStopURL + '?stopNo=' + stopNo + '&routeNo=' + routeNo;
    return this.http.get(getNextTripsForStopURL)
      .toPromise()
      .then(response => response.json().GetNextTripsForStopResult)
      .catch(this.handleError);
  }

  //https://geopad.ca/js/get_json_triplist.php?trips_x=AE540b86_42&city_code=oc&count=3
  //TripList
  //trips string = stop_id + "b" + route_number + "_" + headsign_id  + "b" + route_number + "_" + headsign_id ...;

  private GetTripLisURL = 'https://geopad.ca/js/get_json_triplist.php';

  getTripList(trips: string, city_code: string, count: number) {
    let getTripLisURL = this.GetTripLisURL + '?trips_x=' + trips + '&city_code=' + city_code + '&count=' + count;
    return this.http.get(getTripLisURL)
      .toPromise()
      .then(response => response.json().stops as TripList) //TODO what is getTripListResult
      .catch(this.handleError);
  }

}
