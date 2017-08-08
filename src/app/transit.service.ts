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

  private stopsURL = 'https://geopad.ca/js/get_json_for.php';
  private routesURL = 'https://geopad.ca/js/get_json_bus_list.php';
  private tripsURL = 'https://geopad.ca/js/oc_bus_json.php';
  private GetNextTripsForStopAllRoutesURL = 'https://geopad.ca/js/GetNextTripsForStopAllRoutes.php';
  private GetNextTripsForStopURL = 'https://geopad.ca/js/GetNextTripsForStop.php';
  private GetTripLisURL = 'https://geopad.ca/js/get_json_triplist.php';

  constructor(private http: Http) {
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  // Test service for posting geolocation - See survey app
  storeTestLocation(lat, lng, accuracy, time): Promise<string> {

    let storeTestLocationURL: string;
    storeTestLocationURL = this.stopsURL + '?op_id=location_test&lat=' + lat + '&lng=' + lng + '&accuracy=' + accuracy + '&time=' + time;

    return this.http.get(storeTestLocationURL)
      .toPromise()
      .then(response => response.json().status as string)
      .catch(this.handleError);
  }

  getLastDate(city_code): Promise<string> {

    let getLastDateURL: string;
    getLastDateURL = this.stopsURL + '?op_id=lastDate&city_code=' + city_code

    return this.http.get(getLastDateURL)
      .toPromise()
      .then(response => response.json().lastDate as string)
      .catch(this.handleError);
  }

  // '?lat_low=45.3985574&lat_high=45.4185574&lon_low=-75.66252039999997&lon_high=-75.65252039999996&city_code=oc';     // URL to web api

  getStops(lat: number, lng: number, city_code: string): Promise<Stop[]> {

    let stopsURL: string;
    const DEBUG = false;
    if (DEBUG) {

      const offset = 0.1; // 0.05; // 0.024;
      const fudge = 0.6;
      const lat_low: number = lat - offset * fudge;
      const lat_high: number = lat + offset * fudge;
      const lon_low: number = lng - offset;
      const lon_high: number = lng + offset;

      stopsURL = this.stopsURL + '?lat_low=' + lat_low + '&lat_high=' + lat_high +
        '&lon_low=' + lon_low + '&lon_high=' + lon_high + '&city_code=' + city_code;

    } else {

      const extents: MapExtents = Utils.pixToMapExtents(window.innerWidth, window.innerHeight, lat, lng);
      // console.log(JSON.stringify(extents));

      stopsURL = this.stopsURL + '?lat_low=' + extents.lat_low + '&lat_high=' + extents.lat_high +
        '&lon_low=' + extents.lon_low + '&lon_high=' + extents.lon_high + '&city_code=' + city_code;
    }

    return this.http.get(stopsURL)
      .toPromise()
      .then(response => response.json().stops as Stop[])
      .catch(this.handleError);
  }

  // https://geopad.ca/js/get_json_bus_list.php?stop_id=AE540&city_code=oc
  // Returns this JSON {"routes":[{"route_number":"86","trip_headsign":"86_Baseline  Colonnade","headsign_id":"369"}]}

  getRoutes(stop_id: string, city_code: string) {

    const routesURL = this.routesURL + '?stop_id=' + stop_id + '&city_code=' + city_code;

    return this.http.get(routesURL)
      .toPromise()
      .then(response => response.json().routes as Route[])
      .catch(this.handleError);
  }

  // https://geopad.ca/js/oc_bus_json.php?trips=3017b111_729b86_371

  getTrips(trips: string) {
    const tripsURL = this.tripsURL + '?trips=' + trips;
    // BusArrivals
    return this.http.get(tripsURL)
      .toPromise()
      .then(response => response.json().stops as BusArrivals[])
      .catch(this.handleError);
  }

  // GetNextTripsForStopAllRoutes
  getNextTripsForStopAllRoutes(stopNo: number) {
    const getNextTripsForStopAllRoutesURL = this.GetNextTripsForStopAllRoutesURL + '?stopNo=' + stopNo;
    return this.http.get(getNextTripsForStopAllRoutesURL)
      .toPromise()
      .then(response => response.json().GetRouteSummaryForStopResult)
      .catch(this.handleError);
  }

  // GetNextTripsForStopResult
  getNextTripsForStop(stopNo: number, routeNo: string) {
    const getNextTripsForStopURL = this.GetNextTripsForStopURL + '?stopNo=' + stopNo + '&routeNo=' + routeNo;
    return this.http.get(getNextTripsForStopURL)
      .toPromise()
      .then(response => response.json().GetNextTripsForStopResult)
      .catch(this.handleError);
  }

  // https://geopad.ca/js/get_json_triplist.php?trips_x=AE540b86_42&city_code=oc&count=3
  // TripList
  // trips string = stop_id + "b" + route_number + "_" + headsign_id  + "b" + route_number + "_" + headsign_id ...;
  getTripList(trips: string, city_code: string, count: number) {
    const getTripLisURL = this.GetTripLisURL + '?trips_x=' + trips + '&city_code=' + city_code + '&count=' + count;
    return this.http.get(getTripLisURL)
      .toPromise()
      .then(response => response.json().stops as TripList) // TODO what is getTripListResult
      .catch(this.handleError);
  }

}
