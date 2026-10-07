import { useState } from 'react';
import { DeckDetail } from './components/DeckDetail';
import { DeckList } from './components/DeckList';
import { StudySession } from './components/StudySession';
import './App.css';

type View = { name: 'decks' } | { name: 'deck'; deckId: string } | { name: 'study'; deckId: string };

function App() {
  const [view, setView] = useState<View>({ name: 'decks' });

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={() => setView({ name: 'decks' })}>Vocablo</h1>
        <span className="muted">Aprende vocabulario con repetición espaciada</span>
      </header>
      <main>
        {view.name === 'decks' && (
          <DeckList
            onOpen={(deckId) => setView({ name: 'deck', deckId })}
            onStudy={(deckId) => setView({ name: 'study', deckId })}
          />
        )}
        {view.name === 'deck' && (
          <DeckDetail
            key={view.deckId}
            deckId={view.deckId}
            onBack={() => setView({ name: 'decks' })}
            onStudy={() => setView({ name: 'study', deckId: view.deckId })}
          />
        )}
        {view.name === 'study' && (
          <StudySession
            key={view.deckId}
            deckId={view.deckId}
            onExit={() => setView({ name: 'deck', deckId: view.deckId })}
          />
        )}
      </main>
    </div>
  );
}

export default App;
