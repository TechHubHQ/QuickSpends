import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { QSButton } from '../src/components/QSButton';
import { QSHeader } from '../src/components/QSHeader';
import { useTheme } from '../src/theme/ThemeContext';
import { UpcomingBill, useUpcomingBills } from '../src/hooks/useUpcomingBills';
import { useCategories } from '../src/hooks/useCategories';
import { useAccounts, type Account } from '../src/hooks/useAccounts';
import { useAuth } from '../src/context/AuthContext';
import { getSafeIconName } from '../src/utils/iconMapping';

const UpcomingBillsScreen = () => {
  const { theme } = useTheme();
  const { bills, fetchBills } = useUpcomingBills();
  const { categories } = useCategories();
  const { getAccountsByUser } = useAccounts();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => {
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [bills]);

  const now = useMemo(() => new Date(), [bills]);
  const nextWeek = useMemo(() => new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), [now]);

  const overdueBills = sortedBills.filter((bill) => {
    const dueDate = new Date(bill.due_date);
    return bill.is_active && dueDate < now;
  });

  const dueSoonBills = sortedBills.filter((bill) => {
    const dueDate = new Date(bill.due_date);
    return bill.is_active && dueDate >= now && dueDate <= nextWeek;
  });

  const upcomingBills = sortedBills.filter((bill) => {
    const dueDate = new Date(bill.due_date);
    return bill.is_active && dueDate > nextWeek;
  });

  const completedBills = sortedBills.filter((bill) => !bill.is_active);

  useEffect(() => {
    const loadAccounts = async () => {
      if (!user) return;
      const data = await getAccountsByUser(user.id);
      setAccounts(data);
    };

    loadAccounts();
  }, [user, getAccountsByUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchBills(),
      user ? getAccountsByUser(user.id).then(setAccounts) : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  const getBillCategory = (bill: UpcomingBill) => {
    if (!categories || categories.length === 0) return undefined;
    const subCategory = bill.sub_category_id
      ? categories.find(c => c.id === bill.sub_category_id)
      : undefined;
    if (subCategory) return subCategory;
    return bill.category_id
      ? categories.find(c => c.id === bill.category_id)
      : undefined;
  };

  const getCategoryName = (bill: UpcomingBill) => {
    const category = getBillCategory(bill);
    return category?.name || 'Unknown';
  };

  const getAccountName = (accountId?: string) => {
    if (!accountId) return 'No Account';
    if (!accounts || accounts.length === 0) return 'Loading...';
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getBillIcon = (bill: UpcomingBill) => {
    const category = getBillCategory(bill);
    const fallbackIcon = bill.bill_type === 'transfer' ? 'bank-transfer' : 'file-document-outline';
    return getSafeIconName(category?.icon || fallbackIcon);
  };

  const getBillIconColor = (bill: UpcomingBill) => {
    const category = getBillCategory(bill);
    if (category?.color) return category.color;
    return getBillTypeColor(bill);
  };

  const getBillTypeColor = (bill: UpcomingBill) =>
    bill.bill_type === 'transfer' ? theme.colors.info : theme.colors.error;

  const renderBillItem = ({ item }: { item: UpcomingBill }) => {
    const isOverdue = new Date(item.due_date) < new Date();
    const daysUntilDue = Math.ceil((new Date(item.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const accentColor = getBillIconColor(item);

    return (
      <Pressable
        style={[
          {
            backgroundColor: accentColor + (item.is_active ? "12" : "0D"),
            borderRadius: theme.borderRadius.m,
            padding: theme.spacing.m,
            marginHorizontal: theme.spacing.m,
            marginVertical: theme.spacing.s,
            borderWidth: 1,
            borderColor: accentColor + "2A",
            borderLeftWidth: 4,
            borderLeftColor: accentColor,
            opacity: item.is_active ? 1 : 0.72,
          },
          theme.shadows.small,
        ]}
        onPress={() => router.push(`/bill-details/${item.id}`)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: theme.borderRadius.m,
                backgroundColor: `${accentColor}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.m,
              }}
            >
              <MaterialCommunityIcons
                name={getBillIcon(item)}
                size={24}
                color={accentColor}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: theme.typography.body.fontSize,
                  fontWeight: '600',
                  color: theme.colors.text,
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              
              <Text
                style={{
                  fontSize: theme.typography.caption.fontSize,
                  color: theme.colors.textSecondary,
                  marginBottom: 2,
                }}
              >
                {getCategoryName(item)} • {getAccountName(item.account_id)}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: theme.typography.caption.fontSize,
                    color: !item.is_active
                      ? theme.colors.textTertiary
                      : isOverdue
                        ? theme.colors.error
                        : theme.colors.textTertiary,
                    fontWeight: !item.is_active || isOverdue ? '600' : '400',
                  }}
                >
                  {!item.is_active ? 'Completed' : isOverdue ? 'Overdue' : formatDate(item.due_date)}
                </Text>
                {item.is_active && !isOverdue && daysUntilDue <= 3 && (
                  <View
                    style={{
                      backgroundColor: theme.colors.warning,
                      borderRadius: theme.borderRadius.s,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      marginLeft: theme.spacing.s,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: theme.colors.onPrimary,
                        fontWeight: '600',
                      }}
                    >
                      DUE SOON
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: theme.typography.body.fontSize,
                fontWeight: '700',
                color: theme.colors.text,
                marginBottom: 2,
              }}
            >
              ₹{item.amount.toLocaleString()}
            </Text>

            {item.bill_type === 'transfer' && (
              <Text
                style={{
                  fontSize: theme.typography.caption.fontSize,
                  color: accentColor,
                  fontWeight: '500',
                }}
              >
                Transfer
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xxl * 2,
      }}
    >
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: `${theme.colors.primary}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.l,
        }}
      >
        <MaterialCommunityIcons
          name="calendar-clock"
          size={60}
          color={theme.colors.primary}
        />
      </View>
      
      <Text
        style={{
          fontSize: theme.typography.h3.fontSize,
          fontWeight: theme.typography.h3.fontWeight,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: theme.spacing.s,
        }}
      >
        No Upcoming Bills
      </Text>
      
      <Text
        style={{
          fontSize: theme.typography.body.fontSize,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: theme.spacing.xl,
        }}
      >
        Add your upcoming bills to stay on top of your payments and never miss a due date.
      </Text>
      
      <QSButton
        title="Add Your First Bill"
        onPress={() => router.push('/add-upcoming-bill')}
        style={{ paddingHorizontal: theme.spacing.xl }}
      />
    </View>
  );

  const renderSectionHeader = (title: string, count: number, color: string) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
        marginTop: theme.spacing.m,
      }}
    >
      <View
        style={{
          width: 4,
          height: 16,
          backgroundColor: color,
          borderRadius: 2,
          marginRight: theme.spacing.s,
        }}
      />
      <Text
        style={{
          fontSize: theme.typography.bodySmall.fontSize,
          fontWeight: '600',
          color: theme.colors.text,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {title} ({count})
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <QSHeader
        title="Upcoming Bills"
        showBack
        onBackPress={() => router.back()}
        rightElement={
          <Pressable
            onPress={() => router.push('/add-upcoming-bill')}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              padding: theme.spacing.s,
            })}
          >
            <MaterialCommunityIcons
              name="plus"
              size={24}
              color={theme.colors.primary}
            />
          </Pressable>
        }
      />

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {overdueBills.length > 0 && (
              <>
                {renderSectionHeader('Overdue', overdueBills.length, theme.colors.error)}
                {overdueBills.map(bill => (
                  <View key={bill.id}>
                    {renderBillItem({ item: bill })}
                  </View>
                ))}
              </>
            )}

            {dueSoonBills.length > 0 && (
              <>
                {renderSectionHeader('Due Soon', dueSoonBills.length, theme.colors.warning)}
                {dueSoonBills.map(bill => (
                  <View key={bill.id}>
                    {renderBillItem({ item: bill })}
                  </View>
                ))}
              </>
            )}

            {upcomingBills.length > 0 && (
              <>
                {renderSectionHeader('Upcoming', upcomingBills.length, theme.colors.info)}
                {upcomingBills.map(bill => (
                  <View key={bill.id}>
                    {renderBillItem({ item: bill })}
                  </View>
                ))}
              </>
            )}

            {completedBills.length > 0 && (
              <>
                {renderSectionHeader('Completed', completedBills.length, theme.colors.textTertiary)}
                {completedBills.map(bill => (
                  <View key={bill.id}>
                    {renderBillItem({ item: bill })}
                  </View>
                ))}
              </>
            )}
          </>
        }
        ListEmptyComponent={bills.length === 0 ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={bills.length === 0 ? { flex: 1 } : { paddingBottom: theme.spacing.xl }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default UpcomingBillsScreen;
