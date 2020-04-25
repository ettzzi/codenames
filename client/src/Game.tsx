import React, { Fragment, useEffect, useState } from "react";
import "./Game.css";

import useSocket from "./useSocket";
import { useParams } from "react-router-dom";
import { Card } from "./Card";
import { Banner } from "./Banner";
import { Text } from "./Text";

const initialState = {
  player: {},
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
    if (state.player && state.player.spymaster) {
      sessionStorage.setItem("spymaster", state.player.spymaster);
    }
  }, [state.player]);

  useEffect(() => {
    const name = sessionStorage.getItem("name");
    const accessCode = sessionStorage.getItem("accessCode");
    const spymaster = sessionStorage.getItem("spymaster");

    socket?.on("CURRENT_STATE", (newState: any) => {
      setState(newState);
    });

    if (accessCode === gameId) {
      socket?.emit(
        "JOIN_GAME",
        {
          name,
          accessCode,
          id,
          spymaster,
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
        {state.player && state.player.team && (
          <Fragment>
            <p>
              La tua squadra è la squadra&nbsp;
              <Text color={state.player.team.toLowerCase()}>
                {getTeamNameFromColor(state.player.team)}
              </Text>
            </p>
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
      {!state.suggestion && state.status === "PLAYING" && state.turn && (
        <Banner color={state.turn}>
          {`🔔 Il capitano della squadra ${getTeamNameFromColor(
            state.turn
          )} deve dare un suggerimento 🔔 `}
        </Banner>
      )}
      {state.suggestion && (
        <Banner color={state.turn}>
          La squadra {getTeamNameFromColor(state.turn)} deve scegliere{" "}
          <strong>{state.suggestion.quantity}</strong> parole correlate a{" "}
          <strong>{state.suggestion.word}</strong>
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
      {state.status === "PLAYING" && (
        <div id="status-line" className="red-turn">
          <div id="remaining">
            Carte rimanenti:
            <span className="Red">{state.remainingRedCards}</span>&nbsp;–&nbsp;
            <span className="Blue">{state.remainingBlueCards}</span>
          </div>
        </div>
      )}
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
            discovered={
              state.player && state.player.spymaster && card.discovered
            }
            color={card && card.color}
          >
            <span>{card ? card.label : ""}</span>
            <span>
              {state.player && state.player.spymaster && card.discovered
                ? "👀"
                : ""}

              {state.player &&
                state.player &&
                card.discovered &&
                card.color === "KILLER" &&
                "💀"}
            </span>
          </Card>
        ))}
      </div>
      {/*  */}
    </Fragment>
  );
};
