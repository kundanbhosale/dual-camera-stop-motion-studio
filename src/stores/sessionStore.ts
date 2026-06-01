import { del, get, set } from "idb-keyval";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const idbStorage = {
	getItem: async (name: string) => {
		return (await get(name)) ?? null;
	},

	setItem: async (name: string, value: unknown) => {
		await set(name, value);
	},

	removeItem: async (name: string) => {
		await del(name);
	},
};

export interface SessionState {
	onionSkin: boolean;
	onionSkinOpacity: number;
	sourceFrame: string;
	leftFramePrefix: string;
	rightFramePrefix: string;

	leftFolderName: string;
	rightFolderName: string;

	leftDeviceId?: string;
	rightDeviceId?: string;

	parentFolder?: FileSystemDirectoryHandle;

	capturedFrames: {
		left?: { name: string; file: string };
		right?: { name: string; file: string };
	}[];

	setParentFolder: (handle: FileSystemDirectoryHandle) => void;

	setDevices: (left?: string, right?: string) => void;

	toggleOnion: () => void;

	addCapturedFrame: (frame: SessionState["capturedFrames"][number]) => void;
}

export const useSessionStore = create<SessionState>()(
	persist(
		(set) => ({
			onionSkin: true,
			onionSkinOpacity: 0.5,
			sourceFrame: "",
			leftFramePrefix: "L",
			rightFramePrefix: "R",

			leftFolderName: "Left Cam",
			rightFolderName: "Right Cam",

			capturedFrames: [],

			setDevices: (left, right) =>
				set({
					leftDeviceId: left,
					rightDeviceId: right,
				}),

			setParentFolder: (handle) =>
				set({
					parentFolder: handle,
				}),

			toggleOnion: () =>
				set((s) => ({
					onionSkin: !s.onionSkin,
				})),

			addCapturedFrame: (frame) =>
				set((s) => ({
					capturedFrames: [...s.capturedFrames, frame],
				})),
		}),
		{
			name: "dual-cam-store",
			storage: idbStorage,
			partialize: (state) => ({
				onionSkin: state.onionSkin,
				onionSkinOpacity: state.onionSkinOpacity,
				leftFramePrefix: state.leftFramePrefix,
				rightFramePrefix: state.rightFramePrefix,
				leftFolderName: state.leftFolderName,
				rightFolderName: state.rightFolderName,
				leftDeviceId: state.leftDeviceId,
				rightDeviceId: state.rightDeviceId,
				parentFolder: state.parentFolder,
			}),
		},
	),
);
