const express = require('express');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const http = require('http');

const app = express();

const server = http.createServer(app);

const rooms = new Map();

// set port to value received from environment variable or 8080 if null
const port = process.env.PORT || 8080;

// upgrade http server to a websocket server
const io = new Server(server, {
    cors: '*', // allow connection from any origin
});

// io connection
io.on('connection', (socket) => {
    // socket refers to the client socket that just connected
    // each socket is assigned a random id
    console.log(socket.id, 'connected');

    // when username is entered, log username and save username to socket data
    socket.on('username', (username) => {
        console.log("username:", username);
        socket.data.username = username;
    });

    socket.on('createRoom', async (callback) => { // callback here refers to the callback function from the client passed as data
        const roomId = uuidv4(); // generate a random and new room id
        await socket.join(roomId); // make the creator join the room
        // await waits for the promise (join) to resolve before continuing

        // set roomId as a key and roomData, including players, as values in the rooms map
        rooms.set(roomId, {
            roomId,
            players: [{id: socket.id, username: socket.data?.username}]
        });

        callback(roomId); // respond with roomId to client by calling the callback function from the client
    })

    socket.on('joinRoom', async (args, callback) => {
        // check if room exists and a player is waiting
        const room = rooms.get(args.roomId);
        let error, message;

        // if room does not exist
        if(!room){
            error = true;
            message = 'room does not exist';
        } else if (room.length <= 0){ // if room is empty
            // if room is empty
            error = true;
            message = 'room is empty';
        } else if(room.length >= 2){ // if room is full
            error = true;
            message = 'room is full';
        }

        if(error){
            // if there is an error, check if the client passed a callback
            // if there is a callback, call it with the error message
            // just exit if the callback is not given
            if(callback){ // if callback is given, call it with the error message
                callback({
                    error,
                    message
                })
            }
            return;
        }

        await socket.join(args.roomId);

        // now add update the room list for the player who just joined
        const roomUpdate = {
            ...room,
            players: [
                ...room.players,
                { id: socket.id, username: socket.data?.username },
            ]
        };

        rooms.set(args.roomId, roomUpdate);

        // respond to the client with the room data
        callback(roomUpdate);

        // emit an opponent joined event to the room to notify the players in the room
        socket.to(args.roomId).emit('opponentJoined', roomUpdate);
    });

    // when a player ends their turn
    socket.on('move', (data) => {
        console.log(data);
        socket.to(data.room).emit('move', data.move);
    });

});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
})