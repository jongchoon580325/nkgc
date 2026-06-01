const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding rules...')

    // 1. Seed Courtesy Rules (예우규칙)
    try {
        const courtesyPath = path.join(process.cwd(), 'public', 'text', '예우규칙자료실.txt')
        const courtesyText = fs.readFileSync(courtesyPath, 'utf8')

        // Simple formatting
        const formattedCourtesy = courtesyText
            .split('\n')
            .map(line => {
                const trimmed = line.trim()
                if (!trimmed) return ''
                if (trimmed.startsWith('제') && trimmed.includes('장')) return `<h2>${trimmed}</h2>`
                if (trimmed.startsWith('제') && trimmed.includes('조')) return `<h3>${trimmed}</h3>`
                return `<p>${trimmed}</p>`
            })
            .join('')

        await prisma.rule.upsert({
            where: { type: 'COURTESY' },
            update: { content: formattedCourtesy },
            create: { type: 'COURTESY', content: formattedCourtesy }
        })
        console.log('Seeded Courtesy Rules')
    } catch (error) {
        console.error('Error seeding Courtesy Rules:', error)
    }

    // 2. Seed Presbytery Rules (노회규칙)
    try {
        const presbyteryPath = path.join(process.cwd(), 'public', 'text', '2025_New_Rules_style.html')
        const presbyteryHtml = fs.readFileSync(presbyteryPath, 'utf8')

        // Extract text from spans (very basic extraction)
        // The HTML has structure like <span class="...">TEXT</span>
        const textMatches = presbyteryHtml.match(/<span[^>]*>(.*?)<\/span>/g) || []
        const extractedLines = textMatches.map(span => {
            return span.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
        }).filter(text => text.length > 0)

        // Format extracted text
        const formattedPresbytery = extractedLines
            .map(line => {
                if (line.startsWith('제') && line.includes('장')) return `<h2>${line}</h2>`
                if (line.startsWith('제') && line.includes('조')) return `<h3>${line}</h3>`
                return `<p>${line}</p>`
            })
            .join('')

        await prisma.rule.upsert({
            where: { type: 'PRESBYTERY' },
            update: { content: formattedPresbytery },
            create: { type: 'PRESBYTERY', content: formattedPresbytery }
        })
        console.log('Seeded Presbytery Rules')

    } catch (error) {
        console.error('Error seeding Presbytery Rules:', error)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
