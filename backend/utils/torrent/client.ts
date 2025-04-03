import { DownloadgameData } from "@/@types";
import WebTorrent, { Torrent, TorrentOptions } from "webtorrent";
import { EventEmitter } from "events";
import logger from "../../handlers/logging";

/**
 * Extended torrent type that includes game data
 */
export type TorrentWithGameData = Torrent & { game_data: DownloadgameData };

/**
 * Options for torrent client initialization
 */
interface TorrentClientOptions {
  /** Maximum download speed in bytes/sec */
  maxDownloadSpeed?: number;
  /** Maximum upload speed in bytes/sec */
  maxUploadSpeed?: number;
  /** Default download path */
  downloadPath?: string;
  /** Whether to enable DHT */
  dht?: boolean;
}

/**
 * Manages the WebTorrent client with enhanced error handling and resource management
 */
class TorrentClient extends EventEmitter {
  private client: WebTorrent.Instance;
  private isDestroyed = false;
  private torrents: Map<string, TorrentWithGameData> = new Map();
  
  /**
   * Creates a new TorrentClient instance
   * @param options Client configuration options
   */
  constructor(options: TorrentClientOptions = {}) {
    super();
    
    // Initialize WebTorrent client with options
    this.client = new WebTorrent({
      dht: options.dht ?? true,
      downloadLimit: options.maxDownloadSpeed,
      uploadLimit: options.maxUploadSpeed
    });
    
    // Set up event handlers
    this.setupEventHandlers();
    
  }
  
  /**
   * Sets up event handlers for the WebTorrent client
   * @private
   */
  private setupEventHandlers(): void {
    // Handle client errors
    this.client.on("error", (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.log("error", `[torrent] client error: ${errorMessage}`);
      this.emit("error", error);
    });
    
  }
  
  /**
   * Adds a torrent to the client
   * @param torrentId Magnet URI, torrent file, etc.
   * @param gameData Associated game data
   * @param options Torrent-specific options
   * @returns Promise resolving to the added torrent
   */
  public addTorrent(
    torrentId: string | Buffer | File,
    gameData: DownloadgameData,
    options: TorrentOptions = {}
  ): Promise<TorrentWithGameData> {
    if (this.isDestroyed) {
      return Promise.reject(new Error("Client has been destroyed"));
    }
    
    return new Promise((resolve, reject) => {
      try {
        const torrent = this.client.add(torrentId, options) as Torrent;
        
        // Handle torrent-specific events
        torrent.on("error", (err) => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.log("error", `[torrent] error in torrent ${torrent.infoHash}: ${errorMessage}`);
          this.emit("torrent-error", torrent, err);
        });
        
        torrent.on("ready", () => {
          // Combine torrent with game data
          const torrentWithData = this.combineTorrentData(torrent, gameData);
          
          // Store in our map
          this.torrents.set(torrent.infoHash, torrentWithData);
          
          logger.log("info", `[torrent] torrent ready: ${torrent.name} (${torrent.infoHash})`);
          this.emit("torrent-ready", torrentWithData);
          
          resolve(torrentWithData);
        });
        
        torrent.on("done", () => {
          logger.log("info", `[torrent] download complete: ${torrent.name}`);
          this.emit("torrent-done", this.torrents.get(torrent.infoHash));
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.log("error", `[torrent] failed to add torrent: ${errorMessage}`);
        reject(error);
      }
    });
  }
  
  /**
   * Removes a torrent from the client
   * @param infoHash The torrent's info hash
   * @param removeFiles Whether to delete downloaded files
   * @returns True if removed successfully, false otherwise
   */
  public removeTorrent(infoHash: string, removeFiles = false): boolean {
    if (this.isDestroyed) {
      logger.log("warn", "[torrent] Cannot remove torrent: client has been destroyed");
      return false;
    }
    
    try {
      const torrent = this.client.get(infoHash);
      if (!torrent) {
        logger.log("warn", `[torrent] Torrent not found: ${infoHash}`);
        return false;
      }
      
      this.client.remove(infoHash, { destroyStore: removeFiles });
      this.torrents.delete(infoHash);
      
      logger.log("info", `[torrent] Removed torrent: ${infoHash}`);
      this.emit("torrent-removed", infoHash);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.log("error", `[torrent] Error removing torrent ${infoHash}: ${errorMessage}`);
      return false;
    }
  }
  
  /**
   * Gets a torrent by its info hash
   * @param infoHash The torrent's info hash
   * @returns The torrent or undefined if not found
   */
  public getTorrent(infoHash: string): TorrentWithGameData | undefined {
    return this.torrents.get(infoHash);
  }
  
  /**
   * Gets all torrents
   * @returns Array of all torrents
   */
  public getAllTorrents(): TorrentWithGameData[] {
    return Array.from(this.torrents.values());
  }
  
  /**
   * Sets the maximum download speed
   * @param speed Speed in bytes/sec (0 for unlimited)
   */
  public throttleDownload(speed: number): void {
    if (this.isDestroyed) return;
    
    try {
      this.client.throttleDownload(speed);
      logger.log("info", `[torrent] Set download speed limit to ${speed} bytes/sec`);
    } catch (error) {
      logger.log("error", `[torrent] Failed to set download speed: ${error}`);
    }
  }
  
  /**
   * Sets the maximum upload speed
   * @param speed Speed in bytes/sec (0 for unlimited)
   */
  public throttleUpload(speed: number): void {
    if (this.isDestroyed) return;
    
    try {
      this.client.throttleUpload(speed);
      logger.log("info", `[torrent] Set upload speed limit to ${speed} bytes/sec`);
    } catch (error) {
      logger.log("error", `[torrent] Failed to set upload speed: ${error}`);
    }
  }
  
  /**
   * Destroys the client and releases resources
   */
  public destroy(): Promise<void> {
    if (this.isDestroyed) {
      return Promise.resolve();
    }
    
    this.isDestroyed = true;
    this.torrents.clear();
    
    return new Promise((resolve) => {
      this.client.destroy((err) => {
        if (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.log("error", `[torrent] Error destroying client: ${errorMessage}`);
        } else {
          logger.log("info", "[torrent] Client destroyed successfully");
        }
        resolve();
      });
    });
  }
  
  /**
   * Combines a torrent with game data
   * @param torrent The torrent object
   * @param gameData The game data to associate
   * @returns Combined torrent with game data
   * @private
   */
  private combineTorrentData(torrent: Torrent, gameData: DownloadgameData): TorrentWithGameData {
    const torrentWithData = Object.assign(torrent, { game_data: gameData }) ;
    return torrentWithData
  }
}

// Create and export a singleton instance
export const client = new TorrentClient();

// Export the torrents map for backward compatibility
export const torrents: Map<string, TorrentWithGameData> = client['torrents'];

// Export the combineTorrentData function for backward compatibility
export const combineTorrentData = (torrent: Torrent, game_data: DownloadgameData): TorrentWithGameData => {
  return { ...torrent, game_data } as TorrentWithGameData;
};
