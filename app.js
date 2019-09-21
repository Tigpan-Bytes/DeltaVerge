const port = 4444;

class Chatter
{
	constructor(id)
	{
		this.id = id;
		this.x = 250;
		this.y = 50;
		this.name = "null";
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

	console.log('Client Connected: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Time: " + getSuperTime(new Date()));

	socket.on('init', function(data){
		console.log('Client Initilized: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + data + " | Time: " + getSuperTime(new Date()));
		chatterList[socket.id] = new Chatter(socket.id);
		chatterList[socket.id].name = data;
		
		let date = new Date();
		let pack = {
			spanner: '<span style="color: #080;">',
			time: getTime(date),
			timeStamp: date.getTime(),
			username: chatterList[socket.id].name,
			message: " has Connected!",
		};
	
		for (let i in socketList) 
		{
			let socket = socketList[i];
			socket.emit('newChatAnnouncement', pack);
		}

		updateUserList();
	});

	socket.on('deinit', function(){
		console.log('Client Deinitilized: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Time: " + getSuperTime(new Date()));

		announceDisconnect(chatterList[socket.id]);

		delete chatterList[socket.id];

		updateUserList();
	});

	socket.on('disconnect', function(){
		console.log('Client Disconnected: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Time: " + getSuperTime(new Date()));

		announceDisconnect(chatterList[socket.id]);
		
		delete socketList[socket.id];
		delete chatterList[socket.id];

		updateUserList();
	});

	socket.on('chat', function(data){
		let date = new Date();
		let pack = {
			time: getTime(date),
			timeStamp: date.getTime(),
			username: chatterList[socket.id].name,
			message: cleanseMessage(data),
		};

		console.log(pack.time + " - " + pack.username + ": " + pack.message);

		for (let i in socketList) 
		{
			let socket = socketList[i];
			socket.emit('newChatMessage', pack);
		}
	});
});

function announceDisconnect(chatter)
{
	let date = new Date();
	let pack = {
		spanner: '<span style="color: #800;">',
		time: getTime(date),
		timeStamp: date.getTime(),
		username: chatter.name,
		message: " has Disconnected.",
	};

	for (let i in socketList) 
	{
		let socket = socketList[i];
		socket.emit('newChatAnnouncement', pack);
	}
}

function cleanseMessage(message)
{
	const dirtys = ['<'];
	for (let i = 0; i < message.length; i++)
	{
		let succeded = false;
		for (let d = 0; d < dirtys.length; d++)
		{
			if (message[i] == dirtys[d])
			{
				succeded = true;
				break;
			}
		}
		if (succeded)
		{
			message = message.slice(0, i) + '\\' + message.slice(i);
			i += 1;
		}
	}
	return message;
}

function updateUserList()
{
	let pack = [];
	for (let i in chatterList)
	{
		pack.push(chatterList[i].name);
	}
	for (let i in socketList) 
	{
		socketList[i].emit('newUserList', pack);
	}
}

function getMonth(date)
{
	let month = date.getMonth(); //jan is 0
	switch (month)
	{
		case 0:
			return "Jan";
		case 1:
			return "Feb";
		case 2:
			return "Mar";
		case 3:
			return "Apr";
		case 4:
			return "May";
		case 5:
			return "Jun";
		case 6:
			return "Jul";
		case 7:
			return "Aug";
		case 8:
			return "Sep";
		case 9:
			return "Oct";
		case 10:
			return "Nov";
		default:
			return "Dec";
	}
}

function addTwoDigitZero(numbers)
{
	if (numbers.length <= 1)
	{
		return "0" + numbers;
	}
	return numbers;
}

function getSuperTime(date)
{
	let month = getMonth(date);
	let day = date.getDate();
	let hrs = date.getHours();
	let mins = addTwoDigitZero(date.getMinutes().toString());
	let secs = addTwoDigitZero(date.getSeconds().toString());
	if (hrs >= 13)
	{
		return month + ":" + day + " - " + (hrs - 12) + ":" + mins + ":" + secs + " PM";
	}
	return month + ":" + day + " - " + hrs + ":" + mins + ":" + secs + " AM";
}

function getTime(date)
{
	let hrs = date.getHours();
	let mins = addTwoDigitZero(date.getMinutes().toString());
	if (hrs >= 13)
	{
		return (hrs - 12) + ":" + mins + " PM";
	}
	return hrs + ":" + mins + " AM";
}

/*
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
}, 1000 / 60); */


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