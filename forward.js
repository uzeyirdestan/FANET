
var arDrone  = require('ar-drone');
var client = arDrone.createClient();
client.takeoff();
client
    .after(5000, function() {
      this.front(0,5);
      
    });
    .after(5000, function() {
      this.land();
      
    });
 

