let socket;

let x = 0;
let y = 0;

function setup()
{
    frameRate(60);
    createCanvas(windowWidth, windowHeight);

    socket = io();
    
    socket.on('serverMsg', function(data){
        x = data.xPos;
        y = data.yPos;
    });
}

function draw()
{
    background(190);
    ellipse(x, y, 20);

    if (mouseIsPressed)
    {
        socket.emit('happy', {
            reason:'my socket server is running',
            xSize: windowWidth,
            ySize: windowHeight
        });
    }
}