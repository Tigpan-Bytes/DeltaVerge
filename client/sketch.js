//all
let socket;
let username;
let tempUsername;
let room;
let lastChatName;

let aRoomCount = 0;
let bRoomCount = 0;
let cRoomCount = 0;
let dRoomCount = 0;

//main
let mainText;

let guestHolder;
let guestName;
let guestUsernameField;
let guestConfirmButton;

let loginHolder;
let loginName;
let loginUsernameField;
let loginPasswordField;
let loginConfirmButton;

let registerHolder;
let registerName;
let registerUsernameField;
let registerPasswordField;
let registerConfirmPasswordField;
let registerConfirmButton;

let errorText;

//lobby
let logout;
let nameText;
let aButton;
let aText;
let bButton;
let bText;
let cButton;
let cText;
let dButton;
let dText;

//room
let textInputField;
let chatBox;
let userList;
let chatBoxHeight;
let welcomeText;
let lobbyButton;

let resetFields = false;
let lastMessageTimeStamp = null;
let lastPrintedMessageTimeStamp = null;
let noChatDisplayTime = 120000;
let forceDisplayTime = 240000;

let States = {
    main: 0,
    lobby: 1,
    room: 2
};

let state = States.main;

function setup()
{
    createMain();

    socket = io();

    socket.on('newChatMessage', addChatMessage);
    socket.on('newChatAnnouncement', addChatAnnouncement);
    socket.on('newUserList', updateUserList);
    socket.on('acceptedUN', acceptedLogin);
    socket.on('failedUN', failedLogin);
    socket.on('roomCounts', function(data){
        aRoomCount = data['a'];
        bRoomCount = data['b'];
        cRoomCount = data['c'];
        dRoomCount = data['d'];
    });
    socket.on('connect', function(){
        if (state == States.room) { leaveRoom(); }
        if (state == States.lobby) { leaveLobby(); }
        if (state != States.main) { createMain(); }
        socket.emit('deinit');
        state = States.main;
        windowResized();
    });
}

function createMain()
{
    guestHolder = createElement('loginBox', '');
    mainText = createElement('welcome', 'Welcome to <b>Pictochat</b>! Login to advance.');

    guestName = createElement('loginName', 'Guest');
    guestName.parent(guestHolder);

    guestUsernameField = createElement('input', '');
    guestUsernameField.attribute('placeholder', 'Guest Username...');
    guestUsernameField.parent(guestHolder);

    guestConfirmButton = createButton('Login as Guest');
    guestConfirmButton.mouseClicked(attemptUsername)
    guestConfirmButton.size(160, 30);
    guestConfirmButton.parent(guestHolder);

    loginHolder = createElement('loginBox', '');

    loginName = createElement('loginName', 'Login');
    loginName.parent(loginHolder);

    loginUsernameField = createElement('input', '');
    loginUsernameField.attribute('placeholder', 'Username...');
    loginUsernameField.parent(loginHolder);

    loginPasswordField = createElement('input', '');
    loginPasswordField.attribute('placeholder', 'Password...');
    loginPasswordField.parent(loginHolder);

    loginConfirmButton = createButton('Login');
    loginConfirmButton.mouseClicked(attemptUsername)
    loginConfirmButton.size(160, 30);
    loginConfirmButton.parent(loginHolder);

    registerHolder = createElement('loginBox', '');

    registerName = createElement('loginName', 'Register');
    registerName.parent(registerHolder);

    registerUsernameField = createElement('input', '');
    registerUsernameField.attribute('placeholder', 'New Username...');
    registerUsernameField.parent(registerHolder);

    registerPasswordField = createElement('input', '');
    registerPasswordField.attribute('placeholder', 'New Password...');
    registerPasswordField.attribute('type', 'password');
    registerPasswordField.parent(registerHolder);

    registerConfirmPasswordField = createElement('input', '');
    registerConfirmPasswordField.attribute('placeholder', 'Confirm New Password...');
    registerConfirmPasswordField.attribute('type', 'password');
    registerConfirmPasswordField.parent(registerHolder);

    registerConfirmButton = createButton('Register');
    registerConfirmButton.mouseClicked(attemptRegister)
    registerConfirmButton.size(160, 30);
    registerConfirmButton.parent(registerHolder);

    errorText = createElement('errorText', '');
    errorText.size(windowWidth / 2, 100);

    windowResized();
}

function createLobby()
{
    logout = createButton('Logout');
    logout.size(90, 30);

    logout.mouseClicked(function(){
        socket.emit('deinit');
        leaveLobby();
        state = States.main;
        createMain();
    });

    nameText = createElement('welcome', 'Welcome, <b>' + username + '</b>, to Pictochat.');

    aButton = createButton('Join Room A.');
    aText  = createElement('chatterCount', aRoomCount + ' Chatters Active.');
    bButton = createButton('Join Room B.');
    bText  = createElement('chatterCount', bRoomCount + ' Chatters Active.');
    cButton = createButton('Join Room C.');
    cText  = createElement('chatterCount', cRoomCount + ' Chatters Active.');
    dButton = createButton('Join Room D.');
    dText  = createElement('chatterCount', dRoomCount + ' Chatters Active.');

    aButton.mouseClicked(function(){
        socket.emit('room', 'a');
        room = "A";
        leaveLobby();
        state = States.room;
        createChatRoom();
    });
    bButton.mouseClicked(function(){
        socket.emit('room', 'b');
        room = "B";
        leaveLobby();
        state = States.room;
        createChatRoom();
    });
    cButton.mouseClicked(function(){
        socket.emit('room', 'c');
        room = "C";
        leaveLobby();
        state = States.room;
        createChatRoom();
    });
    dButton.mouseClicked(function(){
        socket.emit('room', 'd');
        room = "D";
        leaveLobby();
        state = States.room;
        createChatRoom();
    });

    aButton.size((windowWidth / 3) * 2, 60);
    bButton.size((windowWidth / 3) * 2, 60);
    cButton.size((windowWidth / 3) * 2, 60);
    dButton.size((windowWidth / 3) * 2, 60);

    aText.size((windowWidth / 3) * 2, 60);
    bText.size((windowWidth / 3) * 2, 60);
    cText.size((windowWidth / 3) * 2, 60);
    dText.size((windowWidth / 3) * 2, 60);

    aButton.style('font-size', '26px');
    bButton.style('font-size', '26px');
    cButton.style('font-size', '26px');
    dButton.style('font-size', '26px');

    windowResized();
}

function createChatRoom()
{
    textInputField = createElement('textarea', '');
    textInputField.attribute('placeholder', 'Chat here...');

    chatBox = createElement('chatbox', '<i>&nbsp;&nbsp;&nbsp;&nbsp;Welcome to <b>Room ' + room + '</b>! Type, then press enter to chat.</i>\n ');
    userList = createElement('listbox', '<i>User List:\n</i>');

    welcomeText = createElement('welcome', 'Welcome, <b>' + username + '</b>, to <b>Room ' + room + '</b>.');
    lobbyButton = createButton('Return to lobby');
    lobbyButton.mouseClicked(function(){
        socket.emit('leaveRoom');
        leaveRoom();
        state = States.lobby;
        createLobby();
    });
    lobbyButton.size(170, 40);

    lastChatName = '';

    windowResized();
}

function attemptUsername() //TODO: Don't allow all usernames
{
    tempUsername = guestUsernameField.value();
    socket.emit('init', tempUsername);
    guestUsernameField.value('');
}

function attemptRegister() //TODO: Don't allow all usernames
{
    if (registerPasswordField.value() == registerConfirmPasswordField.value())
    {
        tempUsername = registerUsernameField.value();
        socket.emit('register', {
            un: tempUsername,
            pw: registerPasswordField.value()
        });
        registerUsernameField.value('');
        registerPasswordField.value('');
        registerConfirmPasswordField.value('');
    }
    else
    {
        registerPasswordField.value('');
        registerConfirmPasswordField.value('');
        
        failedLogin(2);
    }
}

function acceptedLogin()
{
    username = tempUsername;

    leaveMain();
    state = States.lobby;
    createLobby();
}

function failedLogin(data)
{
    if (data == 0)
    {
        errorText.html('Username invalid. Length must be between 3 and 20 (inclusive). No special characters aside from _ and -.')
    }
    else if (data == 1)
    {
        errorText.html('Username invalid. Username is already in use.')
    }
    else if (data == 2)
    {
        errorText.html('Passwords do not match.')
    }
    else if (data == 3)
    {
        errorText.html('Password invalid. Length must be between 6 and 64 (inclusive). Only base ASCII characters.')
    }
}

function leaveMain()
{
    mainText.remove();

    guestHolder.remove();
    guestName.remove();
    guestUsernameField.remove();
    guestConfirmButton.remove();

    loginHolder.remove();
    loginName.remove();
    loginUsernameField.remove();
    loginPasswordField.remove();
    loginConfirmButton.remove();

    registerHolder.remove();
    registerName.remove();
    registerUsernameField.remove();
    registerPasswordField.remove();
    registerConfirmPasswordField.remove();
    registerConfirmButton.remove();

    errorText.remove();
}

function leaveLobby()
{
    logout.remove();
    nameText.remove();

    aButton.remove();
    bButton.remove();
    cButton.remove();
    dButton.remove();

    aText.remove();
    bText.remove();
    cText.remove();
    dText.remove();
}

function leaveRoom()
{
    textInputField.remove();
    chatBox.remove();
    userList.remove();
    welcomeText.remove();
    lobbyButton.remove();
}

function windowResized() 
{
    if (state == States.main)
    {
        mainText.position(0,0);

        guestHolder.position(6, 60);
        guestName.size(guestHolder.size().width - 24, 50);
        guestName.position(0, 0);

        guestUsernameField.size(guestHolder.size().width - 48, 50);
        guestUsernameField.position(12, 62);

        guestConfirmButton.position((guestHolder.size().width - 160) / 2, guestHolder.size().height - 50);
        
        loginHolder.position(windowWidth * 0.333 + 6, 60);
        loginName.size(loginHolder.size().width - 24, 50);
        loginName.position(0, 0);

        loginUsernameField.size(loginHolder.size().width - 48, 50);
        loginUsernameField.position(12, 62);

        loginPasswordField.size(loginHolder.size().width - 48, 50);
        loginPasswordField.position(12, 62 + 12 + 50);

        loginConfirmButton.position((loginHolder.size().width - 160) / 2, loginHolder.size().height - 50);

        registerHolder.position(windowWidth * 0.667 + 6, 60);
        registerName.size(registerHolder.size().width - 24, 50);
        registerName.position(0, 0);

        registerUsernameField.size(registerHolder.size().width - 48, 50);
        registerUsernameField.position(12, 62);

        registerPasswordField.size(registerHolder.size().width - 48, 50);
        registerPasswordField.position(12, 62 + 12 + 50);

        registerConfirmPasswordField.size(registerHolder.size().width - 48, 50);
        registerConfirmPasswordField.position(12, 62 + 12 + 50 + 12 + 50);

        registerConfirmButton.position((registerHolder.size().width - 160) / 2, registerHolder.size().height - 50);
        
        errorText.position(windowWidth / 4, windowHeight - 110);
    }
    else if (state == States.lobby)
    {
        logout.position(windowWidth - 100, 8);
        nameText.position(0,0);

        aButton.position(windowWidth / 6, (windowHeight / 5) * 1 - 30);
        aText.position(windowWidth / 6, (windowHeight / 5) * 1 + 30);
        bButton.position(windowWidth / 6, (windowHeight / 5) * 2 - 30);
        bText.position(windowWidth / 6, (windowHeight / 5) * 2 + 30);
        cButton.position(windowWidth / 6, (windowHeight / 5) * 3 - 30);
        cText.position(windowWidth / 6, (windowHeight / 5) * 3 + 30);
        dButton.position(windowWidth / 6, (windowHeight / 5) * 4 - 30);
        dText.position(windowWidth / 6, (windowHeight / 5) * 4 + 30);

        aButton.size((windowWidth / 3) * 2, 60);
        bButton.size((windowWidth / 3) * 2, 60);
        cButton.size((windowWidth / 3) * 2, 60);
        dButton.size((windowWidth / 3) * 2, 60);

        aText.size((windowWidth / 3) * 2, 60);
        bText.size((windowWidth / 3) * 2, 60);
        cText.size((windowWidth / 3) * 2, 60);
        dText.size((windowWidth / 3) * 2, 60);
    }
    else if (state == States.room)
    {
        textInputField.position(0, windowHeight - (80 + 16));
        chatBox.position(0, 48);
        userList.position(windowWidth - 240, 48);
        chatBoxHeight = windowHeight - 80 - 32 - 48 - 8; // 8 for border
        welcomeText.position(0,0);
        lobbyButton.position(windowWidth - 180, 8);
    }
}

function isScrolled()
{
    return (chatBox.elt.scrollTop + chatBoxHeight) == chatBox.elt.scrollHeight;
}

function fullScroll()
{
    chatBox.elt.scrollTop = chatBox.elt.scrollHeight - chatBoxHeight;
}

function updateUserList(data)
{
    userList.html("<i>User List:</i>");
    for (let i = 0; i < data.length; i++)
    {
        userList.html("\n\n" + data[i], true);
    }
    userList.html("\n ", true);
}

function addChatMessage(data)
{ //270 for height - 4 for border
    let isTop = isScrolled();

    chatBox.html(chatBox.html().slice(0, chatBox.html().length - 3));
    //Put message in chatbox
    if (lastMessageTimeStamp == null || data.timeStamp > lastMessageTimeStamp + noChatDisplayTime || data.timeStamp > lastPrintedMessageTimeStamp + forceDisplayTime)
    {
        lastMessageTimeStamp = data.timeStamp;
        lastPrintedMessageTimeStamp = data.timeStamp;
        chatBox.html("\n\n" + data.time + " - <b>" + getNameSpanner(data.username) + data.username + "</span></b>:\n" + getMessageSpanner(data.username) + data.message + "</span>\n ", true);
    }
    else
    {
        lastMessageTimeStamp = data.timeStamp;
        if (lastChatName != data.username)
        {
            chatBox.html("\n\n&nbsp;&nbsp;&nbsp;&nbsp;<b>" + getNameSpanner(data.username) + data.username + "</span></b>:\n" + getMessageSpanner(data.username) + data.message + "</span>\n ", true);
        }
        else
        {
            chatBox.html("\n" + getMessageSpanner(data.username) + data.message + "</span>\n ", true);
        }
    }

    lastChatName = data.username;

    if (isTop)
    {
        fullScroll();
    }
}

function getNameSpanner(un) // used for rank colours
{
    return '<span class="name">';
}

function getMessageSpanner(un) // used for rank colours
{
    return '<span class="text">';
}

function addChatAnnouncement(data)
{ //270 for height - 4 for border
    //Put message in chatbox
    let isTop = isScrolled();

    lastMessageTimeStamp = data.timeStamp;
    lastPrintedMessageTimeStamp = data.timeStamp;
    chatBox.html(chatBox.html().slice(0, chatBox.html().length - 2));
    chatBox.html("\n\n<i>" + data.spanner + data.time + " - " + data.username + data.message + "</i></span>\n ", true);
    lastChatName = '';

    if (isTop)
    {
        fullScroll();
    }
}

function draw()
{
    if (state == States.lobby)
    {
        aText.html(aRoomCount + ' Chatters Active.');
        bText.html(bRoomCount + ' Chatters Active.');
        cText.html(cRoomCount + ' Chatters Active.');
        dText.html(dRoomCount + ' Chatters Active.');
    }
    else if (state == States.room)
    {
        if (resetFields)
        {
            textInputField.value('');
            resetFields = false;
        }
        
        if (textInputField.value() == '\n')
        {
            textInputField.value('');
        }
    }
}

function keyPressed()
{
    if (keyCode == 13 && !keyIsDown(16) && textInputField.value() != '') // not shift and enter
    {
        textInputField.value(textInputField.value().replace(/^\s+|\s+$/g, '')); //remove start and end
        textInputField.value(textInputField.value().replace(/\n\s*\n/g, '\n')); //remove duplicates
    
        if (textInputField.value() != '')
        {
            socket.emit('chat', textInputField.value());
            resetFields = true;
        }
    }
}
