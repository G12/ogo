/**
 * Obtains the geographic position, in terms of latitude and longitude coordinates, of the device.
 * @param {Object} [opts] See: https://www.w3.org/TR/geolocation-API/#geolocation_interface
 * @returns {Observable} An observable sequence with the geographical location.
 */

import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Position} from './geolocation-api';

const GEOLOCATION_ERRORS = {
  'errors.location.unsupportedBrowser': 'Browser does not support location services',
  'errors.location.permissionDenied': 'You have rejected access to your location',
  'errors.location.positionUnavailable': 'Unable to determine your location',
  'errors.location.timeout': 'Service timeout has been reached'
};

@Injectable()
export class GeolocationService {

  watchId: any;

  // constructor() { }

  public getLocation(opts): Observable<Position> {
    return Observable.create(observer => {
      if (window.navigator && window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(
          (position: Position) => {
            observer.next(position);
            observer.complete();
          },
          (error) => {
            this.handleError(observer, error);
          },
          opts);
      } else {
        observer.error(GEOLOCATION_ERRORS['errors.location.unsupportedBrowser']);
      }
    });
  }

  public watchPosition(opts): Observable<Position> {
    return Observable.create(observer => {
      if (window.navigator && window.navigator.geolocation) {
        this.watchId = window.navigator.geolocation.watchPosition(
          (position: Position) => {
            observer.next(position);
          },
          (error) => {
            this.handleError(observer, error);
          },
          opts);
      } else {
        observer.error(GEOLOCATION_ERRORS['errors.location.unsupportedBrowser']);
      }
    });
  }

  handleError(observer, error) {
    switch (error.code) {
      case 1:
        observer.error(GEOLOCATION_ERRORS['errors.location.permissionDenied']);
        break;
      case 2:
        observer.error(GEOLOCATION_ERRORS['errors.location.positionUnavailable']);
        break;
      case 3:
        observer.error(GEOLOCATION_ERRORS['errors.location.timeout']);
        break;
    }
  }

  clearWatch() {
    navigator.geolocation.clearWatch(this.watchId);
  }

}
