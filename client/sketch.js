let socket;

function setup()
{
    frameRate(60);
    createCanvas(windowWidth, windowHeight);
    background(190);

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
}

function draw()
{
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
