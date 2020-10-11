import { GeolibInputCoordinates } from 'geolib/es/types';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import data from '../../assets/uszips.json';
import { findNearest, convertDistance, getPreciseDistance } from 'geolib';
@Injectable({
  providedIn: 'root'
})
export class DistanceService {
  public dict = {}; // : {string : { latitude: number; longitude: number} };

  constructor(private http: HttpClient) {
    this.makeDict();
  }
  makeDict(): void {
    for (const elem of data) {
      this.dict[elem.zip] = elem.json;
    }
  }
  getCoord(zip: string) {
    if (this.dict === {}) {
      this.makeDict();
    }
    return this.dict[zip];
  }

  getDist(origin: GeolibInputCoordinates, points: GeolibInputCoordinates[]): number {
    const closest = findNearest(origin, points);
    const dist = Math.round(100 * convertDistance(getPreciseDistance(origin, closest), 'mi')) / 100;
    return dist;
  }
}
