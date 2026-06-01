import { toast } from "sonner";
import { useSessionStore } from "@/stores/sessionStore";
import { verifyPermission } from "./verifyPermissions";

export const parentFolderPick = async () => {
	let dir;
	try {
		dir = await window.showDirectoryPicker({
			id: "cam-capture",
			mode: "readwrite",
			startIn: "documents",
		});

		useSessionStore.setState({
			parentFolder: dir,
		});
	} catch (e) {
		e?.message && toast.error(e?.message);

		if (e.name === "NotAllowedError") return await verifyPermission(dir);
		throw e;
	}
};
