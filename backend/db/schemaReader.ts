import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

export const loadQsSchema = async (): Promise<string> => {
    const schemaAsset = Asset.fromModule(require("@/assets/db/schema/QSSchema.sql"));
    await schemaAsset.downloadAsync();

    const fileUri = schemaAsset.localUri || schemaAsset.uri;
    if (!fileUri) {
        throw new Error("Unable to resolve QSSchema.sql asset URI.");
    }

    return FileSystem.readAsStringAsync(fileUri);
};
