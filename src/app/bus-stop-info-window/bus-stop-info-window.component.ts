/***
 *  Infow Window content
 */

import {Component, OnInit, Input, OnDestroy, AfterViewChecked, ViewChild, ElementRef} from '@angular/core';

import {AgmInfoWindow, AgmMarker, InfoWindowManager} from '@agm/core';

import {TimerService} from '../timer.service';
import {KeyedCollection} from '../keyed-collection';
import {InfoBox, Utils} from '../utils';

/////////////////////   Bus Routes  /////////////////
import {TransitService} from '../transit.service';
import {Route} from '../route';

import {Stop} from '../stop';
import {BusArrivals, BusRoute, Trip, TripForStop} from '../busArrivals';

import {} from '@types/googlemaps';

import {OgoConstants} from '../ogo-constants';

import {SharedDataService} from '../shared-data.service';
import {isNumber} from 'util';

@Component({
  selector: 'app-bus-stop-info-window',
  templateUrl: './bus-stop-info-window.component.html',
  styleUrls: ['./bus-stop-info-window.component.css']
})

export class BusStopInfoWindowComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('container') elementView: ElementRef;

  @Input() city_code: string;
  @Input() stop: Stop;
  @Input() parent: AgmInfoWindow;
  @Input() marker: AgmMarker;
  @Input() bus_stop_gb: string;
  @Input() selected_stops: KeyedCollection<Stop>;
  @Input() map: google.maps.Map;
  @Input() latitude: number;
  @Input() longitude: number;

  routes: Route[]; // {"route_number":"86","trip_headsign":"86_Baseline  Colonnade","headsign_id":"369"}
  busArrivals: BusArrivals[];

  selected_routes: Route[];

  // TimerService
  timerId: string;
  timerName: string;
  counter = 0;
  deltaProcessingTime: number;
  lastProcessingTime: number;
  busy = false;

  // Trips For Stop Cards
  expandToggle = true;

  windowWidth: number;


  autoScrollDone = false;

  constructor(private transitService: TransitService,
              private sharedDataService: SharedDataService,
              private timerService: TimerService,
              private infoWindowManager: InfoWindowManager) {

  }

  ngAfterViewChecked() {

    // Get Height and width of infoWindow
    this.stop.height = this.elementView.nativeElement.offsetHeight;
    this.stop.width = this.elementView.nativeElement.offsetWidth;

  }


  ngOnDestroy(): void {
    if (this.timerService.unsubscribe(this.timerId)) {
      // console.log("Timer: " + this.timerId + " Unsubscribed");
    }
  }

  ngOnInit() {

    this.windowWidth = window.innerWidth;

    if (!this.routes) {
      // this.routes = [];
      this.transitService.getRoutes(this.stop.stop_id, this.city_code).then(routes => {

        // console.log(JSON.stringify(routes));

        this.routes = routes;
        this.routes.forEach(route => {
          route.trip_headsign = route.trip_headsign.replace('_', ' ');
        });

        // TODO move this out to Grand Central Dispatch
        this.timerName = '1sec-' + this.stop.stop_id;
        this.timerService.newTimer(this.timerName, 1);

        if (this.routes.length === 2) {
          this.routes[0].selected = true;
          this.routes[1].selected = true;
          this.expandToggle = false;
          this.monitorBuses(false);
        }
        if (this.routes.length === 1) {
          this.routes[0].selected = true;
          this.monitorBuses(false);
        }

        // Make sure window is at the top
        this.parent.zIndex = this.sharedDataService.getNextZindex();
        this.infoWindowManager.setZIndex(this.parent);
        this.stop.zIndex = this.parent.zIndex;

        console.log('Open with zIndex:' + this.stop.zIndex);

        // This kicks off Autoscroll after data has loaded
        this.infoWindowManager.open(this.parent);

      });

      // this.transitService.getNextTripsForStopAllRoutes(this.stop.stop_code).then(data => {
      //  console.log("DEBUG" + JSON.stringify(data));
      // });

    }
  }

  monitorBuses(checkForTime: boolean): void {

    if (!this.isActive()) {
      alert('Select one or more buses to monitor arrival information on.');
      return;
    }

    if (checkForTime) {
      if (!(this.deltaProcessingTime > 20161220115550) && this.counter < 5) {
        window.setTimeout(() => {
          // alert("Last update: " + this.deltaProcessingTime + " ago. Please wait 10 seconds between updates.");
          this.beep();
        });
        return;
      }
    }

    if (this.busy) {
      return;
    }

    this.busy = true;

    this.selected_routes = this.routes.filter(route => {
      return route.selected;
    });
    const trips = this.tripStringOCTranspo();

    this.stopTimer(); // stop updating until back from server

    this.transitService.getTrips(trips).then(busArrivals => {

      this.busArrivals = busArrivals;

      // this.busArrivals.forEach(stops => {
      //  stops.routes.forEach(trips => {
      //  });
      // })

      // console.log(JSON.stringify(busArrivals));
      this.subscribeTimer();
      // restart the counter
      this.counter = 0;
      this.busy = false;

      this.makeCalculatedFields();

      this.makeDeltaProcesingTime();

      if (!this.autoScrollDone) {
        // This kicks off Autoscroll (for the last time) after data has loaded
        this.infoWindowManager.open(this.parent);
        this.autoScrollDone = true;
      }

    });

    // TODO List of stops onroute to make PolyLine with stop markers and moving bus functions
    // this.transitService.getTripList(this.tripStringGeneric(), "oc", 3 ).then(data =>{
    //  console.log("getTripList: " + JSON.stringify(data));
    // })

    // TODO latest service needs to be implemented
    // this.transitService.getNextTripsForStop(this.stop.stop_code ,this.selected_routes[0].route_number).then(data => {
    //  console.log(JSON.stringify(data));
    // });

  }

  toggleExpand() {
    this.expandToggle = !this.expandToggle;
  }

  selectBus(i) {
    this.routes[i].selected = !this.routes[i].selected;
    // alert("You selected Bus: " + this.routes[i].trip_headsign );
  }

  getStyle(i) {
    return this.routes[i].selected ? 'orange' : 'white';
  }

  isActive() {
    let active = false;
    this.routes.forEach(route => {
      if (route.selected) {
        active = true;
      }
    });
    return active;
  }

  getHeaderStyle() {
    let active = false;
    this.routes.forEach(route => {
      if (route.selected) {
        active = true;
      }
    });
    return this.isActive() ? 'lightgrey' : 'white';
  }

  getConfidenceText(adjustmentAge: number) {
    if (adjustmentAge < 0) {
      return 'Sched.';
    }
    let text = 'Stale';
    if (adjustmentAge < 0.5) {
      text = 'Good';
    } else if (adjustmentAge < 1) {
      text = 'Okay';
    }
    const elapsed = Number(adjustmentAge) + this.counter / 60;
    return Utils.toMS(elapsed);
  }

  getConfidenceColor(adjustmentAge: number) {

    if (adjustmentAge < 0) {
      return 'lightgrey';
    }

    const elapsed = Number(adjustmentAge) + this.counter / 60;

    let color = 'red';
    if (elapsed < 0.66) {
      color = 'lightgreen';
    } else if (elapsed < 1.66) {
      color = 'yellow';
    }
    return color;
  }

  bringForward() {

    const stopA: number[] = Utils.latLngToPixelCoords(this.latitude, this.longitude, this.map);
    const rectA = new InfoBox();
    rectA.position = stopA;
    rectA.width = this.stop.width;
    rectA.height = this.stop.height;

    let overlapFlag = false;
    let maxZ = 1;
    // Loop through open stops to find overlaps
    const stopsArray: Stop[] = this.selected_stops.Values();
    stopsArray.forEach(stop => {
      if (this.stop.stop_id !== stop.stop_id) {

        const stopB: number[] = Utils.latLngToPixelCoords(stop.stop_lat, stop.stop_lng, this.map);
        const rectB = new InfoBox();
        rectB.position = stopB;
        rectB.height = stop.height;
        rectB.width = stop.width;

        if (Utils.overlaps(rectA, rectB, this.map)) {
          overlapFlag = true;
          if (stop.zIndex > maxZ) {
            maxZ = stop.zIndex
          }
          console.log('Stop: ' + this.stop.stop_name + ' overlaps with ' + stop.stop_name);
        }

      }
    });

    if (overlapFlag) {
      if (this.stop.zIndex < maxZ) {

        this.parent.zIndex = this.sharedDataService.getNextZindex();
        this.infoWindowManager.setZIndex(this.parent);
        this.stop.zIndex = this.parent.zIndex;
        console.log('Current zIndex: ' + this.sharedDataService.getCurrentZindex());

      }

    }

  }

  sendBack() {
  }

  showBuses() {
    this.busArrivals = null;
  }

  // "https://geopad.ca/js/oc_bus_json.php?trips=706b118_64"
  // https://geopad.ca/js/oc_bus_json.php?trips=3017b111_729b86_371
  //        stop_code +    b + route_number + _ + headsign_id +     b + route_number + _ + headsign_id +     b...
  // trips = "3017b70_390b71_389b72_383"
  // {"route_number":"86","trip_headsign":"86_Baseline  Colonnade","headsign_id":"369"}

  private tripStringOCTranspo() {
    let trips = '';
    if (this.city_code === 'oc') {
      trips = '' + this.stop.stop_code;
      this.selected_routes.forEach(route => {
        trips += 'b' + route.route_number + '_' + route.headsign_id;
      });
    }
    return trips;
  }

  // Note uses stop_id instead of stop_code
  private tripStringGeneric() {
    let trips = '';
    if (this.city_code === 'oc') {
      trips = '' + this.stop.stop_id;
      this.selected_routes.forEach(route => {
        trips += 'b' + route.route_number + '_' + route.headsign_id;
      });
    }
    return trips;
  }

  // Simple Timer

  subscribeTimer() {

    if (this.timerId) {
      return;
    }
    // Subscribe if timer Id is undefined (one time only)
    this.timerId = this.timerService.subscribe(this.timerName, e => this.timercallback());
  }

  stopTimer() {
    if (this.timerService.unsubscribe(this.timerId)) {
      this.timerId = null;
    }
  }

  toPrecission(val, precission) {
    return Utils.toPrecission(val, precission);
  }

  timercallback() {
    if (!this.busy) {
      this.counter++;
    }
    this.autoUpdate(this.counter);
  }

  timeLeft(tripForStop: TripForStop) {

    const distance = tripForStop.DistanceToStop;
    // let minutes: number = (adjustedScheduleTime * 60 - this.counter) / 60;
    let minutes: number = this.arrivalSeconds(Number(tripForStop.AdjustedScheduleTime)) / 60;
    if (distance > 0) {
      minutes = minutes - Number(tripForStop.AdjustmentAge);
      if (distance < 200) {
        return 'Arrived!';
      }
      if (distance < 500) {
        if (minutes < 0) {
          return 'Arrived!';
        }
        return 'Arriving in ' + Utils.toMS(minutes);
      }
    }
    if (minutes < 0) {
      const adjustmentAge = Number(tripForStop.AdjustmentAge);
      // console.log('adjustmentAge: ' + adjustmentAge);
      if (adjustmentAge < 0) {
        // This is a scheduled time so theoretically this should never happen
        return 'Scheduled ' + Utils.toMS(Math.abs(minutes)) + ' ago!';
      }
      if (adjustmentAge < 2) {
        // Less than 2 indicates good probability of correct estimate
        return 'Arrived ' + Utils.toMS(Math.abs(minutes)) + ' ago!';
      }
      return 'Arrival: ?????';
    }
    return 'Arrival: ' + Utils.toMS(minutes);
  }

  countdown(tripForStop: TripForStop) {
    const timeLeft = this.timeLimit(Number(tripForStop.AdjustmentAge), Number(tripForStop.AdjustedScheduleTime)) - this.counter;
    return 'Next update in ' + Utils.toMS(timeLeft / 60) + ' elapsed: ' + Utils.toMS(this.counter / 60);
  }

  private arrivalSeconds(adjustedScheduleTime: number): number {
    return adjustedScheduleTime * 60 - this.counter;
  }

  private timeLimit(adjustmentAge: number, adjustedScheduleTime: number) {
    if (adjustmentAge < 0) {
      return 120;
    }
    // Number of seconds till predicted bus arrival
    const arrivalSeconds: number = this.arrivalSeconds(adjustedScheduleTime); // adjustedScheduleTime * 60 - this.counter;

    if (arrivalSeconds > 900) {
      return arrivalSeconds;
    }

    if ((arrivalSeconds < 120 && arrivalSeconds > 0) && (Number(adjustmentAge) > 0.5)) {
      // ping every 10 seconds
      return 10;
    }

    if (arrivalSeconds > 0 && arrivalSeconds < 120) {
      return 120; // do not update since our estimated time is now more accurate
    }

    // Default values
    const adjustmentAgeSeconds: number = adjustmentAge * 60;
    if (adjustmentAgeSeconds > 60) {
      return 60;
    }
    return 120 - adjustmentAgeSeconds;
  }

  private distanceToStop(tripForStop: TripForStop) {
    if (Number(tripForStop.AdjustmentAge) < 0) {
      return Number(tripForStop.AdjustmentAge);
    }
    const stopLatLng = new google.maps.LatLng(this.stop.stop_lat, this.stop.stop_lng);
    const busLatLng = new google.maps.LatLng(Number(tripForStop.Latitude), Number(tripForStop.Longitude));
    const delta: number = google.maps.geometry.spherical.computeDistanceBetween(stopLatLng, busLatLng);
    return delta;
  }

  /**
   * called once every 10 seconds - deprecated
   * TODO do not auto-update if number of buses being monitored is larger than 3
   */
  private autoUpdate(counter: number) {

    if (this.busArrivals) {
      // if (counter % 10 == 0) {
      this.busArrivals.forEach(busArrival => {
        const count = busArrival.routes.length;
        busArrival.routes.forEach(route => {
          route.trips.forEach(trip => {
            trip.tripsForStop.forEach(tripForStop => {
              if (Number(tripForStop.BusIndex) === 0) {

                // Handle case for scheduled bus arrivals
                if (Number(tripForStop.AdjustmentAge) < 0) {
                  if (Number(tripForStop.AdjustedScheduleTime) * 60 - this.counter === 0) {
                    if (count < 4) {
                      this.monitorBuses(false);
                    }
                  }
                }
                // if time is less than 2 minutes
                const distance: number = tripForStop.DistanceToStop;
                if (
                  this.counter > this.timeLimit(Number(tripForStop.AdjustmentAge), Number(tripForStop.AdjustedScheduleTime))
                  || ((distance > 0 && distance < 100) && this.counter > 10)) {
                  if (count < 4) {
                    this.monitorBuses(false);
                  }
                }
              }
            });
          });
        });
      });
      // }
    }
  }

  makeCalculatedFields() {
    if (this.busArrivals) {
      this.busArrivals.forEach(busArrival => {
        busArrival.routes.forEach(route => {
          route.trips.forEach(trip => {
            trip.tripsForStop.forEach(tripForStop => {
              tripForStop.EstimatedArrivalTime = this.makeEstimatedArrivalTime(tripForStop);
              tripForStop.DistanceToStop = this.distanceToStop(tripForStop);
            });
          });
        });
      });
    }
  }

  makeEstimatedArrivalTime(tripForStop: TripForStop) {
    const now = new Date();
    const arrival = new Date(now.getTime() + Number(tripForStop.AdjustedScheduleTime) * 60000);
    // return arrival.toLocaleTimeString();
    const minutes = Math.round(arrival.getMinutes() + arrival.getSeconds() / 60);
    const str_minutes = minutes < 10 ? '0' + minutes : minutes;
    return arrival.getHours() + ':' + str_minutes;
  }

  private makeDeltaProcesingTime() {

    if (this.busArrivals[0].routes[0].trips[0]) {
      const prTime: number = Number(this.busArrivals[0].routes[0].trips[0].RequestProcessingTime);

      if (this.deltaProcessingTime == null) {
        this.deltaProcessingTime = 0;
        this.lastProcessingTime = prTime;
        return;
      }

      // console.log('prTime: ' + prTime + ' this.lastProcessingTime: ' + this.lastProcessingTime);
      this.deltaProcessingTime = prTime - this.lastProcessingTime;
      // console.log('deltaProcessingTime: ' + this.deltaProcessingTime);
      this.lastProcessingTime = prTime;
    }
  }

  beep() {

    const snd = new Audio(OgoConstants.BEEP_WAVE);
    snd.play();

  }
}


/*

 Bus Type Formats
 Here is the list of bus types with different letters: 4,6,40,60,DD, E,EA, A, L, B, DEH

 4 or 40 = 40-foot buses
 6 or 60 = 60-foot buses
 4 and 6 = trips can be done by 60 or 40-foot buses
 DD = Double-Decker buses
 E, L, A, EA means low-floor Easy Access
 B = Bike Rack
 DEH = Diesel Electric Hybrid
 IN = INVIRO (bus type)
 ON = ORION (bus type)


 */
