(function(undefined){
  'use strict';
  var request = require('request');
  var _ = require('lodash');

  class Domoticz {
    constructor(address, options) {
      this.address = address || 'http://127.0.0.1';
      this.port = options.port || '8080';
    }

    get uri() {
      return this.address + ':' + this.port;
    }

    getUserVariables(name) {
      return new Promise((resolve, reject) => {
        request.get(this.uri + '/json.htm', {
          qs: {
            type: 'command',
            param: 'getuservariables'
          }
        }, (error,response, body) => {
          if(error) return reject(error);
          if(JSON.parse(body).status !== 'OK') return reject('Domoticz Error: ' + JSON.parse(body).status);

          var variable = _.find(JSON.parse(body).result, {'Name': name});

          if (variable) {
            resolve(variable);
          } else {
            reject('Not Found');
          }
        });
      });
    }

    createUserVariable(name, value) {
      value = value || 0;
      return new Promise((resolve, reject) => {
       request.get(this.uri + '/json.htm', {
         qs: {
           type: 'command',
           param: 'saveuservariable',
           vname: name,
           vtype: 0,
           vvalue: value
         }
       }, (error,response, body) => {
         if(error) return reject(error);
         if(JSON.parse(body).status !== 'OK') return reject('Domoticz Error: ' + JSON.parse(body).status);

         resolve(JSON.parse(body));
       });
      });
    }

    updateUserVariable(idx, name, value) {
      value = value || 0;
      return new Promise((resolve, reject) => {
        request.get(this.uri + '/json.htm', {
          qs: {
            type: 'command',
            param: 'updateuservariable',
            idx: idx,
            vname: name,
            vtype: 0,
            vvalue: value
          }
        }, (error,response, body) => {
          if(error) return reject(error);
          if(JSON.parse(body).status !== 'OK') return reject('Domoticz Error: ' + JSON.parse(body).status);

          resolve(JSON.parse(body));
        });
      });
    }

  }

  module.exports = Domoticz;
})();
