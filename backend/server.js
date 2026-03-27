const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// In-memory store
const sessions = {};

function generateGameId() {
    return Math.random().toString(36).substr(2, 9);
}

function drawCard() {
    // Return standard blackjack values, mimicking original code 2-11
    // A standard deck has cards 2-10, J(10), Q(10), K(10), A(11)
    return Math.floor(Math.random() * 10) + 2; 
}

function calculateScore(hand) {
    let score = 0;
    let aces = 0;
    for (let card of hand) {
        score += card;
        if (card === 11) aces += 1;
    }
    // Handle Aces
    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }
    return score;
}

app.post('/api/init', (req, res) => {
    let { gameId } = req.body;
    let balance = 1000;
	
    if (!gameId || !sessions[gameId]) {
        gameId = generateGameId();
        sessions[gameId] = {
            balance: balance,
            currentBet: 0,
            playerHand: [],
            dealerHand: [],
            status: 'idle'
        };
    } else {
        balance = sessions[gameId].balance;
    }
    res.json({ gameId, balance: balance, status: sessions[gameId].status });
});

app.post('/api/start', (req, res) => {
    const { gameId, bet } = req.body;
    const session = sessions[gameId];
	
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (bet > session.balance) return res.status(400).json({ error: 'Insufficient balance' });
    if (bet <= 0) return res.status(400).json({ error: 'Bet must be positive' });

    session.balance -= bet;
    session.currentBet = bet;
    // Draw initial cards
    session.playerHand = [drawCard(), drawCard()];
    session.dealerHand = [drawCard(), drawCard()];
    session.status = 'playing';

    const playerScore = calculateScore(session.playerHand);
    let resultMessage = null;

    if (playerScore === 21) {
        // Player got a Blackjack!
        const dealerScore = calculateScore(session.dealerHand);
        if (dealerScore === 21) {
            session.status = 'draw';
            session.balance += session.currentBet; // Return bet
            resultMessage = 'Push! Both have Blackjack.';
        } else {
            session.status = 'player_win';
            // Blackjack pays 3:2
            session.balance += session.currentBet + (session.currentBet * 1.5);
            resultMessage = 'Blackjack! You win!';
        }
    }

    res.json({
        balance: session.balance,
        playerHand: session.playerHand,
        dealerHand: session.status === 'playing' ? [session.dealerHand[0], '?'] : session.dealerHand,
        status: session.status,
        message: resultMessage,
        playerScore: playerScore,
        dealerScore: session.status === 'playing' ? session.dealerHand[0] : calculateScore(session.dealerHand)
    });
});

app.post('/api/hit', (req, res) => {
    const { gameId } = req.body;
    const session = sessions[gameId];
	
    if (!session || session.status !== 'playing') {
        return res.status(400).json({ error: 'Invalid game state' });
    }

    session.playerHand.push(drawCard());
    const playerScore = calculateScore(session.playerHand);

    let resultMessage = null;
    let dealerCards = [session.dealerHand[0], '?'];
    let dealerScoreDisplay = session.dealerHand[0];

    if (playerScore > 21) {
        session.status = 'dealer_win';
        resultMessage = 'Bust! You lose.';
        dealerCards = session.dealerHand;
        dealerScoreDisplay = calculateScore(session.dealerHand);
    } else if (playerScore === 21) {
        // Force stand if 21
        return handleStand(session, res);
    }

    res.json({
        balance: session.balance,
        playerHand: session.playerHand,
        dealerHand: dealerCards,
        status: session.status,
        message: resultMessage,
        playerScore: playerScore,
        dealerScore: dealerScoreDisplay
    });
});

function handleStand(session, res) {
    let dealerScore = calculateScore(session.dealerHand);
    const playerScore = calculateScore(session.playerHand);
	
    // Dealer draws up to 17
    while (dealerScore < 17) {
        session.dealerHand.push(drawCard());
        dealerScore = calculateScore(session.dealerHand);
    }

    let resultMessage = null;

    if (dealerScore > 21) {
        session.status = 'player_win';
        session.balance += session.currentBet * 2; // Return bet + win
        resultMessage = 'Dealer busts! You win!';
    } else if (playerScore > dealerScore) {
        session.status = 'player_win';
        session.balance += session.currentBet * 2;
        resultMessage = 'You win!';
    } else if (playerScore < dealerScore) {
        session.status = 'dealer_win';
        resultMessage = 'Dealer wins.';
    } else {
        session.status = 'draw';
        session.balance += session.currentBet;
        resultMessage = 'Push! It\'s a tie.';
    }

    res.json({
        balance: session.balance,
        playerHand: session.playerHand,
        dealerHand: session.dealerHand,
        status: session.status,
        message: resultMessage,
        playerScore: playerScore,
        dealerScore: dealerScore
    });
}

app.post('/api/stand', (req, res) => {
    const { gameId } = req.body;
    const session = sessions[gameId];
	
    if (!session || session.status !== 'playing') {
        return res.status(400).json({ error: 'Invalid game state' });
    }

    handleStand(session, res);
});

app.listen(PORT, () => {
    console.log(`Backend server strictly running on http://localhost:${PORT}`);
});
