import { GeolibInputCoordinates } from 'geolib/es/types';
import { Injectable } from '@angular/core';
import data from '../../assets/uszips.json';
import { findNearest, convertDistance, getPreciseDistance } from 'geolib';

interface Point {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class DistanceService {
  getCoord(zip: string): Point {
    return data[zip];
  }

  getDist(origin: GeolibInputCoordinates, points: GeolibInputCoordinates[]): number {
    const closest = findNearest(origin, points);
    const dist = Math.round(100 * convertDistance(getPreciseDistance(origin, closest), 'mi')) / 100;
    return dist;
  }
}
