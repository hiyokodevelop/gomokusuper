// Supabaseの初期化
const { createClient } = supabase
const SUPABASE_URL = 'https://jeiitaeuqoxikqyqirgt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplaWl0YWV1cW94aWtxeXFpcmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk1MjIxODMsImV4cCI6MjA0NTA5ODE4M30.RdzoPOcmu53HNSTcCxZbwFvDeZzuNRWsUYKPii-TqPo';
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BOARD_SIZE = 8;
const WIN_CONDITION = 5; // 5つ揃ったら勝利
const boardElement = document.getElementById("board");
const colorSelectionElement = document.getElementById("color-selection");
const playerInfoElement = document.getElementById("player-info");

const playerColors = ['red', 'blue', 'green', 'purple', 'orange', 'brown'];
let playerId = Math.floor(Math.random() * 6) + 1;
let playerColor = null;

// プレイヤーの色選択UI生成
playerColors.forEach(color => {
  const colorOption = document.createElement("div");
  colorOption.classList.add("color-option");
  colorOption.style.backgroundColor = color;
  colorOption.addEventListener("click", () => selectColor(color));
  colorSelectionElement.appendChild(colorOption);
});

// 色を選択する処理
function selectColor(color) {
  playerColor = color;
  playerId = playerColors.indexOf(color) + 1;
  colorSelectionElement.style.display = "none";
  updatePlayerInfo();
  loadBoard();  // ボードの初期ロード
}

// プレイヤー情報の表示更新
function updatePlayerInfo() {
  playerInfoElement.innerHTML = `あなたの色: <span style="color:${playerColor}">${playerColor}</span>`;
}

// ボードの生成
for (let y = 0; y < BOARD_SIZE; y++) {
  for (let x = 0; x < BOARD_SIZE; x++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.x = x;
    cell.dataset.y = y;
    cell.addEventListener("click", () => placePiece(x, y, cell));
    boardElement.appendChild(cell);
  }
}

// 盤の状態を取得して描画
async function loadBoard() {
  const { data, error } = await _supabase.from('gomoku_board').select('*');
  if (error) console.error(error);
  else renderBoard(data);
}

// 勝利条件をチェックする関数
async function checkWin(x, y) {
    const { data, error } = await _supabase.from('gomoku_board').select('*');
    if (error) {
      console.error(error);
      return;
    }

    const board = Array.from(Array(BOARD_SIZE), () => Array(BOARD_SIZE).fill(null));
    data.forEach(cell => {
      board[cell.y][cell.x] = cell.player_id;
    });

    // 縦、横、斜めの方向をチェック
    if (checkDirection(board, x, y, 1, 0) ||  // 横
        checkDirection(board, x, y, 0, 1) ||  // 縦
        checkDirection(board, x, y, 1, 1) ||  // 右下がりの斜め
        checkDirection(board, x, y, 1, -1)) { // 左下がりの斜め
      alert(`${playerColor}の勝利です！`);
    }
 }

// 特定の方向に連続して石があるかチェックする関数
function checkDirection(board, x, y, dx, dy) {
    let count = 1;
    for (let i = 1; i < WIN_CONDITION; i++) {
      const nx = x + i * dx;
      const ny = y + i * dy;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === playerId) {
        count++;
      } else {
        break;
      }
    }
    for (let i = 1; i < WIN_CONDITION; i++) {
      const nx = x - i * dx;
      const ny = y - i * dy;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === playerId) {
        count++;
      } else {
        break;
      }
    }
    return count >= WIN_CONDITION;
  }

  // 盤面を描画
  function renderBoard(data) {
    // ボードデータを配列化
    const board = Array.from(Array(BOARD_SIZE), () => Array(BOARD_SIZE).fill(null));
    data.forEach(cell => {
      const cellElement = document.querySelector(`.cell[data-x="${cell.x}"][data-y="${cell.y}"]`);
      if (cellElement) {
        cellElement.style.backgroundColor = playerColors[cell.player_id - 1];
        cellElement.classList.remove("loading");  // くるくるを解除
      }
      board[cell.y][cell.x] = cell.player_id;
    });

    // 更新後のボードで勝利判定
    data.forEach(cell => {
      if (checkWin(board, cell.x, cell.y)) {
        alert(`${playerColors[cell.player_id - 1]}の勝利です！`);
      }
    });
  }

// 石を置く処理
async function placePiece(x, y, cell) {
  if (!playerColor) {
    alert("プレイヤーカラーを選択してください。");
    return;
  }
  cell.classList.add("loading");  // くるくるを追加
  const { data, error } = await _supabase.from('gomoku_board').insert([{ x, y, player_id: playerId }]);
  if (error) console.error(error);
  cell.classList.remove("loading");  // エラー時はくるくるを解除
}

// リアルタイムの更新を監視
const channel = _supabase
    .channel('public:gomoku_board')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gomoku_board' }, payload => {
    renderBoard([payload.new]);
    })
    .subscribe();