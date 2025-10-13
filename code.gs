/**
 * Webページを読み込むためのメイン関数
 * @param {Object} e - イベントオブジェクト
 * @returns {HtmlOutput} - HTMLサービスから生成されたHTML出力
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ワードバスケット デジタルゲーム盤')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// カードデッキの定義（合計59枚）
const FULL_DECK = [
  // ひらがなカード (44枚)
  { type: 'hiragana', text: 'あ' }, { type: 'hiragana', text: 'い' }, { type: 'hiragana', text: 'う' }, { type: 'hiragana', text: 'え' }, { type: 'hiragana', text: 'お' },
  { type: 'hiragana', text: 'か' }, { type: 'hiragana', text: 'き' }, { type: 'hiragana', text: 'く' }, { type: 'hiragana', text: 'け' }, { type: 'hiragana', text: 'こ' },
  { type: 'hiragana', text: 'さ' }, { type: 'hiragana', text: 'し' }, { type: 'hiragana', text: 'す' }, { type: 'hiragana', text: 'せ' }, { type: 'hiragana', text: 'そ' },
  { type: 'hiragana', text: 'た' }, { type: 'hiragana', text: 'ち' }, { type: 'hiragana', text: 'つ' }, { type: 'hiragana', text: 'て' }, { type: 'hiragana', text: 'と' },
  { type: 'hiragana', text: 'な' }, { type: 'hiragana', text: 'に' }, { type: 'hiragana', text: 'ぬ' }, { type: 'hiragana', text: 'ね' }, { type: 'hiragana', text: 'の' },
  { type: 'hiragana', text: 'は' }, { type: 'hiragana', text: 'ひ' }, { type: 'hiragana', text: 'ふ' }, { type: 'hiragana', text: 'へ' }, { type: 'hiragana', text: 'ほ' },
  { type: 'hiragana', text: 'ま' }, { type: 'hiragana', text: 'み' }, { type: 'hiragana', text: 'む' }, { type: 'hiragana', text: 'め' }, { type: 'hiragana', text: 'も' },
  { type: 'hiragana', text: 'や' }, { type: 'hiragana', text: 'ゆ' }, { type: 'hiragana', text: 'よ' },
  { type: 'hiragana', text: 'ら' }, { type: 'hiragana', text: 'り' }, { type: 'hiragana', text: 'る' }, { type: 'hiragana', text: 'れ' }, { type: 'hiragana', text: 'ろ' },
  { type: 'hiragana', text: 'わ' },
  // ワイルドラインカード (9枚)
  { type: 'wild-line', text: 'あ行', icon: '→' }, { type: 'wild-line', text: 'か行', icon: '→' }, { type: 'wild-line', text: 'さ行', icon: '→' },
  { type: 'wild-line', text: 'た行', icon: '→' }, { type: 'wild-line', text: 'な行', icon: '→' }, { type: 'wild-line', text: 'は行', icon: '→' },
  { type: 'wild-line', text: 'ま行', icon: '→' }, { type: 'wild-line', text: 'や行', icon: '→' }, { type: 'wild-line', text: 'ら行', icon: '→' },
  // ワイルドナンバーカード (6枚)
  { type: 'wild-number', text: '5文字', icon: '⑤' }, { type: 'wild-number', text: '6文字', icon: '⑥' }, { type: 'wild-number', text: '7文字以上', icon: '⑦+' }
];


/**
 * ゲームの初期設定を行う関数
 * カードをシャッフルし、各プレイヤーに配布し、最初の場札を設定する
 * @param {number} playerCount - プレイヤーの人数
 * @returns {Object} - ゲームの初期状態（各プレイヤーの手札、山札、最初の場札）
 */
function getInitialData(playerCount) {
  // 元のデッキをコピーして、シャッフル用のデッキを作成
  let deck = [...FULL_DECK];

  // デッキをシャッフル（フィッシャー・イェーツのシャッフル）
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // 各プレイヤーの手札を準備
  const playersHands = {};
  for (let i = 1; i <= playerCount; i++) {
    // プレイヤーごとに5枚のカードを山札から引いて手札とする
    playersHands['player' + i] = deck.splice(0, 5);
  }

  // 山札から最初の場札を1枚引く
  const boardCard = deck.shift();

  // フロントエンド（HTML側）に返すデータをまとめる
  return {
    playersHands: playersHands,
    deck: deck,
    boardCard: boardCard
  };
}

/**
 * 山札からカードを1枚引く関数
 * @param {Array} currentDeck - 現在の山札のカード配列
 * @returns {Object|null} - 引いたカードと残りの山札。山札がなければnullを返す
 */
function drawCardFromDeck(currentDeck) {
  if (currentDeck && currentDeck.length > 0) {
    // 山札の先頭から1枚カードを引く
    const drawnCard = currentDeck.shift();
    return {
      drawnCard: drawnCard,
      newDeck: currentDeck
    };
  }
  return null; // 山札が空の場合はnullを返す
}
