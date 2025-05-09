// history.ts
import { createMemoryHistory } from "@tanstack/react-router";

export const memoryHistory = createMemoryHistory({
	initialEntries: ["/"],
});

// Helper function to go back in history
export const goBack = () => {
	memoryHistory.go(-1);
};
