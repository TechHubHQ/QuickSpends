import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { QSButton } from '../src/components/QSButton';
import { QSHeader } from '../src/components/QSHeader';
import { useTheme } from '../src/theme/ThemeContext';
import { UpcomingBill, useUpcomingBills } from '../src/hooks/useUpcomingBills';
import { useCategories } from '../src/hooks/useCategories';
import { useAccounts } from '../src/hooks/useAccounts';

const UpcomingBillsScreen = () => {
  const { theme } = useTheme();
  const { bills, loading, deleteBill, fetchBills, getUpcomingBills, getOverdueBills } = useUpcomingBills();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const [refreshing, setRefreshing] = useState(false);

  const upcomingBills = getUpcomingBills(7);
  const overdueBills = getOverdueBills();

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBills();
    setRefreshing(false);
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getAccountName = (accountId?: string) => {
    if (!accountId) return 'No Account';
    const account = accounts?.find(a => a.id === accountId);
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

  const getBillTypeIcon = (bill: UpcomingBill) => {
    if (bill.bill_type === 'transfer') {
      return 'bank-transfer';
    }
    return 'file-document-outline';
  };

  const getBillTypeColor = (bill: UpcomingBill) => {
    if (bill.bill_type === 'transfer') {
      return theme.colors.info;
    }
    return theme.colors.error;
  };

  const renderBillItem = ({ item }: { item: UpcomingBill }) => {
    const isOverdue = new Date(item.due_date) < new Date();
    const daysUntilDue = Math.ceil((new Date(item.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Pressable
        style={[
          {
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.m,
            padding: theme.spacing.m,
            marginHorizontal: theme.spacing.m,
            marginVertical: theme.spacing.s,
            borderLeftWidth: 4,
            borderLeftColor: isOverdue ? theme.colors.error : getBillTypeColor(item),
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
                backgroundColor: `${getBillTypeColor(item)}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.m,
              }}
            >
              <MaterialCommunityIcons
                name={getBillTypeIcon(item)}
                size={24}
                color={getBillTypeColor(item)}
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
                {getCategoryName(item.category_id)} • {getAccountName(item.account_id)}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: theme.typography.caption.fontSize,
                    color: isOverdue ? theme.colors.error : theme.colors.textTertiary,
                    fontWeight: isOverdue ? '600' : '400',
                  }}
                >
                  {isOverdue ? 'Overdue' : formatDate(item.due_date)}
                </Text>
                {!isOverdue && daysUntilDue <= 3 && (
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
                  color: theme.colors.info,
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

            {upcomingBills.length > 0 && (
              <>
                {renderSectionHeader('Due Soon', upcomingBills.length, theme.colors.warning)}
                {upcomingBills.map(bill => (
                  <View key={bill.id}>
                    {renderBillItem({ item: bill })}
                  </View>
                ))}
              </>
            )}

            {bills.filter(b => !overdueBills.includes(b) && !upcomingBills.includes(b)).length > 0 && (
              <>
                {renderSectionHeader('All Bills', bills.length, theme.colors.textTertiary)}
                {bills.filter(b => !overdueBills.includes(b) && !upcomingBills.includes(b)).map(bill => (
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