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

io.users = [];

io.on("connection", (socket) => {
  socket.on("join_room", ({ room, username }) => {
    io.users.push({ id: socket.id, username, rooms: socket.rooms });
    socket.join(room);
    socket.to(room).emit("user_joined", username);
    // console.log(`User with ID: ${socket.id} joined room ${room}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("recieve_message", data);
  });

  socket.on("leave_room", (data) => {
    socket.leave(data.room);
    socket.to(data.room).emit("user_left", data.username);
  });

  socket.on("disconnect", async () => {
    io.users.forEach((user, index) => {
      if (!io.sockets.adapter.socketRooms(user.id)) {
        socket.to(Array.from(user.rooms)).emit("user_left", user.username);
        io.users.splice(index, 1);
      }
    });
  });
});

const tictactoeio = io.of("/tictac");

tictactoeio.on("connection", (socket) => {
  console.log(socket.id);
  socket.on("join_room", async () => {
    if (
      tictactoeio.adapter.rooms.get("abc") &&
      tictactoeio.adapter.rooms.get("abc").size >= 2
    ) {
      return;
    }
    socket.join("abc");
    console.log(`user with id ${socket.id} joined room abc`);
  });
});

server.listen(port, () => {
  console.log("Server running");
});
