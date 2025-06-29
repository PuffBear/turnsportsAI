require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Matchups by tournament
const tournaments = {
    halle: [
        ["Jannik Sinner", "Yannick Hanfmann"],
        ["Alexandre Muller", "Alexander Bublik"],
        ["Fabian Marozsan", "Miomir Kecmanovic"],
        ["Andrey Rublev", "Sebastian Ofner"],
        ["Pedro Martinez", "Tomas Martin Etcheverry"],
        ["Zizou Bergs", "Karen Khachanov"],
        ["Francisco Cerundolo", "Alex Michelsen"],
        ["Stefanos Tsitsipas", "Luciano Darderi"],
        ["Quentin Halys", "Benjamin Bonzi"],
        ["Daniel Altmaier", "Daniil Medvedev"],
        ["Ugo Humbert", "Denis Shapovalov"],
        ["Marcos Giron", "Alexander Zverev"],
    ],
    london : [
        ["Brandon Nakashima", "Giovanni Mpetshi Perricard"],
        ["Alexei Popyrin", "Aleksandar Vukic"],
        ["Arthur Rinderknech", "Ben Shelton"],
        ["Jordan Thompson", "Jaume Munar"],
        ["Carlos Alcaraz", "Alejandro Davidovich Fokina"],
        ["Roberto Bautista Agut", "Nuno Borges"],
        ["Cameron Norrie", "Jakub Mensik"],
        ["Gabriel Diallo", "Billy Harris"],
        ["Corentin Moutet", "Taylor Fritz"],
    ],
    epl: [
        ["", ""]
    ],
    uefa_europa: [
        ["", ""]
    ],
    mls: [
        ["", ""]
    ],
    nba: [
        ["", ""]
    ],
    ipl:[
        ["", ""]
    ],
};

// Function is to get the data from the db. this is for tennis
async function getMatchupData(matchups, tournament) {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        port: process.env.MYSQL_PORT,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });
    const results = [];
    for (const [p1, p2] of matchups) {
        const [rows] = await connection.execute(
            `SELECT player1_name, player2_name, prob_player1_wins, prob_player2_wins FROM model_matches WHERE player1_name = ? AND player2_name = ? LIMIT 1`,
            [p1, p2]
        );
        if (rows.length > 0) {
            const row = rows[0];
            results.push({
                player1_name: row.player1_name,
                player2_name: row.player2_name,
                prob_player1_wins: (typeof row.prob_player1_wins === 'number') ? +(row.prob_player1_wins).toFixed(4) : null,
                prob_player2_wins: (typeof row.prob_player2_wins === 'number') ? +(row.prob_player2_wins).toFixed(4) : null,
                tournament: tournament
            });
        } else {
            results.push({ player1_name: p1, player2_name: p2, prob_player1_wins: null, prob_player2_wins: null, tournament: tournament });
        }
    }
    await connection.end();
    return results;
}

// function to get football data from db.
async function getFootballMatchupData(matchups, tournament){}

// function to get basketball data from db.
async function getBasketballMatchupData(matchups, tournament){}

async function getCricketMatchupData(matchups, tournament){}

// Redirect root to /home
app.get('/', (req, res) => {
    res.redirect('/home');
});

// Serve the homepage
app.get('/home', (req, res) => {
    res.render('home');  // Make sure views/home.ejs exists
});

// Serve tennis tournament predictions
app.get('/tennis', async (req, res) => {
    const halleCards = await getMatchupData(tournaments.halle, "halle")
    const londonCards = await getMatchupData(tournaments.london, "london")
    const cardsTennis = [ ...halleCards, ...londonCards];
    res.render('index_tennis', { cardsTennis });
});

// Serve the Football Tournament Predictions
app.get('/football', async(req, res) => {
    const eplCards = await getMatchupData(tournaments.epl, "epl");
    const uefa_europaCards = await getMatchupData(tournaments.uefa_europa, "uefa_europa");
    const mlsCards = await getMatchupData(tournaments.mls, "mls");
    // replace the above line with the below one once the function to get the db is written.
    //const eplCards = await getFootballMatchupData(tournaments.epl, "epl");
    const cardsFootball = [...eplCards, ...uefa_europaCards, ...mlsCards];
    res.render('index_football', { cardsFootball });
});

// Serve the Basketball Tournament Predictions
app.get('/basketball', async(req, res) => {
    const nbaCards = await getMatchupData(tournaments.nba, "nba");
    // replace the above line with the below one once the function to get the db is written.
    //const nbaCards = await getBasketballMatchupData(tournaments.nba, "nba");
    const cardsBasketball = [...nbaCards];
    res.render('index_basketball', { cardsBasketball });
});

// Serve the Cricket Tournamnet Predictions
app.get('/cricket', async(req, res) => {
    const iplCards = await getMatchupData(tournaments.ipl, "ipl");
    // replace the above line with the below one once the function to get the db is written.
    //const iplCards = await getCricketMatchupData(tournaments.ipl, "ipl");
    const cardsCricket = [...iplCards];
    res.render('index_cricket', {cardsCricket});
});

// Serve the account page
app.get('/account', async(req, res) => {
    res.render('account_page');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});