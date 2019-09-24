const port = 4444;

class Chatter
{
	constructor(id)
	{
		this.id = id;
		this.x = 250;
		this.y = 50;
		this.name = "null";
		this.room = "null";
		this.rank = "reg";
	}
}

const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt'); //https://www.npmjs.com/package/bcrypt

let userData;
let users;

try
{
	userData = fs.readFileSync('users.json');//TODO: Make registering, saving, and loading of accounts
	users = JSON.parse(userData);  //dictionary username:{hash,rank}
	console.log("\nUser data loaded successfully.");
}
catch (err)
{
	console.log("\nERROR: USER DATA CORRUPTED! RESTART SERVER!");
	console.log("\nERROR: USER DATA CORRUPTED! RESTART SERVER!");
	console.log("\nERROR: USER DATA CORRUPTED! RESTART SERVER!");
	console.log("\nERROR: USER DATA CORRUPTED! RESTART SERVER!");
	console.log("\nERROR: USER DATA CORRUPTED! RESTART SERVER!");
}

let app = express();
let serv = require('http').Server(app);

app.use(express.static('client'));

serv.listen(port);
printLanAddress();

let socketList = {}; //dictionary
let chatterList = {}; //dictionary
let chatterRoomCount = {}; //dictionary

chatterRoomCount["a"] = 0;
chatterRoomCount["b"] = 0;
chatterRoomCount["c"] = 0;
chatterRoomCount["d"] = 0;

let idIncrement = 0;

let io = require('socket.io')(serv, {});

try
{
io.sockets.on('connection', function (socket) {
	socket.id = idIncrement++;
	socketList[socket.id] = socket;

	console.log('Client Connected: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Time: " + getSuperTime(new Date()));
	//socket.emit('resetClient');

	socket.on('init', function(data){
		if (isAllowedUsername(data))
		{
			if (isUsernameFree(data))
			{
				initilize(socket, data, "guest");
			}
			else
			{
				socket.emit('failedUN', 1);
			}
		}
		else
		{
			socket.emit('failedUN', 0);
		}
	});

	socket.on('login', function(data){
		if (data.un in users)
		{
			let exists = false;
			for (let i in chatterList)
			{
				if (chatterList[i].name == data.un)
				{
					exists = true;
					break;
				}
			}
			if (!exists)
			{
				bcrypt.compare(data.pw, users[data.un].hash, function(err, res){
					if (err)
					{
						console.error(err);
						socket.emit('failedUN', 4);
					}
					else
					{
						if (res)
						{
							console.log('Client Logged In: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + data.un + " | Rank: " + users[data.un].rank + " | Time: " + getSuperTime(new Date()));
							initilize(socket, data.un, users[data.un].rank);
						}
						else
						{
							socket.emit('failedUN', 4);
						}
					}
				});
			}
			else
			{
				socket.emit('failedUN', 4);
			}
		}
		else
		{
			socket.emit('failedUN', 4);
		}
	});

	socket.on('register', function(data){
		if (isAllowedUsername(data.un))
		{
			if (isUsernameFree(data.un))
			{
				if (isAllowedPassword(data.pw))
				{
					bcrypt.hash(data.pw, 12, function(err, hash){
						if (err)
						{
							console.error(err);
						}
						else
						{
							users[data.un] = {
								hash: hash, 
								rank: 'reg'
							};
							fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
								if (err)
								{
									console.error(err);
								}
							});
						}
					});
					console.log('Client Registered Account: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + data.un + " | Time: " + getSuperTime(new Date()));
					initilize(socket, data.un, "reg");
				}
				else
				{
					socket.emit('failedUN', 3);
				}
			}
			else
			{
				socket.emit('failedUN', 1);
			}
		}
		else
		{
			socket.emit('failedUN', 0);
		}
	});

	socket.on('changePW', function(data){
		if (isAllowedPassword(data.newPw))
		{
			if (chatterList[socket.id].name in users)
			{
				bcrypt.compare(data.pw, users[chatterList[socket.id].name].hash, function(err, res){
					if (err)
					{
						console.error(err);
						socket.emit('failedUN', 4);
					}
					else
					{
						if (res)
						{
							bcrypt.hash(data.newPw, 12, function(err, hash){
								if (err)
								{
									console.error(err);
								}
								else
								{
									users[chatterList[socket.id].name].hash = hash;
									fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
										if (err)
										{
											console.error(err);
										}
									});
									console.log('Client Changed PW: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Rank: " + users[chatterList[socket.id].name].rank + " | Time: " + getSuperTime(new Date()));
									socket.emit('pwSuccess');
								}
							});
						}
						else
						{
							socket.emit('failedUN', 4);
						}
					}
				});	
			}
			else
			{
				socket.emit('failedUN', 4);
			}
			
		}
		else
		{
			socket.emit('failedUN', 3);
		}
	});

	socket.on('room', function(data){
		if (typeof(data) == 'string' && usableRoom(data))
		{
			if (socket.id in chatterList)
			{
				console.log('Client Changed Room: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Room: " + data + " | Rank: " + chatterList[socket.id].rank + " | Time: " + getSuperTime(new Date()));
				chatterList[socket.id].room = data;
				
				let date = new Date();
				let pack = {
					spanner: '<span style="color: #080;">',
					time: getTime(date),
					timeStamp: date.getTime(),
					username: chatterList[socket.id].name,
					message: " has Connected!",
				};
			
				for (let i in chatterList) 
				{
					let tempSocket = socketList[i];
					if (chatterList[i].room == data)
					{
						tempSocket.emit('newChatAnnouncement', pack);
					}
				}

				updateUserList();
			}
		}
	});

	socket.on('deinit', function(){
		if (socket.id in chatterList)
		{
			console.log('Client Deinitilized: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Time: " + getSuperTime(new Date()));

			announceDisconnect(chatterList[socket.id]);

			delete chatterList[socket.id];
		}
	});

	socket.on('leaveRoom', function(){
		console.log('Client Left Room: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Room: " + chatterList[socket.id].room + " | Rank: " + chatterList[socket.id].rank + " | Time: " + getSuperTime(new Date()));

		if (socket.id in chatterList)
		{
			announceDisconnect(chatterList[socket.id]);

			chatterList[socket.id].room = "null";

			updateUserList();
		}
	});

	socket.on('disconnect', function(){
		if (socket.id in socketList)
		{
			console.log('Client Disconnected: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Time: " + getSuperTime(new Date()));

			if (socket.id in chatterList)
			{
				announceDisconnect(chatterList[socket.id]);
			
				delete chatterList[socket.id];

				updateUserList();
			}
			delete socketList[socket.id];
		}					
	});

	socket.on('chat', function(data){
		if (!command(socket, data) && socket.id in chatterList && typeof(data) == 'string')
		{
			let date = new Date();
			let pack = {
				time: getTime(date),
				timeStamp: date.getTime(),
				rank: chatterList[socket.id].rank,
				username: chatterList[socket.id].name,
				message: cleanseMessage(data),
			};

			console.log(pack.time + " - " + chatterList[socket.id].room + " - [" + pack.rank + "] " + pack.username + ": " + pack.message);

			for (let i in chatterList) 
			{
				let tempSocket = socketList[i];

				if (chatterList[socket.id].room == chatterList[i].room)
				{
					tempSocket.emit('newChatMessage', pack);
				}
			}
		}
	});
});
}
catch (err)
{
	console.error(err);
}

function command(socket, message)
{
	let chatter = chatterList[socket.id];
	if (chatter.rank != 'admin' && chatter.rank != 'mod')
	{
		return false;
	}
	if (message[0] == '/')
	{
		message = message.substr(1);
		let words = message.split(' ');
		if (words.length == 3 && words[0] == 'rank')
		{
			if (words[1] in users)
			{
				users[words[1]].rank = words[2];
				let room = 'a';
				for (let i in chatterList) 
				{
					if (chatterList[i].name == words[1])
					{
						chatterList[i].rank = words[2];
						room = chatterList[i].room;
					}
				}
				fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
					if (err)
					{
						console.error(err);
					}
				});
				updateRoomList(room);
				console.log('COMMAND: ' + chatter.name + ' - [' + chatter.rank +'] Changed user ' + words[1] + "'s rank to " + words[2]+ " | Time: " + getSuperTime(new Date()));
				return true;
			}
		}
		else if (words.length == 2 && words[0] == 'delete')
		{
			let deleted = null;
			for (let i in chatterList) 
			{
				if (chatterList[i].name == words[1])
				{
					deleted = chatterList[i];
				}
			}

			if (deleted != null)
			{	
				socketList[deleted.id].emit('kill');
				announceDisconnect(deleted);

				delete chatterList[deleted.id];
				if (words[1] in users)
				{
					delete users[words[1]];

					fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
						if (err)
						{
							console.error(err);
						}
					});
				}

				updateRoomList(chatter.room);
				console.log('COMMAND: ' + chatter.name + ' - [' + chatter.rank +'] Deleted user account ' + words[1] + " | Time: " + getSuperTime(new Date()));
				return true;
			}
			else if (words[1] in users)
			{
				delete users[words[1]];

				fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
					if (err)
					{
						console.error(err);
					}
				});
			}
		}
	}
	return false;
}

function initilize(socket, un, rk)
{
	sendRoomLists(socket);
	socket.emit('acceptedUN', rk);

	chatterList[socket.id] = new Chatter(socket.id);
	chatterList[socket.id].name = un;
	chatterList[socket.id].rank = rk;
	console.log('Client Initilized: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Time: " + getSuperTime(new Date()));
}

function usableRoom(room)
{
	return (room == "a" || room == "b" || room == "c" || room == "d" || room == "null");
}

function isAllowedUsername(un)
{
	if (typeof(un) != 'string')
	{
		return false;
	}
	if (un.length <= 2 || un.length > 20)
	{
		return false;
	}

	for (let i = 0; i < un.length; i++)
	{
		let code = un.charCodeAt(i);
		
		if (code == 45 || code == 95) // exceptions for hyphen and undersocre
		{
			continue;
		}

		if (code < 48 || (code > 57 && code < 65) || (code > 90 && code < 97) || code > 122)
		{
			return false;
		}
	}

	return true;
}

function isUsernameFree(un)
{
	if (typeof(un) != 'string')
	{
		return false;
	}
	for (let i in chatterList) 
	{
		if (chatterList[i].name == un)
		{
			return false;
		}
	}

	if (un in users)
	{
		return false;
	}
	return true;
}

function isAllowedPassword(pw)
{
	if (typeof(pw) != 'string')
	{
		return false;
	}
	if (pw.length < 6 || pw.length > 64)
	{
		return false;
	}

	for (let i = 0; i < pw.length; i++)
	{
		let code = pw.charCodeAt(i);

		if (code >= 128 || code <= 32)
		{
			return false;
		}
	}

	return true;
}

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

	for (let i in chatterList) 
	{
		let tempSocket = socketList[i];
		if (chatter.room == chatterList[i].room)
		{
			tempSocket.emit('newChatAnnouncement', pack);
		}
	}
}

function cleanseMessage(message)
{
	const dirtys = [['<', '&#60;']];
	for (let i = 0; i < message.length; i++)
	{
		let succeded = -1;
		for (let d = 0; d < dirtys.length; d++)
		{
			if (message[i] == dirtys[d][0])
			{
				succeded = d;
				break;
			}
		}
		if (succeded != -1)
		{
			message = message.slice(0, i) + dirtys[succeded][1] + message.slice(i + 1);
			i += 2;
		}
	}
	return message;
}

function updateUserList()
{
	updateRoomList('a');
	updateRoomList('b');
	updateRoomList('c');
	updateRoomList('d');

	for (let i in socketList) 
	{
		sendRoomLists(socketList[i]);
	}
}

function sendRoomLists(socket)
{
	socket.emit('roomCounts', chatterRoomCount);
}

function updateRoomList(room)
{
	let pack = [];
	let count = 0;
	for (let i in chatterList)
	{
		if (chatterList[i].room == room)
		{
			pack.push({
				un: chatterList[i].name,
				rank: chatterList[i].rank,
			});
			count++;
		}
	}
	chatterRoomCount[room] = count;

	for (let i in chatterList) 
	{
		if (chatterList[i].room == room)
		{
			socketList[i].emit('newUserList', pack);
		}
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