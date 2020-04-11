import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import "./App.css";
import { Home } from "./Home";
import { Game } from "./Game";
import { Create } from "./Create";
import { Join } from "./Join";

function App() {
  return (
    <div className="App">
      <header className="AppHeader">
        <h1 className="AppName">Nome in Codice</h1>
      </header>
      <Router>
        <Switch>
          <Route path="/create">
            <Create />
          </Route>
          <Route path="/join">
            <Join />
          </Route>
          <Route path="/game/:gameId">
            <Game />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
