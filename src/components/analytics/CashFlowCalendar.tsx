import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format as dateFnsFormat } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency } from "../../utils/format";

interface DayData {
  income: number;
  expense: number;
}

interface CashFlowCalendarProps {
  monthData: { date: string; fullDate: string; income: number; expense: number }[];
  loading?: boolean;
  onMonthChange: (year: number, month: number) => void;
  onDayPress: (fullDate: string) => void;
}

export const CashFlowCalendar = ({
  monthData,
  loading,
  onMonthChange,
  onDayPress,
}: CashFlowCalendarProps) => {
  const { theme } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const dataMap = useMemo(() => {
    const map: Record<string, DayData> = {};
    for (const d of monthData) {
      const key = dateFnsFormat(new Date(d.fullDate), "yyyy-MM-dd");
      if (d.income > 0 || d.expense > 0) {
        map[key] = { income: d.income, expense: d.expense };
      }
    }
    return map;
  }, [monthData]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const d of monthData) {
      income += d.income;
      expense += d.expense;
    }
    return { income, expense, net: income - expense };
  }, [monthData]);

  useEffect(() => {
    onMonthChange(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
    );
  }, [currentMonth]);

  const goToPrevMonth = () =>
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );

  const goToNextMonth = () =>
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );

  const monthLabel = dateFnsFormat(currentMonth, "MMMM yyyy");

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    for (const key of Object.keys(dataMap)) {
      marks[key] = { marked: true };
    }
    return marks;
  }, [dataMap]);

  const renderDay = useCallback(
    ({ date, state }: { date: DateData; state?: string }) => {
      const data = dataMap[date.dateString];
      const isToday = state === "today";
      const isDisabled = state === "disabled";

      return (
        <Pressable
          onPress={() => {
            if (!isDisabled && data) {
              const d = new Date(date.year, date.month - 1, date.day);
              onDayPress(d.toISOString());
            }
          }}
          style={{
            width: "100%",
            aspectRatio: 1,
            justifyContent: "flex-start",
            alignItems: "center",
            paddingTop: 2,
            opacity: isDisabled ? 0.3 : 1,
            backgroundColor: isToday ? theme.colors.primary + "12" : "transparent",
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: isToday ? "800" : "600",
              color: isToday ? theme.colors.primary : theme.colors.text,
              marginBottom: 1,
            }}
          >
            {date.day}
          </Text>
          {data && (
            <View style={{ alignItems: "center", gap: 0 }}>
              {data.income > 0 && (
                <Text
                  style={{
                    fontSize: 8,
                    fontWeight: "700",
                    color: theme.colors.success,
                    lineHeight: 10,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  +{formatCurrency(data.income)}
                </Text>
              )}
              {data.expense > 0 && (
                <Text
                  style={{
                    fontSize: 8,
                    fontWeight: "700",
                    color: theme.colors.error,
                    lineHeight: 10,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  -{formatCurrency(data.expense)}
                </Text>
              )}
            </View>
          )}
        </Pressable>
      );
    },
    [dataMap, theme, onDayPress],
  );

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 24,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: `${theme.colors.border}60`,
        ...theme.shadows?.small,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: theme.colors.text,
          }}
        >
          Calendar
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Pressable
            onPress={goToPrevMonth}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 6,
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: 8,
            })}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={20}
              color={theme.colors.text}
            />
          </Pressable>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: theme.colors.text,
              minWidth: 140,
              textAlign: "center",
            }}
          >
            {monthLabel}
          </Text>

          <Pressable
            onPress={goToNextMonth}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 6,
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: 8,
            })}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.text}
            />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={{ height: 260, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <Calendar
          current={dateFnsFormat(currentMonth, "yyyy-MM-dd")}
          hideExtraDays
          hideArrows
          disableMonthChange
          showSixWeeks={false}
          firstDay={1}
          markedDates={markedDates}
          dayComponent={renderDay}
          theme={{
            backgroundColor: "transparent",
            calendarBackground: "transparent",
            weekVerticalMargin: 0,
            todayTextColor: theme.colors.primary,
            "stylesheet.calendar.header": {
              week: {
                flexDirection: "row",
                justifyContent: "space-around",
                marginBottom: 4,
                paddingHorizontal: 0,
              },
              dayHeader: {
                fontSize: 11,
                fontWeight: "700",
                color: theme.colors.textSecondary,
                textTransform: "uppercase",
                width: 36,
                textAlign: "center",
              },
            },
          }}
        />
      )}

      {/* Legend */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border + "40",
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: theme.colors.success,
          }}
        >
          Income: {formatCurrency(totals.income)}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: theme.colors.error,
          }}
        >
          Expense: {formatCurrency(totals.expense)}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: totals.net >= 0 ? theme.colors.success : theme.colors.error,
          }}
        >
          Net: {formatCurrency(totals.net)}
        </Text>
      </View>
    </View>
  );
};
