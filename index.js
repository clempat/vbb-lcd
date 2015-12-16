(function (process, undefined) {
  'use strict';
  var VBB = require('vbb-hafas');
  var moment = require('moment');
  var _ = require('lodash');

  var myVbb = VBB('2e9c6a18-8f2e-440c-a8bb-555e85cbeee9');
  var myStations = {};
  var lastRequest;
  var departures = [];
  var clock;

  // Config
  var timeToAttilastrasse = [7, 'minutes'];
  var timeToSudende = [10, 'minutes'];

  // Process
  process.on('SIGINT', () => {
    console.log("\nGracefully shutting down from SIGINT (Ctrl+C)");
    clearInterval(clock);
  });

  function getNextDepartures () {
    return Promise.all([
      myVbb.locations('S Attilastr. (Berlin)'),
      myVbb.locations('S+U Gesundbrunnen Bhf (Berlin)'),
      myVbb.locations('S Südende')
    ]).then((locations) => {
      myStations.attilastr = locations[0][0];
      myStations.gesundbrunnen = locations[1][0];
      myStations.sudende = locations[2][0];

      return Promise.all([
        myVbb.departures(myStations.attilastr.id, {
          results: 4,
          destination: myStations.gesundbrunnen.id
        }),
        myVbb.departures(myStations.sudende.id, {
          results: 4,
          destination: myStations.gesundbrunnen.id
        })
      ]);
    }).then((departures) => {
      var AttilastrDepartureTime = moment().add(...timeToAttilastrasse);
      var SudendeDepartureTime = moment().add(...timeToSudende);

      lastRequest = moment();

      departures[0] = _.filter(departures[0], (departure) => {
        return moment(departure.realtime).isAfter(AttilastrDepartureTime);
      });

      departures[1] = _.filter(departures[1], (departure) => {
        return moment(departure.realtime).isAfter(SudendeDepartureTime);
      });

      return departures;
    });
  }

  getNextDepartures().then((result) => {
    departures = result;
    clock = setInterval(counter, moment.duration(1, 'second'));
  }).catch((reason) => {
    console.log('Reject: ', reason);
    process.exit(1);
  });

  function counter() {
    var now = moment();

    var nextS2 = departures[0][0];
    var nextS25 = departures[1][0];

    // We log and check last run only on the minute
    if (now.seconds() !== 0) {
       return;
    }

    if (lastRequest.isBefore(moment().subtract(3, 'minutes'))) {
      getNextDepartures().then((result) => {
        departures = result;
      });
    }

    console.log('Le prochain S2 part ' + moment(nextS2.realtime).from(now));
    console.log('Le prochain S25 part ' + moment(nextS25.realtime).from(now));
  }


})(process);