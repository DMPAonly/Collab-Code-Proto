const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./Actions');
//const handleChat = require("./chatHandler");

const server = http.createServer(app);
const io = new Server(server);

// app.use(express.static('build'));
// app.use((req, res, next) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

const userSocketMap = {};
const chatHistory = {};
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        // Initialize history array for room if it doesn't exist
        if (!chatHistory[roomId]) {
            chatHistory[roomId] = [];
        }

        // 2. Send existing chat history ONLY to the newly joined socket
        socket.emit('chat-history', chatHistory[roomId]);

        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.OUTPUT_CHANGE, ({ roomId, output }) => {
        // Broadcast output to all clients in the room (including sender or excluding using socket.in)
        io.in(roomId).emit(ACTIONS.OUTPUT_CHANGE, { output });
    });

    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
        socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });

    // socket.on("message", async (data) => {

    //     let payload;

    //     try {
    //         payload = JSON.parse(data.toString());
    //     } catch (err) {
    //         console.log("Invalid JSON received");
    //         return;
    //     }

        // switch (payload.type) {

        //     case "join": {
        //         const result = await handleJoin(payload, ws);

        //         if (result.success) {
        //             console.log(
        //                 `Users in workspace: ${result.totalUsers}`
        //             );
        //         }

        //         break;
        //     }

        //     case "chat":
                // await handleChat(payload);
            //     break;

            // default:
            //     console.log("Unknown message type");
            //     break;
    // }

    // 
    socket.on(ACTIONS.SEND_MESSAGE, ({ roomId, userId, message, timestamp }) => {
        // Broadcast the message to all clients in the room (including sender)
        const newMessage = { userId, message, timestamp };

        // Save to room history
        if (!chatHistory[roomId]) {
            chatHistory[roomId] = [];
        }
        chatHistory[roomId].push(newMessage);

        // Broadcast to all clients in the room
        io.in(roomId).emit(ACTIONS.RECEIVE_MESSAGE, newMessage);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
