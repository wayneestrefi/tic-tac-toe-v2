(function () {
  'use strict';

  var mode = 'pvp';
  var side = 'X';
  var difficulty = 'easy';
  var cells = ['', '', '', '', '', '', '', '', ''];
  var turn = 'X';
  var players = null;
  var draws = 0;
  var round = 1;
  var over = false;

  function el(id) { return document.getElementById(id); }
  function all(selector) { return document.querySelectorAll(selector); }

  function setupLabels() {
    var other = side === 'X' ? 'O' : 'X';
    el('nameOne').previousElementSibling.innerHTML = 'PLAYER ONE <small>PLAYS ' + side + '</small>';
    el('secondLabel').innerHTML = mode === 'ai' ? 'ARCADE AI <small>PLAYS ' + other + '</small>' : 'PLAYER TWO <small>PLAYS ' + other + '</small>';
  }

  function selectMode(button) {
    mode = button.getAttribute('data-mode');
    var tabs = all('.mode-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i] === button);
    el('aiOptions').classList.toggle('hidden', mode !== 'ai');
    el('nameTwo').disabled = mode === 'ai';
    el('nameTwo').value = mode === 'ai' ? 'ARCADE AI' : '';
    setupLabels();
  }

  function start() {
    var first = (el('nameOne').value.trim() || 'PLAYER ONE').toUpperCase();
    var second = (mode === 'ai' ? 'ARCADE AI' : (el('nameTwo').value.trim() || 'PLAYER TWO')).toUpperCase();
    var humanOne = {name: first, score: 0, human: true};
    var humanTwo = {name: second, score: 0, human: mode === 'pvp'};
    players = side === 'X' ? {X: humanOne, O: humanTwo} : {X: humanTwo, O: humanOne};
    el('setupView').classList.add('hidden');
    el('gameView').classList.remove('hidden');
    newRound();
  }

  function newRound() {
    cells = ['', '', '', '', '', '', '', '', ''];
    turn = 'X';
    over = false;
    el('roundLabel').textContent = 'ROUND ' + ('0' + round).slice(-2);
    render();
    if (mode === 'ai' && !players[turn].human) window.setTimeout(aiMove, 1000);
  }

  function render() {
    var board = el('board');
    board.innerHTML = '';
    for (var i = 0; i < 9; i++) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell ' + (cells[i] ? 'filled mark-' + cells[i].toLowerCase() : 'preview-' + turn.toLowerCase());
      button.setAttribute('aria-label', 'Cell ' + (i + 1));
      (function (index) { button.addEventListener('click', function () { play(index); }); }(i));
      if (cells[i]) {
        var mark = document.createElement('span');
        mark.className = 'mark ' + cells[i].toLowerCase();
        mark.textContent = cells[i] === 'X' ? '×' : '○';
        button.appendChild(mark);
      }
      board.appendChild(button);
    }
    el('nameX').textContent = players.X.name;
    el('nameO').textContent = players.O.name;
    el('scoreX').textContent = players.X.score;
    el('scoreO').textContent = players.O.score;
    el('draws').textContent = draws;
    el('cardX').classList.toggle('active', turn === 'X' && !over);
    el('cardO').classList.toggle('active', turn === 'O' && !over);
    el('turnTitle').innerHTML = over ? 'ROUND COMPLETE' : players[turn].name + "'S TURN <span>· " + turn + '</span>';
    el('statusText').textContent = over ? 'CHOOSE YOUR NEXT MOVE' : (mode === 'ai' && !players[turn].human ? 'AI IS THINKING...' : turn + ' STARTS THE ROUND');
    el('modeChip').textContent = mode === 'ai' ? 'PLAYER VS AI · ' + difficulty.toUpperCase() : 'PLAYER VS PLAYER';
  }

  function winner() {
    var lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (cells[line[0]] && cells[line[0]] === cells[line[1]] && cells[line[0]] === cells[line[2]]) return {player: cells[line[0]], line: line};
    }
    for (var j = 0; j < 9; j++) if (!cells[j]) return null;
    return {draw: true};
  }

  function play(index, automated) {
    if (over || cells[index] || (!automated && mode === 'ai' && !players[turn].human)) return;
    cells[index] = turn;
    var result = winner();
    if (result) finish(result);
    else { turn = turn === 'X' ? 'O' : 'X'; render(); if (mode === 'ai' && !players[turn].human) window.setTimeout(aiMove, 1000); }
  }

  function finish(result) {
    over = true;
    if (result.draw) { draws++; el('resultTitle').textContent = 'DRAW'; el('resultSub').textContent = 'A beautifully fought round'; el('resultSymbol').textContent = '—'; }
    else { players[result.player].score++; el('resultTitle').textContent = players[result.player].name + ' WINS'; el('resultSub').textContent = 'Victory as ' + result.player; el('resultSymbol').textContent = result.player === 'X' ? '×' : '○'; }
    render();
    if (result.line) { el('board').classList.add('has-winner'); for (var i = 0; i < result.line.length; i++) el('board').children[result.line[i]].classList.add('winner'); }
    window.setTimeout(function () { el('resultOverlay').classList.remove('hidden'); }, 300);
  }

  function available() { var result = []; for (var i = 0; i < 9; i++) if (!cells[i]) result.push(i); return result; }
  function canWin(index, mark) { cells[index] = mark; var result = winner(); cells[index] = ''; return result && result.player === mark; }
  function aiMove() {
    if (over) return;
    var open = available();
    if (!open.length) return;
    var pick = open[Math.floor(Math.random() * open.length)];
    if (difficulty === 'easy') {
      var weakSquares = [1, 3, 5, 7].filter(function (i) { return cells[i] === ''; });
      if (weakSquares.length && Math.random() < 0.75) pick = weakSquares[Math.floor(Math.random() * weakSquares.length)];
      play(pick, true);
      return;
    }
    if (difficulty === 'medium' || difficulty === 'hard') {
      for (var i = 0; i < open.length; i++) if (canWin(open[i], turn)) { pick = open[i]; break; }
      var enemy = turn === 'X' ? 'O' : 'X';
      for (var j = 0; j < open.length; j++) if (canWin(open[j], enemy)) { pick = open[j]; break; }
      if (difficulty === 'hard' && !canWin(pick, turn)) pick = strategicMove(turn);
    }
    if (difficulty === 'impossible') pick = minimax(cells.slice(), turn, 0).index;
    play(pick, true);
  }

  function strategicMove(mark) {
    var open = available();
    if (cells[4] === '') return 4;
    var corners = [0, 2, 6, 8].filter(function (i) { return cells[i] === ''; });
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    return open[0];
  }

  function minimax(state, mark, depth) {
    var result = evaluate(state);
    if (result !== null) return {score: result === mark ? 10 - depth : result === 'draw' ? 0 : depth - 10, index: null};
    var open = [];
    for (var i = 0; i < 9; i++) if (!state[i]) open.push(i);
    var best = {score: -Infinity, index: open[0]};
    for (var j = 0; j < open.length; j++) {
      state[open[j]] = mark;
      var score = -minimax(state, mark === 'X' ? 'O' : 'X', depth + 1).score;
      state[open[j]] = '';
      if (score > best.score) best = {score: score, index: open[j]};
    }
    return best;
  }

  function evaluate(state) {
    var lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (state[line[0]] && state[line[0]] === state[line[1]] && state[line[0]] === state[line[2]]) return state[line[0]];
    }
    for (var j = 0; j < 9; j++) if (!state[j]) return null;
    return 'draw';
  }

  function bind() {
    var tabs = all('.mode-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].addEventListener('click', function () { selectMode(this); });
    el('startButton').addEventListener('click', start);
    el('sidePicker').addEventListener('click', function (event) { if (event.target.tagName === 'BUTTON') { side = event.target.getAttribute('data-side'); var buttons = all('#sidePicker button'); for (var i = 0; i < buttons.length; i++) buttons[i].classList.toggle('selected', buttons[i] === event.target); setupLabels(); } });
    el('difficultyPicker').addEventListener('click', function (event) { if (event.target.tagName === 'BUTTON') { difficulty = event.target.getAttribute('data-difficulty'); var buttons = all('#difficultyPicker button'); for (var i = 0; i < buttons.length; i++) buttons[i].classList.toggle('selected', buttons[i] === event.target); } });
    el('restartButton').addEventListener('click', function () { el('resultOverlay').classList.add('hidden'); el('board').classList.remove('has-winner'); newRound(); });
    el('nextButton').addEventListener('click', function () { round++; el('resultOverlay').classList.add('hidden'); el('board').classList.remove('has-winner'); newRound(); });
    el('swapButton').addEventListener('click', function () { var temp = players.X; players.X = players.O; players.O = temp; newRound(); });
    function goHome() { el('gameView').classList.add('hidden'); el('setupView').classList.remove('hidden'); el('resultOverlay').classList.add('hidden'); round = 1; draws = 0; }
    el('newButton').addEventListener('click', goHome); el('resultNew').addEventListener('click', goHome);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
}());
