import React, { useState, useMemo, useCallback, useEffect, createContext } from 'react';
import '../App.css';
import Player from './Player.js';
import CustomDialog from './CustomDialog.js';
import socket from '../socket.js';
import {
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListSubheader,
    Stack,
    Typography,
    Box,
  } from "@mui/material";

export const GameContext = createContext();

export default function OnlineGame( {room, orientation, players, cleanup}){
// game states and constants
  const [showDone, setShowDone] = useState(false);
  const [showAttack, setShowAttack] = useState(true);
  const [showSplit, setShowSplit] = useState(true);
  const [showBack, setShowBack] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(0); // 0 for player 1, 1 for player 2
  const [hands, setHands] = useState([]); 
  const [prevHands, setPrevHands] = useState([]); // for undoing
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [allowHandSwitchRule, setAllowHandSwitchRule] = useState(false);

  // passed in props

  // let hand = hands[0];
  // hand.fingers = 2;
  // setHands([ hand, ...hands.slice(1) ]);
  function initializeHands(){
    let hands = [];
    for(let i = 0; i < 4; i++){
      hands.push(
        {
          key: i,
          fingers: 2,
          selected: false,
          selectable: false, 
          isOnAttack: false,
          isOnSplit: false,
          canBeAttacked: false,
          canBeSplit: false,
          onHandClick: function(hands, playerTurn, prevHands){
            // DESELECT: if hand is already selected, return to previous state
            console.log({hands, playerTurn, prevHands});
            if(this.selected){
              setShowDone(false);
              setHands(deepCopy(prevHands));
            }
            // ATTACK MODE: selecting which hand to attack with
            else if(this.isOnAttack){
              if(this.selectable){
                // if clicked hand is not selected, select it
                let updatedHands = [...hands];
                updatedHands[this.key].selected = true;
      
                // attack mode 
                // making all other hands that aren't the player's selectable to attack
                for(let i = 0; i < hands.length; i++){
                  // for immutability (create a copy, modify it, then update the state with copy)
                  if(!updatedHands[i].selectable && updatedHands[i].fingers != 0) updatedHands[i].canBeAttacked = true;
                  updatedHands[i].selectable = !updatedHands[i].selectable;
                }
                setHands(updatedHands);
              }
              else{
                // this should do nothing
                this.selected = false;
              }
              // ATTACK MODE DONE: no hand is on attack anymore
              let updatedHands = [...hands];
              for(let i = 0; i < hands.length; i++){
                updatedHands[i].isOnAttack = false;
              }
              setHands(updatedHands);
            }
            // ATTACKING MODE: selecting which hand to attack
            else if(this.canBeAttacked){
              if(this.selectable){
      
                // find selected (attacking) hand, then add to selected (attacked) hand
                let selectedHand;
                for(let i = 0; i < hands.length; i++){
                  if(hands[i].selected) selectedHand = hands[i];
                }
                let updatedHands = [...hands];
                updatedHands[this.key].fingers = this.fingers + selectedHand.fingers;
                updatedHands[this.key] = checkDeadHand(this);
      
                // TURN DONE: check for winner, reset all hands and atlernate player turn
                calculateWinner(updatedHands);
                for(let i = 0; i < hands.length; i++){
                  updatedHands[i].selectable = false;
                  updatedHands[i].selected = false;
                  updatedHands[i].canBeAttacked = false;
                }
                setHands(updatedHands);
                setPlayerTurn(prevTurn => prevTurn === 0 ? 1 : 0);
                setShowAttack(true);
                setShowSplit(true);
                setShowBack(false);

                // send end of turn to server
                // first set up move data to send to server
                let moveData = {
                    hands: updatedHands,
                    playerTurn: playerTurn
                }
                socket.emit('move', {room: room, move: moveData});
              }
              else{
                // this should do nothing
                this.selected = false;
              }
            }
            else if(this.isOnSplit){
              if(this.selectable){
                // if hand is selected, deselect it
                if(this.selected){
                  this.selected = false;
                }
                else{
                  // SPLIT MODE
      
                  // if hand is not selected, select it
                  let updatedHands = [...hands];
                  updatedHands[this.key].selected = true;
      
                  // make the hand to be split selectable
                  for(let i = 0; i < hands.length; i++){
                    if(hands[i].fingers !== -1 && (hands[i].key === playerTurn * 2 + 1 || hands[i].key === playerTurn * 2) && hands[i].key !== this.key){
                      updatedHands[i].selectable = true;
                      updatedHands[i].canBeSplit = true;
                      updatedHands[i].isOnSplit = false;
                    }
                  }
                  
                  // update hand state
                  setHands(updatedHands);
                }
              }
            }
            else if(this.canBeSplit){
              if(this.selectable){
                // let done button be shown
                setShowDone(true);
      
                // subtract 1 from selected hand, add 1 to clicked hand
                let updatedHands = [...hands];
                let startFingers = updatedHands[updatedHands.find(hand => hand.selected).key].fingers // selected hand
                let endFingers = updatedHands[this.key].fingers; // clicked hand
                if(startFingers > 0 && endFingers >= 0 && endFingers < 4){ // selected hand is greater than 1, clicked hand is greater than or equal 0 and less than 4
                  endFingers = this.fingers + 1;
                  startFingers = updatedHands[updatedHands.find(hand => hand.selected).key].fingers - 1;
                  if(isValidSplit(playerTurn, startFingers, endFingers, prevHands)){ // prevents going into negatives
                    updatedHands[this.key].fingers = this.fingers + 1;
                    updatedHands[updatedHands.find(hand => hand.selected).key].fingers = updatedHands[updatedHands.find(hand => hand.selected).key].fingers - 1;
                  }
                }
                setHands(updatedHands);
              }
            }
            // selecting which hand to attack with
            // if(mode === 0){
            //   console.log('entering attack mode');
            //   handleNoneMode(this, hands);
            // }
            // // selecting which hand to attack
            // else if(mode === 1){
            //   console.log('entering attacking mode');
            //   handleAttackingMode(this, hands);
            // }
          }
        }
      )
      // hands[i].addEventListener('click', onHandClick(hands, playerTurn, prevHands));
    }
    setHands(hands);
  }
  useEffect(() => {
    initializeHands();
  }, [])

  // BUTTON FUNCTIONALITY
  function attack(playerTurn){
    // remove buttons
    setShowAttack(false);
    setShowSplit(false);
    setShowBack(true);
    // select player's hands based on playerTurn
    let updatedHands = [...hands];
    for(let i = playerTurn * 2; i < playerTurn*2 + 2; i++){
      // If the hand isn't out of the game
      if(updatedHands[i].fingers !== 0){
        updatedHands[i].selectable = true;
        updatedHands[i].isOnAttack = true;
      }
    }
    setHands(updatedHands);
    setPrevHands(deepCopy(updatedHands));
  }

  function split(){
    // remove buttons
    setShowAttack(false);
    setShowSplit(false);
    setShowBack(true);

    // select player's hands based on playerTurn
    let updatedHands = [...hands];
    for(let i = playerTurn * 2; i < playerTurn*2 + 2; i++){
      if(updatedHands[i].fingers !== 0){
        updatedHands[i].selectable = true;
        updatedHands[i].isOnSplit = true;
      }
    }
    setHands(updatedHands);
    setPrevHands(deepCopy(updatedHands));
  }

  function back(){
    // reset hands
    let updatedHands = [...hands];
    for(let i = 0; i < hands.length; i++){
      updatedHands[i].fingers = prevHands[i].fingers;
      updatedHands[i].selectable = false;
      updatedHands[i].selected = false;
      updatedHands[i].canBeSplit = false;
      updatedHands[i].isOnSplit = false;
      updatedHands[i].canBeAttacked = false;
      updatedHands[i].isOnAttack = false;
    }
    setHands(updatedHands);

    // reset game
    setShowBack(false);
    setShowAttack(true);
    setShowSplit(true);
    setShowDone(false);
  }

  function done(hands){ // only appears for split mode
    if(!allowHandSwitchRule){
      if((hands[playerTurn * 2].fingers === prevHands[playerTurn * 2 + 1].fingers && hands[playerTurn * 2 + 1].fingers === prevHands[playerTurn * 2].fingers) || (hands[playerTurn * 2 + 1].fingers === prevHands[playerTurn * 2 + 1].fingers && hands[playerTurn * 2].fingers === prevHands[playerTurn * 2].fingers)){
        alert("Invalid move due to Hand Switch Rule"); // Change invalid text
      }
      else{
        // check rules

        // reset hands
        let updatedHands = [...hands];
        for(let i = 0; i < hands.length; i++){
          updatedHands[i].selectable = false;
          updatedHands[i].selected = false;
          updatedHands[i].canBeSplit = false;
          updatedHands[i].isOnSplit = false;
          updatedHands[i].canBeAttacked = false;
          updatedHands[i].isOnAttack = false;
        }
        setHands(updatedHands);
        setShowDone(false);
        setShowAttack(true);
        setShowSplit(true);
        setShowBack(false);
        setPrevHands(deepCopy(updatedHands));
        setPlayerTurn(prevTurn => prevTurn === 0 ? 1 : 0);

        // send end of turn to server
        // first set up move data to send to server
        let moveData = {
            hands: deepCopy(updatedHands),
            playerTurn: playerTurn
        }
        socket.emit('move', {room: room, move: moveData});
      }
    }
    else if(hands){
      // check rules

      // reset hands
      let updatedHands = [...hands];
      for(let i = 0; i < hands.length; i++){
        updatedHands[i].selectable = false;
        updatedHands[i].selected = false;
        updatedHands[i].canBeSplit = false;
        updatedHands[i].isOnSplit = false;
        updatedHands[i].canBeAttacked = false;
        updatedHands[i].isOnAttack = false;
      }
      setHands(updatedHands);
      setShowDone(false);
      setShowAttack(true);
      setShowSplit(true);
      setShowBack(false);
      setPrevHands(deepCopy(updatedHands));
      setPlayerTurn(prevTurn => prevTurn === 0 ? 1 : 0);
    }
  }

  let onHandClick = (hand, hands, playerTurn, prevHands) => {
    // DESELECT: if hand is already selected, return to previous state
    if(hand.selected){
      setShowDone(false);
      setHands(prevHands);
    }
    // ATTACK MODE: selecting which hand to attack with
    else if(hand.isOnAttack){
      if(hand.selectable){
        // if clicked hand is not selected, select it
        let updatedHands = [...hands];
        updatedHands[hand.key].selected = true;

        // attack mode
        // making all other hands that aren't the player's selectable to attack
        for(let i = 0; i < hands.length; i++){
          // for immutability (create a copy, modify it, then update the state with copy)
          if(!updatedHands[i].selectable && updatedHands[i].fingers != 0) updatedHands[i].canBeAttacked = true;
          updatedHands[i].selectable = !updatedHands[i].selectable;
        }
        setHands(updatedHands);
      }
      // ATTACK MODE DONE: no hand is on attack anymore
      let updatedHands = [...hands];
      for(let i = 0; i < hands.length; i++){
        updatedHands[i].isOnAttack = false;
      }
      setHands(updatedHands);
      console.log(updatedHands);
    }
    // ATTACKING MODE: selecting which hand to attack
    else if(hand.canBeAttacked){
      if(hand.selectable){
        // find selected attacking hand, then add to selected attacked hand
        let selectedHand;
        for(let i = 0; i < hands.length; i++){
          if(hands[i].selected) selectedHand = hands[i]; 
        }
        let updatedHands = [...hands];
        updatedHands[hand.key].fingers = hand.fingers + selectedHand.fingers;
        updatedHands[hand.key] = checkDeadHand(hand);

        // TURN DONE: check for winner, reset all hands and alternate player turn
        calculateWinner(updatedHands);
        for(let i = 0; i < hands.length; i++){
          updatedHands[i].selectable = false;
          updatedHands[i].selected = false;
          updatedHands[i].canBeAttacked = false;
        }
        setHands(updatedHands);
        setPlayerTurn(prevTurn => prevTurn === 0 ? 1 : 0);
        setShowAttack(true);
        setShowSplit(true);
        setShowBack(false);

        // send end of turn to server
        // first set up move data to send to server
        let moveData = {
          hands: updatedHands,
          playerTurn: playerTurn
        }
        socket.emit('move', {room: room, move: moveData});
      }
    }
    else if(hand.isOnSplit){
      if(hand.selectable){
        // if hand is selecrted, deselect it
        if(hand.selected){
          hand.selected = false;
        }
        // SPLIT MODE
        else{
          // if hand is not selected, select it
          let updatedHands = [...hands];
          updatedHands[hand.key].selected = true;

          // make the hand to be split selectable
          for(let i = 0; i < hands.length; i++){
            if(hands[i].fingers !== -1 && (hands[i].key === playerTurn * 2 + 1 || hands[i].key === playerTurn * 2) && hands[i].key !== hand.key){
              updatedHands[i].selectable = true;
              updatedHands[i].canBeSplit = true;
              updatedHands[i].isOnSplit = false;
            }
          }

          // update hand state
          console.log(prevHands);
          setHands(updatedHands);
        }
      }
    }
    else if(hand.canBeSplit){
      if(hand.selectable){
        // let done button be shown
        setShowDone(true);

        // subtract 1 from selected hand, add 1 to clicked hand
        let updatedHands = [...hands];
        let startFingers = updatedHands[updatedHands.find(hand => hand.selected).key].fingers; // selected hand
        let endFingers = updatedHands[hand.key].fingers; // clicked hand
        if(startFingers > 0 && endFingers >= 0 && endFingers < 4){ // selected hand is greater than 1, clicked hand is greater than or equal 0 and less than 4
          endFingers = hand.fingers + 1;
          startFingers = updatedHands[updatedHands.find(hand => hand.selected).key].fingers - 1;
          if(isValidSplit(playerTurn, startFingers, endFingers, prevHands)){ // prevent going into negatives
            updatedHands[hand.key].fingers = hand.fingers + 1;
            updatedHands[updatedHands.find(hand => hand.selected).key].fingers = updatedHands[updatedHands.find(hand => hand.selected).key].fingers - 1;
          }
        }
        setHands(updatedHands);
      }
    }
  }

  // update everything on the board for the OOPONENT'S side
  const endTurn = useCallback((move) => {
    try {
        setHands(deepCopy(move.hands));
        setPlayerTurn(move.playerTurn === 0 ? 1 : 0);
        calculateWinner(move.hands);
    }
    catch(e){
        console.log(e);
    }
  })

  useEffect(() => {
    socket.on('move', (move) => {
        console.log(move);
        endTurn(deepCopy(move));
    })
  }, [endTurn]);



  function calculateWinner(hands){
    let activePlayers = 0;
    let lastCheckedPlayer = -1;
    for(let i = 0; i < hands.length - 1; i += 2){
      if(hands[i].fingers > 0 || hands[i + 1].fingers > 0){
        activePlayers++;
        lastCheckedPlayer = i / 2;
      }
    }
    // if total players = 1, then winner
      if(activePlayers === 1){
        console.log('WINNER');
        let winner = lastCheckedPlayer + 1;
        setGameOver(true);
        setShowWinner(true);
        setWinner(winner);
        console.log("WINNER");
      }
  }

  function isValidSplit(playerTurn, hand1, hand2, prevHands){ // checks hands to prevent going into negatives on split mode
    let prevPlayerHands = prevHands.slice(playerTurn * 2, playerTurn * 2 + 2);
    return !(hand1 === 0 && prevPlayerHands[1] === 0) && !(hand2 === 0 && prevPlayerHands[0] === 0);
  }

  function checkDeadHand(hand){
    if(hand.fingers >= 5){
      hand.fingers = 0;
    }
    return hand;
  }

  function deepCopy(obj) { // a variance of deep copy that copies all properties of an object, including functions
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    let copy;

    if (Array.isArray(obj)) {
        copy = [];
        for (let i = 0, len = obj.length; i < len; i++) {
            copy[i] = deepCopy(obj[i]);
        }
        return copy;
    }

    if (obj instanceof Object) {
        copy = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                copy[key] = deepCopy(obj[key]);
            }
        }
        return copy;
    }

    throw new Error("Unable to copy object!");
}

  // status
  let status = winner ? "Winner: " + winner : "Next player: " + (playerTurn === 0 ? "2" : "1");

  // LOADING GAME
  if (hands.length === 0) return <div>Loading...</div>;
  // game
  return (
    <GameContext.Provider value={prevHands}>
      <div className="game">
      <div id="logo" className="logo" src=""><img src="/assets/standard_blackChopsticks.png"></img></div>
        <div className="status">{status}</div>
        <div className="playerHands">
          <Player playerNumber={0} hands={hands} playerTurn={playerTurn} prevHands={prevHands} onHandClick={onHandClick}/>
          <Player playerNumber={1} hands={hands} playerTurn={playerTurn} prevHands={prevHands} onHandClick={onHandClick}/>
        </div>
        <div className="options">
          {showAttack && <button className="attack" id="attack" onClick={() => attack(playerTurn)}>Attack</button>}
          {showSplit && <button className="split" id="split" onClick={split}>Split</button>}
          {showBack && <button className="back" id="back" onClick={back}>➜</button>}
          {showDone && <button className = "done" id="done" onClick={() => done(hands)}>Done</button>}
          {showWinner && <div className="winner">WINNER: {winner}</div>}
        </div>
        <div className="playerTurn">Player Turn: {playerTurn + 1}</div>
        <button onClick={() => console.log(hands)}>Hands</button> 
      </div>
      <CustomDialog
        open={Boolean(gameOver)}
        title="Game Over"
        contentText="Would you like to play again?"
        handleContinue={() => setGameOver(false)}
      />
    </GameContext.Provider>
  );
}