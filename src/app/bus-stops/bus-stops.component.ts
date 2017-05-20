import {Component, OnInit, Input} from '@angular/core';

import {MovingMapComponent} from '../moving-map/moving-map.component';

import {SharedDataService} from '../shared-data.service';

/////////////////////   Bus Stops  /////////////////
import {TransitService} from '../transit.service';
import {Stop} from '../stop';

import {KeyedCollection} from '../keyed-collection';
import {OgoConstants} from '../ogo-constants';

import {} from '@types/googlemaps';

@Component({
  selector: 'bus-stops',
  templateUrl: './bus-stops.component.html',
  styleUrls: ['./bus-stops.component.css']
})

export class BusStopsComponent implements OnInit {

  @Input() lattitude: number;
  @Input() longitude: number;
  @Input() accuracy: number;
  // @Input() stop: Stop;
  @Input() moving_map: MovingMapComponent;
  @Input() map: google.maps.Map;

  @Input() iconUrl: String;

  // bus_stop_gb: String = 'assets/bus_stop_gb.png';

  city_code: string;

  stops: Stop[];
  markers: boolean[];

  // Deprecated
  // selected_stop:Stop;

  selected_stops: KeyedCollection<Stop>;

  // Use stop dictionary
  // selected_stops: { [id: string] : Stop; } = {};
  // persons["p1"] = { firstName: "F1", lastName: "L1" };
  ///persons["p2"] = { firstName: "F2" }; // will result in an error

  // bus_stop_gb: String = 'assets/bus_stop_gb.png';

  constructor(private transitService: TransitService, private sharedDataService: SharedDataService) {

    this.selected_stops = new KeyedCollection<Stop>();
    this.city_code = sharedDataService.getCityCode();
  }

  ngOnInit() {

    this.stops = this.sharedDataService.getStops();

  }
  // Called before new info window is opened
  clickedStop(i) {

    if (this.selected_stops.Count() >= OgoConstants.MAX_OPEN_INFO_WINDOWS) {

      const keys = this.selected_stops.Keys();
      const firstKey = keys[0];

      // TODO implement Marker.close Info Window

      alert('Cannot have More than ' + OgoConstants.MAX_OPEN_INFO_WINDOWS + ' Stops Open!');
      // Closing " + this.selected_stops.Item(firstKey).stop_name);

      // this.selected_stops.Item(firstKey).isOpen = false;
      // this.selected_stops.Remove(firstKey);

      this.stops[i].isOpen = false;

      return;

    }

    this.stops[i].isOpen = true;

    this.selected_stops.Add(this.stops[i].stop_id, this.stops[i]);

    console.log('Number of open InfoWindows: ' + this.selected_stops.Count());

  }

  // TODO does this ever get Fired
  windowClosed(stop: Stop) {

    if (stop.isOpen) {
      this.selected_stops.Remove(stop.stop_id);
      stop.isOpen = false;
      console.log('Number of open InfoWindows: ' + this.selected_stops.Count());
    } else {
      // Called by angular2-google-maps for each stop in stops array before tiles are loaded.
      // console.log('windowClosed: ' + stop.stop_name + ' stop_id: ' + stop.stop_id + ' isOpen ' + stop.isOpen);
    }

  }

}
