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
    hamburg: [
        ["Giovanni Mpetshi Perricard", "Alexander Bublik"],
        ["Alexander Zverev", "Aleksandar Kovacevic"],
        ["Francisco Cerundolo", "Pedro Martinez"],
        ["Tomas Martin Etcheverry", "Francisco Comesana"],
        ["Alejandro Davidovich Fokina", "Gael Monfils"],
        ["Marcos Giron", "Roberto Bautista Agut"]
    ],
    geneva: [
        ["Matteo Arnaldi", "Hugo Gaston"],
        ["Marton Fucsovics", "Zizou Bergs"],
        ["Arthur Rinderknech", "Miomir Kecmanovic"],
        ["Arthur Cazaux", "Hubert Hurkacz"]
    ], 
    roland: [
        ["Nicolas Moreno De Alboran", "Fabio Fognini"],
        ["Cristian Garin", "Harold Mayot"]
    ],
};

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

// Redirect root to /home
app.get('/', (req, res) => {
    res.redirect('/home');
});

// Serve the homepage
app.get('/home', (req, res) => {
    res.render('home');  // Make sure views/home.ejs exists
});

// Serve tournament predictions
app.get('/predictions', async (req, res) => {
    const hamburgCards = await getMatchupData(tournaments.hamburg, "hamburg");
    const genevaCards = await getMatchupData(tournaments.geneva, "geneva");
    const rolandCards = await getMatchupData(tournaments.roland, "roland");
    const cards = [...hamburgCards, ...genevaCards, ...rolandCards];
    res.render('index', { cards });
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


