import * as os from 'os';

const cores = os.cpus();
const workers = ( ( 0 < cores.length ) ? cores.length : 1 );

export const config = {
	APP: {
		ip: '127.0.0.1',
		port: 8001,
		logpath: './log',
		minWorkers: workers,
		maxWorkers: workers
	},
	BCRYPT: {
		rounds: 10
	}
};
