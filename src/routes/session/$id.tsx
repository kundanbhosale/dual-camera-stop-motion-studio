import { CaretLeftIcon, CommandIcon } from "@phosphor-icons/react";
import {
	CameraIcon,
	ControlIcon,
	GearIcon,
	ImageIcon,
	PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { LoaderIcon, Space } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { loadCapturedFrames } from "@/lib/frame";
import { parentFolderPick } from "@/lib/pickFolder";
import { cn } from "@/lib/utils";
import { verifyPermission } from "@/lib/verifyPermissions";
import { loadWebCamDevices, useDevices } from "@/stores/devicesStore";
import { CameraView } from "../../components/CameraView";
import { TimelineFrames } from "../../components/TimelineFrames";
import { captureVideoFrame } from "../../hooks/useCapture";
import { useDualCamera } from "../../hooks/useDualCamera";
import { createFileName } from "../../lib/naming";
import { saveBlobToFolder } from "../../lib/saveFile";
import { useSessionStore } from "../../stores/sessionStore";

export const Route = createFileRoute("/session/$id")({
	component: Session,
});

function Session() {
	const { id } = Route.useParams();
	const router = useRouter();
	const navigate = useNavigate();
	const [sessionId, setSessionId] = useState(decodeURIComponent(id));
	const [sessionFolder, setSessionFolder] =
		useState<FileSystemDirectoryHandle | null>(null);
	const leftDeviceId = useSessionStore((s) => s.leftDeviceId);
	const parentFolder = useSessionStore((s) => s.parentFolder);

	const rightDeviceId = useSessionStore((s) => s.rightDeviceId);
	const setDevicesStore = useSessionStore((s) => s.setDevices);
	const devices = useDevices((s) => s.devices);
	const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(-1);
	const [loading, setLoading] = useState(true);
	const [capturing, setCapturing] = useState(false);

	const capturedFrames = useSessionStore((s) => s.capturedFrames);

	const addCapturedFrame = useSessionStore((s) => s.addCapturedFrame);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		addSource(acceptedFiles);
	}, []);
	const { getRootProps, getInputProps, isDragActive, inputRef } = useDropzone({
		noClick: true,
		noKeyboard: true,
		multiple: true,
		onDrop,
	});

	const inputProps = getInputProps();

	const previous = useMemo(() => {
		return capturedFrames[currentFrameIdx - 1];
	}, [capturedFrames, currentFrameIdx]);

	const { leftStream, rightStream } = useDualCamera(
		leftDeviceId,
		rightDeviceId,
	);

	const leftVideoRef = useRef<HTMLVideoElement>(null);
	const rightVideoRef = useRef<HTMLVideoElement>(null);

	const findSessionFolder = async (fid: string) => {
		if (!parentFolder) return;
		const folder = await parentFolder.getDirectoryHandle(fid, {
			create: true,
		});
		setSessionFolder(folder);
	};

	useEffect(() => {
		loadCapturedFrames(sessionFolder)
			.then((t) => {
				if (!t || t.length === 0) return setCurrentFrameIdx(0);
				setCurrentFrameIdx(t.length - 1);
			})
			.finally(() => {
				setLoading(false);
			});
	}, [sessionFolder]);

	useEffect(() => {
		findSessionFolder(sessionId);
	}, [id, parentFolder]);

	useEffect(() => {
		loadWebCamDevices();
	}, []);

	useEffect(() => {
		if (leftDeviceId && rightDeviceId) return;
		setDevicesStore(
			leftDeviceId ?? devices[0]?.deviceId,
			rightDeviceId ?? devices[1]?.deviceId ?? devices[0]?.deviceId,
		);
	}, [leftDeviceId, rightDeviceId, devices]);

	async function addSource(files: File[], idx?: number) {
		try {
			if (files.length === 0) return;
			setCapturing(true);

			const state = useSessionStore.getState();

			if (!state.parentFolder) {
				return toast.error("Save to folder not selected.");
			}
			const folder =
				sessionFolder ??
				(await state.parentFolder.getDirectoryHandle(sessionId, {
					create: true,
				}));

			const allowed = await verifyPermission(state.parentFolder);

			if (!allowed) {
				return toast.error("No File Editing Permission");
			}

			let curr = idx ?? currentFrameIdx + 1;

			for (const file of files) {
				const sourceName = createFileName(curr + 1, state.sourceFramePrefix);

				const sourceFolder = await folder.getDirectoryHandle(
					state.sourceFolderName,
					{
						create: true,
					},
				);
				const sourceFile = await saveBlobToFolder(
					sourceFolder,
					sourceName,
					file,
				);

				const sourceUrl = URL.createObjectURL(sourceFile);

				addCapturedFrame(
					{
						source: { name: sourceFile.name, file: sourceUrl },
					},
					curr,
				);
				curr++;
			}
		} catch (e) {
			e?.message && toast.error(e.message);
		} finally {
			setCapturing(false);
		}
	}

	async function capture() {
		try {
			setCapturing(true);
			if (!leftVideoRef.current) {
				return toast.error("Left camera stream is missing");
			}

			if (!rightVideoRef.current) {
				return toast.error("Right camera stream is missing");
			}

			const state = useSessionStore.getState();

			if (!state.parentFolder) {
				return toast.error("Save to folder not selected.");
			}

			const folder =
				sessionFolder ??
				(await state.parentFolder.getDirectoryHandle(sessionId, {
					create: true,
				}));

			const allowed = await verifyPermission(state.parentFolder);

			if (!allowed) {
				return toast.error("No File Editing Permission");
			}

			const [leftBlob, rightBlob] = await Promise.all([
				captureVideoFrame(leftVideoRef.current),
				captureVideoFrame(rightVideoRef.current),
			]);

			const leftName = createFileName(
				currentFrameIdx + 1,
				state.leftFramePrefix,
			);
			const rightName = createFileName(
				currentFrameIdx + 1,
				state.rightFramePrefix,
			);
			const leftFolder = await folder.getDirectoryHandle(state.leftFolderName, {
				create: true,
			});

			const rightFolder = await folder.getDirectoryHandle(
				state.rightFolderName,
				{
					create: true,
				},
			);

			const [leftFile, rightFile] = await Promise.all([
				saveBlobToFolder(leftFolder, leftName, leftBlob),
				saveBlobToFolder(rightFolder, rightName, rightBlob),
			]);

			const leftUrl = URL.createObjectURL(leftFile);
			const rightUrl = URL.createObjectURL(rightFile);

			addCapturedFrame(
				{
					left: { name: leftFile.name, file: leftUrl },
					right: { name: rightFile.name, file: rightUrl },
				},
				currentFrameIdx,
			);
			C;
			if (currentFrameIdx === state.capturedFrames.length - 1) {
				addCapturedFrame({}, state.capturedFrames.length);
			}
			setCurrentFrameIdx((s) => s + 1);
		} catch (e) {
			e?.message && toast.error(e.message);
		} finally {
			setCapturing(false);
		}
	}

	const newFrame = () => {
		const curr = capturedFrames[capturedFrames.length - 1];
		if (!curr.left?.file || !curr.right?.file) {
			return toast.error(
				"Left / Right frame missing! Please capture to move forward.",
			);
		}

		setCurrentFrameIdx((s) => capturedFrames.length);
		addCapturedFrame({}, capturedFrames.length);
	};

	useHotkeys("meta+space", (e) => {
		e.preventDefault();
		if (currentFrameIdx === -1) return;
		capture();
	});

	useHotkeys(["meta+d"], (e) => {
		e.preventDefault();
		newFrame();
	});

	useHotkeys(["meta+s"], (e) => {
		e.preventDefault();
		inputRef.current?.click();
	});

	useHotkeys(["left"], (e) => {
		e.preventDefault();
		setCurrentFrameIdx((s) => (s === 0 ? 0 : s - 1));
	});
	useHotkeys(["right"], (e) => {
		e.preventDefault();

		setCurrentFrameIdx((s) =>
			s === capturedFrames.length - 1 ? capturedFrames.length - 1 : s + 1,
		);
	});

	const isMac = useMemo(
		() => /Mac|iPhone|iPod|iPad/.test(navigator.platform),
		[],
	);

	return (
		<div className="flex h-dvh flex-col overflow-hidden">
			{loading ? (
				<LoaderIcon className="animate-spin size-10 m-auto" />
			) : (
				<div className="grid grid-cols-[auto_300px] flex-1">
					<div
						{...getRootProps()}
						className="flex flex-col flex-1 overflow-auto h-screen relative"
					>
						{isDragActive && (
							<div className="size-full absolute left-0 top-0 bg-background/95 backdrop-blur z-50 p-4 flex">
								<div className="size-full border border-primary border-dashed flex-1 flex flex-col justify-center items-center">
									<div>
										<p>Drag 'n' drop some files here</p>
									</div>
								</div>
							</div>
						)}

						<input ref={inputRef} {...inputProps} />

						<div className="px-4 py-2 2xl:py-4 flex gap-2">
							<Button
								size={"icon-sm"}
								variant={"outline"}
								onClick={() => navigate({ href: "/" })}
							>
								<CaretLeftIcon />
							</Button>
							<p className="text-lg font-bold">{sessionId}</p>
							{/* <input
							className="text-lg font-bold"
							value={sessionId}
							onChange={(v) => setSessionId(v.currentTarget.value)}
							onKeyDown={(e) => {
								if (e.key !== "Enter") return;

								router.navigate({
									href: "/session/$id",
									params: {
										id: encodeURIComponent(e.currentTarget.value),
									},
								});
							}}
						/> */}
						</div>
						<div className="grid grid-cols-2 px-4 gap-4">
							<div className="relative">
								<CameraView
									title="Left Camera"
									stream={leftStream}
									overlayFrame={previous?.left?.file}
									sourceFrame={capturedFrames?.[currentFrameIdx]?.source?.file}
									ref={leftVideoRef}
									id={leftDeviceId}
									onCamChange={(d) => setDevicesStore(d, rightDeviceId)}
								/>
							</div>

							<div className="relative">
								<CameraView
									id={rightDeviceId}
									title="Right Camera"
									stream={rightStream}
									overlayFrame={previous?.right?.file}
									sourceFrame={capturedFrames?.[currentFrameIdx]?.source?.file}
									ref={rightVideoRef}
									onCamChange={(d) => setDevicesStore(leftDeviceId, d)}
								/>
							</div>
						</div>
						<div className="flex flex-col items-center justify-center flex-1 px-4">
							<div className="flex gap-4 flex-1 w-full justify-end 2xl:items-center items-end 2xl:max-w-5xl m-auto py-4">
								<Button
									disabled={capturing}
									onClick={() => currentFrameIdx !== -1 && capture()}
									size={"xl"}
									className={
										"flex-1 min-h-16 text-sm 2xl:text-xl max-h-32 cursor-pointer  h-full flex-col justify-center gap-1"
									}
								>
									<div className="flex items-center justify-center gap-2">
										<CameraIcon className="size-4 2xl:size-6" />{" "}
										<span>Capture</span>
									</div>
									<span className="text-xs flex gap-2 items-center">
										<span
											className={cn(
												buttonVariants({ variant: "default" }),
												"size-4 2xl:size-6 bg-secondary/20",
											)}
										>
											{isMac ? <CommandIcon /> : <ControlIcon />}
										</span>
										<span
											className={cn(
												buttonVariants({ variant: "default" }),
												"size-4 2xl:size-6 bg-secondary/20",
											)}
										>
											<Space />
										</span>
									</span>
								</Button>

								<Button
									onClick={() => inputRef.current?.click()}
									size={"xl"}
									className={
										"flex-1 min-h-16 text-sm 2xl:text-xl max-h-32 cursor-pointer  h-full flex-col justify-center gap-1"
									}
									variant={"outline"}
									disabled={capturing}
								>
									<div className="flex items-center justify-center gap-2">
										<ImageIcon className="size-4 2xl:size-6" />
										<span className=""> Add Source Image(s)</span>
									</div>
									<span className="text-xs flex gap-2 items-center">
										<span
											className={cn(
												buttonVariants({ variant: "secondary" }),
												"size-4 2xl:size-6",
											)}
										>
											{isMac ? <CommandIcon /> : <ControlIcon />}
										</span>

										<span
											className={cn(
												buttonVariants({ variant: "secondary" }),
												"size-4 2xl:size-6 sm:text-xs",
											)}
										>
											S
										</span>
									</span>
								</Button>
								{/* 
								<Button
									onClick={newFrame}
									size={"xl"}
									className={
										"flex-1 min-h-16 text-sm 2xl:text-xl max-h-32 cursor-pointer h-full flex-col justify-center gap-1"
									}
									variant={"outline"}
									disabled={capturing}
								>
									<div className="flex items-center justify-center gap-2">
										<PlusIcon className="size-4 2xl:size-6" />
										<span>New Frame</span>
									</div>
									<span className="text-xs flex gap-2 items-center">
										<span
											className={cn(
												buttonVariants({ variant: "secondary" }),
												"size-4 2xl:size-6",
											)}
										>
											{isMac ? <CommandIcon /> : <ControlIcon />}
										</span>

										<span
											className={cn(
												"sm:text-xs",
												buttonVariants({ variant: "secondary" }),
												"size-4 2xl:size-6",
											)}
										>
											D
										</span>
									</span>
								</Button> */}
								{/* <input
									ref={inputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (!file || currentFrameIdx === -1) return;
										addSource(file);
									}}
								/> */}
							</div>
						</div>
						<div className="px-4 space-y-4">
							<TimelineFrames
								frames={capturedFrames}
								currentFrameIdx={currentFrameIdx}
								setCurrentFrameIdx={setCurrentFrameIdx}
								addNewFrame={newFrame}
								addSource={(file, i) => addSource([file], i)}
							/>
						</div>
					</div>
					<div className="border-l flex flex-col flex-1 overflow-y-auto">
						<Settings />
					</div>
				</div>
			)}
		</div>
	);
}

function Settings() {
	const toggleOnion = useSessionStore((s) => s.toggleOnion);
	const onionSkinOpacity = useSessionStore((s) => s.onionSkinOpacity);
	const onionSkin = useSessionStore((s) => s.onionSkin);

	const toggleSourceImage = useSessionStore((s) => s.toggleSourceImage);
	const sourceImgOpacity = useSessionStore((s) => s.sourceImgOpacity);
	const sourceImage = useSessionStore((s) => s.sourceImage);

	const leftFolderName = useSessionStore((s) => s.leftFolderName);
	const rightFolderName = useSessionStore((s) => s.rightFolderName);
	const leftFramePrefix = useSessionStore((s) => s.leftFramePrefix);
	const rightFramePrefix = useSessionStore((s) => s.rightFramePrefix);
	const parentFolderName = useSessionStore((s) => s.parentFolder?.name ?? "");

	return (
		<div className="space-y-4 py-4">
			<p className="flex items-center gap-2 px-4">
				<GearIcon /> Settings
			</p>
			<Separator />

			<div className="px-4 space-y-4">
				<Field orientation="horizontal" className="">
					<FieldLabel htmlFor="source-image" className="min-w-32">
						Toggle Source Image
					</FieldLabel>
					<Switch
						id="source-image"
						checked={sourceImage}
						onCheckedChange={toggleSourceImage}
					/>
				</Field>
				<Field orientation="horizontal" className="">
					<FieldLabel htmlFor="source-img-opacity" className="min-w-32">
						Source Image Opacity
					</FieldLabel>
					<Slider
						id="source-img-opacity"
						min={0.1}
						max={0.9}
						step={0.01}
						value={sourceImgOpacity}
						onValueChange={(v) => {
							useSessionStore.setState({
								sourceImgOpacity: typeof v === "number" ? v : v[0],
							});
						}}
					/>
				</Field>
				<Separator />
				<Field orientation="horizontal" className="">
					<FieldLabel htmlFor="onion-skin" className="min-w-32">
						Toggle Onion Skin
					</FieldLabel>
					<Switch
						id="onion-skin"
						checked={onionSkin}
						onCheckedChange={toggleOnion}
					/>
				</Field>
				<Field orientation="horizontal" className="">
					<FieldLabel htmlFor="onion-opacity" className="min-w-32">
						Onion Opacity
					</FieldLabel>
					<Slider
						id="onion-opacity"
						min={0.1}
						max={0.9}
						step={0.01}
						value={onionSkinOpacity}
						onValueChange={(v) => {
							useSessionStore.setState({
								onionSkinOpacity: typeof v === "number" ? v : v[0],
							});
						}}
					/>
				</Field>
			</div>
			<Separator />
			<div className="px-4 space-y-4">
				<Field orientation="horizontal" className="">
					<FieldLabel htmlFor="left-folder" className="min-w-32">
						Left Folder Name
					</FieldLabel>
					<Input
						id="left-folder"
						value={leftFolderName}
						placeholder="Left Cam"
						onChange={(v) =>
							useSessionStore.setState({
								leftFolderName: v.currentTarget.value,
							})
						}
					/>
				</Field>
				<Field orientation="horizontal" className="">
					<FieldLabel htmlFor="right-folder" className="min-w-32">
						Right Folder Name
					</FieldLabel>
					<Input
						id="right"
						value={rightFolderName}
						placeholder="Right Cam"
						onChange={(v) =>
							useSessionStore.setState({
								rightFolderName: v.currentTarget.value,
							})
						}
					/>
				</Field>
			</div>
			<Separator />
			<div className="px-4 space-y-4">
				<Field orientation="horizontal" className="">
					<FieldLabel htmlFor="save-folder" className="min-w-32">
						Left Frame Prefix
					</FieldLabel>
					<Input
						value={leftFramePrefix}
						placeholder="L"
						onChange={(v) =>
							useSessionStore.setState({
								leftFramePrefix: v.currentTarget.value,
							})
						}
					/>
				</Field>
				<Field orientation="horizontal" className="w-full">
					<FieldLabel htmlFor="save-folder" className="min-w-32">
						Right Frame Prefix
					</FieldLabel>
					<Input
						value={rightFramePrefix}
						placeholder="R"
						onChange={(v) =>
							useSessionStore.setState({
								rightFramePrefix: v.currentTarget.value,
							})
						}
					/>
				</Field>
			</div>
			<Separator />
			<div className="px-4 space-y-4">
				<Field orientation="vertical" className="">
					<FieldLabel htmlFor="save-folder" className="min-w-32">
						Save to Folder
					</FieldLabel>
					<div className="flex gap-2">
						<Input
							placeholder="Select Folder"
							disabled
							value={parentFolderName}
						/>
						<Button onClick={parentFolderPick}>Change</Button>
					</div>
				</Field>
			</div>
		</div>
	);
}
