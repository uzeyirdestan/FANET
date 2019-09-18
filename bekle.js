
var arDrone  = require('ar-drone');
var client = arDrone.createClient();
client.takeoff();
client
    .after(10000, function() {
      this.clockwise(1);
      
    })
    .after(2000, function() {
      this.stop();
      //this.land();
    });

