'use server'

import prisma from "@/lib/prisma";

export async function getUserVoteCount(visitorId: string) {
  if (!visitorId) return 0;

  try {
    const count = await prisma.vote.count({
      where: {
        visitorId: visitorId
      }
    });

    return count;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return 0;
  }
}

