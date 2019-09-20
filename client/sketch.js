let socket;
let textInputField;
let chatBox;
let welcomeText;

let resetFields = false;

function setup()
{
    textInputField = createElement('textarea', '');
    textInputField.attribute('placeholder', 'Chat here...');
    textInputField.position(0, windowHeight - (80 + 16));

    chatBox = createElement('chatbox', 'Welcome to the chat room! Type, then press enter to chat.');
    chatBox.position(0, 48);

    welcomeText = createElement('h1', 'Welcome, user, to Room A.');
    welcomeText.position(0,0);

    socket = io();

    socket.on('newChatMessage', function(data){ //270 for height - 4 for border
        let isTop = (chatBox.elt.scrollTop + 266) == chatBox.elt.scrollHeight;
        chatBox.html(data, true);
        if (isTop)
        {
            chatBox.elt.scrollTop = chatBox.elt.scrollHeight - 266;
        }
    });

    socket.emit('init', "Testing " + floor(random(0, 100)));
}

function windowResized() {
    textInputField.position(0, windowHeight - (80 + 16));
    chatBox.position(0, 48);
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
