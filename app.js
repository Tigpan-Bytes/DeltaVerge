let express = require('express');
let app = express();
let serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(4444);
printLanAddress();

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