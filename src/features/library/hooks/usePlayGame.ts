import { useCallback, useEffect, useState } from "react";

type UsePlayGameHook = {
  gameRunning: boolean;
  playGame: () => Promise<void>;
  stopGame: () => Promise<void>;
};

export const usePlayGame = (
  game_path: string,
  game_id: string,
  callback?: () => Promise<void> | void
): UsePlayGameHook => {
  const [gameRunning, setGameRunning] = useState<boolean>(false);

  // Function to launch the game
  const playGame = useCallback(async () => {
    try {
      console.log("Starting game: ", game_path);
      await window.ipcRenderer.invoke("launcher:play-game", game_path, game_id);
    } catch (error) {
      console.error(error);
    }
  }, [game_id, game_path]);

  const stopGame = useCallback(async () => {
    try {
      console.log("Stopping game: ", game_path);
      await window.ipcRenderer.invoke("launcher:stop-game", game_id);
    } catch (error) {
      console.error(error);
    }
  }, [game_id, game_path]);

  // Cleanup effect in case component unmounts
  useEffect(() => {
    window.ipcRenderer.on("game:playing", (_event, gameId) => {
      if (gameId !== game_id) return;
      setGameRunning(true);
      if (callback) callback();
    });

    window.ipcRenderer.on("game:stopped", (_event, gameId) => {
      if (gameId !== game_id) return;
      setGameRunning(false);
      if (callback) callback();
    });

    return () => {
      setGameRunning(false); // Reset state on unmount
      window.ipcRenderer.removeAllListeners("game:playing");
      window.ipcRenderer.removeAllListeners("game:stopped");
    };
  }, [game_id, callback]);

  return {
    gameRunning,
    playGame,
    stopGame,
  };
};
