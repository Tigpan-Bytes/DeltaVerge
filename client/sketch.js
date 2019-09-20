let socket;
let textInputField;
let chatBox;

let resetFields = false;

function setup()
{
    frameRate(60);
    createCanvas(windowWidth, windowHeight);
    background(190);

    textInputField = createElement('textarea', '');
    textInputField.attribute('placeholder', 'Chat here...');
    textInputField.position(0, windowHeight - (80 + 16));

    chatBox = createElement('chatbox', 'Welcome to the chat room! Type, then press enter to chat.');
    chatBox.position(0, windowHeight - (80 + 16) - (270 + 16));

    textAlign(CENTER, CENTER)
    textSize(18);

    socket = io();
    socket.on('newPositions', function(data){
        background(190);
        for (let i = 0; i < data.length; i++)
        {
            fill(255);
            stroke(0);
            ellipse(data[i].x, data[i].y, 30);

            fill(0);
            noStroke();
            text(data[i].id.toString(), data[i].x, data[i].y);
        }
    });

    socket.on('newChatMessage', function(data){
        chatBox.html(data, true);
    });
}

function draw()
{
    if (resetFields)
    {
        textInputField.value('');
        resetFields = false;
    }
    sendInput();
}

function sendInput()
{
    let inputs = {
        iUp: false,
        iDown: false,
        iRight: false,
        iLeft: false,
    };

    if (keyIsDown(38) || keyIsDown(87)) // up
    {
        inputs.iUp = true;
    }
    if (keyIsDown(40) || keyIsDown(83)) // down
    {
        inputs.iDown = true;
    }
    if (keyIsDown(39) || keyIsDown(68)) // right
    {
        inputs.iRight = true;
    }
    if (keyIsDown(37) || keyIsDown(65)) // left
    {
        inputs.iLeft = true;
    }
    
    socket.emit('input', inputs);
}

function keyPressed()
{
    if (keyCode == 13 && !keyIsDown(16) && textInputField.value() != '') // not shift and enter
    {
        textInputField.value(textInputField.value().replace(/^\s+|\s+$/g, '')); //remove start and end
        textInputField.value(textInputField.value().replace(/\n\s*\n/g, '\n')); //remove duplicates
        socket.emit('chat', textInputField.value());
        resetFields = true;
    }
}
