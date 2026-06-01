import { toast } from "sonner";

export async function verifyPermission(handle: FileSystemDirectoryHandle) {
	try {
		if (!handle) return false;
		const options = {
			mode: "readwrite" as const,
		};
		const q = await handle.queryPermission(options);
		if (q !== "granted") {
			const result = await handle.requestPermission(options);
			if (result !== "granted") {
				return false;
			}
		}

		// actual filesystem access test
		await handle.values().next();

		return true;
	} catch (e) {
		console.log(e);
		e?.message && toast.error(e?.message);
		return false;
	}
}
