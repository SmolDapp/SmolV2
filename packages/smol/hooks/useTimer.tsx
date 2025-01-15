import dayjs, {extend} from 'dayjs';
import dayjsDuration from 'dayjs/plugin/duration.js';

extend(dayjsDuration);

export function formatSeconds(numberOfSeconds: number): string {
	const duration = dayjs.duration(numberOfSeconds, 'seconds');
	const days = duration.days();
	const hours = duration.hours();
	const minutes = duration.minutes();
	const seconds = duration.seconds();
	return `${days ? `${days}d ` : ''}${hours ? `${hours}h ` : ''} ${minutes}m ${seconds}s`;
}
