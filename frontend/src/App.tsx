import { ConnectButton } from "@rainbow-me/rainbowkit"
import Sender from "./pages/Sender"
import Recipient from "./pages/Recipient"

export default function App() {
  const isRecipient = window.location.pathname === "/recipient"

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">HELIXRA</span>
        {!isRecipient && <ConnectButton />}
      </header>
      <main>
        {isRecipient ? <Recipient /> : <Sender />}
      </main>
    </div>
  )
}
