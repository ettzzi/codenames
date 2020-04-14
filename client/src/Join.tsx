import React, { Fragment, useState, useEffect } from "react";
import { Redirect } from "react-router";
import useSocket from "./useSocket";

export const Join = () => {
  const [name, setPlayerName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [socket] = useSocket("");
  const [error, setError] = useState("");
  const [gameJoined, setGameJoined] = useState(false);

  // Previous user is not
  useEffect(() => {
    sessionStorage.removeItem("host");
  });

  const onGameJoined = (message: string) => {
    if (message === "NOT_FOUND") {
      return setError(
        `La partita con il codice ${accessCode} non è stata trovata`
      );
    }
    sessionStorage.setItem("id", message);
    sessionStorage.setItem("name", name);
    sessionStorage.setItem("accessCode", accessCode);
    sessionStorage.removeItem("spymaster");

    setGameJoined(true);
  };

  if (gameJoined && accessCode) {
    return <Redirect to={`/game/${accessCode}`} />;
  }

  return (
    <Fragment>
      <form
        method="POST"
        onSubmit={(e) => {
          e.preventDefault();
          const id = sessionStorage.getItem("id");

          socket.emit(
            "JOIN_GAME",
            {
              name,
              accessCode,
              id,
            },
            onGameJoined
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
            Inserisci il codice di accesso
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
        <input type="submit" value="Crea la partita"></input>
        {error && <p>{error}</p>}
      </form>
    </Fragment>
  );
};
