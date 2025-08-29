import express from 'express';
import WebSocket from 'ws';
import http from 'http';
const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));

console.log('Hello');
const handleListen = () => console.log(`Listening on localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const handleConnection = (socket) => {
    console.log('someone connected...: ', socket.id);
    socket.send('Welcome to czoom ws server');
};

const sockets = [];
wss.on('connection', (socket) => {
    handleConnection(socket);
    sockets.push(socket);

    socket.on('message', (msg) => {
        console.log(msg);
        const message = JSON.parse(msg);
        switch (message.type) {
            case 'message':
                sockets.forEach((aSocket) =>
                    aSocket.send(`${socket.nickname}: ${message.payload}`)
                );
                break;
            case 'enter_room':
                socket['nickname'] = message.payload;
                break;
        }
    });
});

server.listen(3000, handleListen);
