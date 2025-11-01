import { PrismaClient } from "@prisma/client"
// import { seedAdmin } from "./seedAdmin"
import { seedProducts } from "./seedProduct"


 const prisma = new PrismaClient() // <-- ini prisma nya

async function seed() {
    // await seedAdmin(prisma)
   await seedProducts(prisma)
}

seed().then(()=>{
    console.log("ALL SEEDING DONE")
})