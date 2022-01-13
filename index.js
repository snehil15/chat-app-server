const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const port = process.env.PORT || 3001;

app.use(cors());

app.get("/", (req, res) => {
  return res.send("hello world");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

var users = {};

var canvasData = [];

io.on("connection", (socket) => {
  socket.on("join_room", ({ room, username }) => {
    users[socket.id] = { username, rooms: socket.rooms };
    socket.join(room);
    socket.emit("get_canvas_data", { canvasData: canvasData, id: socket.id });
    socket.to(room).emit("user_joined", username);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("recieve_message", data);
  });

  socket.on("leave_room", (data) => {
    socket.leave(data.room);
    socket.to(data.room).emit("user_left", data.username);
  });

  socket.on("drawing", (room, data, color, brushSize) => {
    if (!data.x1 || !data.y1 || !data.x2 || !data.y2) return;
    socket.broadcast.to(room).emit("ondraw", data, color, brushSize);
  });

  socket.on("clear", (room) => {
    socket.broadcast.to(room).emit("onclear");
  });

  socket.on("bgcolor", (room, color) => {
    socket.broadcast.to(room).emit("bgcolorchange", color);
  });

  socket.on("disconnecting", () => {
    if (users[socket.id])
      socket
        .to(Array.from(users[socket.id].rooms))
        .emit("user_left", users[socket.id].username);
    delete users[socket.id];
  });
});

server.listen(port, () => {
  console.log("Server running");
});