import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "src/App";

function ensureRootElement(): Element {
  document.body.innerHTML = '<div id="react-app" />';
  const element = document.getElementById("react-app");
  if (!element) {
    throw new Error("Unexpected");
  }
  return element;
}

const element = ensureRootElement();
const root = createRoot(element);
root.render(React.createElement(App));
