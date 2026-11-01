const nativeOnly = async (..._args: unknown[]) => {
  throw new Error("Use an Android or iOS development build for GPS recording.");
};
export const startWorkout = nativeOnly;
export const pauseWorkout = nativeOnly;
export const resumeWorkout = nativeOnly;
export const finishWorkout = nativeOnly;
export const discardWorkout = nativeOnly;
export const enableBackground = nativeOnly;
export async function recoverRecording() {}
export function installRecorderLifecycle() {}
