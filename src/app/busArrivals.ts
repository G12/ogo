export class BusArrivals {
  stop_no:string;
  stop_name:string;
  stop_id:string;
  stop_code:string;
  stop_lat:string;
  stop_lng:string;
  routes:BusRoute[];
}

export class BusRoute {
  route_no:string;
  trips:Trip[];
}

export class Trip{
  Direction:string;
  StopLabel:string;
  StopNo:string;
  RouteLabel:string;
  RouteNo:string;
  RequestProcessingTime:string;
  tripsForStop:TripForStop[];
}

export class TripForStop{
  BusIndex:string;
  stop_no:string;
  stop_name:string;
  stop_id:string;
  stop_code:string;
  stop_lat:string;
  stop_lng:string;
  StopLabel:string;
  StopNo:string;
  Direction:string;
  RouteLabel:string;
  RouteNo:string;
  AdjustedScheduleTime:string;
  AdjustmentAge:string; //see Notes
  TripDestination:string;
  TripStartTime:string;
  LastTripOfSchedule:string;
  BusType:string;
  Latitude:string;
  Longitude:string;
  GPSSpeed:string;
  /*Custom*/
  EstimatedArrivalTime:string;
  DistanceToStop:number;
}

/*
 AdjustmentAge indicates the last time (in minutes and adjusted in whole and fractional minutes) when the GPS data available for the bus was used to determine the AdjustedScheduleTime. The higher the number the less reliable the AdjustedScheduleTime is.

 If the AdjustmentAge is a negative value, it indicates that the AdjustedScheduleTime contains the planned scheduled time.

 */