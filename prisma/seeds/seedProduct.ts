import { PrismaClient } from '@prisma/client'

export async function seedProducts(prisma: PrismaClient) {
  const totalProducts = await prisma.product.count()

  if (totalProducts > 0) {
    console.log("ℹ️ Products already seeded, skipping")
    return
  }

  const now = Math.floor(Date.now() / 1000) // current unix timestamp (seconds)
  
  // generate 20 dummy products
  const products = Array.from({ length: 20 }).map((_, index) => {
    return {
      name: `Product ${index + 1}`,
      description: `Description for product ${index + 1}`,
      price: Math.floor(Math.random() * 500000) + 10000, // random price 10k - 500k
      stock: Math.floor(Math.random() * 100), // random stock
      createdAt: now // store same month timestamp
    }
  })

  await prisma.product.createMany({ data: products })

  console.log("✅ 20 Products seeded successfully")
}
