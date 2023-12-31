import React, { createContext, useContext, useState, useEffect } from 'react';
import {useRef} from 'react';
import {GameContext} from '../App.js';
// logic for chopsticks game

// hand component for chopsticks
export default function Hand({hand, hands, playerTurn}){ // probably have a fingers component
  const handRef = useRef(null);
  function handleClick(){

  }
  let prevHands = useContext(GameContext);
  return (
    // value refers to if hand is selected or not
    <div className={`hand ${hand.selected ? 'yellow' : 'blue'}`} onClick={() => hand.onHandClick(hand, hands, playerTurn, prevHands)}> 
      {hand.fingers}
    </div>
  );
}