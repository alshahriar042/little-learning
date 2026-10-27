import { Route, Routes } from "react-router-dom";
import Sections from "./Sections";
import Section from "./Section";
import Flashcards from "./Flashcards";
import PlayGame, { GamesMenu } from "./games/Games";

/** Picture Words module: sections -> grid -> flashcards, plus games. Mounted at /m/picture-words/*. */
export default function PictureWords() {
  return (
    <Routes>
      <Route index element={<Sections />} />
      <Route path="games" element={<GamesMenu />} />
      <Route path="games/:gameId" element={<PlayGame />} />
      <Route path=":sectionId" element={<Section />} />
      <Route path=":sectionId/:itemId" element={<Flashcards />} />
    </Routes>
  );
}
