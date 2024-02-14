import '../App.css';
import React, { createContext, useState, useEffect } from 'react';
import Player from './Player.js';
import CustomDialog from './CustomDialog.js';
import name from './StartMenu.js';
// import options from settings

export const GameContext = createContext();

// LOGIC for chopsticks game

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
  const [allowHandSwitchRule, setAllowHandSwitchRule] = useState(false);

  // let hand = hands[0];
  // hand.fingers = 2;
  // setHands([ hand, ...hands.slice(1) ]);
  function initializeHands(){
    let hands = [];
    for(let i = 0; i < 4; i++){
      hands.push(
        {
          key: i,
          fingers: 1,
          selected: false,
          selectable: false, 
          isOnAttack: false,
          isOnSplit: false,
          canBeAttacked: false,
          canBeSplit: false,
          onHandClick: function(hands, playerTurn, prevHands){
            // DESELECT: if hand is already selected, return to previous state
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
  // function onHandClick(hands, playerTurn, prevHands){
  //   // DESELECT: if hand is already selected, return to previous state
  //   if(this.selected){
  //     setHands([...prevHands]);
  //   }
  //   // ATTACK MODE: selecting which hand to attack with
  //   else if(this.isOnAttack){
  //     if(this.selectable){
  //       // if clicked hand is not selected, select it
  //       let updatedHands = [...hands];
  //       updatedHands[this.key].selected = true;

  //       // attack mode 
  //       // making all other hands that aren't the player's selectable to attack
  //       for(let i = 0; i < hands.length; i++){
  //         // for immutability (create a copy, modify it, then update the state with copy)
  //         if(!updatedHands[i].selectable && updatedHands[i].fingers != 0) updatedHands[i].canBeAttacked = true;
  //         updatedHands[i].selectable = !updatedHands[i].selectable;
  //       }
  //       setHands(updatedHands);
  //     }
  //     else{
  //       // this should do nothing
  //       this.selected = false;
  //     }
  //     // ATTACK MODE DONE: no hand is on attack anymore
  //     let updatedHands = [...hands];
  //     for(let i = 0; i < hands.length; i++){
  //       updatedHands[i].isOnAttack = false;
  //     }
  //     setHands(updatedHands);
  //   }
  //   // ATTACKING MODE: selecting which hand to attack
  //   else if(this.canBeAttacked){
  //     if(this.selectable){

  //       // find selected (attacking) hand, then add to selected (attacked) hand
  //       let selectedHand;
  //       for(let i = 0; i < hands.length; i++){
  //         if(hands[i].selected) selectedHand = hands[i];
  //       }
  //       let updatedHands = [...hands];
  //       updatedHands[this.key].fingers = this.fingers + selectedHand.fingers;
  //       updatedHands[this.key] = checkDeadHand(this);

  //       // TURN DONE: check for winner, reset all hands and atlernate player turn
  //       calculateWinner(updatedHands);
  //       for(let i = 0; i < hands.length; i++){
  //         updatedHands[i].selectable = false;
  //         updatedHands[i].selected = false;
  //         updatedHands[i].canBeAttacked = false;
  //       }
  //       setHands(updatedHands);
  //       setPlayerTurn(prevTurn => prevTurn === 0 ? 1 : 0);
  //       setShowAttack(true);
  //       setShowSplit(true);
  //       setShowBack(false);
  //     }
  //     else{
  //       // this should do nothing
  //       this.selected = false;
  //     }
  //   }
  //   else if(this.isOnSplit){
  //     if(this.selectable){
  //       // if hand is selected, deselect it
  //       if(this.selected){
  //         this.selected = false;
  //       }
  //       else{
  //         // SPLIT MODE

  //         // if hand is not selected, select it
  //         let updatedHands = [...hands];
  //         updatedHands[this.key].selected = true;

  //         // make the hand to be split selectable
  //         for(let i = 0; i < hands.length; i++){
  //           if(hands[i].fingers !== -1 && (hands[i].key === playerTurn * 2 + 1 || hands[i].key === playerTurn * 2) && hands[i].key !== this.key){
  //             updatedHands[i].selectable = true;
  //             updatedHands[i].canBeSplit = true;
  //             updatedHands[i].isOnSplit = false;
  //           }
  //         }
          
  //         // update hand state
  //         setHands(updatedHands);
  //       }
  //     }
  //   }
  //   else if(this.canBeSplit){
  //     if(this.selectable){
  //       // let done button be shown
  //       setShowDone(true);

  //       // subtract 1 from selected hand, add 1 to clicked hand
  //       let updatedHands = [...hands];
  //       let startFingers = updatedHands[updatedHands.find(hand => hand.selected).key].fingers // selected hand
  //       let endFingers = updatedHands[this.key].fingers; // clicked hand
  //       if(startFingers > 0 && endFingers >= 0 && endFingers < 4){ // selected hand is greater than 1, clicked hand is greater than or equal 0 and less than 4
  //         endFingers = this.fingers + 1;
  //         startFingers = updatedHands[updatedHands.find(hand => hand.selected).key].fingers - 1;
  //         if(isValidSplit(playerTurn, startFingers, endFingers, prevHands)){ // avoid x : 0 --> 0 : x
  //           updatedHands[this.key].fingers = this.fingers + 1;
  //           updatedHands[updatedHands.find(hand => hand.selected).key].fingers = updatedHands[updatedHands.find(hand => hand.selected).key].fingers - 1;
  //         }
  //       }
  //       setHands(updatedHands);
  //     }
  //   }
  // }

  // FUNCTIONS
  // function handleAttackingMode(hands){
  //   let selectedHand;
  //   // find selected hand, then add
  //   for(let i = 0; i < hands.length; i++){
  //     if(hands[i].selected) selectedHand = hands[i];
  //   }
  //   this.fingers = this.fingers + selectedHand.fingers;

  //   // reset all hands and atlernate player turn
  //   for(let i = 0; i < hands.length; i++){
  //     hands[i].selectable = false;
  //     hands[i].selected = false;
  //   }
  //   setPlayerTurn(playerTurn === 0 ? 1 : 0);
  // }

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
          <Player playerNumber={0} hands={hands} playerTurn={playerTurn}/>
          <Player playerNumber={1} hands={hands} playerTurn={playerTurn}/>
        </div>
        <div className="options">
          {showAttack && <button className="attack" id="attack" onClick={() => attack(playerTurn)}>Attack</button>}
          {showSplit && <button className="split" id="split" onClick={split}>Split</button>}
          {showBack && <button className="back" id="back" onClick={back}>➜</button>}
          {showDone && <button className = "done" id="done" onClick={() => done(hands)}>Done</button>}
          {showWinner && <div className="winner">WINNER: {winner}</div>}
        </div>
        <div className="playerTurn">Player Turn: {playerTurn + 1}</div>
        {/*<button onClick={() => console.log(hands)}>Previous Hands</button>*/}
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
