import EventEmitter from "node:events";
import type { addDownloadSchema } from "@backend/api/routers/downloads";
import type { z } from "zod";
import { downloadQueue } from "../downloads/queue";
import { DebridManager } from ".";

type Type = "http" | "torrent";

interface Options {
	id: string;
	url: string;
	type: Type;
	inputFromAddDownload: z.infer<typeof addDownloadSchema>;
}

const debridManager = DebridManager.getInstance();

// TODO: instead of in interval to constantly check and download we need to just check the torrent info to not create mutiple downloads on debrid service

export class DebridCachingManager extends EventEmitter {
	// data from addDOwnload
	private type: Type;
	private id: string;
	private url: string;
	private inputFromAddDownload: z.infer<typeof addDownloadSchema>;

	// progress data
	private progress = 0;
	private totalSize = 0;
	private speed = 0;

	// interval
	private interval: NodeJS.Timeout | null = null;

	constructor({ id, url, type, inputFromAddDownload }: Options) {
		super();
		this.id = id;
		this.url = url;
		this.type = type;
		this.inputFromAddDownload = inputFromAddDownload;
	}

	public start() {
		if (this.interval) return;

		// check every 1 minute
		this.interval = setInterval(async () => {
			const isDirectHttp = this.type === "http";
			const download = await debridManager.download(
				this.url,
				isDirectHttp ? "ddl" : "torrent",
			);

			if (!download?.isCaching && this.interval) {
				clearInterval(this.interval);

				if (!download?.url) return;

				const payload: z.infer<typeof addDownloadSchema> = {
					...this.inputFromAddDownload,
					url: download?.url,
				};

				await downloadQueue.addDownload(payload);

				this.emit("added_to_queue", {
					id: this.id,
					type: this.type,
					url: this.url,
					isCaching: false,
				});
			}

			this.progress = download?.progress ?? 0;
			this.totalSize = download?.fileSize ?? 0;

			this.emit("progress", {
				progress: this.progress,
				totalSize: this.totalSize,
				speed: this.speed,
				id: this.id,
				type: this.type,
				url: this.url,
				isCaching: true,
			});
		}, 1000 * 60); // 1 minute
	}

	getStats() {
		return {
			progress: this.progress,
			totalSize: this.totalSize,
			speed: this.speed,
			id: this.id,
			type: this.type,
			url: this.url,
			isCaching: this.interval !== null,
			title: this.inputFromAddDownload.name,
		};
	}
}
