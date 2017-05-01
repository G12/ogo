export class TripList {
  stops: BusesForStop[];
}

export class BusesForStop {
  stop: string; //stop_id
  buses: BusRoute[];
}

export class BusRoute {
  route_number: string;
  headsign_id: string;
  stop_id: string;
  schedule: ConnectionDetails[];
  routes: RouteMap[];
}

export class ConnectionDetails {
  route_id: string;
  departure_time: string;
  arrival_time: string;
  departure_seconds: string;
  arrival_seconds: string;
}

export class RouteMap {
  service_id: string;
  route_id: string;
  trip_headsign: string;
  headsign_id: string;
  count: string;
  route: RouteDetails;
}

export class RouteDetails {
  ID:string;
  trip_headsign:string;
  route_number:string;
  route_id:string;
  service_id:string;
  count:string;
  stops:StopLocation[];
}

export class StopLocation{
  i:string; //stop_id
  c:string; //stop_code
  l:string; //lattitude
  n:string; //longitude
  w:string; //wait time in seconds
  d:string; //drive time from last stop to this stop in seconds
}
