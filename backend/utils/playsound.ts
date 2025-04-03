import { exec, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import logger from "../handlers/logging";

/**
 * Options for sound playback
 */
interface PlaySoundOptions {
  /** Volume level (0 to 1) */
  volume?: number;
  /** Whether to play synchronously (blocking) */
  sync?: boolean;
  /** Whether to suppress error messages */
  silent?: boolean;
  /** Timeout in milliseconds for async playback */
  timeout?: number;
}

/**
 * Result of a sound playback attempt
 */
interface PlaySoundResult {
  success: boolean;
  error?: string;
}

/**
 * Normalizes a volume value to the appropriate range for the current platform
 * @param volume Volume value (0-1)
 * @param platform The platform to normalize for
 * @returns Normalized volume value
 */
const normalizeVolume = (volume: number | undefined, platform: string): number => {
  if (volume === undefined) {
    return platform === "darwin" ? 0.7 : 70; // Default volumes
  }
  
  // Ensure volume is between 0 and 1
  const normalizedVolume = Math.max(0, Math.min(volume, 1));
  
  // Convert to platform-specific range
  return platform === "darwin" 
    ? normalizedVolume 
    : Math.floor(normalizedVolume * 100);
};

/**
 * Escapes a file path for shell command usage
 * @param path The file path to escape
 * @returns Escaped file path
 */
const escapeFilePath = (path: string): string => {
  // Replace single quotes with escaped single quotes for PowerShell
  // and double quotes with escaped double quotes for bash/sh
  return process.platform === "win32"
    ? path.replace(/'/g, "''")
    : path.replace(/"/g, "\\\"");
};

/**
 * Builds the command to play a sound file based on the current platform
 * @param soundPath Path to the sound file
 * @param options Playback options
 * @returns Command string or empty string if platform is unsupported
 */
const buildPlayCommand = (soundPath: string, options: PlaySoundOptions = {}): string => {
  const escapedPath = escapeFilePath(soundPath);
  
  switch (process.platform) {
    case "win32": {
      // Windows uses PowerShell's Media.SoundPlayer
      const playMethod = options.sync ? "PlaySync()" : "Play()";
      return `powershell -c "(New-Object Media.SoundPlayer '${escapedPath}').${playMethod};"`;
    }
    
    case "darwin": {
      // macOS uses afplay
      const volume = normalizeVolume(options.volume, "darwin");
      const timeoutArg = options.timeout ? ` -t ${options.timeout / 1000}` : "";
      return `afplay "${escapedPath}" -v ${volume}${timeoutArg}`;
    }
    
    case "linux": {
      // Linux tries paplay (PulseAudio) first, then falls back to aplay (ALSA)
      const volume = normalizeVolume(options.volume, "linux");
      // PulseAudio volume is in range 0-65536
      const pulseVolume = Math.floor(volume * 655.36);
      return `paplay --volume ${pulseVolume} "${escapedPath}" || aplay "${escapedPath}"`;
    }
    
    default:
      return "";
  }
};

/**
 * Plays a sound file natively based on the operating system with optional volume control.
 * Supports Windows (PowerShell), macOS (afplay), and Linux (paplay/aplay).
 *
 * @param soundPath - The absolute path to the sound file
 * @param options - Optional playback configuration
 * @returns Promise that resolves with the result (for async) or result object (for sync)
 */
export const playSound = (
  soundPath: string, 
  options: PlaySoundOptions | number = {}
): Promise<PlaySoundResult> | PlaySoundResult => {
  // Handle legacy volume parameter
  const opts: PlaySoundOptions = typeof options === "number" 
    ? { volume: options } 
    : options;

  // Validate sound file existence
  if (!existsSync(soundPath)) {
    const error = `Sound file does not exist: ${soundPath}`;
    if (!opts.silent) {
      logger.log("warn", error);
    }
    return opts.sync 
      ? { success: false, error } 
      : Promise.resolve({ success: false, error });
  }

  // Build the command
  const command = buildPlayCommand(soundPath, opts);
  if (!command) {
    const error = `Unsupported platform for sound playback: ${process.platform}`;
    if (!opts.silent) {
      logger.log("warn", error);
    }
    return opts.sync 
      ? { success: false, error } 
      : Promise.resolve({ success: false, error });
  }

  // Execute the command
  try {
    if (opts.sync) {
      // Synchronous playback
      execSync(command, { 
        stdio: opts.silent ? 'ignore' : 'inherit',
        shell: process.platform === "win32" ? "powershell.exe" : undefined
      });
      return { success: true };
    } else {
      // Asynchronous playback
      return new Promise((resolve) => {
        const childProcess = exec(
          command, 
          { shell: process.platform === "win32" ? "powershell.exe" : undefined },
          (error) => {
            if (error && !opts.silent) {
              logger.log("error", `Error playing sound: ${error.message}`);
              resolve({ success: false, error: error.message });
            } else {
              resolve({ success: true });
            }
          }
        );

        // Set timeout if specified
        if (opts.timeout && opts.timeout > 0) {
          setTimeout(() => {
            try {
              childProcess.kill();
            } catch (e) {
              // Ignore errors when killing process
            }
          }, opts.timeout);
        }
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!opts.silent) {
      logger.log("error", `Failed to play sound: ${errorMessage}`);
    }
    return opts.sync 
      ? { success: false, error: errorMessage } 
      : Promise.resolve({ success: false, error: errorMessage });
  }
};
