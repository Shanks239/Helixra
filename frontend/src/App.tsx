import { ConnectButton } from "@rainbow-me/rainbowkit"
import Home from "./pages/Home"
import Sender from "./pages/Sender"
import Recipient from "./pages/Recipient"

export default function App() {
  const path = window.location.pathname
  const route = path === "/recipient" ? "recipient" : path === "/app" ? "app" : "home"

  return (
    <div className="app">
      <header className="app-header">
        <a className="app-logo" href="/">HELIXRA</a>
        {route === "app" && <ConnectButton />}
        {route === "home" && (
          <a className="btn-ghost hero-cta-ghost" href="/app">Launch app →</a>
        )}
      </header>
      <main>
        {route === "recipient" && <Recipient />}
        {route === "app" && <Sender />}
        {route === "home" && <Home />}
      </main>
    </div>
  )
}
