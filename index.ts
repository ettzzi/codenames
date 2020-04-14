import express from "express";
import http from "http";
import cors from "cors";
import socketIO from "socket.io";
import path from "path";
import { shuffle } from "./utils/shuffle";
import { Italian } from "./config/words";
import { CronJob } from "cron";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "/client")));

app.use("*", express.static(path.join(__dirname, "/client")));
/** TYPES */

type Team = "RED" | "BLUE";

interface Player {
  id: string;
  name: string;
  team: Team;
  spymaster: boolean;
  owner: boolean;
}

interface JoinGameParams {
  id?: string;
  name: string;
  accessCode: string;
  spymaster?: boolean;
}

interface Word {
  label: string;
  color: Team | "KILLER" | "CITIZEN" | "UNKNOWN";
  discovered: boolean;
}

interface Suggestion {
  word: string;
  quantity: number;
}

interface Game {
  accessCode: string;
  suggestion?: Suggestion;
  status: "LOBBY" | "PLAYING" | "FINISHED";
  players: Player[];
  gameBoard: Word[];
  turn: Team;
  startTime: string;
  winningTeam?: "RED" | "BLUE";
}

type Callback = (message: string) => void;
type ActiveGames = Record<string, Game>;

interface CodenameSocket extends SocketIO.Socket {
  games: string[];
  playerId: string;
}

// -----------------------------------
//  Game Server Data
// -----------------------------------

const activeGames: ActiveGames = {};
const MAX_RED_CARDS = 9;
const MAX_BLUE_CARDS = 8;

/** CRON JOB  */

const job = new CronJob("0 0 */2 * * *", function () {
  console.log(activeGames);
  for (const key in activeGames) {
    if (
      activeGames.hasOwnProperty(key) &&
      Math.abs(
        new Date().getTime() - new Date(activeGames[key].startTime).getTime()
      ) /
        36e5 >=
        2
    ) {
      delete activeGames[key];
    }
  }
  console.log(
    "Games removed at: " +
      new Date().toDateString() +
      " " +
      new Date().toTimeString()
  );
});
console.log("cron job created");
job.start();

/** SOCKET  */
io.on("connection", (socket: CodenameSocket) => {
  socket.games = [];

  socket.on("disconnect", () => {
    console.log("A user has disconnected", socket.playerId);
    socket.games.forEach((game) => {
      activeGames[game].players = activeGames[game].players.filter(
        (p) => p.id !== socket.playerId
      );
    });
  });

  socket.on("CREATE_GAME", (config, onSuccess) => {
    if (activeGames[config.accessCode])
      return socket.emit(
        "CREATE_GAME_ERROR",
        "Esiste già una partita con questo nome"
      );

    activeGames[config.accessCode] = {
      status: "LOBBY",
      accessCode: config.accessCode,
      players: [],
      turn: "RED",
      gameBoard: [],
      startTime: new Date().toJSON(),
    };

    return onSuccess();
  });

  socket.on("SUGGEST_WORD", (config: any) => {
    activeGames[config.accessCode].suggestion = {
      ...config,
    };
  });

  socket.on("JOIN_GAME", function (input: JoinGameParams, cb: Callback) {
    const { accessCode, name, id, spymaster } = input;
    const game = activeGames[accessCode];

    if (!game) {
      return cb("NOT_FOUND");
    }

    const numRed = game.players.filter((p) => p.team === "RED").length;
    const numBlue = game.players.length - numRed;
    const owner = numRed + numBlue === 0;
    const playerAlreadyConnected = game.players.find(
      (p) => p.id === id || socket.id === p.id
    );

    socket.playerId = id || socket.id;
    socket.games.push(accessCode);

    if (!playerAlreadyConnected) {
      game.players.push({
        id: socket.playerId,
        owner,
        spymaster: spymaster || false,
        name: name,
        team: numRed <= numBlue ? "RED" : "BLUE",
      });
    }
    cb(socket.playerId);
  });

  socket.on("REQUEST_STATE", function ({ accessCode }) {
    if (!activeGames[accessCode]) {
      return socket.emit("GAME_NOT_FOUND", "La partita non è stata trovata");
    }
    const currentPlayer = activeGames[accessCode].players.find(
      (p) => p.id === socket.playerId
    );

    const isSpymaster = currentPlayer?.spymaster;
    if (isSpymaster) {
      socket.emit("CURRENT_STATE", {
        ...activeGames[accessCode],
        player: currentPlayer,
      });
    } else {
      socket.emit("CURRENT_STATE", {
        ...activeGames[accessCode],
        player: currentPlayer,
        gameBoard: activeGames[accessCode].gameBoard.map((card) =>
          card.discovered
            ? card
            : {
                ...card,
                color: "UNKNOWN",
              }
        ),
      });
    }
  });

  socket.on("START_GAME", function (accessCode) {
    activeGames[accessCode].status = "PLAYING";
    activeGames[accessCode].gameBoard = shuffle(
      shuffle(Italian)
        .slice(0, 25)
        .map((w, i) => {
          let color: Team | "BLUE" | "CITIZEN" | "KILLER" = "KILLER";
          if (i < 9) color = "RED";
          if (i >= 9 && i < 17) color = "BLUE";
          if (i >= 17 && i <= 23) {
            color = "CITIZEN";
          }

          return {
            label: w,
            discovered: false,
            color,
          };
        })
    );

    // Pick a red player and make it spymaster
    const redPlayers = activeGames[accessCode].players.filter(
      (p) => p.team === "RED"
    );
    const redPlayerIndex = Math.floor(Math.random() * redPlayers.length);
    let playerIndex = activeGames[accessCode].players.findIndex(
      (p) => p.id === redPlayers[redPlayerIndex].id
    );
    activeGames[accessCode].players[playerIndex].spymaster = true;

    // Pick a blue player and make it spymaster
    const bluePlayer = activeGames[accessCode].players.filter(
      (p) => p.team === "BLUE"
    );
    if (bluePlayer.length) {
      const bluePlayerIndex = Math.floor(Math.random() * bluePlayer.length);
      playerIndex = activeGames[accessCode].players.findIndex(
        (p) => p.id === bluePlayer[bluePlayerIndex].id
      );
      activeGames[accessCode].players[playerIndex].spymaster = true;
    }
  });

  socket.on("NEXT_TURN", function ({ accessCode }) {
    activeGames[accessCode].status = "PLAYING";
    activeGames[accessCode].turn =
      activeGames[accessCode].turn === "RED" ? "BLUE" : "RED";
    activeGames[accessCode].suggestion = undefined;
  });

  socket.on("CARD_SELECTED", function (accessCode, index) {
    if (!activeGames[accessCode]) {
      return;
    }
    activeGames[accessCode].gameBoard[index].discovered = true;

    // If Killer game ended
    if (activeGames[accessCode].gameBoard[index].color === "KILLER") {
      activeGames[accessCode].winningTeam =
        activeGames[accessCode].turn === "RED" ? "BLUE" : "RED";
      activeGames[accessCode].status = "FINISHED";
      delete activeGames[accessCode].suggestion;
      return;
    }

    if (
      activeGames[accessCode].gameBoard[index].color !==
      activeGames[accessCode].turn
    ) {
      activeGames[accessCode].turn =
        activeGames[accessCode].turn === "RED" ? "BLUE" : "RED";
      delete activeGames[accessCode].suggestion;

      return;
    }

    const numRedDiscovered = activeGames[accessCode].gameBoard.filter(
      (card) => card.color === "RED" && card.discovered
    ).length;
    const numBlueDiscovered = activeGames[accessCode].gameBoard.filter(
      (card) => card.color === "BLUE" && card.discovered
    ).length;

    if (numRedDiscovered === MAX_RED_CARDS) {
      activeGames[accessCode].winningTeam = "RED";
      activeGames[accessCode].status = "FINISHED";
      delete activeGames[accessCode].suggestion;
    }

    if (numBlueDiscovered === MAX_BLUE_CARDS) {
      activeGames[accessCode].winningTeam = "BLUE";
      activeGames[accessCode].status = "FINISHED";
      delete activeGames[accessCode].suggestion;
    }
  });
});

server.listen(process.env.PORT || 8080, () => {
  console.log("Server started on port ", process.env.PORT);
});
