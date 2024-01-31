// start menu (selecting gamemode to play)

import Game from './Game.js';
import React, { createContext, useState, useEffect } from 'react';
import '../App.css';

export default function StartMenu(){
    // CONSTANTS AND STATES
    const [name, setName] = useState("");
    const [singlePlayerToggle, setSinglePlayerToggle] = useState(false);
    const [multiPlayerToggle, setMultiPlayerToggle] = useState(false);
    const [settingsToggle, setSettingsToggle] = useState(false);

    // FUNCTIONS
    function launchSinglePlayerGame(){
        return (
            <Game />
        )
    }

    function login(name){
        setName(name)
    }

    return (
        <div className="StartMenu">
            
            {!singlePlayerToggle && !multiPlayerToggle && !settingsToggle && (<div>
                <div className="Login">
                    <input type="text" placeholder="Enter your name" onChange={(e) => setName(e.target.value)}></input>
                    <button type="submit" className="LoginButton">Login</button>
                </div>
                <div className="Logo">
                    <img src="/assets/standard_blackChopsticks.png"></img>
                </div>
                <div className="SinglePlayer menuButton">
                    <button className="SinglePlayerButton" onClick={() => setSinglePlayerToggle(!singlePlayerToggle)}>Single Player</button>
                </div>
                <div className="Multiplayer menuButton">
                    <button className="MultiplayerButton">Multiplayer</button>
                </div>
                <div className="Settings menuButton">
                    <button className="SettingsButton" onClick={() => setSettingsToggle(!settingsToggle)}>Settings</button>
                </div>
                <div className="About menuButton">
                    <button className="AboutButton">About</button>
                </div>
            </div>)}
            {singlePlayerToggle ? launchSinglePlayerGame() : null}
            <button onClick={() => console.log(name)}>name</button>
        </div>
    )
}