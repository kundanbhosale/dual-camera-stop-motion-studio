import { CameraIcon, FlyingSaucerIcon, PlusIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { directoryExists } from "@/lib/dirExists";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/sessionStore";
import siteconfig from "../../siteconfig";
export const Route = createFileRoute("/")({
	component: RouteComponent,
});

type SessionItem = {
	name: string;
	createdAt?: number;
	leftFrames: number;
	sourceFrames: number;
	rightFrames: number;
};

function RouteComponent() {
	const [list, setSessionList] = useState<SessionItem[]>([]);
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const parentFolder = useSessionStore((s) => s.parentFolder);

	async function getSessions(): Promise<void> {
		const state = useSessionStore.getState();
		if (!parentFolder) return;
		const exist = await directoryExists(parentFolder);
		if (!exist) return;
		const sessions: SessionItem[] = [];

		for await (const [sessionName, sessionHandle] of parentFolder.entries()) {
			if (sessionHandle.kind !== "directory") {
				continue;
			}

			let leftFrames = 0;
			let rightFrames = 0;
			let sourceFrames = 0;

			let createdAt: number | undefined;

			// left-cam / right-cam
			for await (const [
				cameraFolderName,
				cameraFolderHandle,
			] of sessionHandle.entries()) {
				if (cameraFolderHandle.kind !== "directory") {
					continue;
				}

				const isLeft = cameraFolderName === state.leftFolderName;

				const isRight = cameraFolderName === state.rightFolderName;
				const isSource = cameraFolderName === state.sourceFolderName;

				// frame files
				for await (const [
					fileName,
					fileHandle,
				] of cameraFolderHandle.entries()) {
					if (fileHandle.kind !== "file") {
						continue;
					}

					if (!/\.(jpg|jpeg|png|webp)$/i.test(fileName)) {
						continue;
					}

					if (isLeft) {
						leftFrames++;
					}

					if (isRight) {
						rightFrames++;
					}

					if (isSource) {
						sourceFrames++;
					}

					// approximate session date
					if (!createdAt) {
						try {
							const file = await fileHandle.getFile();

							createdAt = file.lastModified;
						} catch {
							//
						}
					}
				}
			}

			sessions.push({
				name: sessionName,
				createdAt: createdAt || Date.now(),
				leftFrames,
				rightFrames,
				sourceFrames,
			});
		}

		// newest first
		sessions.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

		setSessionList(sessions);
	}
	useEffect(() => {
		getSessions();
	}, [parentFolder]);
	return (
		<div className="flex h-screen overflow-hidden flex-col items-center justify-center m-auto">
			<div className="w-full bg-primary">
				<div className="border-b flex justify-between p-4 items-center">
					<h1 className="text-2xl leading-tight tracking-tighter font-bold font-mono text-start uppercase bg-primary text-primary-foreground px-4 py-2 w-fit">
						{siteconfig.name}
					</h1>

					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger
							className={cn(buttonVariants({ variant: "default" }))}
						>
							<PlusIcon className="size-5" /> New Session
						</DialogTrigger>
						<DialogContent>
							<DialogTitle>New Session</DialogTitle>
							<form
								className="space-y-4 flex flex-col"
								onSubmit={(e) => {
									e.preventDefault();

									const formData = new FormData(e.currentTarget);

									const sessionName = formData.get("sessionName");

									if (typeof sessionName !== "string" || !sessionName.trim()) {
										return;
									}

									router.navigate({
										to: "/session/$id",
										params: {
											id: encodeURIComponent(sessionName.trim()),
										},
									});
								}}
							>
								<Input placeholder="Session Name" name="sessionName" />
								<Button
									type="submit"
									className={cn(buttonVariants({ size: "lg" }))}
								>
									Create
								</Button>
							</form>
						</DialogContent>
					</Dialog>
				</div>
				<h2 className="text-center p-2 border-x bg-muted text-sm tracking-snug">
					Browser-based stop motion software with dual camera support, onion
					skin overlays, reference image workflow, frame sequencing, and direct
					local file saving.
				</h2>
			</div>

			<div className="flex flex-col w-full border divide-y flex-1 overflow-y-auto">
				{list.length === 0 ? (
					<Empty className="my-auto">
						<EmptyContent>
							<EmptyMedia variant={"default"} className="size-20">
								<FlyingSaucerIcon className="size-14" />
							</EmptyMedia>
							<EmptyHeader>
								<EmptyTitle>No Sessions Found!</EmptyTitle>
							</EmptyHeader>
							<EmptyDescription>
								Click on button below to create new camera capture session.
							</EmptyDescription>
							<Button
								onClick={() => setOpen(true)}
								variant={"outline"}
								className={"px-12"}
							>
								New Session
							</Button>
						</EmptyContent>
					</Empty>
				) : (
					<>
						<div className="flex justify-between items-center p-4">
							<p className="font-bold flex items-center gap-1">
								<CameraIcon className="size-5" /> Recent Sessions
							</p>
							{/* <Button
								onClick={() => setOpen(true)}
								variant={"outline"}
								className={"px-12"}
							>
								New Session
							</Button> */}
						</div>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
							{list.map((m, i) => (
								<Link
									key={m.name}
									to="/session/$id"
									params={{ id: encodeURIComponent(m.name) }}
									className="flex flex-col gap-2 justify-between font-medium text-base p-4 items-start"
								>
									<div className="bg-accent size-full flex flex-col p-4">
										<div className="mb-4">
											<span className="block font-bold">{m.name}</span>
											<span className="text-xs">
												Updated&nbsp;
												{formatDistanceToNow(new Date(m.createdAt as any), {
													addSuffix: true,
												})}
											</span>
										</div>
										<div className="text-xs grid grid-cols-3 gap-2">
											<span className="flex flex-col">
												<span className="text-2xl font-bold">
													{m.sourceFrames}
												</span>
												<span>Source</span>
											</span>
											<span className="flex flex-col">
												<span className="text-2xl font-bold">
													{m.leftFrames}
												</span>
												<span>Left </span>
											</span>
											<span className="flex flex-col">
												<span className="text-2xl font-bold">
													{m.rightFrames}
												</span>
												<span>Right </span>
											</span>
										</div>
									</div>
								</Link>
							))}
						</div>
					</>
				)}
			</div>
			<div className="w-full">
				<p className="text-sm text-center p-1 border-x bg-muted">
					Supports only on latest Chrome version
				</p>
			</div>
		</div>
	);
}
