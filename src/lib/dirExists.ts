import { useSessionStore } from "@/stores/sessionStore";

export async function directoryExists(handle: FileSystemDirectoryHandle) {
	try {
		if (!handle) return false;
		// Attempt to read first entry
		await handle.values().next();

		return true;
	} catch {
		useSessionStore.setState({ parentFolder: undefined });
		return false;
	}
}
