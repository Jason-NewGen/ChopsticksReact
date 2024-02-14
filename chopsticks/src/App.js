import Game from './components/Game.js';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import Player from './components/Player.js';
import StartMenu from './components/StartMenu.js';
import { Container, TextField } from "@mui/material";
import CustomDialog from './components/CustomDialog.js';
import socket from './socket.js';

export const GameContext = createContext();

// logic for chopsticks gamee
export default function App(){
  // CONSTANTS AND STATES
  const [username, setUsername] = useState("");
  const [userNameSubmitted, setUserNameSubmitted] = useState(false);

  const [room, setRoom] = useState("");
  const [orientation, setOrientation] = useState("");
  const [players, setPlayers] = useState([]);

  // FUNCTIONS

  // resets the states responsible for initializing the game
  const cleanup = useCallback(() => {
    setRoom("");
    setOrientation("");
    setPlayers([]);
  }, []);

// useEffect for when opponent joins the room
  useEffect(() => {
    // const username = prompt("username");
    // setUsername(userName);
    // socket.emit("username", username);
    
    socket.on("opponentJoined", (roomData) => {
      console.log("opponent joined", roomData);
      setPlayers(roomData.players);
    })
  }, []);

// RETURN HTML
  return (
    <Container>
      {/* <CustomDialog
        open={!userNameSubmitted} // if username is not set, open dialog
        title="Welcome to Chopsticks Online!"
        contextText="Please enter your username to continue"
        handleContinue={() => { // function for continue button
          if(!username) return; // if username is not set, do nothing
          socket.emit("username", username); // else, emit a websocket event called username sending username as data
          setUserNameSubmitted(true); // username is submitted
        }}
      >
      <TextField
        autoFocus
        margin="dense"
        label="Username"
        name="Username"
        value={username}
        required
        onChange={(e) => setUsername(e.target.value)}
        type="text"
        fullWidth
        variant="standard"
      >
      </TextField>
      </CustomDialog> */}
      <StartMenu />
    </Container>
  );  
}