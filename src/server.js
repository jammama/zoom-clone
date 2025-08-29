import express from "express"
import SocketIO from "socket.io";
import http from "http";
const app = express();


app.set("view engine", "pug");
app.set("views", __dirname + "/views")
app.use("/public", express.static(__dirname + "/public"))
app.get("/", (req, res)=> res.render("home"))

console.log("Hello")
const handleListen = () => console.log(`Listening on localhost:3000`)


const server = http.createServer(app);
const ioServer = SocketIO(server);

ioServer.on("connection", (socket) => {
    const updateRoomInfo = () => {
        const {rooms, sids} = ioServer.sockets.adapter;
        const roomInfoList = [];
        rooms.keys().forEach(_room => {
            if ( !Array.from(sids.keys()).includes(_room)) {
                roomInfoList.push({
                    name: _room,
                    size: rooms.get(_room)?.size || 0
                })
            }
        })
        ioServer.emit("room_update", roomInfoList);
    };
    updateRoomInfo();

    socket.on("enter_room", (roomName, nickName, callback) => {
        socket.join(roomName);
        socket["nickname"] = nickName;
        socket.to(roomName).emit("welcome", socket.nickname);
        console.log(`User ${socket.nickname} joined room ${roomName}`);
        callback()
        updateRoomInfo();
    });
    socket.on("disconnect", () => {
        socket.to(socket.rooms).emit("bye", socket.nickname);
        console.log(`User ${socket.nickname} disconnected`);
        updateRoomInfo();
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
});


server.listen(3000, handleListen);