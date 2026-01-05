import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface SubCategory {
    name: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export interface CategoryDef {
    name: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    type: 'income' | 'expense';
    subCategories?: SubCategory[];
}

export const DEFAULT_CATEGORIES: CategoryDef[] = [
    // Expense Categories
    {
        name: 'Transport',
        icon: 'car',
        color: '#1E90FF',
        type: 'expense',
        subCategories: [
            { name: 'Fuel', icon: 'gas-station' },
            { name: 'Parking & Tolls', icon: 'parking' },
            { name: 'Maintenance & Service', icon: 'wrench' },
            { name: 'Public Transport', icon: 'bus' },
            { name: 'Taxi / Cab', icon: 'taxi' },
            { name: 'Car Insurance', icon: 'file-document' },
            { name: 'Vehicle Accessories', icon: 'car-battery' },
            { name: 'Car Wash', icon: 'water-pump' },
        ]
    },
    {
        name: 'Food & Dining',
        icon: 'silverware-fork-knife',
        color: '#FF9800',
        type: 'expense',
        subCategories: [
            { name: 'Restaurants', icon: 'silverware' },
            { name: 'Coffee & Cafes', icon: 'coffee' },
            { name: 'Fast Food', icon: 'hamburger' },
            { name: 'Alcohol / Bars', icon: 'glass-cocktail' },
            { name: 'Breakfast / Brunch', icon: 'egg-fried' },
            { name: 'Lunch', icon: 'food' },
            { name: 'Dinner', icon: 'food-turkey' },
        ]
    },
    {
        name: 'Groceries',
        icon: 'cart-outline',
        color: '#8BC34A',
        type: 'expense',
        subCategories: [
            { name: 'Fruits & Vegetables', icon: 'food-apple' },
            { name: 'Meat, Fish & Dairy', icon: 'food-steak' },
            { name: 'Pantry & Staples', icon: 'shaker' }, // broad interpretation
            { name: 'Beverages', icon: 'cup-water' },
            { name: 'Household Supplies', icon: 'paper-roll' },
        ]
    },
    {
        name: 'Shopping',
        icon: 'shopping',
        color: '#9C27B0',
        type: 'expense',
        subCategories: [
            { name: 'Clothing', icon: 'tshirt-crew' },
            { name: 'Electronics', icon: 'laptop' },
            { name: 'Home & Garden', icon: 'flower' },
            { name: 'Beauty & Personal Care', icon: 'lipstick' },
            { name: 'Books & Stationery', icon: 'book-open-variant' },
            { name: 'Shoes & Accessories', icon: 'shoe-heel' },
            { name: 'Sports & Outdoors', icon: 'basketball' },
        ]
    },
    {
        name: 'Utilities',
        icon: 'flash',
        color: '#FFC107',
        type: 'expense',
        subCategories: [
            { name: 'Electricity', icon: 'lightning-bolt' },
            { name: 'Water', icon: 'water' },
            { name: 'Internet', icon: 'wifi' },
            { name: 'Mobile / Phone', icon: 'cellphone' },
            { name: 'Gas / Heating', icon: 'fire' },
            { name: 'Cable / TV', icon: 'television-classic' },
            { name: 'Garbage / Recycling', icon: 'delete' },
        ]
    },
    {
        name: 'Health',
        icon: 'doctor',
        color: '#4CAF50',
        type: 'expense',
        subCategories: [
            { name: 'Doctor & Medical', icon: 'stethoscope' },
            { name: 'Pharmacy', icon: 'pill' },
            { name: 'Gym & Fitness', icon: 'dumbbell' },
            { name: 'Health Insurance', icon: 'shield-plus' },
            { name: 'Dentist', icon: 'tooth' },
            { name: 'Mental Health', icon: 'brain' },
        ]
    },
    {
        name: 'Entertainment',
        icon: 'movie',
        color: '#E91E63',
        type: 'expense',
        subCategories: [
            { name: 'Movies', icon: 'filmstrip' },
            { name: 'Games', icon: 'controller-classic' },
            { name: 'Streaming', icon: 'youtube-tv' },
            { name: 'Concerts & Events', icon: 'ticket' },
            { name: 'Hobbies', icon: 'palette' },
            { name: 'Nightlife', icon: 'music-note' },
        ]
    },
    {
        name: 'Travel',
        icon: 'airplane',
        color: '#03A9F4',
        type: 'expense',
        subCategories: [
            { name: 'Flights', icon: 'airplane-takeoff' },
            { name: 'Hotels', icon: 'bed' },
            { name: 'Car Rental', icon: 'car-key' },
            { name: 'Sightseeing', icon: 'camera' },
            { name: 'Travel Insurance', icon: 'file-certificate' },
            { name: 'Visa & Passport', icon: 'passport' },
        ]
    },
    {
        name: 'Education',
        icon: 'school',
        color: '#FF5722',
        type: 'expense',
        subCategories: [
            { name: 'Tuition Fees', icon: 'bank' },
            { name: 'Books & Supplies', icon: 'book' },
            { name: 'Online Courses', icon: 'laptop-account' },
        ]
    },
    {
        name: 'Personal Care',
        icon: 'spa',
        color: '#F06292',
        type: 'expense',
        subCategories: [
            { name: 'Hair Salon', icon: 'scissors-cutting' },
            { name: 'Spa & Massage', icon: 'spa' },
            { name: 'Cosmetics', icon: 'lipstick' },
        ]
    },
    {
        name: 'Housing',
        icon: 'home',
        color: '#795548',
        type: 'expense',
        subCategories: [
            { name: 'Rent / Mortgage', icon: 'home-city' },
            { name: 'Property Tax', icon: 'file-percent' },
            { name: 'Home Insurance', icon: 'home-lock' },
            { name: 'Repairs', icon: 'hammer-wrench' },
            { name: 'Services', icon: 'broom' },
        ]
    },
    {
        name: 'Gifts & Donations',
        icon: 'gift',
        color: '#E040FB',
        type: 'expense',
        subCategories: [
            { name: 'Charity', icon: 'heart' },
            { name: 'Birthday Gifts', icon: 'cake' },
            { name: 'Wedding', icon: 'ring' },
            { name: 'Holiday Gifts', icon: 'pine-tree' },
        ]
    },
    {
        name: 'Family',
        icon: 'account-group',
        color: '#FF9800',
        type: 'expense',
        subCategories: [
            { name: 'Childcare', icon: 'baby-carriage' },
            { name: 'Baby Supplies', icon: 'baby-bottle' },
            { name: 'School Activities', icon: 'school' },
            { name: 'Toys', icon: 'toy-brick' },
        ]
    },
    {
        name: 'Pets',
        icon: 'paw',
        color: '#795548',
        type: 'expense',
        subCategories: [
            { name: 'Pet Food', icon: 'food-drumstick' },
            { name: 'Vet & Medical', icon: 'medical-bag' },
            { name: 'Grooming', icon: 'content-cut' },
            { name: 'Toys & Accessories', icon: 'tennis-ball' },
        ]
    },
    {
        name: 'Investment',
        icon: 'chart-line',
        color: '#009688',
        type: 'expense',
        subCategories: [
            { name: 'Stocks', icon: 'finance' },
            { name: 'SIP', icon: 'calendar-clock' },
            { name: 'Gold Plan', icon: 'ring' },
            { name: 'Mutual Funds', icon: 'chart-pie' },
        ]
    },
    // Subscriptions & Others without strict subcategories for now, or add generic ones
    { name: 'Subscriptions', icon: 'autorenew', color: '#9E9E9E', type: 'expense' },
    { name: 'Bill Payment', icon: 'file-document-outline', color: '#607D8B', type: 'expense' },
    { name: 'Insurance', icon: 'shield-check', color: '#607D8B', type: 'expense' }, // General insurance if not covered above
    {
        name: 'Loans & Debt',
        icon: 'handshake',
        color: '#FF5722',
        type: 'expense',
        subCategories: [
            { name: 'Loan Disbursement', icon: 'format-list-bulleted-type' },
            { name: 'EMI Payment', icon: 'calendar-clock' },
            { name: 'Debt Repayment', icon: 'cash-check' },
        ]
    },

    // Income Categories
    {
        name: 'Salary',
        icon: 'cash-multiple',
        color: '#4CAF50',
        type: 'income',
        subCategories: [
            { name: 'Full-time Pay', icon: 'briefcase-check' },
            { name: 'Bonus', icon: 'star-circle' },
            { name: 'Commission', icon: 'percent' },
        ]
    },
    { name: 'Freelance', icon: 'briefcase', color: '#00BCD4', type: 'income' },
    {
        name: 'Investments',
        icon: 'trending-up',
        color: '#3F51B5',
        type: 'income',
        subCategories: [
            { name: 'Dividends', icon: 'chart-pie' },
            { name: 'Interest', icon: 'bank' },
            { name: 'Stock Sales', icon: 'finance' },
            { name: 'Crypto', icon: 'bitcoin' },
        ]
    },
    { name: 'Rental', icon: 'home-city', color: '#673AB7', type: 'income' },
    { name: 'Gifts', icon: 'gift', color: '#E040FB', type: 'income' },
    {
        name: 'Other',
        icon: 'dots-horizontal',
        color: '#9E9E9E',
        type: 'income'
    },
    {
        name: 'Opening Balance',
        icon: 'wallet-outline',
        color: '#4CAF50',
        type: 'income'
    },
    {
        name: 'Loans & Debt',
        icon: 'handshake',
        color: '#FF5722',
        type: 'income',
        subCategories: [
            { name: 'Loan Received', icon: 'wallet-plus' },
            { name: 'Debt Recovery', icon: 'cash-plus' },
            { name: 'EMI Received', icon: 'calendar-check' },
        ]
    }
];
