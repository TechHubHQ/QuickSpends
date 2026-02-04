import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { QSButton } from '../src/components/QSButton';
import { QSBottomSheet } from '../src/components/QSBottomSheet';
import { QSDatePicker } from '../src/components/QSDatePicker';
import { QSHeader } from '../src/components/QSHeader';
import { useTheme } from '../src/theme/ThemeContext';
import { useUpcomingBills } from '../src/hooks/useUpcomingBills';
import { useCategories } from '../src/hooks/useCategories';
import { useAccounts } from '../src/hooks/useAccounts';
import { useAuth } from '../src/context/AuthContext';

const AddUpcomingBillScreen = () => {
  const { theme } = useTheme();
  const { addBill } = useUpcomingBills();
  const { getCategories } = useCategories();
  const { getAccountsByUser } = useAccounts();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category_id: '',
    sub_category_id: '',
    account_id: '',
    bill_type: 'expense' as 'transfer' | 'expense',
    to_account_id: '',
    due_date: new Date(),
    frequency: 'monthly' as 'once' | 'monthly' | 'quarterly' | 'yearly',
    description: '',
    auto_pay: false,
    reminder_days: 3,
  });

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubCategoryPicker, setShowSubCategoryPicker] = useState(false);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [formData.bill_type]);

  const fetchData = async () => {
    if (!user) return;
    const [cats, accs] = await Promise.all([
      getCategories(formData.bill_type === 'transfer' ? 'expense' : formData.bill_type),
      getAccountsByUser(user.id)
    ]);
    setCategoriesData(cats);
    setAccounts(accs);
  };

  const billCategories = categoriesData?.filter(c => !c.parent_id) || [];

  const frequencyOptions = [
    { id: 'once', name: 'One Time', icon: 'numeric-1-circle' },
    { id: 'monthly', name: 'Monthly', icon: 'calendar-month' },
    { id: 'quarterly', name: 'Quarterly', icon: 'calendar-range' },
    { id: 'yearly', name: 'Yearly', icon: 'calendar' },
  ];

  const getCategoryName = (categoryId: string) => {
    const category = categoriesData?.find(c => c.id === categoryId);
    const subCategory = categoriesData?.find(c => c.id === formData.sub_category_id);
    if (subCategory && category) {
      return `${category.name} > ${subCategory.name}`;
    }
    return category?.name || 'Select Category';
  };

  const getAccountName = (accountId: string) => {
    const account = accounts?.find(a => a.id === accountId);
    return account?.name || 'Select Account';
  };

  const getFrequencyName = (frequency: string) => {
    const option = frequencyOptions.find(f => f.id === frequency);
    return option?.name || 'Select Frequency';
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a bill name');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!formData.account_id) {
      Alert.alert('Error', 'Please select an account');
      return;
    }

    if (formData.bill_type === 'transfer' && !formData.to_account_id) {
      Alert.alert('Error', 'Please select a destination account for transfer');
      return;
    }

    setLoading(true);
    try {
      await addBill({
        ...formData,
        category_id: formData.sub_category_id || formData.category_id,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date.toISOString(),
        next_due_date: formData.frequency !== 'once' ? formData.due_date.toISOString() : undefined,
        is_active: true,
      });

      Alert.alert('Success', 'Bill added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (
    label: string,
    value: string,
    onPress: () => void,
    icon: string,
    placeholder: string = 'Select...'
  ) => (
    <View style={{ marginBottom: theme.spacing.m }}>
      <Text
        style={{
          fontSize: theme.typography.bodySmall.fontSize,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: theme.spacing.s,
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.m,
            padding: theme.spacing.m,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
          },
          theme.shadows.small,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={theme.colors.iconSecondary}
          style={{ marginRight: theme.spacing.m }}
        />
        <Text
          style={{
            flex: 1,
            fontSize: theme.typography.body.fontSize,
            color: value ? theme.colors.text : theme.colors.textTertiary,
          }}
        >
          {value || placeholder}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={theme.colors.iconSecondary}
        />
      </Pressable>
    </View>
  );

  const renderTextInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: any = 'default',
    multiline: boolean = false
  ) => (
    <View style={{ marginBottom: theme.spacing.m }}>
      <Text
        style={{
          fontSize: theme.typography.bodySmall.fontSize,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: theme.spacing.s,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.m,
            padding: theme.spacing.m,
            fontSize: theme.typography.body.fontSize,
            color: theme.colors.text,
            borderWidth: 1,
            borderColor: theme.colors.border,
            minHeight: multiline ? 80 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          theme.shadows.small,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );

  const renderBillTypeToggle = () => (
    <View style={{ marginBottom: theme.spacing.m }}>
      <Text
        style={{
          fontSize: theme.typography.bodySmall.fontSize,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: theme.spacing.s,
        }}
      >
        Bill Type
      </Text>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.m,
          padding: 4,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        {[
          { id: 'expense', name: 'Expense', icon: 'file-document-outline' },
          { id: 'transfer', name: 'Transfer', icon: 'bank-transfer' },
        ].map((type) => (
          <Pressable
            key={type.id}
            onPress={() => setFormData(prev => ({ ...prev, bill_type: type.id as any }))}
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: theme.spacing.s,
                borderRadius: theme.borderRadius.s,
              },
              formData.bill_type === type.id && {
                backgroundColor: theme.colors.primary,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={type.icon}
              size={18}
              color={formData.bill_type === type.id ? theme.colors.onPrimary : theme.colors.textSecondary}
              style={{ marginRight: theme.spacing.s }}
            />
            <Text
              style={{
                fontSize: theme.typography.bodySmall.fontSize,
                fontWeight: '500',
                color: formData.bill_type === type.id ? theme.colors.onPrimary : theme.colors.textSecondary,
              }}
            >
              {type.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <QSHeader
        title="Add Upcoming Bill"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.m }}
        showsVerticalScrollIndicator={false}
      >
        {renderTextInput(
          'Bill Name',
          formData.name,
          (text) => setFormData(prev => ({ ...prev, name: text })),
          'e.g., Credit Card Payment, Netflix Subscription'
        )}

        {renderTextInput(
          'Amount',
          formData.amount,
          (text) => setFormData(prev => ({ ...prev, amount: text })),
          '0.00',
          'numeric'
        )}

        {renderBillTypeToggle()}

        {renderFormField(
          'Category',
          getCategoryName(formData.category_id),
          () => setShowCategoryPicker(true),
          'tag',
          'Select Category'
        )}

        {renderFormField(
          'From Account',
          getAccountName(formData.account_id),
          () => setShowAccountPicker(true),
          'bank',
          'Select Account'
        )}

        {formData.bill_type === 'transfer' && renderFormField(
          'To Account',
          getAccountName(formData.to_account_id),
          () => setShowToAccountPicker(true),
          'bank-transfer-in',
          'Select Destination Account'
        )}

        {renderFormField(
          'Due Date',
          formData.due_date.toLocaleDateString(),
          () => setShowDatePicker(true),
          'calendar',
          'Select Date'
        )}

        {renderFormField(
          'Frequency',
          getFrequencyName(formData.frequency),
          () => setShowFrequencyPicker(true),
          'repeat',
          'Select Frequency'
        )}

        {formData.frequency !== 'once' && renderFormField(
          'Bill Date',
          `${formData.due_date.getDate()}${getOrdinalSuffix(formData.due_date.getDate())} of every ${formData.frequency === 'monthly' ? 'month' : formData.frequency === 'quarterly' ? 'quarter' : 'year'}`,
          () => setShowDatePicker(true),
          'calendar-month',
          'Select Bill Date'
        )}

        {renderTextInput(
          'Description (Optional)',
          formData.description,
          (text) => setFormData(prev => ({ ...prev, description: text })),
          'Add notes about this bill...',
          'default',
          true
        )}

        <View style={{ marginTop: theme.spacing.l, marginBottom: theme.spacing.xl }}>
          <QSButton
            title="Add Bill"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      </ScrollView>

      {/* Category Picker */}
      <QSBottomSheet
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Select Category"
      >
        {billCategories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => {
              setFormData(prev => ({ ...prev, category_id: category.id, sub_category_id: '' }));
              setShowCategoryPicker(false);
              const hasSubCategories = categoriesData.some(c => c.parent_id === category.id);
              if (hasSubCategories) {
                setTimeout(() => setShowSubCategoryPicker(true), 300);
              }
            }}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                padding: theme.spacing.m,
                borderRadius: theme.borderRadius.s,
              },
              formData.category_id === category.id && {
                backgroundColor: `${theme.colors.primary}20`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={category.icon || 'tag'}
              size={24}
              color={category.color || theme.colors.primary}
              style={{ marginRight: theme.spacing.m }}
            />
            <Text
              style={{
                fontSize: theme.typography.body.fontSize,
                color: theme.colors.text,
                fontWeight: formData.category_id === category.id ? '600' : '400',
              }}
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </QSBottomSheet>

      {/* Account Picker */}
      <QSBottomSheet
        visible={showAccountPicker}
        onClose={() => setShowAccountPicker(false)}
        title="Select Account"
      >
        {accounts?.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => {
              setFormData(prev => ({ ...prev, account_id: account.id }));
              setShowAccountPicker(false);
            }}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                padding: theme.spacing.m,
                borderRadius: theme.borderRadius.s,
              },
              formData.account_id === account.id && {
                backgroundColor: `${theme.colors.primary}20`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={account.type === 'bank' ? 'bank' : account.type === 'card' ? 'credit-card' : 'wallet'}
              size={24}
              color={theme.colors.primary}
              style={{ marginRight: theme.spacing.m }}
            />
            <Text
              style={{
                fontSize: theme.typography.body.fontSize,
                color: theme.colors.text,
                fontWeight: formData.account_id === account.id ? '600' : '400',
              }}
            >
              {account.name}
            </Text>
          </Pressable>
        ))}
      </QSBottomSheet>

      {/* To Account Picker */}
      <QSBottomSheet
        visible={showToAccountPicker}
        onClose={() => setShowToAccountPicker(false)}
        title="Select Destination Account"
      >
        {accounts?.filter(a => a.id !== formData.account_id).map((account) => (
          <Pressable
            key={account.id}
            onPress={() => {
              setFormData(prev => ({ ...prev, to_account_id: account.id }));
              setShowToAccountPicker(false);
            }}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                padding: theme.spacing.m,
                borderRadius: theme.borderRadius.s,
              },
              formData.to_account_id === account.id && {
                backgroundColor: `${theme.colors.primary}20`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={account.type === 'bank' ? 'bank' : account.type === 'card' ? 'credit-card' : 'wallet'}
              size={24}
              color={theme.colors.primary}
              style={{ marginRight: theme.spacing.m }}
            />
            <Text
              style={{
                fontSize: theme.typography.body.fontSize,
                color: theme.colors.text,
                fontWeight: formData.to_account_id === account.id ? '600' : '400',
              }}
            >
              {account.name}
            </Text>
          </Pressable>
        ))}
      </QSBottomSheet>

      {/* Frequency Picker */}
      <QSBottomSheet
        visible={showFrequencyPicker}
        onClose={() => setShowFrequencyPicker(false)}
        title="Select Frequency"
      >
        {frequencyOptions.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => {
              setFormData(prev => ({ ...prev, frequency: option.id as any }));
              setShowFrequencyPicker(false);
            }}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                padding: theme.spacing.m,
                borderRadius: theme.borderRadius.s,
              },
              formData.frequency === option.id && {
                backgroundColor: `${theme.colors.primary}20`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={option.icon}
              size={24}
              color={theme.colors.primary}
              style={{ marginRight: theme.spacing.m }}
            />
            <Text
              style={{
                fontSize: theme.typography.body.fontSize,
                color: theme.colors.text,
                fontWeight: formData.frequency === option.id ? '600' : '400',
              }}
            >
              {option.name}
            </Text>
          </Pressable>
        ))}
      </QSBottomSheet>

      {/* Date Picker */}
      <QSDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={formData.due_date}
        onSelect={(date) => {
          setFormData(prev => ({ ...prev, due_date: date }));
          setShowDatePicker(false);
        }}
      />

      {/* Sub Category Picker */}
      <QSBottomSheet
        visible={showSubCategoryPicker}
        onClose={() => setShowSubCategoryPicker(false)}
        title="Select Subcategory"
      >
        {categoriesData?.filter(c => c.parent_id === formData.category_id).map((subCategory) => (
          <Pressable
            key={subCategory.id}
            onPress={() => {
              setFormData(prev => ({ ...prev, sub_category_id: subCategory.id }));
              setShowSubCategoryPicker(false);
            }}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                padding: theme.spacing.m,
                borderRadius: theme.borderRadius.s,
              },
              formData.sub_category_id === subCategory.id && {
                backgroundColor: `${theme.colors.primary}20`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={subCategory.icon || 'tag'}
              size={24}
              color={subCategory.color || theme.colors.primary}
              style={{ marginRight: theme.spacing.m }}
            />
            <Text
              style={{
                fontSize: theme.typography.body.fontSize,
                color: theme.colors.text,
                fontWeight: formData.sub_category_id === subCategory.id ? '600' : '400',
              }}
            >
              {subCategory.name}
            </Text>
          </Pressable>
        ))}
      </QSBottomSheet>
    </View>
  );
};

export default AddUpcomingBillScreen;