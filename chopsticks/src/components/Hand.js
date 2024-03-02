import React, { createContext, useContext, useState, useEffect } from 'react';
import {useRef} from 'react';
import GameContext from './Game.js';
import OnlineGame from './OnlineGame.js';
// logic for chopsticks game

// hand component for chopsticks
export default function Hand({hand, hands, playerTurn, prevHands, onHandClick}){ // probably have a fingers component
  const handRef = useRef(null);
  // const [hands, setHands] = useState(hands);

  // this hand component only has these following properties to use {
  //   hand (individual hand)
  //   playerTurn
  //   prevHands
  // }

  return (
    // value refers to if hand is selected or not
    <div className={`hand ${hand.selected ? 'yellow' : 'blue'}`} onClick={() => onHandClick(hand, hands, playerTurn, prevHands)}> 
      {hand.fingers}
    </div>
  );
}