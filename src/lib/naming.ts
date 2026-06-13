import { useSessionStore } from "@/stores/sessionStore";

export function createFileName(
	frame: number,
	suffix: string,
	extension = "jpg",
) {
	return `${frame}_${suffix}.${extension}`;
}
