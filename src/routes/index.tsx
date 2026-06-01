import {
	ArrowRightIcon,
	FlyingSaucerIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/sessionStore";
export const Route = createFileRoute("/")({
	component: RouteComponent,
});

type SessionItem = {
	name: string;
	createdAt?: number;
	totalFrames: number;
	leftFrames: number;
	rightFrames: number;
};

function RouteComponent() {
	const [list, setSessionList] = useState<SessionItem[]>([]);
	const router = useRouter();

	const parentFolder = useSessionStore((s) => s.parentFolder);

	async function getSessions(): Promise<void> {
		if (!parentFolder) return;

		const sessions: SessionItem[] = [];

		for await (const [sessionName, sessionHandle] of parentFolder.entries()) {
			if (sessionHandle.kind !== "directory") {
				continue;
			}

			let leftFrames = 0;
			let rightFrames = 0;

			let createdAt: number | undefined;

			// left-cam / right-cam
			for await (const [
				cameraFolderName,
				cameraFolderHandle,
			] of sessionHandle.entries()) {
				if (cameraFolderHandle.kind !== "directory") {
					continue;
				}

				const isLeft = cameraFolderName.toLowerCase().includes("left");

				const isRight = cameraFolderName.toLowerCase().includes("right");

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
				totalFrames: leftFrames + rightFrames,
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
		<div className="flex h-screen overflow-hidden flex-col items-center justify-center container m-auto px-4">
			<div className="w-full">
				<div className="border-x border-b flex justify-between p-4 items-center">
					<h1 className="text-2xl font-black font-sans w-full text-start">
						TWIN LENS
					</h1>
					<Dialog>
						<DialogTrigger
							className={cn(buttonVariants({ size: "lg", variant: "default" }))}
						>
							<PlusIcon className="size-6" /> Create New Session
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
				<p className="text-sm text-center p-1 border-x bg-muted">
					Supports only on latest Chrome version
				</p>
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
						</EmptyContent>
					</Empty>
				) : (
					<>
						{list.map((m, i) => (
							<Link
								key={m.name}
								to="/session/$id"
								params={{ id: encodeURIComponent(m.name) }}
								className="flex gap-2 justify-between font-medium text-base p-4 hover:bg-muted items-center"
							>
								<span>
									<span className="block">{m.name}</span>
									<span className="block text-xs text-muted-foreground">
										{formatDistanceToNow(new Date(m.createdAt as any), {
											addSuffix: true,
										})}
									</span>
								</span>
								<span>
									<ArrowRightIcon weight="bold" />
								</span>
							</Link>
						))}
					</>
				)}
			</div>
		</div>
	);
}
