// start menu (selecting gamemode to play)
import socket from '../socket.js';
import CustomDialog from './CustomDialog.js';
import Game from './Game.js';
import OnlineGame from './OnlineGame.js';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import '../App.css';
import InitGame from '../InitGame.js';
import { Container, TextField } from "@mui/material";

export default function StartMenu(){
    // CONSTANTS AND STATES
    const [name, setName] = useState("");
    const [singlePlayerToggle, setSinglePlayerToggle] = useState(false);
    const [multiPlayerToggle, setMultiPlayerToggle] = useState(false);
    const [settingsToggle, setSettingsToggle] = useState(false);
    const [promptUsername, setPromptUsername] = useState(false);

    const [username, setUsername] = useState("");
    const [userNameSubmitted, setUserNameSubmitted] = useState(false);

    const [room, setRoom] = useState("");
    const [orientation, setOrientation] = useState("");
    const [players, setPlayers] = useState([]);

    const cleanup = useCallback(() => {
        setRoom("");
        setOrientation("");
        setPlayers([]);
      }, []);


    // FUNCTIONS
    function launchSinglePlayerGame(){
        return (
            <Game />
        )
    }

    function launchMultiplayerGame(){
        return (
            room ? (
                <OnlineGame 
                    room={room}
                    orientation={orientation}
                    players={players}
                    cleanup={cleanup}
                />
            ) : (
                <InitGame 
                    setRoom={setRoom}
                    setOrientation={setOrientation}
                    setPlayers={setPlayers}
                />
            )
        )
    }

    useEffect(() => {
        // const username = prompt("username");
        // setUsername(userName);
        // socket.emit("username", username);
        
        socket.on("opponentJoined", (roomData) => {
          console.log("opponent joined", roomData);
          setPlayers(roomData.players);
        })
      }, []);


    function login(name){
        setName(name)
    }

    return (
        <div className="startmenu">
        {promptUsername && 
            <CustomDialog
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
            </CustomDialog>
        }
            {!singlePlayerToggle && !multiPlayerToggle && !settingsToggle && (<div>
                <div className="Login">
                    {!promptUsername && <button className="LoginButton" onClick={() => setPromptUsername(true)}>Login</button>}
                    {username && <h className="username">{username}</h>}
                </div>
                <div className="Logo">
                    <img src="/assets/standard_blackChopsticks.png"></img>
                </div>
                <div className="SinglePlayer menuButton">
                    <button className="SinglePlayerButton" onClick={() => setSinglePlayerToggle(!singlePlayerToggle)}>Single Player</button>
                </div>
                <div className="Multiplayer menuButton">
                    <button className="MultiplayerButton" onClick={() => setMultiPlayerToggle(!multiPlayerToggle)}>Multiplayer</button>
                </div>
                <div className="Settings menuButton">
                    <button className="SettingsButton" onClick={() => setSettingsToggle(!settingsToggle)}>Settings</button>
                </div>
                <div className="About menuButton">
                    <button className="AboutButton">About</button>
                </div>
            </div>)}
            {singlePlayerToggle ? launchSinglePlayerGame() : null}
            {multiPlayerToggle ? launchMultiplayerGame(players, room, orientation, cleanup) : null}
        </div>
    )
}