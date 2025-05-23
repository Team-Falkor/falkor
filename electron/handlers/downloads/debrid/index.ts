// Queue for debrid download handler
export class DebridDownloadHandler {
	private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
	private activeCachingJobs: Map<string, { cacheId: string }> = new Map();
}
