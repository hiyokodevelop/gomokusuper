// Supabaseの初期化
const SUPABASE_URL = 'https://jeiitaeuqoxikqyqirgt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplaWl0YWV1cW94aWtxeXFpcmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk1MjIxODMsImV4cCI6MjA0NTA5ODE4M30.RdzoPOcmu53HNSTcCxZbwFvDeZzuNRWsUYKPii-TqPo';
const supabase = aaa.createClient(SUPABASE_URL, SUPABASE_KEY);

// ゲームボードの初期設定
const BOARD_SIZE = 15;
const boardElement = document.getElementById("board");

// プレイヤー情報の設定（IDと色）
const playerId = Math.floor(Math.random() * 6) + 1;
const playerColors = ['red', 'blue', 'green', 'purple', 'orange', 'brown'];
const playerColor = playerColors[playerId - 1];

// ボードの生成
for (let y = 0; y < BOARD_SIZE; y++) {
  for (let x = 0; x < BOARD_SIZE; x++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.x = x;
    cell.dataset.y = y;
    cell.addEventListener("click", () => placePiece(x, y));
    boardElement.appendChild(cell);
  }
}

// 盤の状態を取得して描画
async function loadBoard() {
  const { data, error } = await supabase.from('gomoku_board').select('*');
  if (error) console.error(error);
  else renderBoard(data);
}

// 盤面を描画
function renderBoard(data) {
  data.forEach(cell => {
    const cellElement = document.querySelector(`.cell[data-x="${cell.x}"][data-y="${cell.y}"]`);
    if (cellElement) {
      cellElement.style.backgroundColor = playerColors[cell.player_id - 1];
    }
  });
}

// 石を置く処理
async function placePiece(x, y) {
  const { data, error } = await supabase.from('gomoku_board').insert([{ x, y, player_id: playerId }]);
  if (error) console.error(error);
}

// リアルタイムの更新を監視
supabase
  .from('gomoku_board')
  .on('INSERT', payload => {
    renderBoard([payload.new]);
  })
  .subscribe();

// 初期ロード
loadBoard();
