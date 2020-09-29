import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DistanceService {
  //public dict? : Map<string, { latitude: number; longitude: number }>;
  public dict = {};
  constructor(private http: HttpClient) {
    this.makeDict();
  }
  public makeDict() {
    this.getInfo().subscribe((data) => {
      const list = data.split('\n');
      list.shift();
      list.forEach((e) => {
        const pair = e.split(`,"`);

        this.dict[pair[0]] = `"${pair[1]}`;
      });
    });
  }
  getInfo() {
    return this.http.get('././assets/uszips2.csv', { responseType: 'text' });
  }
  getCoord(zip: string) {
    if (this.dict === {}) {
      this.makeDict();
    }
    return this.dict[zip];
  }
}
