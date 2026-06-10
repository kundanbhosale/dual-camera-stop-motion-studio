import { useSessionStore } from "@/stores/sessionStore";

export function getFrameNumber(fileName?: string) {
	const match = fileName?.match(/(\d+)(?!.*\d)/);
	return match ? Number(match[1]) : null;
}

export async function loadCapturedFrames(
	sessionFolder: FileSystemDirectoryHandle | null,
) {
	if (!sessionFolder) return;
	const state = useSessionStore.getState();

	const leftFrames = new Map<number, { name: string; file: string }>();
	const rightFrames = new Map<number, { name: string; file: string }>();
	const sourceFrames = new Map<number, { name: string; file: string }>();

	for await (const [folderName, folderHandle] of sessionFolder.entries()) {
		if (folderHandle.kind !== "directory") continue;

		const isLeft = folderName === state.leftFolderName;
		const isRight = folderName === state.rightFolderName;
		const isSource = folderName === state.sourceFolderName;

		if (!isLeft && !isRight && !isSource) continue;

		for await (const [fileName, fileHandle] of folderHandle.entries()) {
			if (fileHandle.kind !== "file") continue;

			if (!/\.(jpg|jpeg|png|webp)$/i.test(fileName)) continue;

			const frameNumber = getFrameNumber(fileName);
			if (frameNumber === null) continue;

			const file = await fileHandle.getFile();

			const url = URL.createObjectURL(file);

			if (isLeft) {
				leftFrames.set(frameNumber, { name: file.name, file: url });
			}

			if (isRight) {
				rightFrames.set(frameNumber, { name: file.name, file: url });
			}
			if (isSource) {
				sourceFrames.set(frameNumber, { name: file.name, file: url });
			}
		}
	}

	// combine frame numbers
	const allFrameNumbers = Array.from(
		new Set([...leftFrames.keys(), ...rightFrames.keys()]),
	).sort((a, b) => a - b);

	const capturedFrames = allFrameNumbers.map((frameNumber) => ({
		left: leftFrames.get(frameNumber),
		right: rightFrames.get(frameNumber),
		source: sourceFrames.get(frameNumber),
	}));

	useSessionStore.setState({ capturedFrames });

	return capturedFrames;
}
