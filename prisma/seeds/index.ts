import { PrismaClient } from "@prisma/client"
import { seedAdmin } from "./seedAdmin"


 const prisma = new PrismaClient() // <-- ini prisma nya

async function seed() {
    await seedAdmin(prisma)
   
}

seed().then(()=>{
    console.log("ALL SEEDING DONE")
})