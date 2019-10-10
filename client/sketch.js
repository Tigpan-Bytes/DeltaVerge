//all
let socket;
let username;
let tempUsername;
let tempRank;
let room;
let lastChatName;

let aRoomCount = 0;
let bRoomCount = 0;
let cRoomCount = 0;
let dRoomCount = 0;

let errorText;

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

//lobby
let logout;
let changePassword;

let nameText;
let aButton;
let aText;
let bButton;
let bText;
let cButton;
let cText;
let dButton;
let dText;

//change password
let backToLobby;

let changePWHolder;
let changePWName;
let changePWUsernameField;
let changePWPasswordField;
let changePWNewPasswordField;
let changePWConfirmNewPasswordField;
let changePWConfirmButton;

let successText;

//room
let textInputField;
let pictureButton;
let chatBox;
let userList;
let chatBoxHeight;
let welcomeText;
let typingText;

let lobbyButton;
let friendsButton;

//drawing
let background;
let cancelPictureButton;
let sendPictureButton;
let resetPictureButton;

let pictureCanvas;
let pictureImage;

let smlPenButton;
let midPenButton;
let lrgPenButton;
let masPenButton;
let paintBucketButton;
let whiteColorButton;
let blackColorButton;

let pen = 2;
let penColor = [0, 0, 0, 255];

let resetFields = false;
let lastMessageTimeStamp = null;
let lastPrintedMessageTimeStamp = null;
let noChatDisplayTime = 120000;
let forceDisplayTime = 240000;

let States = {
    main: 0,
    lobby: 1,
    room: 2,
    changePw: 3
};

let state = States.main;
let lastMillis = 0;
let typingMillis = 0;
let isDarkMode = false;

const pictureWidth = 280;
const pictureHeight = 170;

let isDrawingOpen = false;
let forceFullScroll = -1;

let notify;
let stillOpen = false;
let everNotify = true;

function setup()
{
    createMain();

    socket = io();

    socket.on('newChatMessage', addChatMessage);
    socket.on('newDrawing', addDrawing);
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
        kill();
        socket.emit('deinit');
    });
    socket.on('kill', kill);
    socket.on('typing', function(data){
        if (state == States.room)
        {
            if (data.length == 0)
            {
                typingText.html('Nobody is typing at the moment...');
            }
            else if (data.length == 1)
            {
                typingText.html('<span class="baseText">' + data[0] + '</span> is typing.');
            }
            else if (data.length == 2)
            {
                typingText.html('<span class="baseText">' + data[0] + '</span> and <span class="baseText">' + data[1] + '</span> are typing.');
            }
            else if (data.length == 3)
            {
                typingText.html('<span class="baseText">' + data[0] + '</span>, <span class="baseText">' + data[1] + '</span>, and <span class="baseText">' + data[2] + '</span> are typing.');
            }
            else
            {
                typingText.html('<span class="baseText">Several</span> people are typing.');
            }
        }
    });
    socket.on('pwSuccess', function(){
        successText.html('Password change was successful.');
    });
}

function notification(message)
{
    if (!focused && !stillOpen && everNotify)
    {
        var options = {
            silent: true
        }

        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
        }
        else if (Notification.permission === "granted") 
        {
            notify = new Notification(message, options);

            stillOpen = true;
            notify.onclose = function(){ stillOpen = false; };
            setTimeout(notify.close.bind(notify), 4000);
        }
        else if (Notification.permission !== "denied") 
        {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") 
                {
                    notify = new Notification(message, options);

                    stillOpen = true;
                    notify.onclose = function(){ stillOpen = false; };
                    setTimeout(notify.close.bind(notify), 4000);
                }
            });
        }
    }
}

function kill(message)
{
    if (state == States.room) { leaveRoom(); }
    if (state == States.lobby) { leaveLobby(); }
    if (state == States.changePw) { leavePasswordChange(); }
    if (state != States.main) { createMain(); }
    state = States.main;
    if (message != undefined)
    {
        errorText.html(message)
    }
    windowResized();
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
    guestConfirmButton.mouseClicked(attemptGuest)
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
    loginPasswordField.attribute('type', 'password');
    loginPasswordField.parent(loginHolder);

    loginConfirmButton = createButton('Login');
    loginConfirmButton.mouseClicked(attemptLogin)
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
    if (tempRank != 'guest')
    {
        changePassword = createButton('Change Password');
        changePassword.size(190, 30);
        changePassword.mouseClicked(function(){
            leaveLobby();
            state = States.changePw;
            createPasswordChange();
        });
    }

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

function createPasswordChange()
{
    backToLobby = createButton('Lobby');
    backToLobby.size(90, 30);

    backToLobby.mouseClicked(function(){
        leavePasswordChange();
        state = States.lobby;
        createLobby();
    });

    changePWHolder = createElement('loginBox', '');

    changePWName = createElement('loginName', 'Change PW');
    changePWName.parent(changePWHolder);

    changePWPasswordField = createElement('input', '');
    changePWPasswordField.attribute('placeholder', 'Old Password...');
    changePWPasswordField.attribute('type', 'password');
    changePWPasswordField.parent(changePWHolder);

    changePWNewPasswordField = createElement('input', '');
    changePWNewPasswordField.attribute('placeholder', 'New Password...');
    changePWNewPasswordField.attribute('type', 'password');
    changePWNewPasswordField.parent(changePWHolder);

    changePWConfirmNewPasswordField = createElement('input', '');
    changePWConfirmNewPasswordField.attribute('placeholder', 'Confirm New Password...');
    changePWConfirmNewPasswordField.attribute('type', 'password');
    changePWConfirmNewPasswordField.parent(changePWHolder);

    changePWConfirmButton = createButton('Confirm');
    changePWConfirmButton.size(160, 30);
    changePWConfirmButton.parent(changePWHolder);

    errorText = createElement('errorText', '');
    errorText.size(windowWidth / 2, 100);

    successText = createElement('successText', '');
    successText.size(windowWidth / 2, 100);

    changePWConfirmButton.mouseClicked(function(){
        errorText.html('');
        successText.html('');
        if (changePWNewPasswordField.value() == changePWConfirmNewPasswordField.value())
        {
            socket.emit('changePW', {
                pw: changePWPasswordField.value(), 
                newPw: changePWNewPasswordField.value()
            });
        }
        else
        {
            failedLogin(2);
        }
        changePWNewPasswordField.html('');
        changePWConfirmNewPasswordField.html('');
    });

    windowResized();
}

function leaveDrawing()
{
    socket.emit('typing', false);
    isDrawingOpen = false;

    cancelPictureButton.remove();
    sendPictureButton.remove();
    resetPictureButton.remove();
    background.remove();

    pictureCanvas.remove();
    pictureImage = undefined;

    smlPenButton.remove();
    midPenButton.remove();
    lrgPenButton.remove();
    masPenButton.remove();
    paintBucketButton.remove();

    blackColorButton.remove();
    whiteColorButton.remove();
}

function sendDrawing()
{
    const white = [255, 255, 255, 255];
    let pack = [];

    pictureImage.loadPixels();
    for (let y = 0; y < pictureImage.height; y++) 
    {
        for (let x = 0; x < pictureImage.width; x++) 
        {
            pack.push(sameColor(white, pictureImage.get(x, y)));
        }
    }

    socket.emit('drawing', pack);
    leaveDrawing();
}

function createChatRoom()
{
    textInputField = createElement('textarea', '');
    textInputField.attribute('placeholder', 'Chat here...');
    textInputField.input(sendTyping);

    pictureButton = createImg('palette.png');
    pictureButton.size(80, 80)
    pictureButton.attribute('class', 'interact');
    pictureButton.mouseClicked(function(){
        if (tempRank == 'guest')
        {
            chatBox.html('\n<b>You need an account to draw pictures.</b>', true);
            chatBox.html('\n<b>Refresh the page or leave the room and logout to create an account.</b>', true);
            chatBox.html('\n\n ', true);
        }
        else if (!isDrawingOpen)
        {
            isDrawingOpen = true;
            socket.emit('typing', true);

            background = createDiv('');
            background.attribute('class', 'modal');

            cancelPictureButton = createButton('Cancel');
            cancelPictureButton.mouseClicked(leaveDrawing);
            cancelPictureButton.size(120, 40);
            cancelPictureButton.style('font-size', '22px');
            cancelPictureButton.style('background-color', '#d23f2f');
            cancelPictureButton.style('border', '2px solid #9d1611');
            cancelPictureButton.parent(background);

            sendPictureButton = createButton('Send');
            sendPictureButton.mouseClicked(sendDrawing);
            sendPictureButton.size(120, 40);
            sendPictureButton.style('font-size', '22px');
            sendPictureButton.style('background-color', '#34be54');
            sendPictureButton.style('border', '2px solid #118f35');
            sendPictureButton.parent(background);

            resetPictureButton = createButton('Reset');
            resetPictureButton.mouseClicked(resetPicture);
            resetPictureButton.size(120, 40);
            resetPictureButton.style('font-size', '22px');
            resetPictureButton.parent(background);
       
            smlPenButton = createImg('smlPen.png');
            smlPenButton.size(40, 40);
            smlPenButton.mouseClicked(function(){ pen = 1; });
            smlPenButton.parent(background);
            smlPenButton.attribute('class', 'interact');
            midPenButton = createImg('midPen.png');
            midPenButton.size(40, 40);
            midPenButton.mouseClicked(function(){ pen = 2; });
            midPenButton.parent(background);
            midPenButton.attribute('class', 'interact');
            lrgPenButton = createImg('lrgPen.png');
            lrgPenButton.size(40, 40);
            lrgPenButton.mouseClicked(function(){ pen = 3; });
            lrgPenButton.parent(background);
            lrgPenButton.attribute('class', 'interact');
            masPenButton = createImg('masPen.png');
            masPenButton.size(40, 40);
            masPenButton.mouseClicked(function(){ pen = 4; });
            masPenButton.parent(background);
            masPenButton.attribute('class', 'interact');
            paintBucketButton = createImg('paintBucket.png');
            paintBucketButton.size(40, 40);
            paintBucketButton.mouseClicked(function(){ pen = -1; });
            paintBucketButton.parent(background);
            paintBucketButton.attribute('class', 'interact');

            whiteColorButton = createImg('whiteColor.png');
            whiteColorButton.size(40, 40);
            whiteColorButton.mouseClicked(function(){ penColor = [255, 255, 255, 255]; });
            whiteColorButton.parent(background);
            whiteColorButton.attribute('class', 'interact');
            blackColorButton = createImg('blackColor.png');
            blackColorButton.size(40, 40);
            blackColorButton.mouseClicked(function(){ penColor = [0, 0, 0, 255]; });
            blackColorButton.parent(background);
            blackColorButton.attribute('class', 'interact');

            if (pictureCanvas != undefined)
            {
                pictureCanvas.remove();
            }
            pictureCanvas = createCanvas(pictureWidth, pictureHeight);
            pictureCanvas.parent(background);

            pictureImage = createImage(pictureWidth, pictureHeight);
            resetPicture();

            windowResized();
        }
        fullScroll();
    });

    typingText = createElement('typing', 'Nobody is typing at the moment...');

    chatBox = createElement('chatbox', '<i>&nbsp;&nbsp;&nbsp;&nbsp;Welcome to <b>Room ' + room + '</b>! Type, then press enter to chat. Alternatively, click in the bottom right to draw a picture.\n\nVersion - <b>0.1.1</b>:</i>', true); 
    chatBox.html('\n<i>=> Notifications! Do <b>/notify</b>!</i>', true);
    chatBox.html('\n<i>=> Bug Reports and Suggestions! Do <b>/propose</b>!\n\nType <b>/help</b> to view what commands you can use.</i>\n ', true);

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

    friendsButton = createImg('friends.png');
    friendsButton.size(40, 40);
    friendsButton.mouseClicked(function(){ 
        chatBox.html('\n<b>Sorry bud, not implemented yet. Friends, and challenging them to games/minigames should come soon(ish).</b>\n ', true);
        chatBox.html('\nUse the command <b>/propose [TYPE (bug, suggestion)] [MESSAGE]</b> to propose what games should be added first, I think pool/billiards will be first.\n ', true);
    });
    friendsButton.attribute('class', 'interact');

    lastChatName = '';

    windowResized();
}

function resetPicture()
{
    pen = 2;
    penColor = isDarkMode ? [255, 255, 255, 255] : [0, 0, 0, 255];
    let usedColors = isDarkMode ? [0, 0, 0, 255] : [255, 255, 255, 255];

    pictureImage.loadPixels();
    for (let x = 0; x < pictureImage.width; x++) 
    {
        for (let y = 0; y < pictureImage.height; y++) 
        {
            pictureImage.set(x, y, usedColors);
        }
    }
    pictureImage.updatePixels();
}

function addCommandLine()
{
    if (tempRank != 'guest')
    {
        chatBox.html('\nYour rank allows you to use these commands:\n', true);
        chatBox.html('\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>=== Basic Commands ===</b>\n', true);
        chatBox.html('<b>/style [STYLE (light, dark)]</b>\n', true);
        chatBox.html('&nbsp;&nbsp;=> Changes the webpage to either light mode (default) or dark mode.\n\n', true);
        chatBox.html('<b>/whisper [NAME] [MESSAGE]</b>\n', true);
        chatBox.html('&nbsp;&nbsp;=> Silently messages the user so nobody else can see, works across different and same rooms.\n\n', true);
        chatBox.html('<b>/propose [TYPE (bug, suggestion)] [MESSAGE]</b>\n', true);
        chatBox.html('&nbsp;&nbsp;=> Logs your suggestion later so that Tim can read and act on your proposals.\n\n', true);
        chatBox.html('<b>/notify [TYPE (enable, disable) (default enable)]\n', true);
        chatBox.html('&nbsp;&nbsp;=> Requests permission to display notifications or turns them off.\n\n ', true);
        if (tempRank == 'admin' || tempRank == 'mod')
        {
            chatBox.html('\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>=== Admin/Mod Commands ===</b>\n', true);
            chatBox.html('<b>/rank [NAME] [RANK]</b>\n', true);
            chatBox.html('&nbsp;&nbsp;=> Changes the rank for the given user to the one specified.\n\n', true);
            chatBox.html('<b>/delete [NAME]</b>\n', true);
            chatBox.html('&nbsp;&nbsp;=> PERMANENTLY deletes the account of the given user.\n', true);
            chatBox.html('\nList of valid ranks: reg, +, ++, mod, admin, guest (guest cannot be changed or set)\n\n ', true);
        }
    }
    else
    {
        chatBox.html("\nAs a guest you don't have access to any commands or extras (like dark mode), create an account to gain access to these.\n  ", true);
    }
}

function attemptGuest()
{
    tempUsername = guestUsernameField.value();
    socket.emit('init', tempUsername);
    guestUsernameField.value('');
}

function attemptLogin() 
{
    errorText.html('');
    tempUsername = loginUsernameField.value();
    socket.emit('login', {
        un: tempUsername,
        pw: loginPasswordField.value()
    });
    loginUsernameField.value('');
    loginPasswordField.value('');
}

function attemptRegister() 
{
    errorText.html('');
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

function acceptedLogin(data)
{
    tempRank = data;
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
    else if (data == 4)
    {
        errorText.html('Login invalid, please try again later.')
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
    if (tempRank != 'guest')
    {
        changePassword.remove();
    }

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

function leavePasswordChange()
{
    backToLobby.remove();
    successText.remove();

    changePWHolder.remove();
    changePWName.remove();
    changePWPasswordField.remove();
    changePWNewPasswordField.remove();
    changePWConfirmButton.remove();
}

function leaveRoom()
{
    stillOpen = false;

    textInputField.remove();
    pictureButton.remove();
    chatBox.remove();
    userList.remove();
    typingText.remove();
    welcomeText.remove();

    lobbyButton.remove();
    friendsButton.remove();
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
        logout.position(windowWidth - 98, 8);
        if (tempRank != 'guest')
        {
            changePassword.position(windowWidth - 198, windowHeight - 38);
        }
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
    else if (state == States.changePw)
    {
        backToLobby.position(windowWidth - 98, 8);

        changePWHolder.position(windowWidth * 0.333 + 6, 60);
        changePWName.size(changePWHolder.size().width - 24, 50);
        changePWName.position(0, 0);

        changePWPasswordField.size(changePWHolder.size().width - 48, 50);
        changePWPasswordField.position(12, 62);

        changePWNewPasswordField.size(changePWHolder.size().width - 48, 50);
        changePWNewPasswordField.position(12, 62 + 12 + 50);

        changePWConfirmNewPasswordField.size(changePWHolder.size().width - 48, 50);
        changePWConfirmNewPasswordField.position(12, 62 + 12 + 50 + 12 + 50);

        changePWConfirmButton.position((changePWHolder.size().width - 160) / 2, changePWHolder.size().height - 50);

        errorText.position(windowWidth / 4, windowHeight - 110);
        successText.position(windowWidth / 4, windowHeight - 110);
    }
    else if (state == States.room)
    {
        textInputField.position(0, windowHeight - (80 + 16));
        pictureButton.position(windowWidth - 80 - 8, windowHeight - 80 - 8);
        chatBox.position(0, 48);
        userList.position(windowWidth - 240, 48);
        chatBoxHeight = windowHeight - 80 - 32 - 48 - 8 - 24; // 8 for border
        typingText.position(0, windowHeight - (80 + 16 + 32));
        welcomeText.position(0,0);

        lobbyButton.position(windowWidth - 180, 8);
        friendsButton.position(windowWidth - 180 - 48, 8);

        if (isDrawingOpen)
        {
            cancelPictureButton.position(8, windowHeight - 40 - 8);
            smlPenButton.position(16 + 120 , windowHeight - 40 - 8);
            midPenButton.position(16 + 120 + 48, windowHeight - 40 - 8);
            lrgPenButton.position(16 + 120 + 48 + 48, windowHeight - 40 - 8);
            masPenButton.position(16 + 120 + 48 + 48 + 48, windowHeight - 40 - 8);
            paintBucketButton.position(16 + 120 + 48 + 48 + 48 + 48, windowHeight - 40 - 8);

            sendPictureButton.position(windowWidth - 120 - 8, windowHeight - 40 - 8);
            blackColorButton.position(windowWidth - 120 - 8 - 48, windowHeight - 40 - 8);
            whiteColorButton.position(windowWidth - 120 - 8 - 48 - 48, windowHeight - 40 - 8);
            resetPictureButton.position(windowWidth - 120 - 8 - 48 - 48 - 128, windowHeight - 40 - 8);

            let xMod = (windowWidth - 60) / pictureWidth;
            let yMod = (windowHeight - 90) / pictureHeight;
            let multi = xMod < yMod ? xMod : yMod;
            resizeCanvas(pictureWidth * multi, pictureHeight * multi);
            
            pictureCanvas.position(windowWidth / 2 - width / 2, windowHeight / 2 - 20 - height / 2);
        }
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
        userList.html("\n\n" + (data[i].active ? "● " : "◌ ") + getNameSpanner(data[i].rank) + data[i].un + "</span>", true);
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
        chatBox.html("\n\n" + data.time + " - <b>" + getNameSpanner(data.rank) + data.username + "</span></b>:\n" + getMessageSpanner(data.rank) + data.message + "</span>\n ", true);
    }
    else
    {
        lastMessageTimeStamp = data.timeStamp;
        if (lastChatName != data.username)
        {
            chatBox.html("\n\n&nbsp;&nbsp;&nbsp;&nbsp;<b>" + getNameSpanner(data.rank) + data.username + "</span></b>:\n" + getMessageSpanner(data.rank) + data.message + "</span>\n ", true);
        }
        else
        {
            chatBox.html("\n" + getMessageSpanner(data.rank) + data.message + "</span>\n ", true);
        }
    }

    notification(data.username + ": " + data.message);

    lastChatName = data.username;

    if (isTop)
    {
        fullScroll();
    }
}

function addDrawing(data)
{
    let isTop = isScrolled();

    chatBox.html(chatBox.html().slice(0, chatBox.html().length - 3));
    //Put message in chatbox
    if (lastMessageTimeStamp == null || data.timeStamp > lastMessageTimeStamp + noChatDisplayTime || data.timeStamp > lastPrintedMessageTimeStamp + forceDisplayTime)
    {
        lastMessageTimeStamp = data.timeStamp;
        lastPrintedMessageTimeStamp = data.timeStamp;
        chatBox.html("\n\n" + data.time + " - <b>" + getNameSpanner(data.rank) + data.username + "</span></b>:\n", true);
    }
    else
    {
        lastMessageTimeStamp = data.timeStamp;
        if (lastChatName != data.username)
        {
            chatBox.html("\n\n&nbsp;&nbsp;&nbsp;&nbsp;<b>" + getNameSpanner(data.rank) + data.username + "</span></b>:\n", true);
        }
        else
        {
            chatBox.html("\n", true);
        }
    }

    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    // size the canvas to your desired image
    canvas.width = pictureWidth;
    canvas.height = pictureHeight;

    // get the imageData and pixel array from the canvas
    let imgData = ctx.getImageData(0,0,pictureWidth,pictureHeight);
    let pixelData = imgData.data;

    // manipulate some pixel elements
    for(let i = 0; i < data.image.length; ++i)
    {
        if (data.image[i])
        {
            pixelData[i * 4] = 255;   // set every red pixel element to 255
            pixelData[i * 4 + 1] = 255; 
            pixelData[i * 4 + 2] = 255; 
        }
        else
        {
            pixelData[i * 4] = 0;   // set every red pixel element to 255
            pixelData[i * 4 + 1] = 0; 
            pixelData[i * 4 + 2] = 0; 
        }
        pixelData[i * 4 + 3] = 255; // make this pixel opaque
    }

    // put the modified pixels back on the canvas
    ctx.putImageData(imgData,0,0);

    // create a new img object
    let image=new Image();

    // set the img.src to the canvas data url
    image.src = canvas.toDataURL();
    image.setAttribute('class', 'drawing');

    // append the new img object to the page
    chatBox.html("\n", true);

    chatBox.elt.appendChild(image);
    chatBox.html("\n  ", true);

    notification(data.username + " sent a drawing.");

    lastChatName = data.username;

    if (isTop)
    {
        forceFullScroll = 5;
        fullScroll();
    }
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

function getMessageSpanner(rank) // used for rank colours
{
    if (rank == 'admin')
    {
        return '<span class="adminText">';
    }
    if (rank == 'mod')
    {
        return '<span class="modText">';
    }
    if (rank == '+')
    {
        return '<span class="plusText">';
    }
    if (rank == '++')
    {
        return '<span class="plusPlusText">';
    }
    if (rank == 'guest')
    {
        return '<span class="guestText">';
    }
    return '<span class="baseText">';
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

    notification(data.username + data.message);

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
        if (lastMillis < millis() - 1500)
        {
            lastMillis = millis();
            socket.emit('status', focused)
        }

        if (isDrawingOpen)
        {
            pictureCanvas.background(147);
            if (mouseIsPressed && pen >= 0)
            {
                if ((mouseX >= 0 && mouseY >= 0 && mouseX <= pictureCanvas.width && mouseY <= pictureCanvas.height) || (pmouseX >= 0 && pmouseY >= 0 && pmouseX <= pictureCanvas.width && pmouseY <= pictureCanvas.height))
                {
                    let realX = mouseX * (pictureWidth / pictureCanvas.width);
                    let realY = mouseY * (pictureHeight / pictureCanvas.height);
                    let diffX = (pmouseX * (pictureWidth / pictureCanvas.width)) - realX;
                    let diffY = (pmouseY * (pictureHeight / pictureCanvas.height)) - realY;
                    let iterations = sqrt((diffX * diffX) + (diffY * diffY));

                    pictureImage.loadPixels();
                    for (let i = 0; i <= iterations; ++i)
                    {
                        for (let x = -pen + 1; x < pen; ++x)
                        {
                            for (let y = -pen + 1; y < pen; ++y)
                            {
                                let xx = floor(realX) + x;
                                let yy = floor(realY) + y;
                                if (xx >= 0 && xx < pictureWidth && yy >= 0 && yy < pictureHeight && sqrt((x * x) + (y * y)) <= pen - 0.5)
                                {
                                    pictureImage.set(xx, yy, penColor);
                                }
                            }
                        }

                        realX += diffX / iterations;
                        realY += diffY / iterations;
                    }
                    pictureImage.updatePixels();
                }
            }
            image(pictureImage, 0, 0, pictureCanvas.width, pictureCanvas.height);
        }
        else
        {
            if (typingMillis < millis() - 4000)
            {
                typingMillis = Infinity;
                socket.emit('typing', isDrawingOpen);
            }

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

        if (forceFullScroll >= 0)
        {
            if (forceFullScroll == 0)
            {
                fullScroll();
            }
            forceFullScroll--;
        }
    }
}

function mousePressed()
{
    if (isDrawingOpen && pen < 0)
    {
        if (mouseX >= 0 && mouseY >= 0 && mouseX <= pictureCanvas.width && mouseY <= pictureCanvas.height)
        {
            if (pen == -1)
            {
                let realX = floor(mouseX * (pictureWidth / pictureCanvas.width));
                let realY = floor(mouseY * (pictureHeight / pictureCanvas.height));

                pictureImage.loadPixels();
                let originColor = pictureImage.get(realX, realY);
                if (!sameColor(originColor, penColor))
                {
                    let frontier = new Array();
                    frontier.unshift({x: realX, y: realY, dir: -1});
                    pictureImage.set(realX, realY, penColor);

                    while (frontier.length > 0)
                    {
                        let newF = frontier.pop();
                        if (newF.dir != 2 && newF.x > 0 && sameColor(pictureImage.get(newF.x - 1, newF.y), originColor)) { pictureImage.set(newF.x - 1, newF.y, penColor); frontier.unshift({x: newF.x - 1, y: newF.y, dir: 0}); }
                        if (newF.dir != 3 && newF.y > 0 && sameColor(pictureImage.get(newF.x, newF.y - 1), originColor)) { pictureImage.set(newF.x, newF.y - 1, penColor); frontier.unshift({x: newF.x, y: newF.y - 1, dir: 1}); }
                        if (newF.dir != 0 && newF.x < pictureWidth - 1 && sameColor(pictureImage.get(newF.x + 1, newF.y), originColor)) { pictureImage.set(newF.x + 1, newF.y, penColor); frontier.unshift({x: newF.x + 1, y: newF.y, dir: 2}); }
                        if (newF.dir != 1 && newF.y < pictureHeight - 1 && sameColor(pictureImage.get(newF.x, newF.y + 1), originColor)) { pictureImage.set(newF.x, newF.y + 1, penColor); frontier.unshift({x: newF.x, y: newF.y + 1, dir: 3}); }
                    }
                }
                pictureImage.updatePixels();
            }
        }
    }
}

function sameColor(a, b)
{
    return red(a) == red(b) && green(a) == green(b) && blue(a) == blue(b);
}

function sendTyping()
{
    if (keyCode != 13)
    {
        typingMillis = millis();
        socket.emit('typing', true);
    }
}

function keyPressed()
{
    if (keyCode == 13 && !keyIsDown(16) && textInputField.value() != '') // not shift and enter
    {
        textInputField.value(textInputField.value().replace(/^\s+|\s+$/g, '')); //remove start and end
        textInputField.value(textInputField.value().replace(/\n\s*\n/g, '\n')); //remove duplicates

        if (textInputField.value().length >= 2000)
        {
            chatBox.html('<b>\nYour message is too long please keep it under 2000 characters.\n </b>', true);
            fullScroll();
        }
        else if (textInputField.value().split(/\r\n|\r|\n/).length >= 30)
        {
            chatBox.html('<b>\nYour message is too long please keep it under 30 lines.\n </b>', true);
            fullScroll();
        }

        if (textInputField.value() == '/help')
        {
            addCommandLine();
            fullScroll();
            resetFields = true;
        }
        else if (tempRank != 'guest' && textInputField.value().split(' ')[0] == '/notify')
        {
            if (textInputField.value().split(' ').length == 2 && textInputField.value().split(' ')[1] == 'disable')
            {
                everNotify = false;
                chatBox.html('\nAwww. Sorry for annoying you, please leave a suggestion using <b>/propose</b> on how we could improve. :(\n ', true); 
            }
            else
            {
                if (Notification.permission === 'granted')
                {
                    if (!everNotify)
                    {
                        everNotify = true;
                        chatBox.html('\nThank you for enabling notifications. :)\n ', true); 
                    }
                    else
                    {
                        chatBox.html('\nNotifications were already enabled. If you wanted to disable them do: <b>/notify disable</b>.\n ', true);
                    }
                }
                else
                {
                    Notification.requestPermission(function(permission) { 
                        if (permission === 'granted')
                        {
                            everNotify = true;
                            chatBox.html('\nThank you for enabling notifications. :)\n ', true); 
                        }
                        else
                        {
                            chatBox.html('\nAwww, thats too bad. Please think about enabling me! :(\n ', true); 
                        }
                    });
                }
            }
            resetFields = true;
        }
        else if (tempRank != 'guest' && textInputField.value().split(' ')[0] == '/style')
        {
            if (textInputField.value().split(' ').length == 2 && textInputField.value().split(' ')[1] == 'light')
            {
                document.getElementById('pagestyle').setAttribute('href', 'css/light.css');
                isDarkMode = false;
            }
            else if (textInputField.value().split(' ').length == 2 && textInputField.value().split(' ')[1] == 'dark')
            {
                document.getElementById('pagestyle').setAttribute('href', 'css/dark.css');
                isDarkMode = true;
            }
            else
            {
                chatBox.html('\nYour options for this command are: <b>light</b> or <b>dark</b>.', true);
                chatBox.html('\n/style [STYLE (light, dark)].\n ', true);
            }
            resetFields = true;
        }
        else if (tempRank != 'guest' && textInputField.value().split(' ')[0] == '/propose')
        {
            if (textInputField.value().split(' ').length > 2 && (textInputField.value().split(' ')[1] == 'bug' || textInputField.value().split(' ')[1] == 'suggestion'))
            {
                socket.emit('chat', textInputField.value());
                resetFields = true;
            }
            else
            {
                chatBox.html('\nYour options for this command are: <b>bug</b> or <b>suggestion</b>.', true);
                chatBox.html('\n/propose [TYPE (bug, suggestion)] [MESSAGE].\n ', true);
            }
            resetFields = true;
        }
        else if (textInputField.value() != '')
        {
            socket.emit('chat', textInputField.value());
            resetFields = true;
        }
    }
}
