export async function saveBlobToFolder(
	folder: FileSystemDirectoryHandle,
	name: string,
	blob: Blob,
) {
	const fileHandle = await folder.getFileHandle(name, {
		create: true,
	});

	const writable = await fileHandle.createWritable();

	await writable.write({
		type: "write",
		data: blob,
	});

	await writable.close();
	return await fileHandle.getFile();
}
