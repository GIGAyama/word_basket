import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  RotateCcw, 
  Star, 
  BookOpen, 
  Smile, 
  Trophy, 
  PlusCircle, 
  X, 
  Info,
  Timer,
  TimerOff,
  HelpCircle
} from 'lucide-react';

// ==========================================
// 0. Audio Engine (Web Audio API)
// ==========================================
let audioCtx = null;
let isSoundEnabled = true; // ゴブレット基準のグローバル音声フラグ

const initAudio = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playSound = (type) => {
  if (!audioCtx || !isSoundEnabled) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'select') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'play') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'draw') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'timeout') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.4);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'win') {
      const notes = [400, 500, 600, 800];
      notes.forEach((freq, i) => {
        const oscW = audioCtx.createOscillator();
        const gainW = audioCtx.createGain();
        oscW.connect(gainW);
        gainW.connect(audioCtx.destination);
        oscW.type = 'sine';
        oscW.frequency.setValueAtTime(freq, now + i * 0.1);
        gainW.gain.setValueAtTime(0.1, now + i * 0.1);
        gainW.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
        oscW.start(now + i * 0.1);
        oscW.stop(now + i * 0.1 + 0.2);
      });
    }
  } catch(e) {
    console.error("Audio playback failed", e);
  }
};

// ==========================================
// 1. Data Definitions
// ==========================================
const FULL_DECK_DEF = [
  ...['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ',
      'た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ',
      'ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ']
      .map(t => ({ type: 'hiragana', text: t })),
  ...['あ行','か行','さ行','た行','な行','は行','ま行','や行','ら行']
      .map(t => ({ type: 'wild-line', text: t, icon: '→' })),
  { type: 'wild-number', text: '5文字', icon: '⑤' },
  { type: 'wild-number', text: '6文字', icon: '⑥' },
  { type: 'wild-number', text: '7文字以上', icon: '⑦+' },
  { type: 'wild-number', text: '5文字', icon: '⑤' },
  { type: 'wild-number', text: '6文字', icon: '⑥' },
  { type: 'wild-number', text: '7文字以上', icon: '⑦+' }
];

// ==========================================
// 2. Sub Components
// ==========================================

const Card = ({ card, isBoard, isSelected, onClick, onSwipe }) => {
  const baseStyle = "flex flex-col justify-center items-center rounded-xl cursor-pointer select-none transition-all duration-200 relative bg-white";
  
  const sizeStyle = isBoard 
    ? "w-24 h-36 md:w-32 md:h-44 border-4 shadow-md text-5xl md:text-6xl" 
    : `w-[56px] h-[80px] md:w-[76px] md:h-[108px] border-2 text-2xl md:text-4xl ${
        isSelected 
          ? 'shadow-[0_0_0_4px_rgba(59,130,246,0.5)] -translate-y-6 md:-translate-y-8 z-30 ring-4 ring-blue-400 border-blue-400' 
          : 'shadow-sm hover:-translate-y-2 hover:shadow-lg'
      }`; 
  
  let typeStyle = "";
  if (card.type === 'hiragana') typeStyle = "border-gray-200 text-gray-800";
  if (card.type === 'wild-line') typeStyle = "bg-[#80d8ff] border-[#4fc3f7] text-white drop-shadow-md";
  if (card.type === 'wild-number') typeStyle = "bg-[#ffff8d] border-[#fff176] text-amber-900";

  const handleTouchStart = (e) => {
    if (isBoard) return;
    const touch = e.touches[0];
    e.currentTarget.dataset.startX = touch.clientX;
    e.currentTarget.dataset.startY = touch.clientY;
    e.currentTarget.dataset.swiped = 'false';
  };

  const handleTouchMove = (e) => {
    if (isBoard) return;
    const touch = e.touches[0];
    const startX = parseFloat(e.currentTarget.dataset.startX);
    const startY = parseFloat(e.currentTarget.dataset.startY);
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    
    if (Math.sqrt(dx*dx + dy*dy) > 30) {
      e.currentTarget.dataset.swiped = 'true';
    }
  };

  const handleTouchEnd = (e) => {
    if (isBoard) return;
    if (e.currentTarget.dataset.swiped === 'true') {
      if (onSwipe) onSwipe();
      if (e.cancelable) e.preventDefault();
    } else {
      if (onClick) onClick();
    }
  };

  const handleClick = (e) => {
    if (isBoard) return;
    if (e.currentTarget.dataset.swiped !== 'true') {
      if (onClick) onClick();
    }
  };

  return (
    <div 
      className={`${baseStyle} ${sizeStyle} ${typeStyle}`} 
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
       <div className={`font-black leading-none`}>
         {card.text}
       </div>
       {card.icon && (
         <div className={`absolute font-bold opacity-80 ${isBoard ? 'text-xl bottom-2 right-2' : 'text-xs bottom-1 right-1'}`}>
           {card.icon}
         </div>
       )}
       {!isBoard && isSelected && (
         <div className="absolute -top-4 md:-top-5 bg-blue-600 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap animate-bounce z-40 pointer-events-none">
           もう1回タップで出す！
         </div>
       )}
    </div>
  );
};

const PlayerSlot = ({ position, rotate, children }) => {
  let posClasses = "";
  if (position === 'bottom') posClasses = "bottom-0 left-1/2 -translate-x-1/2";
  if (position === 'top') posClasses = "top-0 left-1/2 -translate-x-1/2";
  if (position === 'left') posClasses = "left-0 top-1/2 -translate-y-1/2";
  if (position === 'right') posClasses = "right-0 top-1/2 -translate-y-1/2";
  if (position === 'bottom-left') posClasses = "bottom-0 left-[2%]"; 
  if (position === 'bottom-right') posClasses = "bottom-0 right-[2%]";
  if (position === 'top-left') posClasses = "top-0 left-[2%]";
  if (position === 'top-right') posClasses = "top-0 right-[2%]";

  let rotateClass = "";
  if (rotate === 0) rotateClass = "rotate-0";
  if (rotate === 90) rotateClass = "rotate-90";
  if (rotate === 180) rotateClass = "rotate-180";
  if (rotate === -90) rotateClass = "-rotate-90";

  return (
    <div className={`absolute ${posClasses} w-[340px] h-[340px] md:w-[480px] md:h-[480px] flex justify-center items-end pb-2 md:pb-4 ${rotateClass} z-20 pointer-events-none`}>
       <div className="pointer-events-auto w-[320px] md:w-[460px]">
         {children}
       </div>
    </div>
  );
};

const getPlayerSlot = (playerIndex, totalPlayers) => {
  if (totalPlayers === 2) return [{ position: 'bottom', rotate: 0 }, { position: 'top', rotate: 180 }][playerIndex];
  if (totalPlayers === 3) return [{ position: 'bottom', rotate: 0 }, { position: 'left', rotate: 90 }, { position: 'right', rotate: -90 }][playerIndex];
  if (totalPlayers === 4) return [{ position: 'bottom', rotate: 0 }, { position: 'left', rotate: 90 }, { position: 'top', rotate: 180 }, { position: 'right', rotate: -90 }][playerIndex];
  if (totalPlayers === 5) return [{ position: 'bottom', rotate: 0 }, { position: 'left', rotate: 90 }, { position: 'top-left', rotate: 180 }, { position: 'top-right', rotate: 180 }, { position: 'right', rotate: -90 }][playerIndex];
  if (totalPlayers === 6) return [{ position: 'bottom-right', rotate: 0 }, { position: 'bottom-left', rotate: 0 }, { position: 'left', rotate: 90 }, { position: 'top-left', rotate: 180 }, { position: 'top-right', rotate: 180 }, { position: 'right', rotate: -90 }][playerIndex];
};

// ==========================================
// 3. Main Application
// ==========================================
export default function App() {
  const [gameState, setGameState] = useState('setup'); 
  const [playerCount, setPlayerCount] = useState(4); 
  const [timerSetting, setTimerSetting] = useState(15); 
  
  const [deck, setDeck] = useState([]);
  const [boardCard, setBoardCard] = useState(null);
  const [playersHands, setPlayersHands] = useState({});
  const [selectedCards, setSelectedCards] = useState({}); 
  
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [soundEnabledState, setSoundEnabledState] = useState(true);

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const getResetTime = () => timerSetting > 0 ? timerSetting : 15;

  useEffect(() => {
    if (!isTimerActive || gameState !== 'playing' || timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [isTimerActive, gameState, timeLeft]);

  useEffect(() => {
    if (isTimerActive && gameState === 'playing' && timeLeft === 0) {
      playSound('timeout');
      if (deck.length > 0) {
        const newDeck = [...deck];
        const newCard = newDeck.shift();
        setBoardCard(newCard);
        setDeck(newDeck);
        showToast('時間切れ！自動的に場札が変わりました');
      } else {
        showToast('時間切れ！(でも山札がありません)');
      }
      setTimeLeft(getResetTime());
      setSelectedCards({});
    }
  }, [timeLeft, isTimerActive, gameState, deck, timerSetting]);

  const toggleSound = () => {
    const nextState = !soundEnabledState;
    setSoundEnabledState(nextState);
    isSoundEnabled = nextState;
    if (nextState) {
      initAudio();
      playSound('select');
    }
  };

  const startGame = () => {
    initAudio();
    let newDeck = JSON.parse(JSON.stringify(FULL_DECK_DEF));
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    const hands = {};
    for (let i = 1; i <= playerCount; i++) {
      hands[`player${i}`] = newDeck.splice(0, 5);
    }
    const firstCard = newDeck.shift();
    
    setDeck(newDeck);
    setPlayersHands(hands);
    setBoardCard(firstCard);
    
    setSelectedCards({});
    if (timerSetting > 0) {
      setIsTimerActive(true);
      setTimeLeft(timerSetting);
    } else {
      setIsTimerActive(false);
    }
    setGameState('playing');
    playSound('select');
  };

  const resetGame = () => {
    initAudio();
    setShowConfirmReset(false);
    setGameState('setup');
    setIsTimerActive(false);
  };

  const handleDrawForBoard = () => {
    initAudio();
    if (deck.length === 0) {
      showToast('山札がもうありません');
      return;
    }
    const newDeck = [...deck];
    const newCard = newDeck.shift();
    setBoardCard(newCard);
    setDeck(newDeck);
    
    showToast('パスしました（場札更新）');
    playSound('draw');
    if (isTimerActive) setTimeLeft(getResetTime());
    setSelectedCards({});
  };

  const handleDrawToHand = (pid) => {
    initAudio();
    if (deck.length === 0) {
      showToast('山札がもうありません');
      return;
    }
    const newDeck = [...deck];
    const card = newDeck.shift();
    
    setPlayersHands(prev => ({
      ...prev,
      [pid]: [...prev[pid], card]
    }));
    setDeck(newDeck);
    playSound('draw');
  };

  const handleCardClick = (pid, cardIndex) => {
    initAudio();
    if (selectedCards[pid] === cardIndex) {
      handlePlayCard(pid, cardIndex);
    } else {
      setSelectedCards(prev => ({ ...prev, [pid]: cardIndex }));
      playSound('select');
    }
  };

  const handlePlayCard = (pid, cardIndex) => {
    const hand = playersHands[pid];
    if (!hand || !hand[cardIndex]) return; 
    
    const card = hand[cardIndex];
    setBoardCard(card);
    
    const newHand = [...hand];
    newHand.splice(cardIndex, 1);
    
    setPlayersHands(prev => ({
      ...prev,
      [pid]: newHand
    }));

    if (newHand.length === 0) {
      playSound('win');
    } else {
      playSound('play');
    }

    if (isTimerActive) setTimeLeft(getResetTime());
    
    setSelectedCards(prev => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
  };

  const handleToggleTimer = () => {
    initAudio();
    const nextActive = !isTimerActive;
    setIsTimerActive(nextActive);
    if (nextActive) setTimeLeft(getResetTime());
    playSound('select');
  };

  // --- Styles ---
  const bgStyle = {
    backgroundColor: '#fff9c4',
    backgroundImage: 'radial-gradient(#ffe082 20%, transparent 20%), radial-gradient(#ffe082 20%, transparent 20%)',
    backgroundPosition: '0 0, 25px 25px',
    backgroundSize: '50px 50px',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap');
        * { font-family: 'Zen Maru Gothic', sans-serif; }
        ruby { ruby-align: center; ruby-position: over; }
        rt { font-size: 0.65em; color: #8d6e63; font-weight: 500; line-height: 1.2; }
        .pop-btn { transition: transform 0.1s, box-shadow 0.1s; border: none; letter-spacing: 0.05em; }
        .pop-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 15px rgba(0,0,0,0.15) !important; }
        .pop-btn:active { transform: scale(0.92) !important; box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important; }
        html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; touch-action: manipulation; }
      `}</style>

      {/* アプリ全体のコンテナ (全画面固定・フレックス) */}
      <div className="fixed inset-0 flex flex-col select-none touch-none" style={bgStyle}>

        {/* ==========================================
            固定ヘッダー (ゴブレット完全再現デザイン)
            ========================================== */}
        <header className="bg-white/90 backdrop-blur-[5px] border-b-[3px] border-[#ffca28] shadow-[0_4px_6px_rgba(0,0,0,0.05)] shrink-0 z-50 flex justify-between items-center py-2 px-3 w-full">
          <div className="flex items-center">
            {/* ゴブレットの白抜きドロップシャドウのタイトルを再現 */}
            <h1 className="font-black text-[#1a73e8] text-[1.1rem] md:text-[1.3rem] m-0 drop-shadow-[2px_2px_0px_#fff] leading-none flex items-center">
              みんなでしりとり！ <span className="text-yellow-500 hidden sm:inline text-sm md:text-base ml-1">わーどばすけっと</span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* ゴブレットのサウンドボタンを再現 */}
            <button 
              onClick={toggleSound} 
              className="bg-[#f8f9fa] text-[#1a73e8] font-bold text-[0.75rem] py-1 px-3 rounded-full shadow-sm border-0 active:scale-95 transition-transform"
            >
              {soundEnabledState ? '🔊 ON' : '🔇 OFF'}
            </button>
            {/* ゴブレットのルールボタンを再現 */}
            <button 
              onClick={() => { initAudio(); setShowRuleModal(true); playSound('select'); }}
              className="pop-btn bg-[#ffca28] text-white font-bold rounded-full w-[38px] h-[38px] flex items-center justify-center shadow-sm text-[1.2rem] p-0"
            >
              ？
            </button>
          </div>
        </header>

        {/* ==========================================
            メインエリア (残りの空間を埋める)
            ========================================== */}
        <main className="flex-1 relative w-full overflow-hidden">
          
          {/* SETUP SCREEN */}
          {gameState === 'setup' && (
            <div className="absolute inset-0 overflow-y-auto overflow-x-hidden flex flex-col items-center pt-6 px-4 pb-12 pointer-events-auto touch-pan-y">
              <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-xl p-6 md:p-12 text-center border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="font-black mb-6 md:mb-8 text-blue-600 text-3xl md:text-4xl">
                  <ruby>遊<rt>あそ</rt></ruby>ぶ<ruby>準<rt>じゅん</rt>備<rt>び</rt></ruby>
                </h2>
                
                {/* 人数設定 */}
                <div className="mb-6">
                  <label className="block text-lg md:text-xl font-bold text-gray-500 mb-3">
                    <span className="bg-yellow-400 text-white text-sm px-3 py-1 rounded-full mr-2 align-middle">STEP 1</span>
                    <ruby>何<rt>なん</rt>人<rt>にん</rt></ruby>で<ruby>囲<rt>かこ</rt></ruby>みますか？
                  </label>
                  <div className="relative">
                    <select 
                      value={playerCount}
                      onChange={(e) => { initAudio(); setPlayerCount(Number(e.target.value)); }}
                      className="w-full text-center rounded-full border-4 border-yellow-400 bg-gray-50 font-bold text-blue-600 py-3 md:py-4 text-2xl md:text-3xl appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-yellow-200"
                    >
                      {[2,3,4,5,6].map(num => (
                        <option key={num} value={num}>{num}人</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center px-2 text-yellow-500">
                      <svg className="fill-current h-8 w-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* タイマー設定 */}
                <div className="mb-8 md:mb-10">
                  <label className="block text-lg md:text-xl font-bold text-gray-500 mb-3">
                    <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full mr-2 align-middle">STEP 2</span>
                    <ruby>制<rt>せい</rt>限<rt>げん</rt></ruby><ruby>時<rt>じ</rt>間<rt>かん</rt></ruby>
                  </label>
                  <div className="relative">
                    <select 
                      value={timerSetting}
                      onChange={(e) => { initAudio(); setTimerSetting(Number(e.target.value)); }}
                      className="w-full text-center rounded-full border-4 border-blue-400 bg-gray-50 font-bold text-blue-600 py-3 md:py-4 text-2xl md:text-3xl appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-blue-200"
                    >
                      <option value={0}>なし（無制限）</option>
                      <option value={10}>10秒（激ムズ）</option>
                      <option value={15}>15秒</option>
                      <option value={20}>20秒</option>
                      <option value={30}>30秒（ゆっくり）</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center px-2 text-blue-500">
                      <Timer className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="pop-btn w-full bg-blue-600 hover:bg-blue-700 text-white py-4 md:py-5 rounded-full shadow-lg text-2xl font-bold flex items-center justify-center border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all"
                >
                  <PlayCircle className="w-8 h-8 mr-3" />ゲームスタート！
                </button>
              </div>
            </div>
          )}

          {/* PLAYING SCREEN */}
          {gameState === 'playing' && (
            <div className="absolute inset-0 pointer-events-auto touch-none" onClick={() => initAudio()}>
              
              {/* Central Board Area */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-6 md:p-8 bg-white/50 backdrop-blur-xl rounded-[3rem] shadow-[0_0_60px_rgba(255,255,255,0.9)] border-4 border-white z-10 min-w-[320px] md:min-w-[420px]">
                
                <div className="flex gap-4 md:gap-8 items-start justify-center w-full">
                  {/* Deck / Pass Button */}
                  <div 
                    onClick={handleDrawForBoard}
                    className={`relative w-24 h-36 md:w-32 md:h-44 rounded-2xl flex flex-col items-center justify-center border-4 shadow-md transition-all duration-200 active:scale-95 select-none shrink-0 ${deck.length > 0 ? 'bg-blue-50 border-blue-300 cursor-pointer hover:-translate-y-2 hover:shadow-lg hover:border-blue-400' : 'bg-gray-100 border-gray-300 cursor-not-allowed'}`}
                  >
                    <BookOpen className={`w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2 ${deck.length > 0 ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span className={`font-black text-lg md:text-xl ${deck.length > 0 ? 'text-blue-500' : 'text-gray-400'}`}>山札</span>
                    <span className={`font-black text-3xl md:text-4xl ${deck.length > 0 ? 'text-blue-600' : 'text-gray-500'}`}>{deck.length}</span>
                    {deck.length > 0 && (
                       <div className="absolute -bottom-3 md:-bottom-4 bg-yellow-400 text-yellow-900 text-[10px] md:text-xs font-bold px-3 py-1 md:px-4 md:py-1.5 rounded-full shadow-md whitespace-nowrap">
                         パス / 場に出す
                       </div>
                    )}
                  </div>

                  {/* Board Card & Timer Container */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="relative">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap z-10 flex items-center">
                        <Star className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
                        今のお題
                      </div>
                      {boardCard ? <Card card={boardCard} isBoard={true} /> : <div className="w-24 h-36 md:w-32 md:h-44 border-4 border-dashed border-gray-300 rounded-2xl" />}
                    </div>
                    
                    {/* Timer Display */}
                    <div className="h-10 md:h-12 mt-3 md:mt-4 flex items-center justify-center w-full">
                      {isTimerActive && (
                        <div className={`px-4 py-1.5 md:py-2 rounded-full font-black text-sm md:text-base shadow-lg border-2 whitespace-nowrap transition-colors ${
                          timeLeft <= 3 ? 'bg-red-500 text-white border-white animate-pulse' : 'bg-gray-800 text-yellow-400 border-gray-900'
                        }`}>
                           ⏳ あと {timeLeft}秒
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Central Controls */}
                <div className="flex gap-4 mt-2">
                  <button 
                    onClick={handleToggleTimer} 
                    className={`p-3 rounded-full shadow hover:scale-110 transition-colors active:scale-95 ${isTimerActive ? 'bg-yellow-400 text-white border-2 border-white' : 'bg-white/90 hover:bg-white text-gray-500'}`}
                    title="自動パスタイマー (ON/OFF)"
                  >
                    {isTimerActive ? <Timer className="w-6 h-6" /> : <TimerOff className="w-6 h-6" />}
                  </button>
                  <button 
                    onClick={() => { initAudio(); setShowConfirmReset(true); playSound('select'); }} 
                    className="bg-white/90 p-3 rounded-full shadow hover:bg-white text-red-500 hover:scale-110 transition-transform active:scale-95"
                    title="最初に戻る"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Player Areas */}
              {Object.keys(playersHands).map((pid, idx) => {
                const hand = playersHands[pid];
                const playerNum = idx + 1;
                const hasWon = hand.length === 0;
                const slotInfo = getPlayerSlot(idx, playerCount);

                return (
                  <PlayerSlot key={pid} position={slotInfo.position} rotate={slotInfo.rotate}>
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border-2 border-gray-100 flex flex-col items-center w-full">
                      
                      {/* Player Header */}
                      <div className="flex justify-between items-center w-full mb-3">
                         <span className="font-bold text-blue-600 flex items-center text-sm md:text-base">
                           <Smile className="w-4 h-4 md:w-5 md:h-5 mr-1 text-yellow-500 fill-current"/>
                           プレイヤー{playerNum}
                         </span>
                         <span className="bg-gray-100 border px-2 py-0.5 rounded-full text-xs md:text-sm font-bold text-gray-700">
                           残り {hand.length}枚
                         </span>
                      </div>
                      
                      {/* Hand Area */}
                      <div className="flex justify-center items-center h-[90px] md:h-[120px] w-full mb-3 md:mb-4">
                         {hasWon ? (
                           <div className="text-red-500 font-black text-2xl flex flex-col items-center animate-bounce">
                             <Trophy className="w-10 h-10 mb-1 text-yellow-400 fill-current" />
                             あがり！
                           </div>
                         ) : (
                           <div className="flex gap-1.5 md:gap-2 justify-center w-full px-1">
                             {hand.map((card, cardIdx) => {
                               const isSelected = selectedCards[pid] === cardIdx;
                               return (
                                 <div key={cardIdx} className="relative transition-transform duration-200 active:scale-95 cursor-pointer">
                                   <Card 
                                     card={card} 
                                     isBoard={false} 
                                     isSelected={isSelected}
                                     onClick={() => handleCardClick(pid, cardIdx)} 
                                     onSwipe={() => {
                                       initAudio();
                                       handlePlayCard(pid, cardIdx);
                                     }}
                                   />
                                 </div>
                               );
                             })}
                           </div>
                         )}
                      </div>
                      
                      {/* Draw Button */}
                      <button 
                        onClick={() => handleDrawToHand(pid)}
                        disabled={deck.length === 0 || hasWon}
                        className="w-full bg-blue-600 text-white text-sm md:text-base py-2.5 md:py-3 rounded-full font-bold shadow-sm hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 transition-all flex justify-center items-center"
                      >
                        <PlusCircle className="w-4 h-4 md:w-5 md:h-5 mr-1" />山札から引く
                      </button>
                      
                    </div>
                  </PlayerSlot>
                );
              })}
            </div>
          )}
        </main>

        {/* ==========================================
            固定フッター (ゴブレット完全再現デザイン)
            ========================================== */}
        <footer className="bg-white/90 shrink-0 z-50 text-center text-gray-500 py-2 border-t border-gray-200 w-full pointer-events-auto">
          <small className="text-[0.7rem]">
            © 2026 みんなでしりとり！ <a href="https://note.com/cute_borage86" target="_blank" rel="noopener noreferrer" className="no-underline text-gray-500 hover:text-gray-800">GIGA山</a>
          </small>
        </footer>

        {/* ==========================================
            Modals & Toasts
            ========================================== */}
        {showRuleModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#fff9c4] w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="bg-yellow-400 text-white p-4 relative flex justify-center items-center shrink-0">
                 <h3 className="text-2xl font-black flex items-center m-0">
                   <BookOpen className="w-6 h-6 mr-2" />あそびかた
                 </h3>
                 <button 
                   onClick={() => { setShowRuleModal(false); playSound('select'); }}
                   className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors border-0"
                 >
                   <X className="w-6 h-6" />
                 </button>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 border-4 border-yellow-400 text-center shadow-sm">
                    <div className="text-6xl mb-4">🍎</div>
                    <h4 className="font-black text-blue-600 mb-4 text-2xl">しりとりしよう！</h4>
                    <p className="text-lg text-gray-600 font-bold leading-loose mb-6">
                      「<ruby>場<rt>ば</rt></ruby>のカード」の<ruby>文<rt>も</rt>字<rt>じ</rt></ruby>から<ruby>始<rt>はじ</rt></ruby>まって<br/>
                      <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">「<ruby>手<rt>て</rt>札<rt>ふだ</rt></ruby>のカード」</span>の<ruby>文<rt>も</rt>字<rt>じ</rt></ruby>で<ruby>終<rt>お</rt></ruby>わる<br/>
                      <span className="text-red-500 bg-yellow-100 px-2 py-1 rounded">3<ruby>文<rt>も</rt>字<rt>じ</rt></ruby><ruby>以<rt>い</rt>上<rt>じょう</rt></ruby></span>の<ruby>言<rt>こと</rt>葉<rt>ば</rt></ruby>を<br/>
                      <ruby>言<rt>い</rt></ruby>ってカードを<ruby>出<rt>だ</rt></ruby>そう！
                    </p>
                    <div className="bg-gray-50 rounded-2xl p-4 text-left text-gray-600 font-bold border">
                      <div className="mb-3 flex items-center"><span className="bg-green-500 text-white text-sm px-2 py-1 rounded mr-3 shrink-0">OK</span>りんご (<ruby>場<rt>ば</rt></ruby>:り → <ruby>手<rt>て</rt></ruby>:こ)</div>
                      <div className="flex items-center"><span className="bg-gray-400 text-white text-sm px-2 py-1 rounded mr-3 shrink-0">NG</span>リス (2<ruby>文<rt>も</rt>字<rt>じ</rt></ruby>)</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border-4 border-cyan-400 text-center shadow-sm">
                    <div className="text-6xl mb-4">🃏</div>
                    <h4 className="font-black text-cyan-500 mb-4 text-2xl"><ruby>特<rt>とく</rt>別<rt>べつ</rt></ruby>なカード</h4>
                    <ul className="text-left inline-block font-bold text-gray-600 text-lg">
                      <li className="mb-4 flex items-center"><span className="bg-cyan-400 text-white px-3 py-1 rounded mr-3 shrink-0">あ行</span>あ,い,う,え,お OK！</li>
                      <li className="mb-4 flex items-center"><span className="bg-yellow-200 text-amber-900 border border-yellow-400 px-3 py-1 rounded mr-3 shrink-0">⑤</span>5<ruby>文<rt>も</rt>字<rt>じ</rt></ruby>ぴったりの<ruby>言<rt>こと</rt>葉<rt>ば</rt></ruby></li>
                      <li className="flex items-center"><span className="bg-yellow-200 text-amber-900 border border-yellow-400 px-3 py-1 rounded mr-3 shrink-0">⑦+</span>7<ruby>文<rt>も</rt>字<rt>じ</rt></ruby><ruby>以<rt>い</rt>上<rt>じょう</rt></ruby>の<ruby>言<rt>こと</rt>葉<rt>ば</rt></ruby></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="p-6 pt-0 flex justify-center bg-[#fff9c4] shrink-0">
                <button 
                  onClick={() => { setShowRuleModal(false); playSound('select'); }}
                  className="pop-btn w-3/4 max-w-sm bg-blue-600 text-white rounded-full py-4 text-2xl font-black shadow-lg hover:bg-blue-700 border-0"
                >
                  わかった！
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirmReset && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
              <HelpCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-gray-800 mb-2">最初に戻りますか？</h3>
              <p className="text-gray-500 font-bold mb-8">現在のゲームは終了します</p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => { setShowConfirmReset(false); playSound('select'); }} 
                  className="flex-1 py-3 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors border-0"
                >
                  いいえ
                </button>
                <button 
                  onClick={resetGame} 
                  className="flex-1 py-3 rounded-full bg-red-500 text-white font-bold shadow hover:bg-red-600 transition-colors border-0"
                >
                  はい
                </button>
              </div>
            </div>
          </div>
        )}

        {toastMsg && (
          <div className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[70] bg-gray-800/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 pointer-events-none">
            <Info className="w-5 h-5 text-blue-300 shrink-0" />
            <span className="font-bold">{toastMsg}</span>
          </div>
        )}
      </div>
    </>
  );
}
