import { exec } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Plays a sound file natively based on the operating system with optional volume control.
 * Supports Windows (PowerShell), macOS (afplay), and Linux (paplay/aplay).
 *
 * @param soundPath - The absolute path to the sound file.
 * @param volume - Optional volume level (0 to 1 on macOS, 0 to 100 on Linux).
 */
export const playSound = (soundPath: string, volume?: number): void => {
  if (!existsSync(soundPath)) {
    console.warn("Sound file does not exist:", soundPath);
    return;
  }

  const command = (() => {
    switch (process.platform) {
      case "win32":
        return `powershell -c (New-Object Media.SoundPlayer '${soundPath}').PlaySync();`;
      case "darwin":
        return `afplay "${soundPath}" -v ${volume !== undefined ? Math.max(0, Math.min(volume, 1)) : 0.7}`;
      case "linux":
        return volume !== undefined
          ? `paplay --volume ${Math.floor(Math.max(0, Math.min(volume, 100)) * 655.36)} "${soundPath}" || aplay "${soundPath}"`
          : `paplay "${soundPath}" || aplay "${soundPath}"`;
      default:
        console.warn(
          "Unsupported platform for sound playback:",
          process.platform
        );
        return "";
    }
  })();

  if (process.platform !== "win32") {
    exec(command);
  } else {
    // PowerShell on Windows requires a shell option
    exec(command, { shell: "powershell.exe" });
  }
};
