import { CaretLeftIcon } from "@phosphor-icons/react";
import { CameraIcon, GearIcon } from "@phosphor-icons/react/dist/ssr";
import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { Space } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { SourceReference } from "@/components/SourceReference";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
	const sourceFrame = useSessionStore((s) => s.sourceFrame);

	const rightDeviceId = useSessionStore((s) => s.rightDeviceId);
	const setDevicesStore = useSessionStore((s) => s.setDevices);
	const devices = useDevices((s) => s.devices);

	const onionSkin = useSessionStore((s) => s.onionSkin);

	const capturedFrames = useSessionStore((s) => s.capturedFrames);

	const addCapturedFrame = useSessionStore((s) => s.addCapturedFrame);
	const previous = capturedFrames[capturedFrames.length - 1];

	const { leftStream, rightStream } = useDualCamera(
		leftDeviceId,
		rightDeviceId,
	);

	const leftVideoRef = useRef<HTMLVideoElement>(null);
	const rightVideoRef = useRef<HTMLVideoElement>(null);

	async function loadCapturedFrames() {
		if (!sessionFolder) return;
		const leftFrames = new Map<number, { name: string; file: string }>();
		const rightFrames = new Map<number, { name: string; file: string }>();

		for await (const [folderName, folderHandle] of sessionFolder.entries()) {
			if (folderHandle.kind !== "directory") continue;

			const isLeft = folderName.toLowerCase().includes("left");
			const isRight = folderName.toLowerCase().includes("right");

			if (!isLeft && !isRight) continue;

			for await (const [fileName, fileHandle] of folderHandle.entries()) {
				if (fileHandle.kind !== "file") continue;

				if (!/\.(jpg|jpeg|png|webp)$/i.test(fileName)) continue;

				function getFrameNumber(fileName: string) {
					const match = fileName.match(/(\d+)(?!.*\d)/);
					return match ? Number(match[1]) : null;
				}

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
			}
		}

		// combine frame numbers
		const allFrameNumbers = Array.from(
			new Set([...leftFrames.keys(), ...rightFrames.keys()]),
		).sort((a, b) => a - b);

		const capturedFrames = allFrameNumbers.map((frameNumber) => ({
			left: leftFrames.get(frameNumber),
			right: rightFrames.get(frameNumber),
		}));

		useSessionStore.setState({ capturedFrames });

		return capturedFrames;
	}

	const findSessionFolder = async (fid: string) => {
		if (!parentFolder) return;
		const folder = await parentFolder.getDirectoryHandle(fid, {
			create: true,
		});
		setSessionFolder(folder);
	};

	useEffect(() => {
		loadCapturedFrames();
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

	async function capture() {
		try {
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
				state.capturedFrames.length + 1,
				state.leftFramePrefix,
			);
			const rightName = createFileName(
				state.capturedFrames.length + 1,
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

			addCapturedFrame({
				left: { name: leftFile.name, file: leftUrl },
				right: { name: rightFile.name, file: rightUrl },
			});
		} catch (e) {
			e?.message && toast.error(e.message);
		}
	}

	useHotkeys("space", () => {
		capture();
	});

	return (
		<div className="flex h-screen flex-col">
			<div className="grid grid-cols-[auto_300px] flex-1">
				<div className="flex flex-col">
					<div className="p-4 flex gap-2">
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
					<div className="grid grid-cols-2 px-4 gap-4 flex-1">
						<div className="relative">
							<CameraView
								title="Left Camera"
								stream={leftStream}
								overlay={
									onionSkin ? (previous?.left?.file ?? sourceFrame) : undefined
								}
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
								overlay={
									onionSkin ? (previous?.right?.file ?? sourceFrame) : undefined
								}
								ref={rightVideoRef}
								onCamChange={(d) => setDevicesStore(leftDeviceId, d)}
							/>
						</div>
					</div>
					<div className="flex flex-col items-center justify-center">
						<Button
							onClick={capture}
							size={"xl"}
							className={"w-fit px-20 h-20 text-xl"}
						>
							<CameraIcon className="size-8" /> Capture
						</Button>
						<div className="text-xs mt-2 flex items-center gap-2">
							<span
								className={cn(
									buttonVariants({ variant: "secondary" }),
									"size-6",
								)}
							>
								<Space />
							</span>
							<span>Hit "Space" to capture frame</span>
						</div>
					</div>
					<div className="p-4 space-y-4">
						<TimelineFrames frames={capturedFrames} />
					</div>
				</div>
				<div className="border-l flex flex-col flex-1 overflow-y-auto">
					<Settings />
				</div>
			</div>
			{/* <CaptureControls
                frame={frame}
                onionSkin={onionSkin}
                onCapture={capture}
                onToggleOnion={toggleOnion}
            /> */}

			{/* <div className="p-4 border-t">
                Frame #{frame}
                <TimelineFrames frames={capturedFrames} />
            </div> */}
		</div>
	);
}

function Settings() {
	const toggleOnion = useSessionStore((s) => s.toggleOnion);
	const onionSkinOpacity = useSessionStore((s) => s.onionSkinOpacity);
	const onionSkin = useSessionStore((s) => s.onionSkin);

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
				<SourceReference />
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
