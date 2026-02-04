import { Dimensions, Platform, StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_ASPECT_RATIO = 1.586; // Standard credit card ratio

export const createStyles = (theme: Theme, hasStats?: boolean) => StyleSheet.create({
    cardContainer: {
        width: CARD_WIDTH,
        height: hasStats ? undefined : (CARD_WIDTH / CARD_ASPECT_RATIO),
        minHeight: hasStats ? (CARD_WIDTH / CARD_ASPECT_RATIO) * 1.05 : undefined, // Slightly taller for stats
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        ...theme.shadows.medium,
        ...Platform.select({
            web: {
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            },
            default: {
                shadowColor: '#000',
            }
        }),
        marginVertical: 10,
        alignSelf: 'center',
    },
    gradient: {
        flex: 1,
        padding: 20, // Reduced from 24 to give more vertical space
    },
    glassOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    decorationCircle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
    },
    decorationCircle2: {
        position: 'absolute',
        bottom: -80,
        left: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 'auto', // Pushes stats to the bottom
    },
    statItem: {
        flexDirection: 'column',
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    statValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    statValue: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
        fontWeight: '700',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bankInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bankIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    bankName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        fontStyle: 'italic',
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    typeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    middleRow: {
        marginTop: 12, // Reduced from 20
        flex: 1, // Allow this section to take available space
        justifyContent: 'center',
    },
    chipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    chip: {
        width: 44,
        height: 32,
        borderRadius: 6,
        backgroundColor: 'rgba(253, 230, 138, 0.8)', // Gold-ish
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(180, 83, 9, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipGrid: {
        width: 24,
        height: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        opacity: 0.4,
    },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontWeight: '500',
    },
    balanceAmount: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto',
    },
    accountNumber: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 2,
    },
    validContainer: {
        alignItems: 'flex-end',
    },
    validLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    validValue: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        fontWeight: '600',
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
    }
});
