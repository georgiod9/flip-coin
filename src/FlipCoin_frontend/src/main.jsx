import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";
import { IdentityProvider } from "./context/IdentityContext/IdentityContext";
import { BackendProvider } from "./context/BackendContext/BackendContext";
import { AccountProvider } from "./context/AccountContext/AccountContext";
import { LedgerProvider } from "./context/LedgerContext/LedgerContext";
import { StateProvider } from "./context/StateContext/StateContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StateProvider>
      <IdentityProvider>
        <BackendProvider>
          <AccountProvider>
            <LedgerProvider>
              <App />
            </LedgerProvider>
          </AccountProvider>
        </BackendProvider>
      </IdentityProvider>
    </StateProvider>
  </React.StrictMode>
);
