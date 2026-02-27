export const getNextDueDate = (currentDate: Date, frequency: string, interval: number = 1): Date => {
    const next = new Date(currentDate);

    if (frequency === 'daily') {
        next.setDate(next.getDate() + 1 * interval);
    } else if (frequency === 'weekly') {
        next.setDate(next.getDate() + 7 * interval);
    } else if (frequency === 'monthly') {
        next.setMonth(next.getMonth() + 1 * interval);
    } else if (frequency === 'quarterly') {
        next.setMonth(next.getMonth() + 3 * interval);
    } else if (frequency === 'yearly') {
        next.setFullYear(next.getFullYear() + 1 * interval);
    }

    return next;
};
