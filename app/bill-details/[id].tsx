import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { QSButton } from '../../src/components/QSButton';
import { QSHeader } from '../../src/components/QSHeader';
import { useAlert } from '../../src/context/AlertContext';
import { useAuth } from '../../src/context/AuthContext';
import { useAccounts, type Account } from '../../src/hooks/useAccounts';
import { useCategories } from '../../src/hooks/useCategories';
import { useTransactions } from '../../src/hooks/useTransactions';
import { UpcomingBill, useUpcomingBills } from '../../src/hooks/useUpcomingBills';
import { useTheme } from '../../src/theme/ThemeContext';
import { getSafeIconName } from '../../src/utils/iconMapping';

const BillDetailsScreen = () => {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bills, updateBill, deleteBill, markAsPaid } = useUpcomingBills();
  const { addTransaction } = useTransactions();
  const { categories } = useCategories();
  const { getAccountsByUser } = useAccounts();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [bill, setBill] = useState<UpcomingBill | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const foundBill = bills.find(b => b.id === id);
    if (foundBill) {
      setBill(foundBill);
    }
  }, [bills, id]);

  useEffect(() => {
    const loadAccounts = async () => {
      if (!user) return;
      const data = await getAccountsByUser(user.id);
      setAccounts(data);
    };

    loadAccounts();
  }, [user, getAccountsByUser]);

  if (!bill) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <QSHeader
          title="Bill Details"
          showBack
          onBackPress={() => router.back()}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.textSecondary }}>Bill not found</Text>
        </View>
      </View>
    );
  }

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getBillCategory = (currentBill: UpcomingBill) => {
    if (!categories || categories.length === 0) return undefined;
    const subCategory = currentBill.sub_category_id
      ? categories.find(c => c.id === currentBill.sub_category_id)
      : undefined;
    if (subCategory) return subCategory;
    return currentBill.category_id
      ? categories.find(c => c.id === currentBill.category_id)
      : undefined;
  };

  const getAccountName = (accountId?: string) => {
    if (!accountId) return 'No Account';
    if (!accounts || accounts.length === 0) return 'Loading...';
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFrequencyText = (frequency: string) => {
    const map = {
      once: 'One Time',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    };
    return map[frequency as keyof typeof map] || frequency;
  };

  const isOverdue = new Date(bill.due_date) < new Date();
  const daysUntilDue = Math.ceil((new Date(bill.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      await updateBill(bill.id, { is_active: !bill.is_active });
      setBill(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update bill status',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!bill) return;
    setLoading(true);
    try {
      const result = await markAsPaid(bill);
      if (result) {
        // Create the actual transaction
        await addTransaction(result.transactionData);
        setBill(result.updatedBill);
        Toast.show({
          type: 'success',
          text1: 'Bill Paid',
          text2: bill.frequency === 'once'
            ? 'Bill marked as completed.'
            : 'Bill marked as paid and next due date updated.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to mark bill as paid',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert(
      'Delete Bill',
      'Are you sure you want to delete this bill? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBill(bill.id);
              router.back();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete bill',
              });
            }
          },
        },
      ]
    );
  };

  const renderInfoCard = (title: string, value: string, icon: string, color?: string) => (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.m,
          padding: theme.spacing.m,
          marginBottom: theme.spacing.m,
          flexDirection: 'row',
          alignItems: 'center',
        },
        theme.shadows.small,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.borderRadius.s,
          backgroundColor: `${color || theme.colors.primary}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing.m,
        }}
      >
        <MaterialCommunityIcons
          name={getSafeIconName(icon)}
          size={20}
          color={color || theme.colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: theme.typography.caption.fontSize,
            color: theme.colors.textSecondary,
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.body.fontSize,
            fontWeight: '600',
            color: theme.colors.text,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <QSHeader
        title="Bill Details"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.m }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View
          style={[
            {
              backgroundColor: theme.colors.card,
              borderRadius: theme.borderRadius.l,
              padding: theme.spacing.l,
              marginBottom: theme.spacing.l,
              alignItems: 'center',
            },
            theme.shadows.medium,
          ]}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${isOverdue ? theme.colors.error : theme.colors.primary}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.m,
            }}
          >
            <MaterialCommunityIcons
              name={getSafeIconName(
                getBillCategory(bill)?.icon ||
                (bill.bill_type === 'transfer'
                  ? 'bank-transfer'
                  : 'file-document-outline')
              )}
              size={40}
              color={isOverdue ? theme.colors.error : theme.colors.primary}
            />
          </View>

          <Text
            style={{
              fontSize: theme.typography.h2.fontSize,
              fontWeight: theme.typography.h2.fontWeight,
              color: theme.colors.text,
              textAlign: 'center',
              marginBottom: theme.spacing.s,
            }}
          >
            {bill.name}
          </Text>

          <Text
            style={{
              fontSize: theme.typography.h3.fontSize,
              fontWeight: '700',
              color: theme.colors.primary,
              marginBottom: theme.spacing.s,
            }}
          >
            ₹{bill.amount.toLocaleString()}
          </Text>

          <View
            style={{
              backgroundColor: isOverdue ? theme.colors.error : daysUntilDue <= 3 ? theme.colors.warning : theme.colors.success,
              borderRadius: theme.borderRadius.round,
              paddingHorizontal: theme.spacing.m,
              paddingVertical: theme.spacing.s,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.caption.fontSize,
                fontWeight: '600',
                color: theme.colors.onPrimary,
                textTransform: 'uppercase',
              }}
            >
              {isOverdue ? 'Overdue' : daysUntilDue <= 3 ? 'Due Soon' : 'Upcoming'}
            </Text>
          </View>

          {!bill.is_active && (
            <View
              style={{
                backgroundColor: theme.colors.textTertiary,
                borderRadius: theme.borderRadius.round,
                paddingHorizontal: theme.spacing.m,
                paddingVertical: theme.spacing.s,
                marginTop: theme.spacing.s,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.caption.fontSize,
                  fontWeight: '600',
                  color: theme.colors.onPrimary,
                  textTransform: 'uppercase',
                }}
              >
                Inactive
              </Text>
            </View>
          )}
        </View>

        {/* Bill Information */}
        {renderInfoCard('Due Date', formatDate(bill.due_date), 'calendar', isOverdue ? theme.colors.error : theme.colors.primary)}
        {renderInfoCard('Frequency', getFrequencyText(bill.frequency), 'repeat')}
        {renderInfoCard('Category', getCategoryName(bill.sub_category_id || bill.category_id), 'tag')}
        {renderInfoCard('From Account', getAccountName(bill.account_id), 'bank')}

        {bill.bill_type === 'transfer' && bill.to_account_id &&
          renderInfoCard('To Account', getAccountName(bill.to_account_id), 'bank-transfer-in', theme.colors.info)
        }

        {bill.description && (
          <View
            style={[
              {
                backgroundColor: theme.colors.card,
                borderRadius: theme.borderRadius.m,
                padding: theme.spacing.m,
                marginBottom: theme.spacing.m,
              },
              theme.shadows.small,
            ]}
          >
            <Text
              style={{
                fontSize: theme.typography.caption.fontSize,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.s,
              }}
            >
              Description
            </Text>
            <Text
              style={{
                fontSize: theme.typography.body.fontSize,
                color: theme.colors.text,
                lineHeight: 22,
              }}
            >
              {bill.description}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ marginTop: theme.spacing.l }}>
          {bill.is_active && (
            <QSButton
              title="Mark as Paid"
              onPress={handleMarkAsPaid}
              loading={loading}
              style={{ marginBottom: theme.spacing.m }}
            />
          )}

          <QSButton
            title={bill.is_active ? 'Deactivate Bill' : 'Activate Bill'}
            onPress={handleToggleActive}
            variant={bill.is_active ? "secondary" : "primary"}
            loading={loading}
            style={{ marginBottom: theme.spacing.m }}
          />

          <Pressable
            onPress={handleDelete}
            style={[
              {
                backgroundColor: `${theme.colors.error}20`,
                borderRadius: theme.borderRadius.m,
                padding: theme.spacing.m,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              },
              theme.shadows.small,
            ]}
          >
            <MaterialCommunityIcons
              name="delete"
              size={20}
              color={theme.colors.error}
              style={{ marginRight: theme.spacing.s }}
            />
            <Text
              style={{
                fontSize: theme.typography.button.fontSize,
                fontWeight: theme.typography.button.fontWeight,
                color: theme.colors.error,
              }}
            >
              Delete Bill
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default BillDetailsScreen;
