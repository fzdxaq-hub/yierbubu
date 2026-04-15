import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { assertDemoSeedAllowed, ensureDemoData, getDemoSeedMode, resetDemoData } from '../src/bootstrap/demo-data'

const prisma = new PrismaClient()
const shouldReset = process.env.SEED_RESET !== 'false'

async function main() {
  assertDemoSeedAllowed()

  console.log(`[seed] start with mode=${getDemoSeedMode()}`)

  if (shouldReset) {
    await resetDemoData(prisma)
  }

  await ensureDemoData(prisma)

  console.log('[seed] demo catalog and demo accounts are ready')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
