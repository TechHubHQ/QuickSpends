
const IMGDB_KEY = "3ce715935bd767c19ccd03d57bf0ea5b";
const IMGDB_URL = "https://api.imgbb.com/1/upload";

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
};


const uploadToImgBB = async (imageUrl: string): Promise<string | null> => {
    try {
        const formData = new FormData();
        formData.append('image', imageUrl);

        const response = await fetch(`${IMGDB_URL}?key=${IMGDB_KEY}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (data.success) {
            return data.data.url;
        } else {
            console.error("ImgBB upload failed:", data.error);
            return null;
        }
    } catch (error) {
        console.error("ImgBB upload error:", error);
        return null;
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



    try {
        // 1. Fetch from Unsplash
        let remoteUrl = await fetchFromUnsplash(location);

        // 2. Fallback to Pexels
        if (!remoteUrl) {
            remoteUrl = await fetchFromPexels(location);
        }

        // 3. Fallback to LoremFlickr if no source found
        if (!remoteUrl) {
            return `https://loremflickr.com/800/600/${encodeURIComponent(location)},travel/all`;
        }

        // 4. Upload to ImgBB to get a persistent public URL
        const imgBbUrl = await uploadToImgBB(remoteUrl);
        if (imgBbUrl) {
            return imgBbUrl;
        }

        // 5. If upload fails, return the original remote URL (better than nothing, though hotlinking might fail)
        return remoteUrl;

    } catch (error) {
        console.error("Image service error:", error);
        return `https://loremflickr.com/800/600/${encodeURIComponent(location)},travel/all`;
    }
};
