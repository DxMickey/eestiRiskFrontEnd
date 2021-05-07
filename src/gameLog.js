

function appendToLog(state,text){
    let row = document.createElement("tr");
    let turn = state.turn;
    row.innerHTML = turn +  text + "<br>";
    gameLog.append(row);
}
function clearGameLog(){
    gameLog.textContent = null;
}