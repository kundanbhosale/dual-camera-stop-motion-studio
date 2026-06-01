export async function captureVideoFrame(
	video: HTMLVideoElement,
): Promise<Blob> {
	if (!video.videoWidth || !video.videoHeight) {
		throw new Error("Video not ready");
	}

	const canvas = document.createElement("canvas");

	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;

	const ctx = canvas.getContext("2d");

	if (!ctx) {
		throw new Error("Canvas context failed");
	}

	ctx.drawImage(video, 0, 0);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Failed to create blob"));
					return;
				}

				resolve(blob);
			},
			"image/jpeg",
			1,
		);
	});
}
