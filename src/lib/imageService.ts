import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const IMAGE_DIR_NAME = 'trip_images';
// Use explicit casting if types are missing in the legacy export, or rely on it being present at runtime.
// logger.ts used (FileSystem as any).cacheDirectory. We'll try standard access first, if it fails lint again we cast.
const imgDir = (FileSystem.documentDirectory || (FileSystem as any).documentDirectory) + IMAGE_DIR_NAME + '/';

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
};

/**
 * Ensures the trip_images directory exists
 */
const ensureDirExists = async () => {
    if (Platform.OS === 'web') return;
    const dirInfo = await FileSystem.getInfoAsync(imgDir);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(imgDir, { intermediates: true });
    }
};

const fetchFromUnsplash = async (query: string): Promise<string | null> => {
    const accessKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
    if (!accessKey) return null;

    try {
        const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${accessKey}`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].urls.regular;
        }
    } catch (error) {
        console.error("Unsplash fetch error:", error);
    }
    return null;
};

const fetchFromPexels = async (query: string): Promise<string | null> => {
    const apiKey = process.env.EXPO_PUBLIC_PEXELS_API_KEY;
    if (!apiKey) return null;

    try {
        const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`;
        const response = await fetch(
            searchUrl,
            {
                headers: {
                    Authorization: apiKey
                }
            }
        );
        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
            return data.photos[0].src.large;
        }
    } catch (error) {
        console.error("Pexels fetch error:", error);
    }
    return null;
};

export const fetchAndCacheImage = async (location: string): Promise<string> => {
    if (!location) return "https://loremflickr.com/800/600/travel,landscape";

    const filename = `${slugify(location)}.jpg`;
    const imageUri = imgDir + filename;

    try {
        // Skip caching on web
        if (Platform.OS === 'web') {
            // 1. Fetch from Unsplash
            let remoteUrl = await fetchFromUnsplash(location);

            // 2. Fallback to Pexels
            if (!remoteUrl) {
                remoteUrl = await fetchFromPexels(location);
            }

            // 3. Final fallback
            if (!remoteUrl) {
                return `https://loremflickr.com/800/600/${encodeURIComponent(location)},travel/all`;
            }
            return remoteUrl;
        }

        await ensureDirExists();

        // 1. Check if cached
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (fileInfo.exists) {
            return imageUri;
        }

        // 2. Fetch from Unsplash
        let remoteUrl = await fetchFromUnsplash(location);

        // 3. Fallback to Pexels
        if (!remoteUrl) {
            remoteUrl = await fetchFromPexels(location);
        }

        // 4. Final fallback to LoremFlickr
        if (!remoteUrl) {
            return `https://loremflickr.com/800/600/${encodeURIComponent(location)},travel/all`;
        }

        // 5. Download and cache
        await FileSystem.downloadAsync(remoteUrl, imageUri);
        return imageUri;

    } catch (error) {
        console.error("Image service error:", error);
        return `https://loremflickr.com/800/600/${encodeURIComponent(location)},travel/all`;
    }
};
