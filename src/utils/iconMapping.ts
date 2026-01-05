import { MaterialCommunityIcons } from "@expo/vector-icons";

const LEGACY_ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    // MaterialIcons -> MaterialCommunityIcons mappings
    'restaurant': 'silverware-fork-knife',
    'payments': 'cash',
    'payment': 'cash',
    'local-cafe': 'coffee',
    'local-dining': 'silverware',
    'directions-car': 'car',
    'shopping-cart': 'cart',
    'shopping-bag': 'shopping',
    'flight': 'airplane',
    'flight-takeoff': 'airplane-takeoff',
    'health-and-safety': 'hospital-box',
    'local-hospital': 'hospital',
    'fitness-center': 'dumbbell',
    'school': 'school',
    'local-grocery-store': 'cart-outline',
    'checkroom': 'hanger',
    'sports-esports': 'controller-classic',
    'sports-bar': 'glass-mug-variant',
    'local-bar': 'glass-cocktail',
    'add-shopping-cart': 'cart-plus',
    'account-balance': 'bank',
    'account-balance-wallet': 'wallet',
    'attach-money': 'currency-inr',
    'trending-up': 'trending-up',
    'trending-down': 'trending-down',
    'arrow-back-ios': 'chevron-left',
    'arrow-forward-ios': 'chevron-right',
    'add': 'plus',
    'close': 'close',
    'check': 'check',
    'edit': 'pencil',
    'delete': 'delete',
    'search': 'magnify',
    'settings': 'cog',
    'home': 'home',
    'person': 'account',
    'group': 'account-group',
    'groups': 'account-group',
    'notifications': 'bell',
    'mail': 'email',
    'lock': 'lock',
    'visibility': 'eye',
    'visibility-off': 'eye-off',
    // Add more as needed based on old usage
    'category': 'shape',
    'work': 'briefcase',
    'savings': 'piggy-bank'
};

/**
 * Returns a valid MaterialCommunityIcons name.
 * If the provided name is a legacy MaterialIcons name, it maps it to the MCI equivalent.
 * If no mapping exists, it returns the original name (assuming it's already correct or accepts failure gracefully).
 */
export const getSafeIconName = (iconName: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    if (!iconName) return 'help-circle';

    // Check if it's already a valid MCI name (simple check can't verify all 7000+ icons efficiently without a huge list, 
    // but we prioritize the legacy map first).

    if (LEGACY_ICON_MAP[iconName]) {
        return LEGACY_ICON_MAP[iconName];
    }

    return iconName as keyof typeof MaterialCommunityIcons.glyphMap;
};
