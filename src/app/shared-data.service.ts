import { Injectable } from '@angular/core';

import {OgoConstants} from './ogo-constants';
import {Stop} from './stop';
import {Route} from './route';


@Injectable()
export class SharedDataService {

  stops: Stop[];
  routes: Route[];
  currentZindex = 1;

  constructor() { }

  setStops(stops: Stop[])
  {
    this.stops = stops;
    console.log('setStops length: ' + this.stops.length);
  }

  getStops(){
    console.log('getStops');
    return this.stops;
  }

  addStops(stops: Stop[]) {
    stops.forEach((stop: Stop) => {
      this.stops.push(stop);
    });
  }

  setRoutes(routes: Route[]) {
    this.routes = routes;
  }

  addRoutes(routes: Route[]) {
    routes.forEach((route: Route) => {

      this.routes.push(route);

    });
  }

  getRoutes() {
    return this.routes;
  }

  getCityCode(): string {
    return OgoConstants.OC_TRANSPO;
  }

  getCurrentZindex(): number {
    return this.currentZindex;
  }

  setCurrentZindex(index: number) {
    this.currentZindex = index;
  }

  getNextZindex(): number {
    return ++this.currentZindex;
  }

}
