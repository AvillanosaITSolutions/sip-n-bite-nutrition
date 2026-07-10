import * as ImagePicker from "expo-image-picker";
import type { UploadFile } from "../api";

/** Open the photo library and return a FormData-ready file descriptor, or null if cancelled. */
export async function pickImage(): Promise<UploadFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
  });
  if (result.canceled || !result.assets.length) return null;
  const asset = result.assets[0];
  const name = asset.fileName ?? asset.uri.split("/").pop() ?? "photo.jpg";
  const ext = name.split(".").pop()?.toLowerCase() ?? "jpg";
  return {
    uri: asset.uri,
    name,
    type: asset.mimeType ?? `image/${ext === "jpg" ? "jpeg" : ext}`,
  };
}
