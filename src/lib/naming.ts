export function createFileName(
	frame: number,
	suffix: string,
	extension = "jpg",
) {
	const padded = String(frame).padStart(4, "0");

	return `${padded}_${suffix}.${extension}`;
}
