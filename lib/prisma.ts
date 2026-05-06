import { PrismaClient } from "./generated/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import path from "path"

const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL as string;
  
  if (url?.startsWith("file:")) {
    const relativePath = url.replace("file:", "");
    const absolutePath = path.resolve(process.cwd(), relativePath);
    url = `file:///${absolutePath.replace(/\\/g, "/")}`;
  }

  console.log("[PRISMA] Initializing LibSQL adapter with URL:", url);
  
  if (!url) {
    throw new Error("DATABASE_URL is not defined");
  }

  // In Prisma 7, the adapter takes the CONFIG object, not the client
  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({ adapter })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma
