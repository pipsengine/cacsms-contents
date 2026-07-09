import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: 'cacsms-contents-web',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})
