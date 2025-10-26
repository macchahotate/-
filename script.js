// ===================================
// アプリケーションロジック (script.js) - 最終版
// ===================================

let players = [];
let currentPlayerIndex = 0;
let gameStarted = false;

// DOM要素の取得
const inputSection = document.getElementById('input-section');
const gameSection = document.getElementById('game-section');
const finalSection = document.getElementById('final-section');
const nameInputsDiv = document.getElementById('name-inputs');
const addNameBtn = document.getElementById('add-name-btn');
const startBtn = document.getElementById('start-btn');
const inputError = document.getElementById('input-error');

const generateBtn = document.getElementById('generate-btn');
const resultDisplay = document.getElementById('result-display');
const playerNameDisplay = document.getElementById('player-name-display');
const randomNumberSpan = document.getElementById('random-number');
const nextBtn = document.getElementById('next-btn');
const checkBtn = document.getElementById('check-btn');

const finalResultsUl = document.getElementById('final-results');
const resetBtn = document.getElementById('reset-btn');

// ===================================
// 補助関数
// ===================================

// ランダムな数 (1〜100) を生成する
function generateRandomNumber() {
    return Math.floor(Math.random() * 100) + 1;
}

// 画面のセクションを切り替える
function switchSection(showSection) {
    inputSection.classList.add('hidden');
    gameSection.classList.add('hidden');
    finalSection.classList.add('hidden');
    
    showSection.classList.remove('hidden');
}

// エラーメッセージを表示/非表示にする
function displayError(message) {
    inputError.textContent = message;
    inputError.classList.toggle('visible', !!message);
}

// ===================================
// 初期化と入力管理
// ===================================

// 名前の入力フィールドを一つ追加する
function addNameInput() {
    const inputCount = nameInputsDiv.children.length;
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `プレイヤー ${inputCount + 1} の名前`;
    input.id = `player-name-${inputCount}`;
    
    inputGroup.appendChild(input);
    nameInputsDiv.appendChild(inputGroup);
    
    // 入力フィールドが追加されたら、スタートボタンの状態をチェック
    input.addEventListener('input', checkStartButton);
    checkStartButton();
}

// スタートボタンの有効/無効をチェックする
function checkStartButton() {
    const inputs = nameInputsDiv.querySelectorAll('input[type="text"]');
    // 入力が2つ以上あり、かつ全て空でない場合に有効にする
    const allValid = inputs.length >= 2 && Array.from(inputs).every(input => input.value.trim() !== '');
    startBtn.disabled = !allValid;
    if (!allValid) {
        displayError('最低2人の名前を入力してください。');
    } else {
        displayError('');
    }
}

// 初期入力フィールドのセットアップ
addNameInput(); // 最初の1人を追加
addNameInput(); // 2人目を追加

// イベントリスナー：名前追加ボタン
addNameBtn.addEventListener('click', addNameInput);

// ===================================
// ゲーム開始処理
// ===================================

startBtn.addEventListener('click', () => {
    // プレイヤーデータを初期化し、現在の入力値を取得
    players = []; 
    const inputs = nameInputsDiv.querySelectorAll('input[type="text"]');
    let hasDuplicate = false;
    const namesSet = new Set();

    inputs.forEach(input => {
        const name = input.value.trim();
        if (name === '') return; 
        
        if (namesSet.has(name)) {
            hasDuplicate = true;
        }
        namesSet.add(name);

        players.push({
            name: name,
            number: null, // まだ数字は生成されていない
            revealed: false // まだ数字は公開されていない
        });
    });

    if (hasDuplicate) {
        displayError('同じ名前のプレイヤーがいます。修正してください。');
        return;
    }
    
    if (players.length < 2) {
        displayError('ゲームを開始するには、最低2人の名前を入力してください。');
        return;
    }
    
    // ゲームセクションに切り替え、最初のプレイヤーを設定
    currentPlayerIndex = 0;
    gameStarted = true;
    checkBtn.classList.add('hidden'); // 答え合わせボタンを隠す
    
    loadCurrentPlayer();
    switchSection(gameSection);
});

// ===================================
// ゲーム進行処理
// ===================================

// 現在のプレイヤーの情報を画面に表示する
function loadCurrentPlayer() {
    const currentPlayer = players[currentPlayerIndex];
    document.getElementById('current-player').textContent = `${currentPlayer.name} の番です`;
    
    // 表示状態をリセット
    randomNumberSpan.textContent = '?';
    resultDisplay.classList.add('hidden');
    generateBtn.classList.remove('hidden');
    nextBtn.classList.add('hidden');
}

// イベントリスナー：数字をランダム生成ボタン
generateBtn.addEventListener('click', () => {
    if (!gameStarted) return;
    
    const currentPlayer = players[currentPlayerIndex];
    
    // 数字を生成し、保存
    const number = generateRandomNumber();
    currentPlayer.number = number;
    currentPlayer.revealed = true; // 数字を公開済みにする

    // 画面に表示
    playerNameDisplay.textContent = `${currentPlayer.name} の数字：`;
    randomNumberSpan.textContent = number;
    
    // ボタンの切り替え
    generateBtn.classList.add('hidden');
    resultDisplay.classList.remove('hidden');

    // 最後のプレイヤーでなければ「次の人へ」、最後のプレイヤーなら「答え合わせ」を表示
    if (currentPlayerIndex < players.length - 1) {
        nextBtn.classList.remove('hidden');
    } else {
        checkBtn.classList.remove('hidden');
    }
});

// イベントリスナー：次の人へボタン
nextBtn.addEventListener('click', () => {
    if (currentPlayerIndex < players.length - 1) {
        currentPlayerIndex++;
        nextBtn.classList.add('hidden');
        loadCurrentPlayer();
    }
});

// ===================================
// 答え合わせ処理 (音声再生と遅延処理、ソートを実装)
// ===================================

// 結果を公開する関数 (リストアイテムがタップされたときに実行)
function revealResult(event) {
    const listItem = event.currentTarget;

    // すでに公開されている場合は何もしない
    if (!listItem.classList.contains('unrevealed')) {
        return;
    }

    const actualNumber = listItem.dataset.number;
    
    // 数字を表示に切り替える要素
    const resultSpan = listItem.querySelector('.final-result');
    resultSpan.textContent = `${listItem.dataset.name}: ${actualNumber}`; // 名前と数字を同時に表示
    
    // 公開済みのクラスを付与し、未公開のクラスを削除
    listItem.classList.remove('unrevealed');
    listItem.classList.add('revealed');
    
    // 伏せ字のスタイルを削除
    resultSpan.classList.remove('hidden-text');
}

// 最終結果セクションの表示準備を行う共通関数
function setupFinalResults() {
    // プレイヤーデータを数字の降順（高い順）にソート (順位表示はしないがソートは維持)
    players.sort((a, b) => b.number - a.number); 

    // 最終結果セクションに切り替え
    switchSection(finalSection);
    
    // ソートされたリストを画面に表示（最初は結果を伏せる）
    finalResultsUl.innerHTML = ''; // リストをクリア
    players.forEach((player) => {
        const listItem = document.createElement('li');
        listItem.classList.add('unrevealed'); // 未公開のクラスを付与
        listItem.dataset.number = player.number; // 結果の数字をデータ属性に保存
        listItem.dataset.name = player.name; // 名前をデータ属性に保存

        // 名前は表示せず、伏せた状態のテキスト「??」のみを表示
        listItem.innerHTML = `
            <span class="final-result hidden-text">??</span>
        `;
        
        // タップイベントを追加し、結果を公開できるようにする
        listItem.addEventListener('click', revealResult);
        
        finalResultsUl.appendChild(listItem);
    });
}


// イベントリスナー：全員の答え合わせボタン
checkBtn.addEventListener('click', () => {
    const kekkaSound = document.getElementById('kekka-sound');

    // 画面を一時的に隠し、音声が鳴り終わるのを待つ
    gameSection.classList.add('hidden'); 
    finalSection.classList.add('hidden'); 

    // 音声再生を開始
    kekkaSound.play()
        .then(() => {
            // 再生が成功したら、3秒後に最終結果のセットアップ関数を実行
            setTimeout(() => {
                setupFinalResults();
            }, 3000); // 3秒遅延
        })
        .catch(error => {
            // 音声ファイルの再生に失敗した場合 (即時表示)
            console.error("音声再生エラー:", error);
            alert("音声ファイルの再生に失敗しました。すぐに結果を表示します。");
            
            // 遅延なしで即座に最終結果のセットアップ関数を実行
            setupFinalResults();
        });
});

// イベントリスナー：リセットボタン
// 名前入力を維持したまま、ゲームを最初からやり直すための修正済みコード
resetBtn.addEventListener('click', () => {
    // プレイヤーのリスト (players) は保持したまま、ゲームの状態を初期化
    
    // プレイヤーごとの数字と公開状態をリセット
    players.forEach(player => {
        player.number = null; 
        player.revealed = false; 
    });

    currentPlayerIndex = 0;
    gameStarted = true; // ゲーム開始済みの状態に戻す
    checkBtn.classList.add('hidden'); 
    
    // ゲーム進行セクションに戻す
    loadCurrentPlayer();
    switchSection(gameSection);
});

// 初期ロード時の状態設定

switchSection(inputSection);
