import { Directory, File, Paths } from 'expo-file-system';

const IMAGE_DIR_NAME = 'trip_images';

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
 * Ensures the trip_images directory exists using the modern Directory API
 */
const getTripImagesDir = () => {
    // In SDK 54, Directory constructor can take a parent Directory or path string
    const tripImagesDir = new Directory(Paths.document, IMAGE_DIR_NAME);

    if (!tripImagesDir.exists) {
        tripImagesDir.create();
    }

    return tripImagesDir;
};

const fetchFromUnsplash = async (query: string): Promise<string | null> => {
    const accessKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
    if (!accessKey) return null;

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' india temple landmark')}&per_page=1&client_id=${accessKey}`
        );
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
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' india temple')}&per_page=1`,
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

    try {
        const tripImagesDir = getTripImagesDir();
        const imageFile = new File(tripImagesDir, filename);

        // 1. Check if cached (using .exists property)
        if (imageFile.exists) {
            return imageFile.uri;
        }

        // 2. Fetch from Unsplash
        let remoteUrl = await fetchFromUnsplash(location);

        // 3. Fallback to Pexels
        if (!remoteUrl) {
            remoteUrl = await fetchFromPexels(location);
        }

        // 4. Final fallback to LoremFlickr (don't cache this as it's a redirect service)
        if (!remoteUrl) {
            return `https://loremflickr.com/800/600/${encodeURIComponent(location)},india,temple/all`;
        }

        // 5. Download and cache using the static File.downloadFileAsync
        await File.downloadFileAsync(remoteUrl, imageFile);
        return imageFile.uri;

    } catch (error) {
        console.error("Image service error:", error);
        return `https://loremflickr.com/800/600/${encodeURIComponent(location)},india,temple/all`;
    }
};
