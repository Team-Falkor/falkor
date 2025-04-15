import {
  downloadQueue,
  httpDownloadHandler,
  torrentDownloadHandler,
} from "../../../handlers/downloads";
import "./addDownload";
import "./cancelDownload";
import "./clearCompleted";
import "./getAllDownloads";
import "./getDownload";
import "./pauseDownload";
import "./removeDownload";
import "./resumeDownload";
import "./setPriority";
import "./updateConfig";

downloadQueue.registerHandler("http", httpDownloadHandler);
downloadQueue.registerHandler("torrent", torrentDownloadHandler);
