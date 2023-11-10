import React, { createContext, useContext, useState, useEffect } from 'react';
import {useRef} from 'react';
import Hand from './Hand.js';

export default function Player({playerNumber, hands}){ // set of hands a player may have
    function canAttack(){}
  
    // <div className={`player ${hands.length == 2 ? 'yellow' : 'blue'}`}></div>
    // <div className={`player ${hands.length == 2 && 'yellow'}`}></div>
  
    return (
      <div className={`player`}>
        <Hand hand={hands[(playerNumber) * 2]}  />
        <Hand hand={hands[(playerNumber) * 2 + 1]} />
      </div>
    );
  }