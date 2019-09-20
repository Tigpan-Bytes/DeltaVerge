let socket;
let textInputField;
let chatBox;
let chatBoxHeight;
let welcomeText;
let username;

let resetFields = false;
let lastMessageTimeStamp = null;
let lastPrintedMessageTimeStamp = null;
let threeMinutes = 180000;
let tenMinutes = 600000;

function setup()
{
    username = "Testing " + floor(random(0, 100));

    textInputField = createElement('textarea', '');
    textInputField.attribute('placeholder', 'Chat here...');

    chatBox = createElement('chatbox', '<i>&nbsp;&nbsp;&nbsp;&nbsp;Welcome to the chat room! Type, then press enter to chat.</i>');

    welcomeText = createElement('welcome', 'Welcome, <b>' + username + '</b>, to Room A.');

    windowResized();

    socket = io();

    socket.on('newChatMessage', addChatMessage);
    socket.on('newChatAnnouncement', addChatAnnouncement);

    socket.emit('init', username);
}

function isScrolled()
{
    return (chatBox.elt.scrollTop + chatBoxHeight) == chatBox.elt.scrollHeight;
}

function fullScroll()
{
    chatBox.elt.scrollTop = chatBox.elt.scrollHeight - chatBoxHeight;
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


function windowResized() {
    textInputField.position(0, windowHeight - (80 + 16));
    chatBox.position(0, 48);
    chatBoxHeight = windowHeight - 80 - 32 - 48 - 8; // 8 for border
    welcomeText.position(0,0);
}

function draw()
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
