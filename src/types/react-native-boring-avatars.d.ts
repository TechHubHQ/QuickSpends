declare module 'react-native-boring-avatars' {

    export interface AvatarProps {
        size?: number | string;
        name?: string;
        variant?: 'beam' | 'bauhaus' | 'ring' | 'sunset' | 'pixel' | 'marble';
        colors?: string[];
        square?: boolean;
    }

    const Avatar: React.FC<AvatarProps>;
    export default Avatar;
}
