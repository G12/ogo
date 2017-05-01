export interface GeolocationApi {

}

interface Navigator {
  geolocation: Geolocation;
}

export interface Geolocation {

  getCurrentPosition(successCallback: Function,
  errorCallback?: Function,
  options?: PositionOptions): void;

  watchPosition(successCallback: Function,
                errorCallback?: Function,
                options?: PositionOptions): number;

  clearWatch(watchId: number): number;
}

export interface PositionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
};

export interface Position {
  coords: Coordinates;
  timestamp: number;
};

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
};

