//https://git.coolaj86.com/coolaj86/greenlock-express.js/src/branch/master/examples/demo.js

const HTTP_PORT = 80;
const HTTPS_PORT = 8443;

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
		this.focused = true;
		this.isTyping = false;
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

let proposalData;
let proposals;

try
{
	proposalData = fs.readFileSync('proposals.json');//TODO: Make registering, saving, and loading of accounts
	proposals = JSON.parse(proposalData); 
	console.log("\nProposal data loaded successfully.");
}
catch (err)
{
	console.log("\nERROR: PROPOSAL DATA CORRUPTED! RESTART SERVER!");
	console.log("\nERROR: PROPOSAL DATA CORRUPTED! RESTART SERVER!");
	console.log("\nERROR: PROPOSAL DATA CORRUPTED! RESTART SERVER!");
	console.log("\nERROR: PROPOSAL DATA CORRUPTED! RESTART SERVER!");
	console.log("\nERROR: PROPOSAL DATA CORRUPTED! RESTART SERVER!");
}

let app = express();
let serv = require('http').createServer(app);
let sServ = require('https').createServer({
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('certificate.pem')
}, app);

app.use(express.static('client'));

serv.listen(HTTP_PORT);
sServ.listen(HTTPS_PORT);

printLanAddress();

let socketList = {}; //dictionary
let chatterList = {}; //dictionary
let chatterRoomCount = {}; //dictionary

chatterRoomCount["a"] = 0;
chatterRoomCount["b"] = 0;
chatterRoomCount["c"] = 0;
chatterRoomCount["d"] = 0;

let idIncrement = 0;

try
{
	let io = require('socket.io')(serv, {});
	let ios = require('socket.io')(sServ, {});

	io.sockets.on('connection', (socket) => {
		mainFunc(socket);
	});
	ios.sockets.on('connection', (socket) => {
		mainFunc(socket);
	});
}
catch (err)
{
	console.log(err);
}

function mainFunc(socket)
{
	try
	{
		socket.id = idIncrement++;
		socketList[socket.id] = socket;

		console.log('Connected: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Time: " + getSuperTime(new Date()));
		//socket.emit('resetClient');

		socket.on('init', function(data){
			if (typeof(data) == 'string')
			{
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
			}
		});

		socket.on('login', function(data){
			try
			{
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
									console.log('Logged In: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + data.un + " | Rank: " + users[data.un].rank + " | Time: " + getSuperTime(new Date()));
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
			}
			catch (err)
			{
				console.log("Login failed unexpectedly.");
			}
		});

		socket.on('register', function(data){
			try
			{
				if (data != undefined && isAllowedUsername(data.un))
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
										rank: 'reg',
										friends: [],
										requests: []
									};
									fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
										if (err)
										{
											console.error(err);
										}
									});
								}
							});
							console.log('Registered Account: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + data.un + " | Time: " + getSuperTime(new Date()));
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
			}
			catch (err)
			{
				console.log("Register failed unexpectedly.");
			}
		});

		socket.on('changePW', function(data){
			try
			{
				if (data != undefined && isAllowedPassword(data.newPw))
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
											console.log('Changed PW: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Rank: " + users[chatterList[socket.id].name].rank + " | Time: " + getSuperTime(new Date()));
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
			}
			catch (err)
			{
				console.log("ChangePW failed unexpectedly.");
			}
		});

		socket.on('status', function(data){
			try
			{
				if (typeof(data) == 'boolean')
				{
					if (socket.id in chatterList)
					{
						chatterList[socket.id].focused = data;
					}
				}
			}
			catch (err)
			{
				console.log("Status failed unexpectedly.");
			}
		});

		socket.on('room', function(data){
			try
			{
				if (typeof(data) == 'string' && usableRoom(data))
				{
					if (socket.id in chatterList)
					{
						if (isAllowedInRoom(data, chatterList[socket.id].rank))
						{
							console.log('Changed Room: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Room: " + data + " | Rank: " + chatterList[socket.id].rank + " | Time: " + getSuperTime(new Date()));
							chatterList[socket.id].room = data;
							
							let date = new Date();
							let pack = {
								spanner: '<span class="join">', //join
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
				}
			}
			catch (err)
			{
				console.log("Room Change failed unexpectedly.");
			}
		});

		socket.on('deinit', function(){
			try
			{
				if (socket.id in chatterList)
				{
					console.log('Deinitilized: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Time: " + getSuperTime(new Date()));

					announceDisconnect(chatterList[socket.id], "null", '');

					delete chatterList[socket.id];
				}
			}
			catch (err)
			{
				console.log("DeInit failed unexpectedly.");
			}
		});

		socket.on('leaveRoom', function(){
			try
			{
				console.log('Left Room: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Room: " + chatterList[socket.id].room + " | Rank: " + chatterList[socket.id].rank + " | Time: " + getSuperTime(new Date()));

				if (socket.id in chatterList)
				{
					announceDisconnect(chatterList[socket.id], "null", '');

					chatterList[socket.id].room = "null";

					updateUserList();
				}
			}
			catch (err)
			{
				console.log("Leave Room failed unexpectedly.");
			}
		});

		socket.on('disconnect', function(){
			try
			{
				if (socket.id in socketList)
				{
					console.log('Disconnected: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Time: " + getSuperTime(new Date()));

					if (socket.id in chatterList)
					{
						announceDisconnect(chatterList[socket.id], "null", '');
					
						delete chatterList[socket.id];

						updateUserList();
					}
					delete socketList[socket.id];
				}		
			}		
			catch (err)
			{
				console.log("Disconnect failed unexpectedly.");
			}	
		});

		socket.on('typing', function(data){
			try
			{
				if (typeof(data) == 'boolean')
				{
					if (socket.id in chatterList)
					{
						chatterList[socket.id].isTyping = data;
						updateRoomTyping(chatterList[socket.id].room);
					}
				}
			}
			catch (err)
			{
				console.log("Typing failed unexpectedly.");
			}
		});

		socket.on('chat', function(data){
			try
			{
				if (socket.id in chatterList && typeof(data) == 'string')
				{
					if (data[0] == '/' && data.length < 1500)
					{
						if (chatterList[socket.id].rank == 'guest')
						{
							let date = new Date();
							let pack = {
								spanner: '<span class="needAccount">', //needAccount
								time: getTime(date),
								timeStamp: date.getTime(),
								username: '',
								message: "You must have an account to use commands...",
							};
					
							socket.emit('newChatAnnouncement', pack)
						}
						else if (!command(socket, data))
						{
							let date = new Date();
							let pack = {
								spanner: '<span class="cFailed">', // cFailed
								time: getTime(date),
								timeStamp: date.getTime(),
								username: '',
								message: "Command failed to execute...",
							};
					
							socket.emit('newChatAnnouncement', pack)
						}
					}
					else
					{
						let date = new Date();
						let pack = {
							time: getTime(date),
							timeStamp: date.getTime(),
							rank: chatterList[socket.id].rank,
							username: chatterList[socket.id].name,
							message: cleanseMessage(data),
						};
						chatterList[socket.id].isTyping = false;
						updateRoomTyping(chatterList[socket.id].room);

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
				}
			}
			catch (err)
			{
				console.log("Chat failed unexpectedly.");
			}
		});

		socket.on('drawing', function(data){
			try
			{
				if (socket.id in chatterList && typeof(data) == 'object' && data.length == 47600) //THIS MUST BE CHANGED
				{
					let date = new Date();
					let pack = {
						time: getTime(date),
						timeStamp: date.getTime(),
						rank: chatterList[socket.id].rank,
						username: chatterList[socket.id].name,
						image: data,
					};
					chatterList[socket.id].isTyping = false;
					updateRoomTyping(chatterList[socket.id].room);

					console.log(" -> Drawing sent: " + pack.time + " - " + chatterList[socket.id].room + " - [" + pack.rank + "] " + pack.username);

					for (let i in chatterList) 
					{
						let tempSocket = socketList[i];

						if (chatterList[socket.id].room == chatterList[i].room)
						{
							tempSocket.emit('newDrawing', pack);
						}
					}
				}
			}
			catch (err)
			{
				console.log("Drawing failed unexpectedly.");
			}
		});

		socket.on('getFriends', function(){
			updateFriendList(socket);
		});

		socket.on('getRequests', function() {
			updateRequestList(socket)
		});

		socket.on('friendRequest', function(data){
			try
			{
				if (socket.id in chatterList && chatterList[socket.id].rank != 'guest')
				{
					let user = users[chatterList[socket.id].name];
					let chatterName = chatterList[socket.id].name;

					if (chatterName === data)
					{
						socket.emit('friendRequestResponse', 'You cannot friend yourself, stop trying to break pictochat.');
					}
					else if (data in users)
					{
						let found = false;
						for (let i = 0; i < user.requests.length; i++) 
						{
							if (user.requests[i] == data) 
							{
								found = true;
								break;
							}
						}

						if (found)
						{
							user.friends.push(data);
							users[data].friends.push(chatterName);
							console.log('Accepted Friend: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Accepted: " + data + " | Room: " + chatterList[socket.id].room + " | Rank: " + chatterList[socket.id].rank + " | Time: " + getSuperTime(new Date()));
							socket.emit('friendRequestResponse', 'User ' + getNameSpanner(users[data].rank) + data + '</span> had already sent you a friend request so you are now friends!');
							
							updateFriendList(socket);
						}
						else
						{
							for (let i = 0; i < users[data].requests.length; i++)
							{
								if (users[data].requests[i] === chatterName)
								{
									socket.emit('friendRequestResponse', 'User ' + getNameSpanner(users[data].rank) + data + '</span> already has a pending friend request from you.');
									return;
								}
							}

							users[data].requests.push(chatterName);

							fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
								if (err)
								{
									console.error(err);
								}
							});

							socket.emit('friendRequestResponse', 'Friend request to ' + getNameSpanner(users[data].rank) + data + '</span> was successful! Now waiting for a reply from ' + data + '!');
							console.log('Sent Friend: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Requested: " + data + " | Room: " + chatterList[socket.id].room + " | Rank: " + chatterList[socket.id].rank + " | Time: " + getSuperTime(new Date()));
						}
					}
					else
					{
						socket.emit('friendRequestResponse', 'User ' + data + ' cannot be found.');
					}
				}
			}
			catch (err)
			{
				console.log("Request Friends failed unexpectedly.");
			}
		});

		socket.on('removeFriend', function(data){
			try
			{
				if (socket.id in chatterList && chatterList[socket.id].rank != 'guest')
				{
					let user = users[chatterList[socket.id].name];

					let found = false;
					for (let i = 0; i < user.friends.length; i++) 
					{
						if (user.friends[i] == data) 
						{
							user.friends.splice(i, 1);
							found = true;
							break;
						}
					}

					if (found)
					{
						fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
							if (err)
							{
								console.error(err);
							}
						});
						socket.emit('removeFriendResponse', 'User ' + getNameSpanner(users[data].rank) + data + '</span> was removed from your friends list.');
						updateFriendList(socket);
					}
					else
					{
						socket.emit('removeFriendResponse', 'User ' + data + ' cannot be found in your friends list.');
					}
				}
			}
			catch (err)
			{
				console.log("Remove Friends failed unexpectedly.");
			}
		});

		socket.on('actFriendRequest', function(data){
			try
			{
				if (socket.id in chatterList && chatterList[socket.id].rank != 'guest')
				{
					let user = users[chatterList[socket.id].name];
					let chatterName = chatterList[socket.id].name;

					let found = false;
					for(let i = 0; i < user.requests.length; i++) 
					{
						if (user.requests[i] == data.un) 
						{
							found = true;
							break;
						}
					}

					if (found)
					{
						for (let i = 0; i < user.requests.length; i++)
						{
							if (user.requests[i] == data.un)
							{
								user.requests.splice(i, 1);
							}
							console.log('Deny Friend: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Denied: " + data.un + " | Room: " + chatterList[socket.id].room + " | Rank: " + chatterList[socket.id].rank + " | Time: " + getSuperTime(new Date()));
						}
						if (data.accept)
						{
							user.friends.push(data.un);
							users[data.un].friends.push(chatterName);
							console.log('Accepted Friend: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Accepted: " + data.un + " | Room: " + chatterList[socket.id].room + " | Rank: " + chatterList[socket.id].rank + " | Time: " + getSuperTime(new Date()));
						}

						fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
							if (err)
							{
								console.error(err);
							}
						});
						
						updateRequestList(socket);
					}
				}
			}
			catch (err)
			{
				console.log("Act Friend Request failed unexpectedly.");
			}
		});
	}
	catch (err)
	{
		console.log("Main Func failed unexpectedly.");
	}
}

function updateFriendList(socket)
{
	try
	{
		if (socket.id in chatterList && chatterList[socket.id].rank != 'guest')
		{
			let pack = [];
			let changed = false;
			let user = users[chatterList[socket.id].name];
			let userName = chatterList[socket.id].name;

			for (let i = 0; i < user.friends.length; i++)
			{
				let friend = user.friends[i];
				if (!(friend in users))
				{
					user.friends.splice(i, 1);
					changed = true;
					i--;
					continue;
				}

				let found = false;
				for (let j = 0; j < users[friend].friends.length; j++) 
				{
					if (users[friend].friends[j] == userName) 
					{
						found = true;
						break;
					}
				}

				if (!found)
				{
					user.friends.splice(i, 1);
					changed = true;
					i--;
					continue;
				}
				else
				{
					let online = false;
					for (let j in chatterList) 
					{
						if (chatterList[j].name == friend)
						{
							online = true;
							break;
						}
					}

					pack.push({
						active: online,
						un: friend,
						rank: users[friend]['rank'],
					});
				}
			}

			if (changed)
			{
				fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
					if (err)
					{
						console.error(err);
					}
				});
			}

			socket.emit('friendList', pack);
		}
	}
	catch (err)
	{
		console.log("Get Friends failed unexpectedly.");
	}
}

function updateRequestList(socket)
{
	try
	{
		if (socket.id in chatterList && chatterList[socket.id].rank != 'guest')
		{
			let pack = [];
			let changed = false;
			let user = users[chatterList[socket.id].name];

			for (let i = 0; i < user.requests.length; i++)
			{
				let request = user.requests[i];
				if (!(request in users))
				{
					user.requests.splice(i, 1);
					changed = true;
					i--;
					continue;
				}

				let online = false;
				for (let j in chatterList) 
				{
					if (chatterList[j].name == request)
					{
						online = true;
						break;
					}
				}

				pack.push({
					active: online,
					un: request,
					rank: users[request]['rank'],
				});
			}

			if (changed)
			{
				fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
					if (err)
					{
						console.error(err);
					}
				});
			}

			socket.emit('requestList', pack);
		}
	}
	catch (err)
	{
		console.log("Get Requests failed unexpectedly.");
	}
}

function command(socket, message)
{
	try
	{
		let chatter = chatterList[socket.id];
		message = message.substr(1);
		let words = message.split(' ');
		if (!commandRank(words[0], chatter.rank)) //if that rank can access that command
		{
			return false;
		}

		if (words.length >= 3 && words[0] == 'propose')
		{
			if (words[1] == 'bug' || words[1] == 'suggestion' || words[1] == 'request')
			{
				let wMessage = '';
				for (let i = 2; i < words.length - 1; i++)
				{
					wMessage += words[i] + ' ';
				}	
				wMessage += words[words.length - 1];

				let date = new Date();
				console.log('COMMAND: User ' + chatter.name + " proposed a " + words[1] + ": " + wMessage + " | Time: " + getSuperTime(date));

				if (chatter.name in proposals[words[1]])
				{
					proposals[words[1]][chatter.name].push(wMessage);
				}
				else
				{
					proposals[words[1]][chatter.name] = [wMessage];
				}

				fs.writeFile('proposals.json', JSON.stringify(proposals, null, 2), function(err){
					if (err)
					{
						console.error(err);
					}
				});

				let pack = {
					spanner: '<span class="propose">', //whisper
					time: getTime(date),
					timeStamp: date.getTime(),
					username: '',
					message: 'Thank you for your proposal!',
				};
		
				socket.emit('newChatAnnouncement', pack);

				return true;
			}
		}
		if (words.length >= 3 && words[0] == 'whisper')
		{
			let wisp = null;
			for (let i in chatterList) 
			{
				if (chatterList[i].name == words[1])
				{
					wisp = chatterList[i];
				}
			}

			if (wisp != null)
			{	
				let wMessage = '';
				for (let i = 2; i < words.length - 1; i++)
				{
					wMessage += words[i] + ' ';
				}	
				wMessage += words[words.length - 1];

				let date = new Date();
				console.log('COMMAND: ' + chatter.name + ' - [' + chatter.rank +'] Whispered user ' + wisp.name + ": " + wMessage + " | Time: " + getSuperTime(date));

				let pack = {
					spanner: '<span class="whisper">', //whisper
					time: getTime(date),
					timeStamp: date.getTime(),
					username: chatter.name,
					message: " => " + wisp.name + ": " + wMessage,
				};
		
				socket.emit('newChatAnnouncement', pack);
				socketList[wisp.id].emit('newChatAnnouncement', pack);

				return true;
			}
		}
		if (words.length == 2 && words[0] == 'check')
		{
			let targetUser = null;
			for (let i in users) 
			{
				if (i == words[1])
				{
					targetUser = users[i];
				}
			}

			let targetChatter = null;
			for (let i in chatterList) 
			{
				if (chatterList[i].name == words[1])
				{
					targetChatter = chatterList[i];
				}
			}

			let message = '';

			if (targetUser != null && targetChatter != null)
			{
				message = words[1] + ' is a registered account with the rank ' + targetUser['rank'] + ', and is online in room ' + targetChatter.room + '.';
			}
			else if (targetUser == null && targetChatter != null)
			{
				message = words[1] + ' is online as a guest in room ' + targetChatter.room + '.';
			}
			else if (targetUser != null && targetChatter == null)
			{
				message = words[1] + ' is a registered account with the rank ' + targetUser['rank'] + ', but is not online.';
			}
			else
			{
				message = words[1] + ' does not exist.';
			}

			let date = new Date();
			console.log('COMMAND: ' + chatter.name + ' - [' + chatter.rank +'] Checked user ' + words[1] + " | Time: " + getSuperTime(date));

			let pack = {
				spanner: '<span class="check">',
				time: getTime(date),
				timeStamp: date.getTime(),
				username: 'Check: ',
				message: message,
			};
	
			socket.emit('newChatAnnouncement', pack);

			return true;
		}
		if (words.length == 3 && words[0] == 'rank')
		{
			if (!isValidRank(words[2]))
			{
				return false;
			}
			if (words[1] in users)
			{
				if (!isCommandAllowed(chatter.rank, users[words[1]].rank, -1)) // they need to be one step lower
				{
					return false;
				}
				if (!isCommandAllowed(chatter.rank, words[2], -1)) // the set rank also needs to be one step lower
				{
					return false;
				}

				users[words[1]].rank = words[2];
				let room = chatter.room;
				for (let i in chatterList) 
				{
					if (chatterList[i].name == words[1])
					{
						chatterList[i].rank = words[2];
						socketList[i].emit('changeTempRank', words[2]);
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
								
				let date = new Date();
				console.log('COMMAND: ' + chatter.name + ' - [' + chatter.rank +'] Changed user ' + words[1] + "'s rank to " + words[2]+ " | Time: " + getSuperTime(date));

				let pack = {
					spanner: '<span class="rank">', //rank
					time: getTime(date),
					timeStamp: date.getTime(),
					username: words[1],
					message: " has had their rank changed by " + chatter.name + "!",
				};
		
				for (let i in chatterList) 
				{
					let tempSocket = socketList[i];
					if (chatter.room == chatterList[i].room)
					{
						tempSocket.emit('newChatAnnouncement', pack);
					}
				}

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
				if (!isCommandAllowed(chatter.rank, deleted.rank, -1)) // they need to be one step lower
				{
					return false;
				}
				socketList[deleted.id].emit('kill', 'Your account was forcefully deleted by user ' + chatter.name + ' with the rank ' + chatter.rank + '.');
				announceDisconnect(deleted, "delete", '');

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
				if (!isCommandAllowed(chatter.rank, words[1].rank, -1)) // they need to be one step lower
				{
					return false;
				}
				delete users[words[1]];

				fs.writeFile('users.json', JSON.stringify(users, null, 2), function(err){
					if (err)
					{
						console.error(err);
					}
				});
			}
		}
		else if (words.length == 3 && words[0] == 'ipban')
		{
			let banned = null;
			for (let i in chatterList) 
			{
				if (chatterList[i].name == words[1])
				{
					banned = chatterList[i];
				}
			}
			let mins = parseInt(words[2]);
			if (mins > 360)
			{
				mins = 360;
			}
			if (mins < 1)
			{
				mins = 1;
			}

			if (banned != null)
			{	
				if (!isCommandAllowed(chatter.rank, banned.rank, -1)) // they need to be one step lower
				{
					return false;
				}
				socketList[banned.id].emit('kill', 'Your ip was banned by user ' + chatter.name + ' with the rank ' + chatter.rank + ' for ' + mins + ' minutes.');
				socketList[banned.id].emit('ipban', mins);

				let code = banned.id;
				let date = new Date();
		
				announceDisconnect(banned, "ipban", ' for ' + mins + ' minutes!');

				let pack = {
					spanner: '<span class="check">',
					time: getTime(date),
					timeStamp: date.getTime(),
					username: '',
					message: 'If you ever want to unban this user, use the code: ' + code + '. Do <b>/liftban ' + code + '</b> to unban the user, this will not work if they refresh the page after being banned.',
				};
				socket.emit('newChatAnnouncement', pack);

				delete chatterList[banned.id];

				updateRoomList(chatter.room);
				console.log('COMMAND: ' + chatter.name + ' - [' + chatter.rank +'] IP-BANNED user account ' + words[1] + " for " + mins + " minutes | Time: " + getSuperTime(date));
				return true;
			}
		}
		else if (words.length == 2 && words[0] == 'liftban')
		{
			let id = parseInt(words[1]);
			if (id in socketList)
			{	
				if (!(id in chatterList))
				{
					socketList[id].emit('ipban', -1);
					let date = new Date();

					let pack = {
						spanner: '<span class="check">',
						time: getTime(date),
						timeStamp: date.getTime(),
						username: '',
						message: 'You have lifted the ip-ban.',
					};
					socket.emit('newChatAnnouncement', pack);

					console.log('COMMAND: ' + chatter.name + ' - [' + chatter.rank +'] Ban lifted with code ' + id + " | Time: " + getSuperTime(date));
					return true;
				}
				else
				{
					let date = new Date();

					let pack = {
						spanner: '<span class="check">',
						time: getTime(date),
						timeStamp: date.getTime(),
						username: '',
						message: 'That ip-ban has already expired.',
					};
					socket.emit('newChatAnnouncement', pack);
					return true;
				}
			}
			else
			{
				let date = new Date();

				let pack = {
					spanner: '<span class="check">',
					time: getTime(date),
					timeStamp: date.getTime(),
					username: '',
					message: 'Code ' + words[1] + ' is invalid, they may have refreshed the page.',
				};
				socket.emit('newChatAnnouncement', pack);
				return true;
			}
		}
		else if (words.length == 1 && words[0] == 'liftallbans')
		{
			let id = parseInt(words[1]);
			for (id in socketList)
			{	
				socketList[id].emit('ipban', -1);
			}

			let date = new Date();
			let pack = {
				spanner: '<span class="check">',
				time: getTime(date),
				timeStamp: date.getTime(),
				username: '',
				message: 'You have lifted ALL ip-bans currently active.',
			};
			socket.emit('newChatAnnouncement', pack);

			console.log('COMMAND: ' + chatter.name + ' - [' + chatter.rank +'] Lifted ALL bans | Time: ' + getSuperTime(date));
			return true;
		}
		else if (words.length == 3 && words[0] == 'slow')
		{
			let slowed = null;
			for (let i in chatterList) 
			{
				if (chatterList[i].name == words[1])
				{
					slowed = chatterList[i];
				}
			}
			let mins = parseInt(words[2]);
			if (mins > 30)
			{
				mins = 30;
			}
			if (mins < 1)
			{
				mins = 1;
			}

			if (slowed != null)
			{	
				if (!isCommandAllowed(chatter.rank, slowed.rank, -1)) // they need to be one step lower
				{
					return false;
				}
				socketList[slowed.id].emit('slow', mins);

				let date = new Date();
		
				let pack = {
					spanner: '<span class="slow">', 
					time: getTime(date),
					timeStamp: date.getTime(),
					username: words[1],
					message: " was slowed by " + chatter.name + " for " + mins + " minutes!",
				};
		
				for (let i in chatterList) 
				{
					let tempSocket = socketList[i];
					if (chatter.room == chatterList[i].room)
					{
						tempSocket.emit('newChatAnnouncement', pack);
					}
				}

				console.log('COMMAND: ' + chatter.name + ' - [' + chatter.rank +'] Slowed user account ' + words[1] + " for " + mins + " minutes | Time: " + getSuperTime(date));
				return true;
			}
		}
		else if (words.length == 2 && words[0] == 'unslow')
		{
			let slowed = null;
			for (let i in chatterList) 
			{
				if (chatterList[i].name == words[1])
				{
					slowed = chatterList[i];
				}
			}

			if (slowed != null)
			{	
				if (!isCommandAllowed(chatter.rank, slowed.rank, -1)) // they need to be one step lower
				{
					return false;
				}
				socketList[slowed.id].emit('slow', -1);

				let date = new Date();
		
				let pack = {
					spanner: '<span class="slow">', 
					time: getTime(date),
					timeStamp: date.getTime(),
					username: words[1],
					message: " was unslowed by " + chatter.name + "!",
				};
		
				for (let i in chatterList) 
				{
					let tempSocket = socketList[i];
					if (chatter.room == chatterList[i].room)
					{
						tempSocket.emit('newChatAnnouncement', pack);
					}
				}

				console.log('COMMAND: ' + chatter.name + ' - [' + chatter.rank +'] Unslowed user account ' + words[1] + " | Time: " + getSuperTime(date));
				return true;
			}
		}
	}
	catch (err)
	{
		console.log("Command failed unexpectedly.");
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
	console.log('Initilized: ID: ' + socket.id + " | IP: " + socket.request.connection.remoteAddress + " | Username: " + chatterList[socket.id].name + " | Time: " + getSuperTime(new Date()));
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

function isAllowedInRoom(room, rank)
{
	if (room == 'd' && getRankValue(rank) < 2)
	{
		return false;
	}
	if (room == 'c' && getRankValue(rank) < 1)
	{
		return false;
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

function announceDisconnect(chatter, special, extra)
{
	let date = new Date();
	let pack;
	if (special == 'delete')
	{
		pack = {
			spanner: '<span class="ban">', //ban
			time: getTime(date),
			timeStamp: date.getTime(),
			username: chatter.name,
			message: " was struck with the Almighty Banhammer!",
		};
	}
	else if (special == 'ipban')
	{
		pack = {
			spanner: '<span class="ban">', //ban
			time: getTime(date),
			timeStamp: date.getTime(),
			username: chatter.name,
			message: " was struck with the Almighty IP-Banhammer" + extra,
		};
	}
	else
	{
		pack = {
			spanner: '<span class="disconnect">', //disconnect
			time: getTime(date),
			timeStamp: date.getTime(),
			username: chatter.name,
			message: " has Disconnected.",
		};
	}

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
				active: chatterList[i].focused,
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

function updateRoomTyping(room)
{
	let pack = [];
	for (let i in chatterList)
	{
		if (chatterList[i].room == room)
		{
			if (chatterList[i].isTyping)
			{
				pack.push(chatterList[i].name);
			}
		}
	}

	for (let i in chatterList) 
	{
		if (chatterList[i].room == room)
		{
			socketList[i].emit('typing', pack);
		}
	}
}

function isCommandAllowed(rOwner, rAffected, steps)
{
	return (getRankValue(rAffected) - getRankValue(rOwner)) <= steps
}

function isValidRank(rank)
{
	return rank == 'admin' || rank == 'mod' || rank == '++' || rank == '+' || rank == 'reg';
}

function getNameSpanner(rank) // used for rank colours
{
    if (rank == 'admin')
    {
        return '<span class="adminName">[ADMIN] ';
    }
    if (rank == 'mod')
    {
        return '<span class="modName">[MOD] ';
    }
    if (rank == '+')
    {
        return '<span class="plusName">[+] ';
    }
    if (rank == '++')
    {
        return '<span class="plusPlusName">[++] ';
    }
    if (rank == 'guest')
    {
        return '<span class="guestName">';
    }
    return '<span class="baseName">';
}

function getRankValue(rank)
{
	if (rank == 'admin')
	{
		return 5;
	}
	if (rank == 'mod')
	{
		return 4;
	}
	if (rank == '++')
	{
		return 3;
	}
	if (rank == '+')
	{
		return 2;
	}
	if (rank == 'guest')
	{
		return 0;
	}
	return 1; // regular
}

function commandRank(command, rank)
{
	let cVal = 1;
	if (command == 'rank')
	{
		cVal = 4;
	}
	if (command == 'delete')
	{
		cVal = 4;
	}
	if (command == 'ipban')
	{
		cVal = 4;
	}
	if (command == 'liftban')
	{
		cVal = 4;
	}
	if (command == 'liftallbans')
	{
		cVal = 4;
	}
	if (command == 'check')
	{
		cVal = 2;
	}
	if (command == 'slow')
	{
		cVal = 3;
	}
	if (command == 'unslow')
	{
		cVal = 3;
	}
	return getRankValue(rank) > cVal; 
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


setInterval(function () {
	updateUserList();
}, 1500 / 60); 


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

			console.log("Running Lan Server over: " + ifname + " | " + iface.address + " | (" + HTTP_PORT + " / " + HTTPS_PORT + ")");
		});
	});
	console.log();//blank space
}