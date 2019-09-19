let socket;

function setup()
{
    frameRate(60);
    createCanvas(windowWidth, windowHeight);

    socket = io();
}

function draw()
{
    background(190);
    ellipse(50, 100, 20);

    if (mouseIsPressed)
    {
        socket.emit('happy',{
            reason:'my socket server is running'
        });
    }
}