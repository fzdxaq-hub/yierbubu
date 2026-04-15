import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { ensureDemoData, getDemoSeedMode, isDemoSeedAllowed } from './demo-data'

type BootstrapLogger = Pick<Logger, 'error' | 'log' | 'warn'>

const apiRoot = resolve(__dirname, '..', '..')
const schemaPath = resolve(apiRoot, 'prisma', 'schema.prisma')

const isDisabled = (value?: string) => value === 'false' || value === '0'

const buildPrismaEnv = () => {
  const env = { ...process.env }

  if (!env.DIRECT_URL && env.DATABASE_URL) {
    env.DIRECT_URL = env.DATABASE_URL
  }

  return env
}

const logChunk = (chunk: Buffer, write: (message: string) => void) => {
  for (const line of chunk.toString('utf8').split(/\r?\n/)) {
    const message = line.trim()

    if (message) {
      write(message)
    }
  }
}

const runPrismaCli = (args: string[], logger: BootstrapLogger) =>
  new Promise<void>((resolvePromise, rejectPromise) => {
    const prismaCliPath = require.resolve('prisma/build/index.js')
    const child = spawn(process.execPath, [prismaCliPath, ...args], {
      cwd: apiRoot,
      env: buildPrismaEnv(),
      stdio: ['ignore', 'pipe', 'pipe']
    })

    child.stdout?.on('data', (chunk: Buffer) => logChunk(chunk, (message) => logger.log(`[prisma] ${message}`)))
    child.stderr?.on('data', (chunk: Buffer) => logChunk(chunk, (message) => logger.warn(`[prisma] ${message}`)))

    child.on('error', (error) => rejectPromise(error))
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(new Error(`Prisma command failed with exit code ${code}: ${args.join(' ')}`))
    })
  })

const runMigrations = async (logger: BootstrapLogger) => {
  if (!existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found at ${schemaPath}`)
  }

  logger.log('Ensuring database schema with prisma migrate deploy')
  await runPrismaCli(['migrate', 'deploy', '--schema', schemaPath], logger)
}

const runDemoSeed = async (logger: BootstrapLogger) => {
  if (isDisabled(process.env.DEMO_DATA_AUTO_SEED)) {
    logger.warn('Skipping demo data seed because DEMO_DATA_AUTO_SEED is disabled')
    return
  }

  if (!isDemoSeedAllowed()) {
    logger.warn(
      `Skipping demo data seed because SEED_MODE=${getDemoSeedMode()}. Set ALLOW_PRODUCTION_SEED=true for a demo deployment.`
    )
    return
  }

  const prisma = new PrismaClient()

  try {
    await ensureDemoData(prisma)
    logger.log('Demo data is ready')
  } finally {
    await prisma.$disconnect()
  }
}

export const prepareDatabase = async (logger: BootstrapLogger) => {
  if (isDisabled(process.env.DATABASE_AUTO_INIT)) {
    logger.warn('Skipping database auto init because DATABASE_AUTO_INIT is disabled')
    return
  }

  if (!isDisabled(process.env.DATABASE_AUTO_MIGRATE)) {
    await runMigrations(logger)
  }

  await runDemoSeed(logger)
}
