import { useState } from "react";
import Head from "next/head";
import HomePage from "../components/HomePage";
import FlashcardViewer from "../components/FlashcardViewer";

export default function Index() {
  const [activeDeck, setActiveDeck] = useState(null);

  return (
    <>
      <Head>
        <title>Flashcards — AI Study Tool</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#05080c" />
      </Head>

      {activeDeck ? (
        <FlashcardViewer
          deck={activeDeck}
          onBack={() => setActiveDeck(null)}
        />
      ) : (
        <HomePage onOpenDeck={(deck) => setActiveDeck(deck)} />
      )}
    </>
  );
}
