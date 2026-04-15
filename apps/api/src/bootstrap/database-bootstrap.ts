import { Logger } from '@nestjs/common'

type BootstrapLogger = Pick<Logger, 'log'>

export const prepareDatabase = async (logger: BootstrapLogger) => {
  logger.log('Database startup initialization is disabled')
}
