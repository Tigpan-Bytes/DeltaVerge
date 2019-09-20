const port = 4444;

class Chatter
{
	constructor(id)
	{
		this.id = id;
		this.x = 250;
		this.y = 50;

		this.iUp = false;
		this.iDown = false;
		this.iRight = false;
		this.iLeft = false;
	}

	update()
	{
		if (this.iUp)
		{
			this.y -= 1;
		}
		if (this.iDown)
		{
			this.y += 1;
		}
		if (this.iRight)
		{
			this.x += 1;
		}
		if (this.iLeft)
		{
			this.x -= 1;
		}
	}
}

const express = require('express');

let app = express();
let serv = require('http').Server(app);

app.use(express.static('client'));

serv.listen(port);
printLanAddress();

let socketList = {}; //dictionary
let chatterList = {}; //dictionary
let idIncrement = 0;

let io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
	socket.id = idIncrement++;
	socketList[socket.id] = socket;

	chatterList[socket.id] = new Chatter(socket.id);

	console.log('Client Connected: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress);

	socket.on('disconnect', function(){
		console.log('Client Disconnected: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress);
		delete socketList[socket.id];
		delete chatterList[socket.id];
	});

	socket.on('input', function(data){
		let chatter = chatterList[socket.id];

		chatter.iUp = data.iUp;
		chatter.iDown = data.iDown;
		chatter.iRight = data.iRight;
		chatter.iLeft = data.iLeft;
	});

	socket.on('chat', function(data){
		console.log(socket.id + ": " + data);
		let pack = '\n' + socket.id + ": " + data;

		for (let i in socketList) 
		{
			let socket = socketList[i];
			socket.emit('newChatMessage', pack);
		}
	});
});

setInterval(function () { //update/draw function
	let pack = [];
	for (let i in chatterList) 
	{
		let chatter = chatterList[i];
		chatter.update();
		pack.push({
			x: chatter.x,
			y: chatter.y,
			id: chatter.id,
		});
	}
	for (let i in socketList) 
	{
		let socket = socketList[i];
		socket.emit('newPositions', pack);
	}
}, 1000 / 60);


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

			console.log("Running Lan Server over: " + ifname + " | " + iface.address + " | " + port);
		});
	});
	console.log();//blank space
}