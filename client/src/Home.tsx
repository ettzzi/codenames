import React from "react";
import { Link } from "react-router-dom";

export const Home: React.FC = () => {
  return (
    <div className="SmallContainer">
      <p className="subtitle">
        Per una migliore esperienza ti consigliamo di usare una app di
        videoconferenza con i tuoi amici
      </p>

      <div className="Field">
        <Link className="button is-fullwidth" to="/create">
          Crea una nuova partita
        </Link>
      </div>
      <div className="Field">
        <Link className="button is-fullwidth" to="/join">
          Unisciti ad una partita
        </Link>
      </div>
      <div className="Field">
        <Link className="button is-fullwidth" to="/rules">
          Leggi le regole
        </Link>
      </div>
    </div>
  );
};
