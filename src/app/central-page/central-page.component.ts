import { Component, OnInit } from '@angular/core';

/**
 * This is the "real" app-component, because this branch needs to use a router
 * but the original didn't, and renaming app-component would make merging
 * future changes from upstream difficult.
 */
@Component({
  selector: 'app-central-page',
  templateUrl: './central-page.component.html',
  styleUrls: ['./central-page.component.css']
})
export class CentralPageComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
