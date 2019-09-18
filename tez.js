var express   = require('express')
  , app       = express()
  , server    = require('http').createServer(app)

app.use(express.static(__dirname + '/public'));
app.use(app.router);

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/phone', function(req, res) {
  res.sendfile(__dirname + '/phone.html');
});

server.listen(8080);

require("dronestream").listen(server);

var io  = require('socket.io').listen(server)

io.set('destroy upgrade', false)

io.sockets.on('connection', function(socket) {
  //console.log('connection')

  socket.on('control', function(ev) { 
    //console.log('[control]', JSON.stringify(ev)); 
    if(ev.action == 'animate'){
      client.animate(ev.animation, ev.duration)
    } else {
      client[ev.action].call(client, ev.speed);
    }
  })

  socket.on('takeoff', function(data){
    //console.log('takeoff', data)
    client.takeoff()
  })  
  
  socket.on('land', function(data){
    //console.log('land', data)
    client.land()
  })
  
  socket.on('reset', function(data){
    //console.log('reset', data)
    client.disableEmergency()
  })
  socket.on('phone', function(data){
    //console.log('phone', data)
    targetLat = data.lat
    targetLon = data.lon
    phoneAccuracy = data.accuracy
  })  
  socket.on('stop', function(data){
    stop()
  })  

  setInterval(function(){
    io.sockets.emit('drone', {lat: currentLat, lon: currentLon, yaw: currentYaw, distance: currentDistance, battery: battery})
    io.sockets.emit('phone', {lat: targetLat, lon: targetLon, accuracy: phoneAccuracy})
  },1000)
});

var arDrone  = require('ar-drone');
var PID      = require('./PID');
var vincenty = require('node-vincenty');

var yawPID = new PID(1.0, 0, 0.30);
var client = arDrone.createClient();
var counter = 0;
client.config('general:navdata_demo', 'FALSE');
client.takeoff();
client
    .after(5000, function() {
      this.stop();
      //this.land();
    }); 
var targetLat, targetLon, targetYaw, cyaw, currentLat, currentLon,currentDistance, currentYaw, phoneAccuracy;
var battery = 0;

var stop = function(){
  //console.log('stop', data)
  targetYaw = null
  targetLat = null
  targetLon = null
  client.stop()
}

var handleNavData = function(data){
  
  if ( data.demo == null || data.gps == null) return;
  battery = data.demo.batteryPercentage
  currentLat = data.gps.latitude
  currentLon = data.gps.longitude
  
  currentYaw = data.demo.rotation.yaw;
  //console.log("current lat", currentLat);
  //console.log("current lon", currentLon);
  if(counter == 0 )
  {
  targetLat=40.9684347;
  targetLon=28.8411512;
  }
  else if(counter == 1 )
  {
  targetLat=40.968624;
  targetLon=28.8411019;
  } 
 //if (targetLat == null || targetLon == null || currentYaw ==  null || currentLat == null || currentLon == null) return;
  	
  var bearing = vincenty.distVincenty(currentLat, currentLon, targetLat, targetLon)

if(bearing.distance > 5 )
{
    currentDistance = bearing.distance
    console.log('distance', bearing.distance)
  //  console.log('bearing:', bearing.initialBearing)
    targetYaw = bearing.initialBearing
   // console.log('Final bearing:', bearing.finalBearing);	
  //  console.log('targetYaw:', targetYaw);
    console.log('currentYaw:', currentYaw);
    var eyaw = targetYaw - currentYaw;
    console.log('eyaw:', eyaw);

    var uyaw = yawPID.getCommand(eyaw);
    console.log('uyaw:', uyaw);
    var donus = 0;
   var yon = 1;
   // console.log('yon:', yon);
    
     if(uyaw < 0 )
      {
	donus = uyaw * -10;
      }
      else
      {
      donus = uyaw * 10;
      }
   donus = donus | 0 ;
   console.log('donus:', donus);
    
   if(uyaw < 0)
      client.clockwise(-1);
  else
      client.clockwise(1);	
  client
     .after(donus, function() {
      this.stop();
      //this.land();
    })
        client
    .after(2000, function() {
      this.front(0.5);
      
    })
        client
    .after(4000, function() {
      this.stop();
      
    });
//    client.front(0.1)
  } else {
    stop()
    console.log("vardı la vardı"); 
   if(counter == 0)
     counter = 1;
    else
     client.land();
  }
}

client.on('navdata', handleNavData);

function within(x, min, max) {
  if (x < min) {
      return min;
  } else if (x > max) {
      return max;
  } else {
      return x;
  }
}
