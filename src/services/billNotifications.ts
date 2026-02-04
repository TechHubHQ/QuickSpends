import { supabase } from '../lib/supabase';

export const checkUpcomingBillNotifications = async () => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get bills due today or tomorrow that haven't been notified recently
    const { data: bills, error } = await supabase
      .from('upcoming_bills')
      .select('*')
      .eq('is_active', true)
      .or(`due_date.eq.${todayStr},due_date.eq.${tomorrowStr}`)
      .or('last_reminder_sent.is.null,last_reminder_sent.lt.' + todayStr);

    if (error) throw error;

    for (const bill of bills || []) {
      const dueDate = new Date(bill.due_date);
      const isToday = dueDate.toDateString() === today.toDateString();
      const isTomorrow = dueDate.toDateString() === tomorrow.toDateString();

      if (isToday || isTomorrow) {
        // Create notification
        await supabase.from('notifications').insert({
          user_id: bill.user_id,
          type: 'bill_reminder',
          title: isToday ? 'Bill Due Today!' : 'Bill Due Tomorrow',
          message: `${bill.name} - ₹${bill.amount} is due ${isToday ? 'today' : 'tomorrow'}`,
          data: { bill_id: bill.id, due_date: bill.due_date }
        });

        // Update last reminder sent
        await supabase
          .from('upcoming_bills')
          .update({ last_reminder_sent: today.toISOString() })
          .eq('id', bill.id);
      }
    }
  } catch (error) {
    console.error('Error checking bill notifications:', error);
  }
};