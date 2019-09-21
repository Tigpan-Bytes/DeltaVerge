//all
let socket;
let username;

//main
let usernameField;
let confirmButton;
let errorText;

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
let threeMinutes = 180000;
let tenMinutes = 600000;

let States = {
    lobby: 0,
    room: 1
};

let state = States.lobby;

function setup()
{
    createLobby();

    socket = io();

    socket.on('newChatMessage', addChatMessage);
    socket.on('newChatAnnouncement', addChatAnnouncement);
    socket.on('newUserList', updateUserList);
}

function createChatRoom()
{
    textInputField = createElement('textarea', '');
    textInputField.attribute('placeholder', 'Chat here...');

    chatBox = createElement('chatbox', '<i>&nbsp;&nbsp;&nbsp;&nbsp;Welcome to the chat room! Type, then press enter to chat.</i>');
    userList = createElement('listbox', '<i>User List:\n</i>');

    welcomeText = createElement('welcome', 'Welcome, <b>' + username + '</b>, to Room A.');
    lobbyButton = createButton('Return to lobby');
    lobbyButton.mouseClicked(returnToLobby)
    lobbyButton.size(170, 40);

    windowResized();
}

function createLobby()
{
    usernameField = createElement('input', '');;
    usernameField.attribute('placeholder', 'Username...');

    confirmButton = createButton('Login as Guest');;
    confirmButton.mouseClicked(attemptUsername)
    confirmButton.size(160, 30);

    windowResized();
}

function attemptUsername() //TODO: Don't allow all usernames
{
    username = usernameField.value();
    socket.emit('init', username);
    goToRoom();
}

function returnToLobby()
{
    socket.emit('deinit');
    textInputField.remove();
    chatBox.remove();
    userList.remove();
    welcomeText.remove();
    lobbyButton.remove();

    state = States.lobby;

    createLobby();
}

function goToRoom()
{
    usernameField.remove();
    confirmButton.remove();

    state = States.room;

    createChatRoom();
}

function windowResized() 
{
    if (state == States.lobby)
    {
        confirmButton.position(windowWidth / 2 - 50 - 24, 120);
    }
    else if (state == States.room)
    {
        textInputField.position(0, windowHeight - (80 + 16));
        chatBox.position(0, 48);
        userList.position(windowWidth - 200, 48);
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
    userList.html("<i>User List:\n</i>");
    for (let i = 0; i < data.length; i++)
    {
        userList.html("\n" + data[i], true);
    }
}

function addChatMessage(data)
{ //270 for height - 4 for border
    let isTop = isScrolled();

    //Put message in chatbox
    if (lastMessageTimeStamp == null || data.timeStamp > lastMessageTimeStamp + threeMinutes || data.timeStamp > lastPrintedMessageTimeStamp + tenMinutes)
    {
        lastMessageTimeStamp = data.timeStamp;
        lastPrintedMessageTimeStamp = data.timeStamp;
        chatBox.html("\n" + data.time + " - <b>" + getNameSpanner(data.username) + data.username + "</span></b>: " + getMessageSpanner(data.username) + data.message + "</span>", true);
    }
    else
    {
        lastMessageTimeStamp = data.timeStamp;
        chatBox.html("\n&nbsp;&nbsp;&nbsp;&nbsp;<b>" + getNameSpanner(data.username) + data.username + "</span></b>: " + getMessageSpanner(data.username) + data.message + "</span>", true);
    }

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
    if (un == username)
    {
        return '<span class="yourText">';
    }
    return '<span class="otherText">';
}

function addChatAnnouncement(data)
{ //270 for height - 4 for border
    //Put message in chatbox
    let isTop = isScrolled();

    lastMessageTimeStamp = data.timeStamp;
    lastPrintedMessageTimeStamp = data.timeStamp;
    chatBox.html("\n<i>" + data.spanner + data.time + " - " + data.username + data.message + "</i></span>", true);

    if (isTop)
    {
        fullScroll();
    }
}

function draw()
{
    if (state == States.room)
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
