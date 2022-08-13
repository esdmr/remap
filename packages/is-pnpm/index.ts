import process from 'process';

const isPnpm = Boolean(process.env.npm_config_user_agent?.startsWith('pnpm/'));

export default isPnpm;
