import './App.css';
import React, { createContext, useContext, useState, useEffect } from 'react';
import {useRef} from 'react';
import Hand from './components/Hand.js';
import Player from './components/Player.js';

// logic for chopsticks game

export default function Game(){
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
  const [mode, setMode] = useState(0); // attack, split, attacking, splitting, none

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
          onModeClick: function(clickedHand){
            // if hand is already selected, deselect it
            console.log(playerTurn);
            if(this.selected){
              console.log(prevHands);
              setHands(prevHands);
            }
            // ATTACK MODE: selecting which hand to attack with
            else if(this.isOnAttack){
              // if hand is already selected, deselect it
              if(clickedHand.selectable){
                if(clickedHand.selected){
                  clickedHand.selected = false;
                }
                else{
                  // store current state in prevHands
                  setPrevHands(hands);
                  // console.log(hands);

                  // if clicked hand is not selected, select it
                  let updatedHands = [...hands];
                  updatedHands[this.key].selected = true;

                  // attack mode 
                  // making all other hands that aren't the player's selectable to attack
                  for(let i = 0; i < hands.length; i++){
                    // for immutability (create a copy, modify it, then update the state with copy)
                    if(!updatedHands[i].selectable && updatedHands[i].fingers != 0) {updatedHands[i].canBeAttacked = true;}
                    updatedHands[i].selectable = !updatedHands[i].selectable;
                  }
                  setHands(updatedHands);

                }
              }
              else{
                // this should do nothing
                clickedHand.selected = false;
              }
              // no hand is on attack anymore
              let updatedHands = [...hands];
              for(let i = 0; i < hands.length; i++){
                updatedHands[i].isOnAttack = false;
              }
              setHands(updatedHands);
            }
            // ATTACKING MODE: selecting which hand to attack
            else if(this.canBeAttacked){
              if(clickedHand.selectable){

                // find selected (attacking) hand, then add to selected (attacked) hand
                let selectedHand;
                for(let i = 0; i < hands.length; i++){
                  if(hands[i].selected) selectedHand = hands[i];
                }
                let updatedHands = [...hands];
                updatedHands[clickedHand.key].fingers = clickedHand.fingers + selectedHand.fingers;
                updatedHands[clickedHand.key] = checkDeadHand(clickedHand);

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
              }
              else{
                // this should do nothing
                clickedHand.selected = false;
              }
            }
            else if(this.isOnSplit){
              if(this.selectable){
                // if hand is selected, deselect it
                if(clickedHand.selected){
                  clickedHand.selected = false;
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

                  // create a state of hands for the case of 2 : 0 --> 0 : 2
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
                  if(isValidSplit(playerTurn, startFingers, endFingers, prevHands)){ // avoid x : 0 --> 0 : x
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
            //   handleNoneMode(clickedHand, hands);
            // }
            // // selecting which hand to attack
            // else if(mode === 1){
            //   console.log('entering attacking mode');
            //   handleAttackingMode(clickedHand, hands);
            // }
          }
        }
      )
    }
    setHands(hands);
  }

  useEffect(() => {
    initializeHands();
  }, [])


  // button functionalities
  function attack(playerTurn){
    // remove buttons
    setShowAttack(false);
    setShowSplit(false);
    setShowBack(true);
    // select player's hands based on playerTurn
    for(let i = playerTurn * 2; i < playerTurn*2 + 2; i++){
      let updatedHands = [...hands];
      if(hands[i].fingers !== 0){
        hands[i].selectable = true;
        hands[i].isOnAttack = true;
      }
      setHands(updatedHands);
    }
    // select hand to attack

    // result of attack
  }

  function split(){
    // remove buttons
    setShowAttack(false);
    setShowSplit(false);
    setShowBack(true);

    // select player's hands based on playerTurn
    for(let i = playerTurn * 2; i < playerTurn*2 + 2; i++){
      let updatedHands = [...hands];
      if(hands[i].fingers !== 0){
        hands[i].selectable = true;
        hands[i].isOnSplit = true;
      }
      setHands(updatedHands);
    }
  }

  function back(){

  }

  function done(hands){
    if(hands){
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
      // setPrevHands(updatedHands);
      setShowDone(false);
      setShowAttack(true);
      setShowSplit(true);
      setShowBack(false);
      setPlayerTurn(prevTurn => prevTurn === 0 ? 1 : 0);
    }
  }

  // FUNCTIONS

  function handleNoneMode(clickedHand, hands){
    if(clickedHand.selectable){
      // if hand is selected, deselect it
      if(clickedHand.selected){
        clickedHand.selected = false;
      }
      else{
        // if clicked hand is not selected, select it
        clickedHand.selected = true;
        // attack mode 
        // making all other hands that aren't the player's selectable to attack
        for(let i = 0; i < hands.length; i++){
          // for immutability (create a copy, modify it, then update the state with copy)
          let updatedHands = [...hands];
          updatedHands[i].selectable = !hands[i].selectable;
          setHands(updatedHands);
        }
        setMode(1);
      }
    } 
    else{
      // this should do nothing
      clickedHand.selected = false;
    }
  }

  function handleAttackingMode(clickedHand, hands){
    let selectedHand;
    // find selected hand, then add
    for(let i = 0; i < hands.length; i++){
      if(hands[i].selected) selectedHand = hands[i];
    }
    clickedHand.fingers = clickedHand.fingers + selectedHand.fingers;

    // reset all hands and atlernate player turn
    for(let i = 0; i < hands.length; i++){
      hands[i].selectable = false;
      hands[i].selected = false;
    }
    setPlayerTurn(playerTurn === 0 ? 1 : 0);
  }

  function calculateWinner(hands){
    let winner = -1;
    let winningHands = hands.reduce
    for(let i = 0; i < hands.length - 1; i += 2){
      if(hands[i].fingers === 0 && hands[i + 1].fingers === 0){
        console.log('WINNER');
        winner = i / 2;
        setGameOver(true);
        setShowWinner(true);
        setWinner(winner);
      }
    }
  }

  function isValidSplit(playerTurn, hand1, hand2, prevHands){
    let prevPlayerHands = prevHands.slice(playerTurn * 2, playerTurn * 2 + 2);
    if((hand1 === 0 && prevPlayerHands[1] === 0) || (hand2 === 0 && prevPlayerHands[0] === 0)){
      return false;
    }
    return true;
  }

  function checkDeadHand(hand){
    if(hand.fingers >= 5){
      hand.fingers = 0;
    }
    return hand;
  }

  // status
  let status = winner ? "Winner: " + winner : "Next player: " + (playerTurn === 0 ? "1" : "0");

  // LOADING GAME
  if (hands.length === 0) 
    return (
      <div>Loading...</div>
    );
  // game
  return (
    <div className="game">
      <div className="status">{status}</div>
      <div className="playerHands">
        <Player playerNumber={0} hands={hands}/>
        <Player playerNumber={1} hands={hands}/>
      </div>
      <div className="options">
        {showAttack && <button className="attack" id="attack" onClick={() => attack(playerTurn)}>Attack</button>}
        {showSplit && <button className="split" id="split" onClick={split}>Split</button>}
        {showBack && <button className="back" id="back" onClick={back}>Back</button>}
        {showDone && <button className = "done" id="done" onClick={() => done(hands)}>Done</button>}
        {showWinner && <div className="winner">WINNER: {winner}</div>}
      </div>
      <div>Player Turn: {playerTurn}</div>
    </div>
  );
}
