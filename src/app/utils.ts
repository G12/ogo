import * as _ from 'lodash';

export class MapExtents {
  lat_low: number;
  lat_high: number;
  lon_low: number;
  lon_high: number;
}

export class Utils {

  static pixToMapExtents(pixelWidth: number, pixelHeight: number, lat: number, lng: number): MapExtents {

    let fudgeFactor: number = 0.8;

    let diagonal: number = Math.sqrt(pixelWidth * pixelWidth + pixelHeight * pixelHeight);

    if (diagonal < 800) {
      fudgeFactor = 1.2;
    }

    console.log("diagonal: " + diagonal);

    let aspectRatio: number = pixelWidth / pixelHeight;
    let verOffset: number = diagonal < 1600 ? diagonal * fudgeFactor / 1000 : 1600 * fudgeFactor / 1000; //kilommeters
    let horOffset: number = verOffset * aspectRatio;

    //Determine mapExtents according to size of screen
    //if(diagonal < 665) // phones
    //else if(diagonal < 1200)  //tablets
    //else if(diagonal < 1600)
    //2876 rugle2

    let mapExtents = new MapExtents();

    mapExtents.lat_high = Utils.destinationPoint(lat, lng, 0, verOffset).lat;
    mapExtents.lat_low = Utils.destinationPoint(lat, lng, 180, verOffset).lat;
    mapExtents.lon_high = Utils.destinationPoint(lat, lng, 90, horOffset).lng;
    mapExtents.lon_low = Utils.destinationPoint(lat, lng, 270, horOffset).lng;

    return mapExtents;
  }

  static degToMapExtents(degWidth: number, degHeight: number): MapExtents {
    return null;
  }

  static toRad(a) {
    return a * Math.PI / 180;
  }

  static toDeg(a) {
    return a * 180 / Math.PI;
  }

  static toMS(minutes) {
    let sign = minutes < 0 ? "-" : "";
    var min = Math.floor(Math.trunc(minutes));
    var sec = Math.abs(Math.round(60 * (minutes - min)));
    let secStr: string = "" + sec;
    if (sec < 10) {
      secStr = "0" + sec;
    }
    return sign + Math.abs(min) + ":" + secStr;
  }

  static toPrecission(val, precission) {
    return _.floor(val,precission);
  }

  static destinationPoint(lat: number, lng: number, brng: number, dist: number) {
    dist = dist / 6371;
    brng = Utils.toRad(brng);

    let lat1 = Utils.toRad(lat);
    let lon1 = Utils.toRad(lng);

    let lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) +
      Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));

    let lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) *
        Math.cos(lat1),
        Math.cos(dist) - Math.sin(lat1) *
        Math.sin(lat2));

    if (isNaN(lat2) || isNaN(lon2)) return null;

    return {lat: Utils.toDeg(lat2), lng: Utils.toDeg(lon2)};
  }

  static computeDistanceBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = Utils.toRad(lat2 - lat1);  // deg2rad below
    var dLon = Utils.toRad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(Utils.toRad(lat1)) * Math.cos(Utils.toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
  }

}