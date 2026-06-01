import { create } from "zustand";

interface State {
	devices: MediaDeviceInfo[];
	setDevices: (s: MediaDeviceInfo[]) => void;
}
export const useDevices = create<State>((set) => ({
	devices: [],
	setDevices: (s) => {
		set({ devices: s });
	},
}));

export async function loadWebCamDevices() {
	await navigator.mediaDevices.getUserMedia({
		video: true,
	});

	const all = await navigator.mediaDevices.enumerateDevices();

	useDevices.setState({
		devices: all.filter((d) => d.kind === "videoinput"),
	});
}
