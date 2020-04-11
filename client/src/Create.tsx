import React, { useState, useCallback } from "react";
import { Redirect } from "react-router";
import useSocket from "./useSocket";

export const Create = () => {
  const [name, setPlayerName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [gameCreated, setGameCreated] = useState(false);
  const [socket] = useSocket("");

  const onGameJoined = useCallback(
    (id: string) => {
      sessionStorage.setItem("id", id);
      sessionStorage.setItem("name", name);
      sessionStorage.setItem("accessCode", accessCode);
      sessionStorage.setItem("host", accessCode);
      setGameCreated(true);
    },
    [setGameCreated, accessCode, name]
  );

  const onGameCreated = useCallback(() => {
    socket?.emit(
      "JOIN_GAME",
      {
        name,
        accessCode,
      },
      onGameJoined
    );
  }, [socket, name, accessCode, onGameJoined]);

  if (gameCreated && accessCode) {
    return <Redirect to={`/game/${accessCode}`} />;
  }

  return (
    <div className="SmallContainer">
      <form
        method="POST"
        onSubmit={(e) => {
          e.preventDefault();
          socket?.emit(
            "CREATE_GAME",
            {
              name,
              accessCode,
            },
            onGameCreated
          );
        }}
      >
        <div className="Field">
          <label className="Label" htmlFor="accessCode">
            Il tuo nome:
          </label>
          <input
            required
            className="Input"
            value={name}
            name="name"
            onChange={(e) => setPlayerName(e.target.value)}
            type="text"
          ></input>
          <label className="Label" htmlFor="accessCode">
            Il nome della tua partita:
          </label>
          <input
            required
            className="Input"
            value={accessCode}
            name="accessCode"
            onChange={(e) => setAccessCode(e.target.value)}
            type="text"
          ></input>
        </div>
        <input
          type="submit"
          value="Crea la partita"
          className="Btn Btn--Primary"
        ></input>
      </form>
    </div>
  );
};
