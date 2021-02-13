// Type definitions for Bluebird v3.x.x
// Project: http://bluebirdjs.com

declare module 'bluebird' {
  import * as b from 'bluebird'
  export class bluebird implements b {
    mapSeries?(item: unknown[], iterator: (item: R, index: number, arrayLength: number) => U | Bluebird.Thenable<U>): Promise<U>;
  }
}
