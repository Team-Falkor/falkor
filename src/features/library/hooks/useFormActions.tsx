import { UseFormReturn } from "react-hook-form";
import { NewGameFormSchema } from "../components/modals/newGame/schema";

export const useFormActions = (form: UseFormReturn<NewGameFormSchema>) => {
  const handlePathButton = async () => {
    const selected: any = await window.ipcRenderer.invoke(
      "generic:open-dialog",
      {
        properties: ["openFile"],
        filters: [{ name: "Executable", extensions: ["exe", "sh"] }],
      }
    );

    if (selected.canceled) return;
    if (!selected.filePaths.length) return;

    const selectedPath = selected.filePaths[0];

    form.setValue("gamePath", selectedPath.replace(/\\/g, "//"));
  };

  const handleWinePrefixButton = async () => {
    const selected: any = await window.ipcRenderer.invoke(
      "generic:open-dialog",
      {
        properties: ["openDirectory"],
      }
    );

    if (selected.canceled) return;
    if (!selected.filePaths.length) return;

    const selectedPath = selected.filePaths[0];

    form.setValue("winePrefixFolder", selectedPath.replace(/\\/g, "//"));
  };

  const handleIconButton = async () => {
    const selected: any = await window.ipcRenderer.invoke(
      "generic:open-dialog",
      {
        properties: ["openFile"],
        filters: [
          { name: "Images", extensions: ["jpg", "png", "jpeg", "webp"] },
        ],
      }
    );

    if (selected.canceled) return;
    if (!selected.filePaths.length) return;

    const selectedPath = selected.filePaths[0];
    form.setValue("gameIcon", selectedPath.replace(/\\/g, "//"));
  };

  const handleShuffleButton = () => {
    const currentGameId = form.getValues("gameId");

    if (currentGameId?.length || currentGameId?.trim() !== "") return;

    const gameName = form.getValues("gameName");

    if (!gameName?.length)
      form.setValue("gameId", Math.random().toString(36).substring(2, 15)); // Random string
    else
      form.setValue(
        "gameId",
        gameName.split(" ").join("-").toLowerCase() // Slugified string
      );
  };

  return {
    handlePathButton,
    handleIconButton,
    handleShuffleButton,
    handleWinePrefixButton,
  };
};
