import { useState, useEffect } from 'react';
import { Wallet, Play, Square, PlusSquare, RefreshCcw } from 'lucide-react';
import './index.css';

const API_BASE = 'http://localhost:3001/api';

const Card = ({ value, hidden, delay }) => {
  return (
    <div 
      className={`playing-card ${hidden ? 'hidden' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {!hidden && (
        <span className={value === 11 || value === 10 ? 'special-card' : ''}>
          {value === 11 ? 'A' : value === 10 ? '10' : value}
        </span>
      )}
    </div>
  );
};

function App() {
  const [gameState, setGameState] = useState({
    gameId: null,
    balance: 0,
    status: 'idle',
    playerHand: [],
    dealerHand: [],
    playerScore: 0,
    dealerScore: 0,
    message: ''
  });
  
  const [bet, setBet] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Initialize session on load
  useEffect(() => {
    const initGame = async () => {
      try {
        let savedGameId = localStorage.getItem('blackjack_gameId');
        const res = await fetch(`${API_BASE}/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: savedGameId })
        });
        const data = await res.json();
        
        localStorage.setItem('blackjack_gameId', data.gameId);
        setGameState(prev => ({ 
          ...prev, 
          gameId: data.gameId, 
          balance: data.balance,
          status: data.status || 'idle'
        }));
      } catch (err) {
        console.error("Failed to connect to backend", err);
        setError("Could not connect to the game server. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    };
    initGame();
  }, []);

  const startGame = async () => {
    if (bet <= 0 || bet > gameState.balance) {
      setError("Invalid bet amount! Check your balance.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: gameState.gameId, bet: Number(bet) })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setGameState(prev => ({
        ...prev,
        ...data
      }));
    } catch (err) {
      setError("Error starting game.");
    } finally {
      setLoading(false);
    }
  };

  const hit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: gameState.gameId })
      });
      const data = await res.json();
      setGameState(prev => ({ ...prev, ...data }));
    } catch (err) {
      setError("Error hitting.");
    } finally {
      setLoading(false);
    }
  };

  const stand = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: gameState.gameId })
      });
      const data = await res.json();
      setGameState(prev => ({ ...prev, ...data }));
    } catch (err) {
      setError("Error standing.");
    } finally {
      setLoading(false);
    }
  };

  const handleBetChange = (e) => {
    setBet(e.target.value);
  };

  const getMessageClass = (status) => {
    if (status === 'player_win') return 'win';
    if (status === 'dealer_win') return 'lose';
    if (status === 'draw') return 'draw';
    if (status === 'blackjack') return 'blackJack';
    return '';
  };

  if (loading && !gameState.gameId) {
    return <div className="glass-panel" style={{textAlign: 'center'}}><h2>Loading Game Engine...</h2></div>;
  }

  return (
    <>
      <div className="glass-panel">
        <h1>NEON BLACKJACK</h1>
        
        <div className="game-info">
          <div className="balance-badge">
            <Wallet size={20} />
            <span>Balance: ${gameState.balance}</span>
          </div>
          
          {(gameState.status === 'idle' || gameState.status === 'player_win' || gameState.status === 'dealer_win' || gameState.status === 'draw') && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Bet Amount:</span>
              <input 
                type="number" 
                className="bet-input" 
                value={bet} 
                onChange={handleBetChange}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {error && <div style={{ color: 'var(--accent-secondary)', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

        {gameState.status !== 'idle' && (
          <>
            <div className="dealer-area">
              <h2>Dealer's Hand <span className="score-badge">{gameState.dealerScore || '?'}</span></h2>
              <div className="hand-container">
                {gameState.dealerHand.map((val, idx) => (
                  <Card key={`dealer-${idx}`} value={val} hidden={val === '?'} delay={idx * 150} />
                ))}
              </div>
            </div>

            <div className="message-box space-y-2">
              <div className={getMessageClass(gameState.status)}>
                 {gameState.message}
              </div>
            </div>

            <div className="player-area">
              <h2>Your Hand <span className="score-badge">{gameState.playerScore}</span></h2>
              <div className="hand-container">
                {gameState.playerHand.map((val, idx) => (
                  <Card key={`player-${idx}`} value={val} hidden={false} delay={idx * 150} />
                ))}
              </div>
            </div>
          </>
        )}

        <div className="controls-container">
          {(gameState.status === 'idle' || gameState.status === 'player_win' || gameState.status === 'dealer_win' || gameState.status === 'draw') ? (
            <button className="btn btn-primary" onClick={startGame} disabled={loading || Number(bet) > gameState.balance || Number(bet) <= 0}>
              <Play size={20} />
              {gameState.status === 'idle' ? 'Start Game' : 'Play Again'}
            </button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={hit} disabled={loading || gameState.status !== 'playing'}>
                <PlusSquare size={20} />
                Hit
              </button>
              <button className="btn btn-danger" onClick={stand} disabled={loading || gameState.status !== 'playing'}>
                <Square size={20} />
                Stand
              </button>
            </>
          )}
          
          {gameState.balance <= 0 && gameState.status !== 'playing' && (
            <button className="btn" onClick={() => {
               localStorage.removeItem('blackjack_gameId');
               window.location.reload();
            }}>
              <RefreshCcw size={20} />
              Reset Wallet
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
