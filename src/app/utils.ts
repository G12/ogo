import * as _ from 'lodash';
import {} from '@types/googlemaps';

export class MapExtents {
  lat_low: number;
  lat_high: number;
  lon_low: number;
  lon_high: number;
}

export class InfoBox {
  height: number;
  width: number;
  position: number[];
}

export class Utils {

  static pixToMapExtents(pixelWidth: number, pixelHeight: number, lat: number, lng: number): MapExtents {

    let fudgeFactor = 0.8;

    const diagonal = Math.sqrt(pixelWidth * pixelWidth + pixelHeight * pixelHeight);

    if (diagonal < 800) {
      fudgeFactor = 1.2;
    }

    // console.log('diagonal: ' + diagonal);

    const aspectRatio: number = pixelWidth / pixelHeight;
    const verOffset: number = diagonal < 1600 ? diagonal * fudgeFactor / 1000 : 1600 * fudgeFactor / 1000; //kilommeters
    const horOffset: number = verOffset * aspectRatio;

    // Determine mapExtents according to size of screen
    // if(diagonal < 665) // phones
    // else if(diagonal < 1200)  //tablets
    // else if(diagonal < 1600)
    // 2876 wide screen

    const mapExtents = new MapExtents();

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
    const sign = minutes < 0 ? '-' : '';
    const min = Math.floor(Math.trunc(minutes));
    const sec = Math.abs(Math.round(60 * (minutes - min)));
    let secStr: string = '' + sec;
    if (sec < 10) {
      secStr = '0' + sec;
    }
    return sign + Math.abs(min) + ':' + secStr;
  }

  static toPrecission(val, precission) {
    return _.floor(val, precission);
  }

  static destinationPoint(lat: number, lng: number, brng: number, dist: number) {
    dist = dist / 6371;
    brng = Utils.toRad(brng);

    const lat1 = Utils.toRad(lat);
    const lon1 = Utils.toRad(lng);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) +
      Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));

    const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) *
        Math.cos(lat1),
        Math.cos(dist) - Math.sin(lat1) *
        Math.sin(lat2));

    if (isNaN(lat2) || isNaN(lon2)) { return null; }

    return {lat: Utils.toDeg(lat2), lng: Utils.toDeg(lon2)};
  }

  static computeDistanceBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = Utils.toRad(lat2 - lat1);  // deg2rad below
    const dLon = Utils.toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(Utils.toRad(lat1)) * Math.cos(Utils.toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  static latLngToPixelCoords(lat: number, lng: number, map: google.maps.Map) {
    const latLng = new google.maps.LatLng(lat, lng);
    const projection = map.getProjection();
    const bounds = map.getBounds();
    const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
    const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
    const scale = Math.pow(2, map.getZoom());
    const worldPoint = projection.fromLatLngToPoint(latLng);
    return [Math.floor((worldPoint.x - bottomLeft.x) * scale), Math.floor((worldPoint.y - topRight.y) * scale)];
  }

  static overlaps(RectA: InfoBox, RectB: InfoBox, map: google.maps.Map) {

    const LEFT_MARGIN = 15;
    const RIGHT_MARGIN = 38;
    const TOP_MARGIN = 9;
    const BOTTOM_MARGIN = 30;

    const offset = Utils.pointerOffset(map.getZoom());

    let x = RectA.position[0];
    let y = RectA.position[1] - offset;

    const ax1 = x - RectA.width / 2 - LEFT_MARGIN;
    const ay1 = y - BOTTOM_MARGIN - RectA.height - TOP_MARGIN;
    const ax2 = x + RectA.width / 2 + RIGHT_MARGIN;
    const ay2 = y;

    x = RectB.position[0];
    y = RectB.position[1] - offset;

    const bx1 = x - RectB.width / 2 - LEFT_MARGIN;
    const by1 = y - BOTTOM_MARGIN - RectB.height - TOP_MARGIN;
    const bx2 = x + RectB.width / 2 + RIGHT_MARGIN;
    const by2 = y;

    return (ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1);

    // if (RectA.X1 < RectB.X2 && RectA.X2 > RectB.X1 &&
    // RectA.Y1 > RectB.Y2 && RectA.Y2 < RectB.Y1)

  }

  /**
   * Note see google-map-component boundsChanged
   * Pixel heights are based on those icons
   * @param zoomLevel
   */
  static pointerOffset(zoomLevel: number) {
    const POINTER_HEIGHT = 30;
    let h: number;
    if (zoomLevel > 14) {
      h = 37; // assets/bus_stop_gb14.png'
    } else if (zoomLevel > 13) {
      h = 31; // assets/bus_stop_gb13.png'
    } else if (zoomLevel > 12) {
      h = 18; // assets/bus_stop_gb12.png'
    } else if (zoomLevel > 11) {
      h = 10; // assets/bus_stop_gb11.png'
    } else {
      h = 5; // assets/bus_stop_gb0.png'
    }
    return POINTER_HEIGHT + h;
  }

  static googleDateToDateString(googleDate: string) {

    const year = Number(googleDate.substring(0, 4));
    const month = Number(googleDate.substring(4, 6)) - 1;
    const day = Number(googleDate.substring(6, 8));
    const d = new Date(year, month, day);

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);

  }
}
