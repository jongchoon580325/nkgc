const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Checking Rule table...')
    const rules = await prisma.rule.findMany()
    console.log('Found rules:', rules.length)
    rules.forEach(r => {
        console.log(`[${r.id}] Type: "${r.type}", Length: ${r.content.length}, Updated: ${r.updatedAt}`)
        console.log(`Content Preview: ${r.content.substring(0, 100)}...`)
        console.log('---')
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
