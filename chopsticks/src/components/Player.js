import React, { createContext, useContext, useState, useEffect } from 'react';
import {useRef} from 'react';
import Hand from './Hand.js';

export default function Player({playerNumber, hands, playerTurn, prevHands, onHandClick}){ // set of hands a player may have
    function canAttack(){}

    // let hands = [];
    // for(let i = 0; i < 2; i++){
    //   hands.push(
    //     {
    //       key: i + playerNumber * 2,
    //       fingers: 1,
    //       selected: false,
    //       selectable: false,
    //       isOnAttack: false,
    //       isOnSplit: false,
    //       canbeAttacked: false, 
    //       canBeSplit: false
    //     }
    //   )
    // }
    // <div className={`player ${hands.length == 2 ? 'yellow' : 'blue'}`}></div>
    // <div className={`player ${hands.length == 2 && 'yellow'}`}></div>
  

    // current goal is sjsut to pass the one hand to the hand component as well as:
    // {
    //  playerTurn
    //  prevHands
    // }
    return (
      <div className={`player`}>
        <Hand hand={hands[(playerNumber) * 2]} hands={hands} playerTurn={playerTurn} prevHands={prevHands} onHandClick={onHandClick} />
        <Hand hand={hands[(playerNumber) * 2 + 1]} hands={hands} playerTurn={playerTurn} prevHands={prevHands} onHandClick={onHandClick} />
      </div>
    );
  }