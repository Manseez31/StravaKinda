import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
export async function shareFile(
  name: string,
  contents: string,
  mimeType: string,
) {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is unavailable on this platform.");
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(contents);
  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: "Export your data",
  });
}
