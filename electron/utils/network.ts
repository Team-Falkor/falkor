import { net } from "electron";

/**
 * Network connectivity utility for Electron applications
 */
export class NetworkMonitor {
	private isOnline = true;
	private checkInterval: NodeJS.Timeout | null = null;
	private listeners: Array<(isOnline: boolean) => void> = [];

	/**
	 * Check if the device is currently online
	 * @returns Promise<boolean> - true if online, false if offline
	 */
	async checkConnectivity(): Promise<boolean> {
		try {
			// Use Electron's net module to check connectivity
			return net.isOnline();
		} catch (error) {
			console.error("Failed to check network connectivity:", error);
			return false;
		}
	}

	/**
	 * Get the current online status (cached)
	 * @returns boolean - current online status
	 */
	getStatus(): boolean {
		return this.isOnline;
	}

	/**
	 * Start monitoring network connectivity
	 * @param intervalMs - Check interval in milliseconds (default: 30000)
	 * @param onStatusChange - Optional callback for status changes
	 */
	async startMonitoring(
		intervalMs = 30000,
		onStatusChange?: (isOnline: boolean) => void
	): Promise<void> {
		// Initial check
		this.isOnline = await this.checkConnectivity();
		console.log(`Network: Initial status - ${this.isOnline ? 'online' : 'offline'}`);

		// Add callback if provided
		if (onStatusChange) {
			this.listeners.push(onStatusChange);
		}

		// Start monitoring
		this.checkInterval = setInterval(async () => {
			const wasOnline = this.isOnline;
			this.isOnline = await this.checkConnectivity();

			if (wasOnline !== this.isOnline) {
				console.log(`Network: Status changed - ${this.isOnline ? 'online' : 'offline'}`);
				
				// Notify all listeners
				this.listeners.forEach(listener => {
					try {
						listener(this.isOnline);
					} catch (error) {
						console.error("Error in network status listener:", error);
					}
				});
			}
		}, intervalMs);
	}

	/**
	 * Stop monitoring network connectivity
	 */
	stopMonitoring(): void {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}
	}

	/**
	 * Add a listener for network status changes
	 * @param listener - Callback function that receives the new online status
	 */
	addStatusListener(listener: (isOnline: boolean) => void): void {
		this.listeners.push(listener);
	}

	/**
	 * Remove a listener for network status changes
	 * @param listener - The listener function to remove
	 */
	removeStatusListener(listener: (isOnline: boolean) => void): void {
		const index = this.listeners.indexOf(listener);
		if (index > -1) {
			this.listeners.splice(index, 1);
		}
	}

	/**
	 * Clear all listeners
	 */
	clearListeners(): void {
		this.listeners = [];
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		this.stopMonitoring();
		this.clearListeners();
	}
}

// Singleton instance for global use
const networkMonitor = new NetworkMonitor();

// Convenience functions
export const checkNetworkConnectivity = () => networkMonitor.checkConnectivity();
export const getNetworkStatus = () => networkMonitor.getStatus();
export const startNetworkMonitoring = (intervalMs?: number, onStatusChange?: (isOnline: boolean) => void) => 
	networkMonitor.startMonitoring(intervalMs, onStatusChange);
export const stopNetworkMonitoring = () => networkMonitor.stopMonitoring();
export const addNetworkStatusListener = (listener: (isOnline: boolean) => void) => 
	networkMonitor.addStatusListener(listener);
export const removeNetworkStatusListener = (listener: (isOnline: boolean) => void) => 
	networkMonitor.removeStatusListener(listener);

// Export the singleton instance
export { networkMonitor };

// Export types
export type NetworkStatusListener = (isOnline: boolean) => void;