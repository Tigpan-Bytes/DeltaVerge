const express = require('express');

let app = express();
let serv = require('http').Server(app);

app.use(express.static('client'));

serv.listen(4444);
printLanAddress();

let io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket) {
  console.log('New connection: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress);

  socket.on('happy', function(data){
    console.log('happy message received: ' + data.reason);
    resendPosition(socket, Math.random() * data.xSize, Math.random() * data.ySize);
  });
});

function resendPosition(socket, x, y)
{
  socket.emit('serverMsg', {
    xPos: x,
    yPos: y,
  });
}


//SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR
//SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR
//SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR SUGAR

function printLanAddress() //https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
{
    console.log();//blank space
    let os = require('os');
    let ifaces = os.networkInterfaces();
    
    Object.keys(ifaces).forEach(function (ifname) {
      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }
    
        console.log("Running Lan Server over: " + ifname + " " + iface.address);
      });
    });
    console.log();
}