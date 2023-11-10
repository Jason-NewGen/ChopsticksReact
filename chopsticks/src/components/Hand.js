import React, { createContext, useContext, useState, useEffect } from 'react';
import {useRef} from 'react';


// logic for chopsticks game

// hand component for chopsticks
export default function Hand({hand}){ // probably have a fingers component
  const handRef = useRef(null);
  function handleClick(){

  }
  
  return (
    // value refers to if hand is selected or not
    <div className={`hand ${hand.selected ? 'yellow' : 'blue'}`} onClick={() => hand.onModeClick(hand)}> 
      {hand.fingers}
    </div>
  );
}