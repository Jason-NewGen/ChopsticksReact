import Game from './components/Game.js';
import React, { createContext, useState, useEffect } from 'react';
import Player from './components/Player.js';
import StartMenu from './components/StartMenu.js';

export const GameContext = createContext();

// logic for chopsticks gamee
export default function App(){
  return (
    <div className="App">
      <StartMenu />
    </div>
  );
}