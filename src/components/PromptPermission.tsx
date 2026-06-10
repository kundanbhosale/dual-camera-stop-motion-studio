import { FolderIcon, PencilLineIcon, WarningIcon } from "@phosphor-icons/react";
import React, { useEffect, useMemo, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { directoryExists } from "@/lib/dirExists";
import { parentFolderPick } from "@/lib/pickFolder";
import { verifyPermission } from "@/lib/verifyPermissions";
import { useSessionStore } from "@/stores/sessionStore";

export default function PromptPermission() {
	const parentFolder = useSessionStore((s) => s.parentFolder);
	const [open, setOpen] = useState(false);
	const [hasPerms, setHasPerms] = useState(true);

	const handlePerms = () => {
		if (!parentFolder) return;
		verifyPermission(parentFolder).then((p) => {
			setHasPerms(p);
		});
	};
	useEffect(() => {
		directoryExists(parentFolder);
		const timer = setTimeout(() => {
			handlePerms();
		}, 500);
		return () => clearTimeout(timer);
	}, [parentFolder]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (!parentFolder || !hasPerms) return setOpen(true);
			setOpen(false);
		}, 500);
		return () => clearTimeout(timer);
	}, [parentFolder, hasPerms]);

	const data = {
		no_perm: {
			media: <WarningIcon />,

			title: "File Editing Permission Denied!",
			desc: "Please allow file editing permission in order to use this app.",
			action: (
				<AlertDialogAction onClick={handlePerms}>
					Grant Permission
				</AlertDialogAction>
			),
		},
		no_folder: {
			media: <FolderIcon />,
			title: "Select Folder",
			desc: "	Select folder to save sessions & frames captured while using this app.",
			action: (
				<AlertDialogAction onClick={() => parentFolderPick()}>
					Select Folder
				</AlertDialogAction>
			),
		},
	};
	const curr = useMemo(() => {
		return !hasPerms ? data["no_perm"] : data["no_folder"];
	}, [hasPerms, parentFolder]);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogMedia>{curr.media}</AlertDialogMedia>
					<AlertDialogTitle>{curr.title}</AlertDialogTitle>
					<AlertDialogDescription>{curr.desc}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="group-data-[size=sm]/alert-dialog-content:grid-cols-1">
					{curr.action}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
