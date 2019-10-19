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

//drawing and friends
let background;

//drawing
let cancelPictureButton;
let sendPictureButton;
let resetPictureButton;

let pictureErrorText;
let pictureErrorTimer = 0;

let pictureCanvas;
let pictureImage;

let smlPenButton;
let midPenButton;
let lrgPenButton;
let masPenButton;
let paintBucketButton;

let whiteColorButton;
let blackColorButton;
let redColorButton;
let greenColorButton;
let blueColorButton;
let yellowColorButton;

//friends
let leaveFriendsButton;
let welcomeFriend;
let friendSelection;
let friendsList;
let friendChatBox;

let friendsListButton;
let friendRequestsButton;

//end

let resetFields = false;
let lastMessageTimeStamp = null;
let lastPrintedMessageTimeStamp = null;
let lastMessageMillis;
let lastLength = 0;
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

const whiteC = [255, 255, 255, 255];
const blackC = [0, 0, 0, 255];
const redC = [255, 0, 0, 255];
const greenC = [50, 205, 50, 255];
const blueC = [0, 0, 255, 255];
const yellowC = [240, 210, 0, 255];

let pen = 2;
let penColor = blackC;

let isDrawingOpen = false;
let forceFullScroll = -1;

let isFriendsOpen = false;

let notify;
let stillOpen = false;
let everNotify = true;
let hasFocus = true;
let notifyMessage = 'Pictochat';

let slowMillis = 0;
let isSlowed = false;

const slowModeSlowdown = 3;

function checkPageFocus() 
{
    hasFocus = document.hasFocus();
    if (hasFocus && notifyMessage != 'Pictochat')
    {
        notifyMessage = 'Pictochat';
        document.title = 'Pictochat';
        document.getElementById("icon16").href = "/icons/norm/favicon-16x16.png";
        document.getElementById("icon32").href = "/icons/norm/favicon-32x32.png";
        document.getElementById("icon96").href = "/icons/norm/favicon-96x96.png";
    }
}

function swapTitle()
{
    if (document.title != notifyMessage && notifyMessage != 'Pictochat')
    {
        document.title = notifyMessage;
    }
    else if (notifyMessage != 'Pictochat')
    {
        document.title = 'Pictochat';
    }
}

function setup()
{
    setInterval(checkPageFocus, 500);
    setInterval(swapTitle, 750);

    createMain();

    socket = io();

    socket.on('newChatMessage', addChatMessage);
    socket.on('newDrawing', addDrawing);
    socket.on('newChatAnnouncement', addChatAnnouncement);
    socket.on('newUserList', updateUserList);
    socket.on('friendList', updateFriendList);
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
                typingText.html('<span class="baseText">Several people are typing</span>.');
            }
        }
    });
    socket.on('pwSuccess', function(){
        successText.html('Password change was successful.');
    });
    socket.on('changeTempRank', function(data){
        tempRank = data;
    });
    socket.on('ipban', function(data){
        if (data == -1)
        {
            let ban = getCookie('ban');
            if (ban != '' && parseInt(ban) >= new Date().getTime())
            {
                errorText.html('Your ip-ban has been lifted. Say thank you!');
                notification('You have been unbanned!', true);
            }
        }
        setCookie('ban', new Date().getTime() + data * 60 * 1000, 1);
        window.localStorage.setItem('ban', new Date().getTime() + data * 60 * 100);
        sessionStorage.setItem('ban', new Date().getTime() + data * 60 * 100);
    });
    socket.on('slow', function(data) {
        if (data == -1)
        {
            slowMillis = 0;
            isSlowed = false;
            addChatAnnouncement()
        }
        else
        {
            slowMillis = millis() + data * 1000 * 60;
            isSlowed = true;
        }
    });
}

function setCookie(cname, cvalue, exdays) 
{
    let d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

function notification(message, force)
{
    if ((!hasFocus && !stillOpen && everNotify) || force)
    {
        notifyMessage = message;
        document.title = message;

        document.getElementById("icon16").href = "/icons/alert/favicon-16x16.png";
        document.getElementById("icon32").href = "/icons/alert/favicon-32x32.png";
        document.getElementById("icon96").href = "/icons/alert/favicon-96x96.png";

        var options = {
            silent: true
        }

        ua = navigator.userAgent;
        if (!(ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1))
        {
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
}

function kill(message)
{
    if (state == States.room) { leaveRoom(); }
    if (state == States.lobby) { leaveLobby(); }
    if (state == States.changePw) { leavePasswordChange(); }
    if (state != States.main) { state = States.main; createMain(); }
    if (isFriendsOpen) { leaveFriends(); }
    if (isDrawingOpen) { leaveDrawing(); }

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

    if (friendsButton != undefined && friendsButton != null)
    {
        friendsButton.remove();
        friendsButton = undefined;
    }

    windowResized();
}

function createLobby()
{
    logout = createButton('Logout');
    logout.size(170, 40);
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
    cButton = createButton('Join Room C (<b>Accounts Only</b>).');
    cText  = createElement('chatterCount', cRoomCount + ' Chatters Active.');
    dButton = createButton('Join Room D (<b>Ranked Only</b>).');
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
        if (tempRank != 'guest')
        {
            socket.emit('room', 'c');
            room = "C";
            leaveLobby();
            state = States.room;
            createChatRoom();
        }
        else
        {
            cButton.html('Room C is only for people who have an account and are not guests.')
        }
    });
    dButton.mouseClicked(function(){
        if (tempRank != 'guest' && tempRank != 'reg')
        {
            socket.emit('room', 'd');
            room = "D";
            leaveLobby();
            state = States.room;
            createChatRoom();
        }
        else
        {
            dButton.html('Room D is only for people who have the rank +, ++, mod, or admin.')
        }
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

    if (friendsButton == undefined && tempRank != 'guest')
    {  
        friendsButton = createImg('friends.png');
        friendsButton.size(40, 40);
        friendsButton.mouseClicked(createFriends);
        friendsButton.attribute('class', 'interact');
    }

    windowResized();
}

function createPasswordChange()
{
    backToLobby = createButton('Lobby');
    backToLobby.size(170, 40);

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
    redColorButton.remove();
    greenColorButton.remove();
    blueColorButton.remove();
    yellowColorButton.remove();

    pictureErrorText.remove();
}

function sendDrawing()
{
    if (millis() - 4000 * (isSlowed ? slowModeSlowdown : 1) <= lastMessageMillis)
    {
        chatBox.html('<b>\nYou are attempting to send drawings too fast, please wait ' + (4 * (isSlowed ? slowModeSlowdown : 1)) + ' seconds between drawings.</b>\n ', true);
        pictureErrorText.html('<b>\nYou are attempting to send drawings too fast, please wait ' + (4 * (isSlowed ? slowModeSlowdown : 1)) + ' seconds between drawings.</b>');
        pictureErrorTimer = millis() + 3000;
        fullScroll();
    }
    else
    {
        lastMessageMillis = millis();
        let pack = [];

        pictureImage.loadPixels();
        for (let y = 0; y < pictureImage.height; y++) 
        {
            for (let x = 0; x < pictureImage.width; x++) 
            {
                pack.push(getColorCode(pictureImage.get(x, y)));
            }
        }

        socket.emit('drawing', pack);
        leaveDrawing();
    }
}

function getColorCode(color)
{
    if (sameColor(whiteC, color))
    {
        return 0;
    }
    if (sameColor(blackC, color))
    {
        return 1;
    }
    if (sameColor(redC, color))
    {
        return 2;
    }
    if (sameColor(greenC, color))
    {
        return 3;
    }
    if (sameColor(blueC, color))
    {
        return 4;
    }
    return 5;
}

function setColorCode(code)
{
    if (code == 0)
    {
        return whiteC;
    }
    if (code == 1)
    {
        return blackC;
    }
    if (code == 2)
    {
        return redC;
    }
    if (code == 3)
    {
        return greenC;
    }
    if (code == 4)
    {
        return blueC;
    }
    return yellowC;
}

function createFriends() //pls teach me now
{
    isFriendsOpen = true;

    background = createDiv('');
    background.attribute('class', 'modal');

    leaveFriendsButton = createButton('Leave Friends');
    leaveFriendsButton.mouseClicked(leaveFriends);
    leaveFriendsButton.size(170, 40);
    leaveFriendsButton.parent(background);

    welcomeFriend = createElement('welcome', 'Welcome, <b>' + username + '</b>, to <b>Friends and DMs</b>.');
    welcomeFriend.style('color', '#ddd');
    welcomeFriend.parent(background);

    friendChatBox = createElement('friendBox', '<i>&nbsp;&nbsp;&nbsp;&nbsp;Sorry buds, this is still not available, but it is being worked on!</b></i>', true); 
    friendChatBox.parent(background);

    friendsList = createElement('listbox', '<i>Friends List:\n</i>');
    friendsList.parent(background);

    friendsListButton = createButton('Friends List');
    friendsListButton.size(240 - 16, 40);
    friendsListButton.parent(background);

    friendSelection = createElement('select', '');
    friendSelection.parent(background);
    updateFriendSelection([]);

    friendRequestsButton = createButton('Friend Requests');
    friendRequestsButton.size(240 - 16, 40);
    friendRequestsButton.parent(background);

    socket.emit('requestFriends');

    windowResized();
}

function leaveFriends()
{
    isFriendsOpen = false;

    background.remove();

    leaveFriendsButton.remove();
    friendChatBox.remove();
    friendsList.remove();

    friendsListButton.remove();
    friendRequestsButton.remove();
}

function selectPenSizeButton(button)
{
    smlPenButton.attribute('class', 'interact');
    midPenButton.attribute('class', 'interact');
    lrgPenButton.attribute('class', 'interact');
    masPenButton.attribute('class', 'interact');
    paintBucketButton.attribute('class', 'interact');

    button.attribute('class', 'selected');
}

function selectPenColorButton(button)
{
    whiteColorButton.attribute('class', 'interact');
    blackColorButton.attribute('class', 'interact');
    redColorButton.attribute('class', 'interact');
    greenColorButton.attribute('class', 'interact');
    blueColorButton.attribute('class', 'interact');
    yellowColorButton.attribute('class', 'interact');

    button.attribute('class', 'selected');
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
            smlPenButton.mouseClicked(function(){ pen = 1; selectPenSizeButton(smlPenButton); });
            createDrawingButton(smlPenButton);
            midPenButton = createImg('midPen.png');
            midPenButton.mouseClicked(function(){ pen = 2; selectPenSizeButton(midPenButton); });
            createDrawingButton(midPenButton);
            lrgPenButton = createImg('lrgPen.png');
            lrgPenButton.mouseClicked(function(){ pen = 3; selectPenSizeButton(lrgPenButton); });
            createDrawingButton(lrgPenButton);
            masPenButton = createImg('masPen.png');
            masPenButton.mouseClicked(function(){ pen = 4; selectPenSizeButton(masPenButton); });
            createDrawingButton(masPenButton);
            paintBucketButton = createImg('paintBucket.png');
            paintBucketButton.mouseClicked(function(){ pen = -1; selectPenSizeButton(paintBucketButton); });
            createDrawingButton(paintBucketButton);

            whiteColorButton = createImg('whiteColor.png');
            whiteColorButton.mouseClicked(function(){ penColor = whiteC; selectPenColorButton(whiteColorButton); });
            createDrawingButton(whiteColorButton);
            blackColorButton = createImg('blackColor.png');
            blackColorButton.mouseClicked(function(){ penColor = blackC; selectPenColorButton(blackColorButton); });
            createDrawingButton(blackColorButton);
            redColorButton = createImg('redColor.png');
            redColorButton.mouseClicked(function(){ penColor = redC; selectPenColorButton(redColorButton); });
            createDrawingButton(redColorButton);
            greenColorButton = createImg('greenColor.png');
            greenColorButton.mouseClicked(function(){ penColor = greenC; selectPenColorButton(greenColorButton); });
            createDrawingButton(greenColorButton);
            blueColorButton = createImg('blueColor.png');
            blueColorButton.mouseClicked(function(){ penColor = blueC; selectPenColorButton(blueColorButton); });
            createDrawingButton(blueColorButton);
            yellowColorButton = createImg('yellowColor.png');
            yellowColorButton.mouseClicked(function(){ penColor = yellowC; selectPenColorButton(yellowColorButton); });
            createDrawingButton(yellowColorButton);
    
            pictureErrorText = createElement('errorText', '');
            pictureErrorText.size(windowWidth / 2, 100);
            pictureErrorText.parent(background);

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

    chatBox = createElement('chatbox', '<i>&nbsp;&nbsp;&nbsp;&nbsp;Welcome to <b>Room ' + room + '</b>! Type, then press enter to chat. Alternatively, click in the bottom right to draw a picture.\n\nVersion - <b>0.1.4</b>:</i>', true); 
    chatBox.html("\n<i>=> Even more spam protection!</i>", true);
    chatBox.html("\n<i>=> <b>/check</b> is now only usable by + ranked users.</i>", true);
    chatBox.html('\n<i>=> <b>/slow</b> and <b>/unslow</b> are commands for ++ ranked users to help prevent spamming.</i>', true);
    chatBox.html("\n<i>=> If you want a rank, contact a mod/admin or use pictochat actively and respectfully, then you may automatically receive a rank at the end of the day.</i>\n ", true);
    
    if (tempRank != 'guest') { chatBox.html('\n<i> Type <b>/help</b> to see what commands you can use, and how to use them.</i>\n ', true); }

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

function createDrawingButton(button)
{
    button.size(40, 40);
    button.parent(background);
    button.attribute('class', 'interact');
}

function resetPicture()
{
    pen = 2;
    midPenButton.attribute('class', 'selected');

    penColor = isDarkMode ? whiteC : blackC;
    let usedColors = isDarkMode ? blackC : whiteC;
    if (isDarkMode)
    {
        whiteColorButton.attribute('class', 'selected');
    }
    else
    {
        blackColorButton.attribute('class', 'selected');
    }

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
        chatBox.html('\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>=== Regular Commands ===</b>\n', true);
        chatBox.html('<b>/style [STYLE (light, dark)]</b>\n', true);
        chatBox.html('&nbsp;&nbsp;=> Changes the webpage to either light mode (default) or dark mode.\n', true);
        chatBox.html('<b>/whisper [NAME] [MESSAGE]</b>\n', true);
        chatBox.html('&nbsp;&nbsp;=> Silently messages the user so nobody else can see, works across different and same rooms.\n', true);
        chatBox.html('<b>/propose [TYPE (bug, suggestion, request)] [MESSAGE]</b>\n', true);
        chatBox.html('&nbsp;&nbsp;=> Logs your bug report, suggestion, or request so that Tim (Tigpan/pictochat owner) can read and act on your proposals after school.\n', true);
        chatBox.html('<b>/notify [TYPE (enable, disable)]\n', true);
        chatBox.html('&nbsp;&nbsp;=> Enables or disables notifications.\n ', true);
        if (tempRank != 'reg')
        {
            chatBox.html('\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>=== + Commands ===</b>\n', true);
            chatBox.html('<b>/check [USERNAME]\n', true);
            chatBox.html('&nbsp;&nbsp;=> Tells you if that account exists, if it exists what its ranks is, if it is online and what room it is.\n ', true);

            if (tempRank != '+')
            {
                chatBox.html('\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>=== + + Commands ===</b>\n', true);
                chatBox.html('<b>/slow [NAME] [MINUTES (max 30)]\n', true);
                chatBox.html('&nbsp;&nbsp;=> Slows down how fast a user can chat by a third, for the time specified.\n', true);
                chatBox.html('<b>/unslow [NAME]\n', true);
                chatBox.html('&nbsp;&nbsp;=> Removes slowness that is applied to a user.\n ', true);

                if (tempRank == 'admin' || tempRank == 'mod')
                {
                    chatBox.html('\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>=== Admin/Mod Commands ===</b>\n', true);
                    chatBox.html('<b>/rank [NAME] [RANK]</b>\n', true);
                    chatBox.html('&nbsp;&nbsp;=> Changes the rank for the given user to the one specified.\n', true);
                    chatBox.html('<b>/delete [NAME]</b>\n', true);
                    chatBox.html('&nbsp;&nbsp;=> PERMANENTLY deletes the account of the given user.\n', true);
                    chatBox.html('<b>/ipban [NAME] [MINUTES (max 360)]</b>\n', true);
                    chatBox.html('&nbsp;&nbsp;=> Disables that computer from using pictochat for the specified minutes. Also returns a code to use for /liftban.\n', true);
                    chatBox.html('<b>/liftban [CODE]</b>\n', true);
                    chatBox.html('&nbsp;&nbsp;=> Removes an ipban using the code returned in /ipban.\n', true);
                    chatBox.html('<b>/liftallbans</b>\n', true);
                    chatBox.html('&nbsp;&nbsp;=> Removes all ip-bans currently active (use with caution).\n', true);
                    chatBox.html('\nList of valid ranks: reg, +, ++, mod, admin, guest (guest cannot be changed or set)\n ', true);
                }
            }
        }
    }
    else
    {
        chatBox.html("\nAs a guest you don't have access to any commands, friends, or extras, create an account to gain access to these.\n  ", true);
    }
}

function allowedToJoin()
{
    let cBan = getCookie('ban') == '' ? 0 : parseInt(getCookie('ban'));
    let lBan = window.localStorage.getItem('ban') == undefined ? 0 : window.localStorage.getItem('ban');
    let sBan = sessionStorage.getItem('ban') == undefined ? 0 : sessionStorage.getItem('ban');
    return Math.max(cBan, lBan, sBan);
}

function attemptGuest()
{
    let ban = allowedToJoin();
    if (ban < new Date().getTime())
    {
        tempUsername = guestUsernameField.value();
        socket.emit('init', tempUsername);
        guestUsernameField.value('');
    }
    else
    {
        errorText.html('Looks like you have been ip-banned. Your ban has ' + (ceil((ban - new Date().getTime()) / 1000 / 60 * 10) / 10) + ' minutes remaining...');
    }
}

function attemptLogin() 
{
    let ban = allowedToJoin();
    if (ban < new Date().getTime())
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
    else
    {
        errorText.html('Looks like you have been ip-banned. Your ban has ' + (ceil((ban - new Date().getTime()) / 1000 / 60 * 10) / 10) + ' minutes remaining...');
    }
}

function attemptRegister() 
{
    let ban = allowedToJoin();
    if (ban < new Date().getTime())
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
    else
    {
        errorText.html('Looks like you have been ip-banned. Your ban has ' + (ceil((ban - new Date().getTime()) / 1000 / 60 * 10) / 10) + ' minutes remaining...');
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
        logout.position(windowWidth - 178, 8);
        if (tempRank != 'guest')
        {
            friendsButton.position(windowWidth - 178 - 48, 8);
        }

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
        backToLobby.position(windowWidth - 178, 8);
        if (tempRank != 'guest')
        {
            friendsButton.position(windowWidth - 178 - 48, 8);
        }

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
        lobbyButton.position(windowWidth - 178, 8);
        if (tempRank != 'guest')
        {
            friendsButton.position(windowWidth - 178 - 48, 8);
        }

        textInputField.position(0, windowHeight - (80 + 16));
        pictureButton.position(windowWidth - 80 - 8, windowHeight - 80 - 8);
        chatBox.position(0, 48);
        userList.position(windowWidth - 240, 48);
        chatBoxHeight = windowHeight - 80 - 32 - 48 - 8 - 24; // 8 for border
        typingText.position(0, windowHeight - (80 + 16 + 32));
        welcomeText.position(0,0);
    }
    
    if (isDrawingOpen)
    {
        cancelPictureButton.position(8, windowHeight - 40 - 8);
        smlPenButton.position(16 + 120 , windowHeight - 40 - 8);
        midPenButton.position(16 + 120 + 48, windowHeight - 40 - 8);
        lrgPenButton.position(16 + 120 + 48 + 48, windowHeight - 40 - 8);
        masPenButton.position(16 + 120 + 48 + 48 + 48, windowHeight - 40 - 8);
        paintBucketButton.position(16 + 120 + 48 + 48 + 48 + 48, windowHeight - 40 - 8);

        sendPictureButton.position(windowWidth - 120 - 8, windowHeight - 40 - 8);

        redColorButton.position(windowWidth - 120 - 8 - 48, windowHeight - 40 - 8);
        greenColorButton.position(windowWidth - 120 - 8 - 48 - 48, windowHeight - 40 - 8);
        blueColorButton.position(windowWidth - 120 - 8 - 48 - 48 - 48, windowHeight - 40 - 8);
        yellowColorButton.position(windowWidth - 120 - 8 - 48 - 48 - 48 - 48, windowHeight - 40 - 8);
        blackColorButton.position(windowWidth - 120 - 8 - 48 - 48 - 48 - 48 - 48, windowHeight - 40 - 8);
        whiteColorButton.position(windowWidth - 120 - 8 - 48 - 48 - 48 - 48 - 48 - 48, windowHeight - 40 - 8);

        resetPictureButton.position(windowWidth - 120 - 8 - 48 - 48 - 48 - 48 - 48 - 48 - 128, windowHeight - 40 - 8);

        let xMod = (windowWidth - 60) / pictureWidth;
        let yMod = (windowHeight - 90) / pictureHeight;
        let multi = xMod < yMod ? xMod : yMod;
        resizeCanvas(pictureWidth * multi, pictureHeight * multi);
        
        pictureCanvas.position(windowWidth / 2 - width / 2, windowHeight / 2 - 20 - height / 2);

        pictureErrorText.position(windowWidth / 4, windowHeight - 130);
    }
    else if (isFriendsOpen)
    {
        leaveFriendsButton.position(windowWidth - 178, 8);

        welcomeFriend.position(0,0);
        friendSelection.position(0, 48);
        friendChatBox.position(0, 48 + 52);
        friendsList.position(windowWidth - 240, 48);

        friendsListButton.position(windowWidth - 232, windowHeight - 112);

        friendRequestsButton.position(windowWidth - 232, windowHeight - 52);
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

function updateFriendSelection(data)
{
    friendSelection.html('<option value="main">Friend Manager</option>');

    for (let i = 0; i < data.length; i++)
    {
        friendSelection.html('<option value="' + data[i].un + '">Direct Message: ' + getNameSpanner(data[i].rank) + data[i].un + '</span></option>', true);
    }
}

function updateFriendList(data)
{
    updateFriendSelection(data);
    friendsList.html("<i>Friends List:</i>");

    for (let i = 0; i < data.length; i++)
    {
        friendsList.html("\n\n" + (data[i].active ? "● " : "◌ ") + getNameSpanner(data[i].rank) + data[i].un + "</span>", true);
    }
    friendsList.html("\n ", true);
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

    notification(data.username + ": " + data.message, false);

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
        let c = setColorCode(data.image[i]);
        pixelData[i * 4] = red(c); 
        pixelData[i * 4 + 1] = green(c); 
        pixelData[i * 4 + 2] = blue(c); 
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

    notification(data.username + " sent a drawing.", false);

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

    notification(data.username + data.message, false);

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
            socket.emit('status', hasFocus)
        }

        if (isSlowed && millis() >= slowMillis)
        {
            isSlowed = false;
            chatBox.html('\n<span class="slow">Your slowness has run out, you can now chat freely.</span>\n ', true);
        }

        if (isDrawingOpen)
        {
            if (millis() > pictureErrorTimer)
            {
                pictureErrorText.html('');
            }
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
    if (state == States.main)
    {
        if (keyCode == 13) //enter
        {
            if (guestUsernameField.elt === document.activeElement)
            {
                attemptGuest();
            }
            else if (loginUsernameField.elt === document.activeElement || loginPasswordField.elt === document.activeElement)
            {
                attemptLogin();
            }
            else if (registerUsernameField.elt === document.activeElement || registerPasswordField.elt === document.activeElement || registerConfirmPasswordField.elt === document.activeElement)
            {
                attemptRegister();
            }
        }
    }
    else
    {
        if (keyCode == 13 && !keyIsDown(16) && textInputField.value() != '') // not shift and enter
        {
            textInputField.value(textInputField.value().replace(/^\s+|\s+$/g, '')); //remove start and end
            textInputField.value(textInputField.value().replace(/\n\s*\n/g, '\n')); //remove duplicates

            if (textInputField.value().length >= 1500)
            {
                chatBox.html('<b>\nYour message is too long please keep it under 1500 characters.</b>\n ', true);
            }
            else if (textInputField.value().split(/\r\n|\r|\n/).length >= 15)
            {
                chatBox.html('<b>\nYour message is too long please keep it under 15 lines.</b>\n ', true);
            }
            else if (millis() - 10000 * (isSlowed ? slowModeSlowdown : 1) < lastMessageMillis && lastLength >= 500 && textInputField.value().length >= 500)
            {
                chatBox.html('<b>\nYou are sending large messages too fast, please wait ' + (10 * (isSlowed ? slowModeSlowdown : 1)) + ' seconds between sending large messages.</b>\n ', true);
            }
            else if (millis() - 7500 * (isSlowed ? slowModeSlowdown : 1) < lastMessageMillis && lastLength >= 500)
            {
                chatBox.html('<b>\nYou are sending large messages too fast, please wait ' + (7.5 * (isSlowed ? slowModeSlowdown : 1)) + ' seconds after sending large messages.</b>\n ', true);
            }
            else if (millis() - 1500 * (isSlowed ? slowModeSlowdown : 1) < lastMessageMillis)
            {
                chatBox.html('<b>\nYou are sending messages too fast, please wait ' + (1.5 * (isSlowed ? slowModeSlowdown : 1)) + ' seconds between messages.</b>\n ', true);
            }
            else
            {
                lastMessageMillis = millis();
                if (textInputField.value() == '/help')
                {
                    addCommandLine();
                    resetFields = true;
                }
                else if (tempRank != 'guest' && textInputField.value().split(' ')[0] == '/notify')
                {
                    if (textInputField.value().split(' ').length == 2 && textInputField.value().split(' ')[1] == 'disable')
                    {
                        everNotify = false;
                        chatBox.html('\nAwww. Sorry for annoying you, please leave a suggestion using <b>/propose</b> on how we could improve. :(\n ', true); 
                    }
                    else if (textInputField.value().split(' ').length == 2 && textInputField.value().split(' ')[1] == 'enable')
                    {
                        chatBox.html('\nThank you for enabling notifications. :)\n ', true); 
                        everNotify = true;
                        if (!("Notification" in window)) 
                        {
                            Notification.requestPermission();
                        }
                    }
                    else
                    {
                        chatBox.html('\nYour options for this command are: <b>enable</b> or <b>disable</b>.', true);
                        chatBox.html('\n/notify [TYPE (enable, disable)].\n ', true);
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
                    else if (textInputField.value().split(' ').length == 2 && textInputField.value().split(' ')[1] == 'oled')
                    {
                        document.getElementById('pagestyle').setAttribute('href', 'css/oled.css');
                        isDarkMode = true;
                    }
                    else
                    {
                        chatBox.html('\nYour options for this command are: <b>light</b>, <b>dark</b>, or <b>oled</b>.', true);
                        chatBox.html('\n/style [STYLE (light, dark, oled)].\n ', true);
                    }
                    resetFields = true;
                }
                else if (tempRank != 'guest' && textInputField.value().split(' ')[0] == '/propose')
                {
                    if (textInputField.value().split(' ').length > 2 && (textInputField.value().split(' ')[1] == 'bug' || textInputField.value().split(' ')[1] == 'suggestion' || textInputField.value().split(' ')[1] == 'request'))
                    {
                        socket.emit('chat', textInputField.value());
                        resetFields = true;
                    }
                    else
                    {
                        chatBox.html('\nYour options for this command are: <b>bug</b>, <b>suggestion</b>, or <b>request</b>.', true);
                        chatBox.html('\n/propose [TYPE (bug, suggestion, request)] [MESSAGE].\n ', true);
                    }
                    resetFields = true;
                }
                else if (textInputField.value() != '')
                {
                    lastLength = textInputField.value().length;
                    socket.emit('chat', textInputField.value());
                    resetFields = true;
                }
            }
            fullScroll();
        }
    }
}
