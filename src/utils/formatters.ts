import { format, formatDistanceToNow } from 'date-fns';

export const formatTimeAgo = (dateString: string | null) => {
  if (!dateString) return 'Never';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (e) {
    return 'Invalid date';
  }
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    return 'Invalid date';
  }
};

export const formatFullDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  } catch (e) {
    return 'Invalid date';
  }
};
