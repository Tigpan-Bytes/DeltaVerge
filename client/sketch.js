const pictureWidth = 220;
const pictureHeight = 130;

let chatBox;
let dataBuffer;

let single = function(p)
{
    let pic;

    p.setup = function()
    {
        let newDiv = p.createDiv();
        newDiv.parent(chatBox);

        p.createCanvas(pictureWidth, pictureHeight);
        this.canvas.setAttribute('id', 'drawn' + p.random());
        newDiv.elt.appendChild(this.canvas);

        pic = p.createImage(pictureWidth, pictureHeight);
        pic.loadPixels();
        for (let i = 0; i < dataBuffer.image.length; i++)
        {
            pic.set(p.floor(i / pictureHeight), i % pictureHeight, dataBuffer.image[i] ? [255, 255, 255, 255] : [0, 0, 0, 255]);
        }
        pic.updatePixels();
        //p.image(pic, 0, 0);
        
        //p.background(0);
    };

    p.render = function() 
    {
        //p.createCanvas(pictureWidth, pictureHeight);
        //p.createCanvas(pictureWidth, pictureHeight);
        //this.canvas.setAttribute('id', 'drawn' + p.random());
        //chatBox.elt.appendChild(this.canvas);

        //p.print(iddd);
        //p.background(0);
        p.image(pic, 0, 0);
    };
}

let drawings = [];

const main = function(p)
{
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
    let userList;
    let chatBoxHeight;
    let welcomeText;
    let typingText;
    let lobbyButton;

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

    let isDrawingOpen = false;

    p.setup = function()
    {
        p.createMain();

        socket = io();

        socket.on('newChatMessage', p.addChatMessage);
        socket.on('newDrawing', p.addDrawing);
        socket.on('newChatAnnouncement', p.addChatAnnouncement);
        socket.on('newUserList', p.updateUserList);
        socket.on('acceptedUN', p.acceptedLogin);
        socket.on('failedUN', p.failedLogin);
        socket.on('roomCounts', function(data){
            aRoomCount = data['a'];
            bRoomCount = data['b'];
            cRoomCount = data['c'];
            dRoomCount = data['d'];
        });
        socket.on('connect', function(){
            p.kill();
            socket.emit('deinit');
        });
        socket.on('kill', p.kill);
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

    p.kill = function(message)
    {
        if (state == States.room) { p.leaveRoom(); }
        if (state == States.lobby) { p.leaveLobby(); }
        if (state == States.changePw) { p.leavePasswordChange(); }
        if (state != States.main) { p.createMain(); }
        state = States.main;
        if (message != undefined)
        {
            errorText.html(message)
        }
        p.windowResized();
    }

    p.createMain = function()
    {
        guestHolder = p.createElement('loginBox', '');
        mainText = p.createElement('welcome', 'Welcome to <b>Pictochat</b>! Login to advance.');

        guestName = p.createElement('loginName', 'Guest');
        guestName.parent(guestHolder);

        guestUsernameField = p.createElement('input', '');
        guestUsernameField.attribute('placeholder', 'Guest Username...');
        guestUsernameField.parent(guestHolder);

        guestConfirmButton = p.createButton('Login as Guest');
        guestConfirmButton.mouseClicked(p.attemptGuest)
        guestConfirmButton.size(160, 30);
        guestConfirmButton.parent(guestHolder);

        loginHolder = p.createElement('loginBox', '');

        loginName = p.createElement('loginName', 'Login');
        loginName.parent(loginHolder);

        loginUsernameField = p.createElement('input', '');
        loginUsernameField.attribute('placeholder', 'Username...');
        loginUsernameField.parent(loginHolder);

        loginPasswordField = p.createElement('input', '');
        loginPasswordField.attribute('placeholder', 'Password...');
        loginPasswordField.attribute('type', 'password');
        loginPasswordField.parent(loginHolder);

        loginConfirmButton = p.createButton('Login');
        loginConfirmButton.mouseClicked(p.attemptLogin)
        loginConfirmButton.size(160, 30);
        loginConfirmButton.parent(loginHolder);

        registerHolder = p.createElement('loginBox', '');

        registerName = p.createElement('loginName', 'Register');
        registerName.parent(registerHolder);

        registerUsernameField = p.createElement('input', '');
        registerUsernameField.attribute('placeholder', 'New Username...');
        registerUsernameField.parent(registerHolder);

        registerPasswordField = p.createElement('input', '');
        registerPasswordField.attribute('placeholder', 'New Password...');
        registerPasswordField.attribute('type', 'password');
        registerPasswordField.parent(registerHolder);

        registerConfirmPasswordField = p.createElement('input', '');
        registerConfirmPasswordField.attribute('placeholder', 'Confirm New Password...');
        registerConfirmPasswordField.attribute('type', 'password');
        registerConfirmPasswordField.parent(registerHolder);

        registerConfirmButton = p.createButton('Register');
        registerConfirmButton.mouseClicked(p.attemptRegister)
        registerConfirmButton.size(160, 30);
        registerConfirmButton.parent(registerHolder);

        errorText = p.createElement('errorText', '');
        errorText.size(p.windowWidth / 2, 100);

        p.windowResized();
    }

    p.createLobby = function()
    {
        logout = p.createButton('Logout');
        logout.size(90, 30);
        if (tempRank != 'guest')
        {
            changePassword = p.createButton('Change Password');
            changePassword.size(190, 30);
            changePassword.mouseClicked(function(){
                p.leaveLobby();
                state = States.changePw;
                p.createPasswordChange();
            });
        }

        logout.mouseClicked(function(){
            socket.emit('deinit');
            p.leaveLobby();
            state = States.main;
            p.createMain();
        });

        nameText = p.createElement('welcome', 'Welcome, <b>' + username + '</b>, to Pictochat.');

        aButton = p.createButton('Join Room A.');
        aText  = p.createElement('chatterCount', aRoomCount + ' Chatters Active.');
        bButton = p.createButton('Join Room B.');
        bText  = p.createElement('chatterCount', bRoomCount + ' Chatters Active.');
        cButton = p.createButton('Join Room C.');
        cText  = p.createElement('chatterCount', cRoomCount + ' Chatters Active.');
        dButton = p.createButton('Join Room D.');
        dText  = p.createElement('chatterCount', dRoomCount + ' Chatters Active.');

        aButton.mouseClicked(function(){
            socket.emit('room', 'a');
            room = "A";
            p.leaveLobby();
            state = States.room;
            p.createChatRoom();
        });
        bButton.mouseClicked(function(){
            socket.emit('room', 'b');
            room = "B";
            p.leaveLobby();
            state = States.room;
            p.createChatRoom();
        });
        cButton.mouseClicked(function(){
            socket.emit('room', 'c');
            room = "C";
            p.leaveLobby();
            state = States.room;
            p.createChatRoom();
        });
        dButton.mouseClicked(function(){
            socket.emit('room', 'd');
            room = "D";
            leaveLobby();
            state = States.room;
            createChatRoom();
        });

        aButton.size((p.windowWidth / 3) * 2, 60);
        bButton.size((p.windowWidth / 3) * 2, 60);
        cButton.size((p.windowWidth / 3) * 2, 60);
        dButton.size((p.windowWidth / 3) * 2, 60);

        aText.size((p.windowWidth / 3) * 2, 60);
        bText.size((p.windowWidth / 3) * 2, 60);
        cText.size((p.windowWidth / 3) * 2, 60);
        dText.size((p.windowWidth / 3) * 2, 60);

        aButton.style('font-size', '26px');
        bButton.style('font-size', '26px');
        cButton.style('font-size', '26px');
        dButton.style('font-size', '26px');

        p.windowResized();
    }

    p.createPasswordChange = function()
    {
        backToLobby = p.createButton('Lobby');
        backToLobby.size(90, 30);

        backToLobby.mouseClicked(function(){
            leavePasswordChange();
            state = States.lobby;
            createLobby();
        });

        changePWHolder = p.createElement('loginBox', '');

        changePWName = p.createElement('loginName', 'Change PW');
        changePWName.parent(changePWHolder);

        changePWPasswordField = p.createElement('input', '');
        changePWPasswordField.attribute('placeholder', 'Old Password...');
        changePWPasswordField.attribute('type', 'password');
        changePWPasswordField.parent(changePWHolder);

        changePWNewPasswordField = p.createElement('input', '');
        changePWNewPasswordField.attribute('placeholder', 'New Password...');
        changePWNewPasswordField.attribute('type', 'password');
        changePWNewPasswordField.parent(changePWHolder);

        changePWConfirmNewPasswordField = p.createElement('input', '');
        changePWConfirmNewPasswordField.attribute('placeholder', 'Confirm New Password...');
        changePWConfirmNewPasswordField.attribute('type', 'password');
        changePWConfirmNewPasswordField.parent(changePWHolder);

        changePWConfirmButton = p.createButton('Confirm');
        changePWConfirmButton.size(160, 30);
        changePWConfirmButton.parent(changePWHolder);

        errorText = p.createElement('errorText', '');
        errorText.size(p.windowWidth / 2, 100);

        successText = p.createElement('successText', '');
        successText.size(p.windowWidth / 2, 100);

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
                p.failedLogin(2);
            }
            changePWNewPasswordField.html('');
            changePWConfirmNewPasswordField.html('');
        });

        p.windowResized();
    }

    p.leaveDrawing = function()
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

    p.sendDrawing = function()
    {
        const white = [255, 255, 255, 255];
        let pack = [];

        pictureImage.loadPixels();
        for (let x = 0; x < pictureImage.width; x++) 
        {
            for (let y = 0; y < pictureImage.height; y++) 
            {
                pack.push(p.sameColor(white, pictureImage.get(x, y)));
            }
        }

        socket.emit('drawing', pack);
        p.leaveDrawing();
    }

    p.createChatRoom = function()
    {
        textInputField = p.createElement('textarea', '');
        textInputField.attribute('placeholder', 'Chat here...');
        textInputField.input(p.sendTyping);

        pictureButton = p.createImg('palette.png');
        pictureButton.size(80, 80)
        pictureButton.mouseClicked(function(){
            if (tempRank == 'guest' && false)
            {
                chatBox.html('\n<b>You need an account to draw pictures.</b>', true);
                chatBox.html('\n<b>Refresh the page or leave the room and logout to create an account.</b>', true);
                chatBox.html('\n\n ', true);
            }
            else if (!isDrawingOpen)
            {
                isDrawingOpen = true;
                socket.emit('typing', true);

                background = p.createDiv('');
                background.attribute('class', 'modal');

                cancelPictureButton = p.createButton('Cancel');
                cancelPictureButton.mouseClicked(p.leaveDrawing);
                cancelPictureButton.size(120, 40);
                cancelPictureButton.style('font-size', '22px');
                cancelPictureButton.style('background-color', '#d23f2f');
                cancelPictureButton.style('border', '2px solid #9d1611');
                cancelPictureButton.parent(background);

                sendPictureButton = p.createButton('Send');
                sendPictureButton.mouseClicked(p.sendDrawing);
                sendPictureButton.size(120, 40);
                sendPictureButton.style('font-size', '22px');
                sendPictureButton.style('background-color', '#34be54');
                sendPictureButton.style('border', '2px solid #118f35');
                sendPictureButton.parent(background);

                resetPictureButton = p.createButton('Reset');
                resetPictureButton.mouseClicked(p.resetPicture);
                resetPictureButton.size(120, 40);
                resetPictureButton.style('font-size', '22px');
                resetPictureButton.parent(background);
        
                smlPenButton = p.createImg('smlPen.png');
                smlPenButton.size(40, 40);
                smlPenButton.mouseClicked(function(){ pen = 1; });
                smlPenButton.parent(background);
                midPenButton = p.createImg('midPen.png');
                midPenButton.size(40, 40);
                midPenButton.mouseClicked(function(){ pen = 2; });
                midPenButton.parent(background);
                lrgPenButton = p.createImg('lrgPen.png');
                lrgPenButton.size(40, 40);
                lrgPenButton.mouseClicked(function(){ pen = 3; });
                lrgPenButton.parent(background);
                masPenButton = p.createImg('masPen.png');
                masPenButton.size(40, 40);
                masPenButton.mouseClicked(function(){ pen = 4; });
                masPenButton.parent(background);
                paintBucketButton = p.createImg('paintBucket.png');
                paintBucketButton.size(40, 40);
                paintBucketButton.mouseClicked(function(){ pen = -1; });
                paintBucketButton.parent(background);

                whiteColorButton = p.createImg('whiteColor.png');
                whiteColorButton.size(40, 40);
                whiteColorButton.mouseClicked(function(){ penColor = [255, 255, 255, 255]; });
                whiteColorButton.parent(background);
                blackColorButton = p.createImg('blackColor.png');
                blackColorButton.size(40, 40);
                blackColorButton.mouseClicked(function(){ penColor = [0, 0, 0, 255]; });
                blackColorButton.parent(background);

                if (pictureCanvas != undefined)
                {
                    pictureCanvas.remove();
                }
                pictureCanvas = p.createCanvas(pictureWidth, pictureHeight);
                pictureCanvas.parent(background);

                pictureImage = p.createImage(pictureWidth, pictureHeight);
                p.resetPicture();

                p.windowResized();
            }
            p.fullScroll();
        });

        typingText = p.createElement('typing', 'Nobody is typing at the moment...');

        chatBox = p.createElement('chatbox', '<i>&nbsp;&nbsp;&nbsp;&nbsp;Welcome to <b>Room ' + room + '</b>! Type, then press enter to chat. Alternatively, click in the bottom right to draw a picture</i>. \n');
        chatBox.attribute('id', 'chatBox');
        p.addCommandLine();

        userList = p.createElement('listbox', '<i>User List:\n</i>');

        welcomeText = p.createElement('welcome', 'Welcome, <b>' + username + '</b>, to <b>Room ' + room + '</b>.');
        lobbyButton = p.createButton('Return to lobby');
        lobbyButton.mouseClicked(function(){
            socket.emit('leaveRoom');
            p.leaveRoom();
            state = States.lobby;
            p.createLobby();
        });
        lobbyButton.size(170, 40);

        lastChatName = '';

        p.windowResized();
    }

    p.resetPicture = function()
    {
        pen = 2;
        penColor = [0, 0, 0, 255];

        pictureImage.loadPixels();
        for (let x = 0; x < pictureImage.width; x++) 
        {
            for (let y = 0; y < pictureImage.height; y++) 
            {
                pictureImage.set(x, y, [255, 255, 255, 255]);
            }
        }
        pictureImage.updatePixels();
    }

    p.addCommandLine = function()
    {
        if (tempRank == 'admin' || tempRank == 'mod')
        {
            chatBox.html('\nYour rank allows you to use these commands:\n\n', true);
            chatBox.html('/rank [NAME] [RANK]\n', true);
            chatBox.html('/delete [NAME]\n', true);
            chatBox.html('\nList of valid ranks: reg, +, ++, mod, admin, guest (guest cannot be changed or set)\n\n', true);
        }
    }

    p.attemptGuest = function()
    {
        tempUsername = guestUsernameField.value();
        socket.emit('init', tempUsername);
        guestUsernameField.value('');
    }

    p.attemptLogin = function()
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

    p.attemptRegister = function()
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
            
            p.failedLogin(2);
        }
    }

    p.acceptedLogin = function(data)
    {
        tempRank = data;
        username = tempUsername;

        p.leaveMain();
        state = States.lobby;
        p.createLobby();
    }

    p.failedLogin = function(data)
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

    p.leaveMain = function()
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

    p.leaveLobby = function()
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

    p.leavePasswordChange = function()
    {
        backToLobby.remove();
        successText.remove();

        changePWHolder.remove();
        changePWName.remove();
        changePWPasswordField.remove();
        changePWNewPasswordField.remove();
        changePWConfirmButton.remove();
    }

    p.leaveRoom = function()
    {
        textInputField.remove();
        pictureButton.remove();
        chatBox.remove();
        userList.remove();
        typingText.remove();
        welcomeText.remove();
        lobbyButton.remove();

        drawings = [];
    }

    p.windowResized = function()
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
            
            loginHolder.position(p.windowWidth * 0.333 + 6, 60);
            loginName.size(loginHolder.size().width - 24, 50);
            loginName.position(0, 0);

            loginUsernameField.size(loginHolder.size().width - 48, 50);
            loginUsernameField.position(12, 62);

            loginPasswordField.size(loginHolder.size().width - 48, 50);
            loginPasswordField.position(12, 62 + 12 + 50);

            loginConfirmButton.position((loginHolder.size().width - 160) / 2, loginHolder.size().height - 50);

            registerHolder.position(p.windowWidth * 0.667 + 6, 60);
            registerName.size(registerHolder.size().width - 24, 50);
            registerName.position(0, 0);

            registerUsernameField.size(registerHolder.size().width - 48, 50);
            registerUsernameField.position(12, 62);

            registerPasswordField.size(registerHolder.size().width - 48, 50);
            registerPasswordField.position(12, 62 + 12 + 50);

            registerConfirmPasswordField.size(registerHolder.size().width - 48, 50);
            registerConfirmPasswordField.position(12, 62 + 12 + 50 + 12 + 50);

            registerConfirmButton.position((registerHolder.size().width - 160) / 2, registerHolder.size().height - 50);
            
            errorText.position(p.windowWidth / 4, p.windowHeight - 110);
        }
        else if (state == States.lobby)
        {
            logout.position(p.windowWidth - 98, 8);
            if (tempRank != 'guest')
            {
                changePassword.position(p.windowWidth - 198, p.windowHeight - 38);
            }
            nameText.position(0,0);

            aButton.position(p.windowWidth / 6, (p.windowHeight / 5) * 1 - 30);
            aText.position(p.windowWidth / 6, (p.windowHeight / 5) * 1 + 30);
            bButton.position(p.windowWidth / 6, (p.windowHeight / 5) * 2 - 30);
            bText.position(p.windowWidth / 6, (p.windowHeight / 5) * 2 + 30);
            cButton.position(p.windowWidth / 6, (p.windowHeight / 5) * 3 - 30);
            cText.position(p.windowWidth / 6, (p.windowHeight / 5) * 3 + 30);
            dButton.position(p.windowWidth / 6, (p.windowHeight / 5) * 4 - 30);
            dText.position(p.windowWidth / 6, (p.windowHeight / 5) * 4 + 30);

            aButton.size((p.windowWidth / 3) * 2, 60);
            bButton.size((p.windowWidth / 3) * 2, 60);
            cButton.size((p.windowWidth / 3) * 2, 60);
            dButton.size((p.windowWidth / 3) * 2, 60);

            aText.size((p.windowWidth / 3) * 2, 60);
            bText.size((p.windowWidth / 3) * 2, 60);
            cText.size((p.windowWidth / 3) * 2, 60);
            dText.size((p.windowWidth / 3) * 2, 60);
        }
        else if (state == States.changePw)
        {
            backToLobby.position(p.windowWidth - 98, 8);

            changePWHolder.position(p.windowWidth * 0.333 + 6, 60);
            changePWName.size(changePWHolder.size().width - 24, 50);
            changePWName.position(0, 0);

            changePWPasswordField.size(changePWHolder.size().width - 48, 50);
            changePWPasswordField.position(12, 62);

            changePWNewPasswordField.size(changePWHolder.size().width - 48, 50);
            changePWNewPasswordField.position(12, 62 + 12 + 50);

            changePWConfirmNewPasswordField.size(changePWHolder.size().width - 48, 50);
            changePWConfirmNewPasswordField.position(12, 62 + 12 + 50 + 12 + 50);

            changePWConfirmButton.position((changePWHolder.size().width - 160) / 2, changePWHolder.size().height - 50);

            errorText.position(p.windowWidth / 4, p.windowHeight - 110);
            successText.position(p.windowWidth / 4, p.windowHeight - 110);
        }
        else if (state == States.room)
        {
            textInputField.position(0, p.windowHeight - (80 + 16));
            pictureButton.position(p.windowWidth - 80 - 8, p.windowHeight - 80 - 8);
            chatBox.position(0, 48);
            userList.position(p.windowWidth - 240, 48);
            chatBoxHeight = p.windowHeight - 80 - 32 - 48 - 8 - 24; // 8 for border
            typingText.position(0, p.windowHeight - (80 + 16 + 32));
            welcomeText.position(0,0);
            lobbyButton.position(p.windowWidth - 180, 8);

            if (isDrawingOpen)
            {
                cancelPictureButton.position(8, p.windowHeight - 40 - 8);
                smlPenButton.position(16 + 120 , p.windowHeight - 40 - 8);
                midPenButton.position(16 + 120 + 48, p.windowHeight - 40 - 8);
                lrgPenButton.position(16 + 120 + 48 + 48, p.windowHeight - 40 - 8);
                masPenButton.position(16 + 120 + 48 + 48 + 48, p.windowHeight - 40 - 8);
                paintBucketButton.position(16 + 120 + 48 + 48 + 48 + 48, p.windowHeight - 40 - 8);

                sendPictureButton.position(p.windowWidth - 120 - 8, p.windowHeight - 40 - 8);
                blackColorButton.position(p.windowWidth - 120 - 8 - 48, p.windowHeight - 40 - 8);
                whiteColorButton.position(p.windowWidth - 120 - 8 - 48 - 48, p.windowHeight - 40 - 8);
                resetPictureButton.position(p.windowWidth - 120 - 8 - 48 - 48 - 128, p.windowHeight - 40 - 8);

                let xMod = (p.windowWidth - 60) / pictureWidth;
                let yMod = (p.windowHeight - 90) / pictureHeight;
                let multi = xMod < yMod ? xMod : yMod;
                p.resizeCanvas(pictureWidth * multi, pictureHeight * multi);
                
                pictureCanvas.position(p.windowWidth / 2 - p.width / 2, p.windowHeight / 2 - 20 - p.height / 2);
            }
        }
    }

    p.isScrolled = function()
    {
        return (chatBox.elt.scrollTop + chatBoxHeight) == chatBox.elt.scrollHeight;
    }

    p.fullScroll = function()
    {
        chatBox.elt.scrollTop = chatBox.elt.scrollHeight - chatBoxHeight;
    }

    p.updateUserList = function(data)
    {
        userList.html("<i>User List:</i>");

        for (let i = 0; i < data.length; i++)
        {
            userList.html("\n\n" + (data[i].active ? "● " : "◌ ") + p.getNameSpanner(data[i].rank) + data[i].un + "</span>", true);
        }
        userList.html("\n ", true);
    }

    p.addChatMessage = function(data)
    { //270 for height - 4 for border
        let isTop = p.isScrolled();

        chatBox.html(chatBox.html().slice(0, chatBox.html().length - 3));
        //Put message in chatbox
        if (lastMessageTimeStamp == null || data.timeStamp > lastMessageTimeStamp + noChatDisplayTime || data.timeStamp > lastPrintedMessageTimeStamp + forceDisplayTime)
        {
            lastMessageTimeStamp = data.timeStamp;
            lastPrintedMessageTimeStamp = data.timeStamp;
            chatBox.html("\n\n" + data.time + " - <b>" + p.getNameSpanner(data.rank) + data.username + "</span></b>:\n" + p.getMessageSpanner(data.rank) + data.message + "</span>\n ", true);
        }
        else
        {
            lastMessageTimeStamp = data.timeStamp;
            if (lastChatName != data.username)
            {
                chatBox.html("\n\n&nbsp;&nbsp;&nbsp;&nbsp;<b>" + p.getNameSpanner(data.rank) + data.username + "</span></b>:\n" + p.getMessageSpanner(data.rank) + data.message + "</span>\n ", true);
            }
            else
            {
                chatBox.html("\n" + p.getMessageSpanner(data.rank) + data.message + "</span>\n ", true);
            }
        }

        lastChatName = data.username;

        if (isTop)
        {
            p.fullScroll();
        }
    }

    p.addDrawing = function(data)
    {
        let isTop = p.isScrolled();

        chatBox.html(chatBox.html().slice(0, chatBox.html().length - 3));
        //Put message in chatbox
        if (lastMessageTimeStamp == null || data.timeStamp > lastMessageTimeStamp + noChatDisplayTime || data.timeStamp > lastPrintedMessageTimeStamp + forceDisplayTime)
        {
            lastMessageTimeStamp = data.timeStamp;
            lastPrintedMessageTimeStamp = data.timeStamp;
            chatBox.html("\n\n" + data.time + " - <b>" + p.getNameSpanner(data.rank) + data.username + "</span></b>:\n", true);
        }
        else
        {
            lastMessageTimeStamp = data.timeStamp;
            if (lastChatName != data.username)
            {
                chatBox.html("\n\n&nbsp;&nbsp;&nbsp;&nbsp;<b>" + p.getNameSpanner(data.rank) + data.username + "</span></b>:\n", true);
            }
            else
            {
                chatBox.html("\n", true);
            }
        }
        
        dataBuffer = data;

        drawings.push(new p5(single));

        /*
        let pic = p.createImage(pictureWidth, pictureHeight);
        pic.loadPixels();
        for (let i = 0; i < data.image.length; i++)
        {
            pic.set(p.floor(i / pictureHeight), i % pictureHeight, data.image[i] ? [255, 255, 255, 255] : [0, 0, 0, 255]);
        }
        pic.updatePixels();  */

        for (let i = 0; i < drawings.length; ++i)
        {
            drawings[i].render();
        }

        //chatBox.html("\n ", true);

        lastChatName = data.username;

        if (isTop)
        {
            p.fullScroll();
        }
    }

    p.getNameSpanner = function(rank) // used for rank colours
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

    p.getMessageSpanner = function(rank) // used for rank colours
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

    p.addChatAnnouncement = function(data)
    { //270 for height - 4 for border
        //Put message in chatbox
        let isTop = p.isScrolled();

        lastMessageTimeStamp = data.timeStamp;
        lastPrintedMessageTimeStamp = data.timeStamp;
        chatBox.html(chatBox.html().slice(0, chatBox.html().length - 2));
        chatBox.html("\n\n<i>" + data.spanner + data.time + " - " + data.username + data.message + "</i></span>\n ", true);
        lastChatName = '';

        if (isTop)
        {
            p.fullScroll();
        }
    }

    p.draw = function()
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
            if (lastMillis < p.millis() - 1500)
            {
                lastMillis = p.millis();
                socket.emit('status', p.focused)
            }

            if (isDrawingOpen)
            {
                pictureCanvas.background(147);
                if (p.mouseIsPressed && pen >= 0)
                {
                    if (p.mouseX >= 0 && p.mouseY >= 0 && p.mouseX <= pictureCanvas.width && p.mouseY <= pictureCanvas.height)
                    {
                        let realX = p.mouseX * (pictureWidth / pictureCanvas.width);
                        let realY = p.mouseY * (pictureHeight / pictureCanvas.height);
                        let diffX = (p.pmouseX * (pictureWidth / pictureCanvas.width)) - realX;
                        let diffY = (p.pmouseY * (pictureWidth / pictureCanvas.width)) - realY;
                        let iterations = p.sqrt((diffX * diffX) + (diffY * diffY));

                        pictureImage.loadPixels();
                        for (let i = 0; i <= iterations; ++i)
                        {
                            for (let x = -pen + 1; x < pen; ++x)
                            {
                                for (let y = -pen + 1; y < pen; ++y)
                                {
                                    let xx = p.floor(realX) + x;
                                    let yy = p.floor(realY) + y;
                                    if (xx >= 0 && xx < pictureWidth && yy >= 0 && yy < pictureHeight && p.sqrt((x * x) + (y * y)) <= pen - 0.5)
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
                p.image(pictureImage, 0, 0, pictureCanvas.width, pictureCanvas.height);
            }
            else
            {
                if (typingMillis < p.millis() - 4000)
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
        }
    }

    p.mousePressed = function()
    {
        if (isDrawingOpen && pen < 0)
        {
            if (p.mouseX >= 0 && p.mouseY >= 0 && p.mouseX <= pictureCanvas.width && p.mouseY <= pictureCanvas.height)
            {
                if (pen == -1)
                {
                    let realX = p.floor(p.mouseX * (pictureWidth / pictureCanvas.width));
                    let realY = p.floor(p.mouseY * (pictureHeight / pictureCanvas.height));

                    pictureImage.loadPixels();
                    let originColor = pictureImage.get(realX, realY);
                    if (!p.sameColor(originColor, penColor))
                    {
                        let frontier = new Array();
                        frontier.unshift({x: realX, y: realY});
                        pictureImage.set(realX, realY, penColor);

                        while (frontier.length > 0)
                        {
                            let newF = frontier.pop();
                            if (newF.x > 0 && p.sameColor(pictureImage.get(newF.x - 1, newF.y), originColor)) { pictureImage.set(newF.x - 1, newF.y, penColor); frontier.unshift({x: newF.x - 1, y: newF.y}); }
                            if (newF.y > 0 && p.sameColor(pictureImage.get(newF.x, newF.y - 1), originColor)) { pictureImage.set(newF.x, newF.y - 1, penColor); frontier.unshift({x: newF.x, y: newF.y - 1}); }
                            if (newF.x < pictureWidth - 1 && p.sameColor(pictureImage.get(newF.x + 1, newF.y), originColor)) { pictureImage.set(newF.x + 1, newF.y, penColor); frontier.unshift({x: newF.x + 1, y: newF.y}); }
                            if (newF.y < pictureHeight - 1 && p.sameColor(pictureImage.get(newF.x, newF.y + 1), originColor)) { pictureImage.set(newF.x, newF.y + 1, penColor); frontier.unshift({x: newF.x, y: newF.y + 1}); }
                        }
                    }
                    pictureImage.updatePixels();
                }
            }
        }
    }

    p.sameColor = function(a, b)
    {
        return p.red(a) == p.red(b) && p.green(a) == p.green(b) && p.blue(a) ==p. blue(b);
    }

    p.sendTyping = function()
    {
        if (p.keyCode != 13)
        {
            typingMillis = p.millis();
            socket.emit('typing', true);
        }
    }

    p.keyPressed = function()
    {
        if (p.keyCode == 13 && !p.keyIsDown(16) && textInputField.value() != '') // not shift and enter
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
}
let mainSketch = new p5(main);