import {Component, OnInit, Input, OnDestroy} from '@angular/core';

import {AgmInfoWindow, AgmMarker, InfoWindowManager} from '@agm/core';

import {TimerService} from '../timer.service';
import {KeyedCollection} from '../keyed-collection';
import {Utils} from '../utils';

/////////////////////   Bus Routes  /////////////////
import {TransitService} from '../transit.service';
import {Route} from '../route';

import {Stop} from '../stop';
import {BusArrivals, BusRoute, Trip, TripForStop} from '../busArrivals';

import {} from '@types/googlemaps';

@Component({
  selector: 'bus-stop-info-window',
  templateUrl: './bus-stop-info-window.component.html',
  styleUrls: ['./bus-stop-info-window.component.css']
})

export class BusStopInfoWindowComponent implements OnInit, OnDestroy {

  @Input() city_code: string;
  @Input() stop: Stop;
  @Input() parent: AgmInfoWindow;
  @Input() marker: AgmMarker;
  @Input() bus_stop_gb: string;
  @Input() selected_stops: KeyedCollection<Stop>;
  @Input() map: google.maps.Map;

  zIndex: number = -1;

  routes: Route[]; // {"route_number":"86","trip_headsign":"86_Baseline  Colonnade","headsign_id":"369"}
  busArrivals: BusArrivals[];

  selected_routes: Route[];

  //TimerService
  timerId: string;
  timerName: string;
  counter: number = 0;
  deltaProcessingTime: number;
  lastProcessingTime: number;
  busy: boolean = false;

  //Trips For Stop Cards
  expandToggle: boolean = true;

  windowWidth: number;

  constructor(private transitService: TransitService,
              private timerService: TimerService,
              private infoWindowManager: InfoWindowManager) {

  }

  ngOnDestroy(): void {
    if (this.timerService.unsubscribe(this.timerId)) {
      //console.log("Timer: " + this.timerId + " Unsubscribed");
    }
  }

  ngOnInit() {

    this.windowWidth = window.innerWidth;

    if (!this.routes) {
      //this.routes = [];
      this.transitService.getRoutes(this.stop.stop_id, this.city_code).then(routes => {

        //console.log(JSON.stringify(routes));

        this.routes = routes;
        this.routes.forEach(route => {
          route.trip_headsign = route.trip_headsign.replace("_", ' ');
        });

        //TODO move this out to Grand Central Dispatch
        this.timerName = '1sec-' + this.stop.stop_id;
        this.timerService.newTimer(this.timerName, 1);

        if (this.routes.length == 2) {
          this.routes[0].selected = true;
          this.routes[1].selected = true;
          this.expandToggle = false;
          this.monitorBuses(false);
        }
        if (this.routes.length == 1) {
          this.routes[0].selected = true;
          this.monitorBuses(false);
        }

        //This kicks off Autoscroll after data has loaded
        this.infoWindowManager.open(this.parent);

      });

      //TODO update to OC Transpo JSON data See: /Applications/MAMP/htdocs/surrealranch/public_html/geopad.ca/js
      //this.transitService.getNextTripsForStopAllRoutes(this.stop.stop_code).then(data => {
      //  console.log("DEBUG" + JSON.stringify(data));
      //});

    }
  }

  monitorBuses(checkForTime: boolean): void {

    if (!this.isActive()) {
      alert("Select one or more buses to monitor arrival information on.");
      return;
    }

    if (checkForTime) {
      if (!(this.deltaProcessingTime > 20161220115550) && this.counter < 5) {
        window.setTimeout(() => {
          //alert("Last update: " + this.deltaProcessingTime + " ago. Please wait 10 seconds between updates.");
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
    })
    let trips = this.tripStringOCTranspo();

    this.stopTimer(); //stop updating until back from server

    this.transitService.getTrips(trips).then(busArrivals => {

      this.busArrivals = busArrivals;

      this.busArrivals.forEach(stops => {
        stops.routes.forEach(trips => {

        })
      })


      //console.log(JSON.stringify(busArrivals));
      this.subscribeTimer();
      //restart the counter
      this.counter = 0;
      this.busy = false;

      this.makeCalculatedFields();

      this.makeDeltaProcesingTime();

      //This kicks off Autoscroll after data has loaded
      this.infoWindowManager.open(this.parent);

    });

    //TODO List of stops onroute to make PolyLine with stop markers and moving bus functions
    //this.transitService.getTripList(this.tripStringGeneric(), "oc", 3 ).then(data =>{
    //  console.log("getTripList: " + JSON.stringify(data));
    //})

    //TODO latest service needs to be implemented
    //this.transitService.getNextTripsForStop(this.stop.stop_code ,this.selected_routes[0].route_number).then(data => {
    //  console.log(JSON.stringify(data));
    //});

  }

  toggleExpand() {
    this.expandToggle = !this.expandToggle;
  }

  selectBus(i) {
    this.routes[i].selected = !this.routes[i].selected;
    //alert("You selected Bus: " + this.routes[i].trip_headsign );
  }

  getStyle(i) {
    return this.routes[i].selected ? "orange" : "white";
  }

  isActive() {
    var active: boolean = false;
    this.routes.forEach(route => {
      if (route.selected) {
        active = true;
      }
    });
    return active;
  }

  getHeaderStyle() {
    var active: boolean = false;
    this.routes.forEach(route => {
      if (route.selected) {
        active = true;
      }
    });
    return this.isActive() ? "lightgrey" : "white";
  }

  getConfidenceText(adjustmentAge: number) {
    if (adjustmentAge < 0) return "Sched.";
    let text: string = "Stale";
    if (adjustmentAge < 0.5) {
      text = "Good";
    }
    else if (adjustmentAge < 1) {
      text = "Okay";
    }
    let elapsed: number = Number(adjustmentAge) + this.counter / 60;
    return Utils.toMS(elapsed);
  }

  getConfidenceColor(adjustmentAge: number) {

    if (adjustmentAge < 0) return "lightgrey";

    let elapsed: number = Number(adjustmentAge) + this.counter / 60;

    let color: string = "red";
    if (elapsed < 0.66) {
      color = "lightgreen";
    }
    else if (elapsed < 1.66) {
      color = "yellow";
    }
    return color;
  }

  sendBack() {
    this.parent.zIndex = this.zIndex--;
    this.infoWindowManager.setZIndex(this.parent);
  }

  showBuses() {
    this.busArrivals = null;
  }

  //"https://geopad.ca/js/oc_bus_json.php?trips=706b118_64"
  //https://geopad.ca/js/oc_bus_json.php?trips=3017b111_729b86_371
  //        stop_code +    b + route_number + _ + headsign_id +     b + route_number + _ + headsign_id +     b...
  //trips = "3017b70_390b71_389b72_383"
  // {"route_number":"86","trip_headsign":"86_Baseline  Colonnade","headsign_id":"369"}

  private tripStringOCTranspo() {
    var trips: string = ""
    if (this.city_code == "oc") {
      trips = "" + this.stop.stop_code;
      this.selected_routes.forEach(route => {
        trips += "b" + route.route_number + "_" + route.headsign_id;
      });
    }
    return trips;
  }

  //Note uses stop_id instead of stop_code
  private tripStringGeneric() {
    var trips: string = ""
    if (this.city_code == "oc") {
      trips = "" + this.stop.stop_id;
      this.selected_routes.forEach(route => {
        trips += "b" + route.route_number + "_" + route.headsign_id;
      });
    }
    return trips;
  }

  //Simple Timer

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

    let distance:number = tripForStop.DistanceToStop;
    //let minutes: number = (adjustedScheduleTime * 60 - this.counter) / 60;
    let minutes: number = this.arrivalSeconds(Number(tripForStop.AdjustedScheduleTime)) / 60;
    if(distance > 0)
    {
      minutes = minutes - Number(tripForStop.AdjustmentAge);
      if(distance < 200){
        return "Arrived!";
      }
      if(this.distanceToStop(tripForStop) < 500){
        return "Arriving in " + Utils.toMS(minutes);
      }
    }
    if (minutes < 0) {
      return "Arrived " + Utils.toMS(Math.abs(minutes)) + " ago!";
    }
    return "Arrival: " + Utils.toMS(minutes);
  }

  countdown(tripForStop:TripForStop) {
    let timeLeft = this.timeLimit(Number(tripForStop.AdjustmentAge), Number(tripForStop.AdjustedScheduleTime)) - this.counter;
    return "Next update in " + Utils.toMS(timeLeft / 60) + " elapsed: " + Utils.toMS(this.counter / 60);
  }

  private arrivalSeconds(adjustedScheduleTime: number): number {
    return adjustedScheduleTime * 60 - this.counter;
  }

  private timeLimit(adjustmentAge: number, adjustedScheduleTime: number) {
    if (adjustmentAge < 0) {
      return 120;
    }
    //Number of seconds till predicted bus arrival
    let arrivalSeconds: number = this.arrivalSeconds(adjustedScheduleTime);//adjustedScheduleTime * 60 - this.counter;

    if (arrivalSeconds > 900) {
      return arrivalSeconds;
    }

    if ((arrivalSeconds < 120 && arrivalSeconds > 0) && (Number(adjustmentAge) > 0.5))//ping every 10 seconds
    {
      return 10;
    }
    if (arrivalSeconds > 0 && arrivalSeconds < 120) {
      return 120; //do not update since our estimated time is now more accurate
    }

    //Default values
    let adjustmentAgeSeconds: number = adjustmentAge * 60;
    if (adjustmentAgeSeconds > 60) {
      return 60;
    }
    return 120 - adjustmentAgeSeconds;
  }

  private distanceToStop(tripForStop:TripForStop){
    if(Number(tripForStop.AdjustmentAge) < 0)
    {
      return Number(tripForStop.AdjustmentAge);
    }
    let stopLatLng = new google.maps.LatLng(this.stop.stop_lat, this.stop.stop_lng);
    let busLatLng = new google.maps.LatLng(Number(tripForStop.Latitude), Number(tripForStop.Longitude));
    let delta:number = google.maps.geometry.spherical.computeDistanceBetween(stopLatLng, busLatLng);
    return delta;
  }

  /**
   * called once every 10 seconds
   */
  private autoUpdate(counter: number) {

    if (this.busArrivals) {
      //if (counter % 10 == 0) {
      this.busArrivals.forEach(busArrival => {
        busArrival.routes.forEach(route => {
          route.trips.forEach(trip => {
            trip.tripsForStop.forEach(tripForStop => {
              if (Number(tripForStop.BusIndex) == 0) {

                //Handle case for scheduled bus arrivals
                if(Number(tripForStop.AdjustmentAge) < 0)
                {
                  if(Number(tripForStop.AdjustedScheduleTime) * 60 - this.counter == 0){
                    this.monitorBuses(false);
                  }
                }
                //if time is less than 2 minutes
                let distance:number = tripForStop.DistanceToStop;
                if (
                      this.counter > this.timeLimit(Number(tripForStop.AdjustmentAge), Number(tripForStop.AdjustedScheduleTime))
                      || ((distance > 0 && distance < 100) && this.counter > 10))
                {
                  this.monitorBuses(false);
                }
              }
            });
          });
        });
      });
      //}
    }
  }

  makeCalculatedFields(){
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

  makeEstimatedArrivalTime(tripForStop: TripForStop){
    let now = new Date();
    var arrival = new Date(now.getTime() + Number(tripForStop.AdjustedScheduleTime)*60000);
    //return arrival.toLocaleTimeString();
    let minutes = Math.round(arrival.getMinutes() + arrival.getSeconds()/60);
    let str_minutes = minutes < 10 ? "0" + minutes : minutes;
    return arrival.getHours() + ":" + str_minutes;
  }

  private makeDeltaProcesingTime() {

    if (this.busArrivals[0].routes[0].trips[0]) {
      let prTime: number = Number(this.busArrivals[0].routes[0].trips[0].RequestProcessingTime);

      if (this.deltaProcessingTime == null) {
        this.deltaProcessingTime = 0;
        this.lastProcessingTime = prTime;
        return
      }

      console.log("prTime: " + prTime + " this.lastProcessingTime: " + this.lastProcessingTime);
      this.deltaProcessingTime = prTime - this.lastProcessingTime;
      console.log("deltaProcessingTime: " + this.deltaProcessingTime);
      this.lastProcessingTime = prTime;
    }
  }

  beep() {
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
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