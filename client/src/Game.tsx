import React, { Fragment, useEffect, useState } from "react";
import "./Game.css";

import useSocket from "./useSocket";
import { useParams } from "react-router-dom";
import { Card } from "./Card";
import { Banner } from "./Banner";

const initialState = {
  players: [],
  gameBoard: [],
};
const getTeamNameFromColor = (color: "RED" | "BLUE") =>
  color === "RED" ? "rossa" : "blu";

export const Game: React.FC = () => {
  const [state, setState] = useState<any>(initialState);
  const [suggestion, setSuggestion] = useState<string>("");
  const [quantity, setNumWords] = useState<string>("");
  const { gameId } = useParams();
  const host = sessionStorage.getItem("host");
  const [socket] = useSocket("");
  const id = sessionStorage.getItem("id");

  useEffect(() => {
    const name = sessionStorage.getItem("name");
    const accessCode = sessionStorage.getItem("accessCode");

    socket?.on("CURRENT_STATE", (newState: any) => {
      console.log(newState);
      setState(newState);
    });

    if (accessCode === gameId) {
      socket?.emit(
        "JOIN_GAME",
        {
          name,
          accessCode,
          id,
        },
        () => {
          console.log("E");
        }
      );
    }

    // Start request state every 200ms
    setInterval(function () {
      socket?.emit("REQUEST_STATE", {
        accessCode: gameId,
      });
    }, 200);
  }, [socket, gameId, id]);

  return (
    <Fragment>
      {host && state.status === "LOBBY" && (
        <button onClick={() => socket?.emit("START_GAME", gameId)}>
          inizia la partita!
        </button>
      )}
      {state.status === "FINISHED" && (
        <Banner color={state.winningTeam}>
          {`🎉 La squadra ${getTeamNameFromColor(state.winningTeam)} vince! 🎉`}
        </Banner>
      )}
      <div>
        {state.player && (
          <Fragment>
            <p>{`La tua squadra è la squadra ${state.player.team}`}</p>
            <p>
              Squadra blu:
              {state.players
                .filter((p: any) => p.team === "BLUE")
                .map((p: any) => p.name)
                .join(", ")}
            </p>
            <p>
              Squadra rossa:
              {state.players
                .filter((p: any) => p.team === "RED")
                .map((p: any) => p.name)
                .join(", ")}
            </p>
          </Fragment>
        )}
      </div>
      {state.suggestion && (
        <Banner color={state.turn}>
          {`La squadra rossa deve scegliere ${state.suggestion.quantity} parole correlate a ${state.suggestion.word}`}
        </Banner>
      )}
      {state.player &&
        state.status === "PLAYING" &&
        !state.player.spymaster &&
        state.player.team === state.turn && (
          <button
            onClick={() => {
              socket?.emit("NEXT_TURN", {
                accessCode: state.accessCode,
              });
            }}
          >
            Termina il tuo turno
          </button>
        )}
      {state.player &&
        state.player.spymaster &&
        state.player.team === state.turn &&
        !state.suggestion && (
          <div>
            <form
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridGap: "20px",
                alignItems: "center",
                alignContent: "center",
              }}
              method="POST"
              onSubmit={(e) => {
                e.preventDefault();
                socket?.emit("SUGGEST_WORD", {
                  accessCode: state.accessCode,
                  word: suggestion,
                  quantity,
                });
              }}
            >
              <div className="Field">
                <label className="Label" htmlFor="quantity">
                  Usa una parola per suggerire
                </label>
                <input
                  required
                  className="Input"
                  value={suggestion}
                  name="suggestion"
                  onChange={(e) => setSuggestion(e.target.value)}
                  type="text"
                ></input>
              </div>
              <div className="Field">
                <label className="Label" htmlFor="quantity">
                  Quante parole sono collegate?
                </label>
                <input
                  required
                  className="Input"
                  value={quantity}
                  name="quantity"
                  onChange={(e) => setNumWords(e.target.value)}
                  type="number"
                ></input>
              </div>
              <input
                type="submit"
                value="Invia suggerimento!"
                className="Btn"
              ></input>
            </form>
          </div>
        )}
      {/* Status */}
      <div className="Grid">
        {state.gameBoard.map((card: any, index: number) => (
          <Card
            onClick={() => {
              socket?.emit("CARD_SELECTED", gameId, index);
            }}
            disabled={
              state.status === "FINISHED" ||
              (state.player && state.player.team !== state.turn) ||
              (card && card.discovered) ||
              (state.player && state.player.spymaster)
            }
            color={card && card.color}
          >
            {card ? card.label : ""}
          </Card>
        ))}
      </div>
      {/*  */}
    </Fragment>
  );
};