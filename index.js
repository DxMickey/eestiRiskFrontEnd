const socket = io('http://localhost:3000');

socket.on('init',handleInit);
socket.on('gameState',handleGameState);
socket.on('gameOver',handleGameOver);
socket.on('gameCode',handleGameCode);
socket.on('unknownCode',handleUnknownCode);
socket.on('tooManyPlayers',handleTooManyPlayers);
socket.on('waitingForPlayers',handleWaitingForPlayers);
socket.on('errorMsg',handleError);

function handleError(err){
    console.log(err);
    errorText.innerText = err;
    setTimeout(()=>{
        errorText.innerHTML = null;
    },2000)
}

const gameScreen = document.getElementById('gameScreen');
const buttonContainer = document.getElementById("buttonContainer");
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const waitingScreen = document.getElementById("waitingScreen");
const gameMap = document.getElementById("gameMap");
const gameLog = document.getElementById("gameLog");
const gameImg = document.getElementById("mapimg");
const attackScreen = document.getElementById("attackScreen")
const soldierPlaceForm = document.getElementById("soldierPlaceForm");
const infoHeader = document.getElementById("info");
const errorText = document.getElementById("errorText");
const diceContainer = document.getElementById("diceContainer");

/*BUTTONS/INPUTS*/
const placeSoldierBtn = document.getElementById("placeSoldierBtn");
const howManySoldiers = document.getElementById("howManySoldiers")
const attackButton = document.getElementById("attackBtn")
const skipTurnBtn = document.getElementById("skipTurnBtn")
const moveButton = document.getElementById("moveSoldierBtn")

/*SELECTS*/
const moveFromOptions  = document.getElementById("moveFromOptions");
const moveToOptions = document.getElementById("moveToOptions");

/*COLORS*/
const GAMECOLORS = {
    attackerCountryColor:'green',
    defenderCountryColor:'yellow',
    attackButtonReady:'red',
    activePlayerBtnColor:'rgb(176, 145, 206)'
    
}
const playerColors = ["red","aqua","pink","purple"] //m2ngija 1 on punane jne






newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);

function newGame() {
  socket.emit('newGame');
  init();
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit('joinGame', code);
  init();
}
var gameActive = false;
var playerNumber;


function clearGameScreen(){
    gameLog.style.display = 'block'
    gameScreen.style.display = "block";
    // gameMap.style.display = 'block'
    infoHeader.textContent =  null;
    document.title = null;
    gameMap.style.display = 'block'
}


function renderGame(state){
    /*renderdab m2nguseisu p6hjal kliendile*/
    if(!state){
        console.log("State not recieved\n");
        return;
    }
    buttonContainer.style.display = 'block';
    moveButton.onclick = null;
    placeSoldierBtn.onclick = null;
    skipTurnBtn.onclick = null;
    attackButton.onclick = null;
    
    if(state.currentPlayer == playerNumber){
        moveButton.style.backgroundColor = GAMECOLORS.activePlayerBtnColor;
        placeSoldierBtn.style.backgroundColor = GAMECOLORS.activePlayerBtnColor;
        attackButton.style.backgroundColor = GAMECOLORS.activePlayerBtnColor;
        skipTurnBtn.style.backgroundColor = GAMECOLORS.activePlayerBtnColor;
    }
    else{
        moveButton.style.backgroundColor = 'white';
        placeSoldierBtn.style.backgroundColor = 'white';
        attackButton.style.backgroundColor = 'white';
        skipTurnBtn.style.backgroundColor = 'white';
        
    }
    if(state.attack.isHappening  == false){
        document.getElementById("attackDiceContainer").innerHTML = null
        document.getElementById("defenseDiceContainer").innerHTML = null
    }
    clearGameScreen(); 
    renderMapState(state);
    displayGameInfo(state);
    moveButtonContainer.innerHTML = null;
    addGameInfo("Player 1 soldiers" + state.sodureid[0] +'');
    addGameInfo("Player 2 soldiers" + state.sodureid[1] + '');
    
    var thisPlayerCountries = getPlayerAreas(state,playerNumber);
    console.log(playerNumber,state.currentPlayer);
    document.title = state.nicknames[playerNumber-1] + playerColors[playerNumber-1];
    if(playerNumber==state.currentPlayer){
        
        document.title += " YOUR TURN";
        
        /*SODURITE PANEMINE************************************/
        vabaMaa = checkForFreeStates(state);
        console.log(vabaMaa)
        let nrOfClicks = 0
        placeSoldierBtn.onclick =()=>{
            document.getElementById("placeSoldierBtn-hidden").style.display = 'inline-block'
            for(i=0;i<vabaMaa.length;i++){
                placeSoldierBtn.onclick = ()=>{
                    socket.emit('resetGameState');
                };
                nimi = vabaMaa[i];
                path = document.getElementById(nimi);
                if(state.board[nimi].owner < 0){
                path.style.fill = 'gray'
                }
                path.addEventListener('click', (e) =>{
                    nrOfClicks++;
                    if(nrOfClicks%2==1){
                        e.target.style.fillOpacity = 0.75;
                    }else{e.target.style.fillOpacity = 1;}
                    
                    riik = e.target.id
                    document.getElementById("soldierPlaceTarget").innerText = capitalizeFirstLetter(riik);
                    placeSoldierBtnConfirm = document.getElementById("placeSoldierConfirmBtn")
                    
                    placeSoldierBtnConfirm.classList.toggle('red');
                    
                    placeSoldierBtnConfirm.onclick = ()=>{
            document.getElementById("placeSoldierBtn-hidden").style.display = 'none'
                        
                        if(riik.includes("tekst")){riik.replace("tekst",'')};
                        
                        var sodur =parseInt(howManySoldiers.value);
                        
                        if(sodur >5 || sodur <1 || sodur == null || sodur == undefined)
                        {alert("you can place 1-5 soldiers")}
                        
                        else{
                            socket.emit('placeSoldier',{owner:playerNumber,country:riik,nrOfSoldiers:sodur});
                        }
                    }
                })
            }
           
        }
        
        
        /*SKIP TURN*/
        skipTurnBtn.onclick = () => {socket.emit("endTurn");}
        
        
        /*MOVE SOLDIERS*/
        // createDynamicSelect(button,container,array)        
        moveButtonContainer.style.display = 'none'
        moveButton.onclick = ()=>{
            moveButtonContainer = document.getElementById("moveButtonContainer");
            moveButtonContainer.style.display = 'block'
            
            thisPlayerCountries = getPlayerAreas(state,playerNumber)
            from = createDynamicSelect(moveButtonContainer,"moveFrom",thisPlayerCountries,"<b>Move from: </b>");
            to = createDynamicSelect(moveButtonContainer,"moveTo",thisPlayerCountries,"<b> Move To: </b>");
            amount = createDynamicSelect(moveButtonContainer,"soldierAmount",[1,2,3,4,5],"<b> Amount of Soldiers</b>")
            // from.onchange = ()=>{
            //     to.remove();
            //     amount.remove();
            //     labels = document.getElementsByTagName("label")
            //     labels[labels.length -2].remove();
            //     labels[labels.length -1].remove();
            //     from = createDynamicSelect(moveButtonContainer,"moveFrom",thisPlayerCountries,"<b>Move from: </b>");
            //     to = createDynamicSelect(moveButtonContainer,"moveTo",getTrueNeighbors(from.value),"<b> Move To: </b>");
            // }
            
            // moveButtonContainer.appendChild(amount);
            
            confirmBtn = document.createElement("button");
            confirmBtn.classList.add("soldierAmount");
            // confirmBtn.type = 'submit';
            confirmBtn.innerText = "CONFIRM";
            console.log(amount.value);
            moveButtonContainer.appendChild(confirmBtn);
            
            confirmBtn.onclick = () =>{
                var sodur =parseInt(amount.value);
                console.log(from.value,to.value,amount.value);
                amount = parseInt(amount.value);
                if(from.value != undefined || to.value != undefined || sodur !=null){
                    console.log("sent emit",amount)
                socket.emit('moveArmies',{moveFrom:from.value,
                    moveTo:to.value,
                    nrOfSoldiers:sodur});
                }
                
            }
        }
        
        function getTrueNeighbors(state,area){
            /*Leiab need naabrid, mis pole ryndaja omad*/
            neighbors = state.board[area].neighbors;
            owner = state.board[area].owner
            trueNeighbors =[]
            for(neighbor of neighbors){
                console.log(neighbor);
                if(state.board[neighbor].owner != owner && state.board[neighbor].soldiers >0){
                    trueNeighbors.push(neighbor);
                }
            }
            return trueNeighbors;
        }

        
        /*ATTACK*/
        // nrOfDice= createDynamicSelect(moveButtonContainer,"diceAmount",[1,2,3,4,5,6,7,8,9],"<b>Amount of Soldiers</b>")
        quitAttackButton.style.display = 'none'
        attackCommandStuff = document.getElementById("spanAttackInfo")
        attackCommandStuff.style.display = 'none'
        var attackCommand = {attackingCountry:'',defendingCountry:'',nrOfDice:null}
        attackButton.onclick = ()=>{
            attackCommandStuff.style.display = 'inline'
            
            /*Juhuks, kui tahab poole rynnaku pealt loobuda*/
            quitAttackButton.style.display = 'inline'
            quitAttackButton.style.background = GAMECOLORS.activePlayerBtnColor;
            quitAttackButton.addEventListener("click",()=>{socket.emit('resetGameState')});
            
            /*Teiste nuppude too lakkab*/
            placeSoldierBtn.onclick = null;
            skipTurnBtn.onclick = null;
            moveButton.onclick = null;
            
            
            confirmAttackBtn = document.getElementById("confirmAttackButton");
            thisPlayerCountries = getPlayerAreas(state,playerNumber);
            
            attackSelects = document.getElementById("attackSelects")
            attackSelects.innerHTML = null;
            var attacker = createDynamicSelect(attackSelects,"moveFrom",thisPlayerCountries,"<b>Attack with: </b>");
            defender = createDynamicSelect(attackSelects,"moveFrom",thisPlayerCountries,"<b>Attack who: </b>");
            diceSelect = createDynamicSelectNumber(attackSelects,"diceAmount",[2,3,4,5],"<b>With armies</b>");
            attacker.onchange = ()=>{
                defender.remove();
                diceSelect.remove();
                labels = document.getElementsByTagName("label")
                labels[labels.length -2].remove();
                labels[labels.length -1].remove();
                trueNeig = getTrueNeighbors(state,attacker.value);
                defender = createDynamicSelect(attackSelects,"moveFrom",trueNeig,"<b>Attack who: </b>");
                d =[]
                s = state.board[attacker.value].soldiers;
                for(let i=2;i<s;i++){
                    d.push(i)
                }
                diceSelect = createDynamicSelectNumber(attackSelects,"diceAmount",d,"<b>With armies</b>");
                confirmAttackBtn.style.background = GAMECOLORS.attackButtonReady;
                if(d.length == 0){
                    handleError("Not enough soldiers to attack");
                    confirmAttackBtn.style.background = 'white'
                }
                if(trueNeig.length == 0){
                    handleError("No neighboring opponent areas")
                    confirmAttackBtn.style.background = 'white'
                }
                
            }
            confirmAttackBtn.onclick = ()=>{
                str = "Attacking " + capitalizeFirstLetter(defender.value) + " with " + capitalizeFirstLetter(attacker.value) + " and " + diceSelect.value + " dice";
                handleError(str);  //funktsiooni saab kasutada ka lihtsalt info n2itamiseks
                socket.emit("startAttack",{
                    attackingCountry:attacker.value.toLowerCase(),
                    defendingCountry:defender.value.toLowerCase(),
                    nrOfDice:diceSelect.value
                });
                
            }
        }
    }
    
    if(state.attack.isHappening== true){
        /*RESET HTML*/
        attackDiceContainer = document.getElementById("attackDiceContainer");
        defenseDiceContainer = document.getElementById("defenseDiceContainer");
        
        attackDiceContainer.innerHTML = null;
        defenseDiceContainer.innerHTML = null;
        attacker = state.attack.attacker;
        nrOfAttackDice = state.attack.dice[attacker-1].length;
        
        defender = state.attack.defender;
        nrOfDefenseDice = state.attack.dice[defender-1].length;
        
        attackerRolls = state.attack.dice[attacker-1];
        defenderRolls = state.attack.dice[defender-1];
        /*LISAB TARINGUD*/
        attackDice = createMultipleDice(attackDiceContainer,'red',nrOfAttackDice,attackerRolls);
        defenseDice = createMultipleDice(defenseDiceContainer,'white',nrOfDefenseDice,defenderRolls)
        /*ATTACH LISTENERS TO DICE*/
        
        if(attacker == playerNumber){
            for(a of attackDice){
                a.addEventListener("click",()=>{
                    socket.emit('diceRoll',{player:playerNumber});
                })
            }
        }
        if(defender == playerNumber){
            for(a of defenseDice){
                a.addEventListener("click",()=>{
                    socket.emit('diceRoll',{player:playerNumber});
                })
            }
        }
        
        
    }

}


function createMultipleDice(root,color,nr,rollsArray){
    dice =[]
    for(i=0;i<nr;i++){
        img = document.createElement("img");
        roll = rollsArray[i];
        if(roll == null){roll=1; img.classList.add("unrolledDice")};
        if(color == 'red'){img.src = './img/redDice/dice-' + roll+ '.png'}
        
        else if(color == 'white'){img.src = './img/whiteDice/dice-' + roll+ '.png' }

        img.id = color + 'dice-' + (i+1);
        img.classList.add("dice");
        
        dice.push(img);
        root.appendChild(img);
        
    }
    return dice;
}
function createDynamicSelect(container, selectID,array,labelText){
    //Renders a dynamic select list based on array, needs container, id for select, text for label
    select = document.createElement("select");
    select.name = selectID;
    select.id = selectID;
    
    for(var val of array){
        let option = document.createElement("option");
        option.value = val;
        text = '';
       
        option.text = capitalizeFirstLetter(val);;
        select.appendChild(option);
    }
    var label = document.createElement("label");
    label.innerHTML = labelText
    label.htmlFor = selectID;
    container.appendChild(label).appendChild(select);
    return select;
}
function createDynamicSelectNumber(container, selectID,array,labelText){
    //Renders a dynamic select list based on array, needs container, id for select, text for label
    select = document.createElement("select");
    select.name = selectID;
    select.id = selectID;
    
    for(var val of array){
        let option = document.createElement("option");
        option.value = val;
        text = '';
       
        option.text = val
        select.appendChild(option);
    }
    var label = document.createElement("label");
    label.innerHTML = labelText
    label.htmlFor = selectID;
    container.appendChild(label).appendChild(select);
    return select;
}
function createTextInput(root,id){
    input = document.createElement("input");
    input.type = 'text';
    input.id = id;
    input.placeholder = id;
    root.append(input);
    return input;
}
function createTextSelect(root,id,options){
    select = document.createElement("select");
    select.id = id;
    for(i=0;i<options.length;i++){
        option=document.createElement("option");
        option.value = options[i];
        option.textContent = capitalizeFirstLetter(options[i]);
        select.append(option);
    }
    return select;
}
function getAttackableNeighbors(){
    naabrid = ['hiiumaa','parnu','laanemaa']
    return naabrid;
}

function pad(num, size) {
    /*teeb nr stringks ja lisab n kohta ala 5 -> '05'*/
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}
function capitalizeFirstLetter(string) {
    if([0,1,2,3,4,5,6,7,8,9].includes(string)){return string}//numbrit ei saa suureks teha
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
function giveSelectOptions(root,array){
     
    for(i=0;i<array.length;i++){
        option = document.createElement("option");
        option.value = array[i];
        option.innerText = capitalizeFirstLetter(array[i]);
        root.append(option);
    }
    
}

function highlightMapArea(name,color){
    if(name == ''){return}
    el = document.getElementById(name);
    el.style.fill  = color;
}
function listElementMouseover(e){
    highlightMapArea(e.target.textContent.toLowerCase(),'black');
}
function allCountriesListElement(root){
    el = document.createElement("div");
    el.classList.add('listElement');
    root.append(el);
    return el;
}

function renderMapState(state){ //
 
    
    for(i=0;i<state.maakonnad.length;i++){
        maakond = state.maakonnad[i];
        omanik = state.board[maakond].owner;
        soduriteArv = state.board[maakond].soldiers;
        let fillColor;
        if(omanik <0){fillColor = 'white'} 
        else{fillColor = playerColors[omanik-1];}
        
        document.getElementById(maakond).style.fill = fillColor;
        document.getElementById(maakond + 'tekst').textContent = pad(soduriteArv,2);
    }
    
  }
function createButton(rootElement,btnId='',btnClass=''){
    /*Loob nupu ja tagastab selle DOM handleri*/
    let btn = document.createElement("button");
    btn.id = btnId;
    if(btnClass !='') btn.classList.add(btnClass);
    rootElement.append(btn);
    return btn;
}
function createInput(rootElement,inputId ='',inputClass = '',type = 'number'){
    let input = document.createElement("input");
    input.type = type
    input.id = inputId
    
    if(inputClass!='' && inputClass != null){input.classList.add(inputClass)};
    rootElement.append(input);
    return input
}
function checkForFreeStates(state){
    let maakonnad = state.maakonnad;
    let vabaMaa = [];
    for(i=0;i<maakonnad.length;i++){
        maaNimi = maakonnad[i];
        maakond = state.board[maaNimi];
        if(maakond.owner == playerNumber || maakond.owner < 0){vabaMaa.push(maaNimi)};
    }
    return vabaMaa;
}
function getPlayerAreas(state,playerNumber){
    playerAreas = []
    maakonnad = state.maakonnad;
    for(i=0;i<maakonnad.length;i++){
        maaNimi = maakonnad[i];
        if(state.board[maaNimi].owner == playerNumber){
            playerAreas.push(maaNimi);
        }
    }
    return playerAreas;
}
function highlightNeighbors(neighborAreas){
    for(i=0;i<neighborAreas.length;i++){
        ala = document.getElementById(neighborAreas[i]);
        ala.style.fill = 'gray'
        ala.style.fillOpacity = 0.55 //naaber
    }
}

function getAttackableNeighbors(state,playerNumber){
    
}
function renderDice(rootElement,elementID){
    var dice = document.createElement("img");
    
    dice.id = elementID;
    dice.classList.add("dice")
    rootElement.append(dice);
    dice.src = './img/dice-1.png'
    return dice;

}
function startAttack(state,attackingState,defendingState){
    attackScreen.style.display = 'block'
    attackingPlayer = state.nicknames[state.board[attackingState].owner -1]
    defendingPlayer = state.nicknames[state.board[defendingState].owner -1]
    
    attackScreen.innerText = 
    attackingPlayer +'('+ attackingState +')' + 'is attacking' + '(' +defendingPlayer +')' + ' '+ defendingState;
    
    dice = [renderDice(attackScreen,"dice-0"),renderDice(attackScreen,"dice-1")]
    
    for(i=0;i<2;i++){
        if(playerNumber-1 == i){
            // makeRollable(dice[i])
        }
    }
    if(state.scores.includes(0)){
        // emitAttack(attackingState,defendingState);
    }
    

}
function makeRollable(dice){
    //makes a dice rollable for particular player*/
    dice.addEventListener("click", () => {
        socket.emit("diceRoll");
        
    })
}
function emitAttack(attacker,defender){
    socket.emit('attack',{attacker:attacker,defender:defender});
    // socket.emit('endTurn');
}
function addGameInfo(text){
    el = document.createElement("p");
    el.innerText = text;
    document.getElementById("info").append(el);
}
function displayGameInfo(state){
    addGameInfo("Turn number: " + state.turn)
    addGameInfo("Playorder: " + state.playOrder);
    addGameInfo(state.sodureid);
}
function displayInfoAboutMove(state){
    let playerWhoRolled;
    if(state.turn > 0){
        for(j=0;j<state.numPlayers;j++){
            if(state.playOrder[j] == state.currentPlayer){
              playerWhoRolled =  j;
            }
          }
        appendToLog(state,state.nicknames[playerWhoRolled] + " rolled a " + state.dice)
    }
    
}
function renderActivePlayer(state,playerNumber){
                    
    let name = document.getElementById("player-name-" + playerNumber) //n2ita et kliendi kord
    name.innerText="Your turn!";
    let container = document.getElementById("name-score-container-" + playerNumber);
    container.classList.remove("active-player");
    name.classList.toggle("your-turn");
    document.title= "YOUR TURN";
    
    
    let endTurnButton = document.createElement("button");
    endTurnButton.innerText = "End or Skip Turn";
    endTurnButton.addEventListener("click", () => {
        console.log("endturnbutton emiited enturn")
        
    });
    buttonContainer.append(endTurnButton);
    }
    