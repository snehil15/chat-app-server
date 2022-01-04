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

var canvasData = "";

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

  socket.on("drawing", ({ canvasState, room }) => {
    canvasData = canvasState;
    socket.to(room).emit("update_canvas", { canvasState, id: socket.id });
  });

  socket.on("disconnecting", () => {
    if (users[socket.id])
      socket
        .to(Array.from(users[socket.id].rooms))
        .emit("user_left", users[socket.id].username);
    delete users[socket.id];
  });
});

// const tictactoeio = io.of("/tictac");

// tictactoeio.on("connection", (socket) => {
//   // console.log(socket.id);
//   socket.on("join_room", async () => {
//     if (
//       tictactoeio.adapter.rooms.get("abc") &&
//       tictactoeio.adapter.rooms.get("abc").size >= 2
//     ) {
//       return;
//     }
//     socket.join("abc");
//     // console.log(`user with id ${socket.id} joined room abc`);
//   });
// });

server.listen(port, () => {
  console.log("Server running");
});
